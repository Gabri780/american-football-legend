import { Player } from './player';
import { Team } from './team';
import { SeededRandom } from './prng';
import { Schedule, PlayerSeasonStats, SeasonResult } from './season';
import { Game } from './game';
import { PlayoffsResult } from './playoffs';
import { Contract, ContractsHistory, ContractOffer, FreeAgencyContext } from './contracts';
import { WealthState, WealthHistory, WealthDecisions } from './wealth';
import { CareerResult, RetirementReason, SeasonHistoryEntry } from './career';

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
  currentSeasonResult: SeasonResult | null;  // se llena durante regular_season
  currentPlayoffsResult: PlayoffsResult | null;  // se llena durante playoffs
  inPlayoffs: boolean;                    // true si user clasificó este year
  
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
  throw new Error('Not implemented yet — Phase 2');
}

/**
 * Simula UN game (siguiente en el schedule del año actual).
 * 
 * Solo válido en phases: 'preseason' (transiciona a 'regular_season' y simula game 1) 
 * o 'regular_season' o 'playoffs'.
 * 
 * Si era el último game de regular season y el equipo del usuario NO clasificó, 
 * el state final tiene phase 'offseason_contracts'.
 * 
 * Si era el último game de regular season y el equipo SÍ clasificó, transiciona 
 * a phase 'playoffs' y simula el primer playoff game.
 * 
 * Si era el último playoff game (eliminado o championship), transiciona a 
 * 'offseason_contracts'.
 * 
 * Throw si phase es offseason_* o retired.
 */
export function simulateNextGame(state: CareerState): NextGameResult {
  throw new Error('Not implemented yet — Phase 2');
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
  throw new Error('Not implemented yet — Phase 2');
}

/**
 * Procesa las compras/ventas del usuario en wealth.
 * Solo válido en phase 'offseason_wealth'.
 * 
 * Aplica salario, devaluación, mantenimiento, ventas, compras, rotación del mercado.
 * Transiciona a phase 'offseason_ready' (o 'retired' si decideRetirement por edad).
 */
export function processOffseasonWealth(state: CareerState, decisions: WealthDecisions): CareerState {
  throw new Error('Not implemented yet — Phase 2');
}

/**
 * Inicia el siguiente year. Solo válido en phase 'offseason_ready'.
 * Avanza año, genera nuevo schedule, ejecuta progressPlayer y ageLeague.
 * Transiciona a phase 'preseason'.
 */
export function startNextYear(state: CareerState): CareerState {
  throw new Error('Not implemented yet — Phase 2');
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
  throw new Error('Not implemented yet — Phase 2');
}
