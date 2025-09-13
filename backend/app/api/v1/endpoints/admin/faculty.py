from fastapi import APIRouter, Depends, HTTPException
import uuid
from passlib.context import CryptContext
from typing import List

from app.schemas.admin import Faculty
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db
from app.services.email_service import send_email

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()

@router.post("/", response_model=Faculty)
async def create_faculty(faculty: Faculty, _: dict = Depends(get_current_admin_user)):
    # Generate unique ID and temporary password
    faculty_id = str(uuid.uuid4())
    temporary_password = str(uuid.uuid4())[:8] # 8 character temporary password
    hashed_password = pwd_context.hash(temporary_password)

    faculty.id = faculty_id
    faculty.hashed_password = hashed_password

    faculty_ref = db.collection('faculty').document(faculty_id)
    faculty_ref.set(faculty.dict())

    # Send email with credentials
    email_subject = "Your EduScheduler Faculty Account Credentials"
    email_body = f"Dear {faculty.name},\n\nYour EduScheduler faculty account has been created.\n\nYour Faculty ID: {faculty.id}\nYour Temporary Password: {temporary_password}\n\nPlease log in and change your password as soon as possible.\n\nRegards,\nEduScheduler Team"
    send_email(faculty.email, email_subject, email_body)

    return faculty

@router.get("/", response_model=List[Faculty])
async def read_faculty(_: dict = Depends(get_current_admin_user)):
    faculty_list = []
    faculty_stream = db.collection('faculty').stream()
    for faculty in faculty_stream:
        faculty_list.append(Faculty(**faculty.to_dict()))
    return faculty_list

@router.get("/{faculty_id}", response_model=Faculty)
async def read_faculty_member(faculty_id: str, _: dict = Depends(get_current_admin_user)):
    faculty_ref = db.collection('faculty').document(faculty_id)
    faculty = faculty_ref.get()
    if not faculty.exists:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return Faculty(**faculty.to_dict())

@router.put("/{faculty_id}", response_model=Faculty)
async def update_faculty(faculty_id: str, faculty_update: Faculty, _: dict = Depends(get_current_admin_user)):
    faculty_ref = db.collection('faculty').document(faculty_id)
    faculty_ref.set(faculty_update.dict(), merge=True)
    faculty = faculty_ref.get()
    return Faculty(**faculty.to_dict())

@router.delete("/{faculty_id}", response_model=dict)
async def delete_faculty(faculty_id: str, _: dict = Depends(get_current_admin_user)):
    db.collection('faculty').document(faculty_id).delete()
    return {"message": "Faculty deleted successfully"}
