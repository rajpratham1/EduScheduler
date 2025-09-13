from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import datetime

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Event(BaseModel):
    id: Optional[int] = None
    title: str
    start_time: datetime.datetime
    end_time: datetime.datetime

# In-memory database
events_db = []
event_id_counter = 0

@app.get("/")
def read_root():
    return {"message": "Welcome to EduScheduler API"}

@app.post("/events/", response_model=Event)
def create_event(event: Event):
    global event_id_counter
    event_id_counter += 1
    event.id = event_id_counter
    events_db.append(event)
    return event

@app.get("/events/", response_model=List[Event])
def get_events():
    return events_db

@app.get("/events/{event_id}", response_model=Event)
def get_event(event_id: int):
    for event in events_db:
        if event.id == event_id:
            return event
    return {"error": "Event not found"}

@app.put("/events/{event_id}", response_model=Event)
def update_event(event_id: int, updated_event: Event):
    for i, event in enumerate(events_db):
        if event.id == event_id:
            updated_event.id = event_id
            events_db[i] = updated_event
            return updated_event
    return {"error": "Event not found"}

@app.delete("/events/{event_id}")
def delete_event(event_id: int):
    for i, event in enumerate(events_db):
        if event.id == event_id:
            del events_db[i]
            return {"message": "Event deleted successfully"}
    return {"error": "Event not found"}
