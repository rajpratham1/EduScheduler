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

        user_ref = db.collection('users').document(email)
        user_doc = user_ref.get()

        if not user_doc.exists:
            # New user, create document with default role and unapproved status
            user_data = {
                "email": email,
                "role": "student", # Default role for new sign-ups
                "is_approved": False,
                "display_name": decoded_token.get("name"),
                "photo_url": decoded_token.get("picture"),
            }
            user_ref.set(user_data)
            raise HTTPException(status_code=403, detail="Account pending approval. Please contact an administrator.")
        else:
            user_data = user_doc.to_dict()
            if not user_data.get("is_approved", False):
                raise HTTPException(status_code=403, detail="Account pending approval. Please contact an administrator.")
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend error during Google login: {e}")
