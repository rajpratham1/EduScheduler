from pydantic import BaseModel
from typing import Optional, List

class UserBase(BaseModel):
    email: str
    role: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    department: Optional[str] = None
    batch: Optional[str] = None
    student_id: Optional[str] = None
    faculty_id: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
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
        orm_mode = True
