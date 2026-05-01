import { describe, it, expect } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';
import { initializeCareer, isCareerOver, finalizeCareer } from '../src/engine/careerStep';

describe('initializeCareer', () => {
  it('crea CareerState con phase preseason', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeCareer({
      teams,
      userPlayer: player,
      userTeamId: teams[0].id,
      startYear: 2024,
      rngSeed: 'init-test'
    });
    expect(state.phase).toBe('preseason');
    expect(state.yearsPlayed).toBe(0);
    expect(state.currentYear).toBe(2024);
    expect(state.startYear).toBe(2024);
  });

  it('asigna rookie contract correctamente', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 'init-test'
    });
    expect(state.currentContract.isRookieContract).toBe(true);
    expect(state.currentContract.teamId).toBe(teams[0].id);
    expect(state.contractsHistory.events.length).toBe(1);
    expect(state.contractsHistory.events[0].type).toBe('rookie_signed');
  });

  it('inicializa wealth con balance 0', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 'init-test'
    });
    expect(state.wealthState.balance).toBe(0);
    expect(state.wealthState.ownedProperties).toEqual([]);
    expect(state.wealthState.ownedVehicles).toEqual([]);
  });

  it('calcula userDraftPick entre 1 y 32', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 'init-test'
    });
    expect(state.userDraftPick).toBeGreaterThanOrEqual(1);
    expect(state.userDraftPick).toBeLessThanOrEqual(32);
  });

  it('snapshots playerAtStart inmutable', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const initialOVR = player.overall;
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 'init-test'
    });
    // Modificar el player original NO debe afectar al snapshot
    player.overall = 99;
    expect(state.playerAtStart.overall).toBe(initialOVR);
  });

  it('throws si userTeamId no existe', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    expect(() => initializeCareer({
      teams, userPlayer: player, userTeamId: 'NONEXISTENT',
      startYear: 2024, rngSeed: 'init-test'
    })).toThrow(/not found/);
  });

  it('determinismo: mismo seed produce mismo state', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const s1 = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 'det-test'
    });
    const s2 = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 'det-test'
    });
    expect(s1.currentContract).toEqual(s2.currentContract);
    expect(s1.userDraftPick).toBe(s2.userDraftPick);
  });
});

describe('isCareerOver', () => {
  it('false cuando phase es preseason', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    expect(isCareerOver(state)).toBe(false);
  });
});

describe('finalizeCareer', () => {
  it('throws si phase no es retired', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    expect(() => finalizeCareer(state)).toThrow(/retired/);
  });

  it('construye CareerResult válido cuando phase es retired', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    // Forzar state retired manualmente para test
    const retiredState = { ...state, phase: 'retired' as const, retirementReason: 'forced_max_age' as const };
    const result = finalizeCareer(retiredState);
    expect(result.retirementReason).toBe('forced_max_age');
    expect(result.userDraftPick).toBe(state.userDraftPick);
    expect(result.yearsPlayed).toBe(0);
  });
});
