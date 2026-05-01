import { SeededRandom } from './prng';
import { Position, Archetype, Injury, SeasonStats, Contract } from './types';
import { ARCHETYPES, DEFAULT_ATTRIBUTE_RANGE, STAR_ARCHETYPE_DISTRIBUTION } from './archetypes';
import { getAgeFactor } from './aging';
import { generatePlayerName, generateCollegeId } from './nameGenerator';

export type PlayerTier = 'user' | 'star' | 'regular';

export interface QBSkills {
  armStrength: number;
  shortAccuracy: number;
  mediumAccuracy: number;
  deepAccuracy: number;
  pocketPresence: number;
  mobility: number;
  readDefense: number;
  decisionMaking: number;
  playAction: number;
}

export interface RBSkills {
  vision: number;
  jukeMove: number;
  spinMove: number;
  trucking: number;
  ballSecurity: number;
  routeRunning: number;
  catching: number;
  passProtection: number;
  breakawaySpeed: number;
}

export interface WRSkills {
  hands: number;
  routeRunning: number;
  separation: number;
  catchInTraffic: number;
  yacAbility: number;
  release: number;
  bodyControl: number;
  blocking: number;
  contestedCatches: number;
}

export interface Player {
  // Identity
  id: string;
  firstName: string;
  lastName: string;
  position: Position;
  archetype: Archetype;
  jerseyNumber: number;

  // Physical
  age: number;
  heightCm: number;
  weightKg: number;
  speed: number;
  acceleration: number;
  agility: number;
  strength: number;
  stamina: number;
  durability: number;

  // Mental
  footballIQ: number;
  awareness: number;
  composure: number;
  leadership: number;
  workEthic: number;

  // Position Specific
  positionalSkills: QBSkills | RBSkills | WRSkills;

  // Potential & Meta
  potential: number;
  longevity: number;
  scoutingLevel: number;
  overall: number;

  // State
  freshness: number;
  morale: number;
  injuries: Injury[];
  chemistry: Record<string, number>;

  // Career
  tier: PlayerTier;
  draftYear: number;
  draftRound: number;
  draftPick: number;
  collegeId: string;
  contract?: Contract;
  careerStats: SeasonStats[];
  yearInLeague: number; // Useful for progression
}

/**
 * Calculates OVR based on attributes, archetype weights and age factor.
 * Formula: OVR = Σ(attr_i * weight_i) * ageFactor
 */
export function computeOverall(player: Player): number {
  const definition = ARCHETYPES[player.archetype];
  if (!definition) throw new Error(`Unknown archetype: ${player.archetype}`);

  let weightedSum = 0;
  
  // Combine all attributes for the loop
  const allAttributes: Record<string, number> = {
    ...player,
    ...player.positionalSkills
  } as any;

  for (const [attr, weight] of Object.entries(definition.weights)) {
    const val = allAttributes[attr] || 60; // Fallback if attribute is missing
    weightedSum += val * weight;
  }

  const ageFactor = getAgeFactor(player.position, player.age);
  const finalOvr = Math.round(weightedSum * ageFactor);

  // Clamp to [40, 99]
  return Math.max(40, Math.min(99, finalOvr));
}

/**
 * Options for generating a new player.
 */
export interface CreatePlayerOptions {
  /** PRNG instance for deterministic generation */
  rng: SeededRandom;
  /** Player position (QB, RB, WR) */
  position: Position;
  /** Player first name (optional, generated if missing) */
  firstName?: string;
  /** Player last name (optional, generated if missing) */
  lastName?: string;
  /** 
   * Generation tier:
   * - 'user': The player controlled by the user. High potential range [75, 90].
   * - 'star': League elite NPC. Maximum potential range [80, 99].
   * - 'regular': Standard league NPC. Potential range [50, 80].
   */
  tier: PlayerTier;
  /** Optional overrides for specific generation needs */
  options?: {
    /** Minimum potential (only for 'user' tier) */
    potentialMin?: number;
    /** Override default rookie age (21-23) */
    ageOverride?: number;
    /** Force a specific archetype (useful for testing or specific NPC generation) */
    forceArchetype?: Archetype;
  };
}

/**
 * Procedurally generates a player using a SeededRandom instance.
 */
export function createPlayer(params: CreatePlayerOptions): Player {
  const { rng, position, tier, options = {} } = params;

  // 0. Name Generation (if not provided)
  let firstName = params.firstName;
  let lastName = params.lastName;
  if (!firstName || !lastName) {
    const generated = generatePlayerName(rng);
    if (!firstName) firstName = generated.firstName;
    if (!lastName) lastName = generated.lastName;
  }

  // 1. Determine Archetype
  let archetype: Archetype;
  if (options.forceArchetype) {
    archetype = options.forceArchetype;
  } else if (tier === 'user') {
    // User gets uniform random choice between the 4 position archetypes
    const choices = Object.keys(ARCHETYPES).filter(k => {
      if (position === 'QB') return k.includes('Passer') || k.includes('Gunslinger') || k.includes('Mobile') || k.includes('Manager');
      if (position === 'RB') return k.includes('Back');
      if (position === 'WR') return k.includes('Deep') || k.includes('Possession') || k.includes('Red Zone') || k.includes('YAC');
      return false;
    }) as Archetype[];
    archetype = rng.pick(choices);
  } else {
    // NPCs (Stars/Regular) use weighted distribution
    archetype = rng.weightedRandom(STAR_ARCHETYPE_DISTRIBUTION[position]);
  }

  const def = ARCHETYPES[archetype];

  // 2. Helper to generate attribute within archetype range or default
  const genAttr = (name: string) => {
    const range = def.ranges[name] || DEFAULT_ATTRIBUTE_RANGE;
    return rng.randomInt(range.min, range.max);
  };

  // 3. Potential
  let potential: number;
  if (tier === 'user') {
    potential = rng.randomInt(options.potentialMin || 75, 90);
  } else if (tier === 'star') {
    potential = rng.randomInt(80, 99);
  } else {
    potential = rng.randomInt(50, 80);
  }

  // 3.1 Longevity (new attribute)
  const longevityRng = rng.derive('longevity');
  const z = longevityRng.randomNormal();
  const longevity = Math.round(Math.max(40, Math.min(99, 70 + z * 10)));

  // 4. Age and Physique
  const age = options.ageOverride || rng.randomInt(21, 23);
  
  // Basic physical randomization
  const heightBase = position === 'QB' ? 188 : (position === 'RB' ? 180 : 185);
  const weightBase = position === 'QB' ? 100 : (position === 'RB' ? 95 : 90);

  const player: Partial<Player> = {
    id: `p_${rng.randomInt(100000, 999999)}`,
    firstName,
    lastName,
    position,
    tier,
    archetype,
    jerseyNumber: rng.randomInt(1, 99),
    age,
    heightCm: heightBase + rng.randomInt(-10, 15),
    weightKg: weightBase + rng.randomInt(-15, 20),
    
    // Core Physicals
    speed: genAttr('speed'),
    acceleration: genAttr('acceleration'),
    agility: genAttr('agility'),
    strength: genAttr('strength'),
    stamina: genAttr('stamina'),
    durability: genAttr('durability'),

    // Mentals
    footballIQ: genAttr('footballIQ'),
    awareness: genAttr('awareness'),
    composure: genAttr('composure'),
    leadership: genAttr('leadership'),
    workEthic: genAttr('workEthic'),

    potential,
    longevity,
    scoutingLevel: tier === 'user' ? 100 : 0,
    freshness: 100,
    morale: 80,
    injuries: [],
    chemistry: {},
    careerStats: [],
    draftYear: 2024,
    draftRound: 0,
    draftPick: 0,
    yearInLeague: 1,
    collegeId: generateCollegeId(rng, tier)
  };

  // 5. Positional Skills
  if (position === 'QB') {
    player.positionalSkills = {
      armStrength: genAttr('armStrength'),
      shortAccuracy: genAttr('shortAccuracy'),
      mediumAccuracy: genAttr('mediumAccuracy'),
      deepAccuracy: genAttr('deepAccuracy'),
      pocketPresence: genAttr('pocketPresence'),
      mobility: genAttr('mobility'),
      readDefense: genAttr('readDefense'),
      decisionMaking: genAttr('decisionMaking'),
      playAction: genAttr('playAction')
    };
  } else if (position === 'RB') {
    player.positionalSkills = {
      vision: genAttr('vision'),
      jukeMove: genAttr('jukeMove'),
      spinMove: genAttr('spinMove'),
      trucking: genAttr('trucking'),
      ballSecurity: genAttr('ballSecurity'),
      routeRunning: genAttr('routeRunning'),
      catching: genAttr('catching'),
      passProtection: genAttr('passProtection'),
      breakawaySpeed: genAttr('breakawaySpeed')
    };
  } else {
    player.positionalSkills = {
      hands: genAttr('hands'),
      routeRunning: genAttr('routeRunning'),
      separation: genAttr('separation'),
      catchInTraffic: genAttr('catchInTraffic'),
      yacAbility: genAttr('yacAbility'),
      release: genAttr('release'),
      bodyControl: genAttr('bodyControl'),
      blocking: genAttr('blocking'),
      contestedCatches: genAttr('contestedCatches')
    };
  }

  const finalPlayer = player as Player;
  finalPlayer.overall = computeOverall(finalPlayer);

  return finalPlayer;
}
