export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isGuest?: boolean;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  licensePlate?: string;
  nickname?: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  startOdometer: number;
  endOdometer: number;
  distance: number;
  destination: string;
  company: string;
  notes?: string;
  timestamp: number;
}

export interface ReportFilter {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all';
  customStartDate?: string;
  customEndDate?: string;
  vehicleId?: string; // 'all' or specific ID
}

export type ViewState = 'landing' | 'dashboard' | 'vehicles' | 'log_trip' | 'reports';

export interface AppState {
  user: User | null;
  currentView: ViewState;
  vehicles: Vehicle[];
  trips: Trip[];
  isLoading: boolean;
}