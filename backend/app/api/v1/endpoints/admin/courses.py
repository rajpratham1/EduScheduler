from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.schemas.admin import Course, Batch
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

# --- Course Endpoints ---

@router.post("/", response_model=Course)
async def create_course(course: Course, _: dict = Depends(get_current_admin_user)):
    course_ref = db.collection('courses').document()
    course.id = course_ref.id
    course_ref.set(course.dict())
    return course

@router.get("/", response_model=List[Course])
async def read_courses(_: dict = Depends(get_current_admin_user)):
    courses_list = []
    courses_stream = db.collection('courses').stream()
    for course in courses_stream:
        courses_list.append(Course(**course.to_dict()))
    return courses_list

@router.get("/{course_id}", response_model=Course)
async def read_course(course_id: str, _: dict = Depends(get_current_admin_user)):
    course_ref = db.collection('courses').document(course_id)
    course = course_ref.get()
    if not course.exists:
        raise HTTPException(status_code=404, detail="Course not found")
    return Course(**course.to_dict())

@router.put("/{course_id}", response_model=Course)
async def update_course(course_id: str, course_update: Course, _: dict = Depends(get_current_admin_user)):
    course_ref = db.collection('courses').document(course_id)
    course_ref.set(course_update.dict(), merge=True)
    course = course_ref.get()
    return Course(**course.to_dict())

@router.delete("/{course_id}", response_model=dict)
async def delete_course(course_id: str, _: dict = Depends(get_current_admin_user)):
    # You might want to handle deletion of related batches and student enrollments here
    db.collection('courses').document(course_id).delete()
    return {"message": "Course deleted successfully"}

# --- Batch Endpoints ---

@router.post("/{course_id}/batches", response_model=Batch)
async def create_batch(
    course_id: str,
    batch: Batch,
    _: dict = Depends(get_current_admin_user)
):
    course_ref = db.collection('courses').document(course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found")
    
    batch_ref = course_ref.collection('batches').document()
    batch.id = batch_ref.id
    batch.course_id = course_id # Ensure batch is linked to the correct course
    batch_ref.set(batch.dict())
    return batch

@router.get("/{course_id}/batches", response_model=List[Batch])
async def read_batches(
    course_id: str,
    _: dict = Depends(get_current_admin_user)
):
    course_ref = db.collection('courses').document(course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found")

    batches_list = []
    batches_stream = course_ref.collection('batches').stream()
    for batch in batches_stream:
        batches_list.append(Batch(**batch.to_dict()))
    return batches_list

@router.get("/{course_id}/batches/{batch_id}", response_model=Batch)
async def read_batch(
    course_id: str,
    batch_id: str,
    _: dict = Depends(get_current_admin_user)
):
    course_ref = db.collection('courses').document(course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found")

    batch_ref = course_ref.collection('batches').document(batch_id)
    batch = batch_ref.get()
    if not batch.exists:
        raise HTTPException(status_code=404, detail="Batch not found")
    return Batch(**batch.to_dict())

@router.put("/{course_id}/batches/{batch_id}", response_model=Batch)
async def update_batch(
    course_id: str,
    batch_id: str,
    batch_update: Batch,
    _: dict = Depends(get_current_admin_user)
):
    course_ref = db.collection('courses').document(course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found")

    batch_ref = course_ref.collection('batches').document(batch_id)
    if not batch_ref.get().exists:
        raise HTTPException(status_code=404, detail="Batch not found")

    batch_update.course_id = course_id # Ensure course_id is not changed
    batch_ref.set(batch_update.dict(), merge=True)
    batch = batch_ref.get()
    return Batch(**batch.to_dict())

@router.delete("/{course_id}/batches/{batch_id}", response_model=dict)
async def delete_batch(
    course_id: str,
    batch_id: str,
    _: dict = Depends(get_current_admin_user)
):
    course_ref = db.collection('courses').document(course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found")

    batch_ref = course_ref.collection('batches').document(batch_id)
    if not batch_ref.get().exists:
        raise HTTPException(status_code=404, detail="Batch not found")

    batch_ref.delete()
    return {"message": "Batch deleted successfully"}
