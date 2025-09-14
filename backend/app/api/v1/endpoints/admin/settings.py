from fastapi import APIRouter, Depends, HTTPException

from app.schemas.admin import FeedbackSettings
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

SETTINGS_DOC_ID = "feedback_form"

@router.get("/feedback-settings", response_model=FeedbackSettings)
async def get_feedback_settings(
    _: dict = Depends(get_current_admin_user)
):
    settings_ref = db.collection('settings').document(SETTINGS_DOC_ID)
    settings_doc = settings_ref.get()
    if not settings_doc.exists:
        # Return a default empty link if not set yet
        return FeedbackSettings(google_form_link="")
    return FeedbackSettings(**settings_doc.to_dict())

@router.put("/feedback-settings", response_model=FeedbackSettings)
async def update_feedback_settings(
    settings_update: FeedbackSettings,
    _: dict = Depends(get_current_admin_user)
):
    settings_ref = db.collection('settings').document(SETTINGS_DOC_ID)
    settings_ref.set(settings_update.dict())
    return settings_update
