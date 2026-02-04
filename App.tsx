import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { VehicleManager } from './components/VehicleManager';
import { TripLogger } from './components/TripLogger';
import { Reports } from './components/Reports';
import { User, ViewState, Vehicle, Trip } from './types';
import { storageService } from './services/storage';
import { HelpCircle, X, Settings, AlertTriangle, Save, ShieldAlert } from 'lucide-react';

// --- Mock Data Generator ---
const generateMockData = () => {
  const vehicles: Vehicle[] = [
    { id: 'v1', make: 'Toyota', model: 'Camry', year: '2023', nickname: 'Daily Commuter' },
    { id: 'v2', make: 'Ford', model: 'F-150', year: '2021', nickname: 'Work Truck' },
    { id: 'v3', make: 'Tesla', model: 'Model 3', year: '2024', nickname: 'Electric' }
  ];

  const trips: Trip[] = [];
  const now = new Date();
  const destinations = ['Client Office', 'Supply Depot', 'Airport', 'Downtown HQ', 'Site Visit'];
  const companies = ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp'];

  // Helper to subtract days
  const subDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };

  // Generate 60 trips spread over ~4 months
  for (let i = 0; i < 60; i++) {
    // Generate dates so we have "Today", "Yesterday", "Last Week", etc.
    // Skew towards recent
    let daysAgo;
    if (i < 2) daysAgo = 0; // Today
    else if (i < 4) daysAgo = 1; // Yesterday
    else if (i < 10) daysAgo = Math.floor(Math.random() * 5) + 2; // Last Week
    else daysAgo = Math.floor(i * 2); // Older

    const date = subDays(now, daysAgo);
    const v = vehicles[i % vehicles.length];
    const start = 10000 + (i * 45);
    const dist = 15 + Math.floor(Math.random() * 60);
    
    trips.push({
      id: `t${i}`,
      vehicleId: v.id,
      date: date.toISOString().split('T')[0],
      startTime: '09:00',
      startOdometer: start,
      endOdometer: start + dist,
      distance: dist,
      destination: destinations[i % destinations.length],
      company: companies[i % companies.length],
      timestamp: date.getTime()
    });
  }
  
  // Sort mock trips by date desc
  trips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { vehicles, trips };
};

// --- Permission Error Modal ---
const PermissionErrorModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-slate-900/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
    <div className="bg-white rounded-xl max-w-lg w-full p-8 shadow-2xl relative border-t-4 border-red-500">
      <div className="flex items-center space-x-3 mb-6 text-red-600">
        <ShieldAlert size={32} />
        <h2 className="text-2xl font-bold text-slate-900">Database Permission Denied</h2>
      </div>
      
      <div className="space-y-4 text-slate-600 mb-8">
        <p>Your app is connected to Firebase, but your <strong>Firestore Security Rules</strong> are blocking the operation.</p>
        
        <div className="bg-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-200">
          <p className="text-blue-700 font-bold mb-2">// Copy this to your Firebase Console &gt; Firestore &gt; Rules:</p>
          <pre className="mt-2 text-slate-800">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      // Owner Access
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Shared Access (Future Proofing)
      allow read: if request.auth != null && request.auth.uid in resource.data.sharedWith;
    }
  }
}`}</pre>
        </div>
        
        <p className="text-sm">This rule allows you to manage your data and enables future sharing capabilities.</p>
      </div>

      <button 
        onClick={onClose}
        className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
      >
        I've updated my rules
      </button>
    </div>
  </div>
);

// --- Help Modal ---
const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <X size={24} />
      </button>
      <div className="flex items-center space-x-3 mb-4 text-blue-600">
        <HelpCircle size={28} />
        <h2 className="text-xl font-bold text-slate-900">How to use My MileAges</h2>
      </div>
      <div className="space-y-4 text-slate-600">
        <p><strong className="text-slate-800">1. Add a Vehicle:</strong> Go to the Vehicles tab and add your car(s) before logging trips.</p>
        <p><strong className="text-slate-800">2. Log a Trip:</strong> Use the Log Trip button. The app remembers your frequent destinations for faster entry.</p>
        <p><strong className="text-slate-800">3. View Reports:</strong> Check the Reports tab to see daily, weekly, or yearly breakdowns and export your data.</p>
        <p><strong className="text-slate-800">4. Gemini Insights:</strong> On the reports page, click "Ask Gemini" to get an AI summary of your driving habits.</p>
      </div>
      <button 
        onClick={onClose}
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
      >
        Got it!
      </button>
    </div>
  </div>
);

// --- Config Modal ---
const ConfigModal = ({ onClose }: { onClose: () => void }) => {
  const [jsonConfig, setJsonConfig] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const existing = localStorage.getItem('mileages_firebase_config');
    if (existing) {
      setJsonConfig(existing);
    } else {
      setJsonConfig(`{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.firebasestorage.app",
  "messagingSenderId": "SENDER_ID",
  "appId": "APP_ID"
}`);
    }
  }, []);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonConfig);
      if (!parsed.apiKey) throw new Error("Missing apiKey in JSON");
      localStorage.setItem('mileages_firebase_config', JSON.stringify(parsed));
      window.location.reload();
    } catch (e) {
      setError("Invalid JSON format.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
        <div className="flex items-center space-x-3 mb-4 text-amber-600">
          <Settings size={28} />
          <h2 className="text-xl font-bold text-slate-900">App Configuration</h2>
        </div>
        <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>Firebase Setup Required:</strong> Paste your project configuration object from the Firebase Console.
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Alternatively, set environment variables (e.g., <code>FIREBASE_API_KEY</code> or <code>VITE_FIREBASE_API_KEY</code>) in your hosting provider and reload.
          </p>
        </div>
        <div className="space-y-4">
          <textarea
            className="w-full h-48 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            value={jsonConfig}
            onChange={(e) => setJsonConfig(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex space-x-3">
             <button onClick={onClose} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
             <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center space-x-2">
              <Save size={18} />
              <span>Save & Reload</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleAuthError = (error: any) => {
    if (error.code === 'auth/invalid-api-key' || error.message?.includes('apiKey')) {
      setShowConfig(true);
    } else if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      setShowPermissionError(true);
    } else {
      console.error("Auth/Config Error:", error);
    }
  };

  useEffect(() => {
    // Check if Firebase is actually configured (env vars OR local storage)
    const isConfigured = storageService.isConfigured();
    
    if (!isConfigured) {
       console.log("App: Firebase not configured, showing config modal.");
       setLoading(false);
       setShowConfig(true);
       return;
    }

    const unsubscribe = storageService.observeAuth(
      async (currentUser) => {
        // If we are already in guest mode, don't overwrite with null from auth observer
        if (user?.isGuest) return;

        setUser(currentUser);
        if (currentUser) {
          if (view === 'landing') setView('dashboard');
          try {
            const [v, t] = await Promise.all([
              storageService.getVehicles(),
              storageService.getTrips()
            ]);
            setVehicles(v);
            setTrips(t);
          } catch (err) {
            handleAuthError(err);
          }
        } else {
          setVehicles([]);
          setTrips([]);
          setView('landing');
        }
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleAuthError(error);
      }
    );
    return () => unsubscribe();
  }, [user?.isGuest]); // Dependency ensures we don't clobber guest state

  const handleLogin = async () => {
    try {
      await storageService.login();
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const handleGuestLogin = () => {
    const mockData = generateMockData();
    setUser({
      uid: 'guest-' + Date.now(),
      email: 'guest@example.com',
      displayName: 'Guest User',
      isGuest: true,
      photoURL: 'https://ui-avatars.com/api/?name=Guest+User&background=6366f1&color=fff'
    });
    setVehicles(mockData.vehicles);
    setTrips(mockData.trips);
    setView('dashboard');
  };

  const handleLogout = async () => {
    if (user?.isGuest) {
      setUser(null);
      setVehicles([]);
      setTrips([]);
      setView('landing');
    } else {
      await storageService.logout();
    }
  };

  const handleAddVehicle = async (v: Vehicle) => {
    if (user?.isGuest) {
      alert("Guest Mode is Read-Only. Changes are not saved.");
      return;
    }
    try {
      const updated = await storageService.saveVehicle(v);
      setVehicles(updated);
    } catch (err) {
      handleAuthError(err);
      throw err; 
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (user?.isGuest) {
      alert("Guest Mode is Read-Only. Changes are not saved.");
      return;
    }
    if (confirm('Are you sure?')) {
      const updated = await storageService.deleteVehicle(id);
      setVehicles(updated);
    }
  };

  const handleSaveTrip = async (t: Trip) => {
    if (user?.isGuest) {
      alert("Guest Mode is Read-Only. Changes are not saved.");
      return;
    }
    try {
      const updated = await storageService.saveTrip(t);
      setTrips(updated);
      if (view === 'log_trip') setView('dashboard');
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  };

  const handleBatchSaveTrips = async (newTrips: Trip[]) => {
    if (user?.isGuest) {
      alert("Guest Mode is Read-Only. Changes are not saved.");
      return;
    }
    try {
      const updated = await storageService.batchSaveTrips(newTrips);
      setTrips(updated);
      setView('dashboard');
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {view === 'landing' ? (
        <div className="relative h-screen overflow-y-auto">
          <LandingPage onLogin={handleLogin} onGuestLogin={handleGuestLogin} onHelp={() => setShowHelp(true)} />
          <button 
            onClick={() => setShowConfig(true)}
            className="fixed bottom-4 right-4 p-2 text-slate-500 hover:text-slate-300 transition-colors z-50 bg-slate-800/50 rounded-full"
          >
            <Settings size={16} />
          </button>
        </div>
      ) : (
        <Layout 
          user={user} 
          currentView={view} 
          setView={setView} 
          onLogout={handleLogout}
          onShowHelp={() => setShowHelp(true)}
        >
          {view === 'dashboard' && user && (
            <Dashboard 
              user={user} 
              trips={trips} 
              vehicles={vehicles}
              onLogTrip={() => setView('log_trip')}
              onViewReports={() => setView('reports')}
            />
          )}
          {view === 'vehicles' && (
            <VehicleManager 
              vehicles={vehicles}
              onAdd={handleAddVehicle}
              onDelete={handleDeleteVehicle}
            />
          )}
          {view === 'log_trip' && (
            <TripLogger 
              vehicles={vehicles}
              onSave={handleSaveTrip}
              onBatchSave={handleBatchSaveTrips}
              onCancel={() => setView('dashboard')}
            />
          )}
          {view === 'reports' && (
            <Reports 
              trips={trips} 
              vehicles={vehicles} 
              onUpdateTrip={handleSaveTrip}
            />
          )}
        </Layout>
      )}
      
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
      {showPermissionError && <PermissionErrorModal onClose={() => setShowPermissionError(false)} />}
    </>
  );
}

export default App;