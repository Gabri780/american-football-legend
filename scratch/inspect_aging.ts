import { loadTeams } from '../src/data/loadTeams';
import { SeededRandom } from '../src/engine/prng';

// Helper: aplica la misma fórmula que career.ts ageLeague
const LEAGUE_MEAN_RATING = 70;
const REVERSION_STRENGTH = 0.05;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function ageLeague(teams: any[], rng: SeededRandom): void {
  for (const team of teams) {
    const offDistance = team.offenseRating - LEAGUE_MEAN_RATING;
    const defDistance = team.defenseRating - LEAGUE_MEAN_RATING;
    const offReversion = -offDistance * REVERSION_STRENGTH;
    const defReversion = -defDistance * REVERSION_STRENGTH;
    const offNoise = rng.randomInt(-3, 3);
    const defNoise = rng.randomInt(-3, 3);
    team.offenseRating = clamp(Math.round(team.offenseRating + offReversion + offNoise), 40, 99);
    team.defenseRating = clamp(Math.round(team.defenseRating + defReversion + defNoise), 40, 99);
  }
}

const teams = loadTeams();
const masterRng = new SeededRandom('aging-inspect');

// Snapshot inicial
console.log('=== INICIAL (Year 0) ===');
const sortedInitial = [...teams].sort((a, b) =>
  (b.offenseRating + b.defenseRating) - (a.offenseRating + a.defenseRating)
);
console.log('Top 5:');
sortedInitial.slice(0, 5).forEach(t =>
  console.log(`  ${t.id}: ${t.offenseRating}/${t.defenseRating} (combined ${t.offenseRating + t.defenseRating})`)
);
console.log('Bottom 5:');
sortedInitial.slice(-5).forEach(t =>
  console.log(`  ${t.id}: ${t.offenseRating}/${t.defenseRating} (combined ${t.offenseRating + t.defenseRating})`)
);
const initialAvg = teams.reduce((s, t) => s + t.offenseRating + t.defenseRating, 0) / teams.length;
console.log(`Media combined: ${initialAvg.toFixed(1)}`);
console.log('');

// Trackear 3 equipos: top combined inicial, bottom combined inicial, medio (combined cerca de 140)
const trackTopId = sortedInitial[0].id;
const trackBottomId = sortedInitial[sortedInitial.length - 1].id;
const trackMidId = sortedInitial[Math.floor(sortedInitial.length / 2)].id;

console.log(`Tracking 3 teams across years:`);
console.log(`  TOP:    ${trackTopId} (initial ${sortedInitial[0].offenseRating + sortedInitial[0].defenseRating})`);
console.log(`  MID:    ${trackMidId} (initial ${sortedInitial[Math.floor(sortedInitial.length / 2)].offenseRating + sortedInitial[Math.floor(sortedInitial.length / 2)].defenseRating})`);
console.log(`  BOTTOM: ${trackBottomId} (initial ${sortedInitial[sortedInitial.length - 1].offenseRating + sortedInitial[sortedInitial.length - 1].defenseRating})`);
console.log('');

console.log('=== EVOLUCIÓN AÑO A AÑO ===');
console.log(`Year | TOP combined | MID combined | BOTTOM combined | Liga avg`);

for (let year = 1; year <= 25; year++) {
  ageLeague(teams, masterRng.derive(`league-aging-y${year}`));

  const topTeam = teams.find((t: any) => t.id === trackTopId)!;
  const midTeam = teams.find((t: any) => t.id === trackMidId)!;
  const bottomTeam = teams.find((t: any) => t.id === trackBottomId)!;
  const avg = teams.reduce((s: number, t: any) => s + t.offenseRating + t.defenseRating, 0) / teams.length;

  const topComb = topTeam.offenseRating + topTeam.defenseRating;
  const midComb = midTeam.offenseRating + midTeam.defenseRating;
  const bottomComb = bottomTeam.offenseRating + bottomTeam.defenseRating;

  console.log(`Year ${year.toString().padStart(2, ' ')} | ${topComb.toString().padStart(3, ' ')}          | ${midComb.toString().padStart(3, ' ')}          | ${bottomComb.toString().padStart(3, ' ')}             | ${avg.toFixed(1)}`);
}

console.log('');
console.log('=== FINAL (Year 25) ===');
const sortedFinal = [...teams].sort((a: any, b: any) =>
  (b.offenseRating + b.defenseRating) - (a.offenseRating + a.defenseRating)
);
console.log('Top 5:');
sortedFinal.slice(0, 5).forEach((t: any) =>
  console.log(`  ${t.id}: ${t.offenseRating}/${t.defenseRating} (combined ${t.offenseRating + t.defenseRating})`)
);
console.log('Bottom 5:');
sortedFinal.slice(-5).forEach((t: any) =>
  console.log(`  ${t.id}: ${t.offenseRating}/${t.defenseRating} (combined ${t.offenseRating + t.defenseRating})`)
);
const finalAvg = teams.reduce((s: number, t: any) => s + t.offenseRating + t.defenseRating, 0) / teams.length;
console.log(`Media combined: ${finalAvg.toFixed(1)}`);
