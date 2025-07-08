// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPmZW3iH-_MgjGNGNtYjhUd4f_0D2YCSg",
  authDomain: "yeapp-stage.firebaseapp.com",
  projectId: "yeapp-stage",
  storageBucket: "yeapp-stage.appspot.com",
  messagingSenderId: "7930085238",
  appId: "1:7930085238:web:4696b6b8a6be4af7c7c457",
  measurementId: "G-6064JYN46H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);