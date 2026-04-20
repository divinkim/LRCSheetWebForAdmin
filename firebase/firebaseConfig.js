import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBB_fGNjfj2w8Y4lgG2nGw0vxrevVcaVb0",
  authDomain: "lrcsheetmobile.firebaseapp.com",
  databaseURL: "https://lrcsheetmobile-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lrcsheetmobile",
  storageBucket: "lrcsheetmobile.firebasestorage.app",
  messagingSenderId: "239069891450",
  appId: "1:239069891450:web:ee8abf82c22a2b56b824c3",
  measurementId: "G-P1ZQL9MLWE"
};


const app = initializeApp(firebaseConfig);

// ✅ NE PAS initialiser messaging côté serveur
export const getFirebaseMessaging = () => {
  if (typeof window !== "undefined") {
    return getMessaging(app);
  }
  return null;
};