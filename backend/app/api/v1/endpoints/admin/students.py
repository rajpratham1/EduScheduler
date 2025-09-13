from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.schemas.admin import Student
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

@router.post("/", response_model=Student)
async def create_student(student: Student, _: dict = Depends(get_current_admin_user)):
    student_ref = db.collection('students').document()
    student.id = student_ref.id
    student_ref.set(student.dict())
    return student

@router.get("/", response_model=List[Student])
async def read_students(_: dict = Depends(get_current_admin_user)):
    students_list = []
    students_stream = db.collection('students').stream()
    for student in students_stream:
        students_list.append(Student(**student.to_dict()))
    return students_list

@router.get("/{student_id}", response_model=Student)
async def read_student(student_id: str, _: dict = Depends(get_current_admin_user)):
    student_ref = db.collection('students').document(student_id)
    student = student_ref.get()
    if not student.exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return Student(**student.to_dict())

@router.put("/{student_id}", response_model=Student)
async def update_student(student_id: str, student_update: Student, _: dict = Depends(get_current_admin_user)):
    student_ref = db.collection('students').document(student_id)
    student_ref.set(student_update.dict(), merge=True)
    student = student_ref.get()
    return Student(**student.to_dict())

@router.delete("/{student_id}", response_model=dict)
async def delete_student(student_id: str, _: dict = Depends(get_current_admin_user)):
    db.collection('students').document(student_id).delete()
    return {"message": "Student deleted successfully"}
