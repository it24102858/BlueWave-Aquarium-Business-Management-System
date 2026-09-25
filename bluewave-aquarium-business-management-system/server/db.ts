import fs from 'fs';
import path from 'path';
import { MongoClient, Db } from 'mongodb';
import { AppDatabase, User, FishVariety, FishFoodProduct, AquariumAccessory, Sale, Purchase, Expense, AdditionalIncome, PriceHistoryRecord, InventoryAdjustment } from './types.js';
import { getInitialSeedData } from './seedData.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'bluewave_db.json');

const DEFAULT_MONGO_URI = 'mongodb+srv://it24102858:Ruditha2004@cluster0.0pzrfi8.mongodb.net/?appName=Cluster0';
const MONGO_DB_NAME = 'bluewave_aquarium';

let inMemoryDb: AppDatabase | null = null;
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isMongoConnected = false;
let mongoError: string | null = null;
let lastSyncTime: string | null = null;
let isSyncing = false;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Connect to MongoDB Atlas
 */
export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;

  try {
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch {
        // ignore close errors
      }
    }

    console.log('[MongoDB] Connecting to MongoDB Atlas cluster...');
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });

    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGO_DB_NAME);
    isMongoConnected = true;
    mongoError = null;
    lastSyncTime = new Date().toISOString();
    console.log(`[MongoDB] Successfully connected to database "${MONGO_DB_NAME}"`);
    return true;
  } catch (err: any) {
    isMongoConnected = false;
    mongoError = err.message || 'Failed to connect to MongoDB Atlas';
    console.error('[MongoDB] Connection error:', mongoError);
    return false;
  }
}

/**
 * Clean MongoDB document by removing internal _id or preserving id
 */
function cleanMongoDoc<T extends { id: string }>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  if (!rest.id && _id) {
    rest.id = _id.toString();
  }
  return rest as T;
}

/**
 * Initialize database: Connects to MongoDB Atlas, retrieves existing records or initializes clean state
 */
export async function initDatabase(): Promise<AppDatabase> {
  ensureDataDirectory();

  const connected = await connectMongoDB();

  if (connected && mongoDb) {
    try {
      console.log('[MongoDB] Loading collections from MongoDB Atlas...');

      const usersCol = mongoDb.collection<User>('users');
      const usersCount = await usersCol.countDocuments();

      if (usersCount === 0) {
        console.log('[MongoDB] Fresh cluster detected. Seeding initial admin user (no demo items)...');
        const cleanInitial = getInitialSeedData();
        await usersCol.insertMany(cleanInitial.users.map((u) => ({ ...u, _id: u.id } as any)));
        
        inMemoryDb = cleanInitial;
        saveLocalBackup(inMemoryDb);
        return inMemoryDb;
      }

      // Ensure admin user name is updated to Ruditha Yukthika in MongoDB Atlas
      await usersCol.updateMany({ name: 'Alex Rivera' }, { $set: { name: 'Ruditha Yukthika' } });
      await usersCol.updateOne({ id: 'usr-1' }, { $set: { name: 'Ruditha Yukthika' } });

      // Load all 10 collections from MongoDB Atlas
      const [
        rawUsers,
        rawFish,
        rawFood,
        rawAccessories,
        rawSales,
        rawPurchases,
        rawExpenses,
        rawIncome,
        rawPriceHistory,
        rawAdjustments,
      ] = await Promise.all([
        mongoDb.collection('users').find().toArray(),
        mongoDb.collection('fishVarieties').find().toArray(),
        mongoDb.collection('fishFoodProducts').find().toArray(),
        mongoDb.collection('aquariumAccessories').find().toArray(),
        mongoDb.collection('sales').find().toArray(),
        mongoDb.collection('purchases').find().toArray(),
        mongoDb.collection('expenses').find().toArray(),
        mongoDb.collection('additionalIncome').find().toArray(),
        mongoDb.collection('priceHistory').find().toArray(),
        mongoDb.collection('inventoryAdjustments').find().toArray(),
      ]);

      const loadedUsers = rawUsers.map((d) => cleanMongoDoc<User>(d)).map((u) => {
        if (u.name === 'Alex Rivera' || u.id === 'usr-1') {
          return { ...u, name: 'Ruditha Yukthika' };
        }
        return u;
      });

      inMemoryDb = {
        users: loadedUsers.length > 0 ? loadedUsers : getInitialSeedData().users,
        fishVarieties: rawFish.map((d) => cleanMongoDoc<FishVariety>(d)),
        fishFoodProducts: rawFood.map((d) => cleanMongoDoc<FishFoodProduct>(d)),
        aquariumAccessories: rawAccessories.map((d) => cleanMongoDoc<AquariumAccessory>(d)),
        sales: rawSales.map((d) => cleanMongoDoc<Sale>(d)),
        purchases: rawPurchases.map((d) => cleanMongoDoc<Purchase>(d)),
        expenses: rawExpenses.map((d) => cleanMongoDoc<Expense>(d)),
        additionalIncome: rawIncome.map((d) => cleanMongoDoc<AdditionalIncome>(d)),
        priceHistory: rawPriceHistory.map((d) => cleanMongoDoc<PriceHistoryRecord>(d)),
        inventoryAdjustments: rawAdjustments.map((d) => cleanMongoDoc<InventoryAdjustment>(d)),
      };

      console.log(
        `[MongoDB] Loaded live records: ${inMemoryDb.fishVarieties.length} fish, ${inMemoryDb.sales.length} sales, ${inMemoryDb.purchases.length} purchases, ${inMemoryDb.expenses.length} expenses`
      );

      saveLocalBackup(inMemoryDb);
      return inMemoryDb;
    } catch (err: any) {
      console.error('[MongoDB] Error reading collections from MongoDB:', err);
    }
  }

  // Fallback to local JSON file if offline or disconnected
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(raw);
      if (inMemoryDb && inMemoryDb.users && inMemoryDb.fishVarieties) {
        return inMemoryDb;
      }
    } catch (err) {
      console.error('Failed to read local DB file:', err);
    }
  }

  inMemoryDb = getInitialSeedData();
  saveLocalBackup(inMemoryDb);
  return inMemoryDb;
}

export function getDatabase(): AppDatabase {
  if (!inMemoryDb) {
    // If accessed before async init completes, provide initial seed or local file
    ensureDataDirectory();
    if (fs.existsSync(DB_FILE)) {
      try {
        inMemoryDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        return inMemoryDb!;
      } catch {
        // ignore
      }
    }
    inMemoryDb = getInitialSeedData();
  }
  return inMemoryDb;
}

function saveLocalBackup(db: AppDatabase): void {
  ensureDataDirectory();
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write local backup file:', err);
  }
}

/**
 * Direct collection helpers for real-time immediate MongoDB table insertions/updates
 */
export async function mongoInsertDoc<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
  if (!isMongoConnected || !mongoDb) return;
  try {
    const col = mongoDb.collection(collectionName);
    const { _id, ...rest } = item as any;
    await col.replaceOne({ id: item.id }, { _id: item.id, ...rest }, { upsert: true });
    lastSyncTime = new Date().toISOString();
  } catch (err: any) {
    console.error(`[MongoDB] Direct insert to "${collectionName}" error:`, err.message);
  }
}

export async function mongoUpdateDoc<T extends { id: string }>(collectionName: string, id: string, item: T): Promise<void> {
  if (!isMongoConnected || !mongoDb) return;
  try {
    const col = mongoDb.collection(collectionName);
    const { _id, ...rest } = item as any;
    await col.replaceOne({ id }, { _id: id, ...rest }, { upsert: true });
    lastSyncTime = new Date().toISOString();
  } catch (err: any) {
    console.error(`[MongoDB] Direct update in "${collectionName}" error:`, err.message);
  }
}

export async function mongoDeleteDoc(collectionName: string, id: string): Promise<void> {
  if (!isMongoConnected || !mongoDb) return;
  try {
    const col = mongoDb.collection(collectionName);
    await col.deleteOne({ id });
    lastSyncTime = new Date().toISOString();
  } catch (err: any) {
    console.error(`[MongoDB] Direct delete from "${collectionName}" error:`, err.message);
  }
}

/**
 * Save in-memory database and persist changes immediately to MongoDB Atlas
 */
let queuedDb: AppDatabase | null = null;

export async function saveDatabase(db: AppDatabase): Promise<boolean> {
  inMemoryDb = db;
  saveLocalBackup(db);

  // Synchronize to MongoDB Atlas
  return await syncToMongoDB(db);
}

/**
 * Sync all collections to MongoDB Atlas using bulk operations with queue safety
 */
export async function syncToMongoDB(db: AppDatabase): Promise<boolean> {
  if (!isMongoConnected || !mongoDb) {
    return false;
  }

  if (isSyncing) {
    queuedDb = db;
    return true;
  }

  isSyncing = true;

  try {
    const syncCollection = async <T extends { id: string }>(colName: string, items: T[]) => {
      const col = mongoDb!.collection(colName);
      if (!items || items.length === 0) {
        await col.deleteMany({});
        return;
      }

      const bulkOps = items.map((item) => {
        const { _id, ...rest } = item as any;
        return {
          replaceOne: {
            filter: { id: item.id },
            replacement: { _id: item.id, ...rest },
            upsert: true,
          },
        };
      });

      await col.bulkWrite(bulkOps);

      // Delete documents not in the current list
      const ids = items.map((i) => i.id);
      await col.deleteMany({ id: { $nin: ids } });
    };

    await Promise.all([
      syncCollection('users', db.users),
      syncCollection('fishVarieties', db.fishVarieties),
      syncCollection('fishFoodProducts', db.fishFoodProducts),
      syncCollection('aquariumAccessories', db.aquariumAccessories),
      syncCollection('sales', db.sales),
      syncCollection('purchases', db.purchases),
      syncCollection('expenses', db.expenses),
      syncCollection('additionalIncome', db.additionalIncome),
      syncCollection('priceHistory', db.priceHistory),
      syncCollection('inventoryAdjustments', db.inventoryAdjustments),
    ]);

    lastSyncTime = new Date().toISOString();
    return true;
  } catch (err: any) {
    console.error('[MongoDB] Sync error:', err.message);
    mongoError = err.message;
    return false;
  } finally {
    isSyncing = false;
    if (queuedDb) {
      const next = queuedDb;
      queuedDb = null;
      await syncToMongoDB(next);
    }
  }
}

/**
 * Returns current MongoDB Atlas connection and storage status
 */
export function getMongoStatus() {
  const db = getDatabase();
  return {
    connected: isMongoConnected,
    dbName: MONGO_DB_NAME,
    cluster: 'Cluster0 (cluster0.0pzrfi8.mongodb.net)',
    error: mongoError,
    lastSync: lastSyncTime,
    collectionCounts: {
      users: db.users.length,
      fishVarieties: db.fishVarieties.length,
      fishFoodProducts: db.fishFoodProducts.length,
      aquariumAccessories: db.aquariumAccessories.length,
      sales: db.sales.length,
      purchases: db.purchases.length,
      expenses: db.expenses.length,
      additionalIncome: db.additionalIncome.length,
      priceHistory: db.priceHistory.length,
      inventoryAdjustments: db.inventoryAdjustments.length,
    },
  };
}

/**
 * Clears all transaction & inventory records for a clean fresh start (keeps admin user)
 */
export async function clearAllRecords(): Promise<AppDatabase> {
  const currentDb = getDatabase();
  const preservedUsers = currentDb.users.length > 0 ? currentDb.users : getInitialSeedData().users;

  preservedUsers.forEach((u) => {
    if (u.id === 'usr-1' || u.name === 'Alex Rivera') {
      u.name = 'Ruditha Yukthika';
    }
  });

  const freshDb: AppDatabase = {
    users: preservedUsers,
    fishVarieties: [],
    fishFoodProducts: [],
    aquariumAccessories: [],
    sales: [],
    purchases: [],
    expenses: [],
    additionalIncome: [],
    priceHistory: [],
    inventoryAdjustments: [],
  };

  await saveDatabase(freshDb);
  return freshDb;
}

export async function resetToSeed(): Promise<AppDatabase> {
  const seed = getInitialSeedData();
  await saveDatabase(seed);
  return seed;
}
