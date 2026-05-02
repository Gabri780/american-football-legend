import { loadTeams } from '../src/data/loadTeams';
import { simulateCareer } from '../src/engine/career';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';
import { FreeAgencyDecisionCallback } from '../src/engine/contracts';
import { WealthDecisionCallback, WealthDecisions } from '../src/engine/wealth';

async function main() {
  const teams = loadTeams();
  const userTeamId = teams[0].id;

  const userPlayer = createPlayer({
    rng: new SeededRandom('inspect-v2-player'),
    position: 'QB',
    tier: 'user'
  });

  // faCallback realista
  const faCallback: FreeAgencyDecisionCallback = (offers, ctx) => {
    if (offers.length === 0) return null;
    if (offers.length === 1 && offers[0].isExtension) return offers[0];
    if (ctx.player.age >= 33) {
      const contender = offers.find(o => o.isContender);
      if (contender) return contender;
    }
    const sorted = [...offers].sort((a, b) =>
      (b.years * b.salaryPerYear) - (a.years * a.salaryPerYear)
    );
    return sorted[0];
  };

  // wealthCallback realista
  const wealthCallback: WealthDecisionCallback = (state, ctx) => {
    const result: WealthDecisions = {
      buyPropertyIds: [], sellPropertyIds: [],
      buyVehicleIds: [], sellVehicleIds: []
    };
    if (ctx.year === 0 && state.balance > 5) {
      const cheapest = [...state.marketProperties].sort((a, b) => a.price - b.price)[0];
      if (cheapest && cheapest.price <= state.balance) result.buyPropertyIds.push(cheapest.id);
    }
    if (ctx.year >= 5 && state.balance > 20) {
      const hasSuper = state.ownedVehicles.some(ov =>
        ov.vehicle.type === 'supercar' || ov.vehicle.type === 'hypercar'
      );
      if (!hasSuper) {
        const supercar = state.marketVehicles.find(v =>
          (v.type === 'supercar' || v.type === 'hypercar') && v.price <= state.balance
        );
        if (supercar) result.buyVehicleIds.push(supercar.id);
      }
    }
    if (ctx.year >= 8 && state.balance > 30 && state.ownedProperties.length < 2) {
      const affordable = state.marketProperties
        .filter(p => p.price <= state.balance / 2)
        .sort((a, b) => b.price - a.price);
      if (affordable.length > 0) result.buyPropertyIds.push(affordable[0].id);
    }
    return result;
  };

  const result = simulateCareer({
    teams,
    userPlayer,
    userTeamId,
    startYear: 0,
    retireDecisionCallback: () => true,
    faCallback,
    wealthCallback,
    rng: new SeededRandom('inspect-v2-main'),
    maxYears: 25
  });

  // === REPORTE ===

  console.log('=== JUGADOR INICIAL ===');
  console.log(`Nombre: ${result.playerAtStart.firstName} ${result.playerAtStart.lastName}`);
  console.log(`Posición: ${result.playerAtStart.position}`);
  console.log(`OVR inicial: ${result.playerAtStart.overall}`);
  console.log(`Equipo asignado: ${userTeamId}`);
  console.log(`*** Drafted #${result.userDraftPick} overall in the Year 0 PFL Draft ***`);
  console.log('');

  // CONTEXTO DE LIGA AL INICIO
  console.log('=== CONTEXTO DE LA LIGA AL INICIO ===');
  const teamsByCombined = [...teams].sort((a, b) =>
    (b.offenseRating + b.defenseRating) - (a.offenseRating + a.defenseRating)
  );
  console.log('Top 5 equipos (combined rating):');
  teamsByCombined.slice(0, 5).forEach((t, i) => {
    console.log(`  ${i+1}. ${t.id}: OFF ${t.offenseRating} / DEF ${t.defenseRating} (combined ${t.offenseRating + t.defenseRating})`);
  });
  console.log('Bottom 5 equipos (combined rating):');
  teamsByCombined.slice(-5).forEach((t, i) => {
    console.log(`  ${28+i}. ${t.id}: OFF ${t.offenseRating} / DEF ${t.defenseRating} (combined ${t.offenseRating + t.defenseRating})`);
  });
  const avgCombined = teamsByCombined.reduce((sum, t) => sum + t.offenseRating + t.defenseRating, 0) / teamsByCombined.length;
  console.log(`Media combined: ${avgCombined.toFixed(1)} (esperado cerca de 140 con LEAGUE_MEAN_RATING=70)`);
  console.log('');

  // CONTRATO ROOKIE
  const rookieContract = result.contractsHistory.events.find(e => e.type === 'rookie_signed');
  console.log('=== CONTRATO ROOKIE ===');
  if (rookieContract) {
    console.log(`Equipo: ${rookieContract.newTeamId}`);
    console.log(`Años: ${rookieContract.yearsTotal}`);
    const salPerYear = rookieContract.contractValue / rookieContract.yearsTotal;
    console.log(`Salario/año: $${salPerYear.toFixed(2)}M`);
    console.log(`Garantizado: $${rookieContract.guaranteedTotal.toFixed(2)}M`);
    console.log(`Total: $${rookieContract.contractValue.toFixed(2)}M`);
  }
  console.log('');

  // RECORRIDO ANUAL
  console.log('=== RECORRIDO ANUAL ===');
  result.history.forEach(h => {
    const salaryEvent = result.wealthHistory.events.find(e =>
      e.year === h.year && e.type === 'salary_received'
    );
    const salaryStr = salaryEvent ? `$${salaryEvent.amount.toFixed(2)}M` : '—';

    // Balance al final del year (suma cash-flow events hasta este year inclusive)
    const cashFlowEvents = result.wealthHistory.events.filter(e =>
      e.year <= h.year && e.type !== 'devaluation_applied'
    );
    const balance = cashFlowEvents.reduce((sum, e) => sum + e.amount, 0);

    const record = `${h.regularSeasonRecord.wins}-${h.regularSeasonRecord.losses}-${h.regularSeasonRecord.ties}`;
    const exit = h.playoffExitRound || 'Missed';

    console.log(`Year ${h.year} | Age ${h.ageAtSeason} | ${h.teamId} | OVR ${h.ovrAtStart} | Record ${record} | Playoff: ${exit} | Salary ${salaryStr} | Balance: $${balance.toFixed(2)}M`);
  });
  console.log('');

  // EVENTOS CONTRACTUALES
  console.log('=== EVENTOS CONTRACTUALES (cronológicos) ===');
  result.contractsHistory.events.forEach(e => {
    let teamStr = e.newTeamId;
    if (e.oldTeamId && e.oldTeamId !== e.newTeamId) {
      teamStr = `From ${e.oldTeamId} to ${e.newTeamId}`;
    }
    console.log(`Year ${e.year} | ${e.type.toUpperCase()} | ${teamStr} | $${e.contractValue.toFixed(2)}M total / $${e.guaranteedTotal.toFixed(2)}M guaranteed`);
  });
  console.log('');

  // COMPRAS DE PATRIMONIO
  console.log('=== COMPRAS DE PATRIMONIO ===');
  result.wealthHistory.events
    .filter(e => e.type === 'property_bought' || e.type === 'vehicle_bought')
    .forEach(e => {
      const type = e.type === 'property_bought' ? 'PROPERTY' : 'VEHICLE';
      const desc = e.description.replace('Bought property ', '').replace('Bought vehicle ', '').split(' for ')[0];
      console.log(`Year ${e.year} | BOUGHT ${type} | ${desc} | -$${Math.abs(e.amount).toFixed(2)}M`);
    });
  console.log('');

  // RESUMEN
  console.log('=== RESUMEN FINAL DE CARRERA ===');
  console.log(`Years played: ${result.yearsPlayed}`);
  console.log(`Retirement reason: ${result.retirementReason}`);
  console.log(`Peak OVR: ${result.peakOverall}`);
  console.log(`Championships: ${result.championshipsWon}`);
  console.log(`Draft pick: #${result.userDraftPick}`);
  console.log(`Total contractual events: ${result.contractsHistory.events.length}`);
  console.log(`Total properties owned at end: ${result.wealthState.ownedProperties.length}`);
  console.log(`Total vehicles owned at end: ${result.wealthState.ownedVehicles.length}`);
  console.log('');

  // FINANZAS
  console.log('=== FINANZAS DE CARRERA ===');
  console.log(`Total contract earnings (gross): $${result.contractsHistory.totalEarnings.toFixed(2)}M`);
  console.log(`Total taxes paid: $${result.wealthState.totalLifetimeTaxesPaid.toFixed(2)}M`);
  console.log(`Total net earnings: $${result.wealthState.totalLifetimeEarnings.toFixed(2)}M`);
  console.log(`Total maintenance paid: $${result.wealthState.totalLifetimeMaintenance.toFixed(3)}M`);
  console.log(`Final balance (cash): $${result.wealthState.balance.toFixed(2)}M`);

  const propertiesValue = result.wealthState.ownedProperties.reduce((sum, p) => sum + p.currentValue, 0);
  const vehiclesValue = result.wealthState.ownedVehicles.reduce((sum, v) => sum + v.currentValue, 0);
  console.log(`Properties value: $${propertiesValue.toFixed(2)}M`);
  console.log(`Vehicles value: $${vehiclesValue.toFixed(2)}M`);
  console.log(`TOTAL PORTFOLIO: $${(result.wealthState.balance + propertiesValue + vehiclesValue).toFixed(2)}M`);
  console.log('');

  // ESTADO PATRIMONIAL FINAL
  console.log('=== ESTADO PATRIMONIAL FINAL ===');
  result.wealthState.ownedProperties.forEach(p => {
    console.log(`Property: ${p.property.name} | ${p.property.city}, ${p.property.state} | $${p.purchasePrice.toFixed(2)}M purchased Year ${p.yearAcquired} | $${p.currentValue.toFixed(2)}M current`);
  });
  result.wealthState.ownedVehicles.forEach(v => {
    console.log(`Vehicle: ${v.vehicle.brand} ${v.vehicle.model} ${v.vehicle.year} | $${v.purchasePrice.toFixed(3)}M purchased Year ${v.yearAcquired} | $${v.currentValue.toFixed(3)}M current`);
  });
  console.log('');

  // VARIANZA DE RECORDS DEL USUARIO
  console.log('=== VARIANZA DE RECORDS DEL USUARIO (proxy de aging 9H) ===');
  const wins = result.history.map(h => h.regularSeasonRecord.wins);
  const bestWin = Math.max(...wins);
  const worstWin = Math.min(...wins);
  const avgWin = wins.reduce((s, w) => s + w, 0) / wins.length;
  console.log(`Records year-by-year: ${result.history.map(h => `${h.regularSeasonRecord.wins}-${h.regularSeasonRecord.losses}`).join(', ')}`);
  console.log(`Best season: ${bestWin}-${17 - bestWin} | Worst season: ${worstWin}-${17 - worstWin} | Average wins: ${avgWin.toFixed(1)}`);
  console.log(`Spread (best - worst): ${bestWin - worstWin} wins`);
}

main().catch(console.error);
