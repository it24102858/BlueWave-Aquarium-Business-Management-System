import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Banknote,
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Droplets,
  Truck,
  Sparkles,
  HeartPulse,
  Tag,
  X,
} from 'lucide-react';
import { Expense, AdditionalIncome } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface RevenueExpensesProps {
  currency: string;
  onRefreshStats?: () => void;
  openExpenseTrigger?: boolean;
  onCloseExpenseTrigger?: () => void;
}

export const RevenueExpenses: React.FC<RevenueExpensesProps> = ({
  currency,
  onRefreshStats,
  openExpenseTrigger,
  onCloseExpenseTrigger,
}) => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomeList, setIncomeList] = useState<AdditionalIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | null>(null);
  const [deleteIncomeTarget, setDeleteIncomeTarget] = useState<AdditionalIncome | null>(null);

  // Expense Form
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCategory, setExpCategory] = useState('Electricity');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('50.00');
  const [expPaymentMethod, setExpPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'Other'>('Bank Transfer');
  const [expNotes, setExpNotes] = useState('');

  // Income Form
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);
  const [incCategory, setIncCategory] = useState('Tank Maintenance Service');
  const [incAmount, setIncAmount] = useState('75.00');
  const [incNotes, setIncNotes] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [expData, incData] = await Promise.all([
        api.getExpenses({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }),
        api.getIncome({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      ]);
      setExpenses(expData);
      setIncomeList(incData);
    } catch (err: any) {
      error(err.message || 'Failed to load expenses & income');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, categoryFilter]);

  useEffect(() => {
    if (openExpenseTrigger) {
      setIsExpenseModalOpen(true);
      if (onCloseExpenseTrigger) onCloseExpenseTrigger();
    }
  }, [openExpenseTrigger]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expAmount) || 0;
    if (amountNum <= 0) {
      error('Please enter a valid expense amount');
      return;
    }

    try {
      await api.createExpense({
        date: expDate,
        category: expCategory,
        description: expDescription,
        amount: amountNum,
        paymentMethod: expPaymentMethod,
        notes: expNotes,
      });

      success(`Expense of ${currency}${amountNum.toFixed(2)} recorded!`);
      setIsExpenseModalOpen(false);
      setExpDescription('');
      setExpNotes('');
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to record expense');
    }
  };

  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(incAmount) || 0;
    if (amountNum <= 0) {
      error('Please enter a valid income amount');
      return;
    }

    try {
      await api.createIncome({
        date: incDate,
        category: incCategory,
        amount: amountNum,
        notes: incNotes,
      });

      success(`Additional income of ${currency}${amountNum.toFixed(2)} recorded!`);
      setIsIncomeModalOpen(false);
      setIncNotes('');
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to record additional income');
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpenseTarget) return;
    try {
      await api.deleteExpense(deleteExpenseTarget.id);
      success('Expense deleted successfully.');
      setDeleteExpenseTarget(null);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to delete expense');
    }
  };

  const handleDeleteIncome = async () => {
    if (!deleteIncomeTarget) return;
    try {
      await api.deleteIncome(deleteIncomeTarget.id);
      success('Income record deleted.');
      setDeleteIncomeTarget(null);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to delete income record');
    }
  };

  // Summaries
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalIncome = incomeList.reduce((acc, i) => acc + i.amount, 0);

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('Electricity')) return <Zap className="w-4 h-4 text-amber-500" />;
    if (cat.includes('Water')) return <Droplets className="w-4 h-4 text-sky-500" />;
    if (cat.includes('Transportation')) return <Truck className="w-4 h-4 text-indigo-500" />;
    if (cat.includes('Treatment')) return <HeartPulse className="w-4 h-4 text-rose-500" />;
    return <Tag className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#12304A]">Daily Revenue & Operating Expenses</h2>
          <p className="text-xs text-slate-500">
            Log store utilities, aquarium maintenance services, consultation fees, and operational costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="px-3.5 py-2.5 bg-[#0077B6] hover:bg-[#023E8A] active:scale-[0.98] text-white font-bold text-xs md:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service Income</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Operating Expenses
            </span>
            <span className="text-2xl font-black text-amber-600">
              {currency}{totalExpenses.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {expenses.length} operating bills & store feeding records
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Additional Service Income
            </span>
            <span className="text-2xl font-black text-emerald-600">
              +{currency}{totalIncome.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {incomeList.length} maintenance, setup & custom services
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Banknote className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-white text-[#12304A] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Operating Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'income'
              ? 'bg-white text-[#12304A] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Additional Income ({incomeList.length})
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between flex-wrap gap-3">
        {activeTab === 'expenses' ? (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
          >
            <option value="all">All Expense Categories</option>
            <option value="Fish Food (Feeding In-Store)">Fish Food (In-Store Feeding)</option>
            <option value="Electricity">Electricity Utility</option>
            <option value="Water">Water Utility & Filtration</option>
            <option value="Transportation & Logistics">Transportation & Logistics</option>
            <option value="Aquarium Equipment">Store Equipment Maintenance</option>
            <option value="Fish Treatment & Medication">Fish Treatment & Medication</option>
            <option value="Store Rent & Maintenance">Store Rent & Maintenance</option>
            <option value="Other Operating Expenses">Other Expenses</option>
          </select>
        ) : (
          <div className="text-xs font-bold text-slate-600">All Registered Income Channels</div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Date:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table for Active Tab */}
      {activeTab === 'expenses' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description & Notes</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      {isLoading ? 'Loading expenses...' : 'No expenses found.'}
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{exp.date}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(exp.category)}
                          <span className="font-bold text-slate-900">{exp.category}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {exp.description}
                        {exp.notes && (
                          <span className="text-[11px] text-slate-400 block">{exp.notes}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{exp.paymentMethod}</td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-600">
                        -{currency}{exp.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setDeleteExpenseTarget(exp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Description / Notes</th>
                  <th className="py-3 px-4 text-right">Income Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      {isLoading ? 'Loading income records...' : 'No additional income recorded.'}
                    </td>
                  </tr>
                ) : (
                  incomeList.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{inc.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{inc.category}</td>
                      <td className="py-3.5 px-4 text-slate-600">{inc.notes || 'Additional revenue'}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        +{currency}{inc.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setDeleteIncomeTarget(inc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Income Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#12304A]">Record Operating Expense</h3>
                  <p className="text-xs text-slate-500">Utilities, food for store tanks, transport, or supplies</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Expense Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                >
                  <option value="Fish Food (Feeding In-Store)">Fish Food (In-Store Feeding Rations)</option>
                  <option value="Electricity">Electricity (Pumps, Heaters, LED Racks)</option>
                  <option value="Water">Water Utility & Reverse Osmosis Filter Change</option>
                  <option value="Transportation & Logistics">Transportation & Cargo Tolls</option>
                  <option value="Aquarium Equipment">Equipment Maintenance & Consumables</option>
                  <option value="Fish Treatment & Medication">Fish Treatment & Quarantine Medication</option>
                  <option value="Store Rent & Maintenance">Store Space Rent & Maintenance</option>
                  <option value="Packaging & Bags">Packaging, Oxygen Bags & Boxes</option>
                  <option value="Other Operating Expenses">Other Operating Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Expense Amount ({currency.trim()})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Payment Method</label>
                <select
                  value={expPaymentMethod}
                  onChange={(e) => setExpPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description / Vendor</label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="e.g. Municipal power bill, airport cargo delivery fee"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Notes (Optional)</label>
                <textarea
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Extra details, receipt number..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2.5 text-xs md:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#12304A]">Record Additional Service Income</h3>
                  <p className="text-xs text-slate-500">Aquarium setups, plant trimming, consultation, deliveries</p>
                </div>
              </div>
              <button
                onClick={() => setIsIncomeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Income Date</label>
                <input
                  type="date"
                  value={incDate}
                  onChange={(e) => setIncDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Service Income Category</label>
                <select
                  value={incCategory}
                  onChange={(e) => setIncCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                >
                  <option value="Tank Maintenance Service">Tank Maintenance Service</option>
                  <option value="Aquarium Setup Consultation">Aquarium Setup Consultation</option>
                  <option value="Custom Aquascaping">Custom Aquascaping Design</option>
                  <option value="Home Delivery Fee">Home Delivery & Acclimation Fee</option>
                  <option value="Equipment Rental">Equipment Rental / Diagnostic Service</option>
                  <option value="Other Service Income">Other Service Income</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Income Amount ({currency.trim()})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={incAmount}
                  onChange={(e) => setIncAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Service Details & Client</label>
                <textarea
                  value={incNotes}
                  onChange={(e) => setIncNotes(e.target.value)}
                  placeholder="e.g. Bi-weekly water change and trimming for medical office tank..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="px-4 py-2.5 text-xs md:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-[#0077B6] hover:bg-[#023E8A] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Service Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modals */}
      <ConfirmModal
        isOpen={!!deleteExpenseTarget}
        title="Delete Expense Record?"
        message={`Delete expense "${deleteExpenseTarget?.category}" for ${currency}${deleteExpenseTarget?.amount.toFixed(2)}?`}
        confirmText="Delete Expense"
        isDestructive={true}
        onConfirm={handleDeleteExpense}
        onCancel={() => setDeleteExpenseTarget(null)}
      />

      <ConfirmModal
        isOpen={!!deleteIncomeTarget}
        title="Delete Income Record?"
        message={`Delete service income record "${deleteIncomeTarget?.category}" for ${currency}${deleteIncomeTarget?.amount.toFixed(2)}?`}
        confirmText="Delete Income"
        isDestructive={true}
        onConfirm={handleDeleteIncome}
        onCancel={() => setDeleteIncomeTarget(null)}
      />
    </div>
  );
};
