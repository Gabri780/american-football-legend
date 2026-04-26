import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../src/engine/prng';

describe('SeededRandom', () => {
  const SEED = 'test-seed-123';

  it('Test 1: misma seed produce la misma secuencia (10 valores idénticos)', () => {
    const rng1 = new SeededRandom(SEED);
    const rng2 = new SeededRandom(SEED);

    const sequence1 = Array.from({ length: 10 }, () => rng1.random());
    const sequence2 = Array.from({ length: 10 }, () => rng2.random());

    expect(sequence1).toEqual(sequence2);
  });

  it('Test 2: randomInt(1, 6) genera valores en [1, 6] tras 10000 iteraciones', () => {
    const rng = new SeededRandom(SEED);
    const iterations = 10000;
    const counts = new Map<number, number>();

    for (let i = 0; i < iterations; i++) {
      const val = rng.randomInt(1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      counts.set(val, (counts.get(val) || 0) + 1);
    }

    // Ensure all values [1, 6] were hit at least once
    for (let i = 1; i <= 6; i++) {
      expect(counts.get(i)).toBeGreaterThan(0);
    }
  });

  it('Test 3: randomNormal() promedio centrado en 0 ±0.05 tras 10000 iteraciones', () => {
    const rng = new SeededRandom(SEED);
    const iterations = 10000;
    let sum = 0;

    for (let i = 0; i < iterations; i++) {
      const val = rng.randomNormal(0, 1);
      // Ensure truncation to [-2, 2]
      expect(val).toBeGreaterThanOrEqual(-2);
      expect(val).toBeLessThanOrEqual(2);
      sum += val;
    }

    const average = sum / iterations;
    // Tolerance for 10k samples
    expect(average).toBeGreaterThanOrEqual(-0.05);
    expect(average).toBeLessThanOrEqual(0.05);
  });

  it('Test 4: derive("test") crea instancia distinta del padre (secuencias distintas)', () => {
    const parent = new SeededRandom(SEED);
    const child = parent.derive('child');

    const parentSeq = Array.from({ length: 10 }, () => parent.random());
    const childSeq = Array.from({ length: 10 }, () => child.random());

    expect(parentSeq).not.toEqual(childSeq);

    // Test child consistency
    const child2 = new SeededRandom(SEED).derive('child');
    const child2Seq = Array.from({ length: 10 }, () => child2.random());
    expect(childSeq).toEqual(child2Seq);
  });

  it('Test 5: pick() elige solo elementos del array proporcionado', () => {
    const rng = new SeededRandom(SEED);
    const options = ['QB', 'RB', 'WR', 'TE'];

    for (let i = 0; i < 100; i++) {
      const selection = rng.pick(options);
      expect(options).toContain(selection);
    }
  });

  it('Test 6: weightedRandom() respeta pesos (test estadístico con 10000 iteraciones)', () => {
    const rng = new SeededRandom(SEED);
    const items = [
      { value: 'A', weight: 80 },
      { value: 'B', weight: 20 }
    ];

    const iterations = 10000;
    const counts = { A: 0, B: 0 };

    for (let i = 0; i < iterations; i++) {
      const selection = rng.weightedRandom(items);
      counts[selection as 'A' | 'B']++;
    }

    const ratioA = counts.A / iterations;
    const ratioB = counts.B / iterations;

    // Expected: 0.8 and 0.2. Margin of error 0.02
    expect(ratioA).toBeGreaterThan(0.78);
    expect(ratioA).toBeLessThan(0.82);
    expect(ratioB).toBeGreaterThan(0.18);
    expect(ratioB).toBeLessThan(0.22);
  });
});
