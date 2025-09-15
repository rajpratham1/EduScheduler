from pydantic import BaseModel
from typing import Optional, List, Any, Dict

class Faculty(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    department: str
    hashed_password: Optional[str] = None

class Student(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    department: str
    batch: str

class Subject(BaseModel):
    id: Optional[str] = None
    name: str
    code: str
    department: str

class Classroom(BaseModel):
    id: Optional[str] = None
    name: str
    capacity: int
    resources: List[str] = []

class Elective(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    capacity: int
    enrolled_students: List[str] = [] # List of student emails

class CulturalSession(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    date: str
    time: str
    location: str
    participants: List[str] = [] # List of student emails

class Timetable(BaseModel):
    id: Optional[str] = None
    name: str
    data: dict

class Course(BaseModel):
    id: Optional[str] = None
    name: str
    code: str
    description: Optional[str] = None

class Batch(BaseModel):
    id: Optional[str] = None
    name: str # e.g., "2024-2028"
    course_id: str
    year: Optional[int] = None # e.g., 1, 2, 3, 4

class ClassAssignment(BaseModel):
    id: Optional[str] = None
    batch_id: str
    course_id: str
    subject_id: str
    faculty_id: str
    classroom_id: str
    day_of_week: str # e.g., "Monday"
    time_slot: str # e.g., "09:00-10:00"



class SeatingPlanRequest(BaseModel):
    batch_id: str

class SeatingPlan(BaseModel):
    id: Optional[str] = None
    classroom_id: str
    batch_id: str
    plan: Dict[str, str] # Key: seat_number (e.g., "A1"), Value: student_email

class FeedbackSettings(BaseModel):
    google_form_link: str

class TimetableGenerationRequest(BaseModel):
    selected_batches: List[str]
    selected_subjects: List[str]
    selected_faculty: List[str]
    selected_classrooms: List[str]
    max_classes_per_day: Optional[int] = None
    fixed_slots: Optional[List[Dict[str, Any]]] = None
    leaves: Optional[List[Dict[str, Any]]] = None
    electives: Optional[List[str]] = None
