import os
from dotenv import load_dotenv

# Load .env file from the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

print(f"DEBUG: Loaded .env file in main.py. ADMIN_EMAIL: {os.getenv("ADMIN_EMAIL")}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.firebase import initialize_firebase
from app.api.v1.endpoints import auth, users
from app.api.v1.routers import admin as admin_router

app = FastAPI(
    title="EduScheduler API",
    description="API for EduScheduler application",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://eduscheduler-ggjv.onrender.com", # Your deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    initialize_firebase()

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(admin_router.router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to EduScheduler API"}
