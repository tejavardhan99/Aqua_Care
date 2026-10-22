import React, { useState } from 'react';
import {
  BellRing,
  CheckCheck,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Clock,
  Radio,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusPill } from '../components/StatusPill';

export const AlertsPage: React.FC = () => {
  const { alerts, unreadAlertCount, ackAlert, ackAllAlerts, refreshAlerts } = useApp();
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [unackOnly, setUnackOnly] = useState<boolean>(false);

  // Filter alerts
  const filteredAlerts = alerts.filter((a) => {
    if (unackOnly && a.acknowledged) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200">
              <BellRing className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Alerts &amp; Actions Log</h1>
            {unreadAlertCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                {unreadAlertCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Audit log of all real-time biological and environmental hazard alerts evaluated from live ESP32 telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadAlertCount > 0 && (
            <button
              onClick={() => ackAllAlerts()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Acknowledge All</span>
            </button>
          )}
          <button
            onClick={() => refreshAlerts()}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
            title="Refresh alert feed"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 shadow-glass flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Severity:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'WARNING'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg border font-medium transition-colors ${
                severityFilter === sev
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={unackOnly}
              onChange={(e) => setUnackOnly(e.target.checked)}
              className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
            />
            <span>Unacknowledged Only</span>
          </label>
        </div>
      </div>

      {/* Alert Cards Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center shadow-glass">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2 opacity-80" />
            <h3 className="font-bold text-slate-800 text-base">No Alerts Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no alert records matching your active filters. All prawn pond parameters are currently within tolerance.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`glass-panel rounded-2xl p-5 shadow-glass transition-all hover:shadow-glass-hover ${
                !alert.acknowledged
                  ? alert.severity === 'CRITICAL'
                    ? 'border-l-4 border-l-red-500 border-red-200 bg-red-50/10'
                    : alert.severity === 'HIGH'
                    ? 'border-l-4 border-l-orange-500 border-orange-200 bg-orange-50/10'
                    : 'border-l-4 border-l-amber-500 border-amber-200'
                  : 'border-slate-200/90 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={alert.severity} size="sm" />
                    <h3 className="font-bold text-slate-900 text-sm">{alert.rule_name}</h3>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Rule: {alert.rule_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{alert.explanation}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => ackAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCheck className="w-3.5 h-3.5" />
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>

              {/* Recommended Action Card */}
              {alert.recommended_action && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">
                    Automated Advice &amp; Action Plan:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{alert.recommended_action}</p>
                </div>
              )}

              {/* Footer Meta */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                  <span>
                    Observed: <strong className="text-red-700 font-mono">{alert.observed_value} {alert.unit}</strong>
                  </span>
                  <span>Pond: <strong className="text-slate-700">{alert.pond_id}</strong></span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Deduplication cooldown: 10 mins (bypassed on severity escalation)
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* External Notification Dispatch Status */}
      <div className="glass-panel rounded-2xl p-6 shadow-glass">
        <h3 className="font-semibold text-slate-900 text-sm mb-1">External Notification Integrations</h3>
        <p className="text-xs text-slate-500 mb-3">
          Channel status per system configuration. Alerts are dispatched in-app; external delivery channels are marked below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-0.5">In-App Notification Bell</span>
            <span className="font-bold text-emerald-700">Active (Real-time)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-0.5">Email Alerts (SMTP)</span>
            <span className="font-bold text-slate-500">Not configured</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-0.5">SMS Gateway (Twilio)</span>
            <span className="font-bold text-slate-500">Not configured</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-0.5">Telegram Bot Channel</span>
            <span className="font-bold text-slate-500">Not configured</span>
          </div>
        </div>
      </div>
    </div>
  );
};

