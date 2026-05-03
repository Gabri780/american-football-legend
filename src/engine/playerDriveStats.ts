import { Drive } from './drive';
import { Player, QBSkills, RBSkills, WRSkills } from './player';
import { SeededRandom } from './prng';

export type OffensiveScheme = 'AirRaid' | 'Balanced' | 'RunHeavy';

export interface QBDriveStats {
  passAttempts: number;
  completions: number;
  passYards: number;
  passTDs: number;
  interceptions: number;
  rushAttempts: number;
  rushYards: number;
  rushTDs: number;
  sacks: number;
  fumbles: number;
  gamesPlayed?: number; // Added for B1 aggregation
}

export interface RBDriveStats {
  carries: number;
  rushYards: number;
  rushTDs: number;
  fumbles: number;
  receptions: number;
  receivingYards: number;
  receivingTDs: number;
  targets: number;
  gamesPlayed?: number;
}

export interface WRDriveStats {
  targets: number;
  receptions: number;
  receivingYards: number;
  receivingTDs: number;
  drops: number;
  gamesPlayed?: number;
}

export type PlayerDriveStats = QBDriveStats | RBDriveStats | WRDriveStats;

/** Pass ratio per offensive scheme */
const PASS_RATIO: Record<OffensiveScheme, number> = {
  AirRaid: 0.75,
  Balanced: 0.60,
  RunHeavy: 0.45
};

/** Run ratio per offensive scheme (complement of pass ratio) */
const RUN_RATIO: Record<OffensiveScheme, number> = {
  AirRaid: 0.25,
  Balanced: 0.40,
  RunHeavy: 0.55
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ─────────────────────────────────────────────────────────────────────────────
// TD ATTRIBUTION LOGIC
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Decides whether the scoring play was by air or on the ground,
 * and which player scored.
 *
 * Air TD attribution:
 *   60% → WR1 (receivingTD)
 *   25% → RB (receivingTD)
 *   15% → other receivers (not modeled individually)
 *
 * Ground TD attribution (Mobile QB):
 *   40% → QB (rushTD)
 *   50% → RB (rushTD)
 *   10% → other
 *
 * Ground TD attribution (non-Mobile QB):
 *   80% → RB (rushTD)
 *   10% → QB (sneak/rushTD)
 *   10% → other
 */
export interface TDAttribution {
  byAir: boolean;
  scorerRole: 'QB' | 'RB' | 'WR' | 'OTHER';
}

export function resolveTDAttribution(
  ratioPase: number,
  archetype: string,
  rng: SeededRandom
): TDAttribution {
  const byAir = rng.random() < ratioPase;

  if (byAir) {
    const r = rng.random();
    if (r < 0.60) return { byAir, scorerRole: 'WR' };       // 60% WR1
    if (r < 0.85) return { byAir, scorerRole: 'RB' };       // 25% RB receiving (0.60 + 0.25 = 0.85)
    return { byAir, scorerRole: 'OTHER' };                   // 15% other
  } else {
    const r = rng.random();
    if (archetype === 'Mobile QB') {
      if (r < 0.40) return { byAir, scorerRole: 'QB' };     // 40% QB rush
      if (r < 0.90) return { byAir, scorerRole: 'RB' };     // 50% RB rush (0.40 + 0.50 = 0.90)
      return { byAir, scorerRole: 'OTHER' };                 // 10% other
    } else {
      if (r < 0.80) return { byAir, scorerRole: 'RB' };     // 80% RB rush
      if (r < 0.90) return { byAir, scorerRole: 'QB' };     // 10% QB sneak
      return { byAir, scorerRole: 'OTHER' };                 // 10% other (sneak, FB)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QB STATS
// ─────────────────────────────────────────────────────────────────────────────
function computeQBStats(drive: Drive, player: Player, scheme: OffensiveScheme, rng: SeededRandom, tdAttribution?: TDAttribution): QBDriveStats {
  const skills = player.positionalSkills as QBSkills;
  const ratioPase = PASS_RATIO[scheme];

  // Pass yards
  const rawPassYards = drive.totalYards * ratioPase;
  const passYards = Math.max(0, Math.round(rawPassYards));

  // Pass attempts
  let passAttempts: number;
  if (drive.totalYards < 0) {
    passAttempts = rng.randomInt(1, 3);
  } else {
    passAttempts = Math.round(passYards / 9) + rng.randomInt(0, 2);
    passAttempts = Math.max(1, passAttempts);
  }

  // Completion rate based on shortAccuracy
  const completionRate = clamp(0.62 + (skills.shortAccuracy - 75) * 0.005, 0.40, 0.80);
  const completions = Math.round(passAttempts * completionRate);

  // Interceptions — direct outcome attribution
  const interceptions = drive.outcome === 'TURNOVER_INT' ? 1 : 0;

  // Sacks — ~10% chance per drive
  const sacks = rng.random() < 0.10 ? 1 : 0;

  // Fumbles — QB gets the fumble 50% of the time on TURNOVER_FUMBLE
  const fumbles = drive.outcome === 'TURNOVER_FUMBLE' && rng.random() < 0.50 ? 1 : 0;

  // Rush attempts — calibrated to NFL real-world rates
  // Healthcheck v2.0 showed previous formula produced ~102 carries/season for 
  // non-mobile QBs (NFL real: 30-50) and up to 227 for mobile (record: 176).
  // New formula targets ~46 carries/season non-mobile and ~122 mobile.
  const isMobile = player.archetype === 'Mobile QB';
  let rushAttempts: number;
  if (isMobile) {
    // Mobile QBs scramble in 40% of drives, 1-2 carries when they do
    rushAttempts = rng.random() < 0.40 ? rng.randomInt(1, 2) : 0;
  } else {
    // Non-mobile QBs scramble rarely (15% of drives), 1-2 carries
    rushAttempts = rng.random() < 0.15 ? rng.randomInt(1, 2) : 0;
  }

  // Rush yards: mobility * 0.05 * carries + small random per carry
  let rushYards = 0;
  for (let i = 0; i < rushAttempts; i++) {
    rushYards += Math.round(skills.mobility * 0.05) + rng.randomInt(-2, 5);
  }
  rushYards = Math.max(0, rushYards);

  // TD attribution — use pre-resolved attribution if provided (avoids double-counting)
  let passTDs = 0;
  let rushTDs = 0;
  if (drive.outcome === 'TD') {
    const attribution = tdAttribution ?? resolveTDAttribution(ratioPase, player.archetype, rng);
    if (attribution.scorerRole === 'QB' && !attribution.byAir) rushTDs = 1;
    else if (attribution.byAir && attribution.scorerRole === 'WR') passTDs = 1;   // QB threw to WR1
    else if (attribution.byAir && attribution.scorerRole === 'RB') passTDs = 1;   // QB threw to RB
    // scorerRole === 'OTHER': neither QB passTD nor rushTD
  }

  return {
    passAttempts,
    completions,
    passYards,
    passTDs,
    interceptions,
    rushAttempts,
    rushYards,
    rushTDs,
    sacks,
    fumbles
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RB STATS
// ─────────────────────────────────────────────────────────────────────────────
function computeRBStats(drive: Drive, player: Player, scheme: OffensiveScheme, rng: SeededRandom, tdAttribution?: TDAttribution): RBDriveStats {
  const skills = player.positionalSkills as RBSkills;
  const ratioCarrera = RUN_RATIO[scheme];
  const ratioPase = PASS_RATIO[scheme];

  // Rush yards: total drive yards × run ratio × RB1 share (75%)
  const rushYardsRaw = Math.max(0, drive.totalYards) * ratioCarrera * 0.75;
  const rushYards = Math.round(rushYardsRaw);

  // Carries based on vision + trucking adjusted yards-per-carry
  const ypc = clamp(
    4.2 + (skills.vision - 75) * 0.03 + (skills.trucking - 75) * 0.02,
    2.5,
    6.5
  );
  const carries = rushYards > 0 ? Math.max(1, Math.round(rushYards / ypc)) : 0;

  // Fumbles — RB gets the fumble 50% of the time on TURNOVER_FUMBLE
  const fumbles = drive.outcome === 'TURNOVER_FUMBLE' && rng.random() < 0.50 ? 1 : 0;

  // Rush TDs — use pre-resolved attribution if provided
  let rushTDs = 0;
  let receivingTDs = 0;
  if (drive.outcome === 'TD') {
    const attribution = tdAttribution ?? resolveTDAttribution(ratioPase, 'non-mobile', rng);
    if (!attribution.byAir && attribution.scorerRole === 'RB') rushTDs = 1;        // 70% RB rush TD
    if (attribution.byAir && attribution.scorerRole === 'RB') receivingTDs = 1;   // 15% RB receiving TD
  }

  // Receiving — RBs catch passes too
  const isReceivingBack = player.archetype === 'Receiving Back';
  const targets = rng.randomInt(0, isReceivingBack ? 4 : 2);
  const catchRate = clamp(0.75 + (skills.catching - 75) * 0.005, 0.55, 0.90);
  const receptions = Math.round(targets * catchRate);
  const receivingYards = receptions > 0
    ? receptions * rng.randomInt(4, 12)
    : 0;

  return {
    carries,
    rushYards,
    rushTDs,
    fumbles,
    receptions,
    receivingYards,
    receivingTDs,
    targets
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WR STATS
// ─────────────────────────────────────────────────────────────────────────────
function computeWRStats(drive: Drive, player: Player, scheme: OffensiveScheme, rng: SeededRandom, tdAttribution?: TDAttribution): WRDriveStats {
  const skills = player.positionalSkills as WRSkills;
  const ratioPase = PASS_RATIO[scheme];

  // Total air yards in this drive
  const passYardsTotales = Math.max(0, drive.totalYards) * ratioPase;

  // WR1 captures 30% of the QB's passing yardage
  const receivingYardsRaw = passYardsTotales * 0.30;
  const receivingYards = Math.round(receivingYardsRaw);

  // Average yards per reception based on YAC ability
  const avgYardsPerRec = clamp(12 + (skills.yacAbility - 75) * 0.05, 8, 18);

  // Estimate receptions, then back-calculate targets
  const catchRate = clamp(0.65 + (skills.hands - 75) * 0.005, 0.50, 0.85);
  const receptionsEstimated = receivingYards > 0
    ? Math.max(1, Math.round(receivingYards / avgYardsPerRec))
    : 0;
  const targets = receptionsEstimated > 0
    ? Math.round(receptionsEstimated / catchRate)
    : 0;
  const receptions = Math.round(targets * catchRate);
  const drops = Math.max(0, targets - receptions);

  // Receiving TDs — use pre-resolved attribution if provided
  let receivingTDs = 0;
  if (drive.outcome === 'TD') {
    const attribution = tdAttribution ?? resolveTDAttribution(ratioPase, 'non-mobile', rng);
    if (attribution.byAir && attribution.scorerRole === 'WR') receivingTDs = 1;  // 35% WR1 TD
  }

  return {
    targets,
    receptions,
    receivingYards,
    receivingTDs,
    drops
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function computePlayerDriveStats(
  drive: Drive,
  player: Player,
  scheme: OffensiveScheme,
  rng: SeededRandom,
  tdAttribution?: TDAttribution
): PlayerDriveStats {
  if (player.position === 'QB') return computeQBStats(drive, player, scheme, rng, tdAttribution);
  if (player.position === 'RB') return computeRBStats(drive, player, scheme, rng, tdAttribution);
  return computeWRStats(drive, player, scheme, rng, tdAttribution);
}
