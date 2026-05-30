import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDJ26FTZFE-dnfl_YNIvEUQDNmX76q1Ocw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "gimbiya-mall.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "gimbiya-mall",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "gimbiya-mall.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "243707171205",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:243707171205:web:b71b9dbc4359f838c1b4ec",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-2EP8C94V00",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
