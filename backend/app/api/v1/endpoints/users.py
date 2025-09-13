from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional, List

from app.schemas.user import UserInDB, UserUpdate, Feedback
from app.schemas.admin import Timetable, Elective, CulturalSession
from app.core.dependencies import get_current_user, get_current_admin_user
from app.schemas.auth import TokenData
from app.services.firebase import db, bucket
from app.services.email_service import send_email
from app.core.config import settings

router = APIRouter()

@router.get("/me", response_model=UserInDB)
async def read_users_me(current_user: TokenData = Depends(get_current_user)):
    user_ref = db.collection('users').document(current_user.email)
    user = user_ref.get()
    if not user.exists:
        # Create user if not exists
        user_data = {
            "email": current_user.email,
            "role": current_user.role,
        }
        db.collection('users').document(current_user.email).set(user_data)
        user = user_ref.get()

    return UserInDB(id=user.id, **user.to_dict())

@router.put("/me", response_model=UserInDB)
async def update_users_me(user_update: UserUpdate, current_user: TokenData = Depends(get_current_user)):
    user_ref = db.collection('users').document(current_user.email)
    user_ref.update(user_update.dict(exclude_unset=True))
    user = user_ref.get()
    return UserInDB(id=user.id, **user.to_dict())

@router.post("/me/photo")
async def upload_profile_photo(current_user: TokenData = Depends(get_current_user), file: UploadFile = File(...)):
    try:
        # Create a path in firebase storage
        path = f"profile_pictures/{current_user.email}/{file.filename}"
        blob = bucket.blob(path)
        
        # Upload the file
        blob.upload_from_file(file.file, content_type=file.content_type)
        
        # Make the file public
        blob.make_public()
        
        # Update user profile with the public url
        user_ref = db.collection('users').document(current_user.email)
        user_ref.update({"photo_url": blob.public_url})
        
        return {"photo_url": blob.public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all", response_model=List[UserInDB])
async def get_all_users(_: dict = Depends(get_current_admin_user)):
    all_users = []
    users_stream = db.collection('users').stream()
    for user in users_stream:
        all_users.append(UserInDB(id=user.id, **user.to_dict()))
    return all_users

@router.put("/me/availability", response_model=UserInDB)
async def update_my_availability(unavailable_slots: List[str], current_user: TokenData = Depends(get_current_user)):
    user_ref = db.collection('users').document(current_user.email)
    user_ref.update({"unavailable_slots": unavailable_slots})
    user = user_ref.get()
    return UserInDB(id=user.id, **user.to_dict())

@router.get("/me/timetable", response_model=List[Timetable])
async def get_my_timetable(current_user: TokenData = Depends(get_current_user)):
    user_doc = db.collection('users').document(current_user.email).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = user_doc.to_dict()

    timetables = []
    all_timetables_stream = db.collection('timetables').stream()

    for tt_doc in all_timetables_stream:
        tt_data = tt_doc.to_dict()
        scheduled_classes = tt_data.get('data', {}).get('timetable', [])

        if user_data.get("role") == "faculty" and user_data.get("faculty_id"):
            if any(cls.get('faculty_id') == user_data['faculty_id'] for cls in scheduled_classes):
                timetables.append(Timetable(id=tt_doc.id, **tt_data))
        elif user_data.get("role") == "student" and user_data.get("batch"):
            if any(cls.get('batch_id') == user_data['batch'] for cls in scheduled_classes):
                timetables.append(Timetable(id=tt_doc.id, **tt_data))
    
    return timetables

@router.get("/timetable/{timetable_id}", response_model=Timetable)
async def get_specific_timetable(timetable_id: str, current_user: TokenData = Depends(get_current_user)):
    # This endpoint can be used by anyone to view a specific timetable if they have the ID
    # Further authorization can be added here if only certain roles can view certain timetables
    timetable_ref = db.collection('timetables').document(timetable_id)
    timetable = timetable_ref.get()
    if not timetable.exists:
        raise HTTPException(status_code=404, detail="Timetable not found")
    return Timetable(**timetable.to_dict())

@router.post("/feedback")
async def submit_feedback(feedback: Feedback, current_user: TokenData = Depends(get_current_user)):
    admin_email = settings.ADMIN_EMAIL
    if not admin_email:
        raise HTTPException(status_code=500, detail="Admin email not configured.")

    email_subject = f"New Feedback from {current_user.email}: {feedback.subject}"
    email_body = f"User: {current_user.email}\nRole: {current_user.role}\n\nSubject: {feedback.subject}\n\nMessage:{feedback.message}"
    
    send_email(admin_email, email_subject, email_body)
    return {"message": "Feedback submitted successfully"}

@router.post("/electives/enroll/{elective_id}")
async def enroll_elective(elective_id: str, current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can enroll in electives.")

    elective_ref = db.collection('electives').document(elective_id)
    elective_doc = elective_ref.get()

    if not elective_doc.exists:
        raise HTTPException(status_code=404, detail="Elective not found.")
    
    elective_data = elective_doc.to_dict()
    enrolled_students = elective_data.get("enrolled_students", [])

    if current_user.email in enrolled_students:
        raise HTTPException(status_code=400, detail="Already enrolled in this elective.")
    
    if len(enrolled_students) >= elective_data.get("capacity", 0):
        raise HTTPException(status_code=400, detail="Elective is full.")

    enrolled_students.append(current_user.email)
    elective_ref.update({"enrolled_students": enrolled_students})

    return {"message": "Successfully enrolled in elective."}

@router.post("/cultural-sessions/participate/{session_id}")
async def participate_cultural_session(session_id: str, current_user: TokenData = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can participate in cultural sessions.")

    session_ref = db.collection('cultural_sessions').document(session_id)
    session_doc = session_ref.get()

    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Cultural session not found.")
    
    session_data = session_doc.to_dict()
    participants = session_data.get("participants", [])

    if current_user.email in participants:
        raise HTTPException(status_code=400, detail="Already participating in this session.")
    
    participants.append(current_user.email)
    session_ref.update({"participants": participants})

    return {"message": "Successfully joined cultural session."}
