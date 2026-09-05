import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto text-slate-200">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          Settings & Environment
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          RecoverAI environment and Razorpay AI Buildathon competition runtime parameters
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Competition Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Hackathon Event:</span>
            <span className="text-white font-bold">Razorpay AI Buildathon</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Challenge Track:</span>
            <span className="text-emerald-400 font-bold">Track 3 — AI Revenue Recovery</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Core AI Architecture:</span>
            <span className="text-white font-semibold">OpenAI-Compatible Abstraction + Deterministic Fallback</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Database:</span>
            <span className="text-white font-semibold">SQLite via Prisma ORM</span>
          </div>
        </div>

        {health && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400">Live Health Check Telemetry:</span>
            <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
