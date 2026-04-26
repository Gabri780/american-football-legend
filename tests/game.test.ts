import { describe, test, expect, beforeEach } from 'vitest';
import { SeededRandom } from '../src/engine/prng';
import { simulateGame, SimulateGameParams, Game, GameTeamStats } from '../src/engine/game';
import { GameContext } from '../src/engine/drive';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CONTEXT: GameContext = {
  isPlayoff: false,
  isRivalryGame: false,
  isPrimetime: false,
  isHomeGame: true,
};

function makeParams(seed: string, overrides: Partial<SimulateGameParams> = {}): SimulateGameParams {
  return {
    homeTeamId: 'team_home',
    awayTeamId: 'team_away',
    homeOffenseRating: 75,
    homeDefenseRating: 70,
    awayOffenseRating: 72,
    awayDefenseRating: 68,
    context: DEFAULT_CONTEXT,
    rng: new SeededRandom(seed),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — Structure
// ─────────────────────────────────────────────────────────────────────────────
describe('simulateGame — structure', () => {
  let game: Game;

  beforeEach(() => {
    game = simulateGame(makeParams('test-seed-1'));
  });

  test('Test 1: returns object with all required Game fields', () => {
    expect(game).toHaveProperty('id');
    expect(game).toHaveProperty('homeTeamId');
    expect(game).toHaveProperty('awayTeamId');
    expect(game).toHaveProperty('homeScore');
    expect(game).toHaveProperty('awayScore');
    expect(game).toHaveProperty('winnerTeamId');
    expect(game).toHaveProperty('homeStats');
    expect(game).toHaveProperty('awayStats');
    expect(game).toHaveProperty('drives');
    expect(game).toHaveProperty('context');
    expect(game).toHaveProperty('userPlayerStats');
    expect(game).toHaveProperty('summary');
    expect(game).toHaveProperty('highlightPlay');
  });

  test('Test 1b: drives array is populated correctly (20-26 drives)', () => {
    expect(game.drives.length).toBeGreaterThanOrEqual(20);
    expect(game.drives.length).toBeLessThanOrEqual(26);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — Alternating Possession
// ─────────────────────────────────────────────────────────────────────────────
describe('simulateGame — drives loop and possession', () => {
  test('Test 2: alternating possession starting with away team', () => {
    const game = simulateGame(makeParams('test-seed-2'));
    // First drive of the game is away team (they receive kickoff)
    expect(game.drives[0].teamOnOffenseId).toBe(game.awayTeamId);

    let homeDrives = 0;
    let awayDrives = 0;
    game.drives.forEach(d => {
      if (d.teamOnOffenseId === game.homeTeamId) homeDrives++;
      else awayDrives++;
    });

    // Both teams should get roughly equal drives (within 2 of each other)
    expect(Math.abs(homeDrives - awayDrives)).toBeLessThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3, 4, 5 — Stats and Scores
// ─────────────────────────────────────────────────────────────────────────────
describe('simulateGame — stats and scores', () => {
  test('Test 3: scores sum up correctly from drives', () => {
    const game = simulateGame(makeParams('test-seed-3'));
    
    let expectedHomeScore = 0;
    let expectedAwayScore = 0;

    game.drives.forEach(d => {
      if (d.outcome === 'SAFETY') {
        if (d.teamOnOffenseId === game.homeTeamId) expectedAwayScore += 2; // Defense gets points
        else expectedHomeScore += 2;
      } else {
        if (d.teamOnOffenseId === game.homeTeamId) expectedHomeScore += d.pointsScored;
        else expectedAwayScore += d.pointsScored;
      }
    });

    expect(game.homeScore).toBe(expectedHomeScore);
    expect(game.awayScore).toBe(expectedAwayScore);
  });

  test('Test 4: winnerTeamId is correct', () => {
    const game = simulateGame(makeParams('test-seed-4'));
    if (game.homeScore > game.awayScore) {
      expect(game.winnerTeamId).toBe(game.homeTeamId);
    } else if (game.awayScore > game.homeScore) {
      expect(game.winnerTeamId).toBe(game.awayTeamId);
    } else {
      expect(game.winnerTeamId).toBeNull();
    }
  });

  test('Test 5: aggregated stats are correct', () => {
    const game = simulateGame(makeParams('test-seed-5'));
    
    expect(game.homeStats.drives + game.awayStats.drives).toBe(game.drives.length);

    let homeYards = 0;
    let homeTurnovers = 0;
    game.drives.forEach(d => {
      if (d.teamOnOffenseId === game.homeTeamId) {
        homeYards += Math.max(0, d.totalYards);
        if (['TURNOVER_INT', 'TURNOVER_FUMBLE', 'DOWNS'].includes(d.outcome)) {
          homeTurnovers++;
        }
      }
    });

    expect(game.homeStats.totalYards).toBe(homeYards);
    expect(game.homeStats.turnovers).toBe(homeTurnovers);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6 — Determinism
// ─────────────────────────────────────────────────────────────────────────────
describe('simulateGame — determinism', () => {
  test('Test 6: same seed produces the same exact game', () => {
    const game1 = simulateGame(makeParams('det-seed'));
    const game2 = simulateGame(makeParams('det-seed'));
    expect(game1).toEqual(game2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7 — Statistics (1000 games)
// ─────────────────────────────────────────────────────────────────────────────
describe('simulateGame — statistics', () => {
  test('Test 7: Better team wins more often, reasonable scores', () => {
    let eliteWins = 0;
    let totalScoreSum = 0;
    const n = 1000;

    for (let i = 0; i < n; i++) {
      const game = simulateGame(makeParams(`stat-seed-${i}`, {
        homeOffenseRating: 90,
        homeDefenseRating: 90,
        awayOffenseRating: 60,
        awayDefenseRating: 60,
      }));

      if (game.winnerTeamId === game.homeTeamId) eliteWins++;
      totalScoreSum += game.homeScore + game.awayScore;
    }

    const winRate = eliteWins / n;
    const avgScore = totalScoreSum / n;

    // The better team should win > 65% of the time
    expect(winRate).toBeGreaterThan(0.65);
    
    // Average combined score should be between 30 and 60 points
    expect(avgScore).toBeGreaterThanOrEqual(30);
    expect(avgScore).toBeLessThanOrEqual(60);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8 — Specific Drive Rules
// ─────────────────────────────────────────────────────────────────────────────
describe('simulateGame — specific drive rules', () => {
  test('Test 8: Next drive starts at (100 - endingYardLine) after a turnover', () => {
    const game = simulateGame(makeParams('turnover-seed'));
    
    for (let i = 0; i < game.drives.length - 1; i++) {
      const d1 = game.drives[i];
      const d2 = game.drives[i + 1];

      // Check turnovers where the next drive is in the same quarter
      // (so we don't accidentally check the Q3 opening kickoff which is at 25)
      if (['TURNOVER_INT', 'TURNOVER_FUMBLE', 'DOWNS'].includes(d1.outcome) && d1.quarter === d2.quarter) {
        expect(d2.startingYardLine).toBe(100 - d1.endingYardLine);
      }
    }
  });
});
