import { DriveOutcome } from './drive';
import { WeightedItem } from './prng';

export const BASE_PROBABILITIES: Record<DriveOutcome, number> = {
  'TD': 0.20,
  'FG': 0.18,
  'PUNT': 0.42,
  'TURNOVER_INT': 0.07,
  'TURNOVER_FUMBLE': 0.05,
  'DOWNS': 0.04,
  'MISSED_FG': 0.03,
  'SAFETY': 0.005,
  'END_HALF': 0.005, // Splitting the 0.01 between HALF and GAME for convenience
  'END_GAME': 0.005
};

/**
 * Computes probabilities for each outcome based on matchup and field position.
 */
export function computeOutcomeProbabilities(
  matchupDelta: number,
  startYard: number,
  quarter: number
): WeightedItem<DriveOutcome>[] {
  const probs = { ...BASE_PROBABILITIES };

  // 1. Handle Safety special case
  if (startYard > 5) {
    probs['SAFETY'] = 0;
  }

  // 2. Handle Quarter special cases (Fix 3)
  if (quarter !== 2) {
    probs['END_HALF'] = 0;
  }
  if (quarter !== 4) {
    probs['END_GAME'] = 0;
  }

  // 3. Modulate by Matchup Delta
  // P_TD_ajustada = P_TD_base × (1 + matchupDelta × 0.015)
  // P_TURNOVER_ajustada = P_TURNOVER_base × (1 - matchupDelta × 0.012)
  probs['TD'] *= (1 + matchupDelta * 0.015);
  probs['TURNOVER_INT'] *= (1 - matchupDelta * 0.012);
  probs['TURNOVER_FUMBLE'] *= (1 - matchupDelta * 0.012);

  // Clamps to avoid negative or extreme probabilities before renormalization
  probs['TD'] = Math.max(0.01, probs['TD']);
  probs['TURNOVER_INT'] = Math.max(0.001, probs['TURNOVER_INT']);
  probs['TURNOVER_FUMBLE'] = Math.max(0.001, probs['TURNOVER_FUMBLE']);

  let items = normalize(probs);

  // 4. Modulate by Yard Line
  const yardMults = getYardMultipliers(startYard);
  
  items.forEach(item => {
    if (item.value === 'TD') item.weight *= yardMults.td;
    if (item.value === 'FG') item.weight *= yardMults.fg;
    if (item.value === 'PUNT') item.weight *= yardMults.punt;
  });

  return normalizeFromItems(items);
}

function getYardMultipliers(startYard: number) {
  if (startYard <= 15) return { td: 0.70, fg: 0.85, punt: 1.20 };
  if (startYard <= 30) return { td: 0.90, fg: 0.95, punt: 1.10 };
  if (startYard <= 50) return { td: 1.00, fg: 1.00, punt: 1.00 };
  if (startYard <= 70) return { td: 1.30, fg: 1.20, punt: 0.70 };
  return { td: 1.80, fg: 1.10, punt: 0.20 };
}

function normalize(probs: Record<DriveOutcome, number>): WeightedItem<DriveOutcome>[] {
  const total = Object.values(probs).reduce((a, b) => a + b, 0);
  return (Object.keys(probs) as DriveOutcome[]).map(key => ({
    value: key,
    weight: probs[key] / total
  }));
}

function normalizeFromItems(items: WeightedItem<DriveOutcome>[]): WeightedItem<DriveOutcome>[] {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  return items.map(i => ({
    value: i.value,
    weight: i.weight / total
  }));
}
