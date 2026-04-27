import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';

const rng = new SeededRandom('sample-players-3b');

console.log('--- SAMPLE PROCEDURAL PLAYERS ---');
for (let i = 0; i < 5; i++) {
  const p = createPlayer({
    rng,
    position: rng.pick(['QB', 'RB', 'WR']),
    tier: rng.pick(['star', 'regular'])
  });
  console.log(`Player ${i + 1}: ${p.firstName} ${p.lastName} | Pos: ${p.position} | College: ${p.collegeId}`);
}
