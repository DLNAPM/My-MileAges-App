import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Car, Trash2, Plus, AlertCircle, Pencil, X, Save, Loader2 } from 'lucide-react';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  onAdd: (v: Vehicle) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const VehicleManager: React.FC<VehicleManagerProps> = ({ vehicles, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    make: '',
    model: '',
    year: '',
    nickname: ''
  });

  const handleStartAdd = () => {
    setFormData({ make: '', model: '', year: '', nickname: '' });
    setEditingVehicleId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (v: Vehicle) => {
    setFormData({ ...v });
    setEditingVehicleId(v.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.make && formData.model && formData.year) {
      setIsSaving(true);
      try {
        const v: Vehicle = {
          id: editingVehicleId || crypto.randomUUID(),
          make: formData.make,
          model: formData.model,
          year: formData.year,
          nickname: formData.nickname || `${formData.year} ${formData.make}`,
        };
        await onAdd(v);
        setIsAdding(false);
        setEditingVehicleId(null);
      } catch (err) {
        // Error is handled by parent (App.tsx)
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Vehicles</h2>
          <p className="text-slate-500">Manage the vehicles you use for mileage tracking.</p>
        </div>
        {!isAdding && (
          <button
            onClick={handleStartAdd}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {vehicles.length === 0 && !isAdding && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start space-x-3">
          <AlertCircle className="text-yellow-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-800 font-semibold">No Vehicles Found</h3>
            <p className="text-yellow-700 mt-1">
              You need to add at least one vehicle before you can start logging trips.
            </p>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 ring-2 ring-blue-500/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {editingVehicleId ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
            <button 
              disabled={isSaving}
              onClick={() => setIsAdding(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  required
                  disabled={isSaving}
                  placeholder="e.g. 2023"
                  className="w-full rounded-lg border-slate-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Make</label>
                <input
                  type="text"
                  required
                  disabled={isSaving}
                  placeholder="e.g. Toyota"
                  className="w-full rounded-lg border-slate-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
                  value={formData.make}
                  onChange={e => setFormData({ ...formData, make: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Model</label>
                <input
                  type="text"
                  required
                  disabled={isSaving}
                  placeholder="e.g. Camry"
                  className="w-full rounded-lg border-slate-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nickname (Optional)</label>
              <input
                type="text"
                disabled={isSaving}
                placeholder="e.g. My Daily Driver"
                className="w-full rounded-lg border-slate-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
                value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-bold flex items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span>{isSaving ? 'Saving...' : (editingVehicleId ? 'Save Changes' : 'Save Vehicle')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all relative group hover:border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Car size={24} />
              </div>
              <div className="flex space-x-1">
                <button
                  disabled={isSaving}
                  onClick={() => handleStartEdit(vehicle)}
                  className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors disabled:opacity-50"
                  title="Edit Vehicle"
                >
                  <Pencil size={18} />
                </button>
                <button
                  disabled={isSaving}
                  onClick={() => onDelete(vehicle.id)}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete Vehicle"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-900">{vehicle.nickname}</h3>
            <p className="text-slate-500">{vehicle.year} {vehicle.make} {vehicle.model}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-400">
              ID: {vehicle.id.slice(0, 8)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};