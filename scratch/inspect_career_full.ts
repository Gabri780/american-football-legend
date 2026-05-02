import { loadTeams } from '../src/data/loadTeams';
import { simulateCareer } from '../src/engine/career';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';
import { FreeAgencyDecisionCallback, ContractOffer } from '../src/engine/contracts';
import { WealthDecisionCallback, WealthDecisions } from '../src/engine/wealth';

async function main() {
  const teams = loadTeams();
  const userTeamId = teams[0].id; // BOS_MIN or similar

  const playerRng = new SeededRandom('inspect-full-player');
  const userPlayer = createPlayer({
    rng: playerRng,
    position: 'QB',
    tier: 'user'
  });

  const careerRng = new SeededRandom('inspect-full-main');

  const faCallback: FreeAgencyDecisionCallback = (offers, ctx) => {
    if (offers.length === 0) return null;

    // 1. Single offer extension
    if (offers.length === 1 && offers[0].isExtension) {
      return offers[0];
    }

    // 2. Free agency logic
    if (ctx.player.age >= 33) {
      const contenderOffer = offers.find(o => o.isContender);
      if (contenderOffer) return contenderOffer;
    }

    // Default: best total value
    const sorted = [...offers].sort((a, b) => (b.years * b.salaryPerYear) - (a.years * a.salaryPerYear));
    return sorted[0];
  };

  const wealthCallback: WealthDecisionCallback = (state, ctx) => {
    const result: WealthDecisions = { buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] };

    // Year 0 logic
    if (ctx.year === 0 && state.balance > 5) {
      const cheapest = [...state.marketProperties].sort((a, b) => a.price - b.price)[0];
      if (cheapest && cheapest.price <= state.balance) {
        result.buyPropertyIds.push(cheapest.id);
      }
    }

    // Year 5+ supercar logic
    if (ctx.year >= 5 && state.balance > 20) {
      const hasSuper = state.ownedVehicles.some(ov => ov.vehicle.type === 'supercar' || ov.vehicle.type === 'hypercar');
      if (!hasSuper) {
        const supercar = state.marketVehicles.find(v =>
          (v.type === 'supercar' || v.type === 'hypercar') && v.price <= state.balance
        );
        if (supercar) result.buyVehicleIds.push(supercar.id);
      }
    }

    // Year 8+ property expansion
    if (ctx.year >= 8 && state.balance > 30 && state.ownedProperties.length < 2) {
      const affordable = state.marketProperties
        .filter(p => p.price <= state.balance / 2)
        .sort((a, b) => b.price - a.price);
      if (affordable.length > 0) {
        result.buyPropertyIds.push(affordable[0].id);
      }
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
    rng: careerRng,
    maxYears: 25
  });

  // Printing Report
  console.log('=== JUGADOR INICIAL ===');
  console.log(`Nombre: ${result.playerAtStart.firstName} ${result.playerAtStart.lastName}`);
  console.log(`Posición: ${result.playerAtStart.position}`);
  console.log(`OVR inicial: ${result.playerAtStart.overall}`);
  console.log(`Equipo asignado: ${userTeamId}`);
  console.log('');

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

  console.log('=== RECORRIDO ANUAL ===');
  let runningBalance = 0;
  result.history.forEach((h, i) => {
    // Find salary for this year
    const salaryEvent = result.wealthHistory.events.find(e => e.year === h.year && e.type === 'salary_received');
    const salaryStr = salaryEvent ? `$${salaryEvent.amount.toFixed(2)}M` : '—';

    // Balance after offseason: we sum all events up to this year (inclusive)
    const yearEvents = result.wealthHistory.events.filter(e => e.year <= h.year);
    const balance = yearEvents.reduce((sum, e) => sum + e.amount, 0);

    const record = `${h.regularSeasonRecord.wins}-${h.regularSeasonRecord.losses}-${h.regularSeasonRecord.ties}`;
    const exit = h.playoffExitRound || 'Missed';

    console.log(`Year ${h.year} | ${h.ageAtSeason} | ${h.teamId} | ${h.ovrAtStart} | ${record} | ${exit} | Salary ${salaryStr} | Balance after offseason: $${balance.toFixed(2)}M`);
  });
  console.log('');

  console.log('=== EVENTOS CONTRACTUALES (cronológicos) ===');
  result.contractsHistory.events.forEach(e => {
    let teamStr = e.newTeamId;
    if (e.oldTeamId && e.oldTeamId !== e.newTeamId) {
      teamStr = `From ${e.oldTeamId} to ${e.newTeamId}`;
    }
    console.log(`Year ${e.year} | ${e.type.toUpperCase()} | ${teamStr} | $${e.contractValue.toFixed(2)}M total / $${e.guaranteedTotal.toFixed(2)}M guaranteed`);
  });
  console.log('');

  console.log('=== COMPRAS DE PATRIMONIO (cronológicas) ===');
  result.wealthHistory.events
    .filter(e => e.type === 'property_bought' || e.type === 'vehicle_bought')
    .forEach(e => {
      const type = e.type === 'property_bought' ? 'property' : 'vehicle';
      console.log(`Year ${e.year} | BOUGHT ${type.toUpperCase()} | ${e.description.split(' for ')[0].replace('Bought property ', '').replace('Bought vehicle ', '')} | -$${Math.abs(e.amount).toFixed(2)}M`);
    });
  console.log('');

  console.log('=== RESUMEN FINAL DE CARRERA ===');
  console.log(`Years played: ${result.yearsPlayed}`);
  console.log(`Retirement reason: ${result.retirementReason}`);
  console.log(`Peak OVR: ${result.peakOverall}`);
  console.log(`Championships: ${result.championshipsWon}`);
  console.log(`Total contractual events: ${result.contractsHistory.events.length}`);
  console.log(`Total properties owned: ${result.wealthState.ownedProperties.length}`);
  console.log(`Total vehicles owned: ${result.wealthState.ownedVehicles.length}`);
  console.log('');

  console.log('=== FINANZAS DE CARRERA ===');
  console.log(`Total contract earnings (gross): $${result.contractsHistory.totalEarnings.toFixed(2)}M`);
  console.log(`Total taxes paid: $${result.wealthState.totalLifetimeTaxesPaid.toFixed(2)}M`);
  console.log(`Total net earnings (después de impuestos): $${result.wealthState.totalLifetimeEarnings.toFixed(2)}M`);
  console.log(`Total maintenance paid: $${result.wealthState.totalLifetimeMaintenance.toFixed(3)}M`);
  console.log(`Final balance (cash): $${result.wealthState.balance.toFixed(2)}M`);

  const propertiesValue = result.wealthState.ownedProperties.reduce((sum, p) => sum + p.currentValue, 0);
  const vehiclesValue = result.wealthState.ownedVehicles.reduce((sum, v) => sum + v.currentValue, 0);
  const totalPortfolio = result.wealthState.balance + propertiesValue + vehiclesValue;

  console.log('Asset value:');
  console.log(`  - Sum of currentValue of ownedProperties: $${propertiesValue.toFixed(2)}M`);
  console.log(`  - Sum of currentValue of ownedVehicles: $${vehiclesValue.toFixed(2)}M`);
  console.log(`  - TOTAL PORTFOLIO = $${totalPortfolio.toFixed(2)}M`);
  console.log('');

  console.log('=== ESTADO PATRIMONIAL FINAL ===');
  result.wealthState.ownedProperties.forEach(p => {
    console.log(`Property: ${p.property.name} | ${p.property.city}, ${p.property.state} | $${p.purchasePrice.toFixed(2)}M purchased Year ${p.yearAcquired} | $${p.currentValue.toFixed(2)}M current`);
  });
  result.wealthState.ownedVehicles.forEach(v => {
    console.log(`Vehicle: ${v.vehicle.brand} ${v.vehicle.model} ${v.vehicle.year} | $${v.purchasePrice.toFixed(3)}M purchased Year ${v.yearAcquired} | $${v.currentValue.toFixed(3)}M current`);
  });
}

main().catch(console.error);
