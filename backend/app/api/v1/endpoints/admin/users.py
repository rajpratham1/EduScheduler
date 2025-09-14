from fastapi import APIRouter, Depends, HTTPException
from typing import List
from firebase_admin import firestore
import uuid # Import uuid for generating student IDs

from app.core.dependencies import get_db, get_current_admin_user
from app.schemas.user import UserInDB, StudentEnrollmentRequest # Import StudentEnrollmentRequest
from app.schemas.admin import Course, Batch # Import Course and Batch for validation

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

@router.put("/{user_email}/enroll", response_model=UserInDB)
async def enroll_student(
    user_email: str,
    enrollment_request: StudentEnrollmentRequest,
    db: firestore.Client = Depends(get_db),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """
    Enroll an approved student into a specific course and batch, and assign a unique student ID.
    """
    user_ref = db.collection('users').document(user_email)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")

    user_data = user_doc.to_dict()
    if user_data.get('status') != 'approved' or not user_data.get('is_approved'):
        raise HTTPException(status_code=400, detail="User is not approved for enrollment.")

    # Verify Course and Batch existence
    course_ref = db.collection('courses').document(enrollment_request.course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found.")

    batch_ref = course_ref.collection('batches').document(enrollment_request.batch_id)
    if not batch_ref.get().exists:
        raise HTTPException(status_code=404, detail="Batch not found.")

    # Generate unique student ID (for now, using UUID)
    # TODO: Implement sequential ID generation per course/batch if required by user
    student_id = str(uuid.uuid4())[:8] # Short UUID for student ID

    try:
        user_ref.update({
            "student_id": student_id,
            "course_id": enrollment_request.course_id,
            "batch_id": enrollment_request.batch_id,
            "role": "student", # Ensure role is student upon enrollment
            "status": "enrolled" # New status for enrolled students
        })
        updated_user_doc = user_ref.get()
        return UserInDB(**updated_user_doc.to_dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during student enrollment: {e}")
