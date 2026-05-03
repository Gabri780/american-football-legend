import { simulateCareer } from '../src/engine/career';
import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';

const teams = loadTeams();
let totalGamesPlayed = 0;
let totalYears = 0;
let totalCareers = 0;
let careersAffectedByInjury = 0; // games < years * 17

for (let i = 0; i < 20; i++) {
  const player = createPlayer({ 
    position: 'RB', tier: 'user', 
    rng: new SeededRandom(`smoke-${i}`),
    options: { ageOverride: 22 }
  });
  const result = simulateCareer({
    teams, userPlayer: player, userTeamId: teams[0].id,
    startYear: 2024,
    retireDecisionCallback: () => false,
    faCallback: (offers) => offers[0] ?? null,
    wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
    rng: new SeededRandom(`smoke-rng-${i}`),
    maxYears: 25
  });
  
  totalGamesPlayed += result.careerRegularStats.gamesPlayed;
  totalYears += result.yearsPlayed;
  totalCareers++;
  if (result.careerRegularStats.gamesPlayed < result.yearsPlayed * 17) {
    careersAffectedByInjury++;
  }
}

const avgGamesPerYear = totalGamesPlayed / totalYears;
const dnpRate = 1 - (avgGamesPerYear / 17);
console.log(`Avg games/year: ${avgGamesPerYear.toFixed(2)} of 17`);
console.log(`DNP rate: ${(dnpRate * 100).toFixed(1)}%`);
console.log(`Careers with injuries: ${careersAffectedByInjury}/${totalCareers}`);
