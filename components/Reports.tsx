import React, { useMemo, useState } from 'react';
import { Trip, Vehicle, ReportFilter } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Share2, Sparkles, Filter, FileText } from 'lucide-react';
import { generateMileageInsight } from '../services/geminiService';

interface ReportsProps {
  trips: Trip[];
  vehicles: Vehicle[];
}

export const Reports: React.FC<ReportsProps> = ({ trips, vehicles }) => {
  const [filter, setFilter] = useState<ReportFilter>({ period: 'month', vehicleId: 'all' });
  const [insight, setInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  // Filter Logic
  const filteredTrips = useMemo(() => {
    let result = [...trips];
    const now = new Date();

    if (filter.vehicleId && filter.vehicleId !== 'all') {
      result = result.filter(t => t.vehicleId === filter.vehicleId);
    }

    if (filter.period !== 'all') {
      result = result.filter(t => {
        const tripDate = new Date(t.date);
        switch (filter.period) {
          case 'day': return tripDate.toDateString() === now.toDateString();
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return tripDate >= weekAgo;
          }
          case 'month': return tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear();
          case 'quarter': {
            const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
            const tripQuarter = Math.floor((tripDate.getMonth() + 3) / 3);
            return currentQuarter === tripQuarter && tripDate.getFullYear() === now.getFullYear();
          }
          case 'year': return tripDate.getFullYear() === now.getFullYear();
          default: return true;
        }
      });
    }
    return result;
  }, [trips, filter]);

  const totalMileage = filteredTrips.reduce((acc, t) => acc + t.distance, 0);

  // Chart Data Preparation (Group by Date)
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTrips.forEach(t => {
      const key = t.date;
      map.set(key, (map.get(key) || 0) + t.distance);
    });
    // Sort by date
    return Array.from(map.entries())
      .map(([date, distance]) => ({ date, distance }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredTrips]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Vehicle', 'Start Odometer', 'End Odometer', 'Distance', 'Destination', 'Company'];
    const rows = filteredTrips.map(t => {
      const v = vehicles.find(v => v.id === t.vehicleId);
      return [
        t.date,
        v ? `${v.make} ${v.model}` : 'Unknown',
        t.startOdometer,
        t.endOdometer,
        t.distance,
        `"${t.destination}"`, // Escape commas
        `"${t.company}"`
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mileage_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My MileAges Report',
          text: `Total mileage report: ${totalMileage.toFixed(1)} miles.`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert("Sharing is not supported on this device/browser.");
    }
  };

  const handleGenerateInsight = async () => {
    setIsGeneratingInsight(true);
    setInsight(null);
    const result = await generateMileageInsight(filteredTrips, vehicles);
    setInsight(result);
    setIsGeneratingInsight(false);
  };

  // Simple Print to PDF Simulation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mileage Reports</h2>
          <p className="text-slate-500">Analyze your trips and export data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button onClick={handlePrint} className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50">
            <FileText size={18} />
            <span className="hidden sm:inline">Print/PDF</span>
          </button>
          <button onClick={handleExportCSV} className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50">
            <Download size={18} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={handleShare} className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50">
            <Share2 size={18} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center print:hidden">
        <div className="flex items-center space-x-2 text-slate-500">
          <Filter size={18} />
          <span className="font-medium">Filters:</span>
        </div>
        
        <select 
          className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          value={filter.period}
          onChange={(e) => setFilter({...filter, period: e.target.value as ReportFilter['period']})}
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>

        <select 
          className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          value={filter.vehicleId}
          onChange={(e) => setFilter({...filter, vehicleId: e.target.value})}
        >
          <option value="all">All Vehicles</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.nickname}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-md">
          <h3 className="text-blue-100 font-medium mb-1">Total Mileage</h3>
          <p className="text-4xl font-bold">{totalMileage.toFixed(1)} <span className="text-lg font-normal opacity-80">mi</span></p>
          <p className="text-sm text-blue-200 mt-2 capitalize">{filter.period === 'all' ? 'All Time' : `This ${filter.period}`}</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 col-span-2 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={handleGenerateInsight}
                disabled={isGeneratingInsight}
                className="flex items-center space-x-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{isGeneratingInsight ? 'Analyzing...' : 'Ask Gemini'}</span>
              </button>
           </div>
           
           <h3 className="text-slate-500 font-medium mb-2">AI Insights</h3>
           {insight ? (
             <p className="text-slate-800 leading-relaxed text-lg">{insight}</p>
           ) : (
             <p className="text-slate-400 italic">Click "Ask Gemini" to get AI-powered analysis of your driving habits and efficiency based on your logs.</p>
           )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80 print:break-inside-avoid">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Mileage Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`${value} mi`, 'Distance']}
              labelFormatter={(label) => new Date(label).toDateString()}
            />
            <Bar dataKey="distance" fill="#4F46E5" radius={[4, 4, 0, 0]}>
               {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(225, 70%, ${50 + (index % 5) * 5}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 print:bg-white print:border-black">
          <h3 className="font-bold text-slate-800">Detailed Trip Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 print:text-black">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 print:bg-white border-b print:border-black">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Dest / Company</th>
                <th className="px-6 py-3 text-right">Start</th>
                <th className="px-6 py-3 text-right">End</th>
                <th className="px-6 py-3 text-right font-bold">Distance</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No trips found for this period.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                  return (
                    <tr key={trip.id} className="bg-white border-b hover:bg-slate-50 print:border-black">
                      <td className="px-6 py-4 whitespace-nowrap">{trip.date}</td>
                      <td className="px-6 py-4">{vehicle?.nickname || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{trip.destination}</div>
                        <div className="text-xs">{trip.company}</div>
                      </td>
                      <td className="px-6 py-4 text-right">{trip.startOdometer}</td>
                      <td className="px-6 py-4 text-right">{trip.endOdometer}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 print:text-black">
                        {trip.distance.toFixed(1)} mi
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredTrips.length > 0 && (
              <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200 print:bg-white print:border-black">
                 <tr>
                    <td colSpan={5} className="px-6 py-4 text-right">TOTAL</td>
                    <td className="px-6 py-4 text-right">{totalMileage.toFixed(1)} mi</td>
                 </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};