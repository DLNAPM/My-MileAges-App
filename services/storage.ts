import { Trip, Vehicle, User } from '../types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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
    const result = await signInWithPopup(auth, googleProvider);
    return formatUser(result.user);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Subscribes to Auth State changes.
   * Returns an unsubscribe function.
   */
  observeAuth(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (fbUser) => {
      callback(fbUser ? formatUser(fbUser) : null);
    });
  },

  // --- Vehicle Methods ---

  async getVehicles(): Promise<Vehicle[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
    const snapshot = await getDocs(vehiclesRef);
    return snapshot.docs.map(doc => doc.data() as Vehicle);
  },

  async saveVehicle(vehicle: Vehicle): Promise<Vehicle[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // We use setDoc with the vehicle.id to ensure we create or update the specific document
    // logic remains similar: the UI generates the ID, so we trust it.
    const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicle.id);
    await setDoc(vehicleRef, vehicle);

    // Return updated list
    return this.getVehicles();
  },

  async deleteVehicle(id: string): Promise<Vehicle[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    await deleteDoc(doc(db, 'users', user.uid, 'vehicles', id));
    return this.getVehicles();
  },

  // --- Trip Methods ---

  async getTrips(): Promise<Trip[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const tripsRef = collection(db, 'users', user.uid, 'trips');
    // Sort by date descending
    const q = query(tripsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    
    // Sort logic in code as well in case of time clashes or string date formats
    const trips = snapshot.docs.map(doc => doc.data() as Trip);
    return trips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async saveTrip(trip: Trip): Promise<Trip[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const tripRef = doc(db, 'users', user.uid, 'trips', trip.id);
    await setDoc(tripRef, trip);

    return this.getTrips();
  },

  async deleteTrip(id: string): Promise<Trip[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    await deleteDoc(doc(db, 'users', user.uid, 'trips', id));
    return this.getTrips();
  },

  // --- Helpers for Autocomplete ---

  async getUniqueDestinations(): Promise<string[]> {
    // Note: Firestore doesn't support SELECT DISTINCT natively.
    // For small/medium datasets, client-side filtering is acceptable.
    const trips = await this.getTrips();
    const destinations = new Set(trips.map(t => t.destination).filter((d): d is string => !!d));
    return Array.from(destinations) as string[];
  },

  async getUniqueCompanies(): Promise<string[]> {
    const trips = await this.getTrips();
    const companies = new Set(trips.map(t => t.company).filter((c): c is string => !!c));
    return Array.from(companies) as string[];
  }
};