import { describe, test, expect } from 'vitest';
import { FIRST_NAMES } from '../src/data/firstNames';
import { LAST_NAMES } from '../src/data/lastNames';
import { COLLEGES, COLLEGES_BY_TIER } from '../src/data/colleges';
import { generatePlayerName, generateCollegeId } from '../src/engine/nameGenerator';
import { SeededRandom } from '../src/engine/prng';
import { createPlayer } from '../src/engine/player';

describe('Name and College Generator (Task 3B)', () => {

  test('Test A — Banco completo: 300 nombres, 300 apellidos, 30 colleges', () => {
    expect(FIRST_NAMES.length).toBe(300);
    expect(LAST_NAMES.length).toBe(300);
    expect(COLLEGES.length).toBe(30);
  });

  test('Test B — Sin duplicados en bancos', () => {
    expect(new Set(FIRST_NAMES).size).toBe(300);
    expect(new Set(LAST_NAMES).size).toBe(300);
    const collegeIds = COLLEGES.map(c => c.id);
    expect(new Set(collegeIds).size).toBe(30);
  });

  test('Test C — Distribución de tiers de colleges: 5, 10, 10, 5', () => {
    expect(COLLEGES_BY_TIER.POWERHOUSE.length).toBe(5);
    expect(COLLEGES_BY_TIER.STRONG.length).toBe(10);
    expect(COLLEGES_BY_TIER.MID.length).toBe(10);
    expect(COLLEGES_BY_TIER.SMALL.length).toBe(5);
  });

  test('Test D — generatePlayerName produce nombres válidos de los bancos', () => {
    const rng = new SeededRandom('name-test');
    for (let i = 0; i < 100; i++) {
      const name = generatePlayerName(rng);
      expect(FIRST_NAMES).toContain(name.firstName);
      expect(LAST_NAMES).toContain(name.lastName);
    }
  });

  test('Test E — generateCollegeId respeta distribución por tier', () => {
    const rng = new SeededRandom('college-dist-test');
    const n = 10000;

    // Test for 'star' tier
    const countsStar: Record<string, number> = { POWERHOUSE: 0, STRONG: 0, MID: 0, SMALL: 0 };
    for (let i = 0; i < n; i++) {
      const cid = generateCollegeId(rng, 'star');
      const college = COLLEGES.find(c => c.id === cid)!;
      countsStar[college.tier]++;
    }

    // star: POWERHOUSE: 0.55, STRONG: 0.30, MID: 0.13, SMALL: 0.02
    expect(countsStar.POWERHOUSE / n).toBeCloseTo(0.55, 1); // 1 decimal place = +/- 0.05 approx
    // But requirement says +/- 3%, so let's be more precise
    expect(Math.abs(countsStar.POWERHOUSE / n - 0.55)).toBeLessThan(0.03);
    expect(Math.abs(countsStar.STRONG / n - 0.30)).toBeLessThan(0.03);
    expect(Math.abs(countsStar.MID / n - 0.13)).toBeLessThan(0.03);
    expect(Math.abs(countsStar.SMALL / n - 0.02)).toBeLessThan(0.03);

    // Test for 'regular' tier
    const countsReg: Record<string, number> = { POWERHOUSE: 0, STRONG: 0, MID: 0, SMALL: 0 };
    for (let i = 0; i < n; i++) {
      const cid = generateCollegeId(rng, 'regular');
      const college = COLLEGES.find(c => c.id === cid)!;
      countsReg[college.tier]++;
    }

    // regular: POWERHOUSE: 0.20, STRONG: 0.35, MID: 0.35, SMALL: 0.10
    expect(Math.abs(countsReg.POWERHOUSE / n - 0.20)).toBeLessThan(0.03);
    expect(Math.abs(countsReg.STRONG / n - 0.35)).toBeLessThan(0.03);
    expect(Math.abs(countsReg.MID / n - 0.35)).toBeLessThan(0.03);
    expect(Math.abs(countsReg.SMALL / n - 0.10)).toBeLessThan(0.03);
  });

  test('Test F — createPlayer sin firstName/lastName usa el banco', () => {
    const rng = new SeededRandom('fallback-test');
    const p = createPlayer({ rng, position: 'QB', tier: 'regular' });
    expect(p.firstName).not.toBe('');
    expect(p.lastName).not.toBe('');
    expect(FIRST_NAMES).toContain(p.firstName);
    expect(LAST_NAMES).toContain(p.lastName);
  });

  test('Test G — createPlayer CON firstName/lastName respeta lo pasado', () => {
    const rng = new SeededRandom('custom-test');
    const p = createPlayer({ 
      rng, 
      position: 'RB', 
      tier: 'user',
      firstName: 'Custom',
      lastName: 'User'
    });
    expect(p.firstName).toBe('Custom');
    expect(p.lastName).toBe('User');
  });

  test('Test H — Determinismo: mismo seed produce mismo nombre + mismo college', () => {
    const seed = 'determinism-seed';
    const p1 = createPlayer({ rng: new SeededRandom(seed), position: 'WR', tier: 'star' });
    const p2 = createPlayer({ rng: new SeededRandom(seed), position: 'WR', tier: 'star' });
    expect(p1.firstName).toBe(p2.firstName);
    expect(p1.lastName).toBe(p2.lastName);
    expect(p1.collegeId).toBe(p2.collegeId);
  });

  test('Test I — Smoke test estadístico (100 jugadores)', () => {
    const rng = new SeededRandom('smoke-test');
    const firstNames = new Set<string>();
    const tiersFound = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const p = createPlayer({ rng, position: 'QB', tier: 'regular' });
      firstNames.add(p.firstName);
      const college = COLLEGES.find(c => c.id === p.collegeId)!;
      tiersFound.add(college.tier);
    }

    expect(firstNames.size).toBeGreaterThan(50);
    expect(tiersFound.size).toBe(4);
  });

});
