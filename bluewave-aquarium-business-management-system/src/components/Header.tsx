import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Plus,
  ShoppingCart,
  PackagePlus,
  Receipt,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { NavigationPage } from './Sidebar';
import { FishVariety, FishFoodProduct, AquariumAccessory } from '../types';

interface HeaderProps {
  currentPage: NavigationPage;
  onOpenMobileMenu: () => void;
  onNavigate: (page: NavigationPage) => void;
  onQuickAction: (action: 'add_sale' | 'add_purchase' | 'add_expense') => void;
  alerts?: {
    lowStockFish: FishVariety[];
    lowStockFood: FishFoodProduct[];
    lowStockAccessories: AquariumAccessory[];
    totalAlerts: number;
  };
}

const pageTitles: Record<NavigationPage, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'Real-time performance, inventory valuation, and sales metrics',
  },
  sales: {
    title: 'Daily Sales Management',
    subtitle: 'Unified sales register for live fish, aquatic food, and accessories',
  },
  inventory: {
    title: 'Fish Inventory',
    subtitle: 'Track live fish breeds, wholesale costs, selling prices, and tank stocks',
  },
  purchases: {
    title: 'Fish & Stock Purchases',
    subtitle: 'Wholesale batch intake, supplier records, and inventory restocking',
  },
  food: {
    title: 'Fish Food Management',
    subtitle: 'Pellets, flakes, freeze-dried and frozen nutritional food stock',
  },
  accessories: {
    title: 'Aquarium Accessories',
    subtitle: 'Tanks, filters, lighting, pumps, heaters, and water conditioning',
  },
  'price-history': {
    title: 'Price & Margin History',
    subtitle: 'Historical price timeline, margin fluctuations, and cost changes',
  },
  'revenue-expenses': {
    title: 'Revenue & Operating Expenses',
    subtitle: 'Log operating utilities, medications, transport, and extra income',
  },
  'monthly-reports': {
    title: 'Monthly Financial Reports',
    subtitle: 'Comprehensive profit and loss statement with CSV & PDF export',
  },
  transactions: {
    title: 'Transaction History',
    subtitle: 'Unified searchable audit trail across all sales, purchases, and expenses',
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Account profile, currency preferences, backup download & restoration',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileMenu,
  onNavigate,
  onQuickAction,
  alerts,
}) => {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const pageInfo = pageTitles[currentPage] || { title: 'BlueWave Aquarium', subtitle: '' };
  const totalAlerts = alerts?.totalAlerts || 0;

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-[#12304A] tracking-tight">
            {pageInfo.title}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions, Alerts, Date, Quick Add */}
      <div className="flex items-center gap-2.5">
        {/* Date display */}
        <div className="hidden lg:flex items-center text-xs font-semibold text-slate-500 bg-[#F0F9FF] px-3 py-1.5 rounded-lg border border-sky-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
          {todayFormatted}
        </div>

        {/* Low Stock Alerts Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4.5 h-4.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Alerts Dropdown */}
          {showAlertsDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowAlertsDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-40 p-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-[#12304A]">
                      Low Stock Alerts ({totalAlerts})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowAlertsDropdown(false);
                      onNavigate('inventory');
                    }}
                    className="text-xs font-semibold text-[#0077B6] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 py-2">
                  {totalAlerts === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      All inventory is adequately stocked! 🎉
                    </div>
                  ) : (
                    <>
                      {alerts?.lowStockFish.map((f) => (
                        <div key={f.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{f.name}</p>
                            <p className="text-[11px] text-slate-500">
                              Live Fish · Stock: <span className="text-rose-600 font-semibold">{f.currentStock}</span> (Min: {f.minStockLevel})
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShowAlertsDropdown(false);
                              onNavigate('purchases');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#0077B6] bg-sky-50 hover:bg-sky-100 rounded-lg cursor-pointer shrink-0"
                          >
                            Restock
                          </button>
                        </div>
                      ))}

                      {alerts?.lowStockFood.map((f) => (
                        <div key={f.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{f.name}</p>
                            <p className="text-[11px] text-slate-500">
                              Food · Stock: <span className="text-rose-600 font-semibold">{f.currentStock}</span> (Min: {f.minStockLevel})
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShowAlertsDropdown(false);
                              onNavigate('purchases');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#0077B6] bg-sky-50 hover:bg-sky-100 rounded-lg cursor-pointer shrink-0"
                          >
                            Restock
                          </button>
                        </div>
                      ))}

                      {alerts?.lowStockAccessories.map((a) => (
                        <div key={a.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{a.name}</p>
                            <p className="text-[11px] text-slate-500">
                              Accessory · Stock: <span className="text-rose-600 font-semibold">{a.currentStock}</span> (Min: {a.minStockLevel})
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShowAlertsDropdown(false);
                              onNavigate('purchases');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#0077B6] bg-sky-50 hover:bg-sky-100 rounded-lg cursor-pointer shrink-0"
                          >
                            Restock
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Add Menu */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0077B6] hover:bg-[#023E8A] text-white rounded-xl text-xs md:text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Action</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {showQuickMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowQuickMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-40 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onQuickAction('add_sale');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0F9FF] hover:text-[#0077B6] transition-colors cursor-pointer text-left"
                >
                  <ShoppingCart className="w-4 h-4 text-[#0077B6]" />
                  <span>Record Sale</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onQuickAction('add_purchase');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0F9FF] hover:text-[#0077B6] transition-colors cursor-pointer text-left"
                >
                  <PackagePlus className="w-4 h-4 text-[#00B4D8]" />
                  <span>Wholesale Purchase</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onQuickAction('add_expense');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0F9FF] hover:text-[#0077B6] transition-colors cursor-pointer text-left"
                >
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Record Expense</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
