import { loadTeams } from '../src/data/loadTeams';
import { generateSchedule } from '../src/engine/schedule';
import { simulateSeason } from '../src/engine/season';
import { simulatePlayoffs } from '../src/engine/playoffs';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

async function main() {
  const master = new SeededRandom('healthcheck-v2');
  const teams = loadTeams();
  const userTeamId = teams[0].id;

  const N = 100;
  let totalCombinedScore = 0;
  const buckets = { '0-19': 0, '20-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0 };
  let highScoringGames = 0;
  let defensiveGames = 0;
  
  let totalTies = 0;
  let seasonsWith0Ties = 0;
  let seasonsWith1to3Ties = 0;
  let seasonsWith4PlusTies = 0;

  const allMaxWins: number[] = [];
  const allMinWins: number[] = [];
  let teamsAbove12 = 0;
  let teamsBelow5 = 0;

  const qbStats = {
    passYards: [] as number[],
    passTDs: [] as number[],
    ints: [] as number[],
    carries: [] as number[],
    rushYards: [] as number[],
    rushTDs: [] as number[],
    compPct: [] as number[]
  };

  let totalPlayoffGames = 0;
  let upsetCount = 0;

  const exitRoundsEast = { 'Wild Card': 0, 'Divisional': 0, 'Conference': 0, 'Championship Bowl': 0, 'Champion': 0 };
  const exitRoundsWest = { 'Wild Card': 0, 'Divisional': 0, 'Conference': 0, 'Championship Bowl': 0, 'Champion': 0 };

  let playoffOTGames = 0;
  let playoffOTDrives = 0;

  for (let i = 0; i < N; i++) {
    const seasonRng = master.derive(`season-${i}`);
    const year = i % 4;
    
    const player = createPlayer({ position: 'QB', tier: 'user', rng: seasonRng.derive('player') });
    
    const schedule = generateSchedule(teams, year, seasonRng.derive('sched'));
    
    const seasonResult = simulateSeason({
      teams,
      schedule,
      userPlayer: player,
      userTeamId,
      rng: seasonRng.derive('season')
    });
    
    const playoffsResult = simulatePlayoffs({
      seasonResult,
      teams,
      userPlayer: player,
      userTeamId,
      rng: seasonRng.derive('playoffs')
    });

    let seasonTies = 0;
    for (const week of seasonResult.weekSummaries) {
      for (const g of week.games) {
        const combined = g.homeScore + g.awayScore;
        totalCombinedScore += combined;
        
        if (combined < 20) buckets['0-19']++;
        else if (combined < 30) buckets['20-29']++;
        else if (combined < 40) buckets['30-39']++;
        else if (combined < 50) buckets['40-49']++;
        else if (combined < 60) buckets['50-59']++;
        else buckets['60+']++;

        if (combined >= 50) highScoringGames++;
        if (combined <= 20) defensiveGames++;

        if (g.winnerId === null) {
          seasonTies++;
          totalTies++;
        }
      }
    }
    
    if (seasonTies === 0) seasonsWith0Ties++;
    else if (seasonTies <= 3) seasonsWith1to3Ties++;
    else seasonsWith4PlusTies++;

    let maxW = 0;
    let minW = 20;
    for (const t of seasonResult.finalStandings) {
      if (t.wins > maxW) maxW = t.wins;
      if (t.wins < minW) minW = t.wins;
      if (t.wins > 12) teamsAbove12++;
      if (t.wins < 5) teamsBelow5++;
    }
    allMaxWins.push(maxW);
    allMinWins.push(minW);

    const s = seasonResult.playerSeasonStats;
    qbStats.passYards.push(s.passYards);
    qbStats.passTDs.push(s.passTDs);
    qbStats.ints.push(s.interceptions);
    qbStats.carries.push(s.carries);
    qbStats.rushYards.push(s.rushYards);
    qbStats.rushTDs.push(s.rushTDs);
    const compPct = s.passAttempts > 0 ? (s.completions / s.passAttempts) * 100 : 0;
    qbStats.compPct.push(compPct);

    const allPlayoffGames = [
      ...playoffsResult.games.wildCard,
      ...playoffsResult.games.divisional,
      ...playoffsResult.games.conferenceChampionship,
      playoffsResult.games.championshipBowl
    ];
    totalPlayoffGames += allPlayoffGames.length;

    for (const g of allPlayoffGames) {
      const isUpset = (g.winnerId === g.homeTeamId && g.homeSeed > g.awaySeed) ||
                      (g.winnerId === g.awayTeamId && g.awaySeed > g.homeSeed);
      if (isUpset) upsetCount++;

      if (g.wentToOvertime) {
        playoffOTGames++;
        playoffOTDrives += g.overtimeDrivesPlayed;
      }
    }

    const east1 = playoffsResult.seeds.eastern[0].teamId;
    const west1 = playoffsResult.seeds.western[0].teamId;

    const findExitRound = (teamId: string) => {
      if (playoffsResult.champion === teamId) return 'Champion';
      const cb = playoffsResult.games.championshipBowl;
      if (cb.homeTeamId === teamId || cb.awayTeamId === teamId) {
         if (cb.winnerId !== teamId) return 'Championship Bowl';
      }
      for (const g of playoffsResult.games.conferenceChampionship) {
        if ((g.homeTeamId === teamId || g.awayTeamId === teamId) && g.winnerId !== teamId) return 'Conference';
      }
      for (const g of playoffsResult.games.divisional) {
        if ((g.homeTeamId === teamId || g.awayTeamId === teamId) && g.winnerId !== teamId) return 'Divisional';
      }
      for (const g of playoffsResult.games.wildCard) {
        if ((g.homeTeamId === teamId || g.awayTeamId === teamId) && g.winnerId !== teamId) return 'Wild Card';
      }
      return 'Unknown';
    };

    const eExit = findExitRound(east1);
    const wExit = findExitRound(west1);
    
    if (eExit !== 'Unknown') exitRoundsEast[eExit as keyof typeof exitRoundsEast]++;
    if (wExit !== 'Unknown') exitRoundsWest[wExit as keyof typeof exitRoundsWest]++;
  }

  const totalRegularGames = 272 * N;
  const avgCombinedScore = totalCombinedScore / totalRegularGames;

  const bPct = (k: keyof typeof buckets) => ((buckets[k] / totalRegularGames) * 100).toFixed(1);

  const avgTies = totalTies / N;
  
  const avgMaxWins = (mean(allMaxWins)).toFixed(1);
  const avgMinWins = (mean(allMinWins)).toFixed(1);
  
  const totalTeamsSeasons = 32 * N;
  const pctAbove12 = ((teamsAbove12 / totalTeamsSeasons) * 100).toFixed(1);
  const pctBelow5 = ((teamsBelow5 / totalTeamsSeasons) * 100).toFixed(1);

  const formatStat = (arr: number[]) => {
    return {
      mean: Math.round(mean(arr)),
      median: Math.round(median(arr)),
      min: Math.min(...arr),
      max: Math.max(...arr)
    };
  };

  const passYds = formatStat(qbStats.passYards);
  const passTDs = formatStat(qbStats.passTDs);
  const ints = formatStat(qbStats.ints);
  const carries = formatStat(qbStats.carries);
  const rushYds = formatStat(qbStats.rushYards);
  const rushTDs = formatStat(qbStats.rushTDs);
  const compPct = formatStat(qbStats.compPct);

  const upsetRate = ((upsetCount / totalPlayoffGames) * 100).toFixed(1);
  
  const eExitPct = (k: keyof typeof exitRoundsEast) => ((exitRoundsEast[k] / N) * 100).toFixed(1);
  const wExitPct = (k: keyof typeof exitRoundsWest) => ((exitRoundsWest[k] / N) * 100).toFixed(1);

  const playoffOTRate = ((playoffOTGames / totalPlayoffGames) * 100).toFixed(1);
  const avgOTDrivesStr = playoffOTGames > 0 ? (playoffOTDrives / playoffOTGames).toFixed(1) : "0.0";

  console.log(`=== HEALTHCHECK V2.0 — N=100 SEASONS ===`);
  console.log(``);
  console.log(`--- SCORING POR PARTIDO ---`);
  console.log(`Promedio combined score: ${avgCombinedScore.toFixed(1)} | NFL real: ~44 | Diff: ${(avgCombinedScore - 44).toFixed(1)}`);
  console.log(`Distribución (% partidos):`);
  console.log(`  0-19:  ${bPct('0-19')}%  | NFL real: <5%`);
  console.log(`  20-29: ${bPct('20-29')}%  | NFL real: ~15%`);
  console.log(`  30-39: ${bPct('30-39')}%  | NFL real: ~30%`);
  console.log(`  40-49: ${bPct('40-49')}%  | NFL real: ~30%`);
  console.log(`  50-59: ${bPct('50-59')}%  | NFL real: ~15%`);
  console.log(`  60+:   ${bPct('60+')}%  | NFL real: ~5%`);
  console.log(``);
  console.log(`--- EMPATES ---`);
  console.log(`Total empates en 100 temporadas: ${totalTies}`);
  console.log(`Promedio empates/temporada: ${avgTies.toFixed(2)}  | NFL real: ~1`);
  console.log(`Temporadas sin empates: ${seasonsWith0Ties}/100  | NFL real: 50-70%`);
  console.log(``);
  console.log(`--- RECORDS ---`);
  console.log(`Best record promedio: ${avgMaxWins}-${(17 - parseFloat(avgMaxWins)).toFixed(1)}  | NFL real: 13-4 a 15-2`);
  console.log(`Worst record promedio: ${avgMinWins}-${(17 - parseFloat(avgMinWins)).toFixed(1)} | NFL real: 1-16 a 4-13`);
  console.log(`% equipos >12 wins: ${pctAbove12}%               | NFL real: ~10-15%`);
  console.log(`% equipos <5 wins: ${pctBelow5}%                | NFL real: ~10-15%`);
  console.log(``);
  console.log(`--- USER QB STATS (REGULAR SEASON) ---`);
  console.log(`               Media | Mediana | Min | Max | NFL real (élite)`);
  console.log(`Pass yards:    ${passYds.mean.toString().padEnd(4)} | ${passYds.median.toString().padEnd(7)} | ${passYds.min.toString().padEnd(3)} | ${passYds.max.toString().padEnd(3)} | 4500+`);
  console.log(`Pass TDs:      ${passTDs.mean.toString().padEnd(4)} | ${passTDs.median.toString().padEnd(7)} | ${passTDs.min.toString().padEnd(3)} | ${passTDs.max.toString().padEnd(3)} | 30-45`);
  console.log(`INTs:          ${ints.mean.toString().padEnd(4)} | ${ints.median.toString().padEnd(7)} | ${ints.min.toString().padEnd(3)} | ${ints.max.toString().padEnd(3)} | 8-12`);
  console.log(`Carries:       ${carries.mean.toString().padEnd(4)} | ${carries.median.toString().padEnd(7)} | ${carries.min.toString().padEnd(3)} | ${carries.max.toString().padEnd(3)} | <60 (Lamar récord 176)`);
  console.log(`Rush yards:    ${rushYds.mean.toString().padEnd(4)} | ${rushYds.median.toString().padEnd(7)} | ${rushYds.min.toString().padEnd(3)} | ${rushYds.max.toString().padEnd(3)} | <500 (Lamar récord 1206)`);
  console.log(`Rush TDs:      ${rushTDs.mean.toString().padEnd(4)} | ${rushTDs.median.toString().padEnd(7)} | ${rushTDs.min.toString().padEnd(3)} | ${rushTDs.max.toString().padEnd(3)} | <8 (Cam récord 14)`);
  console.log(`Completion %:  ${compPct.mean}%  |         |     |     | 60-70%`);
  console.log(``);
  console.log(`--- PLAYOFFS ---`);
  console.log(`Upset rate (seed más bajo gana): ${upsetRate}%  | NFL real: ~30%`);
  console.log(`Seed #1 Eastern conf alcanza:`);
  console.log(`  Wild Card exit: ${eExitPct('Wild Card')}%`);
  console.log(`  Divisional exit: ${eExitPct('Divisional')}%`);
  console.log(`  Conference exit: ${eExitPct('Conference')}%`);
  console.log(`  Championship Bowl: ${eExitPct('Championship Bowl')}%`);
  console.log(`  Champion: ${eExitPct('Champion')}%`);
  console.log(`Seed #1 Western conf alcanza:`);
  console.log(`  Wild Card exit: ${wExitPct('Wild Card')}%`);
  console.log(`  Divisional exit: ${wExitPct('Divisional')}%`);
  console.log(`  Conference exit: ${wExitPct('Conference')}%`);
  console.log(`  Championship Bowl: ${wExitPct('Championship Bowl')}%`);
  console.log(`  Champion: ${wExitPct('Champion')}%`);
  console.log(``);
  console.log(`--- OVERTIME ---`);
  console.log(`% playoff games a OT: ${playoffOTRate}%  | NFL real: ~5-8%`);
  console.log(`Promedio drives en OT: ${avgOTDrivesStr}`);
  console.log(``);
  console.log(`--- CONCLUSIÓN ---`);
}

main().catch(console.error);
