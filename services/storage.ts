import { Trip, Vehicle, User } from '../types';

// Keys for local storage
const STORAGE_KEYS = {
  USER: 'mymileages_user',
  VEHICLES: 'mymileages_vehicles',
  TRIPS: 'mymileages_trips'
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  // User Auth Simulation
  async login(): Promise<User> {
    await delay(800);
    const mockUser: User = {
      uid: 'user_12345',
      email: 'driver@example.com',
      displayName: 'Alex Driver',
      photoURL: 'https://picsum.photos/100/100'
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    return mockUser;
  },

  async logout(): Promise<void> {
    await delay(300);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  // Vehicle Methods
  async getVehicles(): Promise<Vehicle[]> {
    await delay(300);
    const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return data ? JSON.parse(data) : [];
  },

  async saveVehicle(vehicle: Vehicle): Promise<Vehicle[]> {
    await delay(300);
    const vehicles = await this.getVehicles();
    const existingIndex = vehicles.findIndex(v => v.id === vehicle.id);
    
    let newVehicles;
    if (existingIndex >= 0) {
      newVehicles = [...vehicles];
      newVehicles[existingIndex] = vehicle;
    } else {
      newVehicles = [...vehicles, vehicle];
    }
    
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(newVehicles));
    return newVehicles;
  },

  async deleteVehicle(id: string): Promise<Vehicle[]> {
    await delay(300);
    const vehicles = await this.getVehicles();
    const newVehicles = vehicles.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(newVehicles));
    return newVehicles;
  },

  // Trip Methods
  async getTrips(): Promise<Trip[]> {
    await delay(300);
    const data = localStorage.getItem(STORAGE_KEYS.TRIPS);
    return data ? JSON.parse(data) : [];
  },

  async saveTrip(trip: Trip): Promise<Trip[]> {
    await delay(300);
    const trips = await this.getTrips();
    const existingIndex = trips.findIndex(t => t.id === trip.id);
    
    let newTrips;
    if (existingIndex >= 0) {
      newTrips = [...trips];
      newTrips[existingIndex] = trip;
    } else {
      newTrips = [...trips, trip];
    }
    
    // Sort by date descending
    newTrips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(newTrips));
    return newTrips;
  },

  async deleteTrip(id: string): Promise<Trip[]> {
    await delay(300);
    const trips = await this.getTrips();
    const newTrips = trips.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(newTrips));
    return newTrips;
  },

  // Helpers for Autocomplete
  async getUniqueDestinations(): Promise<string[]> {
    const trips = await this.getTrips();
    const destinations = new Set(trips.map(t => t.destination).filter((d): d is string => !!d));
    return Array.from(destinations);
  },

  async getUniqueCompanies(): Promise<string[]> {
    const trips = await this.getTrips();
    const companies = new Set(trips.map(t => t.company).filter((c): c is string => !!c));
    return Array.from(companies);
  }
};