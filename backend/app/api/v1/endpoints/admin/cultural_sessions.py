from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.schemas.admin import CulturalSession
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

@router.post("/", response_model=CulturalSession)
async def create_cultural_session(session: CulturalSession, _: dict = Depends(get_current_admin_user)):
    session_ref = db.collection('cultural_sessions').document()
    session.id = session_ref.id
    session_ref.set(session.dict())
    return session

@router.get("/", response_model=List[CulturalSession])
async def read_cultural_sessions(_: dict = Depends(get_current_admin_user)):
    sessions_list = []
    sessions_stream = db.collection('cultural_sessions').stream()
    for session in sessions_stream:
        sessions_list.append(CulturalSession(**session.to_dict()))
    return sessions_list

@router.get("/{session_id}", response_model=CulturalSession)
async def read_cultural_session(session_id: str, _: dict = Depends(get_current_admin_user)):
    session_ref = db.collection('cultural_sessions').document(session_id)
    session = session_ref.get()
    if not session.exists:
        raise HTTPException(status_code=404, detail="Cultural session not found")
    return CulturalSession(**session.to_dict())

@router.put("/{session_id}", response_model=CulturalSession)
async def update_cultural_session(session_id: str, session_update: CulturalSession, _: dict = Depends(get_current_admin_user)):
    session_ref = db.collection('cultural_sessions').document(session_id)
    session_ref.set(session_update.dict(), merge=True)
    session = session_ref.get()
    return CulturalSession(**session.to_dict())

@router.delete("/{session_id}", response_model=dict)
async def delete_cultural_session(session_id: str, _: dict = Depends(get_current_admin_user)):
    db.collection('cultural_sessions').document(session_id).delete()
    return {"message": "Cultural session deleted successfully"}
