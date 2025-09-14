from fastapi import APIRouter, Depends, HTTPException
from typing import List
from firebase_admin import firestore

from app.core.dependencies import get_db, get_current_admin_user
from app.schemas.user import UserInDB # Using UserInDB to represent user data from the database

router = APIRouter()

@router.get("/pending", response_model=List[UserInDB])
async def get_pending_users(
    db: firestore.Client = Depends(get_db),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """
    Get all users with a 'pending' status.
    """
    try:
        pending_users_ref = db.collection('users').where('status', '==', 'pending')
        docs = pending_users_ref.stream()
        
        pending_users = []
        for doc in docs:
            user_data = doc.to_dict()
            user_data['id'] = doc.id
            pending_users.append(UserInDB(**user_data))
            
        return pending_users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@router.post("/{user_email}/approve", response_model=dict)
async def approve_student(
    user_email: str,
    db: firestore.Client = Depends(get_db),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """
    Approve a pending student, changing their status to 'approved' and is_approved to True.
    """
    user_ref = db.collection('users').document(user_email)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")

    user_data = user_doc.to_dict()
    if user_data.get('status') != 'pending':
        raise HTTPException(status_code=400, detail="User is not in a pending state.")

    try:
        user_ref.update({
            "status": "approved",
            "is_approved": True
        })
        return {"message": f"User {user_email} has been approved successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while approving the user: {e}")