import { simulateDrive, Drive, GameContext } from './drive';
import { Player } from './player';
import { PlayerDriveStats, OffensiveScheme } from './playerDriveStats';
import { SeededRandom } from './prng';

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
 * Simulates a full game between two teams.
 *
 * NOTE: This is a skeleton (Task 6A).
 * Drive simulation, scoreboard logic, clock management and stat accumulation
 * are implemented in Tasks 6B–6E.
 */
export function simulateGame(params: SimulateGameParams): Game {
  const { homeTeamId, awayTeamId, context, rng } = params;

  const homeStats: GameTeamStats = {
    teamId: homeTeamId, pointsScored: 0, totalYards: 0, drives: 0, turnovers: 0
  };
  const awayStats: GameTeamStats = {
    teamId: awayTeamId, pointsScored: 0, totalYards: 0, drives: 0, turnovers: 0
  };

  const drives: Drive[] = [];
  const totalDrives = rng.randomInt(20, 26);
  const halfDriveIndex = Math.floor(totalDrives / 2);

  let currentPossession: 'home' | 'away' = 'away'; // Away receives opening kickoff
  let startYard = 25;

  for (let i = 0; i < totalDrives; i++) {
    // Determine Quarter (simplistic approximation for 6B)
    let currentQuarter: 1 | 2 | 3 | 4;
    if (i < totalDrives / 4) currentQuarter = 1;
    else if (i < totalDrives / 2) currentQuarter = 2;
    else if (i < (totalDrives * 3) / 4) currentQuarter = 3;
    else currentQuarter = 4;

    // Second half opening kickoff
    if (i === halfDriveIndex) {
      currentPossession = 'home';
      startYard = 25;
      currentQuarter = 3;
    }

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
      currentQuarter,
      context,
      rng
    );

    drives.push(drive);

    // Update Stats
    const offStats = isHomeOffense ? homeStats : awayStats;
    const defStats = isHomeOffense ? awayStats : homeStats;

    offStats.drives += 1;
    offStats.totalYards += Math.max(0, drive.totalYards);

    if (drive.outcome === 'SAFETY') {
      defStats.pointsScored += 2; // Defense gets the safety points
    } else {
      offStats.pointsScored += drive.pointsScored;
    }

    if (['TURNOVER_INT', 'TURNOVER_FUMBLE', 'DOWNS'].includes(drive.outcome)) {
      offStats.turnovers += 1;
    }

    // Determine next possession and start yard
    currentPossession = isHomeOffense ? 'away' : 'home'; // Most outcomes flip possession
    
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
      case 'END_HALF':
      case 'END_GAME':
        startYard = 25;
        break;
    }
  }

  const homeScore = homeStats.pointsScored;
  const awayScore = awayStats.pointsScored;
  
  let winnerTeamId: string | null = null;
  if (homeScore > awayScore) winnerTeamId = homeTeamId;
  else if (awayScore > homeScore) winnerTeamId = awayTeamId;

  return {
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
    userPlayerStats: null,
    summary: '',
    highlightPlay: '',
  };
}
