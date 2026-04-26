import { describe, test, expect, beforeAll, vi } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { Team } from '../src/engine/team';

describe('Team Loading and Validation', () => {
  let teams: Team[];

  beforeAll(() => {
    teams = loadTeams();
  });

  test('Test 1 — Carga sin errores: loadTeams() devuelve array', () => {
    expect(Array.isArray(teams)).toBe(true);
    expect(teams.length).toBeGreaterThan(0);
  });

  test('Test 2 — Conteo: exactamente 32 equipos', () => {
    expect(teams.length).toBe(32);
  });

  test('Test 3 — Distribución por conferencia: 16/16', () => {
    const eastern = teams.filter(t => t.conference === 'Eastern').length;
    const western = teams.filter(t => t.conference === 'Western').length;
    expect(eastern).toBe(16);
    expect(western).toBe(16);
  });

  test('Test 4 — Distribución por división: 4 equipos por cada una de las 8 divisiones', () => {
    const divisions: Record<string, number> = {};
    teams.forEach(t => {
      const key = `${t.conference}-${t.division}`;
      divisions[key] = (divisions[key] || 0) + 1;
    });

    const expectedKeys = [
      'Eastern-East', 'Eastern-Atlantic', 'Eastern-North', 'Eastern-South',
      'Western-Central', 'Western-Mountain', 'Western-Pacific', 'Western-Southwest'
    ];

    expect(Object.keys(divisions).length).toBe(8);
    expectedKeys.forEach(key => {
      expect(divisions[key]).toBe(4);
    });
  });

  test('Test 5 — IDs únicos: ningún ID duplicado', () => {
    const ids = teams.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(32);
  });

  test('Test 6 — Abreviaturas únicas: ninguna duplicada, todas de 3 letras', () => {
    const abbrevs = teams.map(t => t.abbreviation);
    const uniqueAbbrevs = new Set(abbrevs);
    
    expect(uniqueAbbrevs.size).toBe(32);
    abbrevs.forEach(a => {
      expect(a.length).toBe(3);
    });
  });

  test('Test 7 — Rivalidades válidas: cada historicalRivalId existe en la liga', () => {
    const ids = new Set(teams.map(t => t.id));
    teams.forEach(t => {
      t.historicalRivalIds.forEach(rivalId => {
        expect(ids.has(rivalId)).toBe(true);
      });
    });
  });

  test('Test 8a — Validación falla con datos malos: si faltan equipos lanza error', () => {
    const invalidTeams = teams.slice(0, 31);
    expect(() => loadTeams(invalidTeams)).toThrow(/Invalid league size/);
  });

  test('Test 8b — Validación falla con datos malos: si hay IDs duplicados lanza error', () => {
    const invalidTeams = [...teams];
    invalidTeams[1] = { ...invalidTeams[1], id: invalidTeams[0].id };
    expect(() => loadTeams(invalidTeams)).toThrow(/Duplicate team ID found/);
  });

  test('Test 8c — Validación falla con datos malos: si un rival no existe lanza error', () => {
    const invalidTeams = [...teams];
    invalidTeams[0] = { ...invalidTeams[0], historicalRivalIds: ['NON_EXISTENT_TEAM'] };
    expect(() => loadTeams(invalidTeams)).toThrow(/rival does not exist/);
  });
});
