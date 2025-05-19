// src/firebase.js
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // Add this import

const firebaseConfig = {
  apiKey: "AIzaSyBPDRkkRU4-XiSYxaSlI4VjGi27Iii3ohk",
  authDomain: "hin-login.firebaseapp.com",
  projectId: "hin-login",
  storageBucket: "hin-login.firebasestorage.app",
  messagingSenderId: "891861195310",
  appId: "1:891861195310:web:568c41746ef6a5f4615dbf",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // Add this export
