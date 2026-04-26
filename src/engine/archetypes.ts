import { Position, Archetype, QBArchetype, RBArchetype, WRArchetype } from './types';

export interface AttributeRange {
  min: number;
  max: number;
}

export interface ArchetypeDefinition {
  weights: Record<string, number>;
  ranges: Record<string, AttributeRange>;
}

// Default range for attributes not specified in archetype
export const DEFAULT_ATTRIBUTE_RANGE: AttributeRange = { min: 60, max: 85 };

/**
 * Distribution of archetypes for top-tier stars (PFL elite).
 * Based on historical NFL prevalence and modern tactical trends.
 */
export const STAR_ARCHETYPE_DISTRIBUTION: Record<Position, { value: Archetype; weight: number }[]> = {
  QB: [
    { value: 'Pocket Passer', weight: 40 }, // Tradition/Elite consistency
    { value: 'Game Manager', weight: 30 },  // High prevalence in safe schemes
    { value: 'Gunslinger', weight: 20 },    // Rare high-risk/high-reward
    { value: 'Mobile QB', weight: 10 }      // Elite mobility is rare
  ],
  RB: [
    { value: 'Elusive Back', weight: 35 },  // Modern preference for agility
    { value: 'Speed Back', weight: 30 },    // Standard home-run threat
    { value: 'Power Back', weight: 25 },    // Traditional bruisers
    { value: 'Receiving Back', weight: 10 } // Specialized sub-package stars
  ],
  WR: [
    { value: 'Possession', weight: 35 },    // Target sponges/Safety blankets
    { value: 'YAC Specialist', weight: 30 },// Modern "West Coast" stars
    { value: 'Deep Threat', weight: 25 },   // Vertical stretchers
    { value: 'Red Zone', weight: 10 }      // Large-frame specialists
  ]
};

export const ARCHETYPES: Record<Archetype, ArchetypeDefinition> = {
  // --- QB ARCHETYPES ---
  'Pocket Passer': {
    weights: {
      armStrength: 0.10, shortAccuracy: 0.15, mediumAccuracy: 0.15, deepAccuracy: 0.10,
      pocketPresence: 0.15, mobility: 0.05, readDefense: 0.10, decisionMaking: 0.10,
      footballIQ: 0.05, composure: 0.05
    },
    ranges: {
      armStrength: { min: 70, max: 90 }, shortAccuracy: { min: 85, max: 99 },
      deepAccuracy: { min: 75, max: 90 }, mobility: { min: 40, max: 65 },
      pocketPresence: { min: 85, max: 99 }, decisionMaking: { min: 80, max: 95 },
      footballIQ: { min: 85, max: 99 }
    }
  },
  'Gunslinger': {
    weights: {
      armStrength: 0.20, shortAccuracy: 0.10, mediumAccuracy: 0.10, deepAccuracy: 0.20,
      pocketPresence: 0.05, mobility: 0.10, readDefense: 0.05, decisionMaking: 0.05,
      footballIQ: 0.05, composure: 0.10
    },
    ranges: {
      armStrength: { min: 85, max: 99 }, shortAccuracy: { min: 70, max: 85 },
      deepAccuracy: { min: 85, max: 99 }, mobility: { min: 55, max: 75 },
      pocketPresence: { min: 65, max: 80 }, decisionMaking: { min: 60, max: 80 },
      footballIQ: { min: 70, max: 85 }
    }
  },
  'Mobile QB': {
    weights: {
      armStrength: 0.10, shortAccuracy: 0.15, mediumAccuracy: 0.10, deepAccuracy: 0.05,
      pocketPresence: 0.05, mobility: 0.25, readDefense: 0.10, decisionMaking: 0.10,
      footballIQ: 0.05, composure: 0.05
    },
    ranges: {
      armStrength: { min: 70, max: 85 }, shortAccuracy: { min: 70, max: 85 },
      deepAccuracy: { min: 65, max: 80 }, mobility: { min: 85, max: 99 },
      pocketPresence: { min: 60, max: 75 }, decisionMaking: { min: 70, max: 85 },
      footballIQ: { min: 70, max: 85 }
    }
  },
  'Game Manager': {
    weights: {
      armStrength: 0.05, shortAccuracy: 0.20, mediumAccuracy: 0.15, deepAccuracy: 0.05,
      pocketPresence: 0.10, mobility: 0.05, readDefense: 0.15, decisionMaking: 0.15,
      footballIQ: 0.05, composure: 0.05
    },
    ranges: {
      armStrength: { min: 65, max: 80 }, shortAccuracy: { min: 85, max: 99 },
      deepAccuracy: { min: 60, max: 75 }, mobility: { min: 55, max: 75 },
      pocketPresence: { min: 75, max: 90 }, decisionMaking: { min: 85, max: 99 },
      footballIQ: { min: 85, max: 99 }
    }
  },

  // --- RB ARCHETYPES ---
  'Power Back': {
    weights: {
      speed: 0.05, acceleration: 0.10, agility: 0.05, strength: 0.20, vision: 0.15,
      jukeMove: 0.05, trucking: 0.20, ballSecurity: 0.10, catching: 0.05,
      routeRunning: 0.00, breakawaySpeed: 0.05
    },
    ranges: {
      strength: { min: 85, max: 99 }, trucking: { min: 85, max: 99 },
      speed: { min: 70, max: 85 }, vision: { min: 80, max: 95 }
    }
  },
  'Speed Back': {
    weights: {
      speed: 0.20, acceleration: 0.15, agility: 0.10, strength: 0.05, vision: 0.10,
      jukeMove: 0.05, trucking: 0.05, ballSecurity: 0.10, catching: 0.05,
      routeRunning: 0.05, breakawaySpeed: 0.10
    },
    ranges: {
      speed: { min: 88, max: 99 }, acceleration: { min: 85, max: 99 },
      breakawaySpeed: { min: 85, max: 99 }, strength: { min: 50, max: 70 }
    }
  },
  'Receiving Back': {
    weights: {
      speed: 0.10, acceleration: 0.10, agility: 0.15, strength: 0.05, vision: 0.10,
      jukeMove: 0.05, trucking: 0.05, ballSecurity: 0.10, catching: 0.20,
      routeRunning: 0.10, breakawaySpeed: 0.00
    },
    ranges: {
      catching: { min: 80, max: 95 }, routeRunning: { min: 75, max: 90 },
      agility: { min: 80, max: 95 }
    }
  },
  'Elusive Back': {
    weights: {
      speed: 0.10, acceleration: 0.10, agility: 0.20, strength: 0.05, vision: 0.20,
      jukeMove: 0.15, trucking: 0.05, ballSecurity: 0.05, catching: 0.05,
      routeRunning: 0.05, breakawaySpeed: 0.00
    },
    ranges: {
      agility: { min: 90, max: 99 }, jukeMove: { min: 85, max: 99 },
      vision: { min: 85, max: 99 }
    }
  },

  // --- WR ARCHETYPES ---
  'Deep Threat': {
    weights: {
      speed: 0.20, acceleration: 0.10, agility: 0.05, strength: 0.05, hands: 0.10,
      routeRunning: 0.10, separation: 0.20, catchInTraffic: 0.05, yacAbility: 0.05,
      contestedCatches: 0.05, bodyControl: 0.05
    },
    ranges: {
      speed: { min: 90, max: 99 }, separation: { min: 85, max: 99 },
      acceleration: { min: 85, max: 99 }
    }
  },
  'Possession': {
    weights: {
      speed: 0.05, acceleration: 0.05, agility: 0.10, strength: 0.05, hands: 0.20,
      routeRunning: 0.20, separation: 0.15, catchInTraffic: 0.10, yacAbility: 0.05,
      contestedCatches: 0.05, bodyControl: 0.00
    },
    ranges: {
      hands: { min: 90, max: 99 }, routeRunning: { min: 90, max: 99 },
      separation: { min: 80, max: 95 }
    }
  },
  'Red Zone': {
    weights: {
      speed: 0.05, acceleration: 0.05, agility: 0.05, strength: 0.15, hands: 0.15,
      routeRunning: 0.10, separation: 0.05, catchInTraffic: 0.10, yacAbility: 0.05,
      contestedCatches: 0.25, bodyControl: 0.00
    },
    ranges: {
      strength: { min: 80, max: 95 }, contestedCatches: { min: 88, max: 99 },
      hands: { min: 80, max: 95 }
    }
  },
  'YAC Specialist': {
    weights: {
      speed: 0.10, acceleration: 0.10, agility: 0.20, strength: 0.05, hands: 0.10,
      routeRunning: 0.10, separation: 0.10, catchInTraffic: 0.05, yacAbility: 0.20,
      contestedCatches: 0.00, bodyControl: 0.00
    },
    ranges: {
      agility: { min: 88, max: 99 }, yacAbility: { min: 88, max: 99 },
      acceleration: { min: 85, max: 99 }
    }
  }
};
