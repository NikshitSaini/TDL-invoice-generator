import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAG4WhQTJJlb0EA0cWHM9KWExxUv25dCXA",
  authDomain: "tdl-invoice-management.firebaseapp.com",
  projectId: "tdl-invoice-management",
  storageBucket: "tdl-invoice-management.firebasestorage.app",
  messagingSenderId: "109742175283",
  appId: "1:109742175283:web:22ed985f013ce0f0639f46",
  measurementId: "G-STML17L02Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and set persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistence set to browserLocalPersistence
  })
  .catch((error) => {
    console.error("Auth Persistence Error:", error);
  });

// Initialize Firestore
export const db = getFirestore(app);

export default app;
