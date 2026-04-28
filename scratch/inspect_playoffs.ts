import { loadTeams } from '../src/data/loadTeams';
import { generateSchedule } from '../src/engine/schedule';
import { simulateSeason } from '../src/engine/season';
import { simulatePlayoffs, PlayoffsResult, PlayoffGame } from '../src/engine/playoffs';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';

async function run() {
  const teams = loadTeams();
  const userTeamId = teams[0].id;
  
  const scheduleRng = new SeededRandom('inspection-playoffs-schedule');
  const playerRng = new SeededRandom('inspection-playoffs-player');
  const seasonRng = new SeededRandom('inspection-playoffs-season');
  const playoffsRng = new SeededRandom('inspection-playoffs-bracket');

  const userPlayer = createPlayer({
    position: 'QB',
    tier: 'user',
    rng: playerRng
  });

  const schedule = generateSchedule(teams, 0, scheduleRng);
  const seasonResult = simulateSeason({
    teams,
    schedule,
    userPlayer,
    userTeamId,
    rng: seasonRng
  });

  const playoffResult = simulatePlayoffs({
    seasonResult,
    teams,
    userPlayer,
    userTeamId,
    rng: playoffsRng
  });

  console.log('=== SEEDING ===\n');
  console.log('--- Eastern Conference ---');
  playoffResult.seeds.eastern.forEach(s => {
    console.log(`#${s.seed}. ${s.teamId} (${s.standings.wins}-${s.standings.losses}-${s.standings.ties}) - ${s.divisionWinner ? 'DivWinner' : 'WildCard'}`);
  });
  console.log('\n--- Western Conference ---');
  playoffResult.seeds.western.forEach(s => {
    console.log(`#${s.seed}. ${s.teamId} (${s.standings.wins}-${s.standings.losses}-${s.standings.ties}) - ${s.divisionWinner ? 'DivWinner' : 'WildCard'}`);
  });

  const printGame = (g: PlayoffGame) => {
    console.log(`#${g.homeSeed} ${g.homeTeamId} ${g.game.homeScore} - ${g.game.awayScore} ${g.awayTeamId} #${g.awaySeed}`);
    console.log(`  Winner: ${g.winnerId} | OT: ${g.wentToOvertime ? `Sí (${g.overtimeDrivesPlayed} drives)` : 'No'}`);
  };

  console.log('\n=== WILD CARD ROUND ===');
  console.log('--- Eastern ---');
  playoffResult.games.wildCard.filter(g => g.conference === 'Eastern').forEach(printGame);
  console.log('\n--- Western ---');
  playoffResult.games.wildCard.filter(g => g.conference === 'Western').forEach(printGame);

  console.log('\n=== DIVISIONAL ROUND ===');
  console.log('--- Eastern ---');
  playoffResult.games.divisional.filter(g => g.conference === 'Eastern').forEach(printGame);
  console.log('\n--- Western ---');
  playoffResult.games.divisional.filter(g => g.conference === 'Western').forEach(printGame);

  console.log('\n=== CONFERENCE CHAMPIONSHIP ===');
  console.log('--- Eastern ---');
  playoffResult.games.conferenceChampionship.filter(g => g.conference === 'Eastern').forEach(printGame);
  console.log('\n--- Western ---');
  playoffResult.games.conferenceChampionship.filter(g => g.conference === 'Western').forEach(printGame);

  console.log('\n=== CHAMPIONSHIP BOWL ===');
  console.log(`Venue: ${playoffResult.games.championshipBowl.venue}`);
  printGame(playoffResult.games.championshipBowl);

  const allGames = [
    ...playoffResult.games.wildCard,
    ...playoffResult.games.divisional,
    ...playoffResult.games.conferenceChampionship,
    playoffResult.games.championshipBowl
  ];
  const otGames = allGames.filter(g => g.wentToOvertime);
  const otPercentage = ((otGames.length / allGames.length) * 100).toFixed(1);

  console.log('\n=== RESUMEN ===');
  console.log(`Champion: ${playoffResult.champion}`);
  console.log(`Runner-up: ${playoffResult.runnerUp}`);
  console.log(`Total partidos jugados: ${allGames.length}`);
  console.log(`Partidos que fueron a OT: ${otGames.length} (${otPercentage}%)`);

  const userStandings = seasonResult.finalStandings.find(s => s.teamId === userTeamId)!;
  console.log(`\n=== USUARIO (${userPlayer.firstName} ${userPlayer.lastName}, QB, OVR ${userPlayer.overall}) ===`);
  console.log(`Equipo: ${userTeamId}`);
  console.log(`Récord regular season: ${userStandings.wins}-${userStandings.losses}-${userStandings.ties}`);
  console.log(`¿Clasificó? ${playoffResult.userMadePlayoffs ? 'Sí' : 'No'}`);

  if (playoffResult.userMadePlayoffs) {
    const userSeed = playoffResult.seeds.eastern.find(s => s.teamId === userTeamId) || playoffResult.seeds.western.find(s => s.teamId === userTeamId)!;
    console.log(`  Seed: #${userSeed.seed} (${userSeed.conference})`);
    console.log(`  Exit round: ${playoffResult.userPlayoffExitRound}`);
    console.log(`  === Stats playoffs ===`);
    console.log(`  - Games played: ${playoffResult.playerPlayoffStats.gamesPlayed}`);
    console.log(`  - Pass yards: ${playoffResult.playerPlayoffStats.passYards}`);
    console.log(`  - Pass TDs: ${playoffResult.playerPlayoffStats.passTDs}`);
    console.log(`  - INTs: ${playoffResult.playerPlayoffStats.interceptions}`);
    console.log(`  - Carries: ${playoffResult.playerPlayoffStats.carries}`);
    console.log(`  - Rush yards: ${playoffResult.playerPlayoffStats.rushYards}`);
  }

  console.log('\n=== OT STRESS TEST ===');
  let simsWithAtLeastOneOT = 0;
  let totalOTGames = 0;
  let totalOTDrives = 0;

  for (let i = 1; i <= 20; i++) {
    const stressRng = new SeededRandom(`ot-test-${i}`);
    const stressResult = simulatePlayoffs({
      seasonResult,
      teams,
      userPlayer,
      userTeamId,
      rng: stressRng
    });

    const stressAllGames = [
      ...stressResult.games.wildCard,
      ...stressResult.games.divisional,
      ...stressResult.games.conferenceChampionship,
      stressResult.games.championshipBowl
    ];
    const stressOTGames = stressAllGames.filter(g => g.wentToOvertime);
    if (stressOTGames.length > 0) simsWithAtLeastOneOT++;
    totalOTGames += stressOTGames.length;
    stressOTGames.forEach(g => totalOTDrives += g.overtimeDrivesPlayed);

    const otRounds = stressOTGames.map(g => g.round).join(', ');
    console.log(`Sim ${i}: ${stressResult.champion} | OT games: ${stressOTGames.length} | Total games to OT: [${otRounds}]`);
  }

  const avgDrives = totalOTGames > 0 ? (totalOTDrives / totalOTGames).toFixed(2) : '0.00';
  console.log('\nAl final del stress test:');
  console.log(`- Total simulaciones: 20`);
  console.log(`- Simulaciones con al menos 1 OT: ${simsWithAtLeastOneOT}`);
  console.log(`- Total partidos OT en las 20 simulaciones: ${totalOTGames}`);
  console.log(`- Promedio drives en OT: ${avgDrives}`);
}

run().catch(console.error);
