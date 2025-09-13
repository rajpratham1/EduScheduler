import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
from app.core.config import settings
import json
import os

db = None
bucket = None
firebase_auth = None

def initialize_firebase():
    global db, bucket, firebase_auth

    cred = None
    # Prioritize loading from a secret file path if provided
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

    if service_account_path:
        try:
            cred = credentials.Certificate(service_account_path)
            print(f"Firebase initialized from file path: {service_account_path}")
        except Exception as e:
            print(f"ERROR: Could not initialize Firebase from file path: {e}")
            raise e
    # Fallback to environment variable content (less reliable)
    elif settings.FIREBASE_PRIVATE_KEY_CONTENT:
        try:
            service_account_info = json.loads(settings.FIREBASE_PRIVATE_KEY_CONTENT)
            cred = credentials.Certificate(service_account_info)
            print("Firebase initialized from environment variable content.")
        except Exception as e:
            print(f"ERROR: Could not initialize Firebase from environment variable: {e}")
            raise e

    if not cred:
        raise ValueError("Failed to create Firebase credentials. Ensure FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PRIVATE_KEY_CONTENT is set correctly.")

    firebase_admin.initialize_app(cred, {
        'storageBucket': settings.FIREBASE_STORAGE_BUCKET
    })
    db = firestore.client()
    bucket = storage.bucket()
    firebase_auth = auth
    print("Firebase initialized.")
