import { SeededRandom } from './src/engine/prng';
import { createPlayer } from './src/engine/player';
import { simulateDrive, GameContext } from './src/engine/drive';
import {
  computePlayerDriveStats,
  QBDriveStats,
  RBDriveStats,
  WRDriveStats
} from './src/engine/playerDriveStats';

const rng = new SeededRandom('stats-demo');
const defaultContext: GameContext = {
  isPlayoff: false,
  isRivalryGame: false,
  isPrimetime: false,
  isHomeGame: true
};

const qb = createPlayer({
  rng: rng.derive('qb'),
  position: 'QB',
  firstName: 'Elite',
  lastName: 'QB',
  tier: 'star',
  options: { forceArchetype: 'Pocket Passer', potentialMin: 90 }
});

const rb = createPlayer({
  rng: rng.derive('rb'),
  position: 'RB',
  firstName: 'Power',
  lastName: 'Back',
  tier: 'star',
  options: { forceArchetype: 'Power Back', potentialMin: 85 }
});

const wr = createPlayer({
  rng: rng.derive('wr'),
  position: 'WR',
  firstName: 'Possession',
  lastName: 'WR',
  tier: 'star',
  options: { forceArchetype: 'Possession', potentialMin: 85 }
});

const N_DRIVES = 187;

let qbSeason = { passYards: 0, passTDs: 0, interceptions: 0, rushTDs: 0 };
let rbSeason = { rushYards: 0, rushTDs: 0, receivingTDs: 0, carries: 0 };
let wrSeason = { receivingYards: 0, receivingTDs: 0, receptions: 0 };

for (let i = 0; i < N_DRIVES; i++) {
  const drive = simulateDrive(80, 75, 'OFF', 'DEF', 25, 1, defaultContext, rng.derive(`d${i}`));

  const qbStats = computePlayerDriveStats(drive, qb, 'Balanced', rng.derive(`s-qb-${i}`)) as QBDriveStats;
  qbSeason.passYards += qbStats.passYards;
  qbSeason.passTDs += qbStats.passTDs;
  qbSeason.interceptions += qbStats.interceptions;
  qbSeason.rushTDs += qbStats.rushTDs;

  const rbStats = computePlayerDriveStats(drive, rb, 'RunHeavy', rng.derive(`s-rb-${i}`)) as RBDriveStats;
  rbSeason.rushYards += rbStats.rushYards;
  rbSeason.rushTDs += rbStats.rushTDs;
  rbSeason.receivingTDs += rbStats.receivingTDs;
  rbSeason.carries += rbStats.carries;

  const wrStats = computePlayerDriveStats(drive, wr, 'Balanced', rng.derive(`s-wr-${i}`)) as WRDriveStats;
  wrSeason.receivingYards += wrStats.receivingYards;
  wrSeason.receivingTDs += wrStats.receivingTDs;
  wrSeason.receptions += wrStats.receptions;
}

console.log('--- QB SEASON STATS (Balanced) ---');
console.log(qbSeason);
console.log('\n--- RB SEASON STATS (RunHeavy) ---');
console.log(rbSeason);
console.log('\n--- WR SEASON STATS (Balanced) ---');
console.log(wrSeason);
