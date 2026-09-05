import React from 'react';
import {
  LayoutDashboard,
  Target,
  CreditCard,
  Users,
  Bot,
  BarChart3,
  Activity,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'opportunities'
  | 'payments'
  | 'customers'
  | 'ai-agent'
  | 'analytics'
  | 'activity'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  openOpportunitiesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openOpportunitiesCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'opportunities' as NavTab,
      label: 'Recovery Opportunities',
      icon: Target,
      badge: openOpportunitiesCount > 0 ? openOpportunitiesCount : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'payments' as NavTab,
      label: 'Payments',
      icon: CreditCard,
    },
    {
      id: 'customers' as NavTab,
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'ai-agent' as NavTab,
      label: 'AI Agent',
      icon: Bot,
      highlight: true,
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'activity' as NavTab,
      label: 'Activity Log',
      icon: Activity,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-white tracking-tight">RecoverAI</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              MVP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Razorpay AI Buildathon</p>
        </div>
      </div>

      {/* Track Pill */}
      <div className="mx-4 my-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <div className="text-[11px] leading-tight">
          <span className="text-slate-400 block">Competition Track:</span>
          <span className="text-white font-semibold">Track 3 — AI Revenue Recovery</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                  : item.highlight
                  ? 'text-sky-300 hover:bg-sky-500/10 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : item.highlight ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Live
          </span>
          <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
