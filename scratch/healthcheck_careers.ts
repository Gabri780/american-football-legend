import { loadTeams } from '../src/data/loadTeams';
import { simulateCareer } from '../src/engine/career';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';
import { FreeAgencyDecisionCallback } from '../src/engine/contracts';
import { WealthDecisionCallback } from '../src/engine/wealth';
import { Team } from '../src/engine/team';

const N_CAREERS = 100;

const faCallback: FreeAgencyDecisionCallback = (offers, ctx) => {
  if (offers.length === 0) return null;

  // NUEVO: si player es veterano y todas las ofertas son humillantes, rechazar
  if (ctx.player.age >= 35) {
    const maxSalary = Math.max(...offers.map(o => o.salaryPerYear));
    if (maxSalary < 5) return null; // se retira antes que firmar por menos de $5M
  }

  // resto de lógica existente intacta
  if (offers.length === 1 && offers[0].isExtension) return offers[0];
  if (ctx.player.age >= 33) {
    const contender = offers.find(o => o.isContender);
    if (contender) return contender;
  }
  const sorted = [...offers].sort((a, b) =>
    (b.years * b.salaryPerYear) - (a.years * a.salaryPerYear)
  );
  return sorted[0];
};

const wealthCallback: WealthDecisionCallback = () => ({
  buyPropertyIds: [], sellPropertyIds: [],
  buyVehicleIds: [], sellVehicleIds: []
});

function pickRandomTeamId(teams: Team[], seed: string): string {
  const rng = new SeededRandom(seed);
  return teams[rng.randomInt(0, teams.length - 1)].id;
}

function runHealthcheck() {
  const teams = loadTeams();
  const results = [];

  console.log(`Starting ${N_CAREERS} career simulations...`);

  for (let i = 0; i < N_CAREERS; i++) {
    const playerSeed = `player-${i}`;
    const careerSeed = `career-${i}`;
    const teamSeed = `team-${i}`;

    const userPlayer = createPlayer({
      rng: new SeededRandom(playerSeed),
      position: 'QB',
      tier: 'user'
    });

    const initialTeamId = pickRandomTeamId(teams, teamSeed);

    try {
      const result = simulateCareer({
        teams,
        userPlayer,
        userTeamId: initialTeamId,
        startYear: 2024,
        rng: new SeededRandom(careerSeed),
        faCallback,
        wealthCallback,
        retireDecisionCallback: () => true,
        maxYears: 25
      });

      results.push({
        yearsPlayed: result.yearsPlayed,
        retirementReason: result.retirementReason,
        peakOverall: result.peakOverall,
        initialOverall: result.playerAtStart.overall,
        championshipsWon: result.championshipsWon,
        superBowlAppearances: result.superBowlAppearances,
        userDraftPick: result.userDraftPick,
        finalTeamId: result.history[result.history.length - 1].teamId
      });
    } catch (e: any) {
      process.stderr.write(`Career ${i} CRASHED: ${e.message}\n`);
      results.push({
        yearsPlayed: -1,
        retirementReason: 'CRASHED',
        peakOverall: -1,
        initialOverall: -1,
        championshipsWon: -1,
        superBowlAppearances: -1,
        userDraftPick: -1,
        finalTeamId: 'CRASHED'
      });
    }

    if ((i + 1) % 10 === 0) {
      process.stdout.write(`Completed ${i + 1}/${N_CAREERS} careers...\n`);
    }
  }

  // Reporting
  console.log('\n=== HEALTHCHECK DE CARRERAS (N=100) ===');

  const crashedCount = results.filter(r => r.retirementReason === 'CRASHED').length;
  console.log(`\n== CARRERAS CRASHADAS: ${crashedCount}/${N_CAREERS} (${crashedCount}%) ==`);
  console.log('Las carreras crasheadas se EXCLUYEN del resto de stats.');
  const validResults = results.filter(r => r.retirementReason !== 'CRASHED');

  const champsDist = { 0: 0, 1: 0, 2: 0, 3: 0, '4+': 0 };
  validResults.forEach(r => {
    if (r.championshipsWon >= 4) champsDist['4+']++;
    else champsDist[r.championshipsWon as 0 | 1 | 2 | 3]++;
  });

  console.log('\n== DISTRIBUCIÓN DE CHAMPIONSHIPS ==');
  console.log(`0 championships: ${champsDist[0]} carreras (${(champsDist[0] / validResults.length * 100).toFixed(0)}%)  | Target: 65%`);
  console.log(`1 championship:  ${champsDist[1]} carreras (${(champsDist[1] / validResults.length * 100).toFixed(0)}%)  | Target: 20%`);
  console.log(`2 championships: ${champsDist[2]} carreras (${(champsDist[2] / validResults.length * 100).toFixed(0)}%)  | Target: 10%`);
  console.log(`3 championships: ${champsDist[3]} carreras (${(champsDist[3] / validResults.length * 100).toFixed(0)}%)  | Target: 4%`);
  console.log(`4+ championships: ${champsDist['4+']} carreras (${(champsDist['4+'] / validResults.length * 100).toFixed(0)}%) | Target: 1%`);

  const peakOvrDist = { '<75': 0, '75-79': 0, '80-84': 0, '85-89': 0, '90-94': 0, '95+': 0 };
  validResults.forEach(r => {
    if (r.peakOverall < 75) peakOvrDist['<75']++;
    else if (r.peakOverall < 80) peakOvrDist['75-79']++;
    else if (r.peakOverall < 85) peakOvrDist['80-84']++;
    else if (r.peakOverall < 90) peakOvrDist['85-89']++;
    else if (r.peakOverall < 95) peakOvrDist['90-94']++;
    else peakOvrDist['95+']++;
  });

  const eliteCount = peakOvrDist['90-94'] + peakOvrDist['95+'];
  console.log('\n== DISTRIBUCIÓN DE PEAK OVR ==');
  console.log(`Peak OVR < 75:  ${peakOvrDist['<75']} (${(peakOvrDist['<75'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`Peak OVR 75-79: ${peakOvrDist['75-79']} (${(peakOvrDist['75-79'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`Peak OVR 80-84: ${peakOvrDist['80-84']} (${(peakOvrDist['80-84'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`Peak OVR 85-89: ${peakOvrDist['85-89']} (${(peakOvrDist['85-89'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`Peak OVR 90-94: ${peakOvrDist['90-94']} (${(peakOvrDist['90-94'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`Peak OVR 95+:   ${peakOvrDist['95+']} (${(peakOvrDist['95+'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`% Élite (peak ≥ 90): ${(eliteCount / validResults.length * 100).toFixed(0)}% | Target: 10-15%`);

  const yearsPlayedDist = { '<5': 0, '5-9': 0, '10-14': 0, '15-19': 0, '20+': 0 };
  let totalYears = 0;
  validResults.forEach(r => {
    totalYears += r.yearsPlayed;
    if (r.yearsPlayed < 5) yearsPlayedDist['<5']++;
    else if (r.yearsPlayed < 10) yearsPlayedDist['5-9']++;
    else if (r.yearsPlayed < 15) yearsPlayedDist['10-14']++;
    else if (r.yearsPlayed < 20) yearsPlayedDist['15-19']++;
    else yearsPlayedDist['20+']++;
  });

  const longCareers = yearsPlayedDist['15-19'] + yearsPlayedDist['20+'];
  console.log('\n== DISTRIBUCIÓN DE YEARS PLAYED ==');
  console.log(`< 5 years:   ${yearsPlayedDist['<5']} (${(yearsPlayedDist['<5'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`5-9 years:   ${yearsPlayedDist['5-9']} (${(yearsPlayedDist['5-9'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`10-14 years: ${yearsPlayedDist['10-14']} (${(yearsPlayedDist['10-14'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`15-19 years: ${yearsPlayedDist['15-19']} (${(yearsPlayedDist['15-19'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`20+ years:   ${yearsPlayedDist['20+']} (${(yearsPlayedDist['20+'] / validResults.length * 100).toFixed(0)}%)`);
  console.log(`Media: ${(totalYears / validResults.length).toFixed(1)} years`);
  console.log(`% que duran ≥ 15 years: ${(longCareers / validResults.length * 100).toFixed(0)}% | Target: 25-35%`);

  const retireReasonDist: Record<string, number> = {};
  validResults.forEach(r => {
    retireReasonDist[r.retirementReason] = (retireReasonDist[r.retirementReason] || 0) + 1;
  });

  console.log('\n== DISTRIBUCIÓN DE RETIREMENT REASON ==');
  Object.entries(retireReasonDist).forEach(([reason, count]) => {
    console.log(`${reason}: ${count} (${(count / validResults.length * 100).toFixed(0)}%)`);
  });

  const hofTierCount = validResults.filter(r => r.peakOverall >= 90 && r.championshipsWon >= 2).length;
  console.log('\n== HOF TIER (peak ≥ 90 + champ ≥ 2) ==');
  console.log(`N carreras HOF tier: ${hofTierCount} (${(hofTierCount / validResults.length * 100).toFixed(0)}%) | Target: <5%`);

  const sbApps = validResults.filter(r => r.superBowlAppearances > 0).length;
  const onlySBApps = validResults.filter(r => r.superBowlAppearances > 0 && r.championshipsWon === 0).length;
  console.log('\n== SUPER BOWL APPEARANCES (NO ganados) ==');
  console.log(`0 SB appearances: ${validResults.length - sbApps} (${((validResults.length - sbApps) / validResults.length * 100).toFixed(0)}%)`);
  console.log(`1+ SB appearances (pero 0 ganados): ${onlySBApps} (${(onlySBApps / validResults.length * 100).toFixed(0)}%)`);

  console.log('\n== RELACIÓN OVR INICIAL → PEAK OVR ==');
  const initialGroups = [
    { label: '< 70', filter: (r: any) => r.initialOverall < 70 },
    { label: '70-74', filter: (r: any) => r.initialOverall >= 70 && r.initialOverall < 75 },
    { label: '75-79', filter: (r: any) => r.initialOverall >= 75 && r.initialOverall < 80 },
    { label: '80-84', filter: (r: any) => r.initialOverall >= 80 && r.initialOverall < 85 },
    { label: '85+', filter: (r: any) => r.initialOverall >= 85 }
  ];

  initialGroups.forEach(g => {
    const group = validResults.filter(g.filter);
    const avgPeak = group.length > 0 ? (group.reduce((sum, r) => sum + r.peakOverall, 0) / group.length).toFixed(1) : 'N/A';
    console.log(`Initial OVR ${g.label}: avg peak ${avgPeak} (n=${group.length})`);
  });

  console.log('\n== RELACIÓN DRAFT PICK → CHAMPIONSHIPS ==');
  const draftGroups = [
    { label: '1-5', filter: (r: any) => r.userDraftPick >= 1 && r.userDraftPick <= 5 },
    { label: '6-15', filter: (r: any) => r.userDraftPick >= 6 && r.userDraftPick <= 15 },
    { label: '16-25', filter: (r: any) => r.userDraftPick >= 16 && r.userDraftPick <= 25 },
    { label: '26-32', filter: (r: any) => r.userDraftPick >= 26 && r.userDraftPick <= 32 }
  ];

  draftGroups.forEach(g => {
    const group = validResults.filter(g.filter);
    const avgChamps = group.length > 0 ? (group.reduce((sum, r) => sum + r.championshipsWon, 0) / group.length).toFixed(2) : 'N/A';
    console.log(`Pick ${g.label}: avg champs ${avgChamps} (n=${group.length})`);
  });

  console.log('\n== TOP 5 CARRERAS (más championships) ==');
  const top5 = [...validResults].sort((a, b) => b.championshipsWon - a.championshipsWon || b.peakOverall - a.peakOverall).slice(0, 5);
  top5.forEach((r, idx) => {
    console.log(`${idx + 1}. initialOVR: ${r.initialOverall}, peakOVR: ${r.peakOverall}, team: ${r.finalTeamId}, champs: ${r.championshipsWon}, years: ${r.yearsPlayed}`);
  });

  console.log('\n== BOTTOM 5 CARRERAS (sin championships, peor peak) ==');
  const bottom5 = validResults.filter(r => r.championshipsWon === 0).sort((a, b) => a.peakOverall - b.peakOverall).slice(0, 5);
  bottom5.forEach((r, idx) => {
    console.log(`${idx + 1}. initialOVR: ${r.initialOverall}, peakOVR: ${r.peakOverall}, team: ${r.finalTeamId}, years: ${r.yearsPlayed}`);
  });

  console.log('\n== CONCLUSIÓN ==');
  console.log('[Investigación completada. Resultados listos para análisis.]');
}

runHealthcheck();
