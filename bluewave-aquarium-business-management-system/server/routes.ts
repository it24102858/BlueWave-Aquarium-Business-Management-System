import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  getDatabase,
  saveDatabase,
  resetToSeed,
  getMongoStatus,
  syncToMongoDB,
  clearAllRecords,
  mongoInsertDoc,
  mongoUpdateDoc,
  mongoDeleteDoc,
} from './db.js';
import { authMiddleware, generateToken, AuthRequest } from './auth.js';
import {
  Sale,
  Purchase,
  Expense,
  AdditionalIncome,
  PriceHistoryRecord,
  InventoryAdjustment,
  FishVariety,
  FishFoodProduct,
  AquariumAccessory,
} from './types.js';

export const apiRouter = Router();

// Helper to format 2 decimals
function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// Helper to find and update product stock
function adjustProductStock(
  itemType: 'live_fish' | 'fish_food' | 'accessory',
  itemId: string,
  delta: number // positive increases stock, negative decreases
): boolean {
  const db = getDatabase();
  if (itemType === 'live_fish') {
    const item = db.fishVarieties.find((f) => f.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock + delta);
      return true;
    }
  } else if (itemType === 'fish_food') {
    const item = db.fishFoodProducts.find((f) => f.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock + delta);
      return true;
    }
  } else if (itemType === 'accessory') {
    const item = db.aquariumAccessories.find((f) => f.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock + delta);
      return true;
    }
  }
  return false;
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------
apiRouter.post('/auth/login', (req, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDatabase();
  const inputEmail = email.toLowerCase().trim();
  const user = db.users.find((u) => u.email.toLowerCase() === inputEmail) ||
    ((inputEmail === 'admin@bluewave.com' || inputEmail === 'ruditha@bluewave.com' || inputEmail === 'rudithayukthika29@gmail.com') ? db.users[0] : undefined);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      businessName: user.businessName,
      role: user.role,
      currencySymbol: user.currencySymbol || 'LKR',
    },
  });
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      businessName: user.businessName,
      role: user.role,
      currencySymbol: user.currencySymbol || 'LKR',
    },
  });
});

apiRouter.put('/auth/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, businessName, currencySymbol, email } = req.body;
  const db = getDatabase();
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (name) user.name = name.trim();
  if (businessName) user.businessName = businessName.trim();
  if (currencySymbol) user.currencySymbol = currencySymbol.trim();
  if (email) user.email = email.trim().toLowerCase();

  await mongoUpdateDoc('users', user.id, user);
  await saveDatabase(db);
  res.json({ success: true, user });
});

apiRouter.put('/auth/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    res.status(400).json({ error: 'Current password does not match' });
    return;
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  await mongoUpdateDoc('users', user.id, user);
  await saveDatabase(db);
  res.json({ success: true, message: 'Password updated successfully' });
});

// ----------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------
apiRouter.get('/dashboard/stats', authMiddleware, (_req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  // Today's Sales
  const todaySales = db.sales.filter((s) => s.saleDate === todayStr);
  const todaySalesRevenue = round2(todaySales.reduce((acc, s) => acc + s.totalAmount, 0));
  const todayCostOfGoods = round2(todaySales.reduce((acc, s) => acc + s.totalCost, 0));
  const todayGrossProfit = round2(todaySalesRevenue - todayCostOfGoods);

  // Today's Additional Income
  const todayIncome = round2(
    db.additionalIncome.filter((i) => i.date === todayStr).reduce((acc, i) => acc + i.amount, 0)
  );
  const todayTotalRevenue = round2(todaySalesRevenue + todayIncome);

  // Today's Expenses
  const todayExpenses = round2(
    db.expenses.filter((e) => e.date === todayStr).reduce((acc, e) => acc + e.amount, 0)
  );

  // Today's Net Profit
  const todayNetProfit = round2(todayGrossProfit + todayIncome - todayExpenses);

  // Today's items sold
  let todayFishSold = 0;
  let todayFishPairsSold = 0;
  let todayFishSinglesSold = 0;
  let todayTotalFishCount = 0;
  let todayFoodSold = 0;
  let todayAccessoriesSold = 0;
  todaySales.forEach((s) => {
    s.items.forEach((item) => {
      if (item.itemType === 'live_fish') {
        const p = Number(item.pairsCount ?? (item.quantity % 1 === 0 ? item.quantity : Math.floor(item.quantity))) || 0;
        const s = Number(item.singleCount ?? (item.quantity % 1 !== 0 ? Math.round((item.quantity - Math.floor(item.quantity)) * 2) : 0)) || 0;
        todayFishPairsSold += p;
        todayFishSinglesSold += s;
        todayTotalFishCount += (p * 2) + s;
        todayFishSold += round2(p + (s * 0.5));
      }
      if (item.itemType === 'fish_food') todayFoodSold += item.quantity;
      if (item.itemType === 'accessory') todayAccessoriesSold += item.quantity;
    });
  });

  // Monthly Sales
  const monthlySales = db.sales.filter((s) => s.saleDate.startsWith(monthPrefix));
  const monthlySalesRevenue = round2(monthlySales.reduce((acc, s) => acc + s.totalAmount, 0));
  const monthlyCostOfGoods = round2(monthlySales.reduce((acc, s) => acc + s.totalCost, 0));
  const monthlyGrossProfit = round2(monthlySalesRevenue - monthlyCostOfGoods);

  const monthlyIncome = round2(
    db.additionalIncome.filter((i) => i.date.startsWith(monthPrefix)).reduce((acc, i) => acc + i.amount, 0)
  );
  const monthlyRevenue = round2(monthlySalesRevenue + monthlyIncome);

  const monthlyExpenses = round2(
    db.expenses.filter((e) => e.date.startsWith(monthPrefix)).reduce((acc, e) => acc + e.amount, 0)
  );
  const monthlyNetProfit = round2(monthlyGrossProfit + monthlyIncome - monthlyExpenses);

  // Stock counts and values
  const totalFishVarieties = db.fishVarieties.filter((f) => f.status === 'active').length;
  const totalFishStock = db.fishVarieties
    .filter((f) => f.status === 'active')
    .reduce((acc, f) => acc + f.currentStock, 0);
  const fishStockWholesaleVal = round2(
    db.fishVarieties.filter((f) => f.status === 'active').reduce((acc, f) => acc + f.currentStock * f.wholesalePrice, 0)
  );
  const fishStockRetailVal = round2(
    db.fishVarieties.filter((f) => f.status === 'active').reduce((acc, f) => acc + f.currentStock * f.sellingPrice, 0)
  );

  const totalFoodProducts = db.fishFoodProducts.filter((f) => f.status === 'active').length;
  const totalFoodStock = db.fishFoodProducts
    .filter((f) => f.status === 'active')
    .reduce((acc, f) => acc + f.currentStock, 0);
  const foodStockWholesaleVal = round2(
    db.fishFoodProducts
      .filter((f) => f.status === 'active')
      .reduce((acc, f) => acc + f.currentStock * f.wholesalePrice, 0)
  );

  const totalAccessoriesProducts = db.aquariumAccessories.filter((a) => a.status === 'active').length;
  const totalAccessoriesStock = db.aquariumAccessories
    .filter((a) => a.status === 'active')
    .reduce((acc, a) => acc + a.currentStock, 0);
  const accessoriesStockWholesaleVal = round2(
    db.aquariumAccessories
      .filter((a) => a.status === 'active')
      .reduce((acc, a) => acc + a.currentStock * a.wholesalePrice, 0)
  );

  const estimatedStockCostValue = round2(fishStockWholesaleVal + foodStockWholesaleVal + accessoriesStockWholesaleVal);
  const estimatedStockRetailValue = round2(
    fishStockRetailVal +
      db.fishFoodProducts.filter((f) => f.status === 'active').reduce((acc, f) => acc + f.currentStock * f.sellingPrice, 0) +
      db.aquariumAccessories
        .filter((a) => a.status === 'active')
        .reduce((acc, a) => acc + a.currentStock * a.sellingPrice, 0)
  );

  // Low stock alerts across all categories
  const lowStockFish = db.fishVarieties.filter((f) => f.status === 'active' && f.currentStock <= f.minStockLevel);
  const lowStockFood = db.fishFoodProducts.filter((f) => f.status === 'active' && f.currentStock <= f.minStockLevel);
  const lowStockAccessories = db.aquariumAccessories.filter(
    (a) => a.status === 'active' && a.currentStock <= a.minStockLevel
  );

  // Best selling fish varieties (all time and this month)
  const fishSalesMap: Record<string, { id: string; name: string; quantity: number; revenue: number; profit: number }> =
    {};
  db.sales.forEach((s) => {
    s.items.forEach((item) => {
      if (item.itemType === 'live_fish') {
        if (!fishSalesMap[item.itemId]) {
          fishSalesMap[item.itemId] = {
            id: item.itemId,
            name: item.itemName,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        fishSalesMap[item.itemId].quantity += item.quantity;
        fishSalesMap[item.itemId].revenue = round2(fishSalesMap[item.itemId].revenue + item.totalSaleAmount);
        fishSalesMap[item.itemId].profit = round2(fishSalesMap[item.itemId].profit + item.grossProfit);
      }
    });
  });
  const bestSellingFish = Object.values(fishSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Category breakdown for current month
  let fishMonthRev = 0;
  let fishMonthProfit = 0;
  let foodMonthRev = 0;
  let foodMonthProfit = 0;
  let accMonthRev = 0;
  let accMonthProfit = 0;

  monthlySales.forEach((s) => {
    s.items.forEach((it) => {
      if (it.itemType === 'live_fish') {
        fishMonthRev += it.totalSaleAmount;
        fishMonthProfit += it.grossProfit;
      } else if (it.itemType === 'fish_food') {
        foodMonthRev += it.totalSaleAmount;
        foodMonthProfit += it.grossProfit;
      } else if (it.itemType === 'accessory') {
        accMonthRev += it.totalSaleAmount;
        accMonthProfit += it.grossProfit;
      }
    });
  });

  // Recent 6 sales
  const recentSales = [...db.sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // Last 7 days revenue trend
  const last7Days: { date: string; label: string; revenue: number; profit: number; expenses: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const daySales = db.sales.filter((s) => s.saleDate === dStr);
    const dayIncome = db.additionalIncome.filter((inc) => inc.date === dStr).reduce((acc, inc) => acc + inc.amount, 0);
    const dayExp = db.expenses.filter((e) => e.date === dStr).reduce((acc, e) => acc + e.amount, 0);

    const sRev = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const sCost = daySales.reduce((acc, s) => acc + s.totalCost, 0);
    const sGross = sRev - sCost;

    last7Days.push({
      date: dStr,
      label: dayLabel,
      revenue: round2(sRev + dayIncome),
      profit: round2(sGross + dayIncome - dayExp),
      expenses: round2(dayExp),
    });
  }

  // Last 6 months trend
  const last6Months: { month: string; label: string; revenue: number; profit: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const prefix = `${y}-${m}`;
    const mLabel = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const mSales = db.sales.filter((s) => s.saleDate.startsWith(prefix));
    const mInc = db.additionalIncome.filter((inc) => inc.date.startsWith(prefix)).reduce((a, b) => a + b.amount, 0);
    const mExp = db.expenses.filter((e) => e.date.startsWith(prefix)).reduce((a, b) => a + b.amount, 0);

    const rev = mSales.reduce((a, b) => a + b.totalAmount, 0) + mInc;
    const cost = mSales.reduce((a, b) => a + b.totalCost, 0);
    const gross = mSales.reduce((a, b) => a + b.totalGrossProfit, 0) + mInc;
    const net = gross - mExp;

    last6Months.push({
      month: prefix,
      label: mLabel,
      revenue: round2(rev),
      profit: round2(net),
      expenses: round2(mExp),
    });
  }

  res.json({
    today: {
      date: todayStr,
      totalRevenue: todayTotalRevenue,
      salesRevenue: todaySalesRevenue,
      additionalIncome: todayIncome,
      totalExpenses: todayExpenses,
      netProfit: todayNetProfit,
      fishSold: round2(todayFishSold),
      fishPairsSold: todayFishPairsSold,
      fishSinglesSold: todayFishSinglesSold,
      totalFishCountSold: todayTotalFishCount,
      foodSold: todayFoodSold,
      accessoriesSold: todayAccessoriesSold,
      totalItemsSold: round2(todayFishSold) + todayFoodSold + todayAccessoriesSold,
    },
    month: {
      prefix: monthPrefix,
      revenue: monthlyRevenue,
      salesRevenue: monthlySalesRevenue,
      additionalIncome: monthlyIncome,
      expenses: monthlyExpenses,
      grossProfit: monthlyGrossProfit,
      netProfit: monthlyNetProfit,
      categoryBreakdown: {
        liveFish: { revenue: round2(fishMonthRev), profit: round2(fishMonthProfit) },
        fishFood: { revenue: round2(foodMonthRev), profit: round2(foodMonthProfit) },
        accessories: { revenue: round2(accMonthRev), profit: round2(accMonthProfit) },
      },
    },
    inventory: {
      liveFish: {
        varietiesCount: totalFishVarieties,
        totalStock: totalFishStock,
        wholesaleValue: fishStockWholesaleVal,
        retailValue: fishStockRetailVal,
        lowStockCount: lowStockFish.length,
      },
      fishFood: {
        productsCount: totalFoodProducts,
        totalStock: totalFoodStock,
        wholesaleValue: foodStockWholesaleVal,
        lowStockCount: lowStockFood.length,
      },
      accessories: {
        productsCount: totalAccessoriesProducts,
        totalStock: totalAccessoriesStock,
        wholesaleValue: accessoriesStockWholesaleVal,
        lowStockCount: lowStockAccessories.length,
      },
      totalItemsStock: totalFishStock + totalFoodStock + totalAccessoriesStock,
      totalStockCostValue: estimatedStockCostValue,
      totalStockRetailValue: estimatedStockRetailValue,
    },
    alerts: {
      lowStockFish,
      lowStockFood,
      lowStockAccessories,
      totalAlerts: lowStockFish.length + lowStockFood.length + lowStockAccessories.length,
    },
    bestSellingFish,
    recentSales,
    trends: {
      last7Days,
      last6Months,
    },
  });
});

// ----------------------------------------------------
// FISH VARIETIES MANAGEMENT
// ----------------------------------------------------
apiRouter.get('/fish', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { search, category, status } = req.query;

  let list = db.fishVarieties;
  if (status && status !== 'all') {
    list = list.filter((f) => f.status === status);
  }
  if (category && category !== 'all') {
    list = list.filter((f) => f.category === category);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.variety.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.supplier.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

apiRouter.post('/fish', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const {
    name,
    variety,
    category,
    wholesalePrice,
    sellingPrice,
    singleSellingPrice,
    singleWholesalePrice,
    currentStock,
    minStockLevel,
    supplier,
    notes,
    image,
  } = req.body;

  if (!name || wholesalePrice == null || sellingPrice == null) {
    res.status(400).json({ error: 'Fish name, wholesale price, and selling price are required' });
    return;
  }

  const id = `FISH-${100 + db.fishVarieties.length + 1}`;
  const wp = Number(wholesalePrice);
  const sp = Number(sellingPrice);
  const singleSp = singleSellingPrice != null && Number(singleSellingPrice) > 0 ? Number(singleSellingPrice) : round2(sp / 2);
  const singleWp = singleWholesalePrice != null && Number(singleWholesalePrice) > 0 ? Number(singleWholesalePrice) : round2(wp / 2);
  const margin = round2(sp - wp);
  const marginPct = sp > 0 ? round2((margin / sp) * 100) : 0;
  const todayStr = new Date().toISOString().split('T')[0];

  const newFish: FishVariety = {
    id,
    name: name.trim(),
    variety: (variety || '').trim(),
    category: (category || 'Community').trim(),
    image: image || '',
    wholesalePrice: wp,
    sellingPrice: sp,
    singleSellingPrice: singleSp,
    singleWholesalePrice: singleWp,
    profitMargin: margin,
    profitMarginPct: marginPct,
    currentStock: Number(currentStock) || 0,
    minStockLevel: Number(minStockLevel) || 10,
    supplier: (supplier || '').trim(),
    dateAdded: todayStr,
    notes: (notes || '').trim(),
    status: 'active',
  };

  db.fishVarieties.push(newFish);

  // Initial price history record
  const phRecord: PriceHistoryRecord = {
    id: `PH-${5000 + db.priceHistory.length + 1}`,
    itemType: 'live_fish',
    itemId: newFish.id,
    itemName: newFish.name,
    previousWholesalePrice: wp,
    newWholesalePrice: wp,
    previousSellingPrice: sp,
    newSellingPrice: sp,
    profitMargin: margin,
    profitMarginPct: marginPct,
    changeDate: todayStr,
    reason: 'Initial catalog addition',
    createdAt: new Date().toISOString(),
  };
  db.priceHistory.push(phRecord);

  // Directly insert into MongoDB collections
  await mongoInsertDoc('fishVarieties', newFish);
  await mongoInsertDoc('priceHistory', phRecord);
  await saveDatabase(db);
  res.status(201).json(newFish);
});

apiRouter.put('/fish/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const fishIndex = db.fishVarieties.findIndex((f) => f.id === id);

  if (fishIndex === -1) {
    res.status(404).json({ error: 'Fish variety not found' });
    return;
  }

  const existing = db.fishVarieties[fishIndex];
  const {
    name,
    variety,
    category,
    wholesalePrice,
    sellingPrice,
    singleSellingPrice,
    singleWholesalePrice,
    currentStock,
    minStockLevel,
    supplier,
    notes,
    image,
    status,
    priceChangeReason,
  } = req.body;

  const newWp = wholesalePrice != null ? Number(wholesalePrice) : existing.wholesalePrice;
  const newSp = sellingPrice != null ? Number(sellingPrice) : existing.sellingPrice;
  const newSingleSp = singleSellingPrice != null && Number(singleSellingPrice) > 0 ? Number(singleSellingPrice) : round2(newSp / 2);
  const newSingleWp = singleWholesalePrice != null && Number(singleWholesalePrice) > 0 ? Number(singleWholesalePrice) : round2(newWp / 2);
  const todayStr = new Date().toISOString().split('T')[0];

  // Check if prices changed
  const priceChanged = newWp !== existing.wholesalePrice || newSp !== existing.sellingPrice;

  const margin = round2(newSp - newWp);
  const marginPct = newSp > 0 ? round2((margin / newSp) * 100) : 0;

  if (priceChanged) {
    const phRecord: PriceHistoryRecord = {
      id: `PH-${5000 + db.priceHistory.length + 1}`,
      itemType: 'live_fish',
      itemId: existing.id,
      itemName: name || existing.name,
      previousWholesalePrice: existing.wholesalePrice,
      newWholesalePrice: newWp,
      previousSellingPrice: existing.sellingPrice,
      newSellingPrice: newSp,
      profitMargin: margin,
      profitMarginPct: marginPct,
      changeDate: todayStr,
      reason: priceChangeReason || 'Price updated in inventory',
      createdAt: new Date().toISOString(),
    };
    db.priceHistory.push(phRecord);
    await mongoInsertDoc('priceHistory', phRecord);
  }

  const updatedFish: FishVariety = {
    ...existing,
    name: name != null ? name.trim() : existing.name,
    variety: variety != null ? variety.trim() : existing.variety,
    category: category != null ? category.trim() : existing.category,
    image: image != null ? image : existing.image,
    wholesalePrice: newWp,
    sellingPrice: newSp,
    singleSellingPrice: newSingleSp,
    singleWholesalePrice: newSingleWp,
    profitMargin: margin,
    profitMarginPct: marginPct,
    currentStock: currentStock != null ? Number(currentStock) : existing.currentStock,
    minStockLevel: minStockLevel != null ? Number(minStockLevel) : existing.minStockLevel,
    supplier: supplier != null ? supplier.trim() : existing.supplier,
    notes: notes != null ? notes.trim() : existing.notes,
    status: status || existing.status,
  };

  db.fishVarieties[fishIndex] = updatedFish;
  await mongoUpdateDoc('fishVarieties', id, updatedFish);
  await saveDatabase(db);
  res.json(updatedFish);
});

apiRouter.delete('/fish/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.fishVarieties.findIndex((f) => f.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Fish variety not found' });
    return;
  }

  const removed = db.fishVarieties.splice(index, 1)[0];
  await mongoDeleteDoc('fishVarieties', id);
  await saveDatabase(db);
  res.json({ success: true, removed });
});

// ----------------------------------------------------
// FISH FOOD PRODUCTS MANAGEMENT
// ----------------------------------------------------
apiRouter.get('/food', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { search, category, brand, status } = req.query;

  let list = db.fishFoodProducts;
  if (status && status !== 'all') {
    list = list.filter((f) => f.status === status);
  }
  if (category && category !== 'all') {
    list = list.filter((f) => f.category === category);
  }
  if (brand && brand !== 'all') {
    list = list.filter((f) => f.brand.toLowerCase() === (brand as string).toLowerCase());
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.brand.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

apiRouter.post('/food', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { name, category, brand, sizeWeight, wholesalePrice, sellingPrice, currentStock, minStockLevel, supplier, description } =
    req.body;

  if (!name || wholesalePrice == null || sellingPrice == null) {
    res.status(400).json({ error: 'Food name, wholesale price, and selling price are required' });
    return;
  }

  const id = `FOOD-${200 + db.fishFoodProducts.length + 1}`;
  const wp = Number(wholesalePrice);
  const sp = Number(sellingPrice);
  const margin = round2(sp - wp);
  const marginPct = sp > 0 ? round2((margin / sp) * 100) : 0;
  const todayStr = new Date().toISOString().split('T')[0];

  const newFood: FishFoodProduct = {
    id,
    name: name.trim(),
    category: (category || 'Pellets').trim(),
    brand: (brand || 'Generic').trim(),
    sizeWeight: (sizeWeight || '100g').trim(),
    wholesalePrice: wp,
    sellingPrice: sp,
    profitMargin: margin,
    profitMarginPct: marginPct,
    currentStock: Number(currentStock) || 0,
    minStockLevel: Number(minStockLevel) || 8,
    supplier: (supplier || '').trim(),
    dateAdded: todayStr,
    description: (description || '').trim(),
    status: 'active',
  };

  db.fishFoodProducts.push(newFood);

  // Price history
  const phRecord: PriceHistoryRecord = {
    id: `PH-${5000 + db.priceHistory.length + 1}`,
    itemType: 'fish_food',
    itemId: newFood.id,
    itemName: newFood.name,
    previousWholesalePrice: wp,
    newWholesalePrice: wp,
    previousSellingPrice: sp,
    newSellingPrice: sp,
    profitMargin: margin,
    profitMarginPct: marginPct,
    changeDate: todayStr,
    reason: 'Initial food addition',
    createdAt: new Date().toISOString(),
  };
  db.priceHistory.push(phRecord);

  await mongoInsertDoc('fishFoodProducts', newFood);
  await mongoInsertDoc('priceHistory', phRecord);
  await saveDatabase(db);
  res.status(201).json(newFood);
});

apiRouter.put('/food/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const foodIndex = db.fishFoodProducts.findIndex((f) => f.id === id);

  if (foodIndex === -1) {
    res.status(404).json({ error: 'Food product not found' });
    return;
  }

  const existing = db.fishFoodProducts[foodIndex];
  const {
    name,
    category,
    brand,
    sizeWeight,
    wholesalePrice,
    sellingPrice,
    currentStock,
    minStockLevel,
    supplier,
    description,
    status,
    priceChangeReason,
  } = req.body;

  const newWp = wholesalePrice != null ? Number(wholesalePrice) : existing.wholesalePrice;
  const newSp = sellingPrice != null ? Number(sellingPrice) : existing.sellingPrice;
  const todayStr = new Date().toISOString().split('T')[0];

  const priceChanged = newWp !== existing.wholesalePrice || newSp !== existing.sellingPrice;
  const margin = round2(newSp - newWp);
  const marginPct = newSp > 0 ? round2((margin / newSp) * 100) : 0;

  if (priceChanged) {
    const phRecord: PriceHistoryRecord = {
      id: `PH-${5000 + db.priceHistory.length + 1}`,
      itemType: 'fish_food',
      itemId: existing.id,
      itemName: name || existing.name,
      previousWholesalePrice: existing.wholesalePrice,
      newWholesalePrice: newWp,
      previousSellingPrice: existing.sellingPrice,
      newSellingPrice: newSp,
      profitMargin: margin,
      profitMarginPct: marginPct,
      changeDate: todayStr,
      reason: priceChangeReason || 'Food price update',
      createdAt: new Date().toISOString(),
    };
    db.priceHistory.push(phRecord);
    await mongoInsertDoc('priceHistory', phRecord);
  }

  const updatedFood: FishFoodProduct = {
    ...existing,
    name: name != null ? name.trim() : existing.name,
    category: category != null ? category.trim() : existing.category,
    brand: brand != null ? brand.trim() : existing.brand,
    sizeWeight: sizeWeight != null ? sizeWeight.trim() : existing.sizeWeight,
    wholesalePrice: newWp,
    sellingPrice: newSp,
    profitMargin: margin,
    profitMarginPct: marginPct,
    currentStock: currentStock != null ? Number(currentStock) : existing.currentStock,
    minStockLevel: minStockLevel != null ? Number(minStockLevel) : existing.minStockLevel,
    supplier: supplier != null ? supplier.trim() : existing.supplier,
    description: description != null ? description.trim() : existing.description,
    status: status || existing.status,
  };

  db.fishFoodProducts[foodIndex] = updatedFood;
  await mongoUpdateDoc('fishFoodProducts', id, updatedFood);
  await saveDatabase(db);
  res.json(updatedFood);
});

apiRouter.delete('/food/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.fishFoodProducts.findIndex((f) => f.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Food product not found' });
    return;
  }

  const removed = db.fishFoodProducts.splice(index, 1)[0];
  await mongoDeleteDoc('fishFoodProducts', id);
  await saveDatabase(db);
  res.json({ success: true, removed });
});

// ----------------------------------------------------
// AQUARIUM ACCESSORIES MANAGEMENT
// ----------------------------------------------------
apiRouter.get('/accessories', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { search, category, brand, status } = req.query;

  let list = db.aquariumAccessories;
  if (status && status !== 'all') {
    list = list.filter((a) => a.status === status);
  }
  if (category && category !== 'all') {
    list = list.filter((a) => a.category === category);
  }
  if (brand && brand !== 'all') {
    list = list.filter((a) => a.brand.toLowerCase() === (brand as string).toLowerCase());
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.brand.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

apiRouter.post('/accessories', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { name, category, brand, sizeModel, wholesalePrice, sellingPrice, currentStock, minStockLevel, supplier, description } =
    req.body;

  if (!name || wholesalePrice == null || sellingPrice == null) {
    res.status(400).json({ error: 'Accessory name, wholesale price, and selling price are required' });
    return;
  }

  const id = `ACC-${300 + db.aquariumAccessories.length + 1}`;
  const wp = Number(wholesalePrice);
  const sp = Number(sellingPrice);
  const margin = round2(sp - wp);
  const marginPct = sp > 0 ? round2((margin / sp) * 100) : 0;
  const todayStr = new Date().toISOString().split('T')[0];

  const newAcc: AquariumAccessory = {
    id,
    name: name.trim(),
    category: (category || 'Filters').trim(),
    brand: (brand || 'Generic').trim(),
    sizeModel: (sizeModel || 'Standard').trim(),
    wholesalePrice: wp,
    sellingPrice: sp,
    profitMargin: margin,
    profitMarginPct: marginPct,
    currentStock: Number(currentStock) || 0,
    minStockLevel: Number(minStockLevel) || 5,
    supplier: (supplier || '').trim(),
    dateAdded: todayStr,
    description: (description || '').trim(),
    status: 'active',
  };

  db.aquariumAccessories.push(newAcc);

  // Price history
  const phRecord: PriceHistoryRecord = {
    id: `PH-${5000 + db.priceHistory.length + 1}`,
    itemType: 'accessory',
    itemId: newAcc.id,
    itemName: newAcc.name,
    previousWholesalePrice: wp,
    newWholesalePrice: wp,
    previousSellingPrice: sp,
    newSellingPrice: sp,
    profitMargin: margin,
    profitMarginPct: marginPct,
    changeDate: todayStr,
    reason: 'Initial accessory addition',
    createdAt: new Date().toISOString(),
  };
  db.priceHistory.push(phRecord);

  await mongoInsertDoc('aquariumAccessories', newAcc);
  await mongoInsertDoc('priceHistory', phRecord);
  await saveDatabase(db);
  res.status(201).json(newAcc);
});

apiRouter.put('/accessories/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const accIndex = db.aquariumAccessories.findIndex((a) => a.id === id);

  if (accIndex === -1) {
    res.status(404).json({ error: 'Accessory not found' });
    return;
  }

  const existing = db.aquariumAccessories[accIndex];
  const {
    name,
    category,
    brand,
    sizeModel,
    wholesalePrice,
    sellingPrice,
    currentStock,
    minStockLevel,
    supplier,
    description,
    status,
    priceChangeReason,
  } = req.body;

  const newWp = wholesalePrice != null ? Number(wholesalePrice) : existing.wholesalePrice;
  const newSp = sellingPrice != null ? Number(sellingPrice) : existing.sellingPrice;
  const todayStr = new Date().toISOString().split('T')[0];

  const priceChanged = newWp !== existing.wholesalePrice || newSp !== existing.sellingPrice;
  const margin = round2(newSp - newWp);
  const marginPct = newSp > 0 ? round2((margin / newSp) * 100) : 0;

  if (priceChanged) {
    const phRecord: PriceHistoryRecord = {
      id: `PH-${5000 + db.priceHistory.length + 1}`,
      itemType: 'accessory',
      itemId: existing.id,
      itemName: name || existing.name,
      previousWholesalePrice: existing.wholesalePrice,
      newWholesalePrice: newWp,
      previousSellingPrice: existing.sellingPrice,
      newSellingPrice: newSp,
      profitMargin: margin,
      profitMarginPct: marginPct,
      changeDate: todayStr,
      reason: priceChangeReason || 'Accessory price update',
      createdAt: new Date().toISOString(),
    };
    db.priceHistory.push(phRecord);
    await mongoInsertDoc('priceHistory', phRecord);
  }

  const updatedAcc: AquariumAccessory = {
    ...existing,
    name: name != null ? name.trim() : existing.name,
    category: category != null ? category.trim() : existing.category,
    brand: brand != null ? brand.trim() : existing.brand,
    sizeModel: sizeModel != null ? sizeModel.trim() : existing.sizeModel,
    wholesalePrice: newWp,
    sellingPrice: newSp,
    profitMargin: margin,
    profitMarginPct: marginPct,
    currentStock: currentStock != null ? Number(currentStock) : existing.currentStock,
    minStockLevel: minStockLevel != null ? Number(minStockLevel) : existing.minStockLevel,
    supplier: supplier != null ? supplier.trim() : existing.supplier,
    description: description != null ? description.trim() : existing.description,
    status: status || existing.status,
  };

  db.aquariumAccessories[accIndex] = updatedAcc;
  await mongoUpdateDoc('aquariumAccessories', id, updatedAcc);
  await saveDatabase(db);
  res.json(updatedAcc);
});

apiRouter.delete('/accessories/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.aquariumAccessories.findIndex((a) => a.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Accessory not found' });
    return;
  }

  const removed = db.aquariumAccessories.splice(index, 1)[0];
  await mongoDeleteDoc('aquariumAccessories', id);
  await saveDatabase(db);
  res.json({ success: true, removed });
});

// ----------------------------------------------------
// DAILY SALES MANAGEMENT (Unified 3 Product Types)
// ----------------------------------------------------
apiRouter.get('/sales', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { dateFrom, dateTo, paymentMethod, itemType, search } = req.query;

  let list = db.sales;

  if (dateFrom && typeof dateFrom === 'string') {
    list = list.filter((s) => s.saleDate >= dateFrom);
  }
  if (dateTo && typeof dateTo === 'string') {
    list = list.filter((s) => s.saleDate <= dateTo);
  }
  if (paymentMethod && paymentMethod !== 'all') {
    list = list.filter((s) => s.paymentMethod === paymentMethod);
  }
  if (itemType && itemType !== 'all') {
    list = list.filter((s) => s.items.some((it) => it.itemType === itemType));
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        s.items.some((it) => it.itemName.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
    );
  }

  // Sort descending by date & created time
  list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(list);
});

apiRouter.post('/sales', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { saleDate, items, paymentMethod, customerName, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'A sale must include at least one item' });
    return;
  }

  const formattedItems = [];
  let totalAmount = 0;
  let totalCost = 0;

  for (const item of items) {
    let qty = Number(item.quantity) || 1;
    const sp = Number(item.sellingPrice) || 0;
    const pc = Number(item.purchaseCost) || 0;
    let itemTotalSale = 0;
    let itemTotalCost = 0;
    let pairsCount: number | undefined;
    let singleCount: number | undefined;
    let singleSellingPrice: number | undefined;
    let singlePurchaseCost: number | undefined;

    if (item.itemType === 'live_fish') {
      const p = Number(item.pairsCount ?? (item.quantity % 1 === 0 ? item.quantity : Math.floor(item.quantity))) || 0;
      const s = Number(item.singleCount ?? (item.quantity % 1 !== 0 ? Math.round((item.quantity - Math.floor(item.quantity)) * 2) : 0)) || 0;
      pairsCount = p;
      singleCount = s;
      qty = round2(p + (s * 0.5));

      const spPair = sp;
      const spSingle = Number(item.singleSellingPrice ?? round2(spPair / 2)) || 0;
      singleSellingPrice = spSingle;

      const pcPair = pc;
      const pcSingle = Number(item.singlePurchaseCost ?? round2(pcPair / 2)) || 0;
      singlePurchaseCost = pcSingle;

      itemTotalSale = round2((p * spPair) + (s * spSingle));
      itemTotalCost = round2((p * pcPair) + (s * pcSingle));
    } else {
      qty = Number(item.quantity) || 1;
      itemTotalSale = round2(qty * sp);
      itemTotalCost = round2(qty * pc);
    }

    const itemProfit = round2(itemTotalSale - itemTotalCost);
    const itemMarginPct = itemTotalSale > 0 ? round2((itemProfit / itemTotalSale) * 100) : 0;

    formattedItems.push({
      itemType: item.itemType,
      itemId: item.itemId,
      itemName: item.itemName,
      category: item.category || 'Standard',
      quantity: qty,
      pairsCount,
      singleCount,
      sellingPrice: sp,
      singleSellingPrice,
      purchaseCost: pc,
      singlePurchaseCost,
      totalSaleAmount: itemTotalSale,
      totalCost: itemTotalCost,
      grossProfit: itemProfit,
      marginPct: itemMarginPct,
    });

    totalAmount += itemTotalSale;
    totalCost += itemTotalCost;

    // Deduct stock from inventory
    adjustProductStock(item.itemType, item.itemId, -qty);
  }

  totalAmount = round2(totalAmount);
  totalCost = round2(totalCost);
  const totalGrossProfit = round2(totalAmount - totalCost);
  const marginPct = totalAmount > 0 ? round2((totalGrossProfit / totalAmount) * 100) : 0;

  const newSale: Sale = {
    id: `SALE-${1000 + db.sales.length + 1}`,
    saleDate: saleDate || new Date().toISOString().split('T')[0],
    items: formattedItems,
    totalAmount,
    totalCost,
    totalGrossProfit,
    marginPct,
    paymentMethod: paymentMethod || 'Cash',
    customerName: customerName ? customerName.trim() : '',
    notes: notes ? notes.trim() : '',
    createdAt: new Date().toISOString(),
  };

  db.sales.push(newSale);
  await mongoInsertDoc('sales', newSale);

  for (const it of formattedItems) {
    if (it.itemType === 'live_fish') {
      const p = db.fishVarieties.find((f) => f.id === it.itemId);
      if (p) await mongoUpdateDoc('fishVarieties', p.id, p);
    } else if (it.itemType === 'fish_food') {
      const p = db.fishFoodProducts.find((f) => f.id === it.itemId);
      if (p) await mongoUpdateDoc('fishFoodProducts', p.id, p);
    } else if (it.itemType === 'accessory') {
      const p = db.aquariumAccessories.find((f) => f.id === it.itemId);
      if (p) await mongoUpdateDoc('aquariumAccessories', p.id, p);
    }
  }

  await saveDatabase(db);
  res.status(201).json(newSale);
});

apiRouter.put('/sales/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const saleIndex = db.sales.findIndex((s) => s.id === id);

  if (saleIndex === -1) {
    res.status(404).json({ error: 'Sale record not found' });
    return;
  }

  const existingSale = db.sales[saleIndex];
  const { saleDate, items, paymentMethod, customerName, notes } = req.body;

  // Restore old items stock first
  existingSale.items.forEach((item) => {
    adjustProductStock(item.itemType, item.itemId, item.quantity);
  });

  const formattedItems = [];
  let totalAmount = 0;
  let totalCost = 0;

  for (const item of items) {
    let qty = Number(item.quantity) || 1;
    const sp = Number(item.sellingPrice) || 0;
    const pc = Number(item.purchaseCost) || 0;
    let itemTotalSale = 0;
    let itemTotalCost = 0;
    let pairsCount: number | undefined;
    let singleCount: number | undefined;
    let singleSellingPrice: number | undefined;
    let singlePurchaseCost: number | undefined;

    if (item.itemType === 'live_fish') {
      const p = Number(item.pairsCount ?? (item.quantity % 1 === 0 ? item.quantity : Math.floor(item.quantity))) || 0;
      const s = Number(item.singleCount ?? (item.quantity % 1 !== 0 ? Math.round((item.quantity - Math.floor(item.quantity)) * 2) : 0)) || 0;
      pairsCount = p;
      singleCount = s;
      qty = round2(p + (s * 0.5));

      const spPair = sp;
      const spSingle = Number(item.singleSellingPrice ?? round2(spPair / 2)) || 0;
      singleSellingPrice = spSingle;

      const pcPair = pc;
      const pcSingle = Number(item.singlePurchaseCost ?? round2(pcPair / 2)) || 0;
      singlePurchaseCost = pcSingle;

      itemTotalSale = round2((p * spPair) + (s * spSingle));
      itemTotalCost = round2((p * pcPair) + (s * pcSingle));
    } else {
      qty = Number(item.quantity) || 1;
      itemTotalSale = round2(qty * sp);
      itemTotalCost = round2(qty * pc);
    }

    const itemProfit = round2(itemTotalSale - itemTotalCost);
    const itemMarginPct = itemTotalSale > 0 ? round2((itemProfit / itemTotalSale) * 100) : 0;

    formattedItems.push({
      itemType: item.itemType,
      itemId: item.itemId,
      itemName: item.itemName,
      category: item.category || 'Standard',
      quantity: qty,
      pairsCount,
      singleCount,
      sellingPrice: sp,
      singleSellingPrice,
      purchaseCost: pc,
      singlePurchaseCost,
      totalSaleAmount: itemTotalSale,
      totalCost: itemTotalCost,
      grossProfit: itemProfit,
      marginPct: itemMarginPct,
    });

    totalAmount += itemTotalSale;
    totalCost += itemTotalCost;

    // Deduct new items stock
    adjustProductStock(item.itemType, item.itemId, -qty);
  }

  totalAmount = round2(totalAmount);
  totalCost = round2(totalCost);
  const totalGrossProfit = round2(totalAmount - totalCost);
  const marginPct = totalAmount > 0 ? round2((totalGrossProfit / totalAmount) * 100) : 0;

  const updatedSale: Sale = {
    ...existingSale,
    saleDate: saleDate || existingSale.saleDate,
    items: formattedItems,
    totalAmount,
    totalCost,
    totalGrossProfit,
    marginPct,
    paymentMethod: paymentMethod || existingSale.paymentMethod,
    customerName: customerName != null ? customerName.trim() : existingSale.customerName,
    notes: notes != null ? notes.trim() : existingSale.notes,
  };

  db.sales[saleIndex] = updatedSale;
  await mongoUpdateDoc('sales', id, updatedSale);
  await saveDatabase(db);
  res.json(updatedSale);
});

apiRouter.delete('/sales/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.sales.findIndex((s) => s.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Sale record not found' });
    return;
  }

  const removedSale = db.sales[index];
  // Revert stock adjustments
  removedSale.items.forEach((item) => {
    adjustProductStock(item.itemType, item.itemId, item.quantity);
  });

  db.sales.splice(index, 1);
  await mongoDeleteDoc('sales', id);
  await saveDatabase(db);
  res.json({ success: true, message: 'Sale deleted and stock restored', removedSale });
});

// ----------------------------------------------------
// PURCHASES & WHOLESALE STOCK INTAKE
// ----------------------------------------------------
apiRouter.get('/purchases', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { itemType, supplier, search } = req.query;

  let list = db.purchases;
  if (itemType && itemType !== 'all') {
    list = list.filter((p) => p.itemType === itemType);
  }
  if (supplier && supplier !== 'all') {
    list = list.filter((p) => p.supplier.toLowerCase().includes((supplier as string).toLowerCase()));
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((p) => p.itemName.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }

  list = [...list].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  res.json(list);
});

apiRouter.post('/purchases', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { purchaseDate, itemType, itemId, itemName, supplier, quantity, purchasePrice, updateCatalogPrice, notes } =
    req.body;

  if (!itemId || !quantity || purchasePrice == null) {
    res.status(400).json({ error: 'Item ID, quantity, and purchase price are required' });
    return;
  }

  const qty = Number(quantity);
  const pp = Number(purchasePrice);
  const totalCost = round2(qty * pp);
  const todayStr = new Date().toISOString().split('T')[0];

  const newPurchase: Purchase = {
    id: `PUR-${2000 + db.purchases.length + 1}`,
    purchaseDate: purchaseDate || todayStr,
    itemType: itemType || 'live_fish',
    itemId,
    itemName: itemName || 'Unknown Item',
    supplier: supplier ? supplier.trim() : 'Wholesale Supplier',
    quantity: qty,
    purchasePrice: pp,
    totalCost,
    updateCatalogPrice: Boolean(updateCatalogPrice),
    notes: notes ? notes.trim() : '',
    createdAt: new Date().toISOString(),
  };

  // Increase stock
  adjustProductStock(newPurchase.itemType, itemId, qty);

  // If updateCatalogPrice is true, update the product's wholesale cost & record in price history
  if (newPurchase.updateCatalogPrice) {
    if (newPurchase.itemType === 'live_fish') {
      const fish = db.fishVarieties.find((f) => f.id === itemId);
      if (fish && fish.wholesalePrice !== pp) {
        const prevWp = fish.wholesalePrice;
        fish.wholesalePrice = pp;
        fish.profitMargin = round2(fish.sellingPrice - pp);
        fish.profitMarginPct = fish.sellingPrice > 0 ? round2((fish.profitMargin / fish.sellingPrice) * 100) : 0;
        db.priceHistory.push({
          id: `PH-${5000 + db.priceHistory.length + 1}`,
          itemType: 'live_fish',
          itemId: fish.id,
          itemName: fish.name,
          previousWholesalePrice: prevWp,
          newWholesalePrice: pp,
          previousSellingPrice: fish.sellingPrice,
          newSellingPrice: fish.sellingPrice,
          profitMargin: fish.profitMargin,
          profitMarginPct: fish.profitMarginPct,
          changeDate: newPurchase.purchaseDate,
          reason: `Wholesale purchase from ${newPurchase.supplier}`,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (newPurchase.itemType === 'fish_food') {
      const food = db.fishFoodProducts.find((f) => f.id === itemId);
      if (food && food.wholesalePrice !== pp) {
        const prevWp = food.wholesalePrice;
        food.wholesalePrice = pp;
        food.profitMargin = round2(food.sellingPrice - pp);
        food.profitMarginPct = food.sellingPrice > 0 ? round2((food.profitMargin / food.sellingPrice) * 100) : 0;
        db.priceHistory.push({
          id: `PH-${5000 + db.priceHistory.length + 1}`,
          itemType: 'fish_food',
          itemId: food.id,
          itemName: food.name,
          previousWholesalePrice: prevWp,
          newWholesalePrice: pp,
          previousSellingPrice: food.sellingPrice,
          newSellingPrice: food.sellingPrice,
          profitMargin: food.profitMargin,
          profitMarginPct: food.profitMarginPct,
          changeDate: newPurchase.purchaseDate,
          reason: `Wholesale purchase from ${newPurchase.supplier}`,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (newPurchase.itemType === 'accessory') {
      const acc = db.aquariumAccessories.find((a) => a.id === itemId);
      if (acc && acc.wholesalePrice !== pp) {
        const prevWp = acc.wholesalePrice;
        acc.wholesalePrice = pp;
        acc.profitMargin = round2(acc.sellingPrice - pp);
        acc.profitMarginPct = acc.sellingPrice > 0 ? round2((acc.profitMargin / acc.sellingPrice) * 100) : 0;
        db.priceHistory.push({
          id: `PH-${5000 + db.priceHistory.length + 1}`,
          itemType: 'accessory',
          itemId: acc.id,
          itemName: acc.name,
          previousWholesalePrice: prevWp,
          newWholesalePrice: pp,
          previousSellingPrice: acc.sellingPrice,
          newSellingPrice: acc.sellingPrice,
          profitMargin: acc.profitMargin,
          profitMarginPct: acc.profitMarginPct,
          changeDate: newPurchase.purchaseDate,
          reason: `Wholesale purchase from ${newPurchase.supplier}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  db.purchases.push(newPurchase);
  await mongoInsertDoc('purchases', newPurchase);

  // Also update modified stock and price history in related collections
  if (newPurchase.itemType === 'live_fish') {
    const f = db.fishVarieties.find((item) => item.id === itemId);
    if (f) await mongoUpdateDoc('fishVarieties', f.id, f);
  } else if (newPurchase.itemType === 'fish_food') {
    const f = db.fishFoodProducts.find((item) => item.id === itemId);
    if (f) await mongoUpdateDoc('fishFoodProducts', f.id, f);
  } else if (newPurchase.itemType === 'accessory') {
    const a = db.aquariumAccessories.find((item) => item.id === itemId);
    if (a) await mongoUpdateDoc('aquariumAccessories', a.id, a);
  }

  await saveDatabase(db);
  res.status(201).json(newPurchase);
});

apiRouter.delete('/purchases/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.purchases.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Purchase record not found' });
    return;
  }

  const purchase = db.purchases[index];
  // Revert stock addition
  adjustProductStock(purchase.itemType, purchase.itemId, -purchase.quantity);

  db.purchases.splice(index, 1);
  await mongoDeleteDoc('purchases', id);
  await saveDatabase(db);
  res.json({ success: true, message: 'Purchase deleted and stock adjusted' });
});

// ----------------------------------------------------
// EXPENSES & ADDITIONAL INCOME
// ----------------------------------------------------
apiRouter.get('/expenses', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { dateFrom, dateTo, category } = req.query;

  let list = db.expenses;
  if (dateFrom && typeof dateFrom === 'string') {
    list = list.filter((e) => e.date >= dateFrom);
  }
  if (dateTo && typeof dateTo === 'string') {
    list = list.filter((e) => e.date <= dateTo);
  }
  if (category && category !== 'all') {
    list = list.filter((e) => e.category === category);
  }

  list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(list);
});

apiRouter.post('/expenses', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { date, category, description, amount, paymentMethod, notes } = req.body;

  if (!category || amount == null) {
    res.status(400).json({ error: 'Category and amount are required' });
    return;
  }

  const newExpense: Expense = {
    id: `EXP-${3000 + db.expenses.length + 1}`,
    date: date || new Date().toISOString().split('T')[0],
    category: category.trim(),
    description: (description || '').trim(),
    amount: round2(Number(amount)),
    paymentMethod: paymentMethod || 'Cash',
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString(),
  };

  db.expenses.push(newExpense);
  await mongoInsertDoc('expenses', newExpense);
  await saveDatabase(db);
  res.status(201).json(newExpense);
});

apiRouter.put('/expenses/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const idx = db.expenses.findIndex((e) => e.id === id);

  if (idx === -1) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  const existing = db.expenses[idx];
  const { date, category, description, amount, paymentMethod, notes } = req.body;

  const updated: Expense = {
    ...existing,
    date: date || existing.date,
    category: category ? category.trim() : existing.category,
    description: description != null ? description.trim() : existing.description,
    amount: amount != null ? round2(Number(amount)) : existing.amount,
    paymentMethod: paymentMethod || existing.paymentMethod,
    notes: notes != null ? notes.trim() : existing.notes,
  };

  db.expenses[idx] = updated;
  await mongoUpdateDoc('expenses', id, updated);
  await saveDatabase(db);
  res.json(updated);
});

apiRouter.delete('/expenses/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const idx = db.expenses.findIndex((e) => e.id === id);

  if (idx === -1) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  db.expenses.splice(idx, 1);
  await mongoDeleteDoc('expenses', id);
  await saveDatabase(db);
  res.json({ success: true, message: 'Expense deleted' });
});

apiRouter.get('/income', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { dateFrom, dateTo } = req.query;

  let list = db.additionalIncome;
  if (dateFrom && typeof dateFrom === 'string') {
    list = list.filter((i) => i.date >= dateFrom);
  }
  if (dateTo && typeof dateTo === 'string') {
    list = list.filter((i) => i.date <= dateTo);
  }

  list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(list);
});

apiRouter.post('/income', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { date, category, amount, notes } = req.body;

  if (!category || amount == null) {
    res.status(400).json({ error: 'Category and amount are required' });
    return;
  }

  const newIncome: AdditionalIncome = {
    id: `INC-${4000 + db.additionalIncome.length + 1}`,
    date: date || new Date().toISOString().split('T')[0],
    category: category.trim(),
    amount: round2(Number(amount)),
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString(),
  };

  db.additionalIncome.push(newIncome);
  await mongoInsertDoc('additionalIncome', newIncome);
  await saveDatabase(db);
  res.status(201).json(newIncome);
});

apiRouter.delete('/income/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const idx = db.additionalIncome.findIndex((i) => i.id === id);

  if (idx === -1) {
    res.status(404).json({ error: 'Income record not found' });
    return;
  }

  db.additionalIncome.splice(idx, 1);
  await mongoDeleteDoc('additionalIncome', id);
  await saveDatabase(db);
  res.json({ success: true, message: 'Additional income record deleted' });
});

// ----------------------------------------------------
// PRICE & PROFIT MARGIN HISTORY
// ----------------------------------------------------
apiRouter.get('/price-history', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { itemId, itemType, dateFrom, dateTo } = req.query;

  let list = db.priceHistory;
  if (itemId && itemId !== 'all') {
    list = list.filter((p) => p.itemId === itemId);
  }
  if (itemType && itemType !== 'all') {
    list = list.filter((p) => p.itemType === itemType);
  }
  if (dateFrom && typeof dateFrom === 'string') {
    list = list.filter((p) => p.changeDate >= dateFrom);
  }
  if (dateTo && typeof dateTo === 'string') {
    list = list.filter((p) => p.changeDate <= dateTo);
  }

  // Calculate highest & lowest wholesale & selling prices for the filtered subset
  const sellingPrices = list.map((p) => p.newSellingPrice).filter((p) => p > 0);
  const wholesalePrices = list.map((p) => p.newWholesalePrice).filter((p) => p > 0);

  const highestSelling = sellingPrices.length ? Math.max(...sellingPrices) : 0;
  const lowestSelling = sellingPrices.length ? Math.min(...sellingPrices) : 0;
  const highestWholesale = wholesalePrices.length ? Math.max(...wholesalePrices) : 0;
  const lowestWholesale = wholesalePrices.length ? Math.min(...wholesalePrices) : 0;

  list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    history: list,
    stats: {
      highestSelling,
      lowestSelling,
      highestWholesale,
      lowestWholesale,
      totalChanges: list.length,
    },
  });
});

// ----------------------------------------------------
// INVENTORY ADJUSTMENTS
// ----------------------------------------------------
apiRouter.get('/adjustments', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const list = [...db.inventoryAdjustments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  res.json(list);
});

apiRouter.post('/adjustments', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { date, itemType, itemId, itemName, adjustmentType, quantityChange, notes } = req.body;

  if (!itemId || quantityChange == null || !adjustmentType) {
    res.status(400).json({ error: 'Item ID, adjustment type, and quantity change are required' });
    return;
  }

  const delta = Number(quantityChange);
  let previousStock = 0;
  let newStock = 0;

  if (itemType === 'live_fish') {
    const item = db.fishVarieties.find((f) => f.id === itemId);
    if (item) {
      previousStock = item.currentStock;
      item.currentStock = Math.max(0, item.currentStock + delta);
      newStock = item.currentStock;
      await mongoUpdateDoc('fishVarieties', item.id, item);
    }
  } else if (itemType === 'fish_food') {
    const item = db.fishFoodProducts.find((f) => f.id === itemId);
    if (item) {
      previousStock = item.currentStock;
      item.currentStock = Math.max(0, item.currentStock + delta);
      newStock = item.currentStock;
      await mongoUpdateDoc('fishFoodProducts', item.id, item);
    }
  } else if (itemType === 'accessory') {
    const item = db.aquariumAccessories.find((a) => a.id === itemId);
    if (item) {
      previousStock = item.currentStock;
      item.currentStock = Math.max(0, item.currentStock + delta);
      newStock = item.currentStock;
      await mongoUpdateDoc('aquariumAccessories', item.id, item);
    }
  }

  const newAdj: InventoryAdjustment = {
    id: `ADJ-${6000 + db.inventoryAdjustments.length + 1}`,
    date: date || new Date().toISOString().split('T')[0],
    itemType: itemType || 'live_fish',
    itemId,
    itemName: itemName || 'Unknown Item',
    adjustmentType,
    quantityChange: delta,
    previousStock,
    newStock,
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString(),
  };

  db.inventoryAdjustments.push(newAdj);
  await mongoInsertDoc('inventoryAdjustments', newAdj);
  await saveDatabase(db);
  res.status(201).json(newAdj);
});

// ----------------------------------------------------
// AUTOMATIC MONTHLY FINANCIAL REPORTS
// ----------------------------------------------------
apiRouter.get('/reports/monthly', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { year, month } = req.query;

  const now = new Date();
  const y = year ? Number(year) : now.getFullYear();
  const m = month ? Number(month) : now.getMonth() + 1;

  const monthStr = String(m).padStart(2, '0');
  const monthKey = `${y}-${monthStr}`;

  // Calculate previous month key for comparison
  const prevDate = new Date(y, m - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonthStr = String(prevDate.getMonth() + 1).padStart(2, '0');
  const prevMonthKey = `${prevYear}-${prevMonthStr}`;

  // Current Month Data
  const monthlySales = db.sales.filter((s) => s.saleDate.startsWith(monthKey));
  const monthlyPurchases = db.purchases.filter((p) => p.purchaseDate.startsWith(monthKey));
  const monthlyExpenses = db.expenses.filter((e) => e.date.startsWith(monthKey));
  const monthlyIncome = db.additionalIncome.filter((i) => i.date.startsWith(monthKey));

  const salesRevenue = round2(monthlySales.reduce((a, b) => a + b.totalAmount, 0));
  const additionalIncome = round2(monthlyIncome.reduce((a, b) => a + b.amount, 0));
  const totalRevenue = round2(salesRevenue + additionalIncome);

  const costOfGoodsSold = round2(monthlySales.reduce((a, b) => a + b.totalCost, 0));
  const grossProfit = round2(salesRevenue - costOfGoodsSold);

  const totalOperatingExpenses = round2(monthlyExpenses.reduce((a, b) => a + b.amount, 0));
  const netProfit = round2(grossProfit + additionalIncome - totalOperatingExpenses);

  const totalWholesalePurchases = round2(monthlyPurchases.reduce((a, b) => a + b.totalCost, 0));
  const grossProfitMarginPct = salesRevenue > 0 ? round2((grossProfit / salesRevenue) * 100) : 0;
  const netProfitMarginPct = totalRevenue > 0 ? round2((netProfit / totalRevenue) * 100) : 0;

  // Items sold counts
  let fishSold = 0;
  let fishPairsSold = 0;
  let fishSinglesSold = 0;
  let totalFishCountSold = 0;
  let foodSold = 0;
  let accessoriesSold = 0;
  const salesByItemMap: Record<
    string,
    { id: string; name: string; type: string; quantity: number; pairsCount?: number; singleCount?: number; revenue: number; profit: number }
  > = {};

  monthlySales.forEach((sale) => {
    sale.items.forEach((it) => {
      if (it.itemType === 'live_fish') {
        const p = Number(it.pairsCount ?? (it.quantity % 1 === 0 ? it.quantity : Math.floor(it.quantity))) || 0;
        const s = Number(it.singleCount ?? (it.quantity % 1 !== 0 ? Math.round((it.quantity - Math.floor(it.quantity)) * 2) : 0)) || 0;
        fishPairsSold += p;
        fishSinglesSold += s;
        totalFishCountSold += (p * 2) + s;
        fishSold += round2(p + (s * 0.5));
      }
      if (it.itemType === 'fish_food') foodSold += it.quantity;
      if (it.itemType === 'accessory') accessoriesSold += it.quantity;

      if (!salesByItemMap[it.itemId]) {
        salesByItemMap[it.itemId] = {
          id: it.itemId,
          name: it.itemName,
          type: it.itemType,
          quantity: 0,
          pairsCount: 0,
          singleCount: 0,
          revenue: 0,
          profit: 0,
        };
      }
      salesByItemMap[it.itemId].quantity = round2(salesByItemMap[it.itemId].quantity + it.quantity);
      if (it.itemType === 'live_fish') {
        const p = Number(it.pairsCount ?? (it.quantity % 1 === 0 ? it.quantity : Math.floor(it.quantity))) || 0;
        const s = Number(it.singleCount ?? (it.quantity % 1 !== 0 ? Math.round((it.quantity - Math.floor(it.quantity)) * 2) : 0)) || 0;
        salesByItemMap[it.itemId].pairsCount = (salesByItemMap[it.itemId].pairsCount || 0) + p;
        salesByItemMap[it.itemId].singleCount = (salesByItemMap[it.itemId].singleCount || 0) + s;
      }
      salesByItemMap[it.itemId].revenue = round2(salesByItemMap[it.itemId].revenue + it.totalSaleAmount);
      salesByItemMap[it.itemId].profit = round2(salesByItemMap[it.itemId].profit + it.grossProfit);
    });
  });

  const bestSellingProducts = Object.values(salesByItemMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  // Previous Month Data for Comparisons
  const prevSales = db.sales.filter((s) => s.saleDate.startsWith(prevMonthKey));
  const prevIncome = db.additionalIncome.filter((i) => i.date.startsWith(prevMonthKey));
  const prevExp = db.expenses.filter((e) => e.date.startsWith(prevMonthKey));

  const prevSalesRev = round2(prevSales.reduce((a, b) => a + b.totalAmount, 0));
  const prevAddInc = round2(prevIncome.reduce((a, b) => a + b.amount, 0));
  const prevTotalRev = round2(prevSalesRev + prevAddInc);
  const prevCogs = round2(prevSales.reduce((a, b) => a + b.totalCost, 0));
  const prevGross = round2(prevSalesRev - prevCogs);
  const prevTotalExp = round2(prevExp.reduce((a, b) => a + b.amount, 0));
  const prevNet = round2(prevGross + prevAddInc - prevTotalExp);

  // Growth percentages
  const revGrowth = prevTotalRev > 0 ? round2(((totalRevenue - prevTotalRev) / prevTotalRev) * 100) : 0;
  const netGrowth = prevNet !== 0 ? round2(((netProfit - prevNet) / Math.abs(prevNet)) * 100) : 0;

  // Daily breakdown for the selected month
  const daysInMonth = new Date(y, m, 0).getDate();
  const dailyBreakdown: { day: number; date: string; revenue: number; grossProfit: number; expenses: number; netProfit: number }[] =
    [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${monthKey}-${String(d).padStart(2, '0')}`;
    const dSales = monthlySales.filter((s) => s.saleDate === dayStr);
    const dInc = monthlyIncome.filter((i) => i.date === dayStr).reduce((a, b) => a + b.amount, 0);
    const dExp = monthlyExpenses.filter((e) => e.date === dayStr).reduce((a, b) => a + b.amount, 0);

    const dRev = dSales.reduce((a, b) => a + b.totalAmount, 0) + dInc;
    const dCogs = dSales.reduce((a, b) => a + b.totalCost, 0);
    const dGross = dRev - dCogs;
    const dNet = dGross - dExp;

    dailyBreakdown.push({
      day: d,
      date: dayStr,
      revenue: round2(dRev),
      grossProfit: round2(dGross),
      expenses: round2(dExp),
      netProfit: round2(dNet),
    });
  }

  // Expenses by Category
  const expenseByCategory: Record<string, number> = {};
  monthlyExpenses.forEach((e) => {
    expenseByCategory[e.category] = round2((expenseByCategory[e.category] || 0) + e.amount);
  });

  res.json({
    period: {
      year: y,
      month: m,
      monthKey,
      monthName: new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    },
    metrics: {
      totalRevenue,
      salesRevenue,
      additionalIncome,
      costOfGoodsSold,
      grossProfit,
      totalOperatingExpenses,
      netProfit,
      totalWholesalePurchases,
      grossProfitMarginPct,
      netProfitMarginPct,
      fishSold: round2(fishSold),
      fishPairsSold,
      fishSinglesSold,
      totalFishCountSold,
      foodSold,
      accessoriesSold,
      totalItemsSold: round2(fishSold) + foodSold + accessoriesSold,
    },
    comparisonWithPrevious: {
      previousMonthKey: prevMonthKey,
      previousRevenue: prevTotalRev,
      previousNetProfit: prevNet,
      revenueGrowthPct: revGrowth,
      netProfitGrowthPct: netGrowth,
    },
    bestSellingProducts,
    expenseBreakdown: expenseByCategory,
    dailyBreakdown,
  });
});

// ----------------------------------------------------
// COMPLETE TRANSACTION HISTORY (Unified Timeline)
// ----------------------------------------------------
apiRouter.get('/transactions', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const { type, search, dateFrom, dateTo } = req.query;

  interface TransactionItem {
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

  const transactions: TransactionItem[] = [];

  const userCurrency = db.users[0]?.currencySymbol || 'LKR';

  // 1. Sales
  db.sales.forEach((s) => {
    transactions.push({
      id: s.id,
      type: 'sale',
      date: s.saleDate,
      title: `Sale #${s.id}`,
      description: `${s.items.length} items (${s.items
        .map((i) => {
          if (i.itemType === 'live_fish') {
            const p = i.pairsCount ?? (i.quantity % 1 === 0 ? i.quantity : Math.floor(i.quantity));
            const s = i.singleCount ?? (i.quantity % 1 !== 0 ? Math.round((i.quantity - p) * 2) : 0);
            const total = (p * 2) + s;
            if (p > 0 && s > 0) return `${p} ${p === 1 ? 'pair' : 'pairs'} + ${s} single (${total} fish) ${i.itemName}`;
            if (p > 0) return `${p} ${p === 1 ? 'pair' : 'pairs'} (${total} fish) ${i.itemName}`;
            return `${s} single fish ${i.itemName}`;
          }
          return `${i.quantity} units ${i.itemName}`;
        })
        .join(', ')})`,
      amount: s.totalAmount,
      financialImpact: 'positive',
      category: s.paymentMethod,
      raw: s,
      createdAt: s.createdAt,
    });
  });

  // 2. Purchases
  db.purchases.forEach((p) => {
    const isFish = p.itemType === 'live_fish';
    const qtyUnit = isFish ? (p.quantity === 1 ? 'pair' : 'pairs') : 'units';
    const rateUnit = isFish ? '/pair' : '/unit';
    transactions.push({
      id: p.id,
      type: 'purchase',
      date: p.purchaseDate,
      title: `Purchase: ${p.itemName}`,
      description: `Stock intake: ${p.quantity} ${qtyUnit} @ ${userCurrency} ${p.purchasePrice}${rateUnit} from ${p.supplier}`,
      amount: p.totalCost,
      financialImpact: 'negative',
      category: p.itemType,
      raw: p,
      createdAt: p.createdAt,
    });
  });

  // 3. Expenses
  db.expenses.forEach((e) => {
    transactions.push({
      id: e.id,
      type: 'expense',
      date: e.date,
      title: `Expense: ${e.category}`,
      description: e.description || e.notes || 'Operating expense',
      amount: e.amount,
      financialImpact: 'negative',
      category: e.category,
      raw: e,
      createdAt: e.createdAt,
    });
  });

  // 4. Additional Income
  db.additionalIncome.forEach((i) => {
    transactions.push({
      id: i.id,
      type: 'income',
      date: i.date,
      title: `Income: ${i.category}`,
      description: i.notes || 'Additional business income',
      amount: i.amount,
      financialImpact: 'positive',
      category: i.category,
      raw: i,
      createdAt: i.createdAt,
    });
  });

  // 5. Adjustments
  db.inventoryAdjustments.forEach((a) => {
    const isFish = a.itemType === 'live_fish';
    const unitLabel = isFish ? 'pairs' : 'units';
    transactions.push({
      id: a.id,
      type: 'adjustment',
      date: a.date,
      title: `Stock Adjustment: ${a.itemName}`,
      description: `${a.adjustmentType} (${a.quantityChange > 0 ? '+' : ''}${a.quantityChange} ${unitLabel}). Stock: ${a.previousStock} → ${a.newStock} ${unitLabel}`,
      amount: undefined,
      financialImpact: 'neutral',
      category: a.adjustmentType,
      raw: a,
      createdAt: a.createdAt,
    });
  });

  // 6. Price Changes
  db.priceHistory.forEach((ph) => {
    transactions.push({
      id: ph.id,
      type: 'price_change',
      date: ph.changeDate,
      title: `Price Change: ${ph.itemName}`,
      description: `Wholesale: ${userCurrency} ${ph.previousWholesalePrice} → ${userCurrency} ${ph.newWholesalePrice} | Retail: ${userCurrency} ${ph.previousSellingPrice} → ${userCurrency} ${ph.newSellingPrice} (${ph.profitMarginPct}% margin)`,
      amount: undefined,
      financialImpact: 'neutral',
      category: ph.reason || 'Price adjustment',
      raw: ph,
      createdAt: ph.createdAt,
    });
  });

  let filtered = transactions;
  if (type && type !== 'all') {
    filtered = filtered.filter((t) => t.type === type);
  }
  if (dateFrom && typeof dateFrom === 'string') {
    filtered = filtered.filter((t) => t.date >= dateFrom);
  }
  if (dateTo && typeof dateTo === 'string') {
    filtered = filtered.filter((t) => t.date <= dateTo);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q))
    );
  }

  // Sort descending by date & creation
  filtered.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

  res.json(filtered);
});

// ----------------------------------------------------
// BACKUP, EXPORT & RESTORE
// ----------------------------------------------------
apiRouter.get('/backup/export', authMiddleware, (_req: AuthRequest, res: Response) => {
  const db = getDatabase();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=bluewave_aquarium_backup_${Date.now()}.json`);
  res.send(JSON.stringify(db, null, 2));
});

apiRouter.post('/backup/import', authMiddleware, async (req: AuthRequest, res: Response) => {
  const importedData = req.body;
  if (!importedData || !Array.isArray(importedData.fishVarieties) || !Array.isArray(importedData.sales)) {
    res.status(400).json({ error: 'Invalid backup format. Must contain fishVarieties and sales collections.' });
    return;
  }

  await saveDatabase(importedData);
  res.json({ success: true, message: 'Database imported and restored successfully!' });
});

apiRouter.post('/backup/reset', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const freshDb = await clearAllRecords();
  res.json({ success: true, message: 'All demo data cleared. Ready for live records.', freshDb });
});

// ----------------------------------------------------
// MONGODB ATLAS STATUS & SYNC
// ----------------------------------------------------
apiRouter.get('/mongodb/status', authMiddleware, (_req: AuthRequest, res: Response) => {
  res.json(getMongoStatus());
});

apiRouter.post('/mongodb/sync', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const success = await syncToMongoDB(db);
  res.json({ success, status: getMongoStatus(), message: success ? 'Synchronized with MongoDB Atlas' : 'Sync error' });
});

apiRouter.post('/mongodb/clear', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const freshDb = await clearAllRecords();
  res.json({ success: true, message: 'All inventory and transaction records cleared from MongoDB Atlas and local storage.', freshDb });
});
