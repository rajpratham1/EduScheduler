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
            raise HTTPException(status_code=401, detail="Invalid token: Email not found.")

        user_ref = db.collection('users').document(email)
        user_doc = user_ref.get()

        # Case 1: User is the designated Admin
        if email == settings.ADMIN_EMAIL:
            if not user_doc.exists:
                # First login for Admin, create their record
                user_data = {
                    "email": email, "role": "admin", "is_approved": True, "status": "approved",
                    "display_name": decoded_token.get("name", "Admin"),
                    "photo_url": decoded_token.get("picture", ""), "created_at": datetime.utcnow()
                }
                user_ref.set(user_data)
            else:
                # Ensure existing admin record is correct
                user_data = user_doc.to_dict()
                if user_data.get('role') != 'admin' or not user_data.get('is_approved'):
                    user_ref.update({"role": "admin", "is_approved": True, "status": "approved"})
            
            user_role = "admin"

        # Case 2: User already exists in the database
        elif user_doc.exists:
            user_data = user_doc.to_dict()
            if user_data.get("status") == 'pending':
                raise HTTPException(status_code=403, detail="ACCOUNT_PENDING_APPROVAL")
            if user_data.get("status") == 'rejected':
                raise HTTPException(status_code=403, detail="ACCOUNT_REJECTED")
            if not user_data.get("is_approved"):
                 raise HTTPException(status_code=403, detail="ACCOUNT_NOT_APPROVED")
            
            user_role = user_data.get("role", "student")

        # Case 3: New user is a Student signing up
        else:
            if not request.admin_id:
                raise HTTPException(status_code=400, detail="NEW_STUDENT_MISSING_ADMIN_ID")
            
            # Here you might want to validate the admin_id against an 'admins' collection if needed

            user_data = {
                "email": email, "role": "student", "is_approved": False, "status": "pending",
                "admin_id": request.admin_id,
                "display_name": decoded_token.get("name", ""),
                "photo_url": decoded_token.get("picture", ""), "created_at": datetime.utcnow()
            }
            user_ref.set(user_data)
            raise HTTPException(status_code=403, detail="ACCOUNT_PENDING_APPROVAL")

        # If we reach here, the user is valid and approved. Generate token.
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": email, "role": user_role}
        expire = datetime.utcnow() + access_token_expires
        to_encode.update({"exp": expire})
        access_token = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)

        return {"access_token": access_token, "token_type": "bearer"}

    except auth.InvalidIdTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase ID token: {e}")
    except HTTPException as e:
        raise e # Re-raise custom HTTP exceptions
    except Exception as e:
        # Log the error for debugging
        print(f"Unexpected error in login_google: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during login.")
