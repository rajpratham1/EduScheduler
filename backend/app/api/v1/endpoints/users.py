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
    user_doc = user_ref.get()

    if not user_doc.exists:
        # Create user if not exists (should ideally be handled during login)
        user_data = {
            "email": current_user.email,
            "role": current_user.role,
        }
        db.collection('users').document(current_user.email).set(user_data)
        user_doc = user_ref.get()

    user_data = user_doc.to_dict()

    # If the user is a faculty, enrich with data from the 'faculty' collection
    if user_data.get("role") == "faculty":
        faculty_id = user_data.get("faculty_id")
        if faculty_id:
            faculty_doc = db.collection('faculty').document(faculty_id).get()
            if faculty_doc.exists:
                faculty_data = faculty_doc.to_dict()
                # Merge faculty-specific data into user_data
                user_data.update({
                    "name": faculty_data.get("name"),
                    "department": faculty_data.get("department"),
                    # Add other faculty-specific fields as needed
                })

    return UserInDB(id=user_doc.id, **user_data)


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

@router.get("/feedback-link", response_model=FeedbackSettings)
async def get_public_feedback_link():
    settings_ref = db.collection('settings').document("feedback_form")
    settings_doc = settings_ref.get()
    if not settings_doc.exists:
        return FeedbackSettings(google_form_link="") # Return empty if not set
    return FeedbackSettings(**settings_doc.to_dict())

@router.get("/seating-plan/{classroom_id}/{batch_id}", response_model=SeatingPlan)
async def get_seating_plan(
    classroom_id: str,
    batch_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    # Verify user is authorized to view this seating plan
    # For faculty: check if they are assigned to a class in this classroom/batch
    # For students: check if they belong to this batch and classroom

    seating_plan_doc_ref = db.collection('seating_plans').document(f"{classroom_id}_{batch_id}")
    seating_plan_doc = seating_plan_doc_ref.get()

    if not seating_plan_doc.exists:
        raise HTTPException(status_code=404, detail="Seating plan not found for this classroom and batch.")
    
    seating_plan_data = SeatingPlan(**seating_plan_doc.to_dict())

    # Basic authorization check
    if current_user.role == "student":
        user_doc = db.collection('users').document(current_user.email).get()
        if not user_doc.exists or user_doc.to_dict().get('batch_id') != batch_id or user_doc.to_dict().get('classroom_id') != classroom_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this seating plan.")
    elif current_user.role == "faculty":
        # More complex check: iterate through assignments to see if faculty teaches this batch in this classroom
        assignments_ref = db.collection('assignments').where('faculty_id', '==', current_user.email) # Assuming faculty email is their ID
        assignments_stream = assignments_ref.stream()
        authorized = False
        for assignment in assignments_stream:
            assign_data = assignment.to_dict()
            if assign_data.get('batch_id') == batch_id and assign_data.get('classroom_id') == classroom_id:
                authorized = True
                break
        if not authorized:
            raise HTTPException(status_code=403, detail="Not authorized to view this seating plan.")
    elif current_user.role != "admin": # Admin can view all
        raise HTTPException(status_code=403, detail="Not authorized to view this seating plan.")

    return seating_plan_data
