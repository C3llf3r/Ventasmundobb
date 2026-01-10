import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPEUWLVAOzr_Ip-FUm_HDw17kZe6qlQbY",
  authDomain: "ventas-mundobb.firebaseapp.com",
  projectId: "ventas-mundobb",
  storageBucket: "ventas-mundobb.firebasestorage.app",
  messagingSenderId: "1079837283726",
  appId: "1:1079837283726:web:00de1b80ca4569ef0f00df"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
