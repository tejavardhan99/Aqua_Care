import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  OctagonAlert,
  Wifi,
  WifiOff,
  Clock,
  HelpCircle,
} from 'lucide-react';
import type { RiskLevel, ConnectionStatusType, AlertSeverityType } from '../types';

interface StatusPillProps {
  status: RiskLevel | ConnectionStatusType | AlertSeverityType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  isStale?: boolean;
}

/**
 * Adapted from 21st.dev @21st/status-badge
 * High-contrast indicator pairing clear status colors with symbols and text.
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
  isStale = false,
}) => {
  // If explicitly flagged stale, always render Stale badge instead of Safe
  const normalized = isStale ? 'STALE' : (status || '').toUpperCase();

  let bg = 'bg-slate-100 text-slate-800 border-slate-300';
  let IconComponent = HelpCircle;
  let label = status;

  switch (normalized) {
    case 'LOW':
    case 'SAFE':
    case 'INFO':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-300/80 shadow-xs';
      IconComponent = CheckCircle2;
      label = 'Safe';
      break;

    case 'MEDIUM':
    case 'WARNING':
      bg = 'bg-amber-50 text-amber-900 border-amber-300/90 shadow-xs';
      IconComponent = AlertTriangle;
      label = 'Warning';
      break;

    case 'HIGH':
      bg = 'bg-orange-50 text-orange-950 border-orange-300 shadow-xs';
      IconComponent = AlertCircle;
      label = 'High Risk';
      break;

    case 'CRITICAL':
      bg = 'bg-red-50 text-red-900 border-red-300 shadow-xs';
      IconComponent = OctagonAlert;
      label = 'Critical';
      break;

    // Connection & Stale Statuses
    case 'CONNECTED':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      IconComponent = Wifi;
      label = 'Connected';
      break;

    case 'STALE':
      bg = 'bg-amber-100/90 text-amber-900 border-amber-400 font-bold';
      IconComponent = Clock;
      label = 'Stale';
      break;

    case 'DISCONNECTED':
      bg = 'bg-slate-200 text-slate-800 border-slate-400 font-semibold';
      IconComponent = WifiOff;
      label = 'Disconnected';
      break;

    case 'UNKNOWN':
    default:
      bg = 'bg-slate-100 text-slate-700 border-slate-300';
      IconComponent = HelpCircle;
      label = 'Unknown';
      break;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all ${bg} ${sizeClasses} ${className}`}
    >
      {showIcon && (
        <IconComponent
          className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0 ${
            normalized === 'CONNECTED' ? 'animate-pulse text-emerald-600' : ''
          }`}
        />
      )}
      <span>{label}</span>
    </span>
  );
};
