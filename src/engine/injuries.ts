import { Player } from './player';
import { Injury, InjurySeverity, InjuryType } from './types';
import { SeededRandom } from './prng';

/**
 * Computes probability of injury for this game (0-1).
 */
export function computeInjuryProbability(
  player: Player,
  freshness: number,
  rng: SeededRandom
): number {
  let basePosition = 0.015; // WR default
  if (player.position === 'RB') basePosition = 0.025;
  if (player.position === 'QB') basePosition = 0.010;

  // proneFactor: lower durability or higher injuryProneness increases risk
  // result clamped [0.3, 2.0]
  const proneFactor = Math.max(0.3, Math.min(2.0, 1 - (player.durability - 50) / 100 + (player.injuryProneness - 50) / 100));

  let ageFactor = 1.0;
  if (player.age >= 34) ageFactor = 1.8;
  else if (player.age >= 31) ageFactor = 1.5;
  else if (player.age >= 28) ageFactor = 1.25;

  let fatigueFactor = 1.0;
  if (freshness < 40) fatigueFactor = 1.6;
  else if (freshness < 70) fatigueFactor = 1.3;

  let P = basePosition * proneFactor * ageFactor * fatigueFactor;

  // ROOKIE PROTECTION: Year 1
  if (player.yearInLeague === 1 || (player as any).yearsPlayed === 0) {
    P = Math.min(0.020, P);
  }

  return Math.max(0, Math.min(0.05, P));
}

/**
 * Generates a full Injury object if one occurs.
 */
export function rollInjury(
  player: Player,
  yearOccurred: number,
  weekOccurred: number,
  rng: SeededRandom
): Injury {
  const r = rng.random();
  let severity: InjurySeverity = 'minor';
  
  if (r < 0.60) severity = 'minor';
  else if (r < 0.85) severity = 'moderate';
  else if (r < 0.95) severity = 'major';
  else severity = 'season_ending';

  // Age/Prone shift: +1 tier
  const yearsPlayed = player.yearInLeague - 1;
  const isVulnerable = player.age >= 30 || player.injuryProneness >= 75;
  const isOld = player.age >= 33;

  if (isOld) {
    severity = shiftSeverity(severity, 2);
  } else if (isVulnerable) {
    severity = shiftSeverity(severity, 1);
  }

  // ROOKIE PROTECTION: No season_ending
  if (player.yearInLeague === 1 || (player as any).yearsPlayed === 0) {
    if (severity === 'season_ending') severity = 'major';
  }

  const type = rollInjuryType(player, rng);
  
  let weeksOut = 1;
  if (severity === 'minor') weeksOut = rng.randomInt(1, 3);
  else if (severity === 'moderate') weeksOut = rng.randomInt(4, 8);
  else if (severity === 'major') weeksOut = rng.randomInt(9, 17);
  else weeksOut = 18;

  return {
    id: `inj_${rng.derive('id').randomInt(100000, 999999)}`,
    type,
    severity,
    weeksOut,
    weeksRemaining: weeksOut,
    yearOccurred,
    weekOccurred
  };
}

function shiftSeverity(sev: InjurySeverity, tiers: number): InjurySeverity {
  const order: InjurySeverity[] = ['minor', 'moderate', 'major', 'season_ending'];
  const idx = order.indexOf(sev);
  const newIdx = Math.min(order.length - 1, idx + tiers);
  return order[newIdx];
}

function rollInjuryType(player: Player, rng: SeededRandom): InjuryType {
  const allTypes: InjuryType[] = [
    'hamstring', 'knee', 'shoulder', 'concussion', 
    'ankle', 'back', 'wrist', 'rib', 'foot', 'groin'
  ];

  const r = rng.random();
  if (player.position === 'QB') {
    if (r < 0.30) return rng.pick(['shoulder', 'concussion']);
  } else if (player.position === 'RB') {
    if (r < 0.40) return rng.pick(['knee', 'hamstring', 'ankle', 'foot']);
  } else if (player.position === 'WR') {
    if (r < 0.30) return rng.pick(['hamstring', 'ankle']);
  }

  return rng.pick(allTypes);
}

/**
 * Decrements weeksRemaining of all injuries and removes those that reach 0.
 */
export function tickInjuries(injuries: Injury[]): Injury[] {
  return injuries
    .map(inj => ({ ...inj, weeksRemaining: inj.weeksRemaining - 1 }))
    .filter(inj => inj.weeksRemaining > 0);
}

/**
 * Clears all acute injuries (offseason recovery).
 */
export function recoverFromInjuriesOffseason(injuries: Injury[]): Injury[] {
  // In B1, we clear everything.
  return [];
}

/**
 * Helper: is the player available to play this game?
 */
export function canPlayThisWeek(player: Player): boolean {
  return !player.injuries.some(inj => inj.weeksRemaining > 0);
}
