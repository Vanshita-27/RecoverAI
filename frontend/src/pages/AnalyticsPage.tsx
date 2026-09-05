import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, RotateCcw } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { AnalyticsOverview } from '../types';
import { api } from '../services/api';

const COLORS = ['#22c55e', '#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#ec4899'];

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAnalyticsOverview('30d');
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const metrics = data?.metrics;

  const failureReasonChartData = (data?.failureReasons || []).map((r) => ({
    name: r.reason.replace(/_/g, ' '),
    amount: r.totalAmount,
    count: r.count,
  }));

  const paymentMethodChartData = (data?.paymentMethods || []).map((m) => ({
    name: m.paymentMethod,
    failedAmount: m.failedAmount,
    failureRate: m.failureRatePct,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Revenue Recovery Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Diagnostic breakdown of lost GMV, recovery efficiency, and payment rail failure distributions
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Lost / Failed GMV</span>
          <div className="text-2xl font-bold text-rose-400">
            ₹{metrics ? metrics.failedPaymentValue.toLocaleString() : '---'}
          </div>
          <span className="text-[11px] text-slate-500">Unrecovered transaction dropoffs</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Recoverable Revenue</span>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{metrics ? metrics.recoverableRevenue.toLocaleString() : '---'}
          </div>
          <span className="text-[11px] text-slate-500">Targetable via automated dunning</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Net Recovered Revenue</span>
          <div className="text-2xl font-bold text-sky-400">
            ₹{metrics ? metrics.recoveredRevenue.toLocaleString() : '---'}
          </div>
          <span className="text-[11px] text-slate-500">Successfully salvaged orders</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Overall Recovery Rate</span>
          <div className="text-2xl font-bold text-white">
            {metrics ? `${metrics.recoveryRate}%` : '---'}
          </div>
          <span className="text-[11px] text-slate-500">Conversion efficiency on lost orders</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failure Reasons Bar Chart */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Failure Reasons Breakdown</h3>
            <p className="text-xs text-slate-400">Volume of lost revenue grouped by technical failure code</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureReasonChartData} layout="vertical" margin={{ left: 30, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Lost Volume']}
                />
                <Bar dataKey="amount" fill="#38bdf8" radius={[0, 4, 4, 0]}>
                  {failureReasonChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Failure Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Payment Method Failure Distribution</h3>
            <p className="text-xs text-slate-400">Failed volume by payment rail (UPI, Card, Netbanking, etc.)</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodChartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Failed Volume']}
                />
                <Bar dataKey="failedAmount" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
