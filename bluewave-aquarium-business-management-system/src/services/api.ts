import {
  UserProfile,
  FishVariety,
  FishFoodProduct,
  AquariumAccessory,
  Sale,
  Purchase,
  Expense,
  AdditionalIncome,
  PriceHistoryRecord,
  InventoryAdjustment,
  DashboardStats,
  MonthlyReportData,
  TransactionRecord,
} from '../types';

const TOKEN_KEY = 'bluewave_jwt_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      // Only redirect if not already on login or auth endpoints
      if (!endpoint.startsWith('/auth/login')) {
        window.dispatchEvent(new CustomEvent('bluewave_auth_expired'));
      }
    }

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch {
        errorMsg = `Server error (${response.status})`;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  // Auth
  login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser(): Promise<{ user: UserProfile }> {
    return this.request('/auth/me');
  },

  updateProfile(data: Partial<UserProfile>): Promise<{ success: boolean; user: UserProfile }> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Dashboard
  getDashboardStats(): Promise<DashboardStats> {
    return this.request('/dashboard/stats');
  },

  // Fish Varieties
  getFish(params?: { search?: string; category?: string; status?: string }): Promise<FishVariety[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/fish${query ? `?${query}` : ''}`);
  },

  createFish(data: Partial<FishVariety>): Promise<FishVariety> {
    return this.request('/fish', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateFish(id: string, data: Partial<FishVariety> & { priceChangeReason?: string }): Promise<FishVariety> {
    return this.request(`/fish/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteFish(id: string): Promise<{ success: boolean; removed: FishVariety }> {
    return this.request(`/fish/${id}`, {
      method: 'DELETE',
    });
  },

  // Fish Food Products
  getFishFood(params?: { search?: string; category?: string; brand?: string; status?: string }): Promise<FishFoodProduct[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/food${query ? `?${query}` : ''}`);
  },

  createFishFood(data: Partial<FishFoodProduct>): Promise<FishFoodProduct> {
    return this.request('/food', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateFishFood(id: string, data: Partial<FishFoodProduct> & { priceChangeReason?: string }): Promise<FishFoodProduct> {
    return this.request(`/food/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteFishFood(id: string): Promise<{ success: boolean; removed: FishFoodProduct }> {
    return this.request(`/food/${id}`, {
      method: 'DELETE',
    });
  },

  // Aquarium Accessories
  getAccessories(params?: { search?: string; category?: string; brand?: string; status?: string }): Promise<AquariumAccessory[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/accessories${query ? `?${query}` : ''}`);
  },

  createAccessory(data: Partial<AquariumAccessory>): Promise<AquariumAccessory> {
    return this.request('/accessories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAccessory(id: string, data: Partial<AquariumAccessory> & { priceChangeReason?: string }): Promise<AquariumAccessory> {
    return this.request(`/accessories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAccessory(id: string): Promise<{ success: boolean; removed: AquariumAccessory }> {
    return this.request(`/accessories/${id}`, {
      method: 'DELETE',
    });
  },

  // Sales
  getSales(params?: { dateFrom?: string; dateTo?: string; paymentMethod?: string; itemType?: string; search?: string }): Promise<Sale[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/sales${query ? `?${query}` : ''}`);
  },

  createSale(data: {
    saleDate: string;
    items: any[];
    paymentMethod: string;
    customerName?: string;
    notes?: string;
  }): Promise<Sale> {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSale(id: string, data: any): Promise<Sale> {
    return this.request(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSale(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/sales/${id}`, {
      method: 'DELETE',
    });
  },

  // Purchases
  getPurchases(params?: { itemType?: string; supplier?: string; search?: string }): Promise<Purchase[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/purchases${query ? `?${query}` : ''}`);
  },

  createPurchase(data: Partial<Purchase>): Promise<Purchase> {
    return this.request('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deletePurchase(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/purchases/${id}`, {
      method: 'DELETE',
    });
  },

  // Expenses & Income
  getExpenses(params?: { dateFrom?: string; dateTo?: string; category?: string }): Promise<Expense[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/expenses${query ? `?${query}` : ''}`);
  },

  createExpense(data: Partial<Expense>): Promise<Expense> {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteExpense(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  getIncome(params?: { dateFrom?: string; dateTo?: string }): Promise<AdditionalIncome[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/income${query ? `?${query}` : ''}`);
  },

  createIncome(data: Partial<AdditionalIncome>): Promise<AdditionalIncome> {
    return this.request('/income', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteIncome(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/income/${id}`, {
      method: 'DELETE',
    });
  },

  // Price History
  getPriceHistory(params?: { itemId?: string; itemType?: string; dateFrom?: string; dateTo?: string }): Promise<{
    history: PriceHistoryRecord[];
    stats: {
      highestSelling: number;
      lowestSelling: number;
      highestWholesale: number;
      lowestWholesale: number;
      totalChanges: number;
    };
  }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/price-history${query ? `?${query}` : ''}`);
  },

  // Adjustments
  getAdjustments(): Promise<InventoryAdjustment[]> {
    return this.request('/adjustments');
  },

  createAdjustment(data: Partial<InventoryAdjustment>): Promise<InventoryAdjustment> {
    return this.request('/adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Monthly Reports
  getMonthlyReport(year: number, month: number): Promise<MonthlyReportData> {
    return this.request(`/reports/monthly?year=${year}&month=${month}`);
  },

  // Transactions
  getTransactions(params?: { type?: string; search?: string; dateFrom?: string; dateTo?: string }): Promise<TransactionRecord[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/transactions${query ? `?${query}` : ''}`);
  },

  // Backup & Reset & MongoDB
  exportBackupUrl(): string {
    return `/api/backup/export`;
  },

  importBackup(backupData: any): Promise<{ success: boolean; message: string }> {
    return this.request('/backup/import', {
      method: 'POST',
      body: JSON.stringify(backupData),
    });
  },

  resetDemoData(): Promise<{ success: boolean; message: string }> {
    return this.request('/backup/reset', {
      method: 'POST',
    });
  },

  getMongoStatus(): Promise<{
    connected: boolean;
    dbName: string;
    cluster: string;
    error: string | null;
    lastSync: string | null;
    collectionCounts: Record<string, number>;
  }> {
    return this.request('/mongodb/status');
  },

  syncMongoDB(): Promise<{ success: boolean; status: any; message: string }> {
    return this.request('/mongodb/sync', {
      method: 'POST',
    });
  },

  clearAllRecords(): Promise<{ success: boolean; message: string }> {
    return this.request('/mongodb/clear', {
      method: 'POST',
    });
  },
};
