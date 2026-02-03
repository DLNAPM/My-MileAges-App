import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { VehicleManager } from './components/VehicleManager';
import { TripLogger } from './components/TripLogger';
import { Reports } from './components/Reports';
import { User, ViewState, Vehicle, Trip } from './types';
import { storageService } from './services/storage';
import { HelpCircle, X } from 'lucide-react';

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

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth & Data Loading
  useEffect(() => {
    // Subscribe to Auth State
    const unsubscribe = storageService.observeAuth(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // If we are on landing, move to dashboard
        if (view === 'landing') setView('dashboard');
        
        // Fetch Data
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
        // Clear data on logout/no user
        setVehicles([]);
        setTrips([]);
        setView('landing');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Only setup observer on mount

  const handleLogin = async () => {
    try {
      await storageService.login();
      // Observer in useEffect will handle state updates
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await storageService.logout();
    // Observer in useEffect will handle state updates
  };

  // CRUD Handlers
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
        <LandingPage onLogin={handleLogin} onHelp={() => setShowHelp(true)} />
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
    </>
  );
}

export default App;