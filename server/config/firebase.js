const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

const initializeFirebase = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  
  return admin;
};

module.exports = { initializeFirebase, admin };