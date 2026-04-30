import { describe, it, expect, beforeAll } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { SeededRandom } from '../src/engine/prng';
import {
  generateMatchups,
  generateSchedule,
  Schedule
} from '../src/engine/schedule';

describe('generateMatchups (Fase 1)', () => {
  const teams = loadTeams();

  it('produces exactly 272 matchups', () => {
    const m = generateMatchups(teams, 0);
    expect(m).toHaveLength(272);
  });

  it('each team appears in exactly 17 matchups', () => {
    const m = generateMatchups(teams, 0);
    const counts = new Map<string, number>();
    for (const matchup of m) {
      counts.set(matchup.teamAId, (counts.get(matchup.teamAId) ?? 0) + 1);
      counts.set(matchup.teamBId, (counts.get(matchup.teamBId) ?? 0) + 1);
    }
    for (const team of teams) {
      expect(counts.get(team.id)).toBe(17);
    }
  });

  it('each team plays exactly 6 divisional games', () => {
    const m = generateMatchups(teams, 0);
    for (const team of teams) {
      const divisional = m.filter(
        x => (x.teamAId === team.id || x.teamBId === team.id) && x.type === 'divisional'
      );
      expect(divisional).toHaveLength(6);
    }
  });

  it('each team plays each divisional rival exactly twice', () => {
    const m = generateMatchups(teams, 0);
    for (const team of teams) {
      const sameDivisionRivals = teams.filter(
        t => t.id !== team.id && t.conference === team.conference && t.division === team.division
      );
      for (const rival of sameDivisionRivals) {
        const matches = m.filter(x =>
          (x.teamAId === team.id && x.teamBId === rival.id) ||
          (x.teamAId === rival.id && x.teamBId === team.id)
        );
        expect(matches).toHaveLength(2);
      }
    }
  });

  it('is deterministic: same year produces same matchups', () => {
    const m1 = generateMatchups(teams, 5);
    const m2 = generateMatchups(teams, 5);
    expect(m1).toEqual(m2);
  });

  it('different years produce different matchups (rotations differ)', () => {
    const m0 = generateMatchups(teams, 0);
    const m1 = generateMatchups(teams, 1);
    // Las divisionales son iguales pero las rotaciones cambian
    expect(m0).not.toEqual(m1);
  });
});

describe('generateSchedule (Fase 2) - shared schedule', () => {
  const teams = loadTeams();
  let s: Schedule;

  beforeAll(() => {
    const rng = new SeededRandom('test-1');
    s = generateSchedule(teams, 0, rng);
  });

  it('produces exactly 272 games', () => {
    expect(s.games).toHaveLength(272);
  });

  it('each team plays exactly 17 games', () => {
    for (const team of teams) {
      const games = s.games.filter(
        g => g.homeTeamId === team.id || g.awayTeamId === team.id
      );
      expect(games).toHaveLength(17);
    }
  });

  it('each team has exactly 1 bye in weeks 5-14', () => {
    for (const team of teams) {
      const bye = s.byeWeeks.get(team.id);
      expect(bye).toBeDefined();
      expect(bye).toBeGreaterThanOrEqual(5);
      expect(bye).toBeLessThanOrEqual(14);
    }
  });

  it('no team plays during its bye week', () => {
    for (const team of teams) {
      const bye = s.byeWeeks.get(team.id)!;
      const gamesOnBye = s.games.filter(
        g => g.week === bye && (g.homeTeamId === team.id || g.awayTeamId === team.id)
      );
      expect(gamesOnBye).toHaveLength(0);
    }
  });

  it('no team plays twice in the same week', () => {
    for (const team of teams) {
      const weeksPlayed = s.games
        .filter(g => g.homeTeamId === team.id || g.awayTeamId === team.id)
        .map(g => g.week);
      expect(new Set(weeksPlayed).size).toBe(weeksPlayed.length);
    }
  });

  it('each team has 8-9 home games', () => {
    for (const team of teams) {
      const homeGames = s.games.filter(g => g.homeTeamId === team.id);
      expect(homeGames.length).toBeGreaterThanOrEqual(8);
      expect(homeGames.length).toBeLessThanOrEqual(9);
    }
  });

  it('weeks 1-18 each have between 13 and 16 games', () => {
    for (let w = 1; w <= 18; w++) {
      const gamesInWeek = s.games.filter(g => g.week === w).length;
      expect(gamesInWeek).toBeGreaterThanOrEqual(13);
      expect(gamesInWeek).toBeLessThanOrEqual(16);
    }
  });

  it('no team has 4 or more consecutive away games', () => {
    for (const team of teams) {
      const sortedGames = s.games
        .filter(g => g.homeTeamId === team.id || g.awayTeamId === team.id)
        .sort((a, b) => a.week - b.week);
      let maxAwayStreak = 0;
      let currentStreak = 0;
      for (const g of sortedGames) {
        if (g.awayTeamId === team.id) {
          currentStreak++;
          if (currentStreak > maxAwayStreak) maxAwayStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      }
      expect(maxAwayStreak).toBeLessThanOrEqual(3);
    }
  });

  it('week 18 contains exactly 16 games, all divisional', () => {
    const week18Games = s.games.filter(g => g.week === 18);
    expect(week18Games).toHaveLength(16);
    for (const g of week18Games) {
      expect(g.type).toBe('divisional');
    }
  });

  it('week 18 has every team playing exactly once', () => {
    const week18Games = s.games.filter(g => g.week === 18);
    const teamsInWeek18 = new Set<string>();
    for (const g of week18Games) {
      teamsInWeek18.add(g.homeTeamId);
      teamsInWeek18.add(g.awayTeamId);
    }
    expect(teamsInWeek18.size).toBe(32);
  });
});

describe('generateSchedule (Fase 2) - determinism', () => {
  const teams = loadTeams();

  it('same seed produces identical schedule', () => {
    const s1 = generateSchedule(teams, 0, new SeededRandom('seed-A'));
    const s2 = generateSchedule(teams, 0, new SeededRandom('seed-A'));
    expect(s1.games).toEqual(s2.games);
    expect(Array.from(s1.byeWeeks.entries())).toEqual(Array.from(s2.byeWeeks.entries()));
  });

  it('different seeds produce different schedules but same matchup set', () => {
    const s1 = generateSchedule(teams, 0, new SeededRandom('seed-A'));
    const s2 = generateSchedule(teams, 0, new SeededRandom('seed-B'));

    // El set de partidos (sin semana ni home/away) debe ser idéntico
    const matchupKey = (g: { homeTeamId: string; awayTeamId: string }) =>
      [g.homeTeamId, g.awayTeamId].sort().join('|');

    const set1 = new Set(s1.games.map(matchupKey));
    const set2 = new Set(s2.games.map(matchupKey));
    expect(set1).toEqual(set2);

    // Pero las semanas asignadas pueden diferir
    expect(s1.games).not.toEqual(s2.games);
  });
});
