import React, { useState, useEffect, useRef } from 'react';
import { Trip, Vehicle } from '../types';
import { storageService } from '../services/storage';
import { Save, Calendar, Clock, MapPin, Building, FileSpreadsheet, Upload, AlertCircle, CheckCircle, Loader2, Download, Trash2, Pencil, X } from 'lucide-react';
import { read, utils } from 'xlsx';

interface TripLoggerProps {
  vehicles: Vehicle[];
  onSave: (trip: Trip) => Promise<void>;
  onBatchSave?: (trips: Trip[]) => Promise<void>;
  onCancel: () => void;
}

type Mode = 'manual' | 'import';

export const TripLogger: React.FC<TripLoggerProps> = ({ vehicles, onSave, onBatchSave, onCancel }) => {
  const [mode, setMode] = useState<Mode>('manual');
  const [isSaving, setIsSaving] = useState(false);
  
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

  // Edit Import State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editImportForm, setEditImportForm] = useState<Partial<Trip>>({});

  useEffect(() => {
    const loadHistory = async () => {
      const [dest, comp] = await Promise.all([
        storageService.getUniqueDestinations(),
        storageService.getUniqueCompanies()
      ]);
      setDestinations(dest);
      setCompanies(comp);
      
      if (trip.vehicleId) {
        const trips = await storageService.getTrips();
        const vehicleTrips = trips.filter(t => t.vehicleId === trip.vehicleId);
        if (vehicleTrips.length > 0) {
          const lastTrip = vehicleTrips[0];
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

    setIsSaving(true);
    try {
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
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Date", "Start Odometer", "End Odometer", "Destination", "Company", "StartTime"];
    const sampleRow = [new Date().toISOString().split('T')[0], 10000, 10050, "Sample Destination", "Sample Company", "09:00"];
    
    // Create CSV content
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), sampleRow.join(',')].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mileage_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      parseFile(file);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Read workbook using XLSX
      const workbook = read(arrayBuffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }) as any[][];

      if (jsonData.length < 2) throw new Error("File appears empty or missing data.");

      // Detect headers
      const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
      
      // Helper to find column index
      const getIndex = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

      const dateIdx = getIndex(['date']);
      const startIdx = getIndex(['start', 'begin']);
      const endIdx = getIndex(['end', 'final', 'stop']);
      const destIdx = getIndex(['dest', 'location', 'place']);
      const compIdx = getIndex(['comp', 'client', 'purpose']);
      const timeIdx = getIndex(['time']);

      if (startIdx === -1 || endIdx === -1) {
        throw new Error("Could not find 'Start Odometer' or 'End Odometer' columns.");
      }

      const parsed: Partial<Trip>[] = [];

      // Start from row 1 (index 1)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        // Extract values
        const dateStr = dateIdx !== -1 ? row[dateIdx] : new Date().toISOString().split('T')[0];
        const startOdo = parseFloat(String(row[startIdx]).replace(/[^0-9.]/g, ''));
        const endOdo = parseFloat(String(row[endIdx]).replace(/[^0-9.]/g, ''));
        const dest = destIdx !== -1 ? row[destIdx] : '';
        const comp = compIdx !== -1 ? row[compIdx] : '';
        const time = timeIdx !== -1 ? row[timeIdx] : '12:00';

        if (isNaN(startOdo) || isNaN(endOdo)) continue;

        // Try to normalize date (XLSX sometimes returns MM/DD/YY)
        let formattedDate = dateStr;
        if (dateStr && dateStr.includes('/')) {
             const parts = dateStr.split('/');
             if (parts.length === 3) {
                 // Assumption: MM/DD/YYYY or DD/MM/YYYY? 
                 // Let's rely on standard ISO YYYY-MM-DD if possible or pass as is
                 // A simple date object conversion
                 const d = new Date(dateStr);
                 if (!isNaN(d.getTime())) {
                     formattedDate = d.toISOString().split('T')[0];
                 }
             }
        }

        parsed.push({
          date: formattedDate,
          startOdometer: startOdo,
          endOdometer: endOdo,
          distance: endOdo - startOdo,
          destination: dest || 'Imported Trip',
          company: comp || 'Unspecified',
          startTime: time
        });
      }

      if (parsed.length === 0) throw new Error("No valid trips found in file.");
      setParsedTrips(parsed);
      setImportError('');
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Failed to parse file.");
      setParsedTrips([]);
    }
  };

  const handleStartEditImport = (index: number) => {
    setEditingIndex(index);
    setEditImportForm({ ...parsedTrips[index] });
  };

  const handleSaveEditImport = () => {
    if (editingIndex !== null) {
      const updated = [...parsedTrips];
      updated[editingIndex] = {
        ...editImportForm,
        distance: (Number(editImportForm.endOdometer) || 0) - (Number(editImportForm.startOdometer) || 0)
      };
      setParsedTrips(updated);
      setEditingIndex(null);
    }
  };

  const handleDeleteImportRow = (index: number) => {
    const updated = parsedTrips.filter((_, i) => i !== index);
    setParsedTrips(updated);
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
      setParsedTrips([]);
      setImportFile(null);
    } catch (e: any) {
      setImportError("Failed to upload trips.");
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
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex space-x-2 mb-4">
        <button
          disabled={isSaving || isImporting}
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'} disabled:opacity-50`}
        >
          Manual Entry
        </button>
        <button
          disabled={isSaving || isImporting}
          onClick={() => setMode('import')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${mode === 'import' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'} disabled:opacity-50`}
        >
          Import Excel/CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold">{mode === 'manual' ? 'Log New Trip' : 'Import Trips'}</h2>
          <p className="opacity-90">{mode === 'manual' ? 'Enter your mileage details below.' : 'Upload an Excel or CSV file to add multiple trips.'}</p>
        </div>
        
        {mode === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Vehicle</label>
              <select
                disabled={isSaving}
                className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar size={14} /> Date
                </label>
                <input
                  type="date"
                  required
                  disabled={isSaving}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-50"
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
                  disabled={isSaving}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-50"
                  value={trip.startTime}
                  onChange={e => setTrip({ ...trip, startTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Odometer</label>
                <input
                  type="number"
                  required
                  min="0"
                  disabled={isSaving}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-50"
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
                  disabled={isSaving}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-50"
                  value={trip.endOdometer}
                  onChange={e => setTrip({ ...trip, endOdometer: Number(e.target.value) })}
                />
                {Number(trip.endOdometer) > Number(trip.startOdometer) && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Distance: {(Number(trip.endOdometer) - Number(trip.startOdometer)).toFixed(1)} miles
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin size={14} /> Destination
                </label>
                <input
                  type="text"
                  list="destinations-list"
                  required
                  disabled={isSaving}
                  placeholder="e.g. Client Office"
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-50"
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
                  disabled={isSaving}
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500 disabled:bg-slate-50"
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
                disabled={isSaving}
                onClick={onCancel}
                className="text-slate-500 hover:text-slate-700 px-4 py-2 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 shadow-md flex items-center space-x-2 font-semibold transition-transform active:scale-95 disabled:bg-blue-400"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span>{isSaving ? 'Saving...' : 'Save Trip'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Instruction Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
               <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <FileSpreadsheet size={20} />
                      Import Instructions
                    </h3>
                    <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1 ml-1">
                      <li>Download the sample template below.</li>
                      <li>Fill in your trip details (Excel, CSV, or TXT).</li>
                      <li>Upload the file to preview and edit before saving.</li>
                    </ol>
                  </div>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center space-x-1 bg-white border border-blue-300 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 shadow-sm transition-colors"
                  >
                    <Download size={16} />
                    <span>Download Template</span>
                  </button>
               </div>
               <div className="mt-4 pt-3 border-t border-blue-200 text-xs text-blue-700">
                  <span className="font-semibold">Required Columns:</span> Date, Start Odometer, End Odometer
                  <br/>
                  <span className="font-semibold">Optional:</span> Destination, Company, Start Time
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Vehicle</label>
              <select
                disabled={isImporting}
                className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                value={importVehicleId}
                onChange={e => setImportVehicleId(e.target.value)}
                required
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.nickname} ({v.make} {v.model})</option>
                ))}
              </select>
            </div>

            <div 
              className={`border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''}`} 
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv, .txt, .xlsx, .xls" 
                className="hidden" 
              />
              <Upload size={32} className="mx-auto text-slate-400 mb-2" />
              {importFile ? (
                <p className="font-semibold text-blue-600">{importFile.name}</p> 
              ) : (
                <p className="font-medium text-slate-700">Click to upload Excel or CSV</p>
              )}
              <p className="text-xs text-slate-400 mt-2">Supports .xlsx, .xls, .csv, .txt</p>
            </div>

            {importError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Preview & Edit Table */}
            {parsedTrips.length > 0 && (
              <div className="border rounded-lg overflow-hidden border-slate-200">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs">
                  <h4 className="font-semibold text-slate-700">Preview ({parsedTrips.length} trips)</h4>
                  <button onClick={() => { setImportFile(null); setParsedTrips([]); }} className="text-red-600 hover:text-red-800 font-medium">Clear All</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 font-medium text-slate-500">Date</th>
                        <th className="px-3 py-2 font-medium text-slate-500">Start</th>
                        <th className="px-3 py-2 font-medium text-slate-500">End</th>
                        <th className="px-3 py-2 font-medium text-slate-500">Destination</th>
                        <th className="px-3 py-2 font-medium text-slate-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedTrips.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50 group">
                           <td className="px-3 py-2">{t.date}</td>
                           <td className="px-3 py-2">{t.startOdometer}</td>
                           <td className="px-3 py-2">{t.endOdometer}</td>
                           <td className="px-3 py-2 truncate max-w-[150px]">{t.destination}</td>
                           <td className="px-3 py-2 text-right flex justify-end gap-2">
                             <button onClick={() => handleStartEditImport(i)} className="text-blue-600 hover:text-blue-800" title="Edit Item">
                               <Pencil size={14} />
                             </button>
                             <button onClick={() => handleDeleteImportRow(i)} className="text-slate-400 hover:text-red-600" title="Remove Item">
                               <Trash2 size={14} />
                             </button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
               <button type="button" disabled={isImporting} onClick={onCancel} className="text-slate-500 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={parsedTrips.length === 0 || isImporting}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 shadow-md flex items-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18} />}
                <span>{isImporting ? 'Importing...' : `Save ${parsedTrips.length} Trips`}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Edit Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
              <button onClick={() => setEditingIndex(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
              <h3 className="text-lg font-bold mb-4 text-slate-900">Edit Import Item</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                    <input 
                      type="date"
                      className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editImportForm.date}
                      onChange={e => setEditImportForm({...editImportForm, date: e.target.value})}
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                    <input 
                      type="time"
                      className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editImportForm.startTime}
                      onChange={e => setEditImportForm({...editImportForm, startTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start Odometer</label>
                    <input 
                      type="number"
                      className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editImportForm.startOdometer}
                      onChange={e => setEditImportForm({...editImportForm, startOdometer: Number(e.target.value)})}
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End Odometer</label>
                    <input 
                      type="number"
                      className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editImportForm.endOdometer}
                      onChange={e => setEditImportForm({...editImportForm, endOdometer: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                   <input 
                      type="text"
                      className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editImportForm.destination}
                      onChange={e => setEditImportForm({...editImportForm, destination: e.target.value})}
                    />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                   <input 
                      type="text"
                      className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editImportForm.company}
                      onChange={e => setEditImportForm({...editImportForm, company: e.target.value})}
                    />
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                   <button 
                    onClick={() => setEditingIndex(null)}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium"
                   >
                     Cancel
                   </button>
                   <button 
                    onClick={handleSaveEditImport}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                   >
                     Update Item
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};