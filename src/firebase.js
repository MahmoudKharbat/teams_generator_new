import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCIka0xwxAD0GXLCnh-cfAShpyME_bRaXs",
  authDomain: "teams-manager-ee4dc.firebaseapp.com",
  projectId: "teams-manager-ee4dc",
  storageBucket: "teams-manager-ee4dc.appspot.com",
  messagingSenderId: "283547376101",
  appId: "1:283547376101:web:b4cb194b57d5c7b5d2f70c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;

