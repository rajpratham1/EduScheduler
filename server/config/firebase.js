const admin = require('firebase-admin');

const initializeFirebase = () => {
  if (admin.apps.length === 0) { // Prevent re-initializing
    if (process.env.NODE_ENV === 'production') {
      // In production, Firebase Admin SDK automatically finds credentials
      // via the GOOGLE_APPLICATION_CREDENTIALS environment variable set by Render's Secret File.
      admin.initializeApp({
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    } else {
      // In development, load credentials from a local file
      const serviceAccount = require('../firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }
  }
  
  return admin;
};

module.exports = { initializeFirebase, admin };