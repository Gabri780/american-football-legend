import { SeededRandom } from './prng';
import { FIRST_NAMES } from '../data/firstNames';
import { LAST_NAMES } from '../data/lastNames';
import { COLLEGES_BY_TIER, CollegeTier } from '../data/colleges';
import { PlayerTier } from './player';

export function generatePlayerName(rng: SeededRandom): { firstName: string; lastName: string } {
  return {
    firstName: rng.pick(FIRST_NAMES),
    lastName: rng.pick(LAST_NAMES)
  };
}

export function generateCollegeId(rng: SeededRandom, talentTier: PlayerTier): string {
  const distribution: Record<PlayerTier, { value: CollegeTier; weight: number }[]> = {
    star: [
      { value: 'POWERHOUSE', weight: 0.55 },
      { value: 'STRONG', weight: 0.30 },
      { value: 'MID', weight: 0.13 },
      { value: 'SMALL', weight: 0.02 }
    ],
    regular: [
      { value: 'POWERHOUSE', weight: 0.20 },
      { value: 'STRONG', weight: 0.35 },
      { value: 'MID', weight: 0.35 },
      { value: 'SMALL', weight: 0.10 }
    ],
    user: [
      { value: 'POWERHOUSE', weight: 0.50 },
      { value: 'STRONG', weight: 0.30 },
      { value: 'MID', weight: 0.15 },
      { value: 'SMALL', weight: 0.05 }
    ]
  };
  
  const selectedTier = rng.weightedRandom(distribution[talentTier]);
  const pool = COLLEGES_BY_TIER[selectedTier];
  return rng.pick(pool);
}
