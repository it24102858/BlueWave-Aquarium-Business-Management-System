import React from 'react';
import { ShoppingCart, X, Printer, Calendar, User, Tag, Layers } from 'lucide-react';
import { Sale } from '../types';

interface SaleDetailModalProps {
  sale: Sale | null;
  currency: string;
  onClose: () => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, currency, onClose }) => {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-[#0077B6]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#12304A]">
                Sale Receipt #{sale.id}
              </h3>
              <p className="text-xs text-slate-500">
                {sale.saleDate} · {sale.paymentMethod}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
              <span className="font-bold text-slate-800 text-sm">
                {sale.customerName || 'Walk-in Customer'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
              <span className="font-bold text-slate-800 text-sm">{sale.paymentMethod}</span>
            </div>
            {sale.notes && (
              <div className="col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Notes</span>
                <span className="text-slate-600">{sale.notes}</span>
              </div>
            )}
          </div>

          {/* Line items table */}
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
              Purchased Items ({sale.items.length})
            </span>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 p-2.5 grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase">
                <span className="col-span-5">Product</span>
                <span className="col-span-2 text-center">Qty / Pairs</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-3 text-right">Total</span>
              </div>

              {sale.items.map((it, idx) => (
                <div key={idx} className="p-3 grid grid-cols-12 items-center text-xs">
                  <div className="col-span-5">
                    <span className="font-bold text-slate-800 block">{it.itemName}</span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {it.itemType === 'live_fish' ? 'Live Fish' : it.itemType === 'fish_food' ? 'Fish Food' : 'Accessory'} · {it.category}
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-bold text-slate-800">
                    {it.quantity} {it.itemType === 'live_fish' ? (it.quantity === 1 ? 'pair' : 'pairs') : 'units'}
                  </div>
                  <div className="col-span-2 text-right text-slate-600 font-medium">
                    {currency}{it.sellingPrice.toFixed(2)}
                    <span className="text-[10px] text-slate-400 block">
                      {it.itemType === 'live_fish' ? '/ pair' : '/ unit'}
                    </span>
                  </div>
                  <div className="col-span-3 text-right font-black text-slate-900">
                    {currency}{it.totalSaleAmount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total & Profit breakdown */}
          <div className="p-4 bg-[#F0F9FF] rounded-2xl border border-sky-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Sale Amount:</span>
              <span className="font-black text-slate-900 text-base">
                {currency}{sale.totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Cost of Goods Sold (COGS):</span>
              <span className="font-semibold text-slate-600">
                {currency}{sale.totalCost.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-sky-200/60">
              <span className="font-bold text-emerald-800">Gross Profit:</span>
              <span className="font-black text-emerald-700 text-base">
                +{currency}{sale.totalGrossProfit.toFixed(2)} ({sale.marginPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0077B6] hover:bg-[#023E8A] text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
