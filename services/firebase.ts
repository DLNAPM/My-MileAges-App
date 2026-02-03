import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCEFzYFi_pqNRqKltRA8jLp4OiVUifHeno",
  authDomain: "my-mileages.firebaseapp.com",
  projectId: "my-mileages",
  storageBucket: "my-mileages.firebasestorage.app",
  messagingSenderId: "992516193093",
  appId: "1:992516193093:web:ee4d6df189051ff0209c2c",
  measurementId: "G-ZS5KY4LFB0"
};

// Initialize only if not already initialized
const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);

export const auth = app.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const db = app.firestore();