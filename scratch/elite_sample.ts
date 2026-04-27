import { simulateGame, SimulateGameParams } from '../src/engine/game';
import { SeededRandom } from '../src/engine/prng';
import { createPlayer } from '../src/engine/player';

const rng = new SeededRandom('elite-qb-sample');
const qb = createPlayer({
  rng,
  position: 'QB',
  firstName: 'Johnny',
  lastName: 'Hero',
  tier: 'user'
});

const params: SimulateGameParams = {
  homeTeamId: 'CAVALRY',
  awayTeamId: 'BLIZZARD',
  homeOffenseRating: 99, // Elite offense
  homeDefenseRating: 90,
  awayOffenseRating: 40,
  awayDefenseRating: 40, // Terrible defense
  context: {
    isPlayoff: false,
    isRivalryGame: true,
    isPrimetime: true,
    isHomeGame: true
  },
  userPlayer: qb,
  userPlayerTeam: 'home',
  userPlayerScheme: 'AirRaid', // Air Raid to maximize pass yards
  rng: new SeededRandom('game-seed-elite-1')
};

const game = simulateGame(params);

console.log('--- FINAL GAME NARRATIVE (ELITE QB) ---');
console.log('Summary:', game.summary);
console.log('Highlight Play:', game.highlightPlay);
if (game.userPlayerStats) {
  console.log('QB Stats:', game.userPlayerStats);
}
