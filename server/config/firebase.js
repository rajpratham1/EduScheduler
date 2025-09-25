const admin = require('firebase-admin');
const fs = require('fs');

const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  let serviceAccount;
  const secretPath = '/etc/secrets/firebase-service-account.json';

  try {
    // Priority 1: Render Secret File
    if (fs.existsSync(secretPath)) {
      const serviceAccountString = fs.readFileSync(secretPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountString);
      console.log('Firebase credentials loaded from secret file.');
    } 
    // Priority 2: Environment Variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log('Firebase credentials loaded from environment variable.');
    } 
    // Priority 3: Local development file
    else {
      serviceAccount = require('../firebase-service-account.json');
      console.log('Firebase credentials loaded from local file.');
    }
  } catch (error) {
    console.error('FATAL: Failed to load or parse Firebase credentials.', error);
    // Exit gracefully if credentials are not found or invalid
    throw new Error('Firebase credentials are not configured correctly. Backend cannot start.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  console.log('Firebase initialized successfully.');
  return admin;
};

module.exports = { initializeFirebase, admin };
