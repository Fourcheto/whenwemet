import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAWCWWXOKWhak2vzqmf_38E_kAuIGlhsgk",
  authDomain: "whenwemet-4dbb0.firebaseapp.com",
  databaseURL: "https://whenwemet-4dbb0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whenwemet-4dbb0",
  storageBucket: "whenwemet-4dbb0.firebasestorage.app",
  messagingSenderId: "956991898843",
  appId: "AIzaSyAWCWWXOKWhak2vzqmf_38E_kAuIGlhsgk"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);