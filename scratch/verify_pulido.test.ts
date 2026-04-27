import { SeededRandom } from '../src/engine/prng';
import { simulateGame } from '../src/engine/game';
import { createPlayer } from '../src/engine/player';

const rng = new SeededRandom('verify-pulido');
const qb = createPlayer({ rng, position: 'QB', firstName: 'Tyler', lastName: 'Boone', tier: 'user' });

const game = simulateGame({
  homeTeamId: 'Cavalry',
  awayTeamId: 'Blizzard',
  homeOffenseRating: 85,
  homeDefenseRating: 80,
  awayOffenseRating: 75,
  awayDefenseRating: 70,
  context: { isPlayoff: false, isRivalryGame: false, isPrimetime: false, isHomeGame: true },
  userPlayer: qb,
  userPlayerTeam: 'home',
  rng
});

console.log(`--- GAME VERIFICATION ---`);
console.log(`Game ID: ${game.id}`);
console.log(`Score: ${game.homeTeamId} ${game.homeScore} - ${game.awayTeamId} ${game.awayScore}`);

console.log(`\n--- DRIVE IDs ---`);
game.drives.slice(0, 5).forEach(d => {
  console.log(`Drive ID: ${d.id} | Team: ${d.teamOnOffenseId} | Q: ${d.quarter}`);
});

console.log(`\n--- SAFETY CHECK ---`);
// Find a safety if possible, otherwise we iterate with different seeds
let safetyGame = game;
let foundSafety = false;

for (let i = 0; i < 500; i++) {
  const g = simulateGame({
    homeTeamId: 'H', awayTeamId: 'A',
    homeOffenseRating: 40, homeDefenseRating: 99,
    awayOffenseRating: 40, awayDefenseRating: 99,
    context: { isPlayoff: false, isRivalryGame: false, isPrimetime: false, isHomeGame: true },
    rng: new SeededRandom(`safety-hunt-${i}`)
  });
  const safetyDrive = g.drives.find(d => d.outcome === 'SAFETY');
  if (safetyDrive) {
    console.log(`Safety found in game: ${g.id}`);
    console.log(`Drive Outcome: ${safetyDrive.outcome}`);
    console.log(`Points Scored (Offense): ${safetyDrive.pointsScored}`);
    console.log(`Defensive Points Scored: ${safetyDrive.defensivePointsScored}`);
    console.log(`Team on Offense: ${safetyDrive.teamOnOffenseId}`);
    
    // Check if team stats updated correctly
    const offStats = safetyDrive.teamOnOffenseId === 'H' ? g.homeStats : g.awayStats;
    const defStats = safetyDrive.teamOnOffenseId === 'H' ? g.awayStats : g.homeStats;
    console.log(`Defensive Team Score: ${defStats.pointsScored} (should include 2 from safety if first score)`);
    foundSafety = true;
    break;
  }
}

if (!foundSafety) console.log("No safety found in 500 attempts.");
