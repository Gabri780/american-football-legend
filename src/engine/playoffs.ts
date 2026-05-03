import { Team } from './team';
import { Player } from './player';
import { Game, simulateGameFromTeams } from './game';
import { SeededRandom } from './prng';
import { SeasonResult, TeamStandings, PlayerSeasonStats } from './season';
import { simulateDrive, GameContext } from './drive';
import { computePlayerDriveStats, resolveTDAttribution, QBDriveStats, RBDriveStats, WRDriveStats } from './playerDriveStats';

export type PlayoffRound = 'wild_card' | 'divisional' | 'conference' | 'championship';

export interface PlayoffSeed {
  teamId: string;
  conference: 'Eastern' | 'Western';
  seed: number;              // 1-7
  divisionWinner: boolean;   // true si era #1 de su división
  standings: TeamStandings;  // copia de las standings de regular season
}

export interface PlayoffGame {
  round: PlayoffRound;
  conference: 'Eastern' | 'Western' | 'neutral'; // 'neutral' solo para Championship Bowl
  homeTeamId: string;          // siempre el seed más alto (excepto Championship Bowl, ver venue)
  awayTeamId: string;
  homeSeed: number;
  awaySeed: number;
  venue: string;               // teamId del home, o "CROWN_STADIUM_LAS_VEGAS" para Championship
  game: Game;                  // resultado completo
  winnerId: string;            // garantizado no-null (overtime fuerza desempate)
  wentToOvertime: boolean;
  overtimeDrivesPlayed: number; // 0 si terminó en regulation
}

export interface PlayoffsResult {
  year: number;
  seeds: {
    eastern: PlayoffSeed[];   // 7 entradas, ordenadas seed 1 a 7
    western: PlayoffSeed[];   // 7 entradas, ordenadas seed 1 a 7
  };
  games: {
    wildCard: PlayoffGame[];        // 6 partidos
    divisional: PlayoffGame[];      // 4 partidos
    conferenceChampionship: PlayoffGame[]; // 2 partidos
    championshipBowl: PlayoffGame;  // 1 partido
  };
  champion: string;              // teamId del ganador del Championship Bowl
  runnerUp: string;              // teamId del perdedor
  playerPlayoffStats: PlayerSeasonStats; // stats SOLO de partidos de playoff
  userMadePlayoffs: boolean;
  userPlayoffExitRound: PlayoffRound | 'champion' | null; // null si no clasificó
}

function sortTeamsByTiebreakers(standings: TeamStandings[], seasonResult: SeasonResult): TeamStandings[] {
  return [...standings].sort((a, b) => {
    // 1. Win Pct
    const totalA = a.wins + a.losses + a.ties;
    const pctA = totalA > 0 ? (a.wins + 0.5 * a.ties) / totalA : 0;
    const totalB = b.wins + b.losses + b.ties;
    const pctB = totalB > 0 ? (b.wins + 0.5 * b.ties) / totalB : 0;
    if (pctA !== pctB) return pctB - pctA;

    // 2. Head-to-head
    let h2hWinsA = 0;
    let h2hWinsB = 0;
    for (const sum of seasonResult.weekSummaries) {
      for (const g of sum.games) {
        if ((g.homeTeamId === a.teamId && g.awayTeamId === b.teamId) ||
          (g.homeTeamId === b.teamId && g.awayTeamId === a.teamId)) {
          if (g.winnerId === a.teamId) h2hWinsA++;
          else if (g.winnerId === b.teamId) h2hWinsB++;
        }
      }
    }
    if (h2hWinsA !== h2hWinsB) return h2hWinsB - h2hWinsA;

    // 3. Division record
    const divTotalA = a.divisionWins + a.divisionLosses + a.divisionTies;
    const divPctA = divTotalA > 0 ? (a.divisionWins + 0.5 * a.divisionTies) / divTotalA : 0;
    const divTotalB = b.divisionWins + b.divisionLosses + b.divisionTies;
    const divPctB = divTotalB > 0 ? (b.divisionWins + 0.5 * b.divisionTies) / divTotalB : 0;
    if (divPctA !== divPctB) return divPctB - divPctA;

    // 4. Points differential
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffA !== diffB) return diffB - diffA;

    // 5. Alphabetical ID
    return a.teamId.localeCompare(b.teamId);
  });
}

function getConferenceSeeds(confDivs: string[], seasonResult: SeasonResult, teams: Team[]): PlayoffSeed[] {
  const divisionWinners: TeamStandings[] = [];
  const others: TeamStandings[] = [];

  for (const divName of confDivs) {
    const divTeamsStandings = seasonResult.finalStandings.filter(s => {
      const team = teams.find(t => t.id === s.teamId)!;
      return `${team.conference}_${team.division}` === divName;
    });
    // finalStandings ya viene ordenado, el índice 0 es el ganador de división
    divisionWinners.push(divTeamsStandings[0]);
    others.push(...divTeamsStandings.slice(1));
  }

  const sortedWinners = sortTeamsByTiebreakers(divisionWinners, seasonResult);
  const sortedOthers = sortTeamsByTiebreakers(others, seasonResult);

  const seeds: PlayoffSeed[] = [];
  sortedWinners.forEach((w, idx) => {
    const team = teams.find(t => t.id === w.teamId)!;
    seeds.push({ teamId: w.teamId, conference: team.conference as 'Eastern' | 'Western', seed: idx + 1, divisionWinner: true, standings: w });
  });

  sortedOthers.slice(0, 3).forEach((o, idx) => {
    const team = teams.find(t => t.id === o.teamId)!;
    seeds.push({ teamId: o.teamId, conference: team.conference as 'Eastern' | 'Western', seed: idx + 5, divisionWinner: false, standings: o });
  });

  return seeds;
}

function simulateOvertime(params: {
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: Team;
  awayTeam: Team;
  userPlayer?: Player;
  userPlayerTeam?: 'home' | 'away';
  baseGame: Game;
  rng: SeededRandom;
}): { winnerId: string; drivesPlayed: number; otScoreHome: number; otScoreAway: number; } {
  const { homeTeamId, awayTeamId, homeTeam, awayTeam, userPlayer, userPlayerTeam, baseGame, rng } = params;

  let otScoreHome = 0;
  let otScoreAway = 0;
  let drivesPlayed = 0;
  let firstReceivingScored: 'TD' | 'FG' | 'NONE' | null = null;

  const coinFlip = rng.random() < 0.5;
  let currentPossession: 'home' | 'away' = coinFlip ? 'home' : 'away';

  const context: GameContext = {
    isPlayoff: true,
    isRivalryGame: homeTeam.rivalId === awayTeam.id || awayTeam.rivalId === homeTeam.id,
    isPrimetime: false,
    isHomeGame: true
  };

  let winnerId: string | null = null;

  while (drivesPlayed < 6) {
    const isHomeOffense = currentPossession === 'home';
    const offTeam = isHomeOffense ? homeTeam : awayTeam;
    const defTeam = isHomeOffense ? awayTeam : homeTeam;

    const driveRng = rng.derive(`ot-drive-${drivesPlayed}`);
    const drive = simulateDrive(
      offTeam.offenseRating, defTeam.defenseRating, offTeam.id, defTeam.id,
      25, 4, context, driveRng, baseGame.id, baseGame.drives.length + drivesPlayed + 1
    );

    drivesPlayed++;

    if (userPlayer && userPlayerTeam === currentPossession) {
      let tdAttribution;
      if (drive.outcome === 'TD') {
        tdAttribution = resolveTDAttribution(0.60, userPlayer.archetype || 'non-mobile', driveRng);
      }
      const driveStats = computePlayerDriveStats(drive, userPlayer, 'Balanced', driveRng, tdAttribution);

      if (!baseGame.userPlayerStats) {
        if (userPlayer.position === 'QB') baseGame.userPlayerStats = { passAttempts: 0, completions: 0, passYards: 0, passTDs: 0, interceptions: 0, rushAttempts: 0, rushYards: 0, rushTDs: 0, sacks: 0, fumbles: 0 } as QBDriveStats;
        else if (userPlayer.position === 'RB') baseGame.userPlayerStats = { carries: 0, rushYards: 0, rushTDs: 0, fumbles: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, targets: 0 } as RBDriveStats;
        else baseGame.userPlayerStats = { targets: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, drops: 0 } as WRDriveStats;
      }

      const target = baseGame.userPlayerStats as any;
      const source = driveStats as any;
      for (const key in source) {
        if (typeof source[key] === 'number') target[key] = (target[key] || 0) + source[key];
      }
    }

    baseGame.drives.push(drive);

    if (isHomeOffense) {
      otScoreHome += drive.pointsScored;
      otScoreAway += drive.defensivePointsScored;
    } else {
      otScoreAway += drive.pointsScored;
      otScoreHome += drive.defensivePointsScored;
    }

    if (drivesPlayed === 1) {
      if (drive.outcome === 'TD') {
        winnerId = offTeam.id;
        break;
      } else if (drive.outcome === 'FG') {
        firstReceivingScored = 'FG';
      } else {
        firstReceivingScored = 'NONE';
      }
    } else if (drivesPlayed === 2) {
      if (drive.outcome === 'TD') {
        winnerId = offTeam.id;
        break;
      } else if (drive.outcome === 'FG') {
        if (firstReceivingScored === 'NONE') {
          winnerId = offTeam.id;
          break;
        }
      } else {
        if (firstReceivingScored === 'FG') {
          winnerId = defTeam.id;
          break;
        }
      }
    } else {
      if (drive.outcome === 'TD' || drive.outcome === 'FG') {
        winnerId = offTeam.id;
        break;
      }
    }

    currentPossession = isHomeOffense ? 'away' : 'home';
  }

  if (!winnerId) {
    if (otScoreHome > otScoreAway) winnerId = homeTeamId;
    else if (otScoreAway > otScoreHome) winnerId = awayTeamId;
    else winnerId = rng.random() < 0.5 ? homeTeamId : awayTeamId;
  }

  baseGame.homeScore += otScoreHome;
  baseGame.awayScore += otScoreAway;
  baseGame.winnerTeamId = winnerId;

  return { winnerId, drivesPlayed, otScoreHome, otScoreAway };
}

export function simulatePlayoffs(params: {
  seasonResult: SeasonResult;
  teams: Team[];
  userPlayer: Player;
  userTeamId: string;
  yearsPlayed: number;
  rng: SeededRandom;
}): PlayoffsResult {
  const { seasonResult, teams, userPlayer, userTeamId, yearsPlayed, rng } = params;

  const eastDivisions = ['Eastern_East', 'Eastern_Atlantic', 'Eastern_North', 'Eastern_South'];
  const westDivisions = ['Western_Central', 'Western_Mountain', 'Western_Pacific', 'Western_Southwest'];

  const easternSeeds = getConferenceSeeds(eastDivisions, seasonResult, teams);
  const westernSeeds = getConferenceSeeds(westDivisions, seasonResult, teams);

  if (easternSeeds.length !== 7 || westernSeeds.length !== 7) {
    throw new Error('Expected 7 seeds per conference');
  }

  let userMadePlayoffs = false;
  let userPlayoffExitRound: PlayoffRound | 'champion' | null = null;
  if (easternSeeds.some(s => s.teamId === userTeamId) || westernSeeds.some(s => s.teamId === userTeamId)) {
    userMadePlayoffs = true;
  }

  const playerPlayoffStats: PlayerSeasonStats = {
    playerId: userPlayer.id,
    gamesPlayed: 0,
    passYards: 0, passTDs: 0, interceptions: 0, completions: 0, passAttempts: 0,
    rushYards: 0, rushTDs: 0, carries: 0, fumbles: 0,
    receivingYards: 0, receivingTDs: 0, receptions: 0, targets: 0
  };

  const games = {
    wildCard: [] as PlayoffGame[],
    divisional: [] as PlayoffGame[],
    conferenceChampionship: [] as PlayoffGame[],
    championshipBowl: {} as PlayoffGame
  };

  const simulatePlayoffGame = (
    round: PlayoffRound,
    conference: 'Eastern' | 'Western' | 'neutral',
    homeSeedObj: PlayoffSeed,
    awaySeedObj: PlayoffSeed,
    venue: string,
    matchupIndex: number
  ) => {
    const homeTeam = teams.find(t => t.id === homeSeedObj.teamId)!;
    const awayTeam = teams.find(t => t.id === awaySeedObj.teamId)!;

    let userPlayerTeam: 'home' | 'away' | undefined = undefined;
    if (homeTeam.id === userTeamId) userPlayerTeam = 'home';
    else if (awayTeam.id === userTeamId) userPlayerTeam = 'away';

    const subRng = rng.derive(`${round}-${conference}-${matchupIndex}`);
    const isRivalryGame = homeTeam.rivalId === awayTeam.id || awayTeam.rivalId === homeTeam.id;
    const context: GameContext = { isPlayoff: true, isRivalryGame, isPrimetime: false, isHomeGame: true };

    const baseGame = simulateGameFromTeams({
      homeTeam, awayTeam, context,
      userPlayer: userPlayerTeam ? userPlayer : undefined,
      userPlayerTeam,
      userPlayerScheme: 'Balanced',
      yearsPlayed,
      currentYear: seasonResult.year,
      weekNumber: 18 + (round === 'wild_card' ? 1 : round === 'divisional' ? 2 : round === 'conference' ? 3 : 4),
      rng: subRng
    });

    let winnerId = baseGame.winnerTeamId;
    let wentToOvertime = false;
    let overtimeDrivesPlayed = 0;

    if (baseGame.homeScore === baseGame.awayScore || !winnerId) {
      wentToOvertime = true;
      const otResult = simulateOvertime({
        homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, homeTeam, awayTeam,
        userPlayer: userPlayerTeam ? userPlayer : undefined, userPlayerTeam,
        baseGame, rng: subRng.derive('ot')
      });
      winnerId = otResult.winnerId;
      overtimeDrivesPlayed = otResult.drivesPlayed;
    }

    if (userPlayerTeam && baseGame.userPlayerStats) {
      const stats = baseGame.userPlayerStats;
      playerPlayoffStats.gamesPlayed += (stats as any).gamesPlayed || 0;
      if (userPlayer.position === 'QB') {
        const s = stats as QBDriveStats;
        playerPlayoffStats.passAttempts += s.passAttempts || 0;
        playerPlayoffStats.completions += s.completions || 0;
        playerPlayoffStats.passYards += s.passYards || 0;
        playerPlayoffStats.passTDs += s.passTDs || 0;
        playerPlayoffStats.interceptions += s.interceptions || 0;
        playerPlayoffStats.carries += s.rushAttempts || 0;
        playerPlayoffStats.rushYards += s.rushYards || 0;
        playerPlayoffStats.rushTDs += s.rushTDs || 0;
        playerPlayoffStats.fumbles += s.fumbles || 0;
      } else if (userPlayer.position === 'RB') {
        const s = stats as RBDriveStats;
        playerPlayoffStats.carries += s.carries || 0;
        playerPlayoffStats.rushYards += s.rushYards || 0;
        playerPlayoffStats.rushTDs += s.rushTDs || 0;
        playerPlayoffStats.fumbles += s.fumbles || 0;
        playerPlayoffStats.receptions += s.receptions || 0;
        playerPlayoffStats.receivingYards += s.receivingYards || 0;
        playerPlayoffStats.receivingTDs += s.receivingTDs || 0;
        playerPlayoffStats.targets += s.targets || 0;
      } else if (userPlayer.position === 'WR') {
        const s = stats as WRDriveStats;
        playerPlayoffStats.targets += s.targets || 0;
        playerPlayoffStats.receptions += s.receptions || 0;
        playerPlayoffStats.receivingYards += s.receivingYards || 0;
        playerPlayoffStats.receivingTDs += s.receivingTDs || 0;
      }
    }

    return {
      round,
      conference,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeSeed: homeSeedObj.seed,
      awaySeed: awaySeedObj.seed,
      venue,
      game: baseGame,
      winnerId: winnerId!,
      wentToOvertime,
      overtimeDrivesPlayed
    } as PlayoffGame;
  };

  // Wild Card
  const wcWinners: { Eastern: PlayoffSeed[], Western: PlayoffSeed[] } = { Eastern: [easternSeeds[0]], Western: [westernSeeds[0]] };

  [
    { conf: 'Eastern' as const, seeds: easternSeeds },
    { conf: 'Western' as const, seeds: westernSeeds }
  ].forEach(({ conf, seeds }) => {
    const matchups = [[1, 6], [2, 5], [3, 4]]; // [seed 2, seed 7], [seed 3, seed 6], [seed 4, seed 5] (0-indexed)
    matchups.forEach((m, idx) => {
      const home = seeds[m[0]];
      const away = seeds[m[1]];
      const game = simulatePlayoffGame('wild_card', conf, home, away, home.teamId, idx);
      games.wildCard.push(game);
      const winnerSeed = game.winnerId === home.teamId ? home : away;
      wcWinners[conf].push(winnerSeed);

      if (userMadePlayoffs && game.winnerId !== userTeamId && (home.teamId === userTeamId || away.teamId === userTeamId)) {
        userPlayoffExitRound = 'wild_card';
      }
    });
  });

  if (games.wildCard.length !== 6) throw new Error('Expected 6 wild card games');

  // Divisional
  const divWinners: { Eastern: PlayoffSeed[], Western: PlayoffSeed[] } = { Eastern: [], Western: [] };

  [
    { conf: 'Eastern' as const, survivors: wcWinners.Eastern },
    { conf: 'Western' as const, survivors: wcWinners.Western }
  ].forEach(({ conf, survivors }) => {
    survivors.sort((a, b) => a.seed - b.seed);
    const m1 = [survivors[0], survivors[3]];
    const m2 = [survivors[1], survivors[2]];
    [m1, m2].forEach((m, idx) => {
      const home = m[0];
      const away = m[1];
      const game = simulatePlayoffGame('divisional', conf, home, away, home.teamId, idx);
      games.divisional.push(game);
      const winnerSeed = game.winnerId === home.teamId ? home : away;
      divWinners[conf].push(winnerSeed);

      if (userMadePlayoffs && game.winnerId !== userTeamId && (home.teamId === userTeamId || away.teamId === userTeamId)) {
        userPlayoffExitRound = 'divisional';
      }
    });
  });

  if (games.divisional.length !== 4) throw new Error('Expected 4 divisional games');

  // Conference
  const confWinners: { Eastern: PlayoffSeed | null, Western: PlayoffSeed | null } = { Eastern: null, Western: null };
  [
    { conf: 'Eastern' as const, survivors: divWinners.Eastern },
    { conf: 'Western' as const, survivors: divWinners.Western }
  ].forEach(({ conf, survivors }) => {
    survivors.sort((a, b) => a.seed - b.seed);
    const home = survivors[0];
    const away = survivors[1];
    const game = simulatePlayoffGame('conference', conf, home, away, home.teamId, 0);
    games.conferenceChampionship.push(game);
    const winnerSeed = game.winnerId === home.teamId ? home : away;
    confWinners[conf] = winnerSeed;

    if (userMadePlayoffs && game.winnerId !== userTeamId && (home.teamId === userTeamId || away.teamId === userTeamId)) {
      userPlayoffExitRound = 'conference';
    }
  });

  if (games.conferenceChampionship.length !== 2) throw new Error('Expected 2 conference games');

  // Championship Bowl
  let champHome = confWinners.Eastern!;
  let champAway = confWinners.Western!;

  let swap = false;
  if (champAway.seed < champHome.seed) {
    swap = true;
  } else if (champAway.seed === champHome.seed) {
    const winPctA = (champAway.standings.wins + 0.5 * champAway.standings.ties) / 17;
    const winPctH = (champHome.standings.wins + 0.5 * champHome.standings.ties) / 17;
    if (winPctA > winPctH) swap = true;
    else if (winPctA === winPctH) {
      if (champAway.teamId.localeCompare(champHome.teamId) < 0) swap = true;
    }
  }

  if (swap) {
    const temp = champHome;
    champHome = champAway;
    champAway = temp;
  }

  const bowlGame = simulatePlayoffGame('championship', 'neutral', champHome, champAway, 'CROWN_STADIUM_LAS_VEGAS', 0);
  games.championshipBowl = bowlGame;

  if (!bowlGame) throw new Error('Expected 1 championship bowl');

  if (userMadePlayoffs) {
    if (bowlGame.winnerId !== userTeamId && (champHome.teamId === userTeamId || champAway.teamId === userTeamId)) {
      userPlayoffExitRound = 'championship';
    } else if (bowlGame.winnerId === userTeamId) {
      userPlayoffExitRound = 'champion';
    }
  }

  return {
    year: seasonResult.year,
    seeds: {
      eastern: easternSeeds,
      western: westernSeeds
    },
    games,
    champion: bowlGame.winnerId,
    runnerUp: bowlGame.winnerId === bowlGame.homeTeamId ? bowlGame.awayTeamId : bowlGame.homeTeamId,
    playerPlayoffStats,
    userMadePlayoffs,
    userPlayoffExitRound
  };
}
