import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Banknote,
  Fish,
  UtensilsCrossed,
  Wrench,
  Receipt,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { MonthlyReportData } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { formatFishStock } from '../utils/formatters';

interface MonthlyReportsProps {
  currency: string;
}

export const MonthlyReports: React.FC<MonthlyReportsProps> = ({ currency }) => {
  const { error, success } = useToast();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMonthlyReport(selectedYear, selectedMonth);
      setReport(data);
    } catch (err: any) {
      error(err.message || 'Failed to generate monthly report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedYear, selectedMonth]);

  const handleExportCSV = () => {
    if (!report) return;

    const rows = [
      ['Metric', 'Value'],
      ['Report Period', report.period.monthName],
      ['Total Revenue', `${currency}${report.metrics.totalRevenue.toFixed(2)}`],
      ['Sales Revenue', `${currency}${report.metrics.salesRevenue.toFixed(2)}`],
      ['Additional Service Income', `${currency}${report.metrics.additionalIncome.toFixed(2)}`],
      ['Cost of Goods Sold (COGS)', `${currency}${report.metrics.costOfGoodsSold.toFixed(2)}`],
      ['Gross Profit', `${currency}${report.metrics.grossProfit.toFixed(2)}`],
      ['Total Operating Expenses', `${currency}${report.metrics.totalOperatingExpenses.toFixed(2)}`],
      ['Net Profit', `${currency}${report.metrics.netProfit.toFixed(2)}`],
      ['Total Wholesale Purchases', `${currency}${report.metrics.totalWholesalePurchases.toFixed(2)}`],
      ['Gross Profit Margin', `${report.metrics.grossProfitMarginPct.toFixed(1)}%`],
      ['Net Profit Margin', `${report.metrics.netProfitMarginPct.toFixed(1)}%`],
      ['Total Fish Sold (Pairs)', report.metrics.fishSold],
      ['Total Food Products Sold', report.metrics.foodSold],
      ['Total Accessories Sold', report.metrics.accessoriesSold],
      [],
      ['Day', 'Date', 'Revenue', 'COGS / Profit', 'Expenses', 'Net Profit'],
      ...report.dailyBreakdown.map((d) => [
        d.day,
        d.date,
        d.revenue.toFixed(2),
        d.grossProfit.toFixed(2),
        d.expenses.toFixed(2),
        d.netProfit.toFixed(2),
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BlueWave_Monthly_Report_${report.period.monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Monthly report CSV downloaded!');
  };

  const handlePrint = () => {
    window.print();
  };

  const years = [2025, 2026, 2027];
  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-[#12304A]">Automatic Monthly Reports</h2>
          <p className="text-xs text-slate-500">
            Statement of financial performance, profit margin calculations, and inventory sales
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer border-l border-slate-200 pl-2 ml-1"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!report}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 text-slate-700 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#0077B6]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!report}
            className="px-3 py-2 bg-[#0077B6] hover:bg-[#023E8A] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {isLoading || !report ? (
        <div className="p-12 text-center text-xs text-slate-400">Generating monthly financial audit...</div>
      ) : (
        <>
          {/* Printable Report Header */}
          <div className="hidden print:block border-b border-slate-200 pb-4 mb-4">
            <h1 className="text-2xl font-black text-[#12304A]">BlueWave Aquarium</h1>
            <h2 className="text-lg font-bold text-[#0077B6]">
              Monthly Financial Statement: {report.period.monthName}
            </h2>
            <p className="text-xs text-slate-500">
              Generated automatically on {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Month-over-Month Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Monthly Total Revenue */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Monthly Revenue</span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0077B6] flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#12304A]">
                {currency}{report.metrics.totalRevenue.toFixed(2)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                {report.comparisonWithPrevious.revenueGrowthPct >= 0 ? (
                  <span className="text-emerald-600 font-bold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{report.comparisonWithPrevious.revenueGrowthPct.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {report.comparisonWithPrevious.revenueGrowthPct.toFixed(1)}%
                  </span>
                )}
                <span className="text-slate-400">vs. previous month</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Profit</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600">
                +{currency}{report.metrics.grossProfit.toFixed(2)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Gross Margin: <span className="font-bold text-slate-700">{report.metrics.grossProfitMarginPct.toFixed(1)}%</span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operating Expenses</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-800">
                {currency}{report.metrics.totalOperatingExpenses.toFixed(2)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Feed, power, water & transport
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Profit</span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    report.metrics.netProfit >= 0 ? 'bg-sky-50 text-[#0077B6]' : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-2xl font-black ${
                  report.metrics.netProfit >= 0 ? 'text-[#0077B6]' : 'text-rose-600'
                }`}
              >
                {currency}{report.metrics.netProfit.toFixed(2)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                {report.comparisonWithPrevious.netProfitGrowthPct >= 0 ? (
                  <span className="text-emerald-600 font-bold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{report.comparisonWithPrevious.netProfitGrowthPct.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {report.comparisonWithPrevious.netProfitGrowthPct.toFixed(1)}%
                  </span>
                )}
                <span className="text-slate-400">net profit growth</span>
              </div>
            </div>
          </div>

          {/* Detailed Financial Statement Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit & Loss Table */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <h3 className="font-extrabold text-base text-[#12304A]">
                Profit & Loss Statement ({report.period.monthName})
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Retail Sales Revenue</span>
                  <span className="font-extrabold text-slate-900">
                    {currency}{report.metrics.salesRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Additional Service Income</span>
                  <span className="font-extrabold text-slate-900">
                    +{currency}{report.metrics.additionalIncome.toFixed(2)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between bg-sky-50/50 px-2 rounded-lg">
                  <span className="font-extrabold text-[#0077B6]">Gross Total Business Revenue</span>
                  <span className="font-black text-[#0077B6]">
                    {currency}{report.metrics.totalRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-600">Less: Cost of Goods Sold (COGS)</span>
                  <span className="font-bold text-slate-600">
                    -{currency}{report.metrics.costOfGoodsSold.toFixed(2)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between bg-emerald-50/50 px-2 rounded-lg">
                  <span className="font-extrabold text-emerald-800">Gross Operating Profit</span>
                  <span className="font-black text-emerald-700">
                    +{currency}{report.metrics.grossProfit.toFixed(2)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-600">Less: Operating Expenses</span>
                  <span className="font-bold text-rose-600">
                    -{currency}{report.metrics.totalOperatingExpenses.toFixed(2)}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between bg-[#F0F9FF] px-3 rounded-xl border border-sky-100">
                  <span className="font-black text-sm text-[#12304A]">Net Profit for the Month</span>
                  <span className="font-black text-base text-[#0077B6]">
                    {currency}{report.metrics.netProfit.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Wholesale inventory purchases note */}
              <div className="pt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block">Inventory Restocking Capital:</span>
                During {report.period.monthName}, {currency}
                {report.metrics.totalWholesalePurchases.toFixed(2)} was spent on wholesale stock intake.
                Stock additions are treated as asset balance investments and are not counted twice against net profit.
              </div>
            </div>

            {/* Sales Volume & Best Selling Varieties */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-[#12304A]">
                Inventory Sales Volume & Top Varieties
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                  <Fish className="w-5 h-5 mx-auto text-[#0077B6] mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fish Sold</span>
                  <span className="text-base font-black text-slate-800">{formatFishStock(report.metrics.fishSold)}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <UtensilsCrossed className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Food Sold</span>
                  <span className="text-lg font-black text-slate-800">{report.metrics.foodSold}</span>
                </div>
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                  <Wrench className="w-5 h-5 mx-auto text-[#00B4D8] mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Equipment Sold</span>
                  <span className="text-lg font-black text-slate-800">{report.metrics.accessoriesSold}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Best-Selling Products of {report.period.monthName}
                </span>
                <div className="divide-y divide-slate-100 text-xs">
                  {report.bestSellingProducts.map((p, idx) => (
                    <div key={p.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                        <div>
                          <span className="font-bold text-slate-800 block">{p.name}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{p.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {p.type === 'live_fish' ? formatFishStock(p.quantity) : `${p.quantity} units`}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          +{currency}{p.profit.toFixed(2)} profit
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Breakdown Interactive Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs print:hidden">
            <h3 className="font-extrabold text-base text-[#12304A] mb-1">
              Daily Revenue & Net Profit Breakdown
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Day-by-day distribution for {report.period.monthName}
            </p>

            <div className="h-68 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(val: any) => [`${currency}${Number(val).toFixed(2)}`]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="revenue" fill="#0077B6" radius={[3, 3, 0, 0]} name="Daily Revenue" />
                  <Bar dataKey="netProfit" fill="#10B981" radius={[3, 3, 0, 0]} name="Daily Net Profit" />
                  <Bar dataKey="expenses" fill="#F59E0B" radius={[3, 3, 0, 0]} name="Daily Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
