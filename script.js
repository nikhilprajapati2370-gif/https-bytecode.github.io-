// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnV77fTs7K1UgF9BoQMG4R8278lOC6rao",
  authDomain: "bytecodee-3ca77.firebaseapp.com",
  projectId: "bytecodee-3ca77",
  storageBucket: "bytecodee-3ca77.firebasestorage.app",
  messagingSenderId: "318680597639",
  appId: "1:318680597639:web:ba8dc795ea53e6f863e422",
  measurementId: "G-MBJ5JCZ5F8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
