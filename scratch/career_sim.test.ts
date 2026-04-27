import { SeededRandom } from '../src/engine/prng';
import { createPlayer } from '../src/engine/player';
import { progressPlayer } from '../src/engine/progression';

const rng = new SeededRandom('career-sample');

function simulateCareer(position: 'QB' | 'RB' | 'WR', tier: 'user' | 'star' | 'regular') {
  const player = createPlayer({ 
    rng, 
    position, 
    tier, 
    firstName: 'Johnny', 
    lastName: 'Career' 
  });
  
  player.age = 21;
  player.potential = tier === 'user' ? 92 : (tier === 'star' ? 95 : 78);
  player.workEthic = 85;

  console.log(`\n=== SIMULATED CAREER: ${player.firstName} ${player.lastName} (${player.position}, ${player.tier}) ===`);
  console.log(`Initial OVR: ${player.overall} | Potential: ${player.potential} | Work Ethic: ${player.workEthic}`);
  console.log(`------------------------------------------------------------------`);

  const ovrs: { age: number, ovr: number, retired: boolean }[] = [{ age: player.age, ovr: player.overall, retired: false }];

  for (let year = 1; year <= 20; year++) {
    const result = progressPlayer(player, { rng: rng.derive(`year-${year}`) });
    ovrs.push({ age: player.age, ovr: player.overall, retired: result.retired });
    
    if (result.retired) {
      console.log(`[YEAR ${year}] Age: ${player.age} | OVR: ${player.overall} | RETIRED!`);
      break;
    } else {
      const suggest = result.shouldConsiderRetirement ? ' (Consider retirement)' : '';
      console.log(`[YEAR ${year}] Age: ${player.age} | OVR: ${player.overall}${suggest}`);
    }
  }

  console.log(`------------------------------------------------------------------`);
}

simulateCareer('QB', 'user');
simulateCareer('RB', 'star');
simulateCareer('WR', 'regular');
