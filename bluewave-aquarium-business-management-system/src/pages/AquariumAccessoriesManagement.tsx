import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  PackagePlus,
  TrendingUp,
  X,
  Layers,
} from 'lucide-react';
import { AquariumAccessory } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface AquariumAccessoriesManagementProps {
  currency: string;
  onRefreshStats?: () => void;
  onQuickPurchase?: (itemId: string, itemType: string) => void;
}

export const AquariumAccessoriesManagement: React.FC<AquariumAccessoriesManagementProps> = ({
  currency,
  onRefreshStats,
  onQuickPurchase,
}) => {
  const { success, error } = useToast();

  const [accessoriesList, setAccessoriesList] = useState<AquariumAccessory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<AquariumAccessory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AquariumAccessory | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Filters');
  const [formBrand, setFormBrand] = useState('Seachem');
  const [formSizeModel, setFormSizeModel] = useState('Standard');
  const [formWholesalePrice, setFormWholesalePrice] = useState('15.00');
  const [formSellingPrice, setFormSellingPrice] = useState('29.99');
  const [formCurrentStock, setFormCurrentStock] = useState('10');
  const [formMinStockLevel, setFormMinStockLevel] = useState('4');
  const [formSupplier, setFormSupplier] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriceReason, setFormPriceReason] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAccessories({
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setAccessoriesList(data);
    } catch (err: any) {
      error(err.message || 'Failed to load accessories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, categoryFilter]);

  const openNewModal = () => {
    setEditingAcc(null);
    setFormName('');
    setFormCategory('Filters');
    setFormBrand('Seachem');
    setFormSizeModel('Standard');
    setFormWholesalePrice('15.00');
    setFormSellingPrice('29.99');
    setFormCurrentStock('10');
    setFormMinStockLevel('4');
    setFormSupplier('');
    setFormDescription('');
    setFormPriceReason('');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: AquariumAccessory) => {
    setEditingAcc(acc);
    setFormName(acc.name);
    setFormCategory(acc.category);
    setFormBrand(acc.brand);
    setFormSizeModel(acc.sizeModel);
    setFormWholesalePrice(acc.wholesalePrice.toString());
    setFormSellingPrice(acc.sellingPrice.toString());
    setFormCurrentStock(acc.currentStock.toString());
    setFormMinStockLevel(acc.minStockLevel.toString());
    setFormSupplier(acc.supplier || '');
    setFormDescription(acc.description || acc.notes || '');
    setFormPriceReason('');
    setIsModalOpen(true);
  };

  const wpNum = parseFloat(formWholesalePrice) || 0;
  const spNum = parseFloat(formSellingPrice) || 0;
  const calcMargin = spNum - wpNum;
  const calcMarginPct = spNum > 0 ? (calcMargin / spNum) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || wpNum < 0 || spNum < 0) {
      error('Please provide valid equipment details');
      return;
    }

    try {
      if (editingAcc) {
        await api.updateAccessory(editingAcc.id, {
          name: formName,
          category: formCategory,
          brand: formBrand,
          sizeModel: formSizeModel,
          wholesalePrice: wpNum,
          sellingPrice: spNum,
          currentStock: parseInt(formCurrentStock) || 0,
          minStockLevel: parseInt(formMinStockLevel) || 3,
          supplier: formSupplier,
          description: formDescription,
          notes: formDescription,
          priceChangeReason: formPriceReason || 'Accessory price revision',
        });
        success(`Accessory "${formName}" updated!`);
      } else {
        await api.createAccessory({
          name: formName,
          category: formCategory,
          brand: formBrand,
          sizeModel: formSizeModel,
          wholesalePrice: wpNum,
          sellingPrice: spNum,
          currentStock: parseInt(formCurrentStock) || 0,
          minStockLevel: parseInt(formMinStockLevel) || 3,
          supplier: formSupplier,
          description: formDescription,
          notes: formDescription,
        });
        success(`New accessory "${formName}" added!`);
      }

      setIsModalOpen(false);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to save accessory product');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteAccessory(deleteTarget.id);
      success(`Accessory "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to delete accessory');
    }
  };

  // Metrics
  const totalStockUnits = accessoriesList.reduce((acc, a) => acc + a.currentStock, 0);
  const totalWholesaleValue = accessoriesList.reduce((acc, a) => acc + a.currentStock * a.wholesalePrice, 0);
  const totalRetailPotential = accessoriesList.reduce((acc, a) => acc + a.currentStock * a.sellingPrice, 0);
  const lowStockCount = accessoriesList.filter((a) => a.currentStock <= a.minStockLevel).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#12304A]">Aquarium Accessories & Equipment</h2>
          <p className="text-xs text-slate-500">
            Tanks, filtration, lighting, heating, air pumps, water conditioners, and aquascaping tools
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2.5 bg-[#0077B6] hover:bg-[#023E8A] active:scale-[0.98] text-white font-bold text-xs md:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment Item</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total In Stock
          </span>
          <span className="text-lg md:text-xl font-black text-[#12304A]">{totalStockUnits} units</span>
          <span className="text-[11px] text-slate-500 block">{accessoriesList.length} unique equipment lines</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Wholesale Value
          </span>
          <span className="text-lg md:text-xl font-black text-slate-700">
            {currency}{totalWholesaleValue.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">Inventory wholesale investment</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Retail Potential
          </span>
          <span className="text-lg md:text-xl font-black text-[#0077B6]">
            {currency}{totalRetailPotential.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">Expected sales value</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Low Stock Alerts
          </span>
          <span className={`text-lg md:text-xl font-black ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {lowStockCount} items
          </span>
          <span className="text-[11px] text-slate-500 block">Need restocking</span>
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
            placeholder="Search accessories by name, brand, model, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:bg-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
        >
          <option value="all">All Equipment Categories</option>
          <option value="Tanks">Tanks & Aquariums</option>
          <option value="Filters">Filters & Media</option>
          <option value="Lights">LED Lighting</option>
          <option value="Heaters">Heaters & Thermometers</option>
          <option value="Air Pumps">Air Pumps & Tubing</option>
          <option value="Water Pumps">Water Pumps & Wavemakers</option>
          <option value="Conditioners & Treatments">Water Conditioners & Meds</option>
          <option value="Fish Nets">Fish Nets</option>
          <option value="Gravel & Sand">Gravel, Sand & Substrates</option>
          <option value="Decorations">Decorations & Hardscape</option>
          <option value="Cleaning Tools">Cleaning Tools & Scrapers</option>
          <option value="Other">Other Equipment</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Equipment Item / ID</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Model / Size</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-right">Wholesale Cost</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Profit / Unit</th>
                <th className="py-3 px-4 text-right">Margin %</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accessoriesList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {isLoading ? 'Loading accessories...' : 'No accessories found matching your search.'}
                  </td>
                </tr>
              ) : (
                accessoriesList.map((acc) => {
                  const isLow = acc.currentStock <= acc.minStockLevel;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-[#00B4D8] flex items-center justify-center shrink-0">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-[#12304A] block">{acc.name}</span>
                            <span className="text-[11px] text-slate-400">
                              {acc.category} · {acc.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{acc.brand}</td>
                      <td className="py-3.5 px-4 text-slate-600">{acc.sizeModel}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-black text-sm ${
                              isLow ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {acc.currentStock}
                          </span>
                          {isLow && (
                            <span
                              className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                              title={`Below minimum threshold of ${acc.minStockLevel}`}
                            >
                              <AlertTriangle className="w-3 h-3" /> Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                        {currency}{acc.wholesalePrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {currency}{acc.sellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        +{currency}{acc.profitMargin.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#0077B6]">
                        {acc.profitMarginPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onQuickPurchase && (
                            <button
                              onClick={() => onQuickPurchase(acc.id, 'accessory')}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Restock Wholesale Batch"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(acc)}
                            className="p-1.5 text-slate-400 hover:text-[#0077B6] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Accessory"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(acc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Accessory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 text-[#00B4D8]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#12304A]">
                    {editingAcc ? `Edit ${editingAcc.name}` : 'Add Aquarium Accessory or Equipment'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Filters, lighting, tanks, pumps, heaters, water conditioning
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
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Product Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Fluval Aquasky 2.0 LED Light, Seachem Prime 500ml"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  >
                    <option value="Tanks">Tanks & Aquariums</option>
                    <option value="Filters">Filters & Media</option>
                    <option value="Lights">LED Lighting</option>
                    <option value="Heaters">Heaters & Thermometers</option>
                    <option value="Air Pumps">Air Pumps & Tubing</option>
                    <option value="Water Pumps">Water Pumps & Wavemakers</option>
                    <option value="Conditioners & Treatments">Water Conditioners & Meds</option>
                    <option value="Fish Nets">Fish Nets</option>
                    <option value="Gravel & Sand">Gravel, Sand & Substrates</option>
                    <option value="Decorations">Decorations & Hardscape</option>
                    <option value="Cleaning Tools">Cleaning Tools & Scrapers</option>
                    <option value="Other">Other Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Fluval, Seachem, Eheim"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Size / Model</label>
                  <input
                    type="text"
                    value={formSizeModel}
                    onChange={(e) => setFormSizeModel(e.target.value)}
                    placeholder="e.g. 500ml, Model 55, 150W"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="p-4 bg-[#F0F9FF] rounded-2xl border border-sky-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Wholesale Cost ({currency.trim()})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formWholesalePrice}
                      onChange={(e) => setFormWholesalePrice(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Selling Price ({currency.trim()})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-sky-200/60 text-xs">
                  <div>
                    <span className="text-slate-500">Unit Profit: </span>
                    <span className="font-extrabold text-emerald-600">
                      +{currency}{calcMargin.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Margin: </span>
                    <span className="font-extrabold text-[#0077B6]">{calcMarginPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Stock quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Minimum Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStockLevel}
                    onChange={(e) => setFormMinStockLevel(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Supplier / Distributor</label>
                <input
                  type="text"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  placeholder="e.g. Rolf C. Hagen, Seachem Laboratories"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                />
              </div>

              {editingAcc && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Price Change Reason (Logged in Price History)
                  </label>
                  <input
                    type="text"
                    value={formPriceReason}
                    onChange={(e) => setFormPriceReason(e.target.value)}
                    placeholder="e.g. Supplier catalog updated..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description & Specs</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Wattage, flow rate, tank capacity, warranty..."
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
                  {editingAcc ? 'Update Accessory' : 'Add to Accessory Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message={`Are you sure you want to remove ${deleteTarget?.name} from inventory?`}
        confirmText="Delete Accessory"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
