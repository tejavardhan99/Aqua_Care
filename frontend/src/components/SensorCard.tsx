import React from 'react';
import {
  Thermometer,
  Droplets,
  Activity,
  Layers,
  FlaskConical,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { StatusPill } from './StatusPill';
import type { RiskLevel } from '../types';

interface SensorCardProps {
  parameterId: 'temperature' | 'dissolved_oxygen' | 'ph' | 'ammonia' | 'turbidity' | 'water_level';
  name: string;
  value: number | null | undefined;
  unit: string;
  status: RiskLevel;
  optimalRange: string;
  isStale?: boolean;
  isReporting?: boolean;
  trend?: 'up' | 'down' | 'steady';
  minScale?: number;
  maxScale?: number;
  safeMin?: number;
  safeMax?: number;
}

/**
 * Adapted from 21st.dev @21st/stat-sparkline-card
 * Frosted glass card with large tabular figures, gradient icon tile, thin range gauge, and SVG mini sparkline.
 * Handles live telemetry, missing sensor data ("Sensor not reporting"), and stale data dimming.
 */
export const SensorCard: React.FC<SensorCardProps> = ({
  parameterId,
  name,
  value,
  unit,
  status,
  optimalRange,
  isStale = false,
  isReporting = true,
  trend = 'steady',
  minScale = 0,
  maxScale = 100,
  safeMin = 20,
  safeMax = 80,
}) => {
  // Select icon & gradient tile styling
  const getParamMeta = () => {
    switch (parameterId) {
      case 'temperature':
        return {
          icon: Thermometer,
          gradient: 'from-orange-500 to-rose-600',
          tileBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
          sparkColor: '#f43f5e',
          sparkPoints: [28.2, 28.6, 28.9, 29.4, 29.1, 29.3, 29.2],
        };
      case 'dissolved_oxygen':
        return {
          icon: Droplets,
          gradient: 'from-blue-600 to-cyan-500',
          tileBg: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
          sparkColor: '#06b6d4',
          sparkPoints: [5.2, 5.5, 5.9, 6.1, 5.8, 5.7, 5.8],
        };
      case 'ph':
        return {
          icon: Activity,
          gradient: 'from-emerald-600 to-teal-500',
          tileBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          sparkColor: '#10b981',
          sparkPoints: [7.4, 7.5, 7.7, 7.8, 7.6, 7.7, 7.6],
        };
      case 'ammonia':
        return {
          icon: FlaskConical,
          gradient: 'from-amber-500 to-red-600',
          tileBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          sparkColor: '#f59e0b',
          sparkPoints: [0.03, 0.04, 0.05, 0.04, 0.04, 0.05, 0.04],
        };
      case 'turbidity':
        return {
          icon: Gauge,
          gradient: 'from-indigo-600 to-cyan-600',
          tileBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          sparkColor: '#6366f1',
          sparkPoints: [30, 32, 34, 33, 31, 33, 32],
        };
      case 'water_level':
        return {
          icon: Layers,
          gradient: 'from-sky-500 to-teal-600',
          tileBg: 'bg-sky-50 text-sky-700 border-sky-200/80',
          sparkColor: '#0ea5e9',
          sparkPoints: [1.3, 1.32, 1.35, 1.34, 1.36, 1.35, 1.35],
        };
      default:
        return {
          icon: Activity,
          gradient: 'from-slate-600 to-teal-600',
          tileBg: 'bg-slate-50 text-slate-700 border-slate-200',
          sparkColor: '#0284c7',
          sparkPoints: [50, 50, 50, 50, 50],
        };
    }
  };

  const meta = getParamMeta();
  const Icon = meta.icon;

  const hasValidValue = value !== null && value !== undefined && !isNaN(value) && isReporting;

  // Calculate percentage within scale for thin range gauge
  const numValue = hasValidValue ? Number(value) : minScale;
  const clamped = Math.max(minScale, Math.min(numValue, maxScale));
  const percent = ((clamped - minScale) / (maxScale - minScale)) * 100;
  const safeMinPct = ((safeMin - minScale) / (maxScale - minScale)) * 100;
  const safeMaxPct = ((safeMax - minScale) / (maxScale - minScale)) * 100;

  // Sparkline generator
  const points = meta.sparkPoints;
  const minP = Math.min(...points);
  const maxP = Math.max(...points);
  const rangeP = maxP - minP || 1;
  const svgWidth = 80;
  const svgHeight = 24;

  const sparklineD = points
    .map((pt, i) => {
      const x = (i / (points.length - 1)) * svgWidth;
      const y = svgHeight - ((pt - minP) / rangeP) * (svgHeight - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div
      className={`glass-panel rounded-2xl p-5 transition-all duration-300 hover:shadow-glass-hover hover:-translate-y-1 relative overflow-hidden ${
        isStale
          ? 'border-amber-300/60 bg-white/70'
          : !hasValidValue
          ? 'border-slate-300 bg-white/75'
          : status === 'CRITICAL'
          ? 'border-red-300/80 ring-2 ring-red-400/30'
          : status === 'HIGH'
          ? 'border-orange-300/80 ring-1 ring-orange-400/20'
          : status === 'MEDIUM'
          ? 'border-amber-300/80'
          : 'border-white/80'
      }`}
    >
      {/* Top Header: Gradient Icon Tile + Metric Title + Status Pill */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${meta.gradient} flex items-center justify-center text-white shadow-md shrink-0`}
          >
            <Icon className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight leading-snug">
              {name}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Target: {optimalRange}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {!hasValidValue ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-slate-500" />
            No Signal
          </span>
        ) : isStale ? (
          <StatusPill status="STALE" size="sm" isStale={true} />
        ) : (
          <StatusPill status={status} size="sm" />
        )}
      </div>

      {/* Main Metric Value (Bold Tabular Numbers) + Mini Sparkline */}
      <div className="flex items-baseline justify-between mt-2 mb-3">
        <div className="flex items-baseline gap-1.5">
          {hasValidValue ? (
            <>
              <span
                className={`font-mono tabular-nums text-4xl font-black tracking-tight transition-opacity ${
                  isStale ? 'opacity-40 text-slate-500' : 'text-slate-950'
                }`}
              >
                {typeof value === 'number'
                  ? value.toFixed(parameterId === 'ammonia' ? 3 : 1)
                  : value}
              </span>
              <span className="text-sm font-bold text-slate-600">{unit}</span>
            </>
          ) : (
            <div className="py-1">
              <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Sensor not reporting
              </span>
            </div>
          )}
        </div>

        {/* Mini SVG Sparkline Trend */}
        {hasValidValue && (
          <div className="flex flex-col items-end justify-center">
            <svg width="80" height="24" className="overflow-visible">
              <path
                d={sparklineD}
                fill="none"
                stroke={isStale ? '#94a3b8' : meta.sparkColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isStale ? 0.4 : 0.85}
              />
            </svg>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-1">
              {trend === 'up' && (
                <span className="flex items-center text-amber-700">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> 24h Rising
                </span>
              )}
              {trend === 'down' && (
                <span className="flex items-center text-blue-700">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> 24h Falling
                </span>
              )}
              {trend === 'steady' && (
                <span className="flex items-center text-slate-500">
                  <Minus className="w-3 h-3 mr-0.5" /> 24h Baseline
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thin Safe-Zone Range Gauge Bar */}
      {hasValidValue && (
        <div className="space-y-1 mb-3">
          <div className="relative h-2 w-full rounded-full bg-slate-200/90 overflow-hidden">
            {/* Safe zone highlight */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-200/70 border-x border-emerald-400/40"
              style={{
                left: `${safeMinPct}%`,
                width: `${safeMaxPct - safeMinPct}%`,
              }}
            />
            {/* Value fill track */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isStale
                  ? 'bg-amber-400 opacity-50'
                  : status === 'CRITICAL'
                  ? 'bg-red-500'
                  : status === 'HIGH'
                  ? 'bg-orange-500'
                  : status === 'MEDIUM'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono font-medium text-slate-500">
            <span>{minScale} {unit}</span>
            <span className="text-emerald-700 font-semibold">Safe: {safeMin}–{safeMax}</span>
            <span>{maxScale} {unit}</span>
          </div>
        </div>
      )}

      {/* Card Footer: Origin Tag & Status Alert */}
      <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
        {isStale ? (
          <span className="inline-flex items-center gap-1 text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            STALE (&gt;20s)
          </span>
        ) : !hasValidValue ? (
          <span className="inline-flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
            CHECK HARDWARE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live ESP32
          </span>
        )}

        <span className="text-slate-500 text-[11px] italic">
          Macrobrachium
        </span>
      </div>
    </div>
  );
};
