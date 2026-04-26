import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../src/engine/prng';
import { createPlayer, computeOverall } from '../src/engine/player';
import { ARCHETYPES } from '../src/engine/archetypes';

describe('Player Module', () => {
  const rng = new SeededRandom('player-test-seed');

  it('Test 1 — createPlayer básico: QB Pocket Passer manual', () => {
    const player = createPlayer({
      rng,
      position: 'QB',
      firstName: 'Joe',
      lastName: 'Montana',
      tier: 'user',
      options: { forceArchetype: 'Pocket Passer' }
    });

    expect(player.archetype).toBe('Pocket Passer');
    expect(player.position).toBe('QB');
    expect(player.overall).toBeGreaterThanOrEqual(40);
    expect(player.overall).toBeLessThanOrEqual(99);
    expect(player.positionalSkills).toBeDefined();
    expect((player.positionalSkills as any).shortAccuracy).toBeDefined();
  });

  it('Test 2 — OVR en rango válido [40, 99]', () => {
    const positions = ['QB', 'RB', 'WR'] as const;
    for (let i = 0; i < 1000; i++) {
      const p = createPlayer({
        rng: rng.derive(`stress-${i}`),
        position: rng.pick([...positions]),
        firstName: 'Test',
        lastName: 'User',
        tier: i % 3 === 0 ? 'user' : (i % 3 === 1 ? 'star' : 'regular')
      });
      expect(p.overall).toBeGreaterThanOrEqual(40);
      expect(p.overall).toBeLessThanOrEqual(99);
    }
  });

  it('Test 3 — Distribución de OVR realista (QB Pocket Passer)', () => {
    const ovrs: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const p = createPlayer({
        rng: rng.derive(`dist-${i}`),
        position: 'QB',
        firstName: 'Test',
        lastName: 'User',
        tier: 'star',
        options: { forceArchetype: 'Pocket Passer', potentialMin: 85 }
      });
      ovrs.push(p.overall);
    }

    const sum = ovrs.reduce((a, b) => a + b, 0);
    const avg = sum / ovrs.length;
    
    const sqDiffs = ovrs.map(v => Math.pow(v - avg, 2));
    const stdDev = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / ovrs.length);

    expect(avg).toBeGreaterThanOrEqual(70);
    expect(avg).toBeLessThanOrEqual(85);
    expect(stdDev).toBeLessThan(8);
  });

  it('Test 4 — Factor de edad funciona', () => {
    const player = createPlayer({
      rng,
      position: 'RB',
      firstName: 'Saquon',
      lastName: 'Barkley',
      tier: 'user',
      options: { ageOverride: 21 }
    });

    const ovr21 = player.overall;
    
    // RB Prime is 24-26
    player.age = 25;
    const ovr25 = computeOverall(player);
    expect(ovr25).toBeGreaterThan(ovr21);

    // RB Decline is 32+
    player.age = 33;
    const ovr33 = computeOverall(player);
    expect(ovr33).toBeLessThan(ovr25);
  });

  it('Test 5 — Pesos suman 1.0', () => {
    for (const arch of Object.values(ARCHETYPES)) {
      const sum = Object.values(arch.weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 3);
    }
  });

  it('Test 6 — Determinismo', () => {
    const seed = 'deterministic-seed';
    const p1 = createPlayer({
      rng: new SeededRandom(seed),
      position: 'WR',
      firstName: 'Tyreek',
      lastName: 'Hill',
      tier: 'user'
    });

    const p2 = createPlayer({
      rng: new SeededRandom(seed),
      position: 'WR',
      firstName: 'Tyreek',
      lastName: 'Hill',
      tier: 'user'
    });

    expect(p1).toEqual(p2);
  });

  it('Test 7 — Arquetipos respetan rangos (Pocket Passer mobility)', () => {
    for (let i = 0; i < 100; i++) {
      const p = createPlayer({
        rng: rng.derive(`range-${i}`),
        position: 'QB',
        firstName: 'Tom',
        lastName: 'Brady',
        tier: 'star',
        options: { forceArchetype: 'Pocket Passer' }
      });
      const skills = p.positionalSkills as any;
      expect(skills.mobility).toBeGreaterThanOrEqual(40);
      expect(skills.mobility).toBeLessThanOrEqual(65);
    }
  });

  it('Test 8 — Determinismo robusto con tiers y opciones', () => {
    const seed = 'robust-seed';
    const config = {
      rng: new SeededRandom(seed),
      position: 'RB' as const,
      firstName: 'Christian',
      lastName: 'McCaffrey',
      tier: 'star' as const,
      options: { ageOverride: 24, forceArchetype: 'Receiving Back' as const }
    };

    const p1 = createPlayer(config);
    
    // Create new RNG with same seed for second call
    const p2 = createPlayer({
      ...config,
      rng: new SeededRandom(seed)
    });

    expect(p1).toEqual(p2);
    expect(p1.tier).toBeUndefined(); // Verification that internal player object doesn't leak 'tier' parameter if not needed
    expect(p1.potential).toBeGreaterThanOrEqual(80);
    expect(p1.potential).toBeLessThanOrEqual(99);
  });
});
