from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List, Dict, Any
from weasyprint import HTML
from io import BytesIO
import json
from datetime import datetime

from app.schemas.admin import Timetable
from app.core.dependencies import get_current_admin_user
from app.services.firebase import db

router = APIRouter()

@router.post("/", response_model=Timetable)
async def create_timetable(timetable: Timetable, _: dict = Depends(get_current_admin_user)):
    timetable_ref = db.collection('timetables').document()
    timetable.id = timetable_ref.id
    timetable_ref.set(timetable.dict())
    return timetable

@router.get("/", response_model=List[Timetable])
async def read_timetables(_: dict = Depends(get_current_admin_user)):
    timetables_list = []
    timetables_stream = db.collection('timetables').stream()
    for timetable in timetables_stream:
        timetables_list.append(Timetable(**timetable.to_dict()))
    return timetables_list

@router.get("/{timetable_id}", response_model=Timetable)
async def read_timetable(timetable_id: str, _: dict = Depends(get_current_admin_user)):
    timetable_ref = db.collection('timetables').document(timetable_id)
    timetable = timetable_ref.get()
    if not timetable.exists:
        raise HTTPException(status_code=404, detail="Timetable not found")
    return Timetable(**timetable.to_dict())

@router.put("/{timetable_id}", response_model=Timetable)
async def update_timetable(timetable_id: str, timetable_update: Timetable, _: dict = Depends(get_current_admin_user)):
    timetable_ref = db.collection('timetables').document(timetable_id)
    timetable_ref.set(timetable_update.dict(), merge=True)
    timetable = timetable_ref.get()
    return Timetable(**timetable.to_dict())

@router.delete("/{timetable_id}", response_model=dict)
async def delete_timetable(timetable_id: str, _: dict = Depends(get_current_admin_user)):
    db.collection('timetables').document(timetable_id).delete()
    return {"message": "Timetable deleted successfully"}

@router.post("/generate-pdf/{timetable_id}")
async def generate_timetable_pdf(timetable_id: str, _: dict = Depends(get_current_admin_user)):
    timetable_ref = db.collection('timetables').document(timetable_id)
    timetable_doc = timetable_ref.get()

    if not timetable_doc.exists:
        raise HTTPException(status_code=404, detail="Timetable not found")

    timetable_data = Timetable(**timetable_doc.to_dict())

    # Basic HTML structure for the PDF
    # This can be made much more sophisticated with Jinja2 templates and CSS
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Timetable - {timetable_data.name}</title>
        <style>
            body {{ font-family: sans-serif; margin: 20px; }}
            h1 {{ color: #333; text-align: center; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
            .section-title {{ margin-top: 30px; margin-bottom: 10px; color: #555; }}
            pre {{ background-color: #f8f8f8; padding: 10px; border: 1px solid #eee; overflow-x: auto; }}
        </style>
    </head>
    <body>
        <h1>Timetable: {timetable_data.name}</h1>
        <h2 class="section-title">Timetable Data</h2>
        <pre>{json.dumps(timetable_data.data, indent=2)}</pre>
        
        <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </body>
    </html>
    """

    # Generate PDF
    pdf_file = BytesIO()
    HTML(string=html_content).write_pdf(pdf_file)
    pdf_file.seek(0)

    return Response(
        content=pdf_file.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"timetable_{timetable_data.name.replace(' ', '_')}.pdf\""}
    )
