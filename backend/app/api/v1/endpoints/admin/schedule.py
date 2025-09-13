from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import json

from app.core.dependencies import get_current_admin_user
from app.scheduling_engine.solver import TimetableSolver
from app.services.firebase import db
from app.services.gemini_api import generate_timetable_with_gemini

router = APIRouter()

@router.post("/generate")
async def generate_timetable(constraints: Dict[str, Any], _: dict = Depends(get_current_admin_user)):
    # Fetch necessary data from Firestore
    faculty_data = [doc.to_dict() for doc in db.collection('faculty').stream()]
    subjects_data = [doc.to_dict() for doc in db.collection('subjects').stream()]
    classrooms_data = [doc.to_dict() for doc in db.collection('classrooms').stream()]
    # Assuming batches can be derived from students data or provided separately
    # For now, let's create dummy batches based on students' batches
    students_data = [doc.to_dict() for doc in db.collection('users').where('role', '==', 'student').stream()]
    batches_set = set(s.get('batch') for s in students_data if s.get('batch'))
    batches_data = [{'id': b, 'name': b} for b in batches_set]

    # Example courses to schedule (this would come from admin input/configuration)
    courses_to_schedule = [
        {"subject_id": "math101", "batch_id": "batchA", "duration": 1, "required_faculty_id": None, "is_lab": False, "num_classes": 2},
        {"subject_id": "phy201", "batch_id": "batchA", "duration": 1, "required_faculty_id": "fac1", "is_lab": True, "num_classes": 1},
    ]

    # Example time slots (this would come from admin input/configuration)
    time_slots = [
        "Mon_9-10", "Mon_10-11", "Mon_11-12",
        "Tue_9-10", "Tue_10-11", "Tue_11-12",
        "Wed_9-10", "Wed_10-11", "Wed_11-12",
        "Thu_9-10", "Thu_10-11", "Thu_11-12",
        "Fri_9-10", "Fri_10-11", "Fri_11-12",
    ]

    # Try to solve with CSP first
    solver = TimetableSolver(faculty_data, subjects_data, classrooms_data, batches_data, courses_to_schedule, time_slots)
    csp_solution = solver.solve()

    if csp_solution is not None:
        return solver.get_solution()
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
        Additional Constraints: {json.dumps(constraints)}
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