import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  Calendar,
  RefreshCw,
  Info,
  Thermometer,
  Droplets,
  Activity,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { api } from '../services/api';
import type { TelemetryReading } from '../types';

export const TrendsPage: React.FC = () => {
  const [range, setRange] = useState<'1h' | '6h' | '24h' | 'all'>('24h');
  const [history, setHistory] = useState<TelemetryReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTelemetryHistory(range);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch historical telemetry', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [range]);

  // Format data for Recharts
  const chartData = history.map((h) => {
    const d = new Date(h.timestamp || h.received_at || Date.now());
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: h.temperature,
      dissolved_oxygen: h.dissolved_oxygen,
      ph: h.ph,
      ammonia: h.ammonia,
      turbidity: h.turbidity,
      water_level: h.water_level,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pond Telemetry Trends &amp; Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Historical diurnal water quality curves for freshwater prawn pond #1.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-medium border border-slate-200">
            {(['1h', '6h', '24h', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  range === r
                    ? 'bg-white text-cyan-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh trend data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dissolved Oxygen Chart */}
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Dissolved Oxygen (mg/L)</h3>
                <span className="text-[11px] text-slate-500">Critical: &lt;3.0 mg/L | Safe: &gt;5.0 mg/L</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={5.0} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Safe 5.0', fill: '#10b981', fontSize: 10 }} />
                <ReferenceLine y={3.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical 3.0', fill: '#ef4444', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="dissolved_oxygen"
                  name="DO (mg/L)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Water Temperature (°C)</h3>
                <span className="text-[11px] text-slate-500">Optimal Growth Band: 27.0 - 31.0 °C</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[20, 38]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={31.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Max Safe 31°C', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={27.0} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Min Safe 27°C', fill: '#10b981', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temp (°C)"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water pH Chart */}
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Water pH Level</h3>
                <span className="text-[11px] text-slate-500">Safe Carapace Range: 7.2 - 8.4</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[6.0, 9.5]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={8.4} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Max 8.4', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={7.2} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Min 7.2', fill: '#10b981', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="ph"
                  name="pH"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ammonia TAN Chart */}
        <div className="glass-panel rounded-2xl p-6 shadow-glass">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ammonia TAN (ppm)</h3>
                <span className="text-[11px] text-slate-500">Critical Toxicity: &gt;1.0 ppm | Safe: &lt;0.1 ppm</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 1.5]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={0.1} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Safe 0.1', fill: '#10b981', fontSize: 10 }} />
                <ReferenceLine y={0.8} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'High 0.8', fill: '#ef4444', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="ammonia"
                  name="TAN (ppm)"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

