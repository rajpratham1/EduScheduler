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
    
    # Read the service account JSON file content
    try:
        with open(settings.GOOGLE_APPLICATION_CREDENTIALS, 'r') as f:
            service_account_info = json.load(f)
        # Extract private_key as a string and pass it directly
        private_key = service_account_info["private_key"]
        service_account_info["private_key"] = private_key
    except FileNotFoundError:
        print(f"Error: Service account file not found at {settings.GOOGLE_APPLICATION_CREDENTIALS}")
        raise
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode service account JSON file: {e}")
        raise

    cred = credentials.Certificate(service_account_info)
    firebase_admin.initialize_app(cred, {
        'storageBucket': settings.FIREBASE_STORAGE_BUCKET
    })
    db = firestore.client()
    bucket = storage.bucket()
    firebase_auth = auth
    print("Firebase initialized.")