import { AppDatabase } from './types.js';
import bcrypt from 'bcryptjs';

/**
 * Returns clean initial database state without demo data.
 * Contains only the default administrator account for authentication.
 */
export function getInitialSeedData(): AppDatabase {
  // Pre-hashed password for "bluewave2026"
  const defaultSalt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('bluewave2026', defaultSalt);

  return {
    users: [
      {
        id: 'usr-1',
        email: 'admin@bluewave.com',
        passwordHash: defaultPasswordHash,
        name: 'Ruditha Yukthika',
        businessName: 'BlueWave Aquarium',
        role: 'owner',
        currencySymbol: 'LKR',
        createdAt: new Date().toISOString(),
      },
    ],
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
}
