import os
from dotenv import load_dotenv

# Load .env file from the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'))

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    FIREBASE_API_KEY: str = os.getenv("FIREBASE_API_KEY")
    FIREBASE_AUTH_DOMAIN: str = os.getenv("FIREBASE_AUTH_DOMAIN")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_STORAGE_BUCKET: str = os.getenv("FIREBASE_STORAGE_BUCKET")
    FIREBASE_MESSAGING_SENDER_ID: str = os.getenv("FIREBASE_MESSAGING_SENDER_ID")
    FIREBASE_APP_ID: str = os.getenv("FIREBASE_APP_ID")
    FIREBASE_MEASUREMENT_ID: str = os.getenv("FIREBASE_MEASUREMENT_ID")
    FIREBASE_PRIVATE_KEY_CONTENT: str = os.getenv("FIREBASE_PRIVATE_KEY_CONTENT") # New: for Firebase Admin SDK
    JWT_SECRET: str = os.getenv("JWT_SECRET")
    ALGORITHM: str = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@example.com")
    SMTP_EMAIL: str = os.getenv("SMTP_EMAIL", "your_smtp_email@example.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "your_smtp_password")

settings = Settings()
