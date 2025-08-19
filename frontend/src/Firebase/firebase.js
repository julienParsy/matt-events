// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDLsOUTYSqXjLFe-lXPPyLcYB2iGxEVOD4",
    authDomain: "mp-location-7594e.firebaseapp.com",
    projectId: "mp-location-7594e",
    storageBucket: "mp-location-7594e.firebasestorage.app",
    messagingSenderId: "515419818471",
    appId: "1:515419818471:web:dd00fd52cb81ccb312d542"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
