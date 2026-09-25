import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Fish,
  PackagePlus,
  UtensilsCrossed,
  Wrench,
  TrendingUp,
  Receipt,
  FileBarChart,
  History,
  Settings,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react';
import { BlueWaveLogo } from './BlueWaveLogo';
import { useAuth } from '../context/AuthContext';

export type NavigationPage =
  | 'dashboard'
  | 'sales'
  | 'inventory'
  | 'purchases'
  | 'food'
  | 'accessories'
  | 'price-history'
  | 'revenue-expenses'
  | 'monthly-reports'
  | 'transactions'
  | 'settings';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  lowStockAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  lowStockAlertsCount = 0,
}) => {
  const { user, logout } = useAuth();

  const navItems: {
    id: NavigationPage;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Daily Sales', icon: ShoppingCart },
    {
      id: 'inventory',
      label: 'Fish Inventory',
      icon: Fish,
      badge: lowStockAlertsCount > 0 ? lowStockAlertsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'purchases', label: 'Fish Purchases', icon: PackagePlus },
    { id: 'food', label: 'Fish Food', icon: UtensilsCrossed },
    { id: 'accessories', label: 'Aquarium Accessories', icon: Wrench },
    { id: 'price-history', label: 'Price & Margin History', icon: TrendingUp },
    { id: 'revenue-expenses', label: 'Revenue & Expenses', icon: Receipt },
    { id: 'monthly-reports', label: 'Monthly Reports', icon: FileBarChart },
    { id: 'transactions', label: 'Transaction History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <BlueWaveLogo size="md" showText={true} />
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 md:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-thin">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Business Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#F0F9FF] text-[#0077B6] font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#12304A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors ${
                      isActive ? 'text-[#0077B6]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-[#0077B6]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-[#F0F9FF]/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'BW'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#12304A] truncate">{user?.name || 'Owner'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.businessName || 'BlueWave Aquarium'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
