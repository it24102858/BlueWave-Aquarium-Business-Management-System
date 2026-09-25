import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  TrendingUp,
  Receipt,
  X,
  Layers,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import {
  Sale,
  SaleItem,
  FishVariety,
  FishFoodProduct,
  AquariumAccessory,
} from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface DailySalesProps {
  currency: string;
  onRefreshStats?: () => void;
  openNewSaleTrigger?: boolean;
  onCloseNewSaleTrigger?: () => void;
}

export const DailySales: React.FC<DailySalesProps> = ({
  currency,
  onRefreshStats,
  openNewSaleTrigger,
  onCloseNewSaleTrigger,
}) => {
  const { success, error } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [fishList, setFishList] = useState<FishVariety[]>([]);
  const [foodList, setFoodList] = useState<FishFoodProduct[]>([]);
  const [accessoriesList, setAccessoriesList] = useState<AquariumAccessory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deleteSaleTarget, setDeleteSaleTarget] = useState<Sale | null>(null);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Card / POS' | 'Other'>('Cash');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<
    {
      itemType: 'live_fish' | 'fish_food' | 'accessory';
      itemId: string;
      itemName: string;
      category: string;
      quantity: number;
      sellingPrice: number;
      purchaseCost: number;
      availableStock?: number;
    }[]
  >([]);

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [salesData, fishData, foodData, accData] = await Promise.all([
        api.getSales({
          dateFrom: dateFilter || undefined,
          paymentMethod: paymentFilter !== 'all' ? paymentFilter : undefined,
          itemType: typeFilter !== 'all' ? typeFilter : undefined,
          search: searchTerm || undefined,
        }),
        api.getFish(),
        api.getFishFood(),
        api.getAccessories(),
      ]);
      setSales(salesData);
      setFishList(fishData);
      setFoodList(foodData);
      setAccessoriesList(accData);
    } catch (err: any) {
      error(err.message || 'Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter, paymentFilter, typeFilter, searchTerm]);

  useEffect(() => {
    if (openNewSaleTrigger) {
      openNewSaleModal();
      if (onCloseNewSaleTrigger) onCloseNewSaleTrigger();
    }
  }, [openNewSaleTrigger]);

  const openNewSaleModal = () => {
    setEditingSale(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('Cash');
    setFormCustomerName('');
    setFormNotes('');

    // Pre-populate with one item slot
    const defaultFish = fishList[0];
    if (defaultFish) {
      setFormItems([
        {
          itemType: 'live_fish',
          itemId: defaultFish.id,
          itemName: defaultFish.name,
          category: defaultFish.category,
          quantity: 1,
          sellingPrice: defaultFish.sellingPrice,
          purchaseCost: defaultFish.wholesalePrice,
          availableStock: defaultFish.currentStock,
        },
      ]);
    } else {
      setFormItems([]);
    }
    setIsModalOpen(true);
  };

  const openEditSaleModal = (sale: Sale) => {
    setEditingSale(sale);
    setFormDate(sale.saleDate);
    setFormPaymentMethod(sale.paymentMethod as any);
    setFormCustomerName(sale.customerName || '');
    setFormNotes(sale.notes || '');
    setFormItems(
      sale.items.map((it) => ({
        itemType: it.itemType,
        itemId: it.itemId,
        itemName: it.itemName,
        category: it.category,
        quantity: it.quantity,
        sellingPrice: it.sellingPrice,
        purchaseCost: it.purchaseCost,
      }))
    );
    setIsModalOpen(true);
  };

  const handleAddItemSlot = (type: 'live_fish' | 'fish_food' | 'accessory' = 'live_fish') => {
    let defItem: any = null;
    if (type === 'live_fish' && fishList.length > 0) defItem = fishList[0];
    if (type === 'fish_food' && foodList.length > 0) defItem = foodList[0];
    if (type === 'accessory' && accessoriesList.length > 0) defItem = accessoriesList[0];

    if (defItem) {
      setFormItems((prev) => [
        ...prev,
        {
          itemType: type,
          itemId: defItem.id,
          itemName: defItem.name,
          category: defItem.category,
          quantity: 1,
          sellingPrice: defItem.sellingPrice,
          purchaseCost: defItem.wholesalePrice,
          availableStock: defItem.currentStock,
        },
      ]);
    }
  };

  const handleItemTypeChange = (index: number, newType: 'live_fish' | 'fish_food' | 'accessory') => {
    let defItem: any = null;
    if (newType === 'live_fish' && fishList.length > 0) defItem = fishList[0];
    if (newType === 'fish_food' && foodList.length > 0) defItem = foodList[0];
    if (newType === 'accessory' && accessoriesList.length > 0) defItem = accessoriesList[0];

    if (defItem) {
      const updated = [...formItems];
      updated[index] = {
        itemType: newType,
        itemId: defItem.id,
        itemName: defItem.name,
        category: defItem.category,
        quantity: updated[index].quantity || 1,
        sellingPrice: defItem.sellingPrice,
        purchaseCost: defItem.wholesalePrice,
        availableStock: defItem.currentStock,
      };
      setFormItems(updated);
    }
  };

  const handleProductSelect = (index: number, itemId: string) => {
    const item = formItems[index];
    let selected: any = null;
    if (item.itemType === 'live_fish') selected = fishList.find((f) => f.id === itemId);
    if (item.itemType === 'fish_food') selected = foodList.find((f) => f.id === itemId);
    if (item.itemType === 'accessory') selected = accessoriesList.find((a) => a.id === itemId);

    if (selected) {
      const updated = [...formItems];
      updated[index] = {
        ...updated[index],
        itemId: selected.id,
        itemName: selected.name,
        category: selected.category,
        sellingPrice: selected.sellingPrice,
        purchaseCost: selected.wholesalePrice,
        availableStock: selected.currentStock,
      };
      setFormItems(updated);
    }
  };

  const handleRemoveItemSlot = (index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations for current form modal
  const modalTotalRevenue = formItems.reduce((acc, item) => acc + (item.quantity * item.sellingPrice || 0), 0);
  const modalTotalCost = formItems.reduce((acc, item) => acc + (item.quantity * item.purchaseCost || 0), 0);
  const modalGrossProfit = modalTotalRevenue - modalTotalCost;
  const modalMarginPct = modalTotalRevenue > 0 ? (modalGrossProfit / modalTotalRevenue) * 100 : 0;

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      error('Please add at least one product item to the sale');
      return;
    }

    try {
      const payload = {
        saleDate: formDate,
        paymentMethod: formPaymentMethod,
        customerName: formCustomerName,
        notes: formNotes,
        items: formItems.map((it) => ({
          itemType: it.itemType,
          itemId: it.itemId,
          itemName: it.itemName,
          category: it.category,
          quantity: Number(it.quantity),
          sellingPrice: Number(it.sellingPrice),
          purchaseCost: Number(it.purchaseCost),
        })),
      };

      if (editingSale) {
        await api.updateSale(editingSale.id, payload);
        success(`Sale #${editingSale.id} updated and stock adjusted!`);
      } else {
        const created = await api.createSale(payload);
        success(`Sale #${created.id} recorded and inventory deducted!`);
      }

      setIsModalOpen(false);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to save sale transaction');
    }
  };

  const handleDeleteSale = async () => {
    if (!deleteSaleTarget) return;
    try {
      await api.deleteSale(deleteSaleTarget.id);
      success(`Sale #${deleteSaleTarget.id} deleted. All inventory was safely restored.`);
      setDeleteSaleTarget(null);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to delete sale');
    }
  };

  // Financial summary of visible filtered sales
  const summaryTotalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const summaryTotalCost = sales.reduce((acc, s) => acc + s.totalCost, 0);
  const summaryGrossProfit = summaryTotalRevenue - summaryTotalCost;
  const summaryMarginPct = summaryTotalRevenue > 0 ? (summaryGrossProfit / summaryTotalRevenue) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#12304A]">Daily Sales Records</h2>
          <p className="text-xs text-slate-500">
            Multi-item transactions for Live Fish, Fish Food, and Aquarium Equipment
          </p>
        </div>

        <button
          onClick={openNewSaleModal}
          className="px-4 py-2.5 bg-[#0077B6] hover:bg-[#023E8A] active:scale-[0.98] text-white font-bold text-xs md:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* Sales Summary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Revenue
          </span>
          <span className="text-lg md:text-xl font-black text-[#12304A]">
            {currency}{summaryTotalRevenue.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">{sales.length} transactions</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Cost of Goods (COGS)
          </span>
          <span className="text-lg md:text-xl font-black text-slate-700">
            {currency}{summaryTotalCost.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">Inventory wholesale cost</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Gross Profit
          </span>
          <span className="text-lg md:text-xl font-black text-emerald-600">
            +{currency}{summaryGrossProfit.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">Revenue minus COGS</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Average Profit Margin
          </span>
          <span className="text-lg md:text-xl font-black text-[#0077B6]">
            {summaryMarginPct.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-500 block">Overall margin on sales</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by receipt ID, customer, fish name, or accessory..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Clear Date
            </button>
          )}

          {/* Payment filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card / POS">Card / POS</option>
            <option value="Other">Other</option>
          </select>

          {/* Product Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
          >
            <option value="all">All Product Types</option>
            <option value="live_fish">Live Fish</option>
            <option value="fish_food">Fish Food</option>
            <option value="accessory">Accessories</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Receipt</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Breakdown</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total Sale</th>
                <th className="py-3 px-4 text-right">COGS</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Margin %</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    {isLoading ? 'Loading sales records...' : 'No sales records found matching your filters.'}
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-[#0077B6]">
                      {sale.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {sale.saleDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#12304A] block">
                        {sale.customerName || 'Walk-in Customer'}
                      </span>
                      {sale.notes && (
                        <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                          {sale.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {sale.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-700">
                            <span className="font-semibold text-slate-900">
                              {it.quantity} {it.itemType === 'live_fish' ? (it.quantity === 1 ? 'pair' : 'pairs') : 'x'}
                            </span>
                            <span>{it.itemName}</span>
                            <span className="text-slate-400 text-[10px]">
                              ({it.itemType === 'live_fish' ? 'Live Fish' : it.itemType === 'fish_food' ? 'Food' : 'Acc'})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">{sale.paymentMethod}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {currency}{sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                      {currency}{sale.totalCost.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                      +{currency}{sale.totalGrossProfit.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#0077B6]">
                      {sale.marginPct.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditSaleModal(sale)}
                          className="p-1.5 text-slate-400 hover:text-[#0077B6] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Sale"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteSaleTarget(sale)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Sale & Restore Stock"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 text-[#0077B6]">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#12304A]">
                    {editingSale ? `Edit Sale #${editingSale.id}` : 'Record New Fish & Product Sale'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select Live Fish, Fish Food, or Aquarium Accessories with automatic stock deduction
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitSale} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sale metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Sale Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card / POS">Card / POS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Customer / Reference</label>
                  <input
                    type="text"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="e.g. Elena Rostova or Walk-in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>
              </div>

              {/* Items in Sale */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Products in this Sale ({formItems.length})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddItemSlot('live_fish')}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#0077B6] bg-sky-50 hover:bg-sky-100 rounded-lg cursor-pointer transition-colors"
                    >
                      + Live Fish
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItemSlot('fish_food')}
                      className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer transition-colors"
                    >
                      + Fish Food
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItemSlot('accessory')}
                      className="px-2.5 py-1 text-[11px] font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg cursor-pointer transition-colors"
                    >
                      + Accessory
                    </button>
                  </div>
                </div>

                {fishList.length === 0 && foodList.length === 0 && accessoriesList.length === 0 && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Inventory catalog is currently empty. Please add items in <strong>Fish Inventory</strong>, <strong>Fish Food</strong>, or <strong>Accessories</strong> first.</span>
                  </div>
                )}

                <div className="space-y-3">
                  {formItems.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                      No products added yet. Click <strong>+ Live Fish</strong>, <strong>+ Fish Food</strong>, or <strong>+ Accessory</strong> above to add items to this sale.
                    </div>
                  ) : (
                    formItems.map((item, index) => {
                    const lineSaleTotal = item.quantity * item.sellingPrice;
                    const lineCostTotal = item.quantity * item.purchaseCost;
                    const lineProfit = lineSaleTotal - lineCostTotal;

                    return (
                      <div
                        key={index}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          {/* Item Type */}
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                              Type
                            </label>
                            <select
                              value={item.itemType}
                              onChange={(e) => handleItemTypeChange(index, e.target.value as any)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                            >
                              <option value="live_fish">🐟 Live Fish</option>
                              <option value="fish_food">🍲 Fish Food</option>
                              <option value="accessory">⚙️ Accessory</option>
                            </select>
                          </div>

                          {/* Specific Product */}
                          <div className="sm:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                              Product Variety / Item
                            </label>
                            <select
                              value={item.itemId}
                              onChange={(e) => handleProductSelect(index, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 truncate"
                            >
                              {item.itemType === 'live_fish' &&
                                fishList.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} (Stock: {f.currentStock} {f.currentStock === 1 ? 'pair' : 'pairs'})
                                  </option>
                                ))}
                              {item.itemType === 'fish_food' &&
                                foodList.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} (Stock: {f.currentStock})
                                  </option>
                                ))}
                              {item.itemType === 'accessory' &&
                                accessoriesList.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name} (Stock: {a.currentStock})
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                              {item.itemType === 'live_fish' ? 'Pairs' : 'Qty'}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const updated = [...formItems];
                                updated[index].quantity = Math.max(1, parseInt(e.target.value) || 1);
                                setFormItems(updated);
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-center"
                            />
                          </div>

                          {/* Selling Price */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                              {item.itemType === 'live_fish' ? 'Price/Pair' : 'Price/Unit'}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.sellingPrice}
                              onChange={(e) => {
                                const updated = [...formItems];
                                updated[index].sellingPrice = parseFloat(e.target.value) || 0;
                                setFormItems(updated);
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                            />
                          </div>

                          {/* Delete Item Slot */}
                          <div className="sm:col-span-1 flex justify-end sm:justify-center pt-2 sm:pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemSlot(index)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Line calculation summary */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                          <div>
                            Purchase Cost: {currency}{item.purchaseCost.toFixed(2)}{item.itemType === 'live_fish' ? '/pair' : '/unit'} · Total Cost: {currency}
                            {lineCostTotal.toFixed(2)}
                          </div>
                          <div>
                            Line Total:{' '}
                            <span className="font-extrabold text-slate-800">
                              {currency}{lineSaleTotal.toFixed(2)}
                            </span>{' '}
                            · Profit:{' '}
                            <span className="font-bold text-emerald-600">
                              +{currency}{lineProfit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Sale Notes (Optional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional details, delivery notes, or special requests..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              {/* Live Sale Financial Summary Card */}
              <div className="bg-[#F0F9FF] p-4 rounded-2xl border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0077B6] tracking-wider block">
                    Calculated Sale Total
                  </span>
                  <div className="text-2xl font-black text-[#12304A]">
                    {currency}{modalTotalRevenue.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cost of Goods</span>
                    <span className="font-bold text-slate-700">{currency}{modalTotalCost.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Profit</span>
                    <span className="font-black text-emerald-600">+{currency}{modalGrossProfit.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Margin</span>
                    <span className="font-black text-[#0077B6]">{modalMarginPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs md:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-[#0077B6] hover:bg-[#023E8A] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingSale ? 'Save Changes' : 'Confirm & Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteSaleTarget}
        title={`Delete Sale #${deleteSaleTarget?.id}?`}
        message="Deleting this transaction will permanently remove the sale and automatically return all sold items back into available inventory."
        confirmText="Delete & Restore Stock"
        isDestructive={true}
        onConfirm={handleDeleteSale}
        onCancel={() => setDeleteSaleTarget(null)}
      />
    </div>
  );
};
