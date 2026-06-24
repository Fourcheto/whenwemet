import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA7SP2H5EkqdTpFoVrpH7zgQ0OpyLzauaQ",
  authDomain: "whenwemet-4dbb0.firebaseapp.com",
  databaseURL: "https://whenwemet-4dbb0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whenwemet-4dbb0",
  storageBucket: "whenwemet-4dbb0.firebasestorage.app",
  messagingSenderId: "956991898843",
  appId: "1:956991898843:web:1901544fc2a1dcc86338fe"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);