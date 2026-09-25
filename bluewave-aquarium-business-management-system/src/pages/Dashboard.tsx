import React from 'react';
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Fish,
  UtensilsCrossed,
  Wrench,
  AlertTriangle,
  ShoppingCart,
  PackagePlus,
  Receipt,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { DashboardStats, Sale } from '../types';
import { NavigationPage } from '../components/Sidebar';

interface DashboardProps {
  stats: DashboardStats | null;
  currency: string;
  onNavigate: (page: NavigationPage) => void;
  onQuickAction: (action: 'add_sale' | 'add_purchase' | 'add_expense') => void;
  onViewSaleDetail: (sale: Sale) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  currency,
  onNavigate,
  onQuickAction,
  onViewSaleDetail,
}) => {
  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-[#0077B6] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading BlueWave business data...</p>
        </div>
      </div>
    );
  }

  const { today, month, inventory, alerts, bestSellingFish, recentSales, trends } = stats;

  return (
    <div className="space-y-6 pb-12">
      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-[#0077B6] via-[#0096C7] to-[#00B4D8] rounded-2xl p-5 text-white shadow-md shadow-sky-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#90E0EF] font-bold">
            BlueWave Manager Dashboard
          </span>
          <h2 className="text-xl md:text-2xl font-black mt-0.5">
            Welcome back! Here is your business snapshot.
          </h2>
          <p className="text-xs text-sky-100 mt-1 max-w-xl">
            Live sales revenue, stock valuation across live fish, food & equipment, plus net profit calculations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onQuickAction('add_sale')}
            className="px-3.5 py-2 bg-white text-[#0077B6] hover:bg-sky-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-[#0077B6]" />
            <span>+ Record Sale</span>
          </button>
          <button
            onClick={() => onQuickAction('add_purchase')}
            className="px-3.5 py-2 bg-[#90E0EF]/25 hover:bg-[#90E0EF]/40 text-white border border-white/30 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          >
            <PackagePlus className="w-4 h-4 text-white" />
            <span>+ Add Stock</span>
          </button>
          <button
            onClick={() => onQuickAction('add_expense')}
            className="px-3.5 py-2 bg-[#12304A]/40 hover:bg-[#12304A]/60 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          >
            <Receipt className="w-4 h-4 text-[#90E0EF]" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* 8 Primary Business Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
        {/* 1. Today's Revenue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0077B6] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#12304A]">
            {currency}
            {today.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Sales: {currency}{today.salesRevenue.toFixed(2)} · Extra: {currency}{today.additionalIncome.toFixed(2)}
          </div>
        </div>

        {/* 2. Today's Expenses */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#12304A]">
            {currency}
            {today.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Store utilities, feed & transport
          </div>
        </div>

        {/* 3. Today's Net Profit */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Net Profit</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                today.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {today.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div
            className={`text-xl md:text-2xl font-black ${
              today.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {currency}
            {today.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Gross profit minus operating costs
          </div>
        </div>

        {/* 4. Total Fish Sold Today */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fish Sold Today (Pairs)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0077B6] flex items-center justify-center">
              <Fish className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#12304A]">
            {today.fishSold} <span className="text-xs font-normal text-slate-400">{today.fishSold === 1 ? 'pair' : 'pairs'}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Total items sold: {today.totalItemsSold} (Food: {today.foodSold} · Acc: {today.accessoriesSold})
          </div>
        </div>

        {/* 5. Monthly Revenue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#12304A]">
            {currency}
            {month.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Sales: {currency}{month.salesRevenue.toFixed(2)} · Extra: {currency}{month.additionalIncome.toFixed(2)}
          </div>
        </div>

        {/* 6. Monthly Net Profit */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly Net Profit</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#00B4D8] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#0077B6]">
            {currency}
            {month.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Expenses this month: {currency}{month.expenses.toFixed(2)}
          </div>
        </div>

        {/* 7. Total Fish Stock */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Fish Stock (Pairs)</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-[#00B4D8] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#12304A]">
            {inventory.liveFish.totalStock}{' '}
            <span className="text-xs font-normal text-slate-400">pairs ({inventory.liveFish.varietiesCount} varieties)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Total items in stock: {inventory.totalItemsStock} units/pairs
          </div>
        </div>

        {/* 8. Estimated Stock Value */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated Stock Value</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-[#12304A]">
            {currency}
            {inventory.totalStockCostValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Retail potential: {currency}
            {inventory.totalStockRetailValue.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown Panels (Live Fish, Fish Food, Aquarium Accessories) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Live Fish Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-[#0077B6]">
                  <Fish className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#12304A]">Live Fish</h3>
                  <p className="text-[11px] text-slate-400">
                    {inventory.liveFish.varietiesCount} active varieties in tanks
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-bold text-[#0077B6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Stock</span>
                <span className="font-black text-slate-800 text-base">{inventory.liveFish.totalStock}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Wholesale Value</span>
                <span className="font-bold text-slate-800 text-sm">
                  {currency}{inventory.liveFish.wholesaleValue.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Revenue</span>
                <span className="font-bold text-[#0077B6]">
                  {currency}{month.categoryBreakdown.liveFish.revenue.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Profit</span>
                <span className="font-bold text-emerald-600">
                  {currency}{month.categoryBreakdown.liveFish.profit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fish Food Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#12304A]">Fish Food Products</h3>
                  <p className="text-[11px] text-slate-400">
                    {inventory.fishFood.productsCount} food lines stocked
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('food')}
                className="text-xs font-bold text-[#0077B6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Stock</span>
                <span className="font-black text-slate-800 text-base">{inventory.fishFood.totalStock}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Wholesale Value</span>
                <span className="font-bold text-slate-800 text-sm">
                  {currency}{inventory.fishFood.wholesaleValue.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Revenue</span>
                <span className="font-bold text-[#0077B6]">
                  {currency}{month.categoryBreakdown.fishFood.revenue.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Profit</span>
                <span className="font-bold text-emerald-600">
                  {currency}{month.categoryBreakdown.fishFood.profit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Aquarium Accessories Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 text-[#00B4D8]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#12304A]">Aquarium Accessories</h3>
                  <p className="text-[11px] text-slate-400">
                    {inventory.accessories.productsCount} equipment & parts
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('accessories')}
                className="text-xs font-bold text-[#0077B6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Stock</span>
                <span className="font-black text-slate-800 text-base">{inventory.accessories.totalStock}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Wholesale Value</span>
                <span className="font-bold text-slate-800 text-sm">
                  {currency}{inventory.accessories.wholesaleValue.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Revenue</span>
                <span className="font-bold text-[#0077B6]">
                  {currency}{month.categoryBreakdown.accessories.revenue.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Profit</span>
                <span className="font-bold text-emerald-600">
                  {currency}{month.categoryBreakdown.accessories.profit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Revenue & Net Profit Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-[#12304A]">Daily Revenue & Profit Trend</h3>
              <p className="text-xs text-slate-500">Last 7 days performance including sales & expenses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-full bg-[#0077B6]" /> Revenue
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Net Profit
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0077B6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0077B6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0077B6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revGrad)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                  name="Net Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6-Month Revenue vs Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-[#12304A]">Monthly Financial History</h3>
              <p className="text-xs text-slate-500">6-Month revenue, expenses, and net profit</p>
            </div>
            <button
              onClick={() => onNavigate('monthly-reports')}
              className="text-xs font-bold text-[#0077B6] hover:underline cursor-pointer"
            >
              Full Reports →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.last6Months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="revenue" fill="#0077B6" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Expenses" />
                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Best-Selling Fish & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best-Selling Fish Varieties */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-[#12304A]">Best-Selling Fish Varieties</h3>
              <p className="text-xs text-slate-500">Top contributors to retail volume & profit</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-[#0077B6] hover:underline cursor-pointer"
            >
              All Sales
            </button>
          </div>

          <div className="divide-y divide-slate-50 pt-1">
            {bestSellingFish.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No fish sales recorded yet.</div>
            ) : (
              bestSellingFish.map((fish, index) => (
                <div key={fish.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{fish.name}</p>
                      <p className="text-xs text-slate-400">
                        {fish.quantity} {fish.quantity === 1 ? 'pair' : 'pairs'} sold · Revenue: {currency}{fish.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 block">
                      +{currency}{fish.profit.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">Gross profit</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low-Stock Alerts Across All Categories */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <h3 className="font-bold text-base text-[#12304A]">Low-Stock Alerts</h3>
                <p className="text-xs text-slate-500">
                  {alerts.totalAlerts} items at or below minimum threshold
                </p>
              </div>
            </div>
            <button
              onClick={() => onQuickAction('add_purchase')}
              className="px-3 py-1.5 bg-sky-50 text-[#0077B6] hover:bg-sky-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + Restock Batch
            </button>
          </div>

          <div className="divide-y divide-slate-50 pt-1 max-h-68 overflow-y-auto">
            {alerts.totalAlerts === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                All fish, food, and accessories have healthy stock levels.
              </div>
            ) : (
              <>
                {alerts.lowStockFish.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        Live Fish · Current: <span className="text-rose-600 font-bold">{item.currentStock} {item.currentStock === 1 ? 'pair' : 'pairs'}</span> (Min: {item.minStockLevel} pairs)
                      </p>
                    </div>
                    <button
                      onClick={() => onQuickAction('add_purchase')}
                      className="text-xs font-bold text-[#0077B6] hover:underline cursor-pointer"
                    >
                      Restock →
                    </button>
                  </div>
                ))}

                {alerts.lowStockFood.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        Fish Food · Current: <span className="text-rose-600 font-bold">{item.currentStock}</span> (Min: {item.minStockLevel})
                      </p>
                    </div>
                    <button
                      onClick={() => onQuickAction('add_purchase')}
                      className="text-xs font-bold text-[#0077B6] hover:underline cursor-pointer"
                    >
                      Restock →
                    </button>
                  </div>
                ))}

                {alerts.lowStockAccessories.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        Accessory · Current: <span className="text-rose-600 font-bold">{item.currentStock}</span> (Min: {item.minStockLevel})
                      </p>
                    </div>
                    <button
                      onClick={() => onQuickAction('add_purchase')}
                      className="text-xs font-bold text-[#0077B6] hover:underline cursor-pointer"
                    >
                      Restock →
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Transactions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-[#12304A]">Recent Sales Transactions</h3>
            <p className="text-xs text-slate-500">Latest recorded customer purchases with multi-product items</p>
          </div>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs font-bold text-[#0077B6] hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All Sales <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Receipt / Date</th>
                <th className="py-3 px-3">Customer / Items</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Sale Total</th>
                <th className="py-3 px-3 text-right">Gross Profit</th>
                <th className="py-3 px-3 text-right">Margin %</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                    <p className="font-semibold text-slate-500">No sales recorded yet</p>
                    <p className="mt-1">Click "+ Record Sale" above to log your first customer purchase.</p>
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800 block">{sale.id}</span>
                      <span className="text-[11px] text-slate-400">{sale.saleDate}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700 block">
                        {sale.customerName || 'Walk-in Customer'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {sale.items.length} item(s): {sale.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-600">{sale.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-800">
                      {currency}{sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      +{currency}{sale.totalGrossProfit.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-600">
                      {sale.marginPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onViewSaleDetail(sale)}
                        className="text-xs font-semibold text-[#0077B6] hover:underline cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
