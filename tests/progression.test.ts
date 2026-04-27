import { describe, test, expect } from 'vitest';
import { SeededRandom } from '../src/engine/prng';
import { createPlayer, computeOverall } from '../src/engine/player';
import { progressPlayer } from '../src/engine/progression';

describe('Annual Progression System (Task 7)', () => {
  const rng = new SeededRandom('prog-test-seed');

  test('Test 1 — Structure: progressPlayer returns ProgressionResult valid', () => {
    const player = createPlayer({ rng, position: 'QB', tier: 'regular' });
    const result = progressPlayer(player, { rng });
    
    expect(result).toHaveProperty('player');
    expect(result).toHaveProperty('changes');
    expect(result).toHaveProperty('retired');
    expect(result).toHaveProperty('shouldConsiderRetirement');
    expect(Array.isArray(result.changes)).toBe(true);
  });

  test('Test 2 — Determinism: with same seed, same result', () => {
    const p1 = createPlayer({ rng: new SeededRandom('fixed'), position: 'QB', tier: 'star' });
    const p2 = createPlayer({ rng: new SeededRandom('fixed'), position: 'QB', tier: 'star' });
    
    const r1 = progressPlayer(p1, { rng: new SeededRandom('prog-fixed') });
    const r2 = progressPlayer(p2, { rng: new SeededRandom('prog-fixed') });
    
    expect(r1.player.overall).toBe(r2.player.overall);
    expect(r1.changes.length).toBe(r2.changes.length);
  });

  test('Test 3 — Rookie progresses positively', () => {
    // QB rookie (21 years), workEthic alto (90), potential alto (95)
    // Note: createPlayer caps potential at 90 for user, so I'll manually set it higher or use 90.
    const player = createPlayer({ rng, position: 'QB', tier: 'user' });
    player.age = 21;
    player.workEthic = 90;
    player.potential = 95;
    player.overall = 70; // Set a baseline

    let currentOvr = player.overall;
    for (let i = 0; i < 4; i++) {
      progressPlayer(player, { rng: new SeededRandom(`year-${i}`) });
    }
    
    expect(player.overall).toBeGreaterThanOrEqual(currentOvr + 5);
  });

  test('Test 4 — Veteran declines', () => {
    const player = createPlayer({ rng, position: 'QB', tier: 'star' });
    player.age = 37; // Very old, high decline points

    const result = progressPlayer(player, { rng: new SeededRandom('decline-seed-hard') });
    
    // Check that there is at least one negative change
    const hasDecline = result.changes.some(c => c.delta < 0);
    expect(hasDecline).toBe(true);
  });

  test('Test 5 — Potential as ceiling', () => {
    const player = createPlayer({ rng, position: 'QB', tier: 'regular' });
    // Force OVR to be at potential
    player.potential = player.overall;

    const result = progressPlayer(player, { rng: new SeededRandom(`ceiling-test`) });
    
    // No positive changes should happen
    const hasImprovement = result.changes.some(c => c.delta > 0);
    expect(hasImprovement).toBe(false);
  });

  test('Test 6 — workEthic affects progression speed', () => {
    const p1 = createPlayer({ rng: new SeededRandom('ethic'), position: 'QB', tier: 'user' });
    const p2 = createPlayer({ rng: new SeededRandom('ethic'), position: 'QB', tier: 'user' });
    
    p1.workEthic = 95;
    p2.workEthic = 40;
    p1.potential = 99;
    p2.potential = 99;
    p1.overall = 70;
    p2.overall = 70;
    p1.age = 21;
    p2.age = 21;

    for (let i = 0; i < 5; i++) {
      progressPlayer(p1, { rng: new SeededRandom(`step-${i}`) });
      progressPlayer(p2, { rng: new SeededRandom(`step-${i}`) });
    }
    
    expect(p1.overall).toBeGreaterThan(p2.overall);
  });

  test('Test 7 — Automatic NPC retirement', () => {
    const pOld = createPlayer({ rng, position: 'QB', tier: 'star' });
    pOld.age = 39;
    const rOld = progressPlayer(pOld);
    expect(rOld.retired).toBe(true);

    const pBad = createPlayer({ rng, position: 'QB', tier: 'regular' });
    // Lower attributes to force OVR < 65
    pBad.speed = 40;
    pBad.acceleration = 40;
    pBad.footballIQ = 40;
    pBad.positionalSkills = { ...pBad.positionalSkills, shortAccuracy: 40, mediumAccuracy: 40 } as any;
    pBad.overall = computeOverall(pBad);
    
    const rBad = progressPlayer(pBad);
    expect(rBad.retired).toBe(true);
  });

  test('Test 8 — User never retires automatically', () => {
    const pUser = createPlayer({ rng, position: 'QB', tier: 'user' });
    pUser.age = 45;
    pUser.overall = 50;
    
    const result = progressPlayer(pUser);
    expect(result.retired).toBe(false);
    expect(result.shouldConsiderRetirement).toBe(true);
  });

  test('Test 9 — Simulated full career trajectory', () => {
    const player = createPlayer({ rng, position: 'QB', tier: 'user' });
    player.age = 21;
    player.potential = 90;
    player.workEthic = 85;
    player.overall = 70;

    const ovrs: number[] = [player.overall];
    
    for (let i = 0; i < 15; i++) {
      progressPlayer(player, { rng: new SeededRandom(`career-${i}`) });
      ovrs.push(player.overall);
    }
    
    // Year 1-3: rise
    expect(ovrs[3]).toBeGreaterThan(ovrs[0]);
    // Year 12+: decline
    expect(ovrs[15]).toBeLessThan(Math.max(...ovrs));
    
    console.log('Career Trajectory:', ovrs.join(' -> '));
  });
});
