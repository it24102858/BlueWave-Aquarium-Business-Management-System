/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Sidebar, NavigationPage } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DailySales } from './pages/DailySales';
import { FishInventory } from './pages/FishInventory';
import { FishPurchases } from './pages/FishPurchases';
import { FishFoodManagement } from './pages/FishFoodManagement';
import { AquariumAccessoriesManagement } from './pages/AquariumAccessoriesManagement';
import { PriceMarginHistory } from './pages/PriceMarginHistory';
import { RevenueExpenses } from './pages/RevenueExpenses';
import { MonthlyReports } from './pages/MonthlyReports';
import { TransactionHistory } from './pages/TransactionHistory';
import { Settings } from './pages/Settings';
import { SaleDetailModal } from './components/SaleDetailModal';
import { DashboardStats, Sale } from './types';
import { api } from './services/api';

function MainApp() {
  const { isAuthenticated, isLoading, currency } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Quick Action Modal Triggers
  const [openNewSaleTrigger, setOpenNewSaleTrigger] = useState(false);
  const [openNewPurchaseTrigger, setOpenNewPurchaseTrigger] = useState(false);
  const [openExpenseTrigger, setOpenExpenseTrigger] = useState(false);
  const [purchasePreselect, setPurchasePreselect] = useState<{ id: string; type: string } | null>(null);

  // Sale detail viewer modal
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  const loadDashboardStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardStats();
    }
  }, [isAuthenticated, loadDashboardStats]);

  const handleQuickAction = (action: 'add_sale' | 'add_purchase' | 'add_expense') => {
    if (action === 'add_sale') {
      setCurrentPage('sales');
      setOpenNewSaleTrigger(true);
    } else if (action === 'add_purchase') {
      setCurrentPage('purchases');
      setPurchasePreselect(null);
      setOpenNewPurchaseTrigger(true);
    } else if (action === 'add_expense') {
      setCurrentPage('revenue-expenses');
      setOpenExpenseTrigger(true);
    }
  };

  const handleQuickPurchaseFromInventory = (itemId: string, itemType: string) => {
    setCurrentPage('purchases');
    setPurchasePreselect({ id: itemId, type: itemType });
    setOpenNewPurchaseTrigger(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0077B6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            BlueWave Aquarium Loading...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans antialiased text-[#12304A] overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        isOpenMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        lowStockAlertsCount={stats?.alerts?.totalAlerts || 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
          onNavigate={(page) => setCurrentPage(page)}
          onQuickAction={handleQuickAction}
          alerts={stats?.alerts}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scrollbar-thin">
          {currentPage === 'dashboard' && (
            <Dashboard
              stats={stats}
              currency={currency}
              onNavigate={(page) => setCurrentPage(page)}
              onQuickAction={handleQuickAction}
              onViewSaleDetail={(sale) => setDetailSale(sale)}
            />
          )}

          {currentPage === 'sales' && (
            <DailySales
              currency={currency}
              onRefreshStats={loadDashboardStats}
              openNewSaleTrigger={openNewSaleTrigger}
              onCloseNewSaleTrigger={() => setOpenNewSaleTrigger(false)}
            />
          )}

          {currentPage === 'inventory' && (
            <FishInventory
              currency={currency}
              onRefreshStats={loadDashboardStats}
              onQuickPurchase={handleQuickPurchaseFromInventory}
            />
          )}

          {currentPage === 'purchases' && (
            <FishPurchases
              currency={currency}
              onRefreshStats={loadDashboardStats}
              openNewPurchaseTrigger={openNewPurchaseTrigger}
              onCloseNewPurchaseTrigger={() => setOpenNewPurchaseTrigger(false)}
              preselectedItemId={purchasePreselect?.id}
              preselectedItemType={purchasePreselect?.type}
            />
          )}

          {currentPage === 'food' && (
            <FishFoodManagement
              currency={currency}
              onRefreshStats={loadDashboardStats}
              onQuickPurchase={handleQuickPurchaseFromInventory}
            />
          )}

          {currentPage === 'accessories' && (
            <AquariumAccessoriesManagement
              currency={currency}
              onRefreshStats={loadDashboardStats}
              onQuickPurchase={handleQuickPurchaseFromInventory}
            />
          )}

          {currentPage === 'price-history' && (
            <PriceMarginHistory currency={currency} />
          )}

          {currentPage === 'revenue-expenses' && (
            <RevenueExpenses
              currency={currency}
              onRefreshStats={loadDashboardStats}
              openExpenseTrigger={openExpenseTrigger}
              onCloseExpenseTrigger={() => setOpenExpenseTrigger(false)}
            />
          )}

          {currentPage === 'monthly-reports' && (
            <MonthlyReports currency={currency} />
          )}

          {currentPage === 'transactions' && (
            <TransactionHistory currency={currency} />
          )}

          {currentPage === 'settings' && (
            <Settings onRefreshAll={loadDashboardStats} />
          )}
        </main>
      </div>

      {/* Sale Detail Viewer Modal */}
      <SaleDetailModal
        sale={detailSale}
        currency={currency}
        onClose={() => setDetailSale(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
