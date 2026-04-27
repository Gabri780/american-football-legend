import { loadTeams } from '../src/data/loadTeams';
import { generateSchedule } from '../src/engine/schedule';
import { SeededRandom } from '../src/engine/prng';

function main() {
  const teams = loadTeams();
  const rng = new SeededRandom('inspection-1');
  const schedule = generateSchedule(teams, 0, rng);

  const teamMap = new Map(teams.map(t => [t.id, t]));
  const matchupsByType: Record<string, number> = {};

  // Per team stats
  const teamStats = new Map<string, {
    homeGames: number;
    awayGames: number;
    byeWeek: number;
    rivals: string[];
  }>();

  for (const team of teams) {
    teamStats.set(team.id, {
      homeGames: 0,
      awayGames: 0,
      byeWeek: schedule.byeWeeks.get(team.id) || 0,
      rivals: []
    });
  }

  for (let w = 1; w <= 18; w++) {
    console.log(`=== SEMANA ${w} ===`);
    
    const weekGames = schedule.games.filter(g => g.week === w);
    const playingTeams = new Set<string>();
    for (const g of weekGames) {
      playingTeams.add(g.homeTeamId);
      playingTeams.add(g.awayTeamId);
      
      const homeTeam = teamMap.get(g.homeTeamId)!;
      const awayTeam = teamMap.get(g.awayTeamId)!;
      
      console.log(`${awayTeam.abbreviation} @ ${homeTeam.abbreviation} (${g.type})`);
      
      // Update global stats
      matchupsByType[g.type] = (matchupsByType[g.type] || 0) + 1;
      
      // Update team stats
      const hStats = teamStats.get(g.homeTeamId)!;
      hStats.homeGames++;
      hStats.rivals.push(`${awayTeam.abbreviation}(A)`);
      
      const aStats = teamStats.get(g.awayTeamId)!;
      aStats.awayGames++;
      aStats.rivals.push(`${homeTeam.abbreviation}(H)`);
    }

    const byeTeams = teams
      .filter(t => !playingTeams.has(t.id))
      .map(t => t.abbreviation);
    
    console.log(`Byes: ${byeTeams.length > 0 ? byeTeams.join(', ') : 'None'}`);
    console.log(`Total partidos: ${weekGames.length}`);
    console.log('');
  }

  console.log('=== RESUMEN FINAL ===');
  console.log(`Total partidos: ${schedule.games.length}`);
  console.log('Partidos por tipo:');
  for (const [type, count] of Object.entries(matchupsByType)) {
    console.log(`- ${type}: ${count}`);
  }
  console.log('');
  
  console.log('Estadísticas por equipo:');
  const sortedTeams = [...teams].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
  for (const team of sortedTeams) {
    const stats = teamStats.get(team.id)!;
    console.log(`${team.abbreviation}: ${stats.homeGames} Home / ${stats.awayGames} Away / Bye: ${stats.byeWeek}`);
    console.log(`   Rivales: ${stats.rivals.join(', ')}`);
  }
}

main();
