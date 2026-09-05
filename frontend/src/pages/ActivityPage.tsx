import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RotateCcw, Clock, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';
import { ActivityLog } from '../types';
import { api } from '../services/api';

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getActivityLogs({ limit: '100' });
      setActivities(res.data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            System Activity Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time chronological audit trail of AI evaluations, recovery actions, and simulation outcomes
          </p>
        </div>

        <button
          onClick={fetchActivities}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Log
        </button>
      </div>

      {/* Activity Timeline List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="space-y-4">
          {activities.map((act) => {
            const isRecoverySuccess = act.action.includes('RECOVERED');
            const isActionInitiated = act.action.includes('INITIATED') || act.action.includes('MESSAGE');
            const isAnalyzed = act.action.includes('ANALYZED') || act.action.includes('IDENTIFIED');
            const isRetryFailed = act.action.includes('FAILED');

            return (
              <div
                key={act.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-800 transition"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isRecoverySuccess
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isRetryFailed
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : isActionInitiated
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}
                >
                  {isRecoverySuccess && <CheckCircle2 className="w-5 h-5" />}
                  {isRetryFailed && <Zap className="w-5 h-5" />}
                  {isActionInitiated && <Zap className="w-5 h-5" />}
                  {isAnalyzed && <ShieldCheck className="w-5 h-5" />}
                  {!isRecoverySuccess && !isRetryFailed && !isActionInitiated && !isAnalyzed && (
                    <Activity className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Entity: {act.entityType} • ID: {act.entityId}
                  </div>
                </div>
              </div>
            );
          })}

          {activities.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No activity logged yet. Launch a recovery action to record events.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
