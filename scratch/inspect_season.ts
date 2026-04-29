import { loadTeams } from '../src/data/loadTeams';
import { generateSchedule } from '../src/engine/schedule';
import { createPlayer } from '../src/engine/player';
import { simulateSeason } from '../src/engine/season';
import { SeededRandom } from '../src/engine/prng';

async function main() {
  const teams = loadTeams();
  const scheduleRng = new SeededRandom('inspection-season');
  const schedule = generateSchedule(teams, 0, scheduleRng);
  
  const playerRng = new SeededRandom('inspection-player');
  const userPlayer = createPlayer({ position: 'QB', tier: 'user', rng: playerRng });
  const userTeamId = teams[0].id;
  
  const seasonRng = new SeededRandom('inspection-season-sim');
  const result = simulateSeason({
    teams,
    schedule,
    userPlayer,
    userTeamId,
    rng: seasonRng
  });

  console.log(`=== SEASON 0 - STANDINGS ===\n`);

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

  for (const divName of divisionOrder) {
    console.log(`--- ${divName} ---`);
    const divStandings = result.finalStandings.filter(s => {
        const team = teams.find(t => t.id === s.teamId)!;
        return `${team.conference}_${team.division}` === divName;
    });
    
    // finalStandings is already sorted, but let's be sure
    divStandings.forEach((s, idx) => {
      const diff = s.pointsFor - s.pointsAgainst;
      console.log(`${idx + 1}. ${s.teamId}: ${s.wins}-${s.losses}-${s.ties} | PF: ${s.pointsFor} PA: ${s.pointsAgainst} DIFF: ${diff} | DivRecord: ${s.divisionWins}-${s.divisionLosses}-${s.divisionTies}`);
    });
    console.log('');
  }

  const allStandings = result.finalStandings;
  const winPct = (s: any) => (s.wins + 0.5 * s.ties) / 17;
  
  const bestTeam = [...allStandings].sort((a, b) => winPct(b) - winPct(a) || b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst))[0];
  const worstTeam = [...allStandings].sort((a, b) => winPct(a) - winPct(b) || a.pointsFor - a.pointsAgainst - (b.pointsFor - b.pointsAgainst))[0];
  
  const totalPoints = allStandings.reduce((sum, s) => sum + s.pointsFor, 0);
  const avgPoints = totalPoints / 272;
  const winningRecords = allStandings.filter(s => s.wins > 8).length;
  const losingRecords = allStandings.filter(s => s.wins < 8).length;
  const fiveHundred = allStandings.filter(s => (s.wins === 8 || s.wins === 9) && s.ties === 0 && (s.wins + s.losses === 17)).length;
  const totalTies = allStandings.reduce((sum, s) => sum + s.ties, 0);

  console.log(`=== LEAGUE-WIDE STATS ===`);
  console.log(`- Mejor record: ${bestTeam.teamId} (${bestTeam.wins}-${bestTeam.losses}-${bestTeam.ties})`);
  console.log(`- Peor record: ${worstTeam.teamId} (${worstTeam.wins}-${worstTeam.losses}-${worstTeam.ties})`);
  console.log(`- Total puntos en la temporada: ${totalPoints}`);
  console.log(`- Promedio puntos por partido: ${avgPoints.toFixed(2)}`);
  console.log(`- Equipos con récord ganador (>8 wins): ${winningRecords}`);
  console.log(`- Equipos con récord perdedor (<8 wins): ${losingRecords}`);
  console.log(`- Equipos en .500 exacto (8-9 o 9-8 con 0 ties): ${fiveHundred}`);
  console.log(`- Total empates en la liga: ${totalTies / 2}`);
  console.log('');

  const userStats = result.playerSeasonStats;
  const userTeamStanding = allStandings.find(s => s.teamId === userTeamId)!;
  const completionPct = userStats.passAttempts > 0 ? (userStats.completions / userStats.passAttempts * 100).toFixed(1) : '0.0';

  console.log(`=== USER PLAYER (${userPlayer.firstName} ${userPlayer.lastName}, QB, OVR ${userPlayer.overall}) ===`);
  console.log(`Equipo: ${userTeamId} | Record del equipo: ${userTeamStanding.wins}-${userTeamStanding.losses}-${userTeamStanding.ties}`);
  console.log(`- Games played: 17`);
  console.log(`- Pass yards: ${userStats.passYards}`);
  console.log(`- Pass TDs: ${userStats.passTDs}`);
  console.log(`- INTs: ${userStats.interceptions}`);
  console.log(`- Completions/Attempts: ${userStats.completions}/${userStats.passAttempts} (${completionPct}%)`);
  console.log(`- Carries: ${userStats.carries}`);
  console.log(`- Rush yards: ${userStats.rushYards}`);
  console.log(`- Rush TDs: ${userStats.rushTDs}`);
  console.log(`- Fumbles: ${userStats.fumbles}`);
}

main();
