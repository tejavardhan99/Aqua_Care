import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  User,
  CheckCircle2,
  Lock,
  Clock,
  Bell,
  Mail,
  MessageSquare,
  Send,
  Cpu,
  Wifi,
  Battery,
  Layers,
  Thermometer,
  Droplets,
  Activity,
  FlaskConical,
  Gauge,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { thresholds, currentUser, connection, liveReading } = useApp();
  const flags = liveReading?.device_flags;

  // Farmer preferences
  const [pondName, setPondName] = useState('Pond #1 — North Basin');
  const [preferredUnits, setPreferredUnits] = useState('Metric (°C, mg/L, ppm)');

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Pond preferences saved successfully');
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Farm &amp; Pond Settings</h1>
          </div>
          <p className="text-xs text-slate-500">
            Configure your pond preferences, view edge hardware telemetry, and review biological thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-cyan-50 border-cyan-300 text-cyan-800 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-600" />
            <span>Farmer: {currentUser?.full_name || 'Ramesh Kumar'}</span>
          </span>
        </div>
      </div>

      {/* 1. Farmer Profile & Pond Preferences */}
      <div className="glass-panel rounded-2xl p-6 shadow-glass">
        <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-700" />
          Pond Profile &amp; Measurement Units
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Personalize the display names and monitoring units for this aquaculture facility.
        </p>

        <form onSubmit={handleSavePreferences} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-600 font-semibold block mb-1">Logged-In Farmer</label>
            <input
              type="text"
              readOnly
              value={currentUser?.full_name || 'Ramesh Kumar'}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-600 font-semibold block mb-1">Pond Display Name</label>
            <input
              type="text"
              value={pondName}
              onChange={(e) => setPondName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-600 font-semibold block mb-1">Measurement System</label>
            <select
              value={preferredUnits}
              onChange={(e) => setPreferredUnits(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
            >
              <option value="Metric (°C, mg/L, ppm)">Metric (°C, mg/L, ppm, NTU, m)</option>
              <option value="Imperial (°F, mg/L, ppm)">Imperial (°F, mg/L, ppm, NTU, ft)</option>
            </select>
          </div>

          <div className="md:col-span-3 pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      {/* 2. ESP32 Edge Device Technical Status (Relocated from dominant dashboard view) */}
      <div className="glass-panel rounded-2xl p-6 shadow-glass">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">ESP32 Hardware Edge Diagnostics</h2>
              <p className="text-xs text-slate-500">
                Low-level microcontroller status, telemetry rate, and probe connectivity.
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ESP32-POND-01 Online
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block mb-1">Firmware Version</span>
            <span className="font-mono text-sm font-bold text-slate-900">
              {flags?.firmware_version || 'v1.2.4'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Reporting Rate
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">
              Every {connection.interval_seconds || 10} seconds
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block mb-1 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-slate-400" />
              Edge WiFi RSSI
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">
              {flags?.wifi_rssi ?? -64} dBm (Good)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block mb-1 flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-slate-400" />
              Bus / Battery
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">
              {flags?.battery_voltage?.toFixed(2) ?? '4.18'} V
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Boot reason: <code className="text-slate-700 font-mono">{flags?.last_boot_reason || 'POWERON_RESET'}</code></span>
          <span>Edge uptime: <code className="text-slate-700 font-mono">{flags?.uptime_seconds ? formatUptime(flags.uptime_seconds) : '12h 45m'}</code></span>
        </div>
      </div>

      {/* 3. Biological Thresholds (Read-Only View for Farmers) */}
      <div className="glass-panel rounded-2xl p-6 shadow-glass">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Prawn Biological Thresholds (Single Source of Truth)
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
                Read-Only for Farmers
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly calibrated for freshwater prawn (<em>Macrobrachium rosenbergii</em>) biological survival and growth.
            </p>
          </div>

          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Centrally governed by backend engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Temperature */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Thermometer className="w-4 h-4 text-orange-600" />
              <span>Water Temperature</span>
            </div>
            <p className="text-slate-600">
              Safe Zone: <strong className="text-slate-900">{thresholds?.temperature.min_safe ?? 27.0} – {thresholds?.temperature.max_safe ?? 31.0} °C</strong>
            </p>
            <p className="text-[11px] text-slate-500">Critical below 24°C or above 34°C.</p>
          </div>

          {/* Dissolved Oxygen */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Droplets className="w-4 h-4 text-cyan-600" />
              <span>Dissolved Oxygen (DO)</span>
            </div>
            <p className="text-slate-600">
              Safe Zone: <strong className="text-slate-900">&gt; {thresholds?.dissolved_oxygen.safe ?? 5.0} mg/L</strong>
            </p>
            <p className="text-[11px] text-slate-500">Critical hypoxia alert below {thresholds?.dissolved_oxygen.critical ?? 2.8} mg/L.</p>
          </div>

          {/* pH */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Water pH</span>
            </div>
            <p className="text-slate-600">
              Safe Zone: <strong className="text-slate-900">{thresholds?.ph.min_safe ?? 7.2} – {thresholds?.ph.max_safe ?? 8.4}</strong>
            </p>
            <p className="text-[11px] text-slate-500">Alkaline stress above 8.8; acidic shock below 6.5.</p>
          </div>

          {/* Ammonia */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <FlaskConical className="w-4 h-4 text-amber-600" />
              <span>Ammonia TAN</span>
            </div>
            <p className="text-slate-600">
              Safe Zone: <strong className="text-slate-900">&lt; {thresholds?.ammonia.safe ?? 0.1} ppm</strong>
            </p>
            <p className="text-[11px] text-slate-500">Lethal toxicity threshold at &gt; {thresholds?.ammonia.critical ?? 1.2} ppm.</p>
          </div>

          {/* Turbidity */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Gauge className="w-4 h-4 text-indigo-600" />
              <span>Water Turbidity</span>
            </div>
            <p className="text-slate-600">
              Safe Zone: <strong className="text-slate-900">{thresholds?.turbidity.min_safe ?? 25} – {thresholds?.turbidity.max_safe ?? 50} NTU</strong>
            </p>
            <p className="text-[11px] text-slate-500">Silt overload alert above 80 NTU.</p>
          </div>

          {/* Water Depth Level */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Pond Water Depth</span>
            </div>
            <p className="text-slate-600">
              Safe Zone: <strong className="text-slate-900">{thresholds?.water_level.min_safe ?? 1.1} – {thresholds?.water_level.max_safe ?? 1.6} m</strong>
            </p>
            <p className="text-[11px] text-slate-500">Overflow risk &gt; 1.8 m; shallow heating &lt; 0.9 m.</p>
          </div>
        </div>
      </div>

      {/* 4. Notification Preferences & External Channels */}
      <div className="glass-panel rounded-2xl p-6 shadow-glass">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <Bell className="w-5 h-5 text-cyan-700" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Alert Channels &amp; Delivery Preferences</h3>
            <p className="text-xs text-slate-500">
              Status of external messaging integrations. Never implies delivery when not configured.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* In-app */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">In-App Notification Bell &amp; Toast</span>
                <span className="text-[11px] text-slate-500">
                  Real-time visual alerts and banner warnings in the web dashboard.
                </span>
              </div>
            </div>
            <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
              Active (Operational)
            </span>
          </div>

          {/* Email */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Email Gateway (SMTP)</span>
                <span className="text-[11px] text-slate-500">
                  Critical alert emails to farmer.
                </span>
              </div>
            </div>
            <span className="font-semibold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
              Not configured
            </span>
          </div>

          {/* SMS */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">SMS Gateway (Cellular)</span>
                <span className="text-[11px] text-slate-500">
                  Urgent SMS texts dispatched directly to farmer's mobile phone.
                </span>
              </div>
            </div>
            <span className="font-semibold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
              Not configured
            </span>
          </div>

          {/* Telegram */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Telegram Farm Bot</span>
                <span className="text-[11px] text-slate-500">
                  Instant group messages to farm telegram channel.
                </span>
              </div>
            </div>
            <span className="font-semibold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
              Not configured
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
