import React, { useState, useEffect } from 'react';
import {
  Fish,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  TrendingUp,
  X,
  PackagePlus,
  Tag,
} from 'lucide-react';
import { FishVariety } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatFishStock, round2 } from '../utils/formatters';

interface FishInventoryProps {
  currency: string;
  onRefreshStats?: () => void;
  onQuickPurchase?: (itemId: string, itemType: string) => void;
}

export const FishInventory: React.FC<FishInventoryProps> = ({
  currency,
  onRefreshStats,
  onQuickPurchase,
}) => {
  const { success, error } = useToast();

  const [fishList, setFishList] = useState<FishVariety[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low_stock' | 'in_stock'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFish, setEditingFish] = useState<FishVariety | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FishVariety | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formVariety, setFormVariety] = useState('');
  const [formCategory, setFormCategory] = useState('Tetra');
  const [formWholesalePrice, setFormWholesalePrice] = useState('1.00');
  const [formSellingPrice, setFormSellingPrice] = useState('3.50');
  const [formSingleSellingPrice, setFormSingleSellingPrice] = useState('1.75');
  const [formSingleWholesalePrice, setFormSingleWholesalePrice] = useState('0.50');
  const [formCurrentStock, setFormCurrentStock] = useState('50');
  const [formMinStockLevel, setFormMinStockLevel] = useState('15');
  const [formSupplier, setFormSupplier] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPriceReason, setFormPriceReason] = useState('');

  const loadFish = async () => {
    try {
      setIsLoading(true);
      const data = await api.getFish({
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setFishList(data);
    } catch (err: any) {
      error(err.message || 'Failed to load fish inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFish();
  }, [searchTerm, categoryFilter]);

  const openNewFishModal = () => {
    setEditingFish(null);
    setFormName('');
    setFormVariety('');
    setFormCategory('Tetra');
    setFormWholesalePrice('1.00');
    setFormSellingPrice('3.50');
    setFormSingleSellingPrice('1.75');
    setFormSingleWholesalePrice('0.50');
    setFormCurrentStock('40');
    setFormMinStockLevel('15');
    setFormSupplier('');
    setFormNotes('');
    setFormPriceReason('');
    setIsModalOpen(true);
  };

  const openEditFishModal = (fish: FishVariety) => {
    setEditingFish(fish);
    setFormName(fish.name);
    setFormVariety(fish.variety);
    setFormCategory(fish.category);
    setFormWholesalePrice(fish.wholesalePrice.toString());
    setFormSellingPrice(fish.sellingPrice.toString());
    setFormSingleSellingPrice((fish.singleSellingPrice ?? round2(fish.sellingPrice / 2)).toString());
    setFormSingleWholesalePrice((fish.singleWholesalePrice ?? round2(fish.wholesalePrice / 2)).toString());
    setFormCurrentStock(fish.currentStock.toString());
    setFormMinStockLevel(fish.minStockLevel.toString());
    setFormSupplier(fish.supplier || '');
    setFormNotes(fish.notes || '');
    setFormPriceReason('');
    setIsModalOpen(true);
  };

  // Form live calculations
  const wpNum = parseFloat(formWholesalePrice) || 0;
  const spNum = parseFloat(formSellingPrice) || 0;
  const singleSpNum = parseFloat(formSingleSellingPrice) || round2(spNum / 2);
  const singleWpNum = parseFloat(formSingleWholesalePrice) || round2(wpNum / 2);
  const calcMargin = spNum - wpNum;
  const calcMarginPct = spNum > 0 ? (calcMargin / spNum) * 100 : 0;
  const singleCalcMargin = singleSpNum - singleWpNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || wpNum < 0 || spNum < 0) {
      error('Please provide valid fish details and pricing');
      return;
    }

    try {
      if (editingFish) {
        await api.updateFish(editingFish.id, {
          name: formName,
          variety: formVariety,
          category: formCategory,
          wholesalePrice: wpNum,
          sellingPrice: spNum,
          singleSellingPrice: singleSpNum,
          singleWholesalePrice: singleWpNum,
          currentStock: parseFloat(formCurrentStock) || 0,
          minStockLevel: parseFloat(formMinStockLevel) || 10,
          supplier: formSupplier,
          notes: formNotes,
          priceChangeReason: formPriceReason || 'Price updated in inventory management',
        });
        success(`Fish "${formName}" updated successfully!`);
      } else {
        await api.createFish({
          name: formName,
          variety: formVariety,
          category: formCategory,
          wholesalePrice: wpNum,
          sellingPrice: spNum,
          singleSellingPrice: singleSpNum,
          singleWholesalePrice: singleWpNum,
          currentStock: parseFloat(formCurrentStock) || 0,
          minStockLevel: parseFloat(formMinStockLevel) || 10,
          supplier: formSupplier,
          notes: formNotes,
        });
        success(`New fish variety "${formName}" added!`);
      }
      setIsModalOpen(false);
      loadFish();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to save fish details');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteFish(deleteTarget.id);
      success(`Fish variety "${deleteTarget.name}" removed from inventory.`);
      setDeleteTarget(null);
      loadFish();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      error(err.message || 'Failed to delete fish variety');
    }
  };

  // Filtered subset
  let displayedFish = fishList;
  if (stockStatusFilter === 'low_stock') {
    displayedFish = displayedFish.filter((f) => f.currentStock <= f.minStockLevel);
  } else if (stockStatusFilter === 'in_stock') {
    displayedFish = displayedFish.filter((f) => f.currentStock > f.minStockLevel);
  }

  // Summary figures
  const totalStockCount = fishList.reduce((acc, f) => acc + f.currentStock, 0);
  const totalWholesaleValue = fishList.reduce((acc, f) => acc + f.currentStock * f.wholesalePrice, 0);
  const totalRetailPotential = fishList.reduce((acc, f) => acc + f.currentStock * f.sellingPrice, 0);
  const lowStockCount = fishList.filter((f) => f.currentStock <= f.minStockLevel).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#12304A]">Live Fish Inventory</h2>
          <p className="text-xs text-slate-500">
            Catalog of aquatic breeds, tank counts, wholesale acquisition costs, and retail margins
          </p>
        </div>

        <button
          onClick={openNewFishModal}
          className="px-4 py-2.5 bg-[#0077B6] hover:bg-[#023E8A] active:scale-[0.98] text-white font-bold text-xs md:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fish Variety</span>
        </button>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Live Fish Stock
          </span>
          <span className="text-lg md:text-xl font-black text-[#12304A]">{totalStockCount} pairs</span>
          <span className="text-[11px] text-slate-500 block">{fishList.length} unique varieties (in pairs)</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Wholesale Value
          </span>
          <span className="text-lg md:text-xl font-black text-slate-700">
            {currency}{totalWholesaleValue.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">Total cost invested in fish pairs</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Retail Potential
          </span>
          <span className="text-lg md:text-xl font-black text-[#0077B6]">
            {currency}{totalRetailPotential.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">Expected sales revenue from stock</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Low Stock Alerts
          </span>
          <span className={`text-lg md:text-xl font-black ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {lowStockCount} varieties
          </span>
          <span className="text-[11px] text-slate-500 block">At or under minimum pair threshold</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fish by name, scientific variety, ID, or supplier..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Tetra">Tetra</option>
            <option value="Cichlid">Cichlid</option>
            <option value="Dwarf Cichlid">Dwarf Cichlid</option>
            <option value="Livebearer">Livebearer</option>
            <option value="Anabantoid">Betta / Anabantoid</option>
            <option value="Catfish & Algae Eaters">Catfish & Algae Eaters</option>
            <option value="Marine">Marine / Saltwater</option>
            <option value="Goldfish">Goldfish / Coldwater</option>
          </select>

          {/* Stock status */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
          >
            <option value="all">All Stock Levels</option>
            <option value="low_stock">⚠️ Low Stock Alerts Only</option>
            <option value="in_stock">Healthy Stock Only</option>
          </select>
        </div>
      </div>

      {/* Fish Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Fish ID / Variety</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Available Stock (Pairs)</th>
                <th className="py-3 px-4 text-right">Wholesale / Pair</th>
                <th className="py-3 px-4 text-right">Selling Price / Pair</th>
                <th className="py-3 px-4 text-right">Profit / Pair</th>
                <th className="py-3 px-4 text-right">Margin %</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedFish.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {isLoading ? 'Loading fish inventory...' : 'No fish varieties match your search criteria.'}
                  </td>
                </tr>
              ) : (
                displayedFish.map((fish) => {
                  const isLow = fish.currentStock <= fish.minStockLevel;

                  return (
                    <tr key={fish.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0077B6] flex items-center justify-center shrink-0">
                            <Fish className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-[#12304A] block">{fish.name}</span>
                            <span className="text-[11px] text-slate-400 italic">
                              {fish.variety} · {fish.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-600 font-medium">{fish.category}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`font-black text-xs ${
                                isLow ? 'text-rose-600' : 'text-slate-800'
                              }`}
                            >
                              {formatFishStock(fish.currentStock)}
                            </span>
                            {isLow && (
                              <span
                                className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                                title={`Below minimum stock threshold of ${fish.minStockLevel} pairs`}
                              >
                                <AlertTriangle className="w-3 h-3" /> Low
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-medium text-slate-600 block">{currency}{fish.wholesalePrice.toFixed(2)} <span className="text-[10px] text-slate-400">/pair</span></span>
                        <span className="text-[10px] text-slate-400 block">{currency}{(fish.singleWholesalePrice ?? round2(fish.wholesalePrice / 2)).toFixed(2)} /single</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-slate-900 block">{currency}{fish.sellingPrice.toFixed(2)} <span className="text-[10px] text-slate-400">/pair</span></span>
                        <span className="text-[10px] font-semibold text-[#0077B6] block">{currency}{(fish.singleSellingPrice ?? round2(fish.sellingPrice / 2)).toFixed(2)} /single</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        +{currency}{fish.profitMargin.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#0077B6]">
                        {fish.profitMarginPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {fish.supplier || 'Wholesale Supplier'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onQuickPurchase && (
                            <button
                              onClick={() => onQuickPurchase(fish.id, 'live_fish')}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Restock Wholesale Batch"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditFishModal(fish)}
                            className="p-1.5 text-slate-400 hover:text-[#0077B6] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Details & Prices"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(fish)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Fish"
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

      {/* Add / Edit Fish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 text-[#0077B6]">
                  <Fish className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#12304A]">
                    {editingFish ? `Edit ${editingFish.name} (${editingFish.id})` : 'Add New Fish Variety'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set wholesale cost, retail price, and stock levels in pairs (2 fish per pair)
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">Fish Common Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Neon Tetra, Discus Blue Diamond"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Variety / Scientific Name</label>
                  <input
                    type="text"
                    value={formVariety}
                    onChange={(e) => setFormVariety(e.target.value)}
                    placeholder="e.g. Paracheirodon innesi or Color Grade"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  >
                    <option value="Tetra">Tetra</option>
                    <option value="Cichlid">Cichlid</option>
                    <option value="Dwarf Cichlid">Dwarf Cichlid</option>
                    <option value="Livebearer">Livebearer</option>
                    <option value="Anabantoid">Betta / Anabantoid</option>
                    <option value="Catfish & Algae Eaters">Catfish & Algae Eaters</option>
                    <option value="Marine">Marine / Saltwater</option>
                    <option value="Goldfish">Goldfish / Coldwater</option>
                    <option value="Community">Community / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Wholesale Supplier</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="e.g. AquaTropics Wholesale Co."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>
              </div>

              {/* Pricing & Automatic Profit Margin Display */}
              <div className="p-4 bg-[#F0F9FF] rounded-2xl border border-sky-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Wholesale Price / Pair ({currency.trim()})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formWholesalePrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormWholesalePrice(val);
                        const num = parseFloat(val) || 0;
                        setFormSingleWholesalePrice(round2(num / 2).toString());
                      }}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Selling Price / Pair ({currency.trim()})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formSellingPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSellingPrice(val);
                        const num = parseFloat(val) || 0;
                        setFormSingleSellingPrice(round2(num / 2).toString());
                      }}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Wholesale Cost / Single Fish ({currency.trim()})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formSingleWholesalePrice}
                      onChange={(e) => setFormSingleWholesalePrice(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Selling Price / Single Fish ({currency.trim()})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formSingleSellingPrice}
                      onChange={(e) => setFormSingleSellingPrice(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-sky-200/60 text-xs gap-2">
                  <div>
                    <span className="text-slate-500">Pair Profit: </span>
                    <span className="font-extrabold text-emerald-600">
                      +{currency}{calcMargin.toFixed(2)} ({calcMarginPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Single Fish Profit: </span>
                    <span className="font-extrabold text-[#0077B6]">
                      +{currency}{singleCalcMargin.toFixed(2)} ({singleSpNum > 0 ? ((singleCalcMargin / singleSpNum) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Current Stock Quantity (Pairs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(e.target.value)}
                    required
                    placeholder="e.g. 50 (in pairs)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Minimum Stock Alert Threshold (Pairs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStockLevel}
                    onChange={(e) => setFormMinStockLevel(e.target.value)}
                    required
                    placeholder="e.g. 15 (in pairs)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>
              </div>

              {editingFish && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Reason for Price Change (Logged in Price History)
                  </label>
                  <input
                    type="text"
                    value={formPriceReason}
                    onChange={(e) => setFormPriceReason(e.target.value)}
                    placeholder="e.g. Supplier cost increase, seasonal retail adjustment..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description & Care Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Water temperature, tank requirements, temperament..."
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
                  {editingFish ? 'Update Fish' : 'Add to Inventory'}
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
        message={`Are you sure you want to remove ${deleteTarget?.name} (${deleteTarget?.id}) from inventory? Historical sales records will remain preserved.`}
        confirmText="Delete Variety"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
