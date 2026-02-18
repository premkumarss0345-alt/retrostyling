import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAwTGEf-VCbekJm6nb5FSs2cXyrL0TrsZE",
  authDomain: "etro-bf494.firebaseapp.com",
  projectId: "etro-bf494",
  storageBucket: "etro-bf494.firebasestorage.app",
  messagingSenderId: "209654975466",
  appId: "1:209654975466:web:dc33eb27b7a3dbf0954093",
  measurementId: "G-58PFM4YYYG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export default app;
