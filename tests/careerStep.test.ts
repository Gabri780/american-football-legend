import { describe, it, expect } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';
import { 
  initializeCareer, isCareerOver, finalizeCareer, simulateNextGame, 
  processOffseasonContracts, processOffseasonWealth, processOffseasonRetirement, startNextYear,
  CareerState 
} from '../src/engine/careerStep';

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

describe('simulateNextGame - regular season', () => {
  it('preseason transition genera schedule y pre-simula temporada', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    let state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 'sim-test'
    });

    const { state: newState, game } = simulateNextGame(state);
    expect(newState.phase).toBe('regular_season');
    expect(newState.currentSchedule).not.toBeNull();
    expect(newState.userRegularGamesQueue.length).toBe(17);
    expect(newState.gamesPlayedThisYear).toBe(1);
    expect(newState.currentRegularGameIndex).toBe(1);
    expect(game.homeTeamId === teams[0].id || game.awayTeamId === teams[0].id).toBe(true);
  });

  it('simula 17 games de regular season correctamente', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    let state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 'sim-17'
    });

    let lastGameResult;
    for (let i = 0; i < 17; i++) {
      const result = simulateNextGame(state);
      state = result.state;
      lastGameResult = result;
    }

    expect(state.gamesPlayedThisYear).toBe(17);
    expect(lastGameResult!.isLastGameOfRegularSeason).toBe(true);
    expect(['playoffs', 'offseason_contracts']).toContain(state.phase);
  });

  it('determinismo: mismo seed produce misma secuencia de games', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });

    function simY1(seed: string) {
      let state = initializeCareer({
        teams, userPlayer: player, userTeamId: teams[0].id,
        startYear: 2024, rngSeed: seed
      });
      const games = [];
      for (let i = 0; i < 5; i++) {
        const r = simulateNextGame(state);
        state = r.state;
        games.push({ score: `${r.game.homeScore}-${r.game.awayScore}`, winner: r.game.winnerTeamId });
      }
      return games;
    }

    expect(simY1('det-test')).toEqual(simY1('det-test'));
  });

  it('throws si phase es retired', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    const retiredState: CareerState = {
      ...state,
      phase: 'retired',
      retirementReason: 'forced_max_age'
    };
    expect(() => simulateNextGame(retiredState)).toThrow(/retired/);
  });
});

describe('processOffseasonContracts', () => {
  const teams = loadTeams();
  const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
  
  it('throws si phase no es offseason_contracts', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    expect(() => processOffseasonContracts(state, null)).toThrow(/offseason_contracts/);
  });

  it('decision válida = transición a offseason_wealth', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    // Forzar phase y contrato a punto de expirar (1 año restante -> 0 al procesar)
    const expiredContract = { ...state.currentContract, yearsRemaining: 1 };
    const offseasonInState: CareerState = { ...state, phase: 'offseason_contracts', currentContract: expiredContract };
    
    // Simular oferta (decision)
    const offer = {
      teamId: teams[1].id,
      salaryPerYear: 5000000,
      years: 3,
      guaranteedTotal: 0,
      signingBonus: 0,
      isRookieContract: false,
      isCurrentTeam: false,
      isContender: false,
      isExtension: false
    };
    
    const newState = processOffseasonContracts(offseasonInState, offer);
    expect(newState.phase).toBe('offseason_wealth');
    expect(newState.currentContract.teamId).toBe(teams[1].id);
    expect(newState.currentTeamId).toBe(teams[1].id);
  });

  it('decision null + contrato expirado = retired by no_market', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    // Forzar contrato a punto de expirar (1 año restante -> 0 al procesar)
    const expiredContract = { ...state.currentContract, yearsRemaining: 1 };
    const offseasonInState: CareerState = { ...state, phase: 'offseason_contracts', currentContract: expiredContract };
    
    const newState = processOffseasonContracts(offseasonInState, null);
    expect(newState.phase).toBe('retired');
    expect(newState.retirementReason).toBe('no_market');
  });
});

describe('processOffseasonWealth', () => {
  const teams = loadTeams();
  const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });

  it('throws si phase no es offseason_wealth', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    expect(() => processOffseasonWealth(state, { buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] })).toThrow(/offseason_wealth/);
  });

  it('decisions vacías = transición a offseason_ready', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    const wealthInState: CareerState = { ...state, phase: 'offseason_wealth' };
    
    const newState = processOffseasonWealth(wealthInState, { buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] });
    expect(newState.phase).toBe('offseason_ready');
  });

  it('forced_max_age = retired automático', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    // Forzar edad 42 para QB
    const oldPlayer = { ...state.currentPlayer, age: 42 };
    const wealthInState: CareerState = { ...state, phase: 'offseason_wealth', currentPlayer: oldPlayer };
    
    const newState = processOffseasonWealth(wealthInState, { buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] });
    expect(newState.phase).toBe('retired');
    expect(newState.retirementReason).toBe('forced_max_age');
  });
});

describe('startNextYear', () => {
  const teams = loadTeams();
  const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });

  it('throws si phase no es offseason_ready', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    expect(() => startNextYear(state)).toThrow(/offseason_ready/);
  });

  it('avanza año y yearsPlayed', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    
    // Simular estado listo para el siguiente año
    const readyState: CareerState = { 
      ...state, 
      phase: 'offseason_ready',
      yearsPlayed: 0
    };
    
    const initialAge = readyState.currentPlayer.age;
    const initialYear = readyState.currentYear;
    
    const newState = startNextYear(readyState);
    
    expect(newState.phase).toBe('preseason');
    expect(newState.currentYear).toBe(initialYear + 1);
    expect(newState.yearsPlayed).toBe(1);
    expect(newState.currentPlayer.age).toBe(initialAge);
  });

  it('reset de campos year-specific', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    const { state: seasonState } = simulateNextGame(state);
    
    const readyState: CareerState = { 
      ...seasonState, 
      phase: 'offseason_ready',
      currentSchedule: seasonState.currentSchedule,
      gamesPlayedThisYear: 17
    };
    
    const newState = startNextYear(readyState);
    
    expect(newState.currentSchedule).toBeNull();
    expect(newState.gamesPlayedThisYear).toBe(0);
    expect(newState.currentGameIndex).toBe(0);
    expect(newState.userRegularGamesQueue).toEqual([]);
    expect(newState.currentSeasonResult).toBeNull();
  });
});

describe('processOffseasonRetirement', () => {
  const teams = loadTeams();
  const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });

  it('throws si phase no es offseason_retirement_choice', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    expect(() => processOffseasonRetirement(state, true)).toThrow(/offseason_retirement_choice/);
  });

  it('retire=true → retired con callback_chose', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    const choiceState: CareerState = { ...state, phase: 'offseason_retirement_choice' };
    const newState = processOffseasonRetirement(choiceState, true);
    expect(newState.phase).toBe('retired');
    expect(newState.retirementReason).toBe('callback_chose');
  });

  it('retire=false → offseason_ready', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    const choiceState: CareerState = { ...state, phase: 'offseason_retirement_choice' };
    const newState = processOffseasonRetirement(choiceState, false);
    expect(newState.phase).toBe('offseason_ready');
    expect(newState.retirementReason).toBeNull();
  });

  it('processOffseasonWealth con jugador en thresholds → transition to retirement_choice', () => {
    const state = initializeCareer({
      teams, userPlayer: player, userTeamId: teams[0].id,
      startYear: 2024, rngSeed: 's'
    });
    // Forzar jugador en thresholds: QB age 36 + OVR 70
    const oldPlayer = { ...state.currentPlayer, age: 36, overall: 70 };
    const wealthInState: CareerState = { ...state, phase: 'offseason_wealth', currentPlayer: oldPlayer };
    
    const newState = processOffseasonWealth(wealthInState, { 
      buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] 
    });
    expect(newState.phase).toBe('offseason_retirement_choice');
  });
});
