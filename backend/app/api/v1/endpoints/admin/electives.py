from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.schemas.admin import Elective
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

@router.post("/", response_model=Elective)
async def create_elective(elective: Elective, _: dict = Depends(get_current_admin_user)):
    elective_ref = db.collection('electives').document()
    elective.id = elective_ref.id
    elective_ref.set(elective.dict())
    return elective

@router.get("/", response_model=List[Elective])
async def read_electives(_: dict = Depends(get_current_admin_user)):
    electives_list = []
    electives_stream = db.collection('electives').stream()
    for elective in electives_stream:
        electives_list.append(Elective(**elective.to_dict()))
    return electives_list

@router.get("/{elective_id}", response_model=Elective)
async def read_elective(elective_id: str, _: dict = Depends(get_current_admin_user)):
    elective_ref = db.collection('electives').document(elective_id)
    elective = elective_ref.get()
    if not elective.exists:
        raise HTTPException(status_code=404, detail="Elective not found")
    return Elective(**elective.to_dict())

@router.put("/{elective_id}", response_model=Elective)
async def update_elective(elective_id: str, elective_update: Elective, _: dict = Depends(get_current_admin_user)):
    elective_ref = db.collection('electives').document(elective_id)
    elective_ref.set(elective_update.dict(), merge=True)
    elective = elective_ref.get()
    return Elective(**elective.to_dict())

@router.delete("/{elective_id}", response_model=dict)
async def delete_elective(elective_id: str, _: dict = Depends(get_current_admin_user)):
    db.collection('electives').document(elective_id).delete()
    return {"message": "Elective deleted successfully"}
