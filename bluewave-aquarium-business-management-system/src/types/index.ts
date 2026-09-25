export interface UserProfile {
  id: string;
  email: string;
  name: string;
  businessName: string;
  role: 'owner' | 'admin';
  currencySymbol: string;
}

export interface FishVariety {
  id: string;
  name: string;
  variety: string;
  category: string;
  image?: string;
  wholesalePrice: number;
  sellingPrice: number;
  singleSellingPrice?: number;
  singleWholesalePrice?: number;
  profitMargin: number;
  profitMarginPct: number;
  currentStock: number;
  minStockLevel: number;
  supplier: string;
  dateAdded: string;
  notes: string;
  status: 'active' | 'archived';
}

export interface FishFoodProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  sizeWeight: string;
  wholesalePrice: number;
  sellingPrice: number;
  profitMargin: number;
  profitMarginPct: number;
  currentStock: number;
  minStockLevel: number;
  supplier: string;
  dateAdded: string;
  description?: string;
  notes?: string;
  status: 'active' | 'archived';
}

export interface AquariumAccessory {
  id: string;
  name: string;
  category: string;
  brand: string;
  sizeModel: string;
  wholesalePrice: number;
  sellingPrice: number;
  profitMargin: number;
  profitMarginPct: number;
  currentStock: number;
  minStockLevel: number;
  supplier: string;
  dateAdded: string;
  description?: string;
  notes?: string;
  status: 'active' | 'archived';
}

export interface SaleItem {
  itemType: 'live_fish' | 'fish_food' | 'accessory';
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  pairsCount?: number;
  singleCount?: number;
  sellingPrice: number;
  singleSellingPrice?: number;
  purchaseCost: number;
  singlePurchaseCost?: number;
  totalSaleAmount: number;
  totalCost: number;
  grossProfit: number;
  marginPct: number;
}

export interface Sale {
  id: string;
  saleDate: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  totalGrossProfit: number;
  marginPct: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card / POS' | 'Other';
  customerName?: string;
  notes?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  purchaseDate: string;
  itemType: 'live_fish' | 'fish_food' | 'accessory';
  itemId: string;
  itemName: string;
  supplier: string;
  quantity: number;
  purchasePrice: number;
  totalCost: number;
  updateCatalogPrice: boolean;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card' | 'Other';
  notes?: string;
  createdAt: string;
}

export interface AdditionalIncome {
  id: string;
  date: string;
  category: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface PriceHistoryRecord {
  id: string;
  itemType: 'live_fish' | 'fish_food' | 'accessory';
  itemId: string;
  itemName: string;
  previousWholesalePrice: number;
  newWholesalePrice: number;
  previousSellingPrice: number;
  newSellingPrice: number;
  profitMargin: number;
  profitMarginPct: number;
  changeDate: string;
  reason?: string;
  createdAt: string;
}

export interface InventoryAdjustment {
  id: string;
  date: string;
  itemType: 'live_fish' | 'fish_food' | 'accessory';
  itemId: string;
  itemName: string;
  adjustmentType: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  today: {
    date: string;
    totalRevenue: number;
    salesRevenue: number;
    additionalIncome: number;
    totalExpenses: number;
    netProfit: number;
    fishSold: number;
    fishPairsSold?: number;
    fishSinglesSold?: number;
    totalFishCountSold?: number;
    foodSold: number;
    accessoriesSold: number;
    totalItemsSold: number;
  };
  month: {
    prefix: string;
    revenue: number;
    salesRevenue: number;
    additionalIncome: number;
    expenses: number;
    grossProfit: number;
    netProfit: number;
    categoryBreakdown: {
      liveFish: { revenue: number; profit: number };
      fishFood: { revenue: number; profit: number };
      accessories: { revenue: number; profit: number };
    };
  };
  inventory: {
    liveFish: {
      varietiesCount: number;
      totalStock: number;
      wholesaleValue: number;
      retailValue: number;
      lowStockCount: number;
    };
    fishFood: {
      productsCount: number;
      totalStock: number;
      wholesaleValue: number;
      lowStockCount: number;
    };
    accessories: {
      productsCount: number;
      totalStock: number;
      wholesaleValue: number;
      lowStockCount: number;
    };
    totalItemsStock: number;
    totalStockCostValue: number;
    totalStockRetailValue: number;
  };
  alerts: {
    lowStockFish: FishVariety[];
    lowStockFood: FishFoodProduct[];
    lowStockAccessories: AquariumAccessory[];
    totalAlerts: number;
  };
  bestSellingFish: {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }[];
  recentSales: Sale[];
  trends: {
    last7Days: { date: string; label: string; revenue: number; profit: number; expenses: number }[];
    last6Months: { month: string; label: string; revenue: number; profit: number; expenses: number }[];
  };
}

export interface MonthlyReportData {
  period: {
    year: number;
    month: number;
    monthKey: string;
    monthName: string;
  };
  metrics: {
    totalRevenue: number;
    salesRevenue: number;
    additionalIncome: number;
    costOfGoodsSold: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    netProfit: number;
    totalWholesalePurchases: number;
    grossProfitMarginPct: number;
    netProfitMarginPct: number;
    fishSold: number;
    foodSold: number;
    accessoriesSold: number;
    totalItemsSold: number;
  };
  comparisonWithPrevious: {
    previousMonthKey: string;
    previousRevenue: number;
    previousNetProfit: number;
    revenueGrowthPct: number;
    netProfitGrowthPct: number;
  };
  bestSellingProducts: {
    id: string;
    name: string;
    type: string;
    quantity: number;
    revenue: number;
    profit: number;
  }[];
  expenseBreakdown: Record<string, number>;
  dailyBreakdown: {
    day: number;
    date: string;
    revenue: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
  }[];
}

export interface TransactionRecord {
  id: string;
  type: 'sale' | 'purchase' | 'expense' | 'income' | 'adjustment' | 'price_change';
  date: string;
  title: string;
  description: string;
  amount?: number;
  financialImpact: 'positive' | 'negative' | 'neutral';
  category?: string;
  raw: any;
  createdAt: string;
}
