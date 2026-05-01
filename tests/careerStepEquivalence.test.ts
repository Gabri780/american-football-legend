import { describe, it, expect } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { simulateCareer } from '../src/engine/career';
import { 
  initializeCareer, simulateNextGame, CareerState,
  processOffseasonContracts, processOffseasonWealth, processOffseasonRetirement, startNextYear, finalizeCareer 
} from '../src/engine/careerStep';
import { SeededRandom } from '../src/engine/prng';
import { Game } from '../src/engine/game';

/**
 * Helper: corre simulateNextGame hasta llegar a offseason o playoffs end.
 * Devuelve los games consumidos en orden + el state final.
 */
function runStepByStepUntilOffseason(initialState: CareerState): { 
  games: Game[]; 
  finalState: CareerState;
  reachedPlayoffs: boolean;
} {
  let state = initialState;
  const games: Game[] = [];
  let reachedPlayoffs = false;
  
  // Safety limit: 17 regular + max 4 playoff games = 21
  for (let i = 0; i < 25; i++) {
    if (state.phase === 'offseason_contracts') break;
    
    const result = simulateNextGame(state);
    games.push(result.game);
    state = result.state;
    
    if (state.phase === 'playoffs') reachedPlayoffs = true;
  }
  
  return { games, finalState: state, reachedPlayoffs };
}

describe('Equivalencia simulateCareer vs simulateNextGame (year 0)', () => {
  const teams = loadTeams();
  const SEED = 'equivalence-test-seed-1';
  
  it('regular season games tienen mismos scores', () => {
    // Setup idéntico
    const playerA = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-eq'), options: { ageOverride: 36 } });
    playerA.overall = 70;
    const playerB = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-eq'), options: { ageOverride: 36 } });
    playerB.overall = 70;
    
    // Original: simulateCareer con maxYears 25 + retire forzado
    const originalResult = simulateCareer({
      teams,
      userPlayer: playerA,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: () => true,  // se retira al primer prompt
      faCallback: () => null,  // no firma extension/FA
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom(SEED),
      maxYears: 25
    });
    
    // Step-by-step
    const initState = initializeCareer({
      teams,
      userPlayer: playerB,
      userTeamId: teams[0].id,
      startYear: 0,
      rngSeed: SEED
    });
    
    const stepResult = runStepByStepUntilOffseason(initState);
    
    // Comparar: el original tiene history[0] con stats de regular season
    // El step-by-step tiene games consumidos individualmente
    
    // VERIFICACIÓN: 17 regular season games consumidos (mínimo)
    expect(stepResult.games.length).toBeGreaterThanOrEqual(17);
    
    // VERIFICACIÓN: stats acumulados del usuario en regular season coinciden
    const originalRegularStats = originalResult.history[0].regularSeasonStats;
    
    // Sumar manualmente los stats de los primeros 17 games del step-by-step
    let stepRegularStats = {
      passYards: 0, passTDs: 0, interceptions: 0,
      completions: 0, passAttempts: 0,
      rushYards: 0, rushTDs: 0, carries: 0, fumbles: 0,
      receivingYards: 0, receivingTDs: 0, receptions: 0, targets: 0,
      gamesPlayed: 0
    };
    
    for (let i = 0; i < 17; i++) {
      const g = stepResult.games[i];
      if (g.userPlayerStats) {
        const s = g.userPlayerStats as any;
        stepRegularStats.passYards += s.passYards ?? 0;
        stepRegularStats.passTDs += s.passTDs ?? 0;
        stepRegularStats.interceptions += s.interceptions ?? 0;
        stepRegularStats.completions += s.completions ?? 0;
        stepRegularStats.passAttempts += s.passAttempts ?? 0;
        stepRegularStats.rushYards += s.rushYards ?? 0;
        stepRegularStats.rushTDs += s.rushTDs ?? 0;
        stepRegularStats.carries += (s.carries ?? s.rushAttempts ?? 0);
        stepRegularStats.fumbles += s.fumbles ?? 0;
        stepRegularStats.receivingYards += s.receivingYards ?? 0;
        stepRegularStats.receivingTDs += s.receivingTDs ?? 0;
        stepRegularStats.receptions += s.receptions ?? 0;
        stepRegularStats.targets += s.targets ?? 0;
        stepRegularStats.gamesPlayed += 1;
      }
    }
    
    // Comparar
    expect(stepRegularStats.passYards).toBe(originalRegularStats.passYards);
    expect(stepRegularStats.passTDs).toBe(originalRegularStats.passTDs);
    expect(stepRegularStats.interceptions).toBe(originalRegularStats.interceptions);
    expect(stepRegularStats.completions).toBe(originalRegularStats.completions);
    expect(stepRegularStats.passAttempts).toBe(originalRegularStats.passAttempts);
    expect(stepRegularStats.rushYards).toBe(originalRegularStats.rushYards);
    expect(stepRegularStats.rushTDs).toBe(originalRegularStats.rushTDs);
    expect(stepRegularStats.carries).toBe(originalRegularStats.carries);
    expect(stepRegularStats.gamesPlayed).toBe(17);
  });
  
  it('record final del equipo del usuario coincide', () => {
    const playerA = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-eq'), options: { ageOverride: 36 } });
    playerA.overall = 70;
    const playerB = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-eq'), options: { ageOverride: 36 } });
    playerB.overall = 70;
    
    const originalResult = simulateCareer({
      teams,
      userPlayer: playerA,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: () => true,
      faCallback: () => null,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom(SEED),
      maxYears: 25
    });
    
    const initState = initializeCareer({
      teams, userPlayer: playerB, userTeamId: teams[0].id,
      startYear: 0, rngSeed: SEED
    });
    
    const stepResult = runStepByStepUntilOffseason(initState);
    
    // Original: history[0].regularSeasonRecord
    const originalRecord = originalResult.history[0].regularSeasonRecord;
    
    // Step: SeasonResult guardado en finalState.currentSeasonResult
    expect(stepResult.finalState.currentSeasonResult).not.toBeNull();
    const stepStandings = stepResult.finalState.currentSeasonResult!.finalStandings;
    const stepUserStanding = stepStandings.find(s => s.teamId === teams[0].id);
    expect(stepUserStanding).toBeDefined();
    
    expect(stepUserStanding!.wins).toBe(originalRecord.wins);
    expect(stepUserStanding!.losses).toBe(originalRecord.losses);
    expect(stepUserStanding!.ties).toBe(originalRecord.ties);
  });
  
  it('user playoff classification coincide', () => {
    const playerA = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-eq'), options: { ageOverride: 36 } });
    playerA.overall = 70;
    const playerB = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-eq'), options: { ageOverride: 36 } });
    playerB.overall = 70;
    
    const originalResult = simulateCareer({
      teams,
      userPlayer: playerA,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: () => true,
      faCallback: () => null,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom(SEED),
      maxYears: 25
    });
    
    const initState = initializeCareer({
      teams, userPlayer: playerB, userTeamId: teams[0].id,
      startYear: 0, rngSeed: SEED
    });
    
    const stepResult = runStepByStepUntilOffseason(initState);
    
    expect(stepResult.reachedPlayoffs).toBe(originalResult.history[0].madePlayoffs);
  });
  
  it('exit round playoffs coincide si user clasificó', () => {
    const playerA = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-eq'), options: { ageOverride: 36 } });
    playerA.overall = 70;
    const playerB = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-eq'), options: { ageOverride: 36 } });
    playerB.overall = 70;
    
    const originalResult = simulateCareer({
      teams,
      userPlayer: playerA,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: () => true,
      faCallback: () => null,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom(SEED),
      maxYears: 25
    });
    
    if (!originalResult.history[0].madePlayoffs) {
      // Skip silently — el user no clasificó con este seed
      return;
    }
    
    const initState = initializeCareer({
      teams, userPlayer: playerB, userTeamId: teams[0].id,
      startYear: 0, rngSeed: SEED
    });
    
    const stepResult = runStepByStepUntilOffseason(initState);
    
    // El número de games de playoff del user en step-by-step debe coincidir 
    // con cuántos rounds llegó en el original
    const expectedPlayoffGames = countPlayoffGamesByExitRound(originalResult.history[0].playoffExitRound);
    const stepPlayoffGames = stepResult.games.length - 17; // games totales - 17 regular
    
    expect(stepPlayoffGames).toBe(expectedPlayoffGames);
  });
});

describe('Equivalencia carrera completa multi-year', () => {
  const teams = loadTeams();
  
  it('CareerResult final es idéntico entre simulateCareer y step-by-step', () => {
    const SEED = 'full-equivalence-seed-1';
    
    // Setup idéntico para ambos caminos. Jugador VIEJO + OVR bajo para que se 
    // retire por callback en pocos years (acelera test).
    const playerA = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-full'), options: { ageOverride: 36 } });
    playerA.overall = 70;
    const playerB = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p-full'), options: { ageOverride: 36 } });
    playerB.overall = 70;
    
    const faCallback = () => null;
    const wealthCallback = () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] });
    const retireCallback = () => true;  // acepta retiro cuando se sugiere
    
    // === CAMINO A: simulateCareer original ===
    const resultA = simulateCareer({
      teams,
      userPlayer: playerA,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: retireCallback,
      faCallback,
      wealthCallback,
      rng: new SeededRandom(SEED),
      maxYears: 25
    });
    
    // === CAMINO B: step-by-step ===
    let state = initializeCareer({
      teams,
      userPlayer: playerB,
      userTeamId: teams[0].id,
      startYear: 0,
      rngSeed: SEED
    });
    
    let safetyCounter = 0;
    while (state.phase !== 'retired') {
      safetyCounter++;
      if (safetyCounter > 1000) {
        throw new Error(`Safety limit reached in step-by-step loop. Phase: ${state.phase}, Year: ${state.currentYear}`);
      }
      
      if (state.phase === 'preseason' || state.phase === 'regular_season' || state.phase === 'playoffs') {
        const r = simulateNextGame(state);
        state = r.state;
      } else if (state.phase === 'offseason_contracts') {
        // Llamar al "callback" simulado: devolvemos null como faCallback
        state = processOffseasonContracts(state, null);
      } else if (state.phase === 'offseason_wealth') {
        state = processOffseasonWealth(state, { 
          buyPropertyIds: [], sellPropertyIds: [], 
          buyVehicleIds: [], sellVehicleIds: [] 
        });
      } else if (state.phase === 'offseason_retirement_choice') {
        // Replicar el callback del test original (retireCallback => true)
        state = processOffseasonRetirement(state, true);
      } else if (state.phase === 'offseason_ready') {
        state = startNextYear(state);
      } else {
        throw new Error(`Unexpected phase: ${state.phase}`);
      }
    }
    
    const resultB = finalizeCareer(state);
    
    // === COMPARACIÓN ===
    
    expect(resultB.yearsPlayed).toBe(resultA.yearsPlayed);
    expect(resultB.retirementReason).toBe(resultA.retirementReason);
    expect(resultB.peakOverall).toBe(resultA.peakOverall);
    expect(resultB.championshipsWon).toBe(resultA.championshipsWon);
    expect(resultB.superBowlAppearances).toBe(resultA.superBowlAppearances);
    expect(resultB.userDraftPick).toBe(resultA.userDraftPick);
    expect(resultB.startYear).toBe(resultA.startYear);
    expect(resultB.endYear).toBe(resultA.endYear);
    
    // Stats acumulados
    expect(resultB.careerRegularStats.passYards).toBe(resultA.careerRegularStats.passYards);
    expect(resultB.careerRegularStats.passTDs).toBe(resultA.careerRegularStats.passTDs);
    expect(resultB.careerRegularStats.interceptions).toBe(resultA.careerRegularStats.interceptions);
    expect(resultB.careerRegularStats.completions).toBe(resultA.careerRegularStats.completions);
    expect(resultB.careerRegularStats.passAttempts).toBe(resultA.careerRegularStats.passAttempts);
    expect(resultB.careerRegularStats.gamesPlayed).toBe(resultA.careerRegularStats.gamesPlayed);
    
    // History entries — comparar longitud y campos clave
    expect(resultB.history.length).toBe(resultA.history.length);
    for (let i = 0; i < resultA.history.length; i++) {
      const hA = resultA.history[i];
      const hB = resultB.history[i];
      expect(hB.year).toBe(hA.year);
      expect(hB.ageAtSeason).toBe(hA.ageAtSeason);
      expect(hB.teamId).toBe(hA.teamId);
      expect(hB.regularSeasonRecord.wins).toBe(hA.regularSeasonRecord.wins);
      expect(hB.regularSeasonRecord.losses).toBe(hA.regularSeasonRecord.losses);
      expect(hB.regularSeasonRecord.ties).toBe(hA.regularSeasonRecord.ties);
      expect(hB.madePlayoffs).toBe(hA.madePlayoffs);
      expect(hB.playoffExitRound).toBe(hA.playoffExitRound);
    }
    
    // Player final
    expect(resultB.playerAtEnd.overall).toBe(resultA.playerAtEnd.overall);
    expect(resultB.playerAtEnd.age).toBe(resultA.playerAtEnd.age);
    
    // Contracts history
    expect(resultB.contractsHistory.totalEarnings).toBe(resultA.contractsHistory.totalEarnings);
    expect(resultB.contractsHistory.events.length).toBe(resultA.contractsHistory.events.length);
  });
});

// Helper: convertir exit round a número de games jugados
function countPlayoffGamesByExitRound(exitRound: any): number {
  if (exitRound === 'wild_card') return 1;
  if (exitRound === 'divisional') return 2;
  if (exitRound === 'championship') return 3;
  if (exitRound === 'champion') return 4;
  if (exitRound === null || exitRound === undefined) return 0;
  return 0;
}
