import { simulateDrive, Drive, GameContext } from './drive';
import { Player } from './player';
import { 
  PlayerDriveStats, 
  OffensiveScheme, 
  computePlayerDriveStats, 
  resolveTDAttribution,
  TDAttribution,
  QBDriveStats,
  RBDriveStats,
  WRDriveStats
} from './playerDriveStats';
import { SeededRandom } from './prng';
import { generateGameNarrative } from './gameNarrative';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Quarter = 1 | 2 | 3 | 4 | 'OT';

export interface GameClock {
  quarter: Quarter;
  secondsRemaining: number; // seconds remaining in the current quarter
}

export interface GameTeamStats {
  teamId: string;
  pointsScored: number;
  totalYards: number;
  drives: number;
  turnovers: number;
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;

  // Score
  homeScore: number;
  awayScore: number;
  winnerTeamId: string | null; // null on tie (only possible in NFL regular season)

  // Aggregated stats per team
  homeStats: GameTeamStats;
  awayStats: GameTeamStats;

  // Drives in order
  drives: Drive[];

  // Context
  context: GameContext;

  // For the user-player (if they played) — accumulated stats sum
  userPlayerStats: PlayerDriveStats | null;

  // Narrative (filled in 6E, empty string for now)
  summary: string;
  highlightPlay: string;

  // For narrative generation (Task 6E)
  userPlayer?: Player;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMS
// ─────────────────────────────────────────────────────────────────────────────

export interface SimulateGameParams {
  homeTeamId: string;
  awayTeamId: string;
  homeOffenseRating: number;  // 40-99
  homeDefenseRating: number;  // 40-99
  awayOffenseRating: number;  // 40-99
  awayDefenseRating: number;  // 40-99
  context: GameContext;
  userPlayer?: Player;                    // present if the user plays
  userPlayerTeam?: 'home' | 'away';
  userPlayerScheme?: OffensiveScheme;
  rng: SeededRandom;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates a full game between two teams using a 4-quarter clock.
 */
export function simulateGame(params: SimulateGameParams): Game {
  const { homeTeamId, awayTeamId, context, rng } = params;
  const userPlayer = params.userPlayer;
  const userTeam = params.userPlayerTeam;
  const userScheme = params.userPlayerScheme || 'Balanced';

  const homeStats: GameTeamStats = {
    teamId: homeTeamId, pointsScored: 0, totalYards: 0, drives: 0, turnovers: 0
  };
  const awayStats: GameTeamStats = {
    teamId: awayTeamId, pointsScored: 0, totalYards: 0, drives: 0, turnovers: 0
  };

  // Helpers for stats
  const initEmptyStats = (player: Player): PlayerDriveStats => {
    if (player.position === 'QB') {
      return { passAttempts: 0, completions: 0, passYards: 0, passTDs: 0, interceptions: 0, rushAttempts: 0, rushYards: 0, rushTDs: 0, sacks: 0, fumbles: 0 };
    } else if (player.position === 'RB') {
      return { carries: 0, rushYards: 0, rushTDs: 0, fumbles: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, targets: 0 };
    } else {
      return { targets: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, drops: 0 };
    }
  };

  const accumulateStats = (target: any, source: any) => {
    for (const key in source) {
      if (typeof source[key] === 'number') {
        target[key] = (target[key] || 0) + source[key];
      }
    }
  };

  let accumulatedUserStats: PlayerDriveStats | null = userPlayer ? initEmptyStats(userPlayer) : null;

  const drives: Drive[] = [];
  let currentQuarter: 1 | 2 | 3 | 4 | 5 = 1;
  let secondsRemainingInQuarter = 900;
  let currentPossession: 'home' | 'away' = 'away'; // Away receives opening kickoff
  let startYard = 25;

  const PASS_RATIO: Record<OffensiveScheme, number> = {
    AirRaid: 0.75, Balanced: 0.60, RunHeavy: 0.45
  };

  while (currentQuarter <= 4) {
    const q = currentQuarter as 1 | 2 | 3 | 4;
    const isHomeOffense = currentPossession === 'home';
    const offRating = isHomeOffense ? params.homeOffenseRating : params.awayOffenseRating;
    const defRating = isHomeOffense ? params.awayDefenseRating : params.homeDefenseRating;
    const offTeamId = isHomeOffense ? homeTeamId : awayTeamId;
    const defTeamId = isHomeOffense ? awayTeamId : homeTeamId;

    const drive = simulateDrive(
      offRating,
      defRating,
      offTeamId,
      defTeamId,
      startYard,
      q,
      context,
      rng
    );

    // Clock Logic
    let wasTruncated = false;
    if (drive.timeConsumed > secondsRemainingInQuarter) {
      drive.timeConsumed = secondsRemainingInQuarter;
      wasTruncated = true;
      drive.pointsScored = 0; // Truncated drives don't score in this simplified model
      if (q === 2) drive.outcome = 'END_HALF';
      if (q === 4) drive.outcome = 'END_GAME';
    }
    secondsRemainingInQuarter -= drive.timeConsumed;

    // TD Attribution & User Stats
    let tdAttribution: TDAttribution | undefined = undefined;
    if (drive.outcome === 'TD') {
      const ratio = PASS_RATIO[userScheme];
      tdAttribution = resolveTDAttribution(ratio, userPlayer?.archetype || 'non-mobile', rng);
    }

    if (userPlayer && userTeam === currentPossession) {
      const driveStats = computePlayerDriveStats(drive, userPlayer, userScheme, rng, tdAttribution);
      accumulateStats(accumulatedUserStats!, driveStats);
    }

    drives.push(drive);

    // Update Team Stats
    const offStats = isHomeOffense ? homeStats : awayStats;
    const defStats = isHomeOffense ? awayStats : homeStats;
    offStats.drives += 1;
    offStats.totalYards += Math.max(0, drive.totalYards);

    if (drive.outcome === 'SAFETY') {
      defStats.pointsScored += 2;
    } else {
      offStats.pointsScored += drive.pointsScored;
    }

    if (['TURNOVER_INT', 'TURNOVER_FUMBLE', 'DOWNS'].includes(drive.outcome)) {
      offStats.turnovers += 1;
    }

    // Possession & Position for NEXT drive
    if (wasTruncated && (q === 1 || q === 3)) {
      // Team keeps possession into the next quarter
      startYard = drive.endingYardLine;
    } else {
      // Normal possession flip
      currentPossession = isHomeOffense ? 'away' : 'home';
      switch (drive.outcome) {
        case 'PUNT':
          startYard = rng.randomInt(15, 30);
          break;
        case 'TD':
        case 'FG':
        case 'MISSED_FG':
        case 'SAFETY':
          startYard = 25;
          break;
        case 'TURNOVER_INT':
        case 'TURNOVER_FUMBLE':
        case 'DOWNS':
          startYard = Math.max(1, Math.min(99, 100 - drive.endingYardLine));
          break;
        default:
          startYard = 25;
          break;
      }
    }

    // Quarter Transition
    if (secondsRemainingInQuarter === 0) {
      if (q === 1) {
        currentQuarter = 2;
        secondsRemainingInQuarter = 900;
      } else if (q === 2) {
        currentQuarter = 3;
        secondsRemainingInQuarter = 900;
        currentPossession = 'home'; // Home receives 2nd half kickoff
        startYard = 25;
      } else if (q === 3) {
        currentQuarter = 4;
        secondsRemainingInQuarter = 900;
      } else {
        currentQuarter = 5; // END
      }
    }

    if (drives.length >= 50) break;
  }

  const homeScore = homeStats.pointsScored;
  const awayScore = awayStats.pointsScored;
  
  let winnerTeamId: string | null = null;
  if (homeScore > awayScore) winnerTeamId = homeTeamId;
  else if (awayScore > homeScore) winnerTeamId = awayTeamId;

  const gameResult: Game = {
    id: `game_${rng.randomInt(10000, 99999)}`,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    winnerTeamId,
    homeStats,
    awayStats,
    drives,
    context,
    userPlayerStats: accumulatedUserStats,
    summary: '',
    highlightPlay: '',
    userPlayer,
  };

  const narrative = generateGameNarrative(gameResult);
  gameResult.summary = narrative.summary;
  gameResult.highlightPlay = narrative.highlightPlay;

  return gameResult;
}
