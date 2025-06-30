// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrzwbUNVGWMnZuQcm5nYU2GqhpBnwVFik",
  authDomain: "my-book-app-f00b1.firebaseapp.com",
  projectId: "my-book-app-f00b1",
  storageBucket: "my-book-app-f00b1.firebasestorage.app",
  messagingSenderId: "153791352",
  appId: "1:153791352:web:e3233eb25f5a73da1eb68d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 