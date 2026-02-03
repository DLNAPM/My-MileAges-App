import React, { useState, useEffect } from 'react';
import { Trip, Vehicle } from '../types';
import { storageService } from '../services/storage';
import { Save, Calendar, Clock, MapPin, Building, RotateCcw } from 'lucide-react';

interface TripLoggerProps {
  vehicles: Vehicle[];
  onSave: (trip: Trip) => Promise<void>;
  onCancel: () => void;
}

export const TripLogger: React.FC<TripLoggerProps> = ({ vehicles, onSave, onCancel }) => {
  const [destinations, setDestinations] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  
  const [trip, setTrip] = useState<Partial<Trip>>({
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    vehicleId: vehicles.length > 0 ? vehicles[0].id : '',
    startOdometer: 0,
    endOdometer: 0,
    destination: '',
    company: ''
  });

  useEffect(() => {
    const loadHistory = async () => {
      const [dest, comp] = await Promise.all([
        storageService.getUniqueDestinations(),
        storageService.getUniqueCompanies()
      ]);
      setDestinations(dest);
      setCompanies(comp);
      
      // Auto-fill odometer if possible
      if (trip.vehicleId) {
        const trips = await storageService.getTrips();
        const vehicleTrips = trips.filter(t => t.vehicleId === trip.vehicleId);
        if (vehicleTrips.length > 0) {
          const lastTrip = vehicleTrips[0]; // Assuming sorted desc
          setTrip(prev => ({
            ...prev,
            startOdometer: lastTrip.endOdometer
          }));
        }
      }
    };
    loadHistory();
  }, [trip.vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip.vehicleId || !trip.endOdometer || !trip.startOdometer) return;

    const newTrip: Trip = {
      id: crypto.randomUUID(),
      vehicleId: trip.vehicleId,
      date: trip.date!,
      startTime: trip.startTime!,
      startOdometer: Number(trip.startOdometer),
      endOdometer: Number(trip.endOdometer),
      distance: Number(trip.endOdometer) - Number(trip.startOdometer),
      destination: trip.destination || 'Unspecified',
      company: trip.company || 'Unspecified',
      timestamp: Date.now()
    };

    await onSave(newTrip);
  };

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg text-slate-600">Please add a vehicle first.</h3>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold">Log New Trip</h2>
          <p className="opacity-90">Enter your mileage details below.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Vehicle</label>
            <select
              className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={trip.vehicleId}
              onChange={e => setTrip({ ...trip, vehicleId: e.target.value })}
              required
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.nickname} ({v.make} {v.model})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={14} /> Date
              </label>
              <input
                type="date"
                required
                className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500"
                value={trip.date}
                onChange={e => setTrip({ ...trip, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={14} /> Start Time
              </label>
              <input
                type="time"
                required
                className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500"
                value={trip.startTime}
                onChange={e => setTrip({ ...trip, startTime: e.target.value })}
              />
            </div>

            {/* Odometer */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Odometer</label>
              <input
                type="number"
                required
                min="0"
                className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500"
                value={trip.startOdometer}
                onChange={e => setTrip({ ...trip, startOdometer: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Odometer</label>
              <input
                type="number"
                required
                min={trip.startOdometer}
                className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500"
                value={trip.endOdometer}
                onChange={e => setTrip({ ...trip, endOdometer: Number(e.target.value) })}
              />
              {Number(trip.endOdometer) > Number(trip.startOdometer) && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Distance: {(Number(trip.endOdometer) - Number(trip.startOdometer)).toFixed(1)} miles
                </p>
              )}
            </div>

            {/* Destination & Company with Datalist for autocomplete */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <MapPin size={14} /> Destination
              </label>
              <input
                type="text"
                list="destinations-list"
                required
                placeholder="e.g. Client Office"
                className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500"
                value={trip.destination}
                onChange={e => setTrip({ ...trip, destination: e.target.value })}
              />
              <datalist id="destinations-list">
                {destinations.map((d, i) => <option key={i} value={d} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Building size={14} /> Company/Client
              </label>
              <input
                type="text"
                list="companies-list"
                required
                placeholder="e.g. Acme Corp"
                className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500"
                value={trip.company}
                onChange={e => setTrip({ ...trip, company: e.target.value })}
              />
              <datalist id="companies-list">
                {companies.map((c, i) => <option key={i} value={c} />)}
              </datalist>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-700 px-4 py-2 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 shadow-md flex items-center space-x-2 font-semibold transition-transform active:scale-95"
            >
              <Save size={18} />
              <span>Save Trip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};