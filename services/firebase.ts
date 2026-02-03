import { initializeApp } from "firebase/app";
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
// Using ReturnType to avoid importing FirebaseApp type explicitly if it causes issues
let app: ReturnType<typeof initializeApp> | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let isInitialized = false;

if (firebaseConfig) {
  try {
    // In a standard module system, this runs once. 
    // We catch potential duplicate app errors if HMR re-runs this.
    try {
      app = initializeApp(firebaseConfig);
    } catch (e: any) {
       // If app is already initialized (e.g. HMR), we can't easily retrieve it without getApp
       // but strictly speaking for production build this shouldn't happen.
       // We'll log it and proceed (auth/db will attach to default app if app is undefined)
       if (e.code !== 'app/duplicate-app') {
         throw e;
       }
       console.warn("Firebase app initialized multiple times (likely HMR)");
    }
    
    // If app is undefined (duplicate), getAuth() and getFirestore() use the default app.
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