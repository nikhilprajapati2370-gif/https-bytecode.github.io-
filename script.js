// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASSaCcT6gK2Fn2awLJoyTYjYI-eYGOWjg",
  authDomain: "bytecode-ad6e7.firebaseapp.com",
  projectId: "bytecode-ad6e7",
  storageBucket: "bytecode-ad6e7.firebasestorage.app",
  messagingSenderId: "728517154808",
  appId: "1:728517154808:web:4ca2258140bd936f11280d",
  measurementId: "G-BZJ3L4EDMR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
