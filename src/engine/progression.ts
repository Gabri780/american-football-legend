import { Player, computeOverall } from './player';
import { SeededRandom } from './prng';
import { ARCHETYPES } from './archetypes';
import { Position } from './types';

export interface AttributeChange {
  attribute: string;
  before: number;
  after: number;
  delta: number;
}

export interface ProgressionResult {
  player: Player;
  changes: AttributeChange[];
  retired: boolean;
  shouldConsiderRetirement: boolean;
}

/**
 * Categorizes attributes into physical vs technical/mental.
 */
const PHYSICAL_ATTRIBUTES = ['speed', 'acceleration', 'agility', 'strength', 'stamina', 'durability'];

/**
 * Returns the base progression points curve based on age.
 */
function getBasePoints(rng: SeededRandom, age: number, position: Position): number {
  if (age <= 23) return rng.randomInt(6, 10);
  if (age <= 26) return rng.randomInt(4, 6);
  if (age <= 29) return rng.randomInt(1, 3);
  if (age <= 32) return rng.randomInt(-2, 0);
  if (age <= 35) return rng.randomInt(-4, -2);
  return rng.randomInt(-6, -4);
}

/**
 * Returns a factor based on longevity to modulate aging decline.
 */
function getLongevityFactor(longevity: number): number {
  if (longevity >= 90) return 0.7; // Ages well
  if (longevity >= 70) return 1.0; // Normal
  if (longevity >= 60) return 1.2; // Ages somewhat fast
  return 1.5; // Ages poorly
}

/**
 * Simulates a year of progression/decline for a player.
 */
export function progressPlayer(player: Player, options: { rng?: SeededRandom } = {}): ProgressionResult {
  const rng = options.rng || new SeededRandom(`prog-${player.id}-${player.age}`);
  
  // Ensure overall is up to date before logic
  player.overall = computeOverall(player);

  // 1. Calculate Points
  const basePoints = getBasePoints(rng, player.age, player.position);
  const workEthicMultiplier = (player.workEthic / 100) * 1.5; // 0.6 to 1.5
  
  let finalPoints = basePoints > 0 
    ? Math.round(basePoints * workEthicMultiplier)
    : Math.round((basePoints / workEthicMultiplier) * getLongevityFactor(player.longevity));

  // Hard cap: No growth if already at or above potential
  if (player.overall >= player.potential && finalPoints > 0) {
    finalPoints = 0;
  }

  const changes: AttributeChange[] = [];

  // 2. Distribute Points
  const archetypeDef = ARCHETYPES[player.archetype];
  const weights = archetypeDef.weights;
  
  // Sort all attributes by weight descending for prioritized improvement
  const prioritizedAttrs = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .map(([attr]) => attr);

  if (finalPoints > 0) {
    // Improvement
    let pointsToSpend = finalPoints;
    let attempts = 0;
    while (pointsToSpend > 0 && attempts < 100) {
      attempts++;
      const attr = rng.weightedRandom(prioritizedAttrs.map((a, i) => ({ 
        value: a, 
        weight: weights[a] * (10 / (i + 1)) // Give more weight to higher ranked attributes
      })));

      if (applyChange(player, attr, 1, changes)) {
        pointsToSpend--;
      }
    }
  } else if (finalPoints < 0) {
    // Decline
    let pointsToLose = Math.abs(finalPoints);
    
    // Priority 1: Physicals
    const physicalsInArchetype = prioritizedAttrs.filter(a => PHYSICAL_ATTRIBUTES.includes(a));
    const otherAttrs = prioritizedAttrs.filter(a => !PHYSICAL_ATTRIBUTES.includes(a));
    
    const declineOrder = [...physicalsInArchetype, ...otherAttrs];
    
    let attempts = 0;
    while (pointsToLose > 0 && attempts < 100) {
      attempts++;
      // Pick an attribute to decline, physicals have higher chance
      const attr = rng.weightedRandom(declineOrder.map((a, i) => ({
        value: a,
        weight: PHYSICAL_ATTRIBUTES.includes(a) ? 3 : 1
      })));

      if (applyChange(player, attr, -1, changes)) {
        pointsToLose--;
      }
    }
  }

  // 3. Update Age and OVR
  player.age += 1;
  player.yearInLeague += 1;
  player.overall = computeOverall(player);

  // 4. Evaluate Retirement
  let retired = false;
  let shouldConsiderRetirement = false;

  if (player.tier === 'user') {
    shouldConsiderRetirement = (player.overall < 70 && player.age > 32) || player.age > 38;
    retired = false;
  } else {
    // NPCs
    retired = (player.overall < 65) || (player.age > 38);
    // Special: RB decline
    if (player.position === 'RB' && player.overall < 70 && player.age > 32) {
      retired = true;
    }
  }

  return {
    player,
    changes,
    retired,
    shouldConsiderRetirement
  };
}

function applyChange(player: Player, attr: string, delta: number, changes: AttributeChange[]): boolean {
  const currentVal = getAttrValue(player, attr);
  const newVal = currentVal + delta;

  // Limits [40, 99]
  if (newVal < 40 || newVal > 99) return false;

  // Potential check for improvement
  if (delta > 0) {
    const tempPlayer = { ...player, positionalSkills: { ...player.positionalSkills } };
    setAttrValue(tempPlayer, attr, newVal);
    const newOverall = computeOverall(tempPlayer);
    if (newOverall > player.potential) return false;
  }

  setAttrValue(player, attr, newVal);
  
  // Track change
  const existing = changes.find(c => c.attribute === attr);
  if (existing) {
    existing.after = newVal;
    existing.delta += delta;
  } else {
    changes.push({
      attribute: attr,
      before: currentVal,
      after: newVal,
      delta: delta
    });
  }

  return true;
}

function getAttrValue(player: Player, attr: string): number {
  if (attr in player) return (player as any)[attr];
  if (attr in player.positionalSkills) return (player.positionalSkills as any)[attr];
  return 60;
}

function setAttrValue(player: Player, attr: string, val: number) {
  if (attr in player) {
    (player as any)[attr] = val;
  } else if (attr in player.positionalSkills) {
    (player.positionalSkills as any)[attr] = val;
  }
}
