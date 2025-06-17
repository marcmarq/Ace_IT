import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyADt4qfw0yOSjcS3HCpzVfHhhv9L9A5Y8Y",
  authDomain: "aceit-4a85f.firebaseapp.com",
  projectId: "aceit-4a85f",
  storageBucket: "aceit-4a85f.firebasestorage.app",
  messagingSenderId: "893453845209",
  appId: "1:893453845209:web:c5e15f4c4ac0dff33474c8",
  measurementId: "G-33ZFEWY7SV"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app)
export const db = getFirestore(app)