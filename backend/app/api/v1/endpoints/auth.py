from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta

from app.schemas.auth import Token, GoogleLoginRequest, TokenData
from app.core.config import settings
from firebase_admin import auth, firestore
from app.core.dependencies import get_db

router = APIRouter()

@router.post("/login/google", response_model=Token)
async def login_google(request: GoogleLoginRequest, db: firestore.Client = Depends(get_db)):
    try:
        decoded_token = auth.verify_id_token(request.token)
        email = decoded_token.get("email")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not found in token.")

        user_ref = db.collection('users').document(email)
        user_doc = user_ref.get()
        
        is_admin_by_email = (email == settings.ADMIN_EMAIL)

        if not user_doc.exists:
            # New user
            user_role = "admin" if is_admin_by_email else "student"
            user_data = {
                "email": email,
                "role": user_role,
                "is_approved": True,  # Auto-approve new users
                "display_name": decoded_token.get("name", ""),
                "photo_url": decoded_token.get("picture", ""),
                "created_at": datetime.utcnow(),
            }
            user_ref.set(user_data)
        else:
            # Existing user
            user_data = user_doc.to_dict()
            update_needed = False
            
            # Ensure admin role and approval status for the admin user
            if is_admin_by_email:
                if user_data.get('role') != 'admin':
                    user_data['role'] = 'admin'
                    update_needed = True
                if not user_data.get('is_approved'):
                    user_data['is_approved'] = True
                    update_needed = True

            # If user was created before approval logic, approve them now
            if 'is_approved' not in user_data:
                user_data['is_approved'] = True
                update_needed = True

            if update_needed:
                user_ref.update(user_data)

            if not user_data.get("is_approved"):
                raise HTTPException(status_code=403, detail="Account is not approved. Please contact an administrator.")
        
        user_role = user_data.get("role")

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": email, "role": user_role}
        expire = datetime.utcnow() + access_token_expires
        to_encode.update({"exp": expire})
        access_token = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)

        return {"access_token": access_token, "token_type": "bearer"}

    except auth.InvalidIdTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase ID token: {e}")
    except HTTPException as e:
        # Re-raise HTTPException directly to preserve status code
        raise e
    except Exception as e:
        # Catch any other unexpected errors
        # Log the error for debugging if you have a logger configured
        # print(f"Unexpected error in login_google: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during login.")
