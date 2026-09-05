import { useState, useEffect, useCallback } from 'react';
import { ToastProvider } from './components/Toast';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { PaymentModal } from './components/PaymentModal';

import { DashboardPage } from './pages/DashboardPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { CustomersPage } from './pages/CustomersPage';
import { AIAgentPage } from './pages/AIAgentPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';

import { api } from './services/api';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [openOpportunitiesCount, setOpenOpportunitiesCount] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Fetch count of open opportunities for sidebar badge
  const updateBadgeCount = useCallback(async () => {
    try {
      const res = await api.getOpportunities({ status: 'OPEN', limit: '1' });
      setOpenOpportunitiesCount(res.total);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    updateBadgeCount();
  }, [updateBadgeCount, refreshKey]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    await updateBadgeCount();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getPageTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'opportunities':
        return 'Recovery Opportunities Queue';
      case 'payments':
        return 'Transaction Ledger';
      case 'customers':
        return 'Customer Portfolio';
      case 'ai-agent':
        return 'AI Merchant Copilot';
      case 'analytics':
        return 'Recovery Performance Analytics';
      case 'activity':
        return 'Real-Time Activity Audit';
      case 'settings':
        return 'Competition & Runtime Settings';
      default:
        return 'RecoverAI';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setMobileMenuOpen(false);
          }}
          openOpportunitiesCount={openOpportunitiesCount}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              openOpportunitiesCount={openOpportunitiesCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getPageTitle(currentTab)}
          subtitle="Razorpay AI Buildathon • Track 3: AI Revenue Recovery"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              key={refreshKey}
              onSelectPayment={(id) => setSelectedPaymentId(id)}
              onNavigateOpportunities={() => setCurrentTab('opportunities')}
              onNavigateAIAgent={() => setCurrentTab('ai-agent')}
            />
          )}

          {currentTab === 'opportunities' && (
            <OpportunitiesPage
              key={refreshKey}
              onSelectPayment={(id) => setSelectedPaymentId(id)}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsPage
              key={refreshKey}
              onSelectPayment={(id) => setSelectedPaymentId(id)}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersPage
              key={refreshKey}
              onSelectPayment={(id) => setSelectedPaymentId(id)}
            />
          )}

          {currentTab === 'ai-agent' && <AIAgentPage key={refreshKey} />}

          {currentTab === 'analytics' && <AnalyticsPage key={refreshKey} />}

          {currentTab === 'activity' && <ActivityPage key={refreshKey} />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Payment Details & AI Panel Modal */}
      {selectedPaymentId && (
        <PaymentModal
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
          onPaymentUpdated={() => {
            setRefreshKey((k) => k + 1);
            updateBadgeCount();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
