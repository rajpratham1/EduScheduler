from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.schemas.admin import ClassAssignment
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

@router.post("/", response_model=ClassAssignment)
async def create_assignment(assignment: ClassAssignment, _: dict = Depends(get_current_admin_user)):
    assignment_ref = db.collection('assignments').document()
    assignment.id = assignment_ref.id
    assignment_ref.set(assignment.dict())
    return assignment

@router.get("/", response_model=List[ClassAssignment])
async def read_assignments(_: dict = Depends(get_current_admin_user)):
    assignments_list = []
    assignments_stream = db.collection('assignments').stream()
    for assignment in assignments_stream:
        assignments_list.append(ClassAssignment(**assignment.to_dict()))
    return assignments_list

@router.get("/{assignment_id}", response_model=ClassAssignment)
async def read_assignment(assignment_id: str, _: dict = Depends(get_current_admin_user)):
    assignment_ref = db.collection('assignments').document(assignment_id)
    assignment = assignment_ref.get()
    if not assignment.exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return ClassAssignment(**assignment.to_dict())

@router.put("/{assignment_id}", response_model=ClassAssignment)
async def update_assignment(assignment_id: str, assignment_update: ClassAssignment, _: dict = Depends(get_current_admin_user)):
    assignment_ref = db.collection('assignments').document(assignment_id)
    assignment_ref.set(assignment_update.dict(), merge=True)
    assignment = assignment_ref.get()
    return ClassAssignment(**assignment.to_dict())

@router.delete("/{assignment_id}", response_model=dict)
async def delete_assignment(assignment_id: str, _: dict = Depends(get_current_admin_user)):
    db.collection('assignments').document(assignment_id).delete()
    return {"message": "Assignment deleted successfully"}
