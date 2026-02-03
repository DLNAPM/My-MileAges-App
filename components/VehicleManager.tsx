import React, { useState } from 'react';
import { Vehicle } from '../types';
import { Car, Trash2, Plus, AlertCircle } from 'lucide-react';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  onAdd: (v: Vehicle) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const VehicleManager: React.FC<VehicleManagerProps> = ({ vehicles, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    make: '',
    model: '',
    year: '',
    nickname: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newVehicle.make && newVehicle.model && newVehicle.year) {
      const v: Vehicle = {
        id: crypto.randomUUID(),
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year,
        nickname: newVehicle.nickname || `${newVehicle.year} ${newVehicle.make}`,
      };
      await onAdd(v);
      setNewVehicle({ make: '', model: '', year: '', nickname: '' });
      setIsAdding(false);
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
            onClick={() => setIsAdding(true)}
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Vehicle</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2023"
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newVehicle.year}
                  onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota"
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newVehicle.make}
                  onChange={e => setNewVehicle({ ...newVehicle, make: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Camry"
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newVehicle.model}
                  onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nickname (Optional)</label>
              <input
                type="text"
                placeholder="e.g. My Daily Driver"
                className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={newVehicle.nickname}
                onChange={e => setNewVehicle({ ...newVehicle, nickname: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Save Vehicle
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Car size={24} />
              </div>
              <button
                onClick={() => onDelete(vehicle.id)}
                className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Delete Vehicle"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <h3 className="font-bold text-lg text-slate-900">{vehicle.nickname}</h3>
            <p className="text-slate-500">{vehicle.year} {vehicle.make} {vehicle.model}</p>
          </div>
        ))}
      </div>
    </div>
  );
};