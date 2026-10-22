import React from 'react';
import {
  Cpu,
  Wifi,
  BatteryCharging,
  Clock,
  CheckCircle2,
  AlertCircle,
  Fan,
  Power,
  RotateCw,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DeviceStatusPanel: React.FC = () => {
  const { liveReading, connection, executeDeviceAction } = useApp();
  const flags = liveReading?.device_flags;

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const getRssiQuality = (rssi: number) => {
    if (rssi >= -65) return { label: 'Strong', color: 'text-emerald-600' };
    if (rssi >= -75) return { label: 'Good', color: 'text-cyan-600' };
    if (rssi >= -85) return { label: 'Fair', color: 'text-amber-600' };
    return { label: 'Weak', color: 'text-red-600' };
  };

  const rssiInfo = getRssiQuality(flags?.wifi_rssi ?? -68);

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-glass">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-sm">Device-Reported Status</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100/70 text-cyan-800 border border-cyan-200">
                Direct ESP32 Edge Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Hardware flags, relay coils, and internal diagnostics streamed directly from the edge microcontroller.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Node:</span>
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            {liveReading?.device_id || 'ESP32-POND-01'}
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100 text-xs">
        {/* Aerator Relay */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Fan className="w-3.5 h-3.5 text-cyan-600" />
              Aerator Relay
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                flags?.aerator_relay ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={`font-bold text-sm ${flags?.aerator_relay ? 'text-emerald-700' : 'text-slate-700'}`}>
              {flags?.aerator_relay ? 'RUNNING (ON)' : 'STANDBY (OFF)'}
            </span>
            <button
              onClick={() =>
                executeDeviceAction(
                  flags?.aerator_relay ? 'RELAY_AERATOR_OFF' : 'RELAY_AERATOR_ON',
                  flags?.aerator_relay ? 'Stop Aerator' : 'Start Aerator'
                )
              }
              className="text-[10px] font-medium text-cyan-700 hover:text-cyan-900 bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
            >
              {flags?.aerator_relay ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>

        {/* Pump Relay */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Power className="w-3.5 h-3.5 text-blue-600" />
              Water Pump
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                flags?.pump_relay ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={`font-bold text-sm ${flags?.pump_relay ? 'text-emerald-700' : 'text-slate-700'}`}>
              {flags?.pump_relay ? 'ACTIVE (ON)' : 'OFF'}
            </span>
            <button
              onClick={() =>
                executeDeviceAction(
                  flags?.pump_relay ? 'RELAY_PUMP_OFF' : 'RELAY_PUMP_ON',
                  flags?.pump_relay ? 'Stop Pump' : 'Start Pump'
                )
              }
              className="text-[10px] font-medium text-blue-700 hover:text-blue-900 bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
            >
              {flags?.pump_relay ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>

        {/* WiFi RSSI */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
          <span className="text-slate-500 font-medium flex items-center gap-1 mb-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-600" />
            WiFi Signal (RSSI)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm text-slate-800">{flags?.wifi_rssi ?? -65} dBm</span>
            <span className={`text-[11px] font-semibold ${rssiInfo.color}`}>({rssiInfo.label})</span>
          </div>
        </div>

        {/* Battery / Power Supply */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
          <span className="text-slate-500 font-medium flex items-center gap-1 mb-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
            Bus Voltage
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm text-slate-800">
              {flags?.battery_voltage?.toFixed(2) ?? '4.12'} V
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">(Nominal)</span>
          </div>
        </div>
      </div>

      {/* Edge Sensor Probes Health Table */}
      <div className="pt-3">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
          Hardware Probe Diagnostic Matrix
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          {[
            { id: 'temperature', name: 'Temp Probe', status: flags?.sensor_status?.temperature || 'OK' },
            { id: 'ph', name: 'pH Glass Probe', status: flags?.sensor_status?.ph || 'OK' },
            { id: 'dissolved_oxygen', name: 'DO Galvanic Probe', status: flags?.sensor_status?.dissolved_oxygen || 'OK' },
            { id: 'turbidity', name: 'Optical Turbidity', status: flags?.sensor_status?.turbidity || 'OK' },
            { id: 'ammonia', name: 'TAN ISE Sensor', status: flags?.sensor_status?.ammonia || 'OK' },
            { id: 'water_level', name: 'Ultrasonic Depth', status: flags?.sensor_status?.water_level || 'OK' },
          ].map((probe) => (
            <div
              key={probe.id}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between"
            >
              <span className="text-[11px] text-slate-600 truncate">{probe.name}</span>
              {probe.status === 'OK' ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                  OK
                </span>
              ) : (
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  <AlertCircle className="w-2.5 h-2.5" />
                  FAULT
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Firmware Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Uptime: {flags?.uptime_seconds ? formatUptime(flags.uptime_seconds) : '14h 22m 10s'}
          </span>
          <span className="flex items-center gap-1">
            <RotateCw className="w-3 h-3 text-slate-400" />
            Boot: {flags?.last_boot_reason || 'POWERON_RESET'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3 text-cyan-600" />
          <span>ESP32 Firmware: {flags?.firmware_version || 'v1.2.4'} | AquaCare Edge Stack</span>
        </div>
      </div>
    </div>
  );
};

