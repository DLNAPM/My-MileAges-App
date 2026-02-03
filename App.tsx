import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { VehicleManager } from './components/VehicleManager';
import { TripLogger } from './components/TripLogger';
import { Reports } from './components/Reports';
import { User, ViewState, Vehicle, Trip } from './types';
import { storageService } from './services/storage';
import { HelpCircle, X, Settings, AlertTriangle, Save } from 'lucide-react';

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

// --- Config Modal for Missing Keys ---
const ConfigModal = ({ onClose }: { onClose: () => void }) => {
  const [jsonConfig, setJsonConfig] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Pre-fill with existing if available
    const existing = localStorage.getItem('mileages_firebase_config');
    if (existing) {
      setJsonConfig(existing);
    } else {
      // Clean template
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
      window.location.reload(); // Reload to apply changes
    } catch (e) {
      setError("Invalid JSON format. Please copy the config object directly from Firebase Console.");
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
            <strong>Firebase Setup Required:</strong> It seems the application is missing valid Firebase credentials.
            <br/><br/>
            Please paste your Firebase project configuration object below. This will be saved to your browser's local storage.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Firebase Configuration JSON</label>
            <textarea
              className="w-full h-48 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={jsonConfig}
              onChange={(e) => setJsonConfig(e.target.value)}
              placeholder="{ apiKey: ... }"
            />
          </div>
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex space-x-3">
             <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
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
  const [loading, setLoading] = useState(true);

  // Common Error Handler
  const handleAuthError = (error: any) => {
    console.error("Auth/Config Error:", error);
    if (error.code === 'auth/invalid-api-key' || error.message?.includes('apiKey') || error.message?.includes('Missing API Key')) {
      setShowConfig(true);
    } else {
      alert(`Authentication Error: ${error.message}`);
    }
  };

  // Auth & Data Loading
  useEffect(() => {
    // Immediate check for configuration existence to avoid unnecessary loads
    const hasEnvKey = process.env.FIREBASE_API_KEY && process.env.FIREBASE_API_KEY !== "YOUR_API_KEY";
    const hasLocalKey = !!localStorage.getItem('mileages_firebase_config');

    if (!hasEnvKey && !hasLocalKey) {
       // Stop here, don't try to observe auth which might throw errors
       setLoading(false);
       setShowConfig(true);
       return;
    }

    const unsubscribe = storageService.observeAuth(
      async (currentUser) => {
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
            console.error("Error fetching data:", err);
          }
        } else {
          setVehicles([]);
          setTrips([]);
          setView('landing');
        }
        setLoading(false);
      },
      // Error Callback for ObserveAuth
      (error) => {
        setLoading(false);
        handleAuthError(error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await storageService.login();
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const handleLogout = async () => {
    await storageService.logout();
  };

  const handleAddVehicle = async (v: Vehicle) => {
    const updated = await storageService.saveVehicle(v);
    setVehicles(updated);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm('Are you sure? This will not delete trips associated with this vehicle.')) {
      const updated = await storageService.deleteVehicle(id);
      setVehicles(updated);
    }
  };

  const handleSaveTrip = async (t: Trip) => {
    const updated = await storageService.saveTrip(t);
    setTrips(updated);
    setView('dashboard');
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
        <div className="relative">
          <LandingPage onLogin={handleLogin} onHelp={() => setShowHelp(true)} />
          {/* Config button always available on landing page */}
          <button 
            onClick={() => setShowConfig(true)}
            className="fixed bottom-4 right-4 p-2 text-slate-500 hover:text-slate-300 transition-colors z-50 bg-slate-800/50 rounded-full"
            title="Configure App"
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
              onCancel={() => setView('dashboard')}
            />
          )}
          {view === 'reports' && (
            <Reports trips={trips} vehicles={vehicles} />
          )}
        </Layout>
      )}
      
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
    </>
  );
}

export default App;