import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { simulateCareer, CareerResult } from '../src/engine/career';
import { SeededRandom } from '../src/engine/prng';
import { Team } from '../src/engine/team';

// Replicating internal logic for inspection
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function ageLeague(teams: Team[], rng: SeededRandom): void {
  for (const team of teams) {
    const offDrift = rng.randomInt(-3, 3);
    const defDrift = rng.randomInt(-3, 3);
    team.offenseRating = clamp(team.offenseRating + offDrift, 40, 99);
    team.defenseRating = clamp(team.defenseRating + defDrift, 40, 99);
  }
}

async function main() {
  const initialTeams = loadTeams();
  const userTeamId = initialTeams[0].id;
  const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('inspect-career-player') });
  
  const startYear = 0;
  const careerRngSeed = 'inspect-career-main';
  const result: CareerResult = simulateCareer({
    teams: initialTeams,
    userPlayer: player,
    userTeamId,
    startYear,
    retireDecisionCallback: () => true,
    rng: new SeededRandom(careerRngSeed),
    maxYears: 25
  });

  console.log(`=== JUGADOR INICIAL ===`);
  console.log(`${result.playerAtStart.firstName} ${result.playerAtStart.lastName} | Posición: ${result.playerAtStart.position} | Edad inicio: ${result.playerAtStart.age}`);
  console.log(`OVR inicial: ${result.playerAtStart.overall} | Potential: ${result.playerAtStart.potential}`);
  console.log(`College: ${result.playerAtStart.collegeId} | Equipo: ${userTeamId}`);
  console.log(``);
  console.log(`=== TRAYECTORIA AÑO POR AÑO ===`);

  result.history.forEach((entry) => {
    const isPeak = entry.ovrAtEnd === result.peakOverall;
    console.log(``);
    console.log(`--- Year ${entry.year} (Age ${entry.ageAtSeason}) ---`);
    console.log(`OVR: ${entry.ovrAtStart} → ${entry.ovrAtEnd}${isPeak ? " ★ PEAK" : ""}`);
    console.log(`Record: ${entry.regularSeasonRecord.wins}-${entry.regularSeasonRecord.losses}-${entry.regularSeasonRecord.ties}`);
    console.log(`Playoffs: ${entry.madePlayoffs ? `Sí — exit: ${entry.playoffExitRound}` : "No"}`);
    console.log(`League champion: ${entry.leagueChampionTeamId}`);
    console.log(``);
    console.log(`Stats regular season:`);
    console.log(`- Games: ${entry.regularSeasonStats.gamesPlayed}`);
    console.log(`- Pass: ${entry.regularSeasonStats.passYards}yds, ${entry.regularSeasonStats.passTDs}TD, ${entry.regularSeasonStats.interceptions}INT`);
    console.log(`- Comp/Att: ${entry.regularSeasonStats.completions}/${entry.regularSeasonStats.passAttempts}`);
    console.log(`- Rush: ${entry.regularSeasonStats.carries}car, ${entry.regularSeasonStats.rushYards}yds, ${entry.regularSeasonStats.rushTDs}TD, ${entry.regularSeasonStats.fumbles}FUM`);

    if (entry.madePlayoffs) {
      console.log(``);
      console.log(`Stats playoffs:`);
      console.log(`- Games: ${entry.playoffStats.gamesPlayed}`);
      console.log(`- Pass: ${entry.playoffStats.passYards}yds, ${entry.playoffStats.passTDs}TD, ${entry.playoffStats.interceptions}INT`);
      console.log(`- Rush: ${entry.playoffStats.carries}car, ${entry.playoffStats.rushYards}yds, ${entry.playoffStats.rushTDs}TD`);
    }
  });

  console.log(``);
  console.log(`=== RESUMEN DE CARRERA ===`);
  console.log(`Years played: ${result.yearsPlayed}`);
  console.log(`Start year: ${result.startYear} | End year: ${result.endYear}`);
  console.log(`Retirement reason: ${result.retirementReason}`);
  console.log(``);
  console.log(`Peak OVR: ${result.peakOverall}`);
  console.log(`Final OVR: ${result.playerAtEnd.overall}`);
  console.log(`Final age: ${result.playerAtEnd.age}`);
  console.log(``);
  console.log(`Championships ganados: ${result.championshipsWon}`);
  console.log(`Championship Bowl appearances: ${result.superBowlAppearances}`);
  console.log(`Playoffs hechos: ${result.history.filter(h => h.madePlayoffs).length}`);

  const reg = result.careerRegularStats;
  const compPct = reg.passAttempts > 0 ? ((reg.completions / reg.passAttempts) * 100).toFixed(1) : "0.0";
  console.log(``);
  console.log(`=== STATS DE CARRERA — REGULAR SEASON ===`);
  console.log(`Games: ${reg.gamesPlayed}`);
  console.log(`Pass: ${reg.passYards}yds, ${reg.passTDs}TD, ${reg.interceptions}INT`);
  console.log(`Comp/Att: ${reg.completions}/${reg.passAttempts} (${compPct}%)`);
  console.log(`Rush: ${reg.carries}car, ${reg.rushYards}yds, ${reg.rushTDs}TD, ${reg.fumbles}FUM`);

  const play = result.careerPlayoffStats;
  console.log(``);
  console.log(`=== STATS DE CARRERA — PLAYOFFS ===`);
  console.log(`Games: ${play.gamesPlayed}`);
  console.log(`Pass: ${play.passYards}yds, ${play.passTDs}TD, ${play.interceptions}INT`);
  console.log(`Rush: ${play.carries}car, ${play.rushYards}yds, ${play.rushTDs}TD`);

  console.log(``);
  console.log(`=== EVOLUCIÓN DE LA LIGA ===`);
  
  // Recreate team aging
  const finalTeams = structuredClone(initialTeams);
  const mainRng = new SeededRandom(careerRngSeed);
  for (let y = 0; y < result.yearsPlayed; y++) {
    const curYear = startYear + y;
    ageLeague(finalTeams, mainRng.derive(`league-aging-y${curYear}`));
  }

  const teamDeltas = initialTeams.map((t, i) => {
    const finalT = finalTeams[i];
    const initialTotal = t.offenseRating + t.defenseRating;
    const finalTotal = finalT.offenseRating + finalT.defenseRating;
    return {
      id: t.id,
      initialTotal,
      finalTotal,
      delta: finalTotal - initialTotal
    };
  });

  const improvements = [...teamDeltas].sort((a, b) => b.delta - a.delta).slice(0, 3);
  const declines = [...teamDeltas].sort((a, b) => a.delta - b.delta).slice(0, 3);

  console.log(`Top 3 mejoras (mayor incremento OVR total):`);
  improvements.forEach((t, i) => {
    console.log(`${i+1}. ${t.id}: ${t.initialTotal} → ${t.finalTotal} (${t.delta > 0 ? "+" : ""}${t.delta})`);
  });

  console.log(``);
  console.log(`Top 3 caídas (mayor decremento OVR total):`);
  declines.forEach((t, i) => {
    console.log(`${i+1}. ${t.id}: ${t.initialTotal} → ${t.finalTotal} (${t.delta})`);
  });
}

main();
