import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCgPNsBkCHmjWU25h5H1Vmwot0aZ2cjhY8",
  authDomain: "tnl-ielts.firebaseapp.com",
  projectId: "tnl-ielts",
  storageBucket: "tnl-ielts.firebasestorage.app",
  messagingSenderId: "1030106879947",
  appId: "1:1030106879947:web:d14588c9a4c8d9d9c9c84e",
  measurementId: "G-58WTBJMVV1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
