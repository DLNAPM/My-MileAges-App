import { Trip, Vehicle, User } from '../types';
import { auth, db, googleProvider, isInitialized } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, AuthError } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

// Helper to format Firebase user to App User
const formatUser = (fbUser: FirebaseUser): User => ({
  uid: fbUser.uid,
  email: fbUser.email || '',
  displayName: fbUser.displayName || 'User',
  photoURL: fbUser.photoURL || undefined
});

export const storageService = {
  // --- Auth Methods ---

  async login(): Promise<User> {
    if (!isInitialized || !auth) throw new Error("Firebase not initialized. Please configure API keys.");
    const result = await signInWithPopup(auth, googleProvider);
    return formatUser(result.user);
  },

  async logout(): Promise<void> {
    if (!isInitialized || !auth) return;
    await signOut(auth);
  },

  /**
   * Subscribes to Auth State changes.
   * Returns an unsubscribe function.
   * Accepts an optional error callback to handle initialization errors (like invalid API keys).
   */
  observeAuth(
    callback: (user: User | null) => void,
    onError?: (error: AuthError) => void
  ): () => void {
    if (!isInitialized || !auth) {
      // If not initialized, we can treat this as an error state or just null user
      // Calling onError allows the UI to show the config modal
      if (onError) {
        // Create a fake AuthError to trigger the config modal
        onError({ 
          code: 'auth/invalid-api-key', 
          message: 'Missing or invalid Firebase Configuration' 
        } as any);
      }
      return () => {};
    }

    return onAuthStateChanged(
      auth, 
      (fbUser) => {
        callback(fbUser ? formatUser(fbUser) : null);
      },
      (error) => {
        console.error("Auth Observer Error:", error);
        if (onError) onError(error);
      }
    );
  },

  // --- Vehicle Methods ---

  async getVehicles(): Promise<Vehicle[]> {
    if (!isInitialized || !auth || !db) return [];
    const user = auth.currentUser;
    if (!user) return [];

    const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
    const snapshot = await getDocs(vehiclesRef);
    return snapshot.docs.map(doc => doc.data() as Vehicle);
  },

  async saveVehicle(vehicle: Vehicle): Promise<Vehicle[]> {
    if (!isInitialized || !auth || !db) throw new Error("Firebase not configured");
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicle.id);
    await setDoc(vehicleRef, vehicle);

    // Return updated list
    return this.getVehicles();
  },

  async deleteVehicle(id: string): Promise<Vehicle[]> {
    if (!isInitialized || !auth || !db) throw new Error("Firebase not configured");
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    await deleteDoc(doc(db, 'users', user.uid, 'vehicles', id));
    return this.getVehicles();
  },

  // --- Trip Methods ---

  async getTrips(): Promise<Trip[]> {
    if (!isInitialized || !auth || !db) return [];
    const user = auth.currentUser;
    if (!user) return [];

    const tripsRef = collection(db, 'users', user.uid, 'trips');
    const q = query(tripsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    
    const trips = snapshot.docs.map(doc => doc.data() as Trip);
    return trips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async saveTrip(trip: Trip): Promise<Trip[]> {
    if (!isInitialized || !auth || !db) throw new Error("Firebase not configured");
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const tripRef = doc(db, 'users', user.uid, 'trips', trip.id);
    await setDoc(tripRef, trip);

    return this.getTrips();
  },

  async deleteTrip(id: string): Promise<Trip[]> {
    if (!isInitialized || !auth || !db) throw new Error("Firebase not configured");
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    await deleteDoc(doc(db, 'users', user.uid, 'trips', id));
    return this.getTrips();
  },

  // --- Helpers for Autocomplete ---

  async getUniqueDestinations(): Promise<string[]> {
    if (!isInitialized) return [];
    const trips = await this.getTrips();
    const destinations = new Set(trips.map(t => t.destination).filter((d): d is string => !!d));
    return Array.from(destinations) as string[];
  },

  async getUniqueCompanies(): Promise<string[]> {
    if (!isInitialized) return [];
    const trips = await this.getTrips();
    const companies = new Set(trips.map(t => t.company).filter((c): c is string => !!c));
    return Array.from(companies) as string[];
  }
};