import { SeededRandom } from './prng';
import { Position, Archetype, Injury, SeasonStats, Contract } from './types';
import { ARCHETYPES, DEFAULT_ATTRIBUTE_RANGE, STAR_ARCHETYPE_DISTRIBUTION } from './archetypes';
import { getAgeFactor } from './aging';

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
  scoutingLevel: number;
  overall: number;

  // State
  freshness: number;
  morale: number;
  injuries: Injury[];
  chemistry: Record<string, number>;

  // Career
  draftYear: number;
  draftRound: number;
  draftPick: number;
  collegeId: string;
  contract?: Contract;
  careerStats: SeasonStats[];
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

export interface CreatePlayerOptions {
  rng: SeededRandom;
  position: Position;
  firstName: string;
  lastName: string;
  isUserPlayer: boolean;
  options?: {
    potentialMin?: number;
    ageOverride?: number;
    forceArchetype?: Archetype;
  };
}

/**
 * Procedurally generates a player using a SeededRandom instance.
 */
export function createPlayer(params: CreatePlayerOptions): Player {
  const { rng, position, firstName, lastName, isUserPlayer, options = {} } = params;

  // 1. Determine Archetype
  let archetype: Archetype;
  if (options.forceArchetype) {
    archetype = options.forceArchetype;
  } else if (isUserPlayer) {
    // User gets uniform random choice between the 4 position archetypes
    const choices = Object.keys(ARCHETYPES).filter(k => {
      if (position === 'QB') return k.includes('Passer') || k.includes('Gunslinger') || k.includes('Mobile') || k.includes('Manager');
      if (position === 'RB') return k.includes('Back');
      if (position === 'WR') return k.includes('Deep') || k.includes('Possession') || k.includes('Red Zone') || k.includes('YAC');
      return false;
    }) as Archetype[];
    archetype = rng.pick(choices);
  } else {
    // NPCs (Stars/Rest) use weighted distribution
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
  if (isUserPlayer) {
    potential = rng.randomInt(options.potentialMin || 75, 90);
  } else if (rng.random() < 0.1) { // 10% chance of being a "Star" generation
    potential = rng.randomInt(80, 99);
  } else {
    potential = rng.randomInt(50, 80);
  }

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
    scoutingLevel: isUserPlayer ? 100 : 0,
    freshness: 100,
    morale: 80,
    injuries: [],
    chemistry: {},
    careerStats: [],
    draftYear: 2024,
    draftRound: 0,
    draftPick: 0,
    collegeId: 'GENERIC_U'
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
