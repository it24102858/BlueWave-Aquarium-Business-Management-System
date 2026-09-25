import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Layers,
  X,
  Truck,
} from 'lucide-react';
import {
  Purchase,
  FishVariety,
  FishFoodProduct,
  AquariumAccessory,
} from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface FishPurchasesProps {
  currency: string;
  onRefreshStats?: () => void;
  openNewPurchaseTrigger?: boolean;
  onCloseNewPurchaseTrigger?: () => void;
  preselectedItemId?: string;
  preselectedItemType?: string;
}

export const FishPurchases: React.FC<FishPurchasesProps> = ({
  currency,
  onRefreshStats,
  openNewPurchaseTrigger,
  onCloseNewPurchaseTrigger,
  preselectedItemId,
  preselectedItemType,
}) => {
  const { success, error } = useToast();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [fishList, setFishList] = useState<FishVariety[]>([]);
  const [foodList, setFoodList] = useState<FishFoodProduct[]>([]);
  const [accList, setAccList] = useState<AquariumAccessory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);

  // Form
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<'live_fish' | 'fish_food' | 'accessory'>('live_fish');
  const [formItemId, setFormItemId] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formQuantity, setFormQuantity] = useState('50');
  const [formPurchasePrice, setFormPurchasePrice] = useState('1.00');
  const [formUpdateCatalogPrice, setFormUpdateCatalogPrice] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [purchasesData, fishData, foodData, accessoriesData] = await Promise.all([
        api.getPurchases({
          itemType: typeFilter !== 'all' ? typeFilter : undefined,
          search: searchTerm || undefined,
        }),
        api.getFish(),
        api.getFishFood(),
        api.getAccessories(),
      ]);
      setPurchases(purchasesData);
      setFishList(fishData);
      setFoodList(foodData);
      setAccList(accessoriesData);
    } catch (err: any) {
      error(err.message || 'Failed to load purchase intake records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, searchTerm]);

  useEffect(() => {
    if (openNewPurchaseTrigger) {
      openModal(preselectedItemId, preselectedItemType as any);
      if (onCloseNewPurchaseTrigger) onCloseNewPurchaseTrigger();
    }
  }, [openNewPurchaseTrigger, preselectedItemId, preselectedItemType]);

  const openModal = (targetItemId?: string, targetType?: 'live_fish' | 'fish_food' | 'accessory') => {
    const pType = targetType || 'live_fish';
    setFormType(pType);
    setFormDate(new Date().toISOString().split('T')[0]);

    let initialItem: any = null;
    if (pType === 'live_fish') {
      initialItem = targetItemId ? fishList.find((f) => f.id === targetItemId) : fishList[0];
    } else if (pType === 'fish_food') {
      initialItem = targetItemId ? foodList.find((f) => f.id === targetItemId) : foodList[0];
    } else {
      initialItem = targetItemId ? accList.find((a) => a.id === targetItemId) : accList[0];
    }

    if (initialItem) {
      setFormItemId(initialItem.id);
      setFormSupplier(initialItem.supplier || 'Wholesale Supplier');
      setFormPurchasePrice(initialItem.wholesalePrice.toString());
      setFormQuantity('50');
    }

    setFormUpdateCatalogPrice(true);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType: 'live_fish' | 'fish_food' | 'accessory') => {
    setFormType(newType);
    let initialItem: any = null;
    if (newType === 'live_fish') initialItem = fishList[0];
    if (newType === 'fish_food') initialItem = foodList[0];
    if (newType === 'accessory') initialItem = accList[0];

    if (initialItem) {
      setFormItemId(initialItem.id);
      setFormSupplier(initialItem.supplier || 'Wholesale Supplier');
      setFormPurchasePrice(initialItem.wholesalePrice.toString());
    }
  };

  const handleProductSelect = (itemId: string) => {
    setFormItemId(itemId);
    let selected: any = null;
    if (formType === 'live_fish') selected = fishList.find((f) => f.id === itemId);
    if (formType === 'fish_food') selected = foodList.find((f) => f.id === itemId);
    if (formType === 'accessory') selected = accList.find((a) => a.id === itemId);

    if (selected) {
      setFormSupplier(selected.supplier || formSupplier);
      setFormPurchasePrice(selected.wholesalePrice.toString());
    }
  };

  const qtyNum = parseInt(formQuantity) || 0;
  const ppNum = parseFloat(formPurchasePrice) || 0;
  const calculatedTotalCost = qtyNum * ppNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItemId || qtyNum <= 0 || ppNum <= 0) {
      error('Please select an item and provide a valid quantity and purchase price');
      return;
    }

    let itemName = 'Unknown Product';
    if (formType === 'live_fish') {
      const match = fishList.find((f) => f.id === formItemId);
      if (match) itemName = match.name;
    } else if (formType === 'fish_food') {
      const match = foodList.find((f) => f.id === formItemId);
      if (match) itemName = match.name;
    } else if (formType === 'accessory') {
      const match = accList.find((a) => a.id === formItemId);
      if (match) itemName = match.name;
    }

    try {
      await api.createPurchase({
        purchaseDate: formDate,
        itemType: formType,
        itemId: formItemId,
        itemName,
        supplier: formSupplier,
        quantity: qtyNum,
        purchasePrice: ppNum,
        updateCatalogPrice: formUpdateCatalogPrice,
        notes: formNotes,
      });

      const unitLabel = formType === 'live_fish' ? (qtyNum === 1 ? 'pair' : 'pairs') : (qtyNum === 1 ? 'unit' : 'units');
      success(`Wholesale intake of ${qtyNum} ${unitLabel} of "${itemName}" recorded! Inventory updated.`);
      setIsModalOpen(false);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to record wholesale purchase');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deletePurchase(deleteTarget.id);
      success(`Purchase #${deleteTarget.id} deleted. Stock adjusted accordingly.`);
      setDeleteTarget(null);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to delete purchase record');
    }
  };

  // Metrics
  const totalPurchasesCost = purchases.reduce((acc, p) => acc + p.totalCost, 0);
  const totalUnitsPurchased = purchases.reduce((acc, p) => acc + p.quantity, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#12304A]">Fish & Wholesale Stock Purchases</h2>
          <p className="text-xs text-slate-500">
            Record supplier orders, batch restocking, and cost updates across all products
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 bg-[#0077B6] hover:bg-[#023E8A] active:scale-[0.98] text-white font-bold text-xs md:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Wholesale Purchase</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Wholesale Spend
          </span>
          <span className="text-lg md:text-xl font-black text-[#12304A]">
            {currency}{totalPurchasesCost.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">{purchases.length} batches logged</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Restocked Units
          </span>
          <span className="text-lg md:text-xl font-black text-[#0077B6]">
            {totalUnitsPurchased} units
          </span>
          <span className="text-[11px] text-slate-500 block">Across live fish, food & equipment</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Suppliers Active
          </span>
          <span className="text-lg md:text-xl font-black text-slate-700">
            {new Set(purchases.map((p) => p.supplier)).size} suppliers
          </span>
          <span className="text-[11px] text-slate-500 block">Registered supply lines</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name, supplier, or purchase ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:bg-white"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
        >
          <option value="all">All Product Categories</option>
          <option value="live_fish">Live Fish Only</option>
          <option value="fish_food">Fish Food Only</option>
          <option value="accessory">Accessories Only</option>
        </select>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Purchase ID / Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-center">Batch Quantity</th>
                <th className="py-3 px-4 text-right">Unit Wholesale Cost</th>
                <th className="py-3 px-4 text-right">Total Batch Cost</th>
                <th className="py-3 px-4 text-center">Catalog Price Updated?</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {isLoading ? 'Loading wholesale purchases...' : 'No purchase records found.'}
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-[#0077B6] block">{purchase.id}</span>
                      <span className="text-[11px] text-slate-400">{purchase.purchaseDate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 capitalize">
                        {purchase.itemType === 'live_fish'
                          ? '🐟 Live Fish'
                          : purchase.itemType === 'fish_food'
                          ? '🍲 Fish Food'
                          : '⚙️ Accessory'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {purchase.itemName}
                      {purchase.notes && (
                        <span className="text-[11px] text-slate-400 font-normal block">{purchase.notes}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{purchase.supplier}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                      +{purchase.quantity} {purchase.itemType === 'live_fish' ? (purchase.quantity === 1 ? 'pair' : 'pairs') : 'units'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      {currency}{purchase.purchasePrice.toFixed(2)}
                      <span className="text-[10px] text-slate-400 block">
                        {purchase.itemType === 'live_fish' ? '/ pair' : '/ unit'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#12304A]">
                      {currency}{purchase.totalCost.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          purchase.updateCatalogPrice
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {purchase.updateCatalogPrice ? 'Yes (Sync)' : 'Batch Only'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setDeleteTarget(purchase)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Purchase & Adjust Stock"
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

      {/* Add Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 text-[#0077B6]">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#12304A]">
                    Record Wholesale Batch Purchase
                  </h3>
                  <p className="text-xs text-slate-500">
                    Stock will automatically increase for the selected product
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

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Product Category</label>
                  <select
                    value={formType}
                    onChange={(e) => handleTypeChange(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  >
                    <option value="live_fish">🐟 Live Fish</option>
                    <option value="fish_food">🍲 Fish Food</option>
                    <option value="accessory">⚙️ Aquarium Accessory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Product Variety / Item</label>
                <select
                  value={formItemId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                >
                  {formType === 'live_fish' &&
                    fishList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.variety}) — Current Stock: {f.currentStock} {f.currentStock === 1 ? 'pair' : 'pairs'}
                      </option>
                    ))}
                  {formType === 'fish_food' &&
                    foodList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.brand}) — Current Stock: {f.currentStock}
                      </option>
                    ))}
                  {formType === 'accessory' &&
                    accList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.brand}) — Current Stock: {a.currentStock}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Wholesale Supplier Name</label>
                <input
                  type="text"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  placeholder="e.g. AquaTropics Wholesale Co., Seachem, Fluval"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Quantity Purchased {formType === 'live_fish' ? '(Pairs)' : '(Units)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    required
                    placeholder={formType === 'live_fish' ? 'e.g. 20 pairs' : 'e.g. 10 units'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Wholesale Price {formType === 'live_fish' ? 'per Pair' : 'per Unit'} ({currency.trim()})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>
              </div>

              {/* Total cost and catalog sync checkbox */}
              <div className="p-4 bg-[#F0F9FF] rounded-2xl border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0077B6] block">
                    Calculated Total Purchase Cost
                  </span>
                  <span className="text-xl font-black text-[#12304A]">
                    {currency}{calculatedTotalCost.toFixed(2)}
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formUpdateCatalogPrice}
                    onChange={(e) => setFormUpdateCatalogPrice(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0077B6] focus:ring-[#0077B6]"
                  />
                  <span>Update catalog wholesale price</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Notes / Batch Number (Optional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Batch #NT-4892 quarantine cleared, free shipping..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
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
                  Confirm Purchase & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete Purchase #${deleteTarget?.id}?`}
        message={`Deleting this purchase will subtract ${deleteTarget?.quantity} units of ${deleteTarget?.itemName} from stock.`}
        confirmText="Delete & Revert Stock"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
