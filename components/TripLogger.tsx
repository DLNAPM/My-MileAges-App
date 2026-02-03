import React, { useState, useEffect, useRef } from 'react';
import { Trip, Vehicle } from '../types';
import { storageService } from '../services/storage';
import { Save, Calendar, Clock, MapPin, Building, FileSpreadsheet, Upload, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

interface TripLoggerProps {
  vehicles: Vehicle[];
  onSave: (trip: Trip) => Promise<void>;
  onBatchSave?: (trips: Trip[]) => Promise<void>;
  onCancel: () => void;
}

type Mode = 'manual' | 'import';

export const TripLogger: React.FC<TripLoggerProps> = ({ vehicles, onSave, onBatchSave, onCancel }) => {
  const [mode, setMode] = useState<Mode>('manual');
  
  // Manual State
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

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedTrips, setParsedTrips] = useState<Partial<Trip>[]>([]);
  const [importVehicleId, setImportVehicleId] = useState<string>(vehicles.length > 0 ? vehicles[0].id : '');
  const [importError, setImportError] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleManualSubmit = async (e: React.FormEvent) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      parseFile(file);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) throw new Error("File appears empty or missing data.");

        const parsed: Partial<Trip>[] = [];
        // Assuming first row is header, skip it. 
        // We expect columns: Date, StartOdo, EndOdo, Destination, Company
        
        for (let i = 1; i < lines.length; i++) {
          // Simple CSV split (doesn't handle quoted commas perfectly, but sufficient for simple data)
          const cols = lines[i].split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
          
          if (cols.length < 3) continue; // Skip malformed lines

          const date = cols[0]; // YYYY-MM-DD preferred
          const startOdo = parseFloat(cols[1]);
          const endOdo = parseFloat(cols[2]);
          const destination = cols[3] || '';
          const company = cols[4] || '';

          if (isNaN(startOdo) || isNaN(endOdo)) continue;

          parsed.push({
            date,
            startOdometer: startOdo,
            endOdometer: endOdo,
            distance: endOdo - startOdo,
            destination,
            company,
            startTime: '12:00' // Default time
          });
        }
        
        if (parsed.length === 0) throw new Error("No valid trips found. Check file format.");
        
        setParsedTrips(parsed);
        setImportError('');
      } catch (err: any) {
        setImportError(err.message);
        setParsedTrips([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedTrips.length === 0 || !importVehicleId || !onBatchSave) return;
    setIsImporting(true);

    try {
      const tripsToSave: Trip[] = parsedTrips.map(p => ({
        id: crypto.randomUUID(),
        vehicleId: importVehicleId,
        date: p.date || new Date().toISOString().split('T')[0],
        startTime: p.startTime || '09:00',
        startOdometer: p.startOdometer || 0,
        endOdometer: p.endOdometer || 0,
        distance: (p.endOdometer || 0) - (p.startOdometer || 0),
        destination: p.destination || 'Imported Trip',
        company: p.company || 'Unspecified',
        timestamp: Date.now()
      }));

      await onBatchSave(tripsToSave);
      
    } catch (e: any) {
      setImportError("Failed to upload trips: " + e.message);
    } finally {
      setIsImporting(false);
    }
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
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setMode('import')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${mode === 'import' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
        >
          Bulk Import
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold">{mode === 'manual' ? 'Log New Trip' : 'Import Trips'}</h2>
          <p className="opacity-90">{mode === 'manual' ? 'Enter your mileage details below.' : 'Upload a CSV or TXT file to add multiple trips.'}</p>
        </div>
        
        {mode === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="p-6 space-y-6">
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
        ) : (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
               <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                 <FileSpreadsheet size={18} className="text-green-600"/>
                 CSV/TXT Format Guidelines
               </h3>
               <p className="text-sm text-slate-600 mb-2">Please upload a <strong>.csv</strong> or <strong>.txt</strong> file with a header row and the following columns:</p>
               <code className="block bg-slate-800 text-slate-100 p-3 rounded text-xs overflow-x-auto mb-2">
                 Date (YYYY-MM-DD), Start Odometer, End Odometer, Destination, Company
               </code>
               <p className="text-xs text-slate-500">Example: 2024-03-25, 10500, 10525, Office, Google</p>
            </div>

            {/* Vehicle Selection for Import */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Vehicle</label>
              <select
                className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={importVehicleId}
                onChange={e => setImportVehicleId(e.target.value)}
                required
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.nickname} ({v.make} {v.model})</option>
                ))}
              </select>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv,.txt"
                className="hidden" 
              />
              <Upload size={32} className="mx-auto text-slate-400 mb-2" />
              {importFile ? (
                <div>
                   <p className="font-semibold text-blue-600">{importFile.name}</p>
                   <p className="text-xs text-slate-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <>
                  <p className="font-medium text-slate-700">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500 mt-1">CSV or TXT files only</p>
                </>
              )}
            </div>

            {importError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Preview Table */}
            {parsedTrips.length > 0 && (
              <div className="border rounded-lg overflow-hidden border-slate-200">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-semibold text-slate-700 text-sm">Preview ({parsedTrips.length} trips)</h4>
                  <button onClick={() => { setImportFile(null); setParsedTrips([]); }} className="text-xs text-red-600 hover:underline">Clear</button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Start</th>
                        <th className="px-3 py-2">End</th>
                        <th className="px-3 py-2">Destination</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedTrips.map((t, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{t.date}</td>
                          <td className="px-3 py-2">{t.startOdometer}</td>
                          <td className="px-3 py-2">{t.endOdometer}</td>
                          <td className="px-3 py-2">{t.destination}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
               <button
                type="button"
                onClick={onCancel}
                className="text-slate-500 hover:text-slate-700 px-4 py-2 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={parsedTrips.length === 0 || isImporting}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 shadow-md flex items-center space-x-2 font-semibold transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? <RotateCcw className="animate-spin" size={18}/> : <CheckCircle size={18} />}
                <span>Import {parsedTrips.length} Trips</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};