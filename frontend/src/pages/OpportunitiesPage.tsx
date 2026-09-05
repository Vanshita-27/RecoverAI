import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Target,
  RotateCcw,
} from 'lucide-react';
import { RecoveryOpportunity } from '../types';
import { api } from '../services/api';

interface OpportunitiesPageProps {
  onSelectPayment: (paymentId: string) => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ onSelectPayment }) => {
  const [opportunities, setOpportunities] = useState<RecoveryOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getOpportunities({ limit: '100' });
      setOpportunities(res.data);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Client-side filtering & sorting for zero-latency filter switches
  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => {
        const payment = opp.payment;
        if (!payment) return true;

        // Search match
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchCustomer = payment.customer?.name.toLowerCase().includes(q);
          const matchEmail = payment.customer?.email.toLowerCase().includes(q);
          const matchOrder = payment.orderId.toLowerCase().includes(q);
          const matchId = payment.id.toLowerCase().includes(q);
          if (!matchCustomer && !matchEmail && !matchOrder && !matchId) return false;
        }

        // Status match
        if (statusFilter !== 'ALL' && opp.status !== statusFilter) return false;

        // Payment Method match
        if (methodFilter !== 'ALL' && payment.paymentMethod !== methodFilter) return false;

        // Failure Reason match
        if (reasonFilter !== 'ALL' && payment.failureReason !== reasonFilter) return false;

        // Priority filter
        if (priorityFilter === 'HIGH' && opp.priorityScore < 75) return false;
        if (priorityFilter === 'MEDIUM' && (opp.priorityScore < 50 || opp.priorityScore >= 75)) return false;
        if (priorityFilter === 'LOW' && opp.priorityScore >= 50) return false;

        return true;
      })
      .sort((a, b) => {
        const amtA = a.payment?.amount || 0;
        const amtB = b.payment?.amount || 0;
        return sortOrder === 'desc' ? amtB - amtA : amtA - amtB;
      });
  }, [opportunities, search, statusFilter, methodFilter, reasonFilter, priorityFilter, sortOrder]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" />
            Recovery Opportunities
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized failed transactions dynamically evaluated for revenue recovery
          </p>
        </div>

        <button
          onClick={fetchOpportunities}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by customer, email, order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Targets</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RECOVERED">Recovered</option>
              <option value="UNRECOVERABLE">Unrecoverable</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Priority Levels</option>
              <option value="HIGH">High Priority (75+)</option>
              <option value="MEDIUM">Medium Priority (50–74)</option>
              <option value="LOW">Low Priority (&lt;50)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Payment Method */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300"
            >
              <option value="ALL">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="NETBANKING">Netbanking</option>
              <option value="WALLET">Wallet</option>
              <option value="EMI">EMI</option>
            </select>

            {/* Failure Reason */}
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300"
            >
              <option value="ALL">All Failure Reasons</option>
              <option value="UPI_TIMEOUT">UPI Timeout</option>
              <option value="NETWORK_ERROR">Network Error</option>
              <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
              <option value="CARD_EXPIRED">Card Expired</option>
              <option value="BANK_DECLINED">Bank Declined</option>
              <option value="LIMIT_EXCEEDED">Limit Exceeded</option>
              <option value="PAYMENT_SESSION_EXPIRED">Session Expired</option>
            </select>
          </div>

          {/* Amount Sort Button */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-slate-300 font-medium transition"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Amount: {sortOrder === 'desc' ? 'Highest First' : 'Lowest First'}
          </button>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Failure Diagnostics</th>
                <th className="py-3.5 px-4 font-semibold">Recovery Probability</th>
                <th className="py-3.5 px-4 font-semibold">Priority</th>
                <th className="py-3.5 px-4 font-semibold">Recommended Strategy</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredOpportunities.map((opp) => {
                const payment = opp.payment;
                const isRecovered = opp.status === 'RECOVERED';
                const isInProgress = opp.status === 'IN_PROGRESS';

                return (
                  <tr
                    key={opp.id}
                    onClick={() => onSelectPayment(opp.paymentId)}
                    className="hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{payment?.customer?.name || 'Customer'}</div>
                      <div className="text-[10px] text-slate-500">{payment?.customer?.email}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      ₹{payment?.amount.toLocaleString()}
                    </td>

                    {/* Failure Reason & Method */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="font-medium text-rose-300 text-[11px]">
                        {(payment?.failureReason || 'UNKNOWN').replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Via {payment?.paymentMethod} • Order: {payment?.orderId}
                      </div>
                    </td>

                    {/* Probability */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 text-sm">
                          {Math.round(opp.recoveryProbability * 100)}%
                        </span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.round(opp.recoveryProbability * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          opp.priorityScore >= 75
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : opp.priorityScore >= 50
                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {opp.priorityScore}/100
                      </span>
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-sky-300 text-[11px]">
                        {opp.recommendedAction.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        via {opp.recommendedChannel}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isRecovered
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isInProgress
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {opp.status}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPayment(opp.paymentId);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isRecovered
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-sm'
                        }`}
                      >
                        {isRecovered ? 'View Saved' : 'Recover Now'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOpportunities.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="font-semibold text-sm">No recovery opportunities matched your criteria.</p>
                    <p className="text-xs text-slate-500">Try clearing filters or resetting the search query.</p>
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
