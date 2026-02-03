import React from 'react';
import { Trip, Vehicle, User } from '../types';
import { PlusCircle, Map, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  user: User;
  trips: Trip[];
  vehicles: Vehicle[];
  onLogTrip: () => void;
  onViewReports: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, trips, vehicles, onLogTrip, onViewReports }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysTrips = trips.filter(t => t.date === today);
  const todaysMileage = todaysTrips.reduce((acc, t) => acc + t.distance, 0);
  
  // Calculate Streak or Total
  const totalTrips = trips.length;
  const totalMiles = trips.reduce((acc, t) => acc + t.distance, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.displayName.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-1">Here is your mileage summary for today.</p>
        </div>
        <button 
          onClick={onLogTrip}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md flex items-center space-x-2 font-semibold transition-transform active:scale-95"
        >
          <PlusCircle size={20} />
          <span>Log Trip</span>
        </button>
      </div>

      {vehicles.length === 0 && (
         <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md flex items-start">
            <AlertTriangle className="text-amber-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-800">Setup Required</h3>
              <p className="text-amber-700">You haven't added any vehicles yet. Go to the Vehicles tab to get started.</p>
            </div>
         </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Map size={24} />
            </div>
            <h3 className="font-medium text-slate-500">Today's Mileage</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{todaysMileage.toFixed(1)} <span className="text-sm font-normal text-slate-400">mi</span></p>
          <p className="text-xs text-slate-400 mt-1">{todaysTrips.length} trip(s) today</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-medium text-slate-500">Total Mileage</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalMiles.toFixed(1)} <span className="text-sm font-normal text-slate-400">mi</span></p>
           <p className="text-xs text-slate-400 mt-1">Lifetime total</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Clock size={24} />
            </div>
            <h3 className="font-medium text-slate-500">Recent Activity</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalTrips}</p>
          <p className="text-xs text-slate-400 mt-1">Total trips logged</p>
        </div>
      </div>

      {/* Recent Trips List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Recent Trips</h3>
          <button onClick={onViewReports} className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {trips.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No trips logged yet.</div>
          ) : (
            trips.slice(0, 5).map(trip => (
              <div key={trip.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center justify-center h-12 w-12 bg-slate-100 rounded-lg text-slate-500 font-bold text-xs">
                    <span>{new Date(trip.date).getDate()}</span>
                    <span className="uppercase">{new Date(trip.date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{trip.destination}</h4>
                    <p className="text-sm text-slate-500">{trip.company} • {trip.startTime}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-blue-600">{trip.distance} mi</span>
                  <span className="text-xs text-slate-400">
                    {vehicles.find(v => v.id === trip.vehicleId)?.nickname || 'Unknown Vehicle'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};