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
import { Team } from './team';

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
  userDidNotPlay?: boolean;  // true if the user player did not play due to injury
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
  yearsPlayed: number;                    // Needed for injury protection
  currentYear: number;
  weekNumber: number;
  rng: SeededRandom;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

import { canPlayThisWeek, computeInjuryProbability, rollInjury } from './injuries';

/**
 * Simulates a full game between two teams using a 4-quarter clock.
 */
export function simulateGame(params: SimulateGameParams): Game {
  const { homeTeamId, awayTeamId, context, rng, yearsPlayed, currentYear, weekNumber } = params;
  const userPlayer = params.userPlayer;
  const userTeam = params.userPlayerTeam;
  const userScheme = params.userPlayerScheme || 'Balanced';

  let effectiveHomeOffense = params.homeOffenseRating;
  let effectiveAwayOffense = params.awayOffenseRating;

  const userDidNotPlay = userPlayer && !canPlayThisWeek(userPlayer);

  if (userDidNotPlay) {
    if (userTeam === 'home') effectiveHomeOffense = Math.max(40, effectiveHomeOffense - 10);
    else if (userTeam === 'away') effectiveAwayOffense = Math.max(40, effectiveAwayOffense - 10);
  }

  const homeStats: GameTeamStats = {
    teamId: homeTeamId, pointsScored: 0, totalYards: 0, drives: 0, turnovers: 0
  };
  const awayStats: GameTeamStats = {
    teamId: awayTeamId, pointsScored: 0, totalYards: 0, drives: 0, turnovers: 0
  };

  // Helpers for stats
  const initEmptyStats = (player: Player): PlayerDriveStats => {
    if (player.position === 'QB') {
      return { passAttempts: 0, completions: 0, passYards: 0, passTDs: 0, interceptions: 0, rushAttempts: 0, rushYards: 0, rushTDs: 0, sacks: 0, fumbles: 0, gamesPlayed: 0 };
    } else if (player.position === 'RB') {
      return { carries: 0, rushYards: 0, rushTDs: 0, fumbles: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, targets: 0, gamesPlayed: 0 };
    } else {
      return { targets: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, drops: 0, gamesPlayed: 0 };
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
  
  const gameId = `game_${rng.derive('gameId').randomInt(10000, 99999)}`;
  let driveCounter = 1;

  while (currentQuarter <= 4) {
    const q = currentQuarter as 1 | 2 | 3 | 4;
    const isHomeOffense = currentPossession === 'home';
    const offRating = isHomeOffense ? effectiveHomeOffense : effectiveAwayOffense;
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
      rng,
      gameId,
      driveCounter++
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

    if (userPlayer && !userDidNotPlay && userTeam === currentPossession) {
      const driveStats = computePlayerDriveStats(drive, userPlayer, userScheme, rng, tdAttribution);
      accumulateStats(accumulatedUserStats!, driveStats);
    }

    drives.push(drive);

    // Update Team Stats
    const offStats = isHomeOffense ? homeStats : awayStats;
    const defStats = isHomeOffense ? awayStats : homeStats;
    offStats.drives += 1;
    offStats.totalYards += Math.max(0, drive.totalYards);

    offStats.pointsScored += drive.pointsScored;
    defStats.pointsScored += drive.defensivePointsScored;

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
    id: gameId,
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
    userDidNotPlay
  };

  if (userPlayer && !userDidNotPlay) {
    if (gameResult.userPlayerStats) {
      gameResult.userPlayerStats.gamesPlayed = 1;
    }
    const injuryRng = rng.derive('injury-roll');
    const P = computeInjuryProbability(userPlayer, userPlayer.freshness, injuryRng);
    if (injuryRng.random() < P) {
      const injury = rollInjury(userPlayer, currentYear, weekNumber, injuryRng);
      userPlayer.injuries.push(injury);
    }
  }

  const narrative = generateGameNarrative(gameResult);
  gameResult.summary = narrative.summary;
  gameResult.highlightPlay = narrative.highlightPlay;

  return gameResult;
}

/**
 * Higher-level wrapper for simulateGame that accepts Team objects.
 */
export function simulateGameFromTeams(params: {
  homeTeam: Team;
  awayTeam: Team;
  context: GameContext;
  userPlayer?: Player;
  userPlayerTeam?: 'home' | 'away';
  userPlayerScheme?: OffensiveScheme;
  yearsPlayed: number;
  currentYear: number;
  weekNumber: number;
  rng: SeededRandom;
}): Game {
  const { homeTeam, awayTeam, context, userPlayer, userPlayerTeam, userPlayerScheme, yearsPlayed, currentYear, weekNumber, rng } = params;

  return simulateGame({
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeOffenseRating: homeTeam.offenseRating,
    homeDefenseRating: homeTeam.defenseRating,
    awayOffenseRating: awayTeam.offenseRating,
    awayDefenseRating: awayTeam.defenseRating,
    context,
    userPlayer,
    userPlayerTeam,
    userPlayerScheme,
    yearsPlayed,
    currentYear,
    weekNumber,
    rng
  });
}
