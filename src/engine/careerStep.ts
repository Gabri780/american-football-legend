import { Player } from './player';
import { Team } from './team';
import { SeededRandom } from './prng';
import { Schedule, PlayerSeasonStats, SeasonResult, simulateSeason } from './season';
import { Game } from './game';
import { PlayoffRound, PlayoffsResult, simulatePlayoffs } from './playoffs';
import { 
  Contract, ContractsHistory, ContractOffer, FreeAgencyContext, 
  generateRookieContract,
  processOffseasonContracts as processOffseasonContractsInternal 
} from './contracts';
import { 
  WealthState, WealthHistory, WealthDecisions, 
  initializeWealth,
  processOffseasonWealth as processOffseasonWealthInternal 
} from './wealth';
import { CareerResult, RetirementReason, SeasonHistoryEntry } from './career';
import { generateSchedule } from './schedule';
import { progressPlayer } from './progression';

/**
 * Phase of the career flow. The motor enforces transitions:
 *   preseason → regular_season → playoffs → offseason_contracts → offseason_wealth → offseason_ready → preseason ...
 *   o → retired (en cualquier offseason)
 */
export type CareerPhase = 
  | 'preseason'           // antes del primer game del año en curso
  | 'regular_season'      // simulando regular season games
  | 'playoffs'            // simulando playoff games (solo si el equipo del usuario clasificó)
  | 'offseason_contracts' // esperando decisión de FA/extensión/cut
  | 'offseason_wealth'    // esperando decisión de compras de patrimonio
  | 'offseason_ready'     // offseason completo, listo para startNextYear()
  | 'retired';            // carrera terminada, no hay más transiciones

/**
 * Estado completo de una carrera en curso. Inmutable: las funciones devuelven 
 * un nuevo state, nunca mutan el original.
 * 
 * Es JSON-serializable para AsyncStorage en la UI móvil.
 */
export interface CareerState {
  // Phase tracking
  phase: CareerPhase;
  
  // Identidad de la carrera
  startYear: number;
  currentYear: number;
  yearsPlayed: number;
  
  // Snapshot de la liga (clones internos del motor, NO los teams originales)
  currentTeams: Team[];
  
  // Jugador
  currentPlayer: Player;
  playerAtStart: Player;  // snapshot inicial
  peakOverall: number;
  
  // Equipo actual
  currentTeamId: string;
  
  // Año en curso
  currentSchedule: Schedule | null;       // null durante offseason
  gamesPlayedThisYear: number;            // 0 al inicio, hasta 17
  currentGameIndex: number;               // próximo game a simular en schedule.games
  currentSeasonResult: SeasonResult | null;  // se llena al inicio de regular_season
  currentPlayoffsResult: PlayoffsResult | null;  // se llena al inicio de playoffs
  inPlayoffs: boolean;                    // true si user clasificó este year
  
  // Colas de juegos pre-simulados
  userRegularGamesQueue: Game[];
  currentRegularGameIndex: number;
  userPlayoffGamesQueue: Game[];
  currentPlayoffGameIndex: number;

  // Stats acumuladas de carrera
  history: SeasonHistoryEntry[];
  careerRegularStats: PlayerSeasonStats;
  careerPlayoffStats: PlayerSeasonStats;
  championshipsWon: number;
  superBowlAppearances: number;
  
  // Sistema de contratos
  currentContract: Contract;
  contractsHistory: ContractsHistory;
  pendingContractOffers: ContractOffer[] | null;  // se llena en offseason_contracts
  pendingContractContext: FreeAgencyContext | null;
  
  // Sistema de patrimonio
  wealthState: WealthState;
  wealthHistory: WealthHistory;
  
  // Draft pick
  userDraftPick: number;
  
  // Stats recientes (últimas 1-3 temporadas, para market score)
  recentStatsHistory: PlayerSeasonStats[];
  
  // Retirement
  retirementReason: RetirementReason | null;  // null hasta retirement
  
  // Year-end tracking
  pendingEarningsThisYear: number;     // se llena en processOffseasonContracts, se consume en processOffseasonWealth
  ovrAtStartOfCurrentYear: number;     // se setea al inicio del year, se usa al construir history entry

  // RNG state — para reanudar carrera con mismo determinismo
  rngSeed: string;       // seed maestro de la carrera
  rngStepCount: number;  // cuántas veces se ha derivado el rng (necesario para reanudar)
}

/**
 * Resultado de simular UN game.
 */
export interface NextGameResult {
  state: CareerState;
  game: Game;                          // el game simulado completo (drives, score, etc.)
  isLastGameOfRegularSeason: boolean;  // true si fue el game 17
  isLastPlayoffGame: boolean;          // true si fue Championship Bowl o user fue eliminado
}

/**
 * Resultado de simular UN year completo (atajo "Skip Year").
 * Combina todos los games + offseason. Requiere decisiones precargadas.
 */
export interface NextYearResult {
  state: CareerState;
  seasonResult: SeasonResult;
  playoffsResult: PlayoffsResult | null;  // null si no clasificó
  contractEvent: import('./contracts').ContractEvent | null;
  wealthEvents: import('./wealth').WealthEvent[];
}

/**
 * Decisiones que la UI debe pasar para skipear un year completo (atajo).
 */
export interface SkipYearDecisions {
  faDecision: ((offers: ContractOffer[], ctx: FreeAgencyContext) => ContractOffer | null);
  wealthDecisions: WealthDecisions;
}

/**
 * Decisión del usuario en offseason_contracts. Devuelve la oferta elegida 
 * o null para retirarse.
 */
export type ContractDecision = ContractOffer | null;

// ═══════════════════════════════════════════════════════════════════════════
// API PÚBLICA — funciones a implementar en Phase 2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crea un CareerState inicial. Equivalente a las primeras líneas de simulateCareer 
 * antes del while loop. Asigna rookie contract, calcula draft pick, inicializa wealth.
 * 
 * Phase final: 'preseason'.
 */
export function initializeCareer(params: {
  teams: Team[];
  userPlayer: Player;
  userTeamId: string;
  startYear: number;
  rngSeed: string;
}): CareerState {
  const { teams, userPlayer, userTeamId, startYear, rngSeed } = params;
  
  // 1. Validaciones (igual que simulateCareer)
  if (!teams.find(t => t.id === userTeamId)) {
    throw new Error(`userTeamId ${userTeamId} not found in teams array.`);
  }
  if (userPlayer.position !== 'QB' && userPlayer.position !== 'RB' && userPlayer.position !== 'WR') {
    throw new Error(`userPlayer.position must be QB, RB, or WR. Got ${userPlayer.position}.`);
  }
  
  // 2. Calcular draft pick (replica calculateUserDraftPick de career.ts)
  const sorted = [...teams].sort((a, b) => {
    const combinedA = a.offenseRating + a.defenseRating;
    const combinedB = b.offenseRating + b.defenseRating;
    if (combinedA !== combinedB) return combinedA - combinedB;
    return a.id.localeCompare(b.id);
  });
  const pickIndex = sorted.findIndex(t => t.id === userTeamId);
  if (pickIndex === -1) {
    throw new Error(`userTeamId ${userTeamId} not found when calculating draft pick`);
  }
  const userDraftPick = pickIndex + 1;
  
  // 3. Snapshots inmutables
  const playerAtStart = structuredClone(userPlayer);
  const currentPlayer = structuredClone(userPlayer);
  const currentTeams = structuredClone(teams);
  
  // 4. Stats vacías para acumular
  const emptyStats: PlayerSeasonStats = {
    playerId: userPlayer.id,
    gamesPlayed: 0, passYards: 0, passTDs: 0, interceptions: 0,
    completions: 0, passAttempts: 0, rushYards: 0, rushTDs: 0,
    carries: 0, fumbles: 0, receivingYards: 0, receivingTDs: 0,
    receptions: 0, targets: 0
  };
  
  // 5. RNG raíz para derivar sub-rngs
  const rng = new SeededRandom(rngSeed);
  
  // 6. Rookie contract
  const rookieRng = rng.derive('rookie-contract');
  const currentContract = generateRookieContract(currentPlayer, userTeamId, startYear, rookieRng);
  
  // 7. ContractsHistory inicial con evento rookie_signed
  const contractsHistory: ContractsHistory = {
    events: [{
      year: startYear,
      type: 'rookie_signed',
      newTeamId: userTeamId,
      contractValue: currentContract.salaryPerYear * currentContract.yearsTotal,
      yearsTotal: currentContract.yearsTotal,
      guaranteedTotal: currentContract.guaranteedTotal
    }],
    totalEarnings: 0
  };
  
  // 8. Wealth inicial
  const wealthRng = rng.derive('wealth-init');
  const wealthState = initializeWealth(userTeamId, wealthRng);
  const wealthHistory: WealthHistory = { events: [] };
  
  // 9. Construir CareerState inicial
  return {
    phase: 'preseason',
    
    startYear,
    currentYear: startYear,
    yearsPlayed: 0,
    
    currentTeams,
    
    currentPlayer,
    playerAtStart,
    peakOverall: currentPlayer.overall,
    
    currentTeamId: userTeamId,
    
    currentSchedule: null,
    gamesPlayedThisYear: 0,
    currentGameIndex: 0,
    currentSeasonResult: null,
    currentPlayoffsResult: null,
    inPlayoffs: false,

    userRegularGamesQueue: [],
    currentRegularGameIndex: 0,
    userPlayoffGamesQueue: [],
    currentPlayoffGameIndex: 0,
    
    history: [],
    careerRegularStats: { ...emptyStats },
    careerPlayoffStats: { ...emptyStats },
    championshipsWon: 0,
    superBowlAppearances: 0,
    
    currentContract,
    contractsHistory,
    pendingContractOffers: null,
    pendingContractContext: null,
    
    wealthState,
    wealthHistory,
    
    userDraftPick,
    
    recentStatsHistory: [],
    
    retirementReason: null,
    
    pendingEarningsThisYear: 0,
    ovrAtStartOfCurrentYear: currentPlayer.overall,
    
    rngSeed,
    rngStepCount: 0 
  };
}

/**
 * Simula UN game (siguiente en el schedule del año actual).
 * 
 * Solo válido en phases: 'preseason' (transiciona a 'regular_season' y simula game 1) 
 * o 'regular_season' o 'playoffs'.
 */
export function simulateNextGame(state: CareerState): NextGameResult {
  // VALIDACIÓN
  if (state.phase === 'retired') {
    throw new Error('Cannot simulate game: career is retired');
  }
  if (state.phase === 'offseason_contracts' || 
      state.phase === 'offseason_wealth' || 
      state.phase === 'offseason_ready') {
    throw new Error(`Cannot simulate game: phase is '${state.phase}'. Process offseason first.`);
  }

  // === RAMA 1: PRESEASON → REGULAR_SEASON ===
  if (state.phase === 'preseason') {
    // 1. Generar schedule
    const scheduleRng = new SeededRandom(state.rngSeed).derive(`schedule-y${state.currentYear}`);
    const schedule = generateSchedule(state.currentTeams, state.currentYear, scheduleRng);

    // 2. Simular temporada completa (Consistencia con motor original)
    const seasonRng = new SeededRandom(state.rngSeed).derive(`season-y${state.currentYear}`);
    const seasonResult = simulateSeason({
      teams: state.currentTeams,
      schedule,
      userPlayer: state.currentPlayer,
      userTeamId: state.currentTeamId,
      rng: seasonRng
    });

    // 3. Extraer 17 partidos del usuario
    const userRegularGamesQueue: Game[] = [];
    for (const week of seasonResult.weekSummaries) {
      for (const gr of week.games) {
        if (gr.userGame) {
          userRegularGamesQueue.push(gr.userGame);
        }
      }
    }

    if (userRegularGamesQueue.length !== 17) {
      throw new Error(`Expected 17 user games, found ${userRegularGamesQueue.length}`);
    }

    // 4. Actualizar state y devolver el primer game
    const newState: CareerState = {
      ...state,
      phase: 'regular_season',
      currentSchedule: schedule,
      currentSeasonResult: seasonResult,
      userRegularGamesQueue,
      currentRegularGameIndex: 0
    };

    return serveRegularSeasonGame(newState);
  }

  // === RAMA 2: REGULAR_SEASON ===
  if (state.phase === 'regular_season') {
    return serveRegularSeasonGame(state);
  }

  // === RAMA 3: PLAYOFFS ===
  if (state.phase === 'playoffs') {
    return servePlayoffsGame(state);
  }

  throw new Error(`Unexpected phase: ${state.phase}`);
}

/**
 * Helper para devolver el siguiente game de regular season de la cola.
 */
function serveRegularSeasonGame(state: CareerState): NextGameResult {
  if (state.currentRegularGameIndex >= state.userRegularGamesQueue.length) {
    throw new Error('No more regular season games in queue');
  }

  const game = state.userRegularGamesQueue[state.currentRegularGameIndex];
  const isLastRegularGame = state.currentRegularGameIndex === 16;

  // Actualizar stats de carrera (opcional, o se puede hacer al final del year)
  // Por ahora lo dejamos igual que el motor original: se acumula al final del year.
  // Pero la UI podría sumar game.userPlayerStats a un acumulador local.

  if (!isLastRegularGame) {
    return {
      state: {
        ...state,
        currentRegularGameIndex: state.currentRegularGameIndex + 1,
        gamesPlayedThisYear: state.gamesPlayedThisYear + 1
      },
      game,
      isLastGameOfRegularSeason: false,
      isLastPlayoffGame: false
    };
  }

  // === ÚLTIMO PARTIDO: Decidir clasificación a Playoffs ===
  if (!state.currentSeasonResult) throw new Error('Missing currentSeasonResult at end of season');

  const playoffsRng = new SeededRandom(state.rngSeed).derive(`playoffs-y${state.currentYear}`);
  const playoffsResult = simulatePlayoffs({
    seasonResult: state.currentSeasonResult,
    teams: state.currentTeams,
    userPlayer: state.currentPlayer,
    userTeamId: state.currentTeamId,
    rng: playoffsRng
  });

  if (playoffsResult.userMadePlayoffs) {
    // Extraer partidos del user en playoffs
    const allPlayoffGames: Game[] = [];
    if (playoffsResult.games.wildCard) allPlayoffGames.push(...playoffsResult.games.wildCard.map(pg => pg.game));
    if (playoffsResult.games.divisional) allPlayoffGames.push(...playoffsResult.games.divisional.map(pg => pg.game));
    if (playoffsResult.games.conferenceChampionship) allPlayoffGames.push(...playoffsResult.games.conferenceChampionship.map(pg => pg.game));
    if (playoffsResult.games.championshipBowl) allPlayoffGames.push(playoffsResult.games.championshipBowl.game);

    const userPlayoffGamesQueue = allPlayoffGames.filter(g => 
      g.homeTeamId === state.currentTeamId || g.awayTeamId === state.currentTeamId
    );

    return {
      state: {
        ...state,
        phase: 'playoffs',
        inPlayoffs: true,
        currentSeasonResult: state.currentSeasonResult,
        currentPlayoffsResult: playoffsResult,
        userPlayoffGamesQueue,
        currentPlayoffGameIndex: 0,
        currentRegularGameIndex: state.currentRegularGameIndex + 1,
        gamesPlayedThisYear: state.gamesPlayedThisYear + 1
      },
      game,
      isLastGameOfRegularSeason: true,
      isLastPlayoffGame: false
    };
  } else {
    // No clasificó
    return {
      state: {
        ...state,
        phase: 'offseason_contracts',
        inPlayoffs: false,
        currentRegularGameIndex: state.currentRegularGameIndex + 1,
        gamesPlayedThisYear: state.gamesPlayedThisYear + 1
      },
      game,
      isLastGameOfRegularSeason: true,
      isLastPlayoffGame: false
    };
  }
}

/**
 * Helper para devolver el siguiente game de playoffs de la cola.
 */
function servePlayoffsGame(state: CareerState): NextGameResult {
  if (state.currentPlayoffGameIndex >= state.userPlayoffGamesQueue.length) {
    throw new Error('No more playoff games in queue');
  }

  const game = state.userPlayoffGamesQueue[state.currentPlayoffGameIndex];
  const isLastPlayoffGame = state.currentPlayoffGameIndex === (state.userPlayoffGamesQueue.length - 1);

  if (!isLastPlayoffGame) {
    return {
      state: {
        ...state,
        currentPlayoffGameIndex: state.currentPlayoffGameIndex + 1
      },
      game,
      isLastGameOfRegularSeason: false,
      isLastPlayoffGame: false
    };
  }

  // Transición a Offseason
  return {
    state: {
      ...state,
      phase: 'offseason_contracts',
      currentPlayoffGameIndex: state.currentPlayoffGameIndex + 1
    },
    game,
    isLastGameOfRegularSeason: false,
    isLastPlayoffGame: true
  };
}

/**
 * Procesa la decisión de free agency / extension / cut.
 * Solo válido en phase 'offseason_contracts'.
 * 
 * Si decision es null y el contrato actual expiró → phase 'retired'.
 * Si decision es una oferta válida → actualiza currentContract, currentTeamId, 
 *   transiciona a phase 'offseason_wealth'.
 */
export function processOffseasonContracts(state: CareerState, decision: ContractDecision): CareerState {
  if (state.phase !== 'offseason_contracts') {
    throw new Error(`processOffseasonContracts requires phase 'offseason_contracts', got '${state.phase}'`);
  }
  
  // Construir recentTeamRecords desde currentSeasonResult.finalStandings
  const recentTeamRecords = new Map<string, number>();
  if (state.currentSeasonResult) {
    for (const s of state.currentSeasonResult.finalStandings) {
      recentTeamRecords.set(s.teamId, s.wins);
    }
  }
  
  // Llamar a processOffseasonContracts del motor original
  // Workaround: crear un faCallback que SIEMPRE devuelve la decision pasada.
  const faCallback = (offers: ContractOffer[], ctx: FreeAgencyContext) => decision;
  
  const offseasonRng = new SeededRandom(state.rngSeed).derive(`contracts-y${state.currentYear}`);
  
  const offseasonResult = processOffseasonContractsInternal({
    player: state.currentPlayer,
    currentContract: state.currentContract,
    currentYear: state.currentYear,
    yearsPlayed: state.yearsPlayed,
    recentStats: state.recentStatsHistory.slice(-2),
    recentTeamRecords,
    teams: state.currentTeams,
    faCallback,
    rng: offseasonRng
  });
  
  // Aplicar resultado al state
  const newContractsHistory: ContractsHistory = {
    events: [...state.contractsHistory.events, ...offseasonResult.contractEvents],
    totalEarnings: state.contractsHistory.totalEarnings + offseasonResult.earningsThisYear
  };
  
  if (offseasonResult.retired) {
    return {
      ...state,
      phase: 'retired',
      retirementReason: 'no_market',
      contractsHistory: newContractsHistory
    };
  }
  
  // Continuar a offseason_wealth
  return {
    ...state,
    phase: 'offseason_wealth',
    currentContract: offseasonResult.newContract!,
    currentTeamId: offseasonResult.newContract!.teamId,
    contractsHistory: newContractsHistory,
    pendingEarningsThisYear: offseasonResult.earningsThisYear
  };
}

/**
 * Procesa las compras/ventas del usuario en wealth.
 * Solo válido en phase 'offseason_wealth'.
 * 
 * Aplica salario, devaluación, mantenimiento, ventas, compras, rotación del mercado.
 * Transiciona a phase 'offseason_ready' (o 'retired' si decideRetirement por edad).
 */
export function processOffseasonWealth(state: CareerState, decisions: WealthDecisions): CareerState {
  if (state.phase !== 'offseason_wealth') {
    throw new Error(`processOffseasonWealth requires phase 'offseason_wealth', got '${state.phase}'`);
  }
  
  // El motor original requiere un decisionsCallback que devuelva las decisions
  const decisionsCallback = () => decisions;
  
  const wealthRng = new SeededRandom(state.rngSeed).derive(`wealth-y${state.currentYear}`);
  
  const wealthResult = processOffseasonWealthInternal({
    player: state.currentPlayer,
    currentState: state.wealthState,
    currentYear: state.currentYear,
    grossEarningsThisYear: state.pendingEarningsThisYear,
    userTeamId: state.currentTeamId,
    decisionsCallback,
    rng: wealthRng
  });
  
  const newWealthHistory: WealthHistory = {
    events: [...state.wealthHistory.events, ...wealthResult.events]
  };
  
  // Crear state intermedio con wealth aplicado
  const stateAfterWealth: CareerState = {
    ...state,
    wealthState: wealthResult.newState,
    wealthHistory: newWealthHistory,
    pendingEarningsThisYear: 0
  };
  
  // === CHECK retirement (replica decideRetirement de career.ts) ===
  const FORCED_MAX = { QB: 42, RB: 36, WR: 38 };
  const maxAge = FORCED_MAX[stateAfterWealth.currentPlayer.position as keyof typeof FORCED_MAX];
  
  if (stateAfterWealth.currentPlayer.age >= maxAge) {
    return {
      ...stateAfterWealth,
      phase: 'retired',
      retirementReason: 'forced_max_age'
    };
  }
  
  // Si no se retiró: transición a offseason_ready
  return {
    ...stateAfterWealth,
    phase: 'offseason_ready'
  };
}

/**
 * Inicia el siguiente year. Solo válido en phase 'offseason_ready'.
 * Avanza año, genera nuevo schedule, ejecuta progressPlayer y ageLeague.
 * Transiciona a phase 'preseason'.
 */
export function startNextYear(state: CareerState): CareerState {
  if (state.phase !== 'offseason_ready') {
    throw new Error(`startNextYear requires phase 'offseason_ready', got '${state.phase}'`);
  }
  
  // === Construir SeasonHistoryEntry del year que acaba de terminar ===
  let playoffsResult = state.currentPlayoffsResult;
  let userPlayoffExitRound: PlayoffRound | 'champion' | null = null;
  let championshipsWonDelta = 0;
  let superBowlAppearancesDelta = 0;
  let careerPlayoffStatsDelta = state.careerPlayoffStats;
  
  if (state.inPlayoffs && playoffsResult) {
    userPlayoffExitRound = playoffsResult.userPlayoffExitRound;
    if (userPlayoffExitRound === 'champion') {
      championshipsWonDelta = 1;
      superBowlAppearancesDelta = 1;
    } else if (userPlayoffExitRound === 'championship') {
      superBowlAppearancesDelta = 1;
    }
    
    // Acumular stats de playoffs
    careerPlayoffStatsDelta = addStats(state.careerPlayoffStats, playoffsResult.playerPlayoffStats);
  }
  
  // Construir history entry
  const teamStandings = state.currentSeasonResult!.finalStandings.find(s => s.teamId === state.currentTeamId);
  if (!teamStandings) {
    throw new Error(`User team standings not found for ${state.currentTeamId}`);
  }
  
  // === progressPlayer (avanza age + atributos) ===
  const progressionRng = new SeededRandom(state.rngSeed).derive(`progression-y${state.currentYear}`);
  const progResult = progressPlayer(state.currentPlayer, { rng: progressionRng });
  const progressedPlayer = progResult.player;
  
  // === ageLeague (drift de team ratings) ===
  const leagueRng = new SeededRandom(state.rngSeed).derive(`league-aging-y${state.currentYear}`);
  const newTeams = structuredClone(state.currentTeams);
  ageLeagueInternal(newTeams, leagueRng);
  
  // === actualizar peakOverall ===
  const newPeakOverall = Math.max(state.peakOverall, progressedPlayer.overall);
  
  // === acumular careerRegularStats ===
  const newCareerRegularStats = addStats(state.careerRegularStats, state.currentSeasonResult!.playerSeasonStats);
  
  // === acumular recentStatsHistory ===
  const newRecentStatsHistory = [...state.recentStatsHistory, state.currentSeasonResult!.playerSeasonStats];
  
  // === CONSTRUIR HISTORY ENTRY ===
  const playoffStatsForHistory = state.inPlayoffs && playoffsResult 
    ? playoffsResult.playerPlayoffStats 
    : emptyPlayerSeasonStats(state.currentPlayer.id);
    
  const historyEntryFinal: SeasonHistoryEntry = {
    year: state.currentYear,
    ageAtSeason: state.currentPlayer.age,
    ovrAtStart: state.ovrAtStartOfCurrentYear,
    ovrAtEnd: state.currentPlayer.overall,
    teamId: state.currentTeamId,
    regularSeasonRecord: {
      wins: teamStandings.wins,
      losses: teamStandings.losses,
      ties: teamStandings.ties
    },
    madePlayoffs: state.inPlayoffs,
    playoffExitRound: userPlayoffExitRound,
    regularSeasonStats: state.currentSeasonResult!.playerSeasonStats,
    playoffStats: playoffStatsForHistory,
    championOfLeague: userPlayoffExitRound === 'champion',
    leagueChampionTeamId: playoffsResult ? playoffsResult.champion : '',
    leagueRunnerUpTeamId: playoffsResult ? playoffsResult.runnerUp : ''
  };
  
  // === retornar nuevo state con todo aplicado ===
  return {
    ...state,
    phase: 'preseason',
    currentYear: state.currentYear + 1,
    yearsPlayed: state.yearsPlayed + 1,
    currentPlayer: progressedPlayer,
    currentTeams: newTeams,
    peakOverall: newPeakOverall,
    
    // Reset de campos year-specific
    currentSchedule: null,
    gamesPlayedThisYear: 0,
    currentGameIndex: 0,
    currentSeasonResult: null,
    currentPlayoffsResult: null,
    inPlayoffs: false,
    userRegularGamesQueue: [],
    currentRegularGameIndex: 0,
    userPlayoffGamesQueue: [],
    currentPlayoffGameIndex: 0,
    
    // Acumular history
    history: [...state.history, historyEntryFinal],
    careerRegularStats: newCareerRegularStats,
    careerPlayoffStats: careerPlayoffStatsDelta,
    championshipsWon: state.championshipsWon + championshipsWonDelta,
    superBowlAppearances: state.superBowlAppearances + superBowlAppearancesDelta,
    recentStatsHistory: newRecentStatsHistory,
    
    // ovrAtStartOfCurrentYear ahora es el OVR del nuevo year
    ovrAtStartOfCurrentYear: progressedPlayer.overall
  };
}

/**
 * Atajo: simula un year completo (regular season + playoffs + offseason) 
 * usando decisiones precargadas. Equivalente a llamar simulateNextGame() N veces 
 * + processOffseasonContracts + processOffseasonWealth + startNextYear.
 * 
 * Solo válido en phase 'preseason' o 'regular_season' (al inicio del year).
 */
export function simulateNextYear(state: CareerState, decisions: SkipYearDecisions): NextYearResult {
  throw new Error('Not implemented yet — Phase 2');
}

/**
 * Helper: ¿la carrera ha terminado?
 */
export function isCareerOver(state: CareerState): boolean {
  return state.phase === 'retired';
}

/**
 * Construye el CareerResult final (compatible con la firma actual de simulateCareer).
 * Solo válido si state.phase === 'retired'.
 */
export function finalizeCareer(state: CareerState): CareerResult {
  if (state.phase !== 'retired') {
    throw new Error(`finalizeCareer requires phase === 'retired', got '${state.phase}'`);
  }
  if (state.retirementReason === null) {
    throw new Error(`finalizeCareer requires retirementReason set, got null`);
  }
  
  return {
    playerAtStart: state.playerAtStart,
    playerAtEnd: state.currentPlayer,
    startYear: state.startYear,
    endYear: state.startYear + state.yearsPlayed,
    yearsPlayed: state.yearsPlayed,
    retirementReason: state.retirementReason,
    peakOverall: state.peakOverall,
    history: state.history,
    careerRegularStats: state.careerRegularStats,
    careerPlayoffStats: state.careerPlayoffStats,
    championshipsWon: state.championshipsWon,
    superBowlAppearances: state.superBowlAppearances,
    contractsHistory: state.contractsHistory,
    wealthState: state.wealthState,
    wealthHistory: state.wealthHistory,
    userDraftPick: state.userDraftPick
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS INTERNOS
// ═══════════════════════════════════════════════════════════════════════════

function addStats(a: PlayerSeasonStats, b: PlayerSeasonStats): PlayerSeasonStats {
  return {
    playerId: a.playerId,
    gamesPlayed: a.gamesPlayed + b.gamesPlayed,
    passYards: a.passYards + b.passYards,
    passTDs: a.passTDs + b.passTDs,
    interceptions: a.interceptions + b.interceptions,
    completions: a.completions + b.completions,
    passAttempts: a.passAttempts + b.passAttempts,
    rushYards: a.rushYards + b.rushYards,
    rushTDs: a.rushTDs + b.rushTDs,
    carries: a.carries + b.carries,
    fumbles: a.fumbles + b.fumbles,
    receivingYards: a.receivingYards + b.receivingYards,
    receivingTDs: a.receivingTDs + b.receivingTDs,
    receptions: a.receptions + b.receptions,
    targets: a.targets + b.targets
  };
}

function emptyPlayerSeasonStats(playerId: string): PlayerSeasonStats {
  return {
    playerId,
    gamesPlayed: 0, passYards: 0, passTDs: 0, interceptions: 0,
    completions: 0, passAttempts: 0, rushYards: 0, rushTDs: 0,
    carries: 0, fumbles: 0, receivingYards: 0, receivingTDs: 0,
    receptions: 0, targets: 0
  };
}

function ageLeagueInternal(teams: Team[], rng: SeededRandom): void {
  const LEAGUE_MEAN_RATING = 70;
  const REVERSION_STRENGTH = 0.05;
  
  for (const team of teams) {
    const offDistance = team.offenseRating - LEAGUE_MEAN_RATING;
    const defDistance = team.defenseRating - LEAGUE_MEAN_RATING;
    const offReversion = -offDistance * REVERSION_STRENGTH;
    const defReversion = -defDistance * REVERSION_STRENGTH;
    const offNoise = rng.randomInt(-3, 3);
    const defNoise = rng.randomInt(-3, 3);
    team.offenseRating = clampRating(Math.round(team.offenseRating + offReversion + offNoise));
    team.defenseRating = clampRating(Math.round(team.defenseRating + defReversion + defNoise));
  }
}

function clampRating(val: number): number {
  return Math.max(40, Math.min(99, val));
}

