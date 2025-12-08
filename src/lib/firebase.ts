import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";



const firebaseConfig = {
  apiKey: "AIzaSyCfHw1PRkqQy-6G4xa34uWmEJUlQlgM63E",
  authDomain: "game-408ac.firebaseapp.com",
  projectId: "game-408ac",
  storageBucket: "game-408ac.firebasestorage.app",
  messagingSenderId: "718848867890",
  appId: "1:718848867890:web:53cd26080a9ec82d6d862b",
  measurementId: "G-2Q85WQW125"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
