from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List, Dict
from weasyprint import HTML
from io import BytesIO

from app.schemas.admin import Classroom, SeatingPlanRequest, SeatingPlan
from app.core.dependencies import get_db, get_current_admin_user
from app.services.firebase import db

router = APIRouter()

@router.post("/", response_model=Classroom)
async def create_classroom(classroom: Classroom, _: dict = Depends(get_current_admin_user)):
    classroom_ref = db.collection('classrooms').document()
    classroom.id = classroom_ref.id
    classroom_ref.set(classroom.dict())
    return classroom

@router.get("/", response_model=List[Classroom])
async def read_classrooms(_: dict = Depends(get_current_admin_user)):
    classrooms_list = []
    classrooms_stream = db.collection('classrooms').stream()
    for classroom in classrooms_stream:
        classrooms_list.append(Classroom(**classroom.to_dict()))
    return classrooms_list

@router.get("/{classroom_id}", response_model=Classroom)
async def read_classroom(classroom_id: str, _: dict = Depends(get_current_admin_user)):
    classroom_ref = db.collection('classrooms').document(classroom_id)
    classroom = classroom_ref.get()
    if not classroom.exists:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return Classroom(**classroom.to_dict())

@router.put("/{classroom_id}", response_model=Classroom)
async def update_classroom(classroom_id: str, classroom_update: Classroom, _: dict = Depends(get_current_admin_user)):
    classroom_ref = db.collection('classrooms').document(classroom_id)
    classroom_ref.set(classroom_update.dict(), merge=True)
    classroom = classroom_ref.get()
    return Classroom(**classroom.to_dict())

@router.delete("/{classroom_id}", response_model=dict)
async def delete_classroom(classroom_id: str, _: dict = Depends(get_current_admin_user)):
    db.collection('classrooms').document(classroom_id).delete()
    return {"message": "Classroom deleted successfully"}

@router.post("/{classroom_id}/generate-seating-plan", response_model=SeatingPlan)
async def generate_seating_plan(
    classroom_id: str,
    request: SeatingPlanRequest,
    db: firestore.Client = Depends(get_db),
    _: dict = Depends(get_current_admin_user)
):
    classroom_ref = db.collection('classrooms').document(classroom_id)
    classroom_doc = classroom_ref.get()
    if not classroom_doc.exists:
        raise HTTPException(status_code=404, detail="Classroom not found.")
    classroom_data = classroom_doc.to_dict()
    capacity = classroom_data.get('capacity', 0)

    # Fetch students for the given batch
    students_ref = db.collection('users').where('batch_id', '==', request.batch_id).where('role', '==', 'student')
    students_docs = students_ref.stream()
    students_list = [doc.to_dict() for doc in students_docs]

    if len(students_list) > capacity:
        raise HTTPException(status_code=400, detail="Number of students exceeds classroom capacity.")

    seating_plan_data: Dict[str, str] = {}
    # Simple sequential seating assignment
    for i, student in enumerate(students_list):
        seat_number = f"S{i+1}" # Example: S1, S2, S3...
        seating_plan_data[seat_number] = student['email']
        
        # Update student's document with seat number
        student_doc_ref = db.collection('users').document(student['email'])
        student_doc_ref.update({'seat_number': seat_number, 'classroom_id': classroom_id})

    # Store the seating plan in Firestore
    seating_plan_doc_ref = db.collection('seating_plans').document(f"{classroom_id}_{request.batch_id}")
    seating_plan_obj = SeatingPlan(
        classroom_id=classroom_id,
        batch_id=request.batch_id,
        plan=seating_plan_data
    )
    seating_plan_doc_ref.set(seating_plan_obj.dict())
    
    return seating_plan_obj

@router.get("/{classroom_id}/seating-plan/{batch_id}/download", response_class=Response)
async def download_seating_plan(
    classroom_id: str,
    batch_id: str,
    db: firestore.Client = Depends(get_db),
    _: dict = Depends(get_current_admin_user)
):
    seating_plan_doc_ref = db.collection('seating_plans').document(f"{classroom_id}_{batch_id}")
    seating_plan_doc = seating_plan_doc_ref.get()

    if not seating_plan_doc.exists:
        raise HTTPException(status_code=404, detail="Seating plan not found.")

    seating_plan_data = SeatingPlan(**seating_plan_doc.to_dict())

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Seating Plan - {classroom_id} ({batch_id})</title>
        <style>
            body {{ font-family: sans-serif; margin: 20px; }}
            h1 {{ color: #333; text-align: center; margin-bottom: 20px; }}
            .seating-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 10px; }}
            .seat-item {{ border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #f9f9f9; }}
            .seat-item strong {{ display: block; font-size: 1.2em; }}
        </style>
    </head>
    <body>
        <h1>Seating Plan for {classroom_id}</h1>
        <h2>Batch: {batch_id}</h2>
        <div class="seating-grid">
            {''.join([f'<div class="seat-item"><strong>{seat}</strong><span>{email}</span></div>' for seat, email in seating_plan_data.plan.items()])}
        </div>
    </body>
    </html>
    """

    pdf_file = BytesIO()
    HTML(string=html_content).write_pdf(pdf_file)
    pdf_file.seek(0)

    return Response(
        content=pdf_file.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"seating_plan_{classroom_id}_{batch_id}.pdf\""}
    )
