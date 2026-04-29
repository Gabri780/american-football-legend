import { loadTeams } from '../src/data/loadTeams';
import { simulateCareer } from '../src/engine/career';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';

function run() {
  const teams = loadTeams();
  const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('inspect-contracts-player') });
  const startTeamId = teams[0].id;

  const result = simulateCareer({
    teams,
    userPlayer: player,
    userTeamId: startTeamId,
    startYear: 0,
    retireDecisionCallback: (ctx) => true,
    rng: new SeededRandom('inspect-contracts-main'),
    maxYears: 25,
    faCallback: (offers, ctx) => {
      if (offers.length === 1 && offers[0].isExtension) {
        return offers[0];
      }

      if (ctx.player.age >= 33) {
        const contender = offers.find(o => o.isContender);
        if (contender) return contender;
      }

      offers.sort((a, b) => (b.years * b.salaryPerYear) - (a.years * a.salaryPerYear));
      return offers[0];
    }
  });

  console.log('=== JUGADOR INICIAL ===');
  console.log(`Nombre: ${player.firstName} ${player.lastName}`);
  console.log(`Posición: ${player.position}`);
  console.log(`OVR Inicial: ${result.playerAtStart.overall}`);
  console.log(`Equipo Asignado: ${startTeamId}`);
  console.log('');

  const rookieEvent = result.contractsHistory.events[0];
  console.log('=== CONTRATO ROOKIE ===');
  console.log(`Equipo: ${rookieEvent.newTeamId}`);
  console.log(`Años Totales: ${rookieEvent.yearsTotal}`);
  console.log(`Salario por año: $${(rookieEvent.contractValue / rookieEvent.yearsTotal).toFixed(2)}M`);
  console.log(`Garantizado: $${rookieEvent.guaranteedTotal.toFixed(2)}M`);
  console.log(`Bonus de firma: $${(rookieEvent.guaranteedTotal * 0.3).toFixed(2)}M`);
  console.log(`Valor Total: $${rookieEvent.contractValue.toFixed(2)}M`);
  console.log('');

  console.log('=== EVENTOS CONTRACTUALES ===');
  result.contractsHistory.events.forEach((evt, idx) => {
    let teamStr = evt.newTeamId;
    if (evt.oldTeamId && evt.oldTeamId !== evt.newTeamId) {
      teamStr = `From ${evt.oldTeamId} to ${evt.newTeamId}`;
    }

    console.log(`[Año ${evt.year}] Tipo: ${evt.type}`);
    console.log(`  Team: ${teamStr}`);
    console.log(`  Años: ${evt.yearsTotal}`);
    console.log(`  Valor Total: $${evt.contractValue.toFixed(2)}M`);
    console.log(`  Garantizado: $${evt.guaranteedTotal.toFixed(2)}M`);
  });
  console.log('');

  console.log('=== RESUMEN DE CARRERA ===');
  console.log(`Años Jugados: ${result.yearsPlayed}`);
  console.log(`Edad Final: ${result.playerAtEnd.age}`);
  console.log(`Razón de Retiro: ${result.retirementReason}`);
  console.log(`Peak OVR: ${result.peakOverall}`);
  console.log(`OVR Final: ${result.playerAtEnd.overall}`);
  console.log(`Championships Ganados: ${result.championshipsWon}`);
  console.log('');

  console.log('=== FINANZAS DE CARRERA ===');
  console.log(`Total Earnings: $${result.contractsHistory.totalEarnings.toFixed(2)}M`);
  console.log(`Promedio por Año: $${(result.contractsHistory.totalEarnings / Math.max(1, result.yearsPlayed)).toFixed(2)}M`);
  console.log(`Total Contratos Firmados: ${result.contractsHistory.events.length}`);
  console.log('');

  console.log('=== EQUIPOS A LO LARGO DE LA CARRERA ===');
  result.history.forEach(entry => {
    let extra = entry.madePlayoffs ? ` | Playoffs Exit: ${entry.playoffExitRound}` : '';
    console.log(`Año ${entry.year} | Team: ${entry.teamId} | Age: ${entry.ageAtSeason} | OVR: ${entry.ovrAtStart} -> ${entry.ovrAtEnd} | Record: ${entry.regularSeasonRecord.wins}-${entry.regularSeasonRecord.losses}${extra}`);
  });
}

run();
