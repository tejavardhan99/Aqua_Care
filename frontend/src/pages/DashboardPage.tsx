import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  WifiOff,
  Droplet,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SensorCard } from '../components/SensorCard';
import { StatusPill } from '../components/StatusPill';
import { DeviceStatusPanel } from '../components/DeviceStatusPanel';
import { RecommendedActionsPanel } from '../components/RecommendedActionsPanel';
import { CausesPanel } from '../components/CausesPanel';
import { OceanHeroWave } from '../components/OceanHeroWave';
import type { RiskLevel } from '../types';

export const DashboardPage: React.FC = () => {
  const {
    liveReading,
    liveEvaluation,
    connection,
    mqttStatus,
    isLiveLoading,
    refreshLive,
    thresholds,
  } = useApp();

  // Determine if edge data is stale, disconnected, or missing
  const isDisconnectedOrStale =
    connection.status === 'DISCONNECTED' ||
    connection.status === 'STALE' ||
    connection.status === 'UNKNOWN' ||
    !liveReading ||
    Boolean(liveReading?.is_stale);

  // Determine individual parameter risk statuses
  const getParamRisk = (paramName: string): RiskLevel => {
    if (!liveEvaluation || !liveEvaluation.causes) return 'LOW';
    const match = liveEvaluation.causes.find((c) => c.parameter === paramName);
    if (match) return match.severity;
    // Compound conditions
    if (paramName === 'dissolved_oxygen' || paramName === 'temperature') {
      const comp = liveEvaluation.causes.find((c) => c.parameter === 'compound:temp_do');
      if (comp) return comp.severity;
    }
    if (paramName === 'ammonia' || paramName === 'ph') {
      const comp = liveEvaluation.causes.find((c) => c.parameter === 'compound:nh3_ph');
      if (comp) return comp.severity;
    }
    return 'LOW';
  };

  const overallRisk: RiskLevel = liveEvaluation?.overall_risk || 'LOW';

  // Format last known timestamp for stale assessment
  const formatLastKnownTime = () => {
    if (liveReading?.timestamp || liveReading?.received_at) {
      const d = new Date(liveReading.timestamp || liveReading.received_at!);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return 'earlier session';
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Risk Banner (Ocean Wave Animation & Stale State Fix) */}
      <div
        className={`relative rounded-3xl p-6 md:p-8 text-white border shadow-2xl transition-all duration-300 overflow-hidden ${
          isDisconnectedOrStale
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 border-amber-600/50 shadow-glass'
            : overallRisk === 'CRITICAL'
            ? 'bg-gradient-to-r from-red-950 via-rose-900 to-red-900 border-red-500 shadow-xl shadow-red-950/40'
            : overallRisk === 'HIGH'
            ? 'bg-gradient-to-r from-orange-950 via-amber-900 to-orange-900 border-orange-500'
            : overallRisk === 'MEDIUM'
            ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 border-amber-500'
            : 'bg-gradient-to-r from-slate-950 via-ocean-900 to-teal-950 border-teal-700/50 shadow-glass'
        }`}
      >
        {/* Animated Waves Background Component */}
        <OceanHeroWave />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            {/* Top Pills */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs uppercase font-black tracking-widest px-3 py-0.5 rounded-full bg-black/40 text-cyan-200 border border-cyan-400/30 backdrop-blur-xs flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                Live Pond Monitor
              </span>

              {/* HiveMQ Live Stream Indicator */}
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MQTT: {mqttStatus?.topic || 'prawnagent/pond01/state'}</span>
              </span>

              {/* Status pill: if disconnected/stale, shows STALE; otherwise real risk */}
              {isDisconnectedOrStale ? (
                <StatusPill status="STALE" isStale={true} size="md" />
              ) : (
                <StatusPill status={overallRisk} size="md" />
              )}

              {connection.status !== 'CONNECTED' && (
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  <WifiOff className="w-3.5 h-3.5" />
                  {connection.status === 'STALE' ? 'Stale Data (>2x interval)' : 'ESP32 Disconnected'}
                </span>
              )}
            </div>

            {/* Banner Main Title: Rendered directly from backend Rule Engine summary */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-md">
              {isDisconnectedOrStale ? (
                <span className="text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
                  NO LIVE DATA — Status unknown
                </span>
              ) : (
                liveEvaluation?.summary_message || 'SAFE: Pond conditions are safe and healthy for freshwater prawns.'
              )}
            </h1>

            {/* Sub-description & Direct Backend Suggestions */}
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {isDisconnectedOrStale ? (
                <p className="bg-black/30 p-2.5 rounded-xl border border-amber-500/30 text-amber-100">
                  <strong className="text-amber-300">Last known (stale):</strong>{' '}
                  {liveEvaluation?.summary_message || 'Safe parameters'}{' '}
                  <span className="text-amber-200/80 font-mono text-xs">
                    (recorded at {formatLastKnownTime()})
                  </span>
                  . Telemetry has stopped arriving from ESP32 edge node. Check pond power and edge WiFi.
                </p>
              ) : (
                <div className="space-y-2.5">
                  <p>
                    Target aquaculture species:{' '}
                    <strong className="text-cyan-300 font-bold">
                      Giant Freshwater Prawn (<em>Macrobrachium rosenbergii</em>)
                    </strong>
                    . Continuous biological water quality monitoring from pond sensors.
                  </p>

                  {/* Backend Direct Suggestions */}
                  {liveEvaluation?.recommended_actions && liveEvaluation.recommended_actions.length > 0 && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/20 backdrop-blur-xs text-xs space-y-1.5 shadow-inner">
                      <div className="flex items-center gap-2 font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>Backend Automated Suggestions ({liveEvaluation.recommended_actions.length}):</span>
                      </div>
                      <ul className="space-y-1">
                        {liveEvaluation.recommended_actions.map((act) => (
                          <li key={act.action_id} className="text-slate-100 flex items-start gap-1.5">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>
                              <strong className="text-white">{act.title}:</strong> {act.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Action / Sync Details */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
            <div className="glass-panel-dark rounded-2xl p-4 text-xs space-y-1.5 shadow-xl">
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span className="text-slate-400 font-semibold">Sensor Link:</span>
                <StatusPill status={connection.status} size="sm" isStale={isDisconnectedOrStale} />
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span className="text-slate-400 font-semibold">Interval:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {connection.interval_seconds}s
                </span>
              </div>
              <div className="pt-1 border-t border-teal-900/40 flex items-center justify-between gap-4">
                <button
                  onClick={() => refreshLive()}
                  disabled={isLiveLoading}
                  className="w-full text-center py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-cyan-300 font-bold text-[11px] border border-cyan-400/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isLiveLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Six Sensor Cards Grid (Pure Live Data Only — No Fake / Fallback Numbers) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider drop-shadow-sm">
              Live Pond Sensor Telemetry
            </h2>
            <p className="text-xs text-cyan-100 font-medium">
              Biological thresholds calibrated for <em>Macrobrachium rosenbergii</em>
            </p>
          </div>
          {isDisconnectedOrStale && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 shadow-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Stale Data Warning
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Temperature */}
          <SensorCard
            parameterId="temperature"
            name="Water Temperature"
            value={liveReading?.temperature}
            unit="°C"
            status={getParamRisk('temperature')}
            optimalRange={`${thresholds?.temperature.min_safe ?? 27.0} – ${thresholds?.temperature.max_safe ?? 31.0} °C`}
            isStale={isDisconnectedOrStale}
            isReporting={Boolean(liveReading && liveReading.temperature !== undefined && liveReading.temperature !== null)}
            trend="steady"
            minScale={15}
            maxScale={40}
            safeMin={thresholds?.temperature.min_safe ?? 27.0}
            safeMax={thresholds?.temperature.max_safe ?? 31.0}
          />

          {/* Dissolved Oxygen */}
          <SensorCard
            parameterId="dissolved_oxygen"
            name="Dissolved Oxygen (DO)"
            value={liveReading?.dissolved_oxygen}
            unit="mg/L"
            status={getParamRisk('dissolved_oxygen')}
            optimalRange={`> ${thresholds?.dissolved_oxygen.safe ?? 5.0} mg/L`}
            isStale={isDisconnectedOrStale}
            isReporting={Boolean(liveReading && liveReading.dissolved_oxygen !== undefined && liveReading.dissolved_oxygen !== null)}
            trend={liveReading && liveReading.dissolved_oxygen < 4.0 ? 'down' : 'steady'}
            minScale={0}
            maxScale={12}
            safeMin={thresholds?.dissolved_oxygen.safe ?? 5.0}
            safeMax={10}
          />

          {/* pH */}
          <SensorCard
            parameterId="ph"
            name="Water pH"
            value={liveReading?.ph}
            unit="pH"
            status={getParamRisk('ph')}
            optimalRange={`${thresholds?.ph.min_safe ?? 7.2} – ${thresholds?.ph.max_safe ?? 8.4}`}
            isStale={isDisconnectedOrStale}
            isReporting={Boolean(liveReading && liveReading.ph !== undefined && liveReading.ph !== null)}
            trend="steady"
            minScale={4}
            maxScale={11}
            safeMin={thresholds?.ph.min_safe ?? 7.2}
            safeMax={thresholds?.ph.max_safe ?? 8.4}
          />

          {/* Ammonia */}
          <SensorCard
            parameterId="ammonia"
            name="Ammonia TAN"
            value={liveReading?.ammonia}
            unit="ppm"
            status={getParamRisk('ammonia')}
            optimalRange={`< ${thresholds?.ammonia.safe ?? 0.1} ppm`}
            isStale={isDisconnectedOrStale}
            isReporting={Boolean(liveReading && liveReading.ammonia !== undefined && liveReading.ammonia !== null)}
            trend={liveReading && liveReading.ammonia > 0.5 ? 'up' : 'steady'}
            minScale={0}
            maxScale={3}
            safeMin={0}
            safeMax={thresholds?.ammonia.safe ?? 0.1}
          />

          {/* Turbidity */}
          <SensorCard
            parameterId="turbidity"
            name="Water Turbidity"
            value={liveReading?.turbidity}
            unit="NTU"
            status={getParamRisk('turbidity')}
            optimalRange={`${thresholds?.turbidity.min_safe ?? 25} – ${thresholds?.turbidity.max_safe ?? 50} NTU`}
            isStale={isDisconnectedOrStale}
            isReporting={Boolean(liveReading && liveReading.turbidity !== undefined && liveReading.turbidity !== null)}
            trend="steady"
            minScale={0}
            maxScale={120}
            safeMin={thresholds?.turbidity.min_safe ?? 25}
            safeMax={thresholds?.turbidity.max_safe ?? 50}
          />

          {/* Water Depth Level */}
          <SensorCard
            parameterId="water_level"
            name="Pond Water Depth"
            value={liveReading?.water_level}
            unit="m"
            status={getParamRisk('water_level')}
            optimalRange={`${thresholds?.water_level.min_safe ?? 1.1} – ${thresholds?.water_level.max_safe ?? 1.6} m`}
            isStale={isDisconnectedOrStale}
            isReporting={Boolean(liveReading && liveReading.water_level !== undefined && liveReading.water_level !== null)}
            trend="steady"
            minScale={0.5}
            maxScale={2.5}
            safeMin={thresholds?.water_level.min_safe ?? 1.1}
            safeMax={thresholds?.water_level.max_safe ?? 1.6}
          />

          {/* Nitrate (Direct ESP32 Telemetry) */}
          {liveReading?.nitrate !== undefined && liveReading?.nitrate !== null && (
            <SensorCard
              parameterId="nitrate"
              name="Nitrate (NO3)"
              value={liveReading?.nitrate}
              unit="mg/L"
              status={liveReading.nitrate > 20.0 ? 'HIGH' : 'LOW'}
              optimalRange="< 10.0 mg/L"
              isStale={isDisconnectedOrStale}
              isReporting={true}
              trend="steady"
              minScale={0}
              maxScale={30}
              safeMin={0}
              safeMax={10}
            />
          )}
        </div>
      </div>

      {/* 3. Causes & Recommended Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CausesPanel causes={liveEvaluation?.causes || []} />
        <RecommendedActionsPanel actions={liveEvaluation?.recommended_actions || []} />
      </div>

      {/* 4. Compact Secondary Device Status Panel */}
      <DeviceStatusPanel />
    </div>
  );
};
