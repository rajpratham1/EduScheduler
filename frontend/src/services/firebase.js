// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // Added this import
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjEToHaEzNgPQsKjK9eVmN0r0ziduOYEc",
  authDomain: "eduscheduler-239ca.firebaseapp.com",
  projectId: "eduscheduler-239ca",
  storageBucket: "eduscheduler-239ca.firebasestorage.app",
  messagingSenderId: "1062454079394",
  appId: "1:1062454079394:web:766f470bc46f61e8c68cfb",
  measurementId: "G-QHMDXZVF6R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app); // Exported analytics

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);