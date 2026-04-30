import { describe, it, expect, beforeAll } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { generateSchedule } from '../src/engine/schedule';
import { simulateSeason, SeasonResult } from '../src/engine/season';
import { simulatePlayoffs, PlayoffsResult } from '../src/engine/playoffs';
import { SeededRandom } from '../src/engine/prng';
import { createPlayer } from '../src/engine/player';

describe('simulatePlayoffs', () => {
  let result: PlayoffsResult;
  let teams: ReturnType<typeof loadTeams>;
  let userTeamId: string;
  let seasonResult: SeasonResult;

  beforeAll(() => {
    teams = loadTeams();
    const schedule = generateSchedule(teams, 0, new SeededRandom('s'));
    const userPlayer = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    userTeamId = teams[0].id;
    seasonResult = simulateSeason({
      teams, schedule, userPlayer, userTeamId, rng: new SeededRandom('season')
    });
    result = simulatePlayoffs({
      seasonResult, teams, userPlayer, userTeamId, rng: new SeededRandom('playoffs')
    });
  });

  it('produces 7 seeds per conference', () => {
    expect(result.seeds.eastern).toHaveLength(7);
    expect(result.seeds.western).toHaveLength(7);
  });

  it('seeds are 1-7 in order within each conference', () => {
    for (const seedList of [result.seeds.eastern, result.seeds.western]) {
      for (let i = 0; i < 7; i++) {
        expect(seedList[i].seed).toBe(i + 1);
      }
    }
  });

  it('top 4 seeds are division winners', () => {
    for (const seedList of [result.seeds.eastern, result.seeds.western]) {
      for (let i = 0; i < 4; i++) {
        expect(seedList[i].divisionWinner).toBe(true);
      }
      for (let i = 4; i < 7; i++) {
        expect(seedList[i].divisionWinner).toBe(false);
      }
    }
  });

  it('produces exactly 13 playoff games', () => {
    const total = result.games.wildCard.length
      + result.games.divisional.length
      + result.games.conferenceChampionship.length
      + 1;
    expect(total).toBe(13);
  });

  it('wild card has 6 games, none with seed #1', () => {
    expect(result.games.wildCard).toHaveLength(6);
    for (const g of result.games.wildCard) {
      expect(g.homeSeed).not.toBe(1);
      expect(g.awaySeed).not.toBe(1);
    }
  });

  it('all wild card games match seeds 2v7, 3v6, 4v5', () => {
    for (const conf of ['Eastern', 'Western'] as const) {
      const confGames = result.games.wildCard.filter(g => g.conference === conf);
      expect(confGames).toHaveLength(3);
      const matchups = confGames.map(g => `${g.homeSeed}v${g.awaySeed}`).sort();
      expect(matchups).toEqual(['2v7', '3v6', '4v5']);
    }
  });

  it('divisional round has 4 games, all with seed #1 OR seed#1 plays', () => {
    expect(result.games.divisional).toHaveLength(4);
    for (const conf of ['Eastern', 'Western'] as const) {
      const confGames = result.games.divisional.filter(g => g.conference === conf);
      expect(confGames).toHaveLength(2);
      const seedsPlaying = new Set([
        ...confGames.map(g => g.homeSeed),
        ...confGames.map(g => g.awaySeed)
      ]);
      expect(seedsPlaying.has(1)).toBe(true);
    }
  });

  it('every playoff game has a non-null winner', () => {
    const allGames = [
      ...result.games.wildCard,
      ...result.games.divisional,
      ...result.games.conferenceChampionship,
      result.games.championshipBowl
    ];
    for (const g of allGames) {
      expect(g.winnerId).toBeTruthy();
      expect(g.game.winnerTeamId).toBeTruthy();
    }
  });

  it('championship bowl venue is CROWN_STADIUM_LAS_VEGAS', () => {
    expect(result.games.championshipBowl.venue).toBe('CROWN_STADIUM_LAS_VEGAS');
    expect(result.games.championshipBowl.conference).toBe('neutral');
  });

  it('champion is the winner of championship bowl', () => {
    expect(result.champion).toBe(result.games.championshipBowl.winnerId);
  });

  it('runnerUp is the loser of championship bowl', () => {
    const cb = result.games.championshipBowl;
    const loser = cb.winnerId === cb.homeTeamId ? cb.awayTeamId : cb.homeTeamId;
    expect(result.runnerUp).toBe(loser);
  });

  it('higher seed plays at home in non-championship rounds', () => {
    const nonChamp = [
      ...result.games.wildCard,
      ...result.games.divisional,
      ...result.games.conferenceChampionship
    ];
    for (const g of nonChamp) {
      expect(g.homeSeed).toBeLessThan(g.awaySeed);
    }
  });

  it('userMadePlayoffs is consistent with seeds', () => {
    const allSeeds = [...result.seeds.eastern, ...result.seeds.western];
    const userInSeeds = allSeeds.some(s => s.teamId === userTeamId);
    expect(result.userMadePlayoffs).toBe(userInSeeds);
  });

  it('if user did not make playoffs, exitRound is null and playerPlayoffStats.gamesPlayed is 0', () => {
    if (!result.userMadePlayoffs) {
      expect(result.userPlayoffExitRound).toBeNull();
      expect(result.playerPlayoffStats.gamesPlayed).toBe(0);
    }
  });

  it('if user is champion, exitRound is "champion"', () => {
    if (result.champion === userTeamId) {
      expect(result.userPlayoffExitRound).toBe('champion');
    }
  });
});

describe('simulatePlayoffs - determinism', () => {
  it('same seeds produce identical playoff result', () => {
    const teams = loadTeams();
    const schedule = generateSchedule(teams, 0, new SeededRandom('s'));
    const userPlayer = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const seasonResult = simulateSeason({
      teams, schedule, userPlayer, userTeamId: teams[0].id, rng: new SeededRandom('season')
    });

    const r1 = simulatePlayoffs({
      seasonResult, teams, userPlayer, userTeamId: teams[0].id, rng: new SeededRandom('po')
    });
    const r2 = simulatePlayoffs({
      seasonResult, teams, userPlayer, userTeamId: teams[0].id, rng: new SeededRandom('po')
    });

    expect(r1.champion).toBe(r2.champion);
    expect(r1.runnerUp).toBe(r2.runnerUp);
    expect(r1.userPlayoffExitRound).toBe(r2.userPlayoffExitRound);
  });
});
