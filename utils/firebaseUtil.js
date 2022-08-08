// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDOP0pX35KF3JcuyUrSQDAh8H1fk1Yr4gA",
    authDomain: "the-most-accurate-clock.firebaseapp.com",
    projectId: "the-most-accurate-clock",
    storageBucket: "the-most-accurate-clock.appspot.com",
    messagingSenderId: "175524844012",
    appId: "1:175524844012:web:9ce8e4068a1486823bb0c9",
    measurementId: "G-6QYJP2FRBQ",
    databaseURL: "https://the-most-accurate-clock-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase();
// const analytics = getAnalytics(app);

export { app, database };