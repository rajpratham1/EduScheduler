from pydantic import BaseModel, Field
from typing import Optional, List

class UserBase(BaseModel):
    email: str
    role: str
    is_approved: bool = False
    status: str = 'pending' # pending, approved, rejected
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    department: Optional[str] = None
    batch: Optional[str] = None
    student_id: Optional[str] = None
    faculty_id: Optional[str] = None
    admin_id: Optional[str] = None # Admin ID provided by student on signup

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    is_approved: Optional[bool] = None
    status: Optional[str] = None
    role: Optional[str] = None
    display_name: Optional[str] = None
    department: Optional[str] = None
    batch: Optional[str] = None
    student_id: Optional[str] = None
    faculty_id: Optional[str] = None
    unavailable_slots: Optional[List[str]] = None

class Feedback(BaseModel):
    subject: str
    message: str

class UserInDB(UserBase):
    id: str

    class Config:
        from_attributes = True

class StudentEnrollmentRequest(BaseModel):
    course_id: str
    batch_id: str
