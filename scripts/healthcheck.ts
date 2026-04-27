import { SeededRandom } from '../src/engine/prng';
import { simulateGame } from '../src/engine/game';
import { createPlayer } from '../src/engine/player';
import { QBDriveStats } from '../src/engine/playerDriveStats';

const N_GAMES = 100;
const results = {
    scores: [] as number[],
    homeScores: [] as number[],
    awayScores: [] as number[],
    drives: [] as number[],
    ties: 0,
    homeWins: 0,
    awayWins: 0,
    outcomeCounts: {} as Record<string, number>,
    qbPassYards: [] as number[],
    qbPassTDs: [] as number[],
    qbInts: [] as number[],
    qbCompletions: [] as number[],
    qbAttempts: [] as number[],
};

const rng = new SeededRandom('healthcheck-master');

for (let i = 0; i < N_GAMES; i++) {
    const qb = createPlayer({
        rng: rng.derive(`qb-${i}`),
        position: 'QB',
        tier: 'user',
        options: { forceArchetype: 'Pocket Passer' }
    });

    const game = simulateGame({
        homeTeamId: 'TEST_HOME',
        awayTeamId: 'TEST_AWAY',
        homeOffenseRating: 80,
        homeDefenseRating: 75,
        awayOffenseRating: 78,
        awayDefenseRating: 73,
        context: { isPlayoff: false, isRivalryGame: false, isPrimetime: false, isHomeGame: true },
        userPlayer: qb,
        userPlayerTeam: 'home',
        userPlayerScheme: 'Balanced',
        rng: rng.derive(`game-${i}`)
    });

    results.scores.push(game.homeScore + game.awayScore);
    results.homeScores.push(game.homeScore);
    results.awayScores.push(game.awayScore);
    results.drives.push(game.drives.length);

    if (game.winnerTeamId === null) results.ties++;
    else if (game.winnerTeamId === game.homeTeamId) results.homeWins++;
    else results.awayWins++;

    game.drives.forEach(d => {
        results.outcomeCounts[d.outcome] = (results.outcomeCounts[d.outcome] || 0) + 1;
    });

    if (game.userPlayerStats) {
        const s = game.userPlayerStats as QBDriveStats;
        results.qbPassYards.push(s.passYards);
        results.qbPassTDs.push(s.passTDs);
        results.qbInts.push(s.interceptions);
        results.qbCompletions.push(s.completions);
        results.qbAttempts.push(s.passAttempts);
    }
}

const avg = (arr: number[]) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
const min = (arr: number[]) => Math.min(...arr);
const max = (arr: number[]) => Math.max(...arr);

console.log('=================================');
console.log(`HEALTH CHECK: ${N_GAMES} games simulated`);
console.log('=================================\n');

console.log('--- GAME OUTCOMES ---');
console.log(`Home wins: ${results.homeWins} | Away wins: ${results.awayWins} | Ties: ${results.ties}`);
console.log(`Home win rate: ${(results.homeWins / N_GAMES * 100).toFixed(1)}%`);

console.log('\n--- SCORES ---');
console.log(`Combined score (home + away):`);
console.log(`  Avg: ${avg(results.scores)} | Min: ${min(results.scores)} | Max: ${max(results.scores)}`);
console.log(`Home avg: ${avg(results.homeScores)} | Away avg: ${avg(results.awayScores)}`);

console.log('\n--- DRIVES PER GAME ---');
console.log(`Avg: ${avg(results.drives)} | Min: ${min(results.drives)} | Max: ${max(results.drives)}`);

console.log('\n--- DRIVE OUTCOMES (across all drives) ---');
const totalDrives = Object.values(results.outcomeCounts).reduce((a, b) => a + b, 0);
Object.entries(results.outcomeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => {
        const pct = (v / totalDrives * 100).toFixed(1);
        console.log(`  ${k.padEnd(20)} ${v.toString().padStart(5)} (${pct}%)`);
    });

console.log('\n--- USER QB STATS PER GAME ---');
console.log(`Pass Yards: avg ${avg(results.qbPassYards)} | min ${min(results.qbPassYards)} | max ${max(results.qbPassYards)}`);
console.log(`Pass TDs: avg ${avg(results.qbPassTDs)} | min ${min(results.qbPassTDs)} | max ${max(results.qbPassTDs)}`);
console.log(`INTs: avg ${avg(results.qbInts)} | min ${min(results.qbInts)} | max ${max(results.qbInts)}`);
console.log(`Completions: avg ${avg(results.qbCompletions)}`);
console.log(`Attempts: avg ${avg(results.qbAttempts)}`);
const compPct = (results.qbCompletions.reduce((a, b) => a + b) / results.qbAttempts.reduce((a, b) => a + b) * 100).toFixed(1);
console.log(`Completion %: ${compPct}%`);

console.log('\n=================================');