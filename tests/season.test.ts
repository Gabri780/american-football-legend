import { describe, it, expect, beforeAll } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { generateSchedule } from '../src/engine/schedule';
import { SeededRandom } from '../src/engine/prng';
import { createPlayer } from '../src/engine/player';
import { simulateSeason, SeasonResult } from '../src/engine/season';

describe('simulateSeason', () => {
  // Generar UNA temporada compartida para verificaciones de propiedades
  let result: SeasonResult;
  let teams: ReturnType<typeof loadTeams>;
  let userTeamId: string;
  
  beforeAll(() => {
    teams = loadTeams();
    const scheduleRng = new SeededRandom('schedule-seed');
    const schedule = generateSchedule(teams, 0, scheduleRng);
    
    const playerRng = new SeededRandom('player-seed');
    const userPlayer = createPlayer({ position: 'QB', tier: 'user', rng: playerRng });
    userTeamId = teams[0].id;  // primer team de la lista
    
    const seasonRng = new SeededRandom('season-seed');
    result = simulateSeason({
      teams, schedule, userPlayer, userTeamId, rng: seasonRng
    });
  });
  
  it('produces exactly 18 week summaries', () => {
    expect(result.weekSummaries).toHaveLength(18);
  });
  
  it('total games across all weeks equals 272', () => {
    const total = result.weekSummaries.reduce((sum, w) => sum + w.games.length, 0);
    expect(total).toBe(272);
  });
  
  it('each team has exactly 17 games (wins + losses + ties)', () => {
    for (const standing of result.finalStandings) {
      expect(standing.wins + standing.losses + standing.ties).toBe(17);
    }
  });
  
  it('finalStandings has exactly 32 teams', () => {
    expect(result.finalStandings).toHaveLength(32);
  });
  
  it('player participated in exactly 17 games', () => {
    expect(result.playerSeasonStats.gamesPlayed).toBe(17);
  });
  
  it('total wins equals total losses across the league', () => {
    const totalWins = result.finalStandings.reduce((s, t) => s + t.wins, 0);
    const totalLosses = result.finalStandings.reduce((s, t) => s + t.losses, 0);
    expect(totalWins).toBe(totalLosses);
  });
  
  it('total ties is even (each tie counts twice)', () => {
    const totalTies = result.finalStandings.reduce((s, t) => s + t.ties, 0);
    expect(totalTies % 2).toBe(0);
  });
  
  it('total points scored equals total points allowed across the league', () => {
    const totalFor = result.finalStandings.reduce((s, t) => s + t.pointsFor, 0);
    const totalAgainst = result.finalStandings.reduce((s, t) => s + t.pointsAgainst, 0);
    expect(totalFor).toBe(totalAgainst);
  });
  
  it('user player stats accumulated (passYards > 0 for QB)', () => {
    expect(result.playerSeasonStats.passYards).toBeGreaterThan(0);
  });
  
  it('week 1 byeTeams is empty (no byes before week 5)', () => {
    expect(result.weekSummaries[0].byeTeams).toHaveLength(0);
  });
  
  it('week 18 byeTeams is empty', () => {
    expect(result.weekSummaries[17].byeTeams).toHaveLength(0);
  });
  
  it('week 5-14 each have some byeTeams', () => {
    for (let i = 4; i <= 13; i++) {
      expect(result.weekSummaries[i].byeTeams.length).toBeGreaterThan(0);
    }
  });
  
  it('userGame is present only for games where user team plays', () => {
    let userGameCount = 0;
    for (const ws of result.weekSummaries) {
      for (const g of ws.games) {
        const userPlayed = g.homeTeamId === userTeamId || g.awayTeamId === userTeamId;
        if (userPlayed) {
          expect(g.userGame).toBeDefined();
          userGameCount++;
        } else {
          expect(g.userGame).toBeUndefined();
        }
      }
    }
    expect(userGameCount).toBe(17);
  });
});

describe('simulateSeason - determinism', () => {
  it('same seed produces identical season result', () => {
    const teams = loadTeams();
    const schedule = generateSchedule(teams, 0, new SeededRandom('s'));
    const userPlayer = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    
    const r1 = simulateSeason({
      teams, schedule, userPlayer, userTeamId: teams[0].id,
      rng: new SeededRandom('season-seed')
    });
    const r2 = simulateSeason({
      teams, schedule, userPlayer, userTeamId: teams[0].id,
      rng: new SeededRandom('season-seed')
    });
    
    expect(r1.finalStandings).toEqual(r2.finalStandings);
    expect(r1.playerSeasonStats).toEqual(r2.playerSeasonStats);
  });
});
