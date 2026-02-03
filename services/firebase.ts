// @ts-ignore
import { initializeApp, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Helper to get config from env or local storage
const getFirebaseConfig = () => {
  // 1. Try Local Storage (allows runtime config without rebuilding)
  const stored = localStorage.getItem('mileages_firebase_config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey) {
        console.log("Firebase: Loaded config from Local Storage");
        return parsed;
      }
    } catch (e) {
      console.warn("Invalid Firebase config in localStorage, falling back to env.");
    }
  }

  // 2. Try process.env (mapped via vite.config.ts)
  const envKey = process.env.FIREBASE_API_KEY;
  if (envKey && envKey.length > 0 && envKey !== "YOUR_API_KEY") {
    console.log("Firebase: Loaded config from process.env");
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };
  }

  // 3. Fallback: Try standard Vite import.meta.env (requires VITE_ prefix)
  // This is useful if Render variables were named VITE_FIREBASE_API_KEY
  const meta = import.meta as any;
  if (meta.env && meta.env.VITE_FIREBASE_API_KEY) {
    console.log("Firebase: Loaded config from import.meta.env");
    return {
      apiKey: meta.env.VITE_FIREBASE_API_KEY,
      authDomain: meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: meta.env.VITE_FIREBASE_APP_ID
    };
  }

  return null;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let isInitialized = false;

if (firebaseConfig) {
  try {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e: any) {
       // If app is already initialized (e.g. HMR), retrieve the existing instance
       if (e.code === 'app/duplicate-app') {
         app = getApp();
       } else {
         throw e;
       }
    }
    
    // Only initialize services if app was successfully created or retrieved
    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
      isInitialized = true;
      console.log("Firebase: Initialized successfully");
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase: No configuration found. App will require manual setup.");
}

export const googleProvider = new GoogleAuthProvider();
// Export these as potentially undefined. Consumers must check isInitialized.
export { auth, db, isInitialized };