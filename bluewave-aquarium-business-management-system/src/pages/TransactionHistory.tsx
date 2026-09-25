import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ShoppingCart,
  PackagePlus,
  Receipt,
  Banknote,
  Layers,
  TrendingUp,
  Calendar,
  Eye,
  X,
} from 'lucide-react';
import { TransactionRecord } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface TransactionHistoryProps {
  currency: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ currency }) => {
  const { error } = useToast();

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Detail Modal
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTransactions({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchTerm || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setTransactions(data);
    } catch (err: any) {
      error(err.message || 'Failed to load transaction audit trail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, searchTerm, dateFrom, dateTo]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0077B6] bg-sky-50 px-2 py-0.5 rounded-lg">
            <ShoppingCart className="w-3 h-3" /> Sale
          </span>
        );
      case 'purchase':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">
            <PackagePlus className="w-3 h-3" /> Purchase
          </span>
        );
      case 'expense':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg">
            <Receipt className="w-3 h-3" /> Expense
          </span>
        );
      case 'income':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
            <Banknote className="w-3 h-3" /> Income
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
            <Layers className="w-3 h-3" /> Adjustment
          </span>
        );
      case 'price_change':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-lg">
            <TrendingUp className="w-3 h-3" /> Price Change
          </span>
        );
      default:
        return <span>{type}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[#12304A]">Business Transaction Audit Trail</h2>
        <p className="text-xs text-slate-500">
          Complete ledger of sales, purchases, operating expenses, income, stock adjustments, and price revisions
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, keyword, customer, item, or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
          >
            <option value="all">All Transaction Types</option>
            <option value="sale">Retail Sales</option>
            <option value="purchase">Wholesale Purchases</option>
            <option value="expense">Operating Expenses</option>
            <option value="income">Service Income</option>
            <option value="adjustment">Stock Adjustments</option>
            <option value="price_change">Price Revisions</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            />
            <span>to</span>
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
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">ID / Reference</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4 text-right">Financial Impact</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {isLoading ? 'Loading audit records...' : 'No transactions found.'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={`${tx.type}-${tx.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-600">{tx.date}</td>
                    <td className="py-3.5 px-4">{getTypeBadge(tx.type)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{tx.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#12304A] block">{tx.title}</span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-md">
                        {tx.description}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {tx.amount !== undefined ? (
                        <span
                          className={`font-black text-sm ${
                            tx.financialImpact === 'positive'
                              ? 'text-emerald-600'
                              : tx.financialImpact === 'negative'
                              ? 'text-rose-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {tx.financialImpact === 'positive' && '+'}
                          {tx.financialImpact === 'negative' && '-'}
                          {currency}{tx.amount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#0077B6] bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-[#0077B6]">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#12304A]">{selectedTx.title}</h3>
                  <p className="text-xs text-slate-400">
                    ID: {selectedTx.id} · Logged on {selectedTx.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Description
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">{selectedTx.description}</p>
              </div>

              {selectedTx.amount !== undefined && (
                <div className="flex items-center justify-between p-3 bg-sky-50/50 rounded-xl border border-sky-100">
                  <span className="font-bold text-slate-600">Financial Impact</span>
                  <span className="text-base font-black text-[#0077B6]">
                    {selectedTx.financialImpact === 'positive' ? '+' : '-'}
                    {currency}{selectedTx.amount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Raw JSON viewer */}
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Full Raw Audit Payload
                </span>
                <pre className="p-3 bg-slate-900 text-sky-300 rounded-xl overflow-x-auto text-[11px] font-mono max-h-48 scrollbar-thin">
                  {JSON.stringify(selectedTx.raw, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
