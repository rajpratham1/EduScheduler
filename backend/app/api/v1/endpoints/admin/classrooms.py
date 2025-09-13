from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.schemas.admin import Classroom
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

@router.post("/", response_model=Classroom)
async def create_classroom(classroom: Classroom, _: dict = Depends(get_current_admin_user)):
    classroom_ref = db.collection('classrooms').document()
    classroom.id = classroom_ref.id
    classroom_ref.set(classroom.dict())
    return classroom

@router.get("/", response_model=List[Classroom])
async def read_classrooms(_: dict = Depends(get_current_admin_user)):
    classrooms_list = []
    classrooms_stream = db.collection('classrooms').stream()
    for classroom in classrooms_stream:
        classrooms_list.append(Classroom(**classroom.to_dict()))
    return classrooms_list

@router.get("/{classroom_id}", response_model=Classroom)
async def read_classroom(classroom_id: str, _: dict = Depends(get_current_admin_user)):
    classroom_ref = db.collection('classrooms').document(classroom_id)
    classroom = classroom_ref.get()
    if not classroom.exists:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return Classroom(**classroom.to_dict())

@router.put("/{classroom_id}", response_model=Classroom)
async def update_classroom(classroom_id: str, classroom_update: Classroom, _: dict = Depends(get_current_admin_user)):
    classroom_ref = db.collection('classrooms').document(classroom_id)
    classroom_ref.set(classroom_update.dict(), merge=True)
    classroom = classroom_ref.get()
    return Classroom(**classroom.to_dict())

@router.delete("/{classroom_id}", response_model=dict)
async def delete_classroom(classroom_id: str, _: dict = Depends(get_current_admin_user)):
    db.collection('classrooms').document(classroom_id).delete()
    return {"message": "Classroom deleted successfully"}
