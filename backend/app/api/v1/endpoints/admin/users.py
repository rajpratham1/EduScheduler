from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.schemas.user import UserInDB
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

@router.get("/pending", response_model=List[UserInDB])
async def get_pending_users(_: dict = Depends(get_current_admin_user)):
    pending_users = []
    users_stream = db.collection('users').where('is_approved', '==', False).stream()
    for user in users_stream:
        pending_users.append(UserInDB(id=user.id, **user.to_dict()))
    return pending_users

@router.post("/approve/{user_email}", response_model=UserInDB)
async def approve_user(user_email: str, _: dict = Depends(get_current_admin_user)):
    user_ref = db.collection('users').document(user_email)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_ref.update({'is_approved': True})
    updated_user = user_ref.get()
    return UserInDB(id=updated_user.id, **updated_user.to_dict())

@router.post("/disapprove/{user_email}", response_model=UserInDB)
async def disapprove_user(user_email: str, _: dict = Depends(get_current_admin_user)):
    user_ref = db.collection('users').document(user_email)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_ref.update({'is_approved': False})
    updated_user = user_ref.get()
    return UserInDB(id=updated_user.id, **updated_user.to_dict())

@router.put("/role/{user_email}", response_model=UserInDB)
async def change_user_role(user_email: str, new_role: str, _: dict = Depends(get_current_admin_user)):
    if new_role not in ["admin", "faculty", "student"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    user_ref = db.collection('users').document(user_email)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_ref.update({'role': new_role})
    updated_user = user_ref.get()
    return UserInDB(id=updated_user.id, **updated_user.to_dict())
