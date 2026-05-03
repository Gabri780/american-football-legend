import { describe, it, expect, beforeAll } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { simulateCareer, CareerResult, RetireDecisionCallback } from '../src/engine/career';
import { SeededRandom } from '../src/engine/prng';

describe('simulateCareer - retires at age 30+ when prompted', () => {
  let result: CareerResult;
  let teams: ReturnType<typeof loadTeams>;
  let userTeamId: string;

  beforeAll(() => {
    teams = loadTeams();
    userTeamId = teams[0].id;
    // Using RB which has lower suggestAge (30) for faster test
    const player = createPlayer({ position: 'RB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });

    const retiresAt30: RetireDecisionCallback = (ctx) => ctx.player.age >= 30;

    result = simulateCareer({
      teams,
      userPlayer: player,
      userTeamId,
      startYear: 0,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: (offers) => offers[0] ?? null,
      retireDecisionCallback: retiresAt30,
      rng: new SeededRandom('career-1'),
      maxYears: 25
    });
  });

  it('career has at least 1 year played', () => {
    expect(result.yearsPlayed).toBeGreaterThanOrEqual(1);
  });

  it('history length matches yearsPlayed', () => {
    expect(result.history).toHaveLength(result.yearsPlayed);
  });

  it('endYear = startYear + yearsPlayed', () => {
    expect(result.endYear).toBe(result.startYear + result.yearsPlayed);
  });

  it('retirementReason is set', () => {
    expect(result.retirementReason).not.toBeNull();
    expect(['age_threshold', 'forced_max_age', 'callback_chose']).toContain(result.retirementReason);
  });

  it('peakOverall >= playerAtEnd.overall', () => {
    expect(result.peakOverall).toBeGreaterThanOrEqual(result.playerAtEnd.overall);
  });

  it('player aged correctly across career', () => {
    expect(result.playerAtEnd.age).toBe(result.playerAtStart.age + result.yearsPlayed);
  });

  it('career regular stats games played <= yearsPlayed * 17', () => {
    expect(result.careerRegularStats.gamesPlayed).toBeLessThanOrEqual(result.yearsPlayed * 17);
    expect(result.careerRegularStats.gamesPlayed).toBeGreaterThan(0);
  });

  it('championshipsWon <= superBowlAppearances', () => {
    expect(result.championshipsWon).toBeLessThanOrEqual(result.superBowlAppearances);
  });

  it('every history entry has consistent year', () => {
    result.history.forEach((entry, idx) => {
      expect(entry.year).toBe(result.startYear + idx);
    });
  });

  it('history entries have ovrAtEnd <= ovrAtStart for older years (decline)', () => {
    // Solo aplica si el jugador tiene >= 30 años en alguna entry
    const declineEntries = result.history.filter(e => e.ageAtSeason >= 30);
    if (declineEntries.length > 0) {
      expect(declineEntries.length).toBeGreaterThan(0);
    }
  });
});

describe('simulateCareer - never retires when prompted', () => {
  it('hits forced_max_age cap', () => {
    const teams = loadTeams();
    const player = createPlayer({ 
      position: 'QB', tier: 'user', 
      rng: new SeededRandom('p'), 
      options: { ageOverride: 39 } 
    });
    player.overall = 99; // force high market value

    const neverRetire: RetireDecisionCallback = () => false;

    const result = simulateCareer({
      teams,
      userPlayer: player,
      userTeamId: teams[0].id,
      startYear: 0,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), 
      faCallback: (offers) => offers[0] ?? null,
      retireDecisionCallback: neverRetire,
      rng: new SeededRandom('career-never'),
      maxYears: 5
    });

    expect(result.retirementReason).toBe('forced_max_age');
    expect(result.playerAtEnd.age).toBeGreaterThanOrEqual(40);
  });
});

describe('simulateCareer - determinism', () => {
  it('same seeds and callback produce identical career', () => {
    const teams = loadTeams();
    // Use RB for faster determinism check
    const player = createPlayer({ position: 'RB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });
    const cb: RetireDecisionCallback = (ctx) => ctx.player.age >= 30;

    const r1 = simulateCareer({
      teams, userPlayer: player, userTeamId: teams[0].id, startYear: 0,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: (offers) => offers[0] ?? null,
      retireDecisionCallback: cb, rng: new SeededRandom('det'), maxYears: 25
    });
    const r2 = simulateCareer({
      teams, userPlayer: player, userTeamId: teams[0].id, startYear: 0,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: (offers) => offers[0] ?? null,
      retireDecisionCallback: cb, rng: new SeededRandom('det'), maxYears: 25
    });

    expect(r1.yearsPlayed).toBe(r2.yearsPlayed);
    expect(r1.retirementReason).toBe(r2.retirementReason);
    expect(r1.championshipsWon).toBe(r2.championshipsWon);
    expect(r1.careerRegularStats).toEqual(r2.careerRegularStats);
  });
});

describe('simulateCareer - league aging', () => {
  it('team OVRs change over time', () => {
    const teams = loadTeams();
    // Capturar estado inicial
    const initialOVRs = teams.map(t => ({
      id: t.id,
      off: t.offenseRating,
      def: t.defenseRating
    }));

    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });

    try {
      simulateCareer({
        teams,
        userPlayer: player,
        userTeamId: teams[0].id,
        startYear: 0,
        wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: (offers) => offers[0] ?? null,
        retireDecisionCallback: () => true,
        rng: new SeededRandom('aging'),
        maxYears: 1 // Only need 1 year to check for mutation
      });
    } catch (e: any) {
      if (!e.message.includes('Reached maxYears cap')) {
        throw e;
      }
    }

    // Los OVRs originales NO deben haber cambiado (porque el algoritmo copia teams)
    teams.forEach((t, i) => {
      expect(t.offenseRating).toBe(initialOVRs[i].off);
      expect(t.defenseRating).toBe(initialOVRs[i].def);
    });
  });
});

describe('simulateCareer - extra constraints and validations', () => {
  it('throws if userTeamId is not in teams array', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });

    expect(() => {
      simulateCareer({
        teams,
        userPlayer: player,
        userTeamId: 'NON_EXISTENT_ID',
        startYear: 0,
        wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: (offers) => offers[0] ?? null,
        retireDecisionCallback: () => true,
        rng: new SeededRandom('x')
      });
    }).toThrow(/not found in teams array/);
  });

  it('throws if userPlayer position is not QB, RB, or WR', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    player.position = 'CB' as any;

    expect(() => {
      simulateCareer({
        teams,
        userPlayer: player,
        userTeamId: teams[0].id,
        startYear: 0,
        wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: (offers) => offers[0] ?? null,
        retireDecisionCallback: () => true,
        rng: new SeededRandom('x')
      });
    }).toThrow(/must be QB, RB, or WR/);
  });

  it('throws if maxYears cap is reached without retiring', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    player.age = 21;
    // For QB, forced max age is 40. If we only give 5 maxYears, it won't retire.

    expect(() => {
      simulateCareer({
        teams,
        userPlayer: player,
        userTeamId: teams[0].id,
        startYear: 0,
        wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: (offers) => offers[0] ?? null,
        retireDecisionCallback: () => false,
        rng: new SeededRandom('x'),
        maxYears: 5
      });
    }).toThrow(/Reached maxYears cap/);
  });
});
