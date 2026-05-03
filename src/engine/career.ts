import { Team } from './team';
import { Player } from './player';
import { generateSchedule } from './schedule';
import { TeamStandings, PlayerSeasonStats, SeasonResult, simulateSeason } from './season';
import { PlayoffRound, PlayoffsResult, simulatePlayoffs } from './playoffs';
import { SeededRandom } from './prng';
import { progressPlayer } from './progression';

export type RetirementReason =
  | 'age_threshold'
  | 'forced_max_age'
  | 'callback_chose'
  | 'no_market';

export interface RetireDecisionContext {
  player: Player;
  yearsPlayed: number;
  peakOverall: number;
}

export type RetireDecisionCallback = (ctx: RetireDecisionContext) => boolean;

export interface SeasonHistoryEntry {
  year: number;
  ageAtSeason: number;
  ovrAtStart: number;
  ovrAtEnd: number;
  teamId: string;
  regularSeasonRecord: { wins: number; losses: number; ties: number; };
  madePlayoffs: boolean;
  playoffExitRound: PlayoffRound | 'champion' | null;
  regularSeasonStats: PlayerSeasonStats;
  playoffStats: PlayerSeasonStats;
  championOfLeague: boolean;
  leagueChampionTeamId: string;
  leagueRunnerUpTeamId: string;
}

import { Contract, ContractsHistory, FreeAgencyDecisionCallback, generateRookieContract, processOffseasonContracts } from './contracts';
import { initializeWealth, processOffseasonWealth, WealthState, WealthHistory, WealthDecisionCallback } from './wealth';

export interface CareerResult {
  playerAtStart: Player;
  playerAtEnd: Player;
  startYear: number;
  endYear: number;
  yearsPlayed: number;
  retirementReason: RetirementReason;
  peakOverall: number;
  history: SeasonHistoryEntry[];
  careerRegularStats: PlayerSeasonStats;
  careerPlayoffStats: PlayerSeasonStats;
  championshipsWon: number;
  superBowlAppearances: number;
  contractsHistory: ContractsHistory;
  wealthState: WealthState;
  wealthHistory: WealthHistory;
  userDraftPick: number;  // 1-32, posición del usuario en el draft del startYear
}

function accumulateStats(target: PlayerSeasonStats, source: PlayerSeasonStats): void {
  target.gamesPlayed += source.gamesPlayed;
  target.passYards += source.passYards;
  target.passTDs += source.passTDs;
  target.interceptions += source.interceptions;
  target.completions += source.completions;
  target.passAttempts += source.passAttempts;
  target.rushYards += source.rushYards;
  target.rushTDs += source.rushTDs;
  target.carries += source.carries;
  target.fumbles += source.fumbles;
  target.receivingYards += source.receivingYards;
  target.receivingTDs += source.receivingTDs;
  target.receptions += source.receptions;
  target.targets += source.targets;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

const LEAGUE_MEAN_RATING = 70;
const REVERSION_STRENGTH = 0.05;

function ageLeague(teams: Team[], rng: SeededRandom): void {
  for (const team of teams) {
    // Reversion-to-mean: equipos extremos tienden al centro
    const offDistance = team.offenseRating - LEAGUE_MEAN_RATING;
    const defDistance = team.defenseRating - LEAGUE_MEAN_RATING;

    const offReversion = -offDistance * REVERSION_STRENGTH;
    const defReversion = -defDistance * REVERSION_STRENGTH;

    // Ruido random ±3
    const offNoise = rng.randomInt(-3, 3);
    const defNoise = rng.randomInt(-3, 3);

    // Aplicar y clamp
    team.offenseRating = clamp(Math.round(team.offenseRating + offReversion + offNoise), 40, 99);
    team.defenseRating = clamp(Math.round(team.defenseRating + defReversion + defNoise), 40, 99);
  }
}

function decideRetirement(
  player: Player,
  yearsPlayed: number,
  peakOverall: number,
  callback: RetireDecisionCallback
): RetirementReason | null {

  const FORCED_MAX = { QB: 40, RB: 33, WR: 36 };
  const SUGGEST_AGE = { QB: 33, RB: 28, WR: 30 };
  const SUGGEST_OVR = 80;

  const maxAge = FORCED_MAX[player.position as keyof typeof FORCED_MAX];
  const suggestAge = SUGGEST_AGE[player.position as keyof typeof SUGGEST_AGE];

  // 1. Cap forzado: retiro automático sin consultar
  if (player.age >= maxAge) return 'forced_max_age';

  // 2. Sugerencia: solo si edad Y OVR pasan umbral
  if (player.age >= suggestAge && player.overall <= SUGGEST_OVR) {
    const userChose = callback({
      player,
      yearsPlayed,
      peakOverall
    });
    if (userChose) return 'callback_chose';
  }

  return null;  // sigue jugando
}

export function simulateCareer(params: {
  teams: Team[];
  userPlayer: Player;
  userTeamId: string;
  startYear: number;
  retireDecisionCallback: RetireDecisionCallback;
  faCallback: FreeAgencyDecisionCallback;
  wealthCallback: WealthDecisionCallback;
  rng: SeededRandom;
  maxYears?: number;
}): CareerResult {
  const { teams, userPlayer, userTeamId, startYear, retireDecisionCallback, faCallback, wealthCallback, rng, maxYears = 25 } = params;

  if (!teams.find(t => t.id === userTeamId)) {
    throw new Error(`userTeamId ${userTeamId} not found in teams array.`);
  }

  const userDraftPick = calculateUserDraftPick(teams, userTeamId);

  if (userPlayer.position !== 'QB' && userPlayer.position !== 'RB' && userPlayer.position !== 'WR') {
    throw new Error(`userPlayer.position must be QB, RB, or WR. Got ${userPlayer.position}.`);
  }

  let currentPlayer = structuredClone(userPlayer);
  const currentTeams = structuredClone(teams);

  let peakOverall = currentPlayer.overall;
  const history: SeasonHistoryEntry[] = [];

  const careerRegularStats: PlayerSeasonStats = {
    gamesPlayed: 0, passYards: 0, passTDs: 0, interceptions: 0,
    completions: 0, passAttempts: 0, rushYards: 0, rushTDs: 0,
    carries: 0, fumbles: 0, receivingYards: 0, receivingTDs: 0,
    receptions: 0, targets: 0
  };

  const careerPlayoffStats: PlayerSeasonStats = {
    gamesPlayed: 0, passYards: 0, passTDs: 0, interceptions: 0,
    completions: 0, passAttempts: 0, rushYards: 0, rushTDs: 0,
    carries: 0, fumbles: 0, receivingYards: 0, receivingTDs: 0,
    receptions: 0, targets: 0
  };

  let championshipsWon = 0;
  let superBowlAppearances = 0;
  let currentYear = startYear;
  let yearsPlayed = 0;
  let retirementReason: RetirementReason | null = null;
  let currentTeamId = userTeamId;

  const contractsHistory: ContractsHistory = { events: [], totalEarnings: 0 };
  let currentContract = generateRookieContract(currentPlayer, currentTeamId, startYear, rng.derive('rookie-contract'));
  contractsHistory.events.push({
    year: startYear,
    type: 'rookie_signed',
    newTeamId: currentTeamId,
    contractValue: currentContract.salaryPerYear * currentContract.yearsTotal,
    yearsTotal: currentContract.yearsTotal,
    guaranteedTotal: currentContract.guaranteedTotal
  });

  let wealthState: WealthState = initializeWealth(userTeamId, rng.derive('wealth-init'));
  const wealthHistory: WealthHistory = { events: [] };

  const recentStatsHistory: PlayerSeasonStats[] = [];

  while (yearsPlayed < maxYears && retirementReason === null) {
    // 1. Capturar snapshot ANTES de simular
    const ageAtSeason = currentPlayer.age;
    const ovrAtStart = currentPlayer.overall;

    // 2. Generar schedule del año
    const scheduleRng = rng.derive(`schedule-y${currentYear}`);
    const schedule = generateSchedule(currentTeams, currentYear, scheduleRng);

    // 3. simulateSeason
    const seasonRng = rng.derive(`season-y${currentYear}`);
    const seasonResult = simulateSeason({
      teams: currentTeams,
      schedule,
      userPlayer: currentPlayer,
      userTeamId: currentTeamId,
      rng: seasonRng
    });

    // 4. simulatePlayoffs
    const playoffsRng = rng.derive(`playoffs-y${currentYear}`);
    const playoffsResult = simulatePlayoffs({
      seasonResult,
      teams: currentTeams,
      userPlayer: currentPlayer,
      userTeamId: currentTeamId,
      rng: playoffsRng
    });

    // 5. Acumular stats de carrera y contadores
    accumulateStats(careerRegularStats, seasonResult.playerSeasonStats);
    accumulateStats(careerPlayoffStats, playoffsResult.playerPlayoffStats);
    recentStatsHistory.push(seasonResult.playerSeasonStats);

    if (playoffsResult.userPlayoffExitRound === 'champion') {
      championshipsWon++;
    }
    if (playoffsResult.userPlayoffExitRound === 'champion' || playoffsResult.userPlayoffExitRound === 'championship') {
      superBowlAppearances++;
    }

    // 6. progressPlayer
    const progressionRng = rng.derive(`progression-y${currentYear}`);
    const progResult = progressPlayer(currentPlayer, { rng: progressionRng });
    currentPlayer = progResult.player;

    // 7. ageLeague
    ageLeague(currentTeams, rng.derive(`league-aging-y${currentYear}`));

    // 8. CAPTURAR ovrAtEnd (después de progressPlayer)
    const ovrAtEnd = currentPlayer.overall;

    // 9. Actualizar peakOverall
    if (currentPlayer.overall > peakOverall) {
      peakOverall = currentPlayer.overall;
    }

    // 10. Construir SeasonHistoryEntry
    const teamStandings = seasonResult.finalStandings.find(s => s.teamId === currentTeamId);
    if (!teamStandings) {
      throw new Error(`User team standings not found for ${currentTeamId}`);
    }

    const entry: SeasonHistoryEntry = {
      year: currentYear,
      ageAtSeason,
      ovrAtStart,
      ovrAtEnd,
      teamId: currentTeamId,
      regularSeasonRecord: {
        wins: teamStandings.wins,
        losses: teamStandings.losses,
        ties: teamStandings.ties
      },
      madePlayoffs: playoffsResult.userMadePlayoffs,
      playoffExitRound: playoffsResult.userPlayoffExitRound,
      regularSeasonStats: seasonResult.playerSeasonStats,
      playoffStats: playoffsResult.playerPlayoffStats,
      championOfLeague: playoffsResult.userPlayoffExitRound === 'champion',
      leagueChampionTeamId: playoffsResult.champion,
      leagueRunnerUpTeamId: playoffsResult.runnerUp
    };
    history.push(entry);

    // 11. Process Offseason Contracts (SIEMPRE cobra salario, maneja cuts/extensiones/FA)
    const recentTeamRecords = new Map<string, number>();
    for (const st of seasonResult.finalStandings) {
      recentTeamRecords.set(st.teamId, st.wins);
    }

    const offseasonResult = processOffseasonContracts({
      player: currentPlayer,
      currentContract,
      currentYear,
      yearsPlayed,
      recentStats: recentStatsHistory.slice(-2),
      recentTeamRecords,
      teams: currentTeams,
      faCallback,
      rng: rng.derive(`contracts-y${currentYear}`)
    });

    contractsHistory.events.push(...offseasonResult.contractEvents);
    contractsHistory.totalEarnings += offseasonResult.earningsThisYear;

    if (offseasonResult.retired) {
      retirementReason = 'no_market';
    } else {
      currentContract = offseasonResult.newContract!;
      currentTeamId = currentContract.teamId;

      const wealthResult = processOffseasonWealth({
        player: currentPlayer,
        currentState: wealthState,
        currentYear,
        grossEarningsThisYear: offseasonResult.earningsThisYear,
        userTeamId: currentTeamId,
        decisionsCallback: wealthCallback,
        rng: rng.derive(`wealth-y${currentYear}`)
      });

      wealthState = wealthResult.newState;
      wealthHistory.events.push(...wealthResult.events);
    }

    // 12. decideRetirement (solo si no se retiró por FA)
    if (retirementReason === null) {
      retirementReason = decideRetirement(currentPlayer, yearsPlayed + 1, peakOverall, retireDecisionCallback);
    }

    // 13. Increment years
    yearsPlayed++;
    currentYear++;
  }

  // Verificaciones finales
  if (history.length !== yearsPlayed) {
    throw new Error(`history length (${history.length}) does not match yearsPlayed (${yearsPlayed})`);
  }

  if (yearsPlayed < 1) {
    throw new Error("Career ended before 1 season was played.");
  }

  if (yearsPlayed >= maxYears && retirementReason === null) {
    throw new Error(`Reached maxYears cap (${maxYears}) without retiring.`);
  }

  return {
    playerAtStart: structuredClone(userPlayer),
    playerAtEnd: structuredClone(currentPlayer),
    startYear,
    endYear: startYear + yearsPlayed,
    yearsPlayed,
    retirementReason: retirementReason!,
    peakOverall,
    history,
    careerRegularStats,
    careerPlayoffStats,
    championshipsWon,
    superBowlAppearances,
    contractsHistory,
    wealthState,
    wealthHistory,
    userDraftPick
  };
}

/**
 * Calcula el pick number del usuario en su draft year.
 * Synthetic standings: peor combined rating (offense + defense) = pick #1.
 * Tiebreaker: teamId alfabético ascendente (igual que generateSchedule).
 * 
 * @returns pick number entre 1 y 32 inclusive
 */
function calculateUserDraftPick(teams: Team[], userTeamId: string): number {
  const sorted = [...teams].sort((a, b) => {
    const combinedA = a.offenseRating + a.defenseRating;
    const combinedB = b.offenseRating + b.defenseRating;
    if (combinedA !== combinedB) return combinedA - combinedB; // ASC: peor primero
    return a.id.localeCompare(b.id);
  });

  const pickIndex = sorted.findIndex(t => t.id === userTeamId);
  if (pickIndex === -1) {
    throw new Error(`userTeamId ${userTeamId} not found in teams when calculating draft pick`);
  }
  return pickIndex + 1; // 1-indexed
}
