import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  Zap,
} from 'lucide-react';
import type { RecommendedAction, ActionPriority } from '../types';
import { useApp } from '../context/AppContext';

interface RecommendedActionsPanelProps {
  actions: RecommendedAction[];
}

export const RecommendedActionsPanel: React.FC<RecommendedActionsPanelProps> = ({
  actions,
}) => {
  const { executeDeviceAction } = useApp();

  const getPriorityBadge = (priority: ActionPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-glass">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              Recommended Pond Interventions
            </h3>
            <p className="text-xs text-slate-500">
              Guidance generated automatically by backend rule engine for your prawn pond.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {actions.length} {actions.length === 1 ? 'Action' : 'Actions'}
        </span>
      </div>

      {/* Action List */}
      {actions.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/80 mb-2" />
          <p className="text-sm font-medium text-slate-700">No Interventions Required</p>
          <p className="text-xs text-slate-500 mt-0.5">
            All biological water quality parameters are within safe and optimal limits.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((act) => (
            <div
              key={act.action_id}
              className={`p-4 rounded-xl border transition-all ${
                act.priority === 'URGENT'
                  ? 'bg-red-50/40 border-red-200'
                  : act.priority === 'HIGH'
                  ? 'bg-orange-50/30 border-orange-200'
                  : 'bg-slate-50/50 border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityBadge(
                      act.priority
                    )}`}
                  >
                    {act.priority}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                </div>

                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {act.status || 'Suggested only'}
                </span>
              </div>

              <p className="text-xs text-slate-700 mb-3 leading-relaxed">{act.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-slate-500">
                  Trigger parameter: <span className="font-semibold text-slate-700 font-mono">{act.trigger_cause}</span>
                </span>

                {/* Device action button if edge control is supported */}
                {act.device_command && (
                  <button
                    onClick={() => executeDeviceAction(act.device_command!, act.title)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-medium shadow-xs transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Send Relay Command</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
