import { SeededRandom } from '../src/engine/prng';
import { simulateGame } from '../src/engine/game';
import { createPlayer } from '../src/engine/player';

const rng = new SeededRandom('pulido-b-verify');

function runSample(name: string, homeRating: number, awayRating: number) {
  const game = simulateGame({
    homeTeamId: 'HOMETOWN_HEROES',
    awayTeamId: 'AWAY_VILLAINS',
    homeOffenseRating: homeRating,
    homeDefenseRating: homeRating,
    awayOffenseRating: awayRating,
    awayDefenseRating: awayRating,
    context: { isPlayoff: false, isRivalryGame: false, isPrimetime: false, isHomeGame: true },
    rng: new SeededRandom(name)
  });

  console.log(`\n=== SAMPLE: ${name} ===`);
  console.log(`Score: ${game.homeTeamId} ${game.homeScore} - ${game.awayTeamId} ${game.awayScore}`);
  console.log(`Winner: ${game.winnerTeamId || 'TIE'}`);
  console.log(`Highlight: ${game.highlightPlay}`);
}

runSample('BLOWOUT_TEST', 99, 40);
runSample('CLOSED_TEST', 75, 75);
