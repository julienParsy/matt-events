// File: src/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getStorage, connectStorageEmulator } from "firebase/storage";
// (Optionnel) App Check si tu l'utilises
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ⚠️ Assure-toi que ces variables existent en build (Vercel/Vite)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,        
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,          
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,  
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Évite la double init en cas de HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Optionnel : App Check si clé fournie
if (import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY) {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
    });
}

const storage = getStorage(app);

// Dev local : émulateur (si tu veux)
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true") {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
}

export { app, storage };
