import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  AlertCircle,
  DollarSign,
  Target,
  ArrowRight,
  ShieldAlert,
  Bot,
  Zap,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AnalyticsOverview, RecoveryOpportunity } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  onSelectPayment: (paymentId: string) => void;
  onNavigateOpportunities: () => void;
  onNavigateAIAgent: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectPayment,
  onNavigateOpportunities,
  onNavigateAIAgent,
}) => {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [topOpportunities, setTopOpportunities] = useState<RecoveryOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, opps] = await Promise.all([
        api.getAnalyticsOverview(range),
        api.getOpportunities({ limit: '5', minPriority: '75', status: 'OPEN' }),
      ]);
      setData(overview);
      setTopOpportunities(opps.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const metrics = data?.metrics;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Range Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Revenue Recovery Console</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time algorithmic dunning and AI revenue recovery telemetry
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 self-start">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                range === r
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Processed */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Processed Volume</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            ₹{metrics ? metrics.totalProcessedRevenue.toLocaleString() : '---'}
          </div>
          <p className="text-[11px] text-slate-500">Gross transaction flow for {range}</p>
        </div>

        {/* Failed Payment Value */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Lost / Failed GMV</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">
            ₹{metrics ? metrics.failedPaymentValue.toLocaleString() : '---'}
          </div>
          <p className="text-[11px] text-slate-500">Dropouts requiring recovery dunning</p>
        </div>

        {/* Recoverable Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/20 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Recoverable Potential</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            ₹{metrics ? metrics.recoverableRevenue.toLocaleString() : '---'}
          </div>
          <p className="text-[11px] text-emerald-400/70">
            {metrics?.openOpportunitiesCount || 0} open targets waiting
          </p>
        </div>

        {/* Recovered Revenue & Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/20 bg-gradient-to-br from-slate-900 to-sky-950/20 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-sky-400 font-medium">
            <span>Recovered Revenue</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white flex items-baseline gap-2">
            <span>₹{metrics ? metrics.recoveredRevenue.toLocaleString() : '---'}</span>
            <span className="text-sm font-bold text-sky-400">
              ({metrics?.recoveryRate || 0}%)
            </span>
          </div>
          <p className="text-[11px] text-sky-400/70">Successful dunning recoveries</p>
        </div>
      </div>

      {/* Middle Row: Revenue Overview Chart & AI Quick Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Revenue Overview */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Revenue Overview</h3>
              <p className="text-xs text-slate-400">Successful, failed, and recovered transaction trends</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Successful
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Failed
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Recovered
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {data && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                  />
                  <Area type="monotone" dataKey="successful" stroke="#22c55e" fillOpacity={1} fill="url(#colorSuccess)" name="Successful" />
                  <Area type="monotone" dataKey="failed" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFailed)" name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {loading ? 'Plotting transaction curves...' : 'No telemetry points for period.'}
              </div>
            )}
          </div>
        </div>

        {/* AI Copilot Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-850 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Dunning Assistant</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Query transaction telemetry, simulate high-value recoveries, and generate tailored WhatsApp outreach with zero manual scripting.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Recommendation:
              </span>
              <p className="text-slate-300 text-[11px]">
                {metrics?.highPriorityCount || 0} high-priority VIP payments detected. Immediate WhatsApp outreach recommended before session expiry.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateAIAgent}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
          >
            Launch AI Merchant Copilot
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Section: High-Priority Recovery Opportunities Quick Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              High-Priority Recovery Queue
            </h3>
            <p className="text-xs text-slate-400">Failed payments with peak probability and highest recoverable revenue</p>
          </div>
          <button
            onClick={onNavigateOpportunities}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
          >
            View All Opportunities
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Failure Reason</th>
                <th className="py-3 px-4">Recovery Probability</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topOpportunities.map((opp) => (
                <tr
                  key={opp.id}
                  onClick={() => onSelectPayment(opp.paymentId)}
                  className="hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{opp.payment?.customer?.name || 'Customer'}</div>
                    <div className="text-[10px] text-slate-500">{opp.payment?.orderId}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    ₹{opp.payment?.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-medium">
                      {(opp.payment?.failureReason || 'UNKNOWN').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {Math.round(opp.recoveryProbability * 100)}%
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                      {opp.priorityScore}/100
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sky-300 font-medium">
                    {opp.recommendedAction.replace(/_/g, ' ')} via {opp.recommendedChannel}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPayment(opp.paymentId);
                      }}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition"
                    >
                      Recover
                    </button>
                  </td>
                </tr>
              ))}

              {topOpportunities.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No open high-priority opportunities found. All high-tier items recovered!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
