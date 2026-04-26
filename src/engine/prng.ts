import seedrandom from 'seedrandom';

export interface WeightedItem<T> {
  value: T;
  weight: number;
}

/**
 * Seeded PRNG module for the simulation engine.
 * Ensures determinism and reproducibility across game sessions.
 */
export class SeededRandom {
  private generator: seedrandom.PRNG;
  private seed: string;

  constructor(seed: string) {
    this.seed = seed;
    this.generator = seedrandom(seed);
  }

  /**
   * Returns a random number in [0, 1)
   */
  random(): number {
    return this.generator();
  }

  /**
   * Returns a random integer in [min, max] inclusive
   */
  randomInt(min: number, max: number): number {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(this.generator() * (maxFloor - minCeil + 1)) + minCeil;
  }

  /**
   * Returns a random number following a normal distribution.
   * Truncated to [-2, +2] standard deviations.
   * 
   * Uses the Box-Muller transform.
   */
  randomNormal(mean = 0, std = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = this.generator(); // Converting [0,1) to (0,1)
    while (v === 0) v = this.generator();
    
    // Standard normal distribution (Z ~ N(0, 1))
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    
    // Truncate to [-2, 2]
    const truncatedZ = Math.max(-2, Math.min(2, z));
    
    return mean + truncatedZ * std;
  }

  /**
   * Picks a random element from an array
   */
  pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    const index = this.randomInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Picks an item from an array based on weights
   */
  weightedRandom<T>(items: WeightedItem<T>[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty weighted list');
    }

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
      // If all weights are 0, pick uniformly
      return this.pick(items.map(i => i.value));
    }

    let r = this.random() * totalWeight;
    for (const item of items) {
      if (r < item.weight) {
        return item.value;
      }
      r -= item.weight;
    }

    return items[items.length - 1].value;
  }

  /**
   * Creates a sub-PRNG child with a derived seed.
   * Useful for separating sequences (e.g. game seed vs specific match seed).
   */
  derive(name: string): SeededRandom {
    return new SeededRandom(`${this.seed}:${name}`);
  }

  /**
   * Returns the current seed string
   */
  getSeed(): string {
    return this.seed;
  }
}
