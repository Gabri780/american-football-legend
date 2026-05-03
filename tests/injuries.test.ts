import { describe, it, expect } from 'vitest';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';
import { computeInjuryProbability, rollInjury, tickInjuries, recoverFromInjuriesOffseason, canPlayThisWeek } from '../src/engine/injuries';
import { Injury } from '../src/engine/types';

describe('Injury System (Sub-Task B1)', () => {
  const rng = new SeededRandom('test-injuries');

  it('1. computeInjuryProbability returns value in [0, 0.05]', () => {
    const player = createPlayer({ rng, position: 'RB', tier: 'regular' });
    const P = computeInjuryProbability(player, 100, rng);
    expect(P).toBeGreaterThanOrEqual(0);
    expect(P).toBeLessThanOrEqual(0.05);
  });

  it('2. high injuryProneness + age 33 produces significantly higher P than low + age 25', () => {
    const youngPlayer = createPlayer({ rng: new SeededRandom('young'), position: 'WR', tier: 'regular', options: { ageOverride: 25 } });
    youngPlayer.injuryProneness = 40;
    youngPlayer.durability = 90;
    youngPlayer.yearInLeague = 4;

    const oldPlayer = createPlayer({ rng: new SeededRandom('old'), position: 'WR', tier: 'regular', options: { ageOverride: 33 } });
    oldPlayer.injuryProneness = 95;
    oldPlayer.durability = 40;
    oldPlayer.yearInLeague = 12;

    const P_young = computeInjuryProbability(youngPlayer, 100, rng);
    const P_old = computeInjuryProbability(oldPlayer, 100, rng);

    expect(P_old).toBeGreaterThan(P_young);
  });

  it('3. rookie season (yearsPlayed=0) NUNCA produce season_ending injury', () => {
    const rookie = createPlayer({ rng, position: 'QB', tier: 'user', options: { ageOverride: 21 } });
    rookie.yearInLeague = 1;
    
    const severities: Record<string, number> = { minor: 0, moderate: 0, major: 0, season_ending: 0 };
    // Force a seed that would otherwise produce season_ending if possible
    for (let i = 0; i < 100; i++) {
      const subRng = rng.derive(`rookie-roll-${i}`);
      const injury = rollInjury(rookie, 2024, 1, subRng);
      severities[injury.severity]++;
      expect(injury.severity).not.toBe('season_ending');
    }
    console.log('Rookie Severities (100 rolls):', severities);
  });

  it('4. rollInjury produce severity with approximate distribution', () => {
    const player = createPlayer({ rng, position: 'WR', tier: 'regular' });
    player.age = 25;
    player.injuryProneness = 60;
    player.yearInLeague = 4;

    const severities: Record<string, number> = { minor: 0, moderate: 0, major: 0, season_ending: 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const subRng = rng.derive(`dist-${i}`);
      const injury = rollInjury(player, 2024, 1, subRng);
      severities[injury.severity]++;
    }
    console.log('Distribution Severities (1000 rolls, age 25):', severities);

    // Expected: minor ~60%, moderate ~25%, major ~10%, season_ending ~5%
    // We check ranges to allow for randomness
    expect(severities.minor).toBeGreaterThan(500);
    expect(severities.minor).toBeLessThan(700);
    expect(severities.moderate).toBeGreaterThan(150);
    expect(severities.moderate).toBeLessThan(350);
  });

  it('5. canPlayThisWeek returns true if injuries.length === 0', () => {
    const player = createPlayer({ rng, position: 'RB', tier: 'user' });
    player.injuries = [];
    expect(canPlayThisWeek(player)).toBe(true);
  });

  it('6. canPlayThisWeek returns false if there is an injury with weeksRemaining > 0', () => {
    const player = createPlayer({ rng, position: 'RB', tier: 'user' });
    player.injuries = [{
      id: '1', type: 'knee', severity: 'moderate', weeksOut: 4, weeksRemaining: 4, yearOccurred: 2024, weekOccurred: 1
    }];
    expect(canPlayThisWeek(player)).toBe(false);
  });

  it('7. tickInjuries decrements weeksRemaining', () => {
    const injuries: Injury[] = [{
      id: '1', type: 'hamstring', severity: 'minor', weeksOut: 2, weeksRemaining: 2, yearOccurred: 2024, weekOccurred: 1
    }];
    const ticked = tickInjuries(injuries);
    expect(ticked[0].weeksRemaining).toBe(1);
  });

  it('8. tickInjuries removes injuries when weeksRemaining reaches 0', () => {
    const injuries: Injury[] = [{
      id: '1', type: 'hamstring', severity: 'minor', weeksOut: 1, weeksRemaining: 1, yearOccurred: 2024, weekOccurred: 1
    }];
    const ticked = tickInjuries(injuries);
    expect(ticked.length).toBe(0);
  });

  it('9. recoverFromInjuriesOffseason clears all acute injuries', () => {
    const injuries: Injury[] = [{
      id: '1', type: 'knee', severity: 'season_ending', weeksOut: 18, weeksRemaining: 10, yearOccurred: 2024, weekOccurred: 5
    }];
    const recovered = recoverFromInjuriesOffseason(injuries);
    expect(recovered.length).toBe(0);
  });

  it('10. determinism: same seed produces same injuries', () => {
    const player = createPlayer({ rng, position: 'RB', tier: 'user' });
    const seed = 'deterministic-seed';
    
    const inj1 = rollInjury(player, 2024, 1, new SeededRandom(seed));
    const inj2 = rollInjury(player, 2024, 1, new SeededRandom(seed));
    
    expect(inj1).toEqual(inj2);
  });
});
