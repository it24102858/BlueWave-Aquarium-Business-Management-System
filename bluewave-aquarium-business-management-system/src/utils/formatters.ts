/**
 * Formatting utilities for live fish pairs, single fish counts, and inventory calculations.
 */

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Format fish stock count in pairs and singles.
 * 10 -> "10 pairs (20 fish)"
 * 9.5 -> "9 pairs + 1 single (19 fish)"
 * 0.5 -> "1 single fish"
 * 1 -> "1 pair (2 fish)"
 * 0 -> "0 pairs"
 */
export function formatFishStock(stockInPairs: number): string {
  const stock = Number(stockInPairs) || 0;
  if (stock <= 0) return '0 pairs';

  const fullPairs = Math.floor(stock);
  const remainder = stock - fullPairs;
  const hasHalf = remainder >= 0.4 && remainder <= 0.6;
  const singleCount = hasHalf ? 1 : Math.round(remainder * 2);

  if (fullPairs === 0 && singleCount > 0) {
    return `${singleCount} single fish`;
  }

  const totalFish = fullPairs * 2 + singleCount;

  if (singleCount > 0) {
    return `${fullPairs} ${fullPairs === 1 ? 'pair' : 'pairs'} + ${singleCount} single (${totalFish} fish)`;
  }

  return `${fullPairs} ${fullPairs === 1 ? 'pair' : 'pairs'} (${totalFish} fish)`;
}

/**
 * Short representation for small labels / badges
 */
export function formatFishStockShort(stockInPairs: number): string {
  const stock = Number(stockInPairs) || 0;
  if (stock <= 0) return '0 pairs';

  const fullPairs = Math.floor(stock);
  const remainder = stock - fullPairs;
  const hasHalf = remainder >= 0.4 && remainder <= 0.6;
  const singleCount = hasHalf ? 1 : Math.round(remainder * 2);

  if (fullPairs === 0 && singleCount > 0) {
    return `${singleCount} single`;
  }

  if (singleCount > 0) {
    return `${fullPairs}p + ${singleCount}s`;
  }

  return `${fullPairs} ${fullPairs === 1 ? 'pair' : 'pairs'}`;
}

/**
 * Format quantity sold for display on sale receipt / item rows
 */
export function formatSaleFishCount(item: {
  itemType?: string;
  quantity: number;
  pairsCount?: number;
  singleCount?: number;
}): string {
  if (item.itemType && item.itemType !== 'live_fish') {
    return `${item.quantity}x`;
  }

  let pairs = item.pairsCount;
  let singles = item.singleCount;

  // Infer if missing
  if (pairs === undefined && singles === undefined) {
    const qty = Number(item.quantity) || 0;
    pairs = Math.floor(qty);
    const rem = qty - pairs;
    singles = rem >= 0.4 && rem <= 0.6 ? 1 : Math.round(rem * 2);
  } else {
    pairs = Number(pairs) || 0;
    singles = Number(singles) || 0;
  }

  const totalFish = (pairs * 2) + singles;

  if (pairs > 0 && singles > 0) {
    return `${pairs} ${pairs === 1 ? 'pair' : 'pairs'} + ${singles} single (${totalFish} fish)`;
  }
  if (pairs > 0) {
    return `${pairs} ${pairs === 1 ? 'pair' : 'pairs'} (${totalFish} fish)`;
  }
  if (singles > 0) {
    return `${singles} single ${singles === 1 ? 'fish' : 'fish'}`;
  }

  return `${item.quantity} ${item.quantity === 1 ? 'pair' : 'pairs'}`;
}

/**
 * Calculate total equivalent pairs and individual fish count
 */
export function calcFishCount(pairs: number, singles: number): {
  totalPairsEquiv: number;
  totalIndividualFish: number;
} {
  const p = Math.max(0, Number(pairs) || 0);
  const s = Math.max(0, Number(singles) || 0);
  return {
    totalPairsEquiv: round2(p + (s * 0.5)),
    totalIndividualFish: (p * 2) + s,
  };
}
