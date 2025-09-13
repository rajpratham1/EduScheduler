from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.schemas.admin import Subject
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

@router.post("/", response_model=Subject)
async def create_subject(subject: Subject, _: dict = Depends(get_current_admin_user)):
    subject_ref = db.collection('subjects').document()
    subject.id = subject_ref.id
    subject_ref.set(subject.dict())
    return subject

@router.get("/", response_model=List[Subject])
async def read_subjects(_: dict = Depends(get_current_admin_user)):
    subjects_list = []
    subjects_stream = db.collection('subjects').stream()
    for subject in subjects_stream:
        subjects_list.append(Subject(**subject.to_dict()))
    return subjects_list

@router.get("/{subject_id}", response_model=Subject)
async def read_subject(subject_id: str, _: dict = Depends(get_current_admin_user)):
    subject_ref = db.collection('subjects').document(subject_id)
    subject = subject_ref.get()
    if not subject.exists:
        raise HTTPException(status_code=404, detail="Subject not found")
    return Subject(**subject.to_dict())

@router.put("/{subject_id}", response_model=Subject)
async def update_subject(subject_id: str, subject_update: Subject, _: dict = Depends(get_current_admin_user)):
    subject_ref = db.collection('subjects').document(subject_id)
    subject_ref.set(subject_update.dict(), merge=True)
    subject = subject_ref.get()
    return Subject(**subject.to_dict())

@router.delete("/{subject_id}", response_model=dict)
async def delete_subject(subject_id: str, _: dict = Depends(get_current_admin_user)):
    db.collection('subjects').document(subject_id).delete()
    return {"message": "Subject deleted successfully"}
