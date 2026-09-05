import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Search, ArrowUpRight, X, RotateCcw } from 'lucide-react';
import { Customer } from '../types';
import { api } from '../services/api';

interface CustomersPageProps {
  onSelectPayment: (paymentId: string) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ onSelectPayment }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({ limit: '100' });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenCustomer = async (customerId: string) => {
    try {
      const cust = await api.getCustomerById(customerId);
      setSelectedCustomer(cust);
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchPhone = c.phone.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      if (segmentFilter !== 'ALL' && c.customerSegment !== segmentFilter) return false;

      return true;
    });
  }, [customers, search, segmentFilter]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Customer Portfolio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Accounts segmented by historical lifetime value and payment reliability
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="w-full md:flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search customers by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="w-full md:w-auto">
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Segments</option>
            <option value="HIGH_VALUE">High Value VIP</option>
            <option value="REGULAR">Regular Accounts</option>
            <option value="NEW">New Customers</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Customer Name</th>
                <th className="py-3.5 px-4 font-semibold">Segment</th>
                <th className="py-3.5 px-4 font-semibold">Lifetime Value</th>
                <th className="py-3.5 px-4 font-semibold">Successful Purchases</th>
                <th className="py-3.5 px-4 font-semibold">Failed Dropouts</th>
                <th className="py-3.5 px-4 font-semibold">Recovery Potential</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.map((c) => {
                const totalAttempts = c.successfulPayments + c.failedPayments;
                const reliability = totalAttempts > 0 ? Math.round((c.successfulPayments / totalAttempts) * 100) : 100;

                return (
                  <tr
                    key={c.id}
                    onClick={() => handleOpenCustomer(c.id)}
                    className="hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.email} • {c.phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.customerSegment === 'HIGH_VALUE'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : c.customerSegment === 'REGULAR'
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {c.customerSegment.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      ₹{c.lifetimeValue.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-emerald-400">
                      {c.successfulPayments} orders
                    </td>

                    <td className="py-3.5 px-4 font-medium text-rose-400">
                      {c.failedPayments} drops
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-200">{reliability}%</span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${reliability}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCustomer(c.id);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Slide-over / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-400">{selectedCustomer.email} • {selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Segment</span>
                <span className="text-sm font-bold text-white">{selectedCustomer.customerSegment}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Lifetime Value</span>
                <span className="text-sm font-bold text-emerald-400">₹{selectedCustomer.lifetimeValue.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Success / Fails</span>
                <span className="text-sm font-bold text-white">{selectedCustomer.successfulPayments} / {selectedCustomer.failedPayments}</span>
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Payment History</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedCustomer.payments?.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedCustomer(null);
                      onSelectPayment(p.id);
                    }}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-mono font-bold text-white block">{p.orderId}</span>
                      <span className="text-slate-400 text-[10px]">
                        {p.paymentMethod} • {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="font-bold text-white">₹{p.amount.toLocaleString()}</div>
                        <span
                          className={`text-[9px] font-bold uppercase ${
                            p.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
