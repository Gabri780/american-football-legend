import { Schedule, ScheduledGame, MatchupType } from './schedule';
import { Team } from './team';
import { Player } from './player';
import { Game, simulateGameFromTeams } from './game';
import { SeededRandom } from './prng';
import { QBDriveStats, RBDriveStats, WRDriveStats } from './playerDriveStats';

export interface TeamStandings {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  divisionWins: number;
  divisionLosses: number;
  divisionTies: number;
}

export interface GameResult {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  type: MatchupType;
  homeScore: number;
  awayScore: number;
  winnerId: string | null;     // null si empate
  // El Game completo solo se guarda si el jugador-usuario participó
  userGame?: Game;
}

export interface WeekSummary {
  week: number;
  games: GameResult[];
  byeTeams: string[];          // teamIds en bye esta semana
}

export interface PlayerSeasonStats {
  playerId: string;
  gamesPlayed: number;
  // QB
  passYards: number;
  passTDs: number;
  interceptions: number;
  completions: number;
  passAttempts: number;
  // RB
  rushYards: number;
  rushTDs: number;
  carries: number;
  fumbles: number;
  // WR (y RB)
  receivingYards: number;
  receivingTDs: number;
  receptions: number;
  targets: number;
}

export interface SeasonResult {
  year: number;
  schedule: Schedule;
  weekSummaries: WeekSummary[];      // 18 entradas
  finalStandings: TeamStandings[];   // 32 entradas
  playerSeasonStats: PlayerSeasonStats;
}

export function simulateSeason(params: {
  teams: Team[];
  schedule: Schedule;
  userPlayer: Player;
  userTeamId: string;
  rng: SeededRandom;
}): SeasonResult {
  const { teams, schedule, userPlayer, userTeamId, rng } = params;

  // 1. Validaciones
  if (!teams.find(t => t.id === userTeamId)) {
    throw new Error(`User team not found: ${userTeamId}`);
  }
  if (schedule.games.length !== 272) {
    throw new Error(`Invalid schedule, games length must be 272. Found: ${schedule.games.length}`);
  }

  // 2. Inicialización
  const standingsMap = new Map<string, TeamStandings>();
  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      divisionWins: 0,
      divisionLosses: 0,
      divisionTies: 0,
    });
  }

  const playerSeasonStats: PlayerSeasonStats = {
    playerId: userPlayer.id,
    gamesPlayed: 0,
    passYards: 0,
    passTDs: 0,
    interceptions: 0,
    completions: 0,
    passAttempts: 0,
    rushYards: 0,
    rushTDs: 0,
    carries: 0,
    fumbles: 0,
    receivingYards: 0,
    receivingTDs: 0,
    receptions: 0,
    targets: 0,
  };

  const weekSummaries: WeekSummary[] = [];

  // 3. Loop semanal
  for (let w = 1; w <= 18; w++) {
    const gamesForWeek = schedule.games.filter(g => g.week === w);
    
    const byeTeams = teams
      .filter(t => !gamesForWeek.some(g => g.homeTeamId === t.id || g.awayTeamId === t.id))
      .map(t => t.id);

    const weekGames: GameResult[] = [];

    for (let i = 0; i < gamesForWeek.length; i++) {
      const game = gamesForWeek[i];
      const homeTeam = teams.find(t => t.id === game.homeTeamId);
      const awayTeam = teams.find(t => t.id === game.awayTeamId);

      if (!homeTeam || !awayTeam) {
        throw new Error(`Team not found for matchup: ${game.homeTeamId} vs ${game.awayTeamId}`);
      }

      let userPlayerTeam: 'home' | 'away' | undefined = undefined;
      if (game.homeTeamId === userTeamId) userPlayerTeam = 'home';
      else if (game.awayTeamId === userTeamId) userPlayerTeam = 'away';

      const isRivalryGame = homeTeam.rivalId === awayTeam.id || awayTeam.rivalId === homeTeam.id;

      const subRng = rng.derive(`week-${w}-game-${i}`);

      const context = {
        isPlayoff: false,
        isRivalryGame,
        isPrimetime: false,
        isHomeGame: true
      };

      const simGame = simulateGameFromTeams({
        homeTeam,
        awayTeam,
        context,
        userPlayer: userPlayerTeam ? userPlayer : undefined,
        userPlayerTeam,
        userPlayerScheme: 'Balanced',
        rng: subRng
      });

      // Actualización de standings
      const homeStandings = standingsMap.get(homeTeam.id)!;
      const awayStandings = standingsMap.get(awayTeam.id)!;

      if (simGame.homeScore > simGame.awayScore) {
        homeStandings.wins += 1;
        awayStandings.losses += 1;
        if (game.type === 'divisional') {
          homeStandings.divisionWins += 1;
          awayStandings.divisionLosses += 1;
        }
      } else if (simGame.homeScore < simGame.awayScore) {
        homeStandings.losses += 1;
        awayStandings.wins += 1;
        if (game.type === 'divisional') {
          homeStandings.divisionLosses += 1;
          awayStandings.divisionWins += 1;
        }
      } else {
        homeStandings.ties += 1;
        awayStandings.ties += 1;
        if (game.type === 'divisional') {
          homeStandings.divisionTies += 1;
          awayStandings.divisionTies += 1;
        }
      }

      homeStandings.pointsFor += simGame.homeScore;
      homeStandings.pointsAgainst += simGame.awayScore;
      awayStandings.pointsFor += simGame.awayScore;
      awayStandings.pointsAgainst += simGame.homeScore;

      // Acumular PlayerGameStats
      if (userPlayerTeam && simGame.userPlayerStats) {
        playerSeasonStats.gamesPlayed += 1;
        const stats = simGame.userPlayerStats;

        if (userPlayer.position === 'QB') {
          const qbStats = stats as QBDriveStats;
          playerSeasonStats.passAttempts += qbStats.passAttempts || 0;
          playerSeasonStats.completions += qbStats.completions || 0;
          playerSeasonStats.passYards += qbStats.passYards || 0;
          playerSeasonStats.passTDs += qbStats.passTDs || 0;
          playerSeasonStats.interceptions += qbStats.interceptions || 0;
          playerSeasonStats.carries += qbStats.rushAttempts || 0;
          playerSeasonStats.rushYards += qbStats.rushYards || 0;
          playerSeasonStats.rushTDs += qbStats.rushTDs || 0;
          playerSeasonStats.fumbles += qbStats.fumbles || 0;
        } else if (userPlayer.position === 'RB') {
          const rbStats = stats as RBDriveStats;
          playerSeasonStats.carries += rbStats.carries || 0;
          playerSeasonStats.rushYards += rbStats.rushYards || 0;
          playerSeasonStats.rushTDs += rbStats.rushTDs || 0;
          playerSeasonStats.fumbles += rbStats.fumbles || 0;
          playerSeasonStats.receptions += rbStats.receptions || 0;
          playerSeasonStats.receivingYards += rbStats.receivingYards || 0;
          playerSeasonStats.receivingTDs += rbStats.receivingTDs || 0;
          playerSeasonStats.targets += rbStats.targets || 0;
        } else if (userPlayer.position === 'WR') {
          const wrStats = stats as WRDriveStats;
          playerSeasonStats.targets += wrStats.targets || 0;
          playerSeasonStats.receptions += wrStats.receptions || 0;
          playerSeasonStats.receivingYards += wrStats.receivingYards || 0;
          playerSeasonStats.receivingTDs += wrStats.receivingTDs || 0;
        }
      }

      weekGames.push({
        week: w,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        type: game.type,
        homeScore: simGame.homeScore,
        awayScore: simGame.awayScore,
        winnerId: simGame.winnerTeamId,
        userGame: userPlayerTeam ? simGame : undefined
      });
    }

    weekSummaries.push({
      week: w,
      games: weekGames,
      byeTeams
    });
  }

  // 4. Ordenar standings
  const finalStandings: TeamStandings[] = [];
  const divisionOrder = [
    'Eastern_East',
    'Eastern_Atlantic',
    'Eastern_North',
    'Eastern_South',
    'Western_Central',
    'Western_Mountain',
    'Western_Pacific',
    'Western_Southwest'
  ];

  for (const divKey of divisionOrder) {
    const divTeams = teams.filter(t => `${t.conference}_${t.division}` === divKey);
    if (divTeams.length !== 4) {
      throw new Error(`Division ${divKey} does not have exactly 4 teams`);
    }

    const divStandings = divTeams.map(t => standingsMap.get(t.id)!);

    divStandings.sort((a, b) => {
      // 1. Win percentage
      const totalA = a.wins + a.losses + a.ties;
      const pctA = totalA > 0 ? (a.wins + 0.5 * a.ties) / totalA : 0;
      
      const totalB = b.wins + b.losses + b.ties;
      const pctB = totalB > 0 ? (b.wins + 0.5 * b.ties) / totalB : 0;

      if (pctA !== pctB) return pctB - pctA;

      // 2. Head-to-head
      let h2hWinsA = 0;
      let h2hWinsB = 0;
      for (const summary of weekSummaries) {
        for (const g of summary.games) {
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

    finalStandings.push(...divStandings);
  }

  // 5. Verificaciones finales
  if (weekSummaries.length !== 18) {
    throw new Error(`Expected 18 week summaries, got ${weekSummaries.length}`);
  }

  const totalGames = weekSummaries.reduce((sum, w) => sum + w.games.length, 0);
  if (totalGames !== 272) {
    throw new Error(`Expected 272 total games in week summaries, got ${totalGames}`);
  }

  for (const s of finalStandings) {
    if (s.wins + s.losses + s.ties !== 17) {
      throw new Error(`Team ${s.teamId} has ${s.wins + s.losses + s.ties} games played, expected 17`);
    }
  }

  if (finalStandings.length !== 32) {
    throw new Error(`Expected 32 final standings, got ${finalStandings.length}`);
  }

  if (playerSeasonStats.gamesPlayed !== 17) {
    throw new Error(`User player played ${playerSeasonStats.gamesPlayed} games, expected 17`);
  }

  return {
    year: schedule.year,
    schedule,
    weekSummaries,
    finalStandings,
    playerSeasonStats
  };
}
