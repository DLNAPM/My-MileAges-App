import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Helper to get config from env or local storage
const getFirebaseConfig = () => {
  // 1. Try Local Storage (allows runtime config without rebuilding)
  const stored = localStorage.getItem('mileages_firebase_config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey) return parsed;
    } catch (e) {
      console.warn("Invalid Firebase config in localStorage, falling back to env.");
    }
  }

  // 2. Fallback to Environment Variables
  // We check if the key actually exists and isn't a placeholder
  const envKey = process.env.FIREBASE_API_KEY;
  if (envKey && envKey.length > 0 && envKey !== "YOUR_API_KEY") {
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };
  }

  return null;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
// We only initialize if we have a valid config to prevent "invalid-api-key" errors
let app: any; // Using any to avoid potential type issues if FirebaseApp is not exported
let auth: Auth | undefined;
let db: Firestore | undefined;
let isInitialized = false;

if (firebaseConfig) {
  try {
    // Check if initialized using namespace properties to avoid import errors
    const getApps = firebaseApp.getApps;
    const getApp = firebaseApp.getApp;
    const initializeApp = firebaseApp.initializeApp;

    const apps = getApps ? getApps() : [];
    app = (apps.length > 0 && getApp) ? getApp() : initializeApp(firebaseConfig);
    
    auth = getAuth(app);
    db = getFirestore(app);
    isInitialized = true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export const googleProvider = new GoogleAuthProvider();
// Export these as potentially undefined. Consumers must check isInitialized or handle errors.
export { auth, db, isInitialized };