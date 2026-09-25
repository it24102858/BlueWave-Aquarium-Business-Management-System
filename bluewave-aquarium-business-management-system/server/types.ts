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
  adjustmentType: 'Restock / Recount' | 'Fish Mortality / Loss' | 'Damaged Goods' | 'Display Tank Use' | 'Correction';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  businessName: string;
  role: 'owner' | 'admin';
  currencySymbol: string;
  createdAt: string;
}

export interface AppDatabase {
  users: User[];
  fishVarieties: FishVariety[];
  fishFoodProducts: FishFoodProduct[];
  aquariumAccessories: AquariumAccessory[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  additionalIncome: AdditionalIncome[];
  priceHistory: PriceHistoryRecord[];
  inventoryAdjustments: InventoryAdjustment[];
  
}
