from pydantic import BaseModel
from typing import Optional, List

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
