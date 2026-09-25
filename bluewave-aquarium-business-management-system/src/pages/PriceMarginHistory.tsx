import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Tag,
  History,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { PriceHistoryRecord, FishVariety, FishFoodProduct, AquariumAccessory } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface PriceMarginHistoryProps {
  currency: string;
}

export const PriceMarginHistory: React.FC<PriceMarginHistoryProps> = ({ currency }) => {
  const { error } = useToast();

  const [history, setHistory] = useState<PriceHistoryRecord[]>([]);
  const [stats, setStats] = useState({
    highestSelling: 0,
    lowestSelling: 0,
    highestWholesale: 0,
    lowestWholesale: 0,
    totalChanges: 0,
  });
  const [fishList, setFishList] = useState<FishVariety[]>([]);
  const [foodList, setFoodList] = useState<FishFoodProduct[]>([]);
  const [accList, setAccList] = useState<AquariumAccessory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [historyData, fishData, foodData, accData] = await Promise.all([
        api.getPriceHistory({
          itemType: typeFilter !== 'all' ? typeFilter : undefined,
          itemId: itemFilter !== 'all' ? itemFilter : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
        api.getFish(),
        api.getFishFood(),
        api.getAccessories(),
      ]);

      setHistory(historyData.history);
      setStats(historyData.stats);
      setFishList(fishData);
      setFoodList(foodData);
      setAccList(accData);
    } catch (err: any) {
      error(err.message || 'Failed to load price history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, itemFilter, dateFrom, dateTo]);

  // Chart data: chronological order of changes
  const chartData = [...history]
    .sort((a, b) => new Date(a.changeDate).getTime() - new Date(b.changeDate).getTime())
    .map((record) => ({
      date: record.changeDate,
      name: record.itemName,
      wholesale: record.newWholesalePrice,
      selling: record.newSellingPrice,
      margin: record.profitMargin,
      marginPct: record.profitMarginPct,
    }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-[#12304A]">Price & Profit Margin History</h2>
        <p className="text-xs text-slate-500">
          Permanent audit log of wholesale acquisition costs, retail selling price changes, and historical margin trends
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Highest Selling Price
          </span>
          <span className="text-lg md:text-xl font-black text-[#12304A]">
            {currency}{stats.highestSelling.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">Peak retail recorded</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Lowest Selling Price
          </span>
          <span className="text-lg md:text-xl font-black text-slate-700">
            {currency}{stats.lowestSelling.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">Minimum retail recorded</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Highest Wholesale Cost
          </span>
          <span className="text-lg md:text-xl font-black text-amber-600">
            {currency}{stats.highestWholesale.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 block">Peak purchase price</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Price Change Revisions
          </span>
          <span className="text-lg md:text-xl font-black text-[#0077B6]">
            {stats.totalChanges} revisions
          </span>
          <span className="text-[11px] text-slate-500 block">Permanent historical log</span>
        </div>
      </div>

      {/* Interactive Line Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-[#12304A]">Historical Price Comparison Chart</h3>
            <p className="text-xs text-slate-500">
              Wholesale acquisition cost vs. retail selling price over time
            </p>
          </div>
        </div>

        <div className="h-68 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No historical price data matching current filters.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'Margin %' ? `${Number(value).toFixed(1)}%` : `${currency}${Number(value).toFixed(2)}`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line
                  type="monotone"
                  dataKey="wholesale"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Wholesale Cost"
                />
                <Line
                  type="monotone"
                  dataKey="selling"
                  stroke="#0077B6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  name="Selling Price"
                />
                <Line
                  type="monotone"
                  dataKey="margin"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                  name="Unit Profit Margin"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setItemFilter('all');
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="live_fish">Live Fish</option>
            <option value="fish_food">Fish Food</option>
            <option value="accessory">Accessories</option>
          </select>

          <select
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0077B6] cursor-pointer max-w-xs"
          >
            <option value="all">All Specific Products</option>
            {typeFilter !== 'fish_food' &&
              typeFilter !== 'accessory' &&
              fishList.map((f) => (
                <option key={f.id} value={f.id}>
                  🐟 {f.name}
                </option>
              ))}
            {typeFilter !== 'live_fish' &&
              typeFilter !== 'accessory' &&
              foodList.map((f) => (
                <option key={f.id} value={f.id}>
                  🍲 {f.name}
                </option>
              ))}
            {typeFilter !== 'live_fish' &&
              typeFilter !== 'fish_food' &&
              accList.map((a) => (
                <option key={a.id} value={a.id}>
                  ⚙️ {a.name}
                </option>
              ))}
          </select>
        </div>

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

      {/* Historical Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Change Date</th>
                <th className="py-3 px-4">Item Name / Type</th>
                <th className="py-3 px-4 text-right">Wholesale Cost Before</th>
                <th className="py-3 px-4 text-right">New Wholesale Cost</th>
                <th className="py-3 px-4 text-right">Retail Price Before</th>
                <th className="py-3 px-4 text-right">New Retail Price</th>
                <th className="py-3 px-4 text-right">Profit Margin (Unit / Pair)</th>
                <th className="py-3 px-4 text-right">Margin %</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {isLoading ? 'Loading price history...' : 'No historical price change records match your filters.'}
                  </td>
                </tr>
              ) : (
                history.map((record) => {
                  const wpDiff = record.newWholesalePrice - record.previousWholesalePrice;
                  const spDiff = record.newSellingPrice - record.previousSellingPrice;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {record.changeDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-[#12304A] block">{record.itemName}</span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {record.itemType === 'live_fish'
                            ? '🐟 Live Fish'
                            : record.itemType === 'fish_food'
                            ? '🍲 Fish Food'
                            : '⚙️ Accessory'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {currency}{record.previousWholesalePrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        <div className="flex items-center justify-end gap-1">
                          <span>{currency}{record.newWholesalePrice.toFixed(2)}</span>
                          {wpDiff > 0 && <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />}
                          {wpDiff < 0 && <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {currency}{record.previousSellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-[#0077B6]">
                        <div className="flex items-center justify-end gap-1">
                          <span>{currency}{record.newSellingPrice.toFixed(2)}</span>
                          {spDiff > 0 && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
                          {spDiff < 0 && <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        <div>+{currency}{record.profitMargin.toFixed(2)}</div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {record.itemType === 'live_fish' ? '/ pair' : '/ unit'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                        {record.profitMarginPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {record.reason || 'Inventory price revision'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
