import { simulateGame, SimulateGameParams } from '../src/engine/game';
import { SeededRandom } from '../src/engine/prng';
import { createPlayer } from '../src/engine/player';

const rng = new SeededRandom('sample-game-final');
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
  homeOffenseRating: 85,
  homeDefenseRating: 82,
  awayOffenseRating: 75,
  awayDefenseRating: 70,
  context: {
    isPlayoff: false,
    isRivalryGame: true,
    isPrimetime: true,
    isHomeGame: true
  },
  userPlayer: qb,
  userPlayerTeam: 'home',
  userPlayerScheme: 'Balanced',
  rng: new SeededRandom('game-seed-123')
};

const game = simulateGame(params);

console.log('--- FINAL GAME NARRATIVE ---');
console.log('Summary:', game.summary);
console.log('Highlight Play:', game.highlightPlay);
console.log('\n--- DRIVE EXAMPLES ---');
for (let i = 0; i < 3; i++) {
  const d = game.drives[i];
  console.log(`Drive ${i + 1}:`);
  console.log(`  Description: ${d.description}`);
  console.log(`  Highlight: ${d.highlight}`);
}
