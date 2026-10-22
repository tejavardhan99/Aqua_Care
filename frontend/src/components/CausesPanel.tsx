import React from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import type { RuleCause } from '../types';
import { StatusPill } from './StatusPill';

interface CausesPanelProps {
  causes: RuleCause[];
}

export const CausesPanel: React.FC<CausesPanelProps> = ({ causes }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 shadow-glass">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              Active Hazard Causes &amp; Triggered Rules
            </h3>
            <p className="text-xs text-slate-500">
              Direct telemetry threshold violations detected by the backend rule engine.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {causes.length} {causes.length === 1 ? 'Rule Fired' : 'Rules Fired'}
        </span>
      </div>

      {/* Cause List */}
      {causes.length === 0 ? (
        <div className="py-6 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80 mb-2" />
          <p className="text-xs font-medium text-slate-600">Zero active hazards detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {causes.map((c) => (
            <div
              key={c.rule_id}
              className={`p-3.5 rounded-xl border text-xs transition-all ${
                c.severity === 'CRITICAL'
                  ? 'bg-red-50/50 border-red-200'
                  : c.severity === 'HIGH'
                  ? 'bg-orange-50/40 border-orange-200'
                  : 'bg-amber-50/30 border-amber-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <StatusPill status={c.severity} size="sm" />
                  <span className="font-bold text-slate-900 text-sm">{c.rule_name}</span>
                </div>
                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                  {c.rule_id}
                </span>
              </div>

              <p className="text-slate-700 leading-relaxed mb-2.5">{c.description}</p>

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200/50 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400">Parameter:</span>{' '}
                  <span className="font-semibold text-slate-800 capitalize">{c.parameter}</span>
                </div>
                <div>
                  <span className="text-slate-400">Measured:</span>{' '}
                  <span className="font-bold text-red-700 font-mono">
                    {c.measured_value} {c.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Breached Threshold:</span>{' '}
                  <span className="font-mono font-medium text-slate-800">{c.threshold_limit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

