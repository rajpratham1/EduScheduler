from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import json

from app.core.dependencies import get_current_admin_user
from app.scheduling_engine.solver import TimetableSolver
from app.services.firebase import db
from app.services.gemini_api import generate_timetable_with_gemini
from app.schemas.admin import TimetableGenerationRequest # Import the new schema

router = APIRouter()

@router.post("/generate")
async def generate_timetable(request: TimetableGenerationRequest, _: dict = Depends(get_current_admin_user)):
    # Fetch all necessary data from Firestore
    all_faculty_data = [doc.to_dict() for doc in db.collection('faculty').stream()]
    all_subjects_data = [doc.to_dict() for doc in db.collection('subjects').stream()]
    all_classrooms_data = [doc.to_dict() for doc in db.collection('classrooms').stream()]
    all_batches_data = []
    # Fetch all batches from all courses
    courses_stream = db.collection('courses').stream()
    for course_doc in courses_stream:
        batches_stream = db.collection('courses').document(course_doc.id).collection('batches').stream()
        for batch_doc in batches_stream:
            all_batches_data.append(batch_doc.to_dict())

    # Filter data based on request
    faculty_data = [f for f in all_faculty_data if f.get('id') in request.selected_faculty]
    subjects_data = [s for s in all_subjects_data if s.get('id') in request.selected_subjects]
    classrooms_data = [c for c in all_classrooms_data if c.get('id') in request.selected_classrooms]
    batches_data = [b for b in all_batches_data if b.get('id') in request.selected_batches]

    # Generate courses to schedule based on selected subjects and batches
    # This is a simplified assumption: each selected subject needs to be scheduled for each selected batch
    courses_to_schedule = []
    for batch_id in request.selected_batches:
        for subject_id in request.selected_subjects:
            # Assuming 1 class per subject per batch for simplicity, duration 1 hour
            courses_to_schedule.append({
                "subject_id": subject_id,
                "batch_id": batch_id,
                "duration": 1,
                "num_classes": 1 # Can be made configurable
            })

    # Generate time slots (e.g., Mon-Fri, 9 AM - 5 PM)
    time_slots = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    hours = ["09-10", "10-11", "11-12", "13-14", "14-15", "15-16"]
    for day in days:
        for hour in hours:
            time_slots.append(f"{day}_{hour}")

    # Apply fixed slots and leaves (basic implementation)
    # This part needs more sophisticated handling in TimetableSolver
    # For now, just pass them as constraints to Gemini if CSP fails

    # Try to solve with CSP first
    solver = TimetableSolver(faculty_data, subjects_data, classrooms_data, batches_data, courses_to_schedule, time_slots)
    csp_solution = solver.solve()

    if csp_solution is not None:
        return {"message": "Timetable generated with CSP", "timetable": solver.get_solution()}
    else:
        # If CSP fails, or for optimization, use Gemini API
        gemini_prompt = f"""Generate a college timetable based on the following data and constraints.
        Provide the output in a JSON array format, where each object represents a scheduled class with keys: 'subject', 'batch', 'faculty', 'classroom', 'time_slot'.
        Ensure all constraints are met. If no solution is possible, state that.

        Faculty: {json.dumps(faculty_data)}
        Subjects: {json.dumps(subjects_data)}
        Classrooms: {json.dumps(classrooms_data)}
        Batches: {json.dumps(batches_data)}
        Courses to Schedule: {json.dumps(courses_to_schedule)}
        Available Time Slots: {json.dumps(time_slots)}
        Additional Constraints: {json.dumps(request.dict())}
        """

        try:
            gemini_response_text = generate_timetable_with_gemini(gemini_prompt)
            # Attempt to parse Gemini's response as JSON
            try:
                gemini_solution = json.loads(gemini_response_text)
                return {"message": "Timetable generated with Gemini API", "timetable": gemini_solution}
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail=f"Gemini API returned non-JSON response: {gemini_response_text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")
