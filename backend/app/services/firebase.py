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

    # Read the service account JSON content from environment variable
    try:
        service_account_info = json.loads(settings.FIREBASE_PRIVATE_KEY_CONTENT)
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode Firebase private key JSON from environment variable: {e}")
        raise ValueError("Invalid Firebase private key content provided.")
    except TypeError:
        print("Error: FIREBASE_PRIVATE_KEY_CONTENT environment variable is not set or is not a string.")
        raise ValueError("Firebase private key content is missing.")

    cred = credentials.Certificate(service_account_info)
    firebase_admin.initialize_app(cred, {
        'storageBucket': settings.FIREBASE_STORAGE_BUCKET
    })
    db = firestore.client()
    bucket = storage.bucket()
    firebase_auth = auth
    print("Firebase initialized.")