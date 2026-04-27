import { SeededRandom } from '../src/engine/prng';
import { simulateGame } from '../src/engine/game';
import { createPlayer } from '../src/engine/player';
import { QBDriveStats } from '../src/engine/playerDriveStats';

const rng = new SeededRandom('sample-game-v2');
const qb = createPlayer({
  rng,
  position: 'QB',
  firstName: 'Tyler',
  lastName: 'Boone',
  tier: 'user',
  options: { forceArchetype: 'Pocket Passer' }
});

const game = simulateGame({
  homeTeamId: 'CAVALRY',
  awayTeamId: 'BLIZZARD',
  homeOffenseRating: 88,
  homeDefenseRating: 85,
  awayOffenseRating: 75,
  awayDefenseRating: 78,
  context: { isPlayoff: false, isRivalryGame: true, isPrimetime: true, isHomeGame: true },
  userPlayer: qb,
  userPlayerTeam: 'home',
  userPlayerScheme: 'Balanced',
  rng: rng.derive('game')
});

console.log(`--- PARTIDO DE MUESTRA (Task 6D: Reloj) ---`);
console.log(`${game.homeTeamId} ${game.homeScore} - ${game.awayTeamId} ${game.awayScore}`);
console.log(`Drives totales: ${game.drives.length}`);

const qDist = { 1: 0, 2: 0, 3: 0, 4: 0 };
let totalTime = 0;
game.drives.forEach(d => {
  qDist[d.quarter as 1 | 2 | 3 | 4]++;
  totalTime += d.timeConsumed;
});

console.log(`Distribución por Quarter: Q1:${qDist[1]}, Q2:${qDist[2]}, Q3:${qDist[3]}, Q4:${qDist[4]}`);
console.log(`Tiempo total acumulado: ${totalTime}s (de 3600s)`);
console.log(`--------------------------`);
console.log(`USER PLAYER STATS (Tyler Boone, QB):`);
const stats = game.userPlayerStats as QBDriveStats;
console.log(`Pass Attempts: ${stats.passAttempts}`);
console.log(`Completions: ${stats.completions} (${((stats.completions / stats.passAttempts) * 100).toFixed(1)}%)`);
console.log(`Pass Yards: ${stats.passYards}`);
console.log(`Pass TDs: ${stats.passTDs}`);
console.log(`Interceptions: ${stats.interceptions}`);
