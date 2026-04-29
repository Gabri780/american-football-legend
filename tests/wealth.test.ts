import { describe, it, expect } from 'vitest';
import {
  initializeWealth,
  processOffseasonWealth
} from '../src/engine/wealth';
import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { simulateCareer } from '../src/engine/career';
import { SeededRandom } from '../src/engine/prng';

describe('initializeWealth', () => {
  it('starts with balance 0 and 12 properties + 12 vehicles in market', () => {
    const teams = loadTeams();
    const state = initializeWealth(teams[0].id, new SeededRandom('init'));
    expect(state.balance).toBe(0);
    expect(state.ownedProperties).toEqual([]);
    expect(state.ownedVehicles).toEqual([]);
    expect(state.marketProperties.length).toBeLessThanOrEqual(12);
    expect(state.marketVehicles).toHaveLength(12);
  });

  it('market includes regional properties for the user team', () => {
    const teams = loadTeams();
    const state = initializeWealth('BOS_MIN', new SeededRandom('init'));
    const hasBostonRegional = state.marketProperties.some(p => p.id.startsWith('BOS_MIN_'));
    expect(hasBostonRegional).toBe(true);
  });
});

describe('processOffseasonWealth', () => {
  it('salary is taxed at 37% and net goes to balance', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeWealth(teams[0].id, new SeededRandom('init'));

    const result = processOffseasonWealth({
      player,
      currentState: state,
      currentYear: 1,
      grossEarningsThisYear: 10,  // $10M
      userTeamId: teams[0].id,
      decisionsCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom('w1')
    });

    expect(result.grossSalary).toBeCloseTo(10);
    expect(result.taxesPaid).toBeCloseTo(3.7);
    expect(result.netEarnings).toBeCloseTo(6.3);
    expect(result.newState.balance).toBeCloseTo(6.3);
  });

  it('buying property reduces balance by purchase price', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeWealth(teams[0].id, new SeededRandom('init'));
    state.balance = 100;
    const propToBuy = state.marketProperties[0];

    const result = processOffseasonWealth({
      player,
      currentState: state,
      currentYear: 1,
      grossEarningsThisYear: 0,
      userTeamId: teams[0].id,
      decisionsCallback: () => ({
        buyPropertyIds: [propToBuy.id],
        sellPropertyIds: [],
        buyVehicleIds: [],
        sellVehicleIds: []
      }),
      rng: new SeededRandom('w1')
    });

    expect(result.newState.balance).toBeCloseTo(100 - propToBuy.price);
    expect(result.newState.ownedProperties).toHaveLength(1);
    expect(result.newState.ownedProperties[0].property.id).toBe(propToBuy.id);
    expect(result.newState.marketProperties.some(p => p.id === propToBuy.id)).toBe(false);
  });

  it('purchase fails silently if balance insufficient', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeWealth(teams[0].id, new SeededRandom('init'));
    state.balance = 0;
    const propToBuy = state.marketProperties[0];

    const result = processOffseasonWealth({
      player,
      currentState: state,
      currentYear: 1,
      grossEarningsThisYear: 0,
      userTeamId: teams[0].id,
      decisionsCallback: () => ({
        buyPropertyIds: [propToBuy.id],
        sellPropertyIds: [],
        buyVehicleIds: [],
        sellVehicleIds: []
      }),
      rng: new SeededRandom('w1')
    });

    expect(result.newState.balance).toBe(0);
    expect(result.newState.ownedProperties).toHaveLength(0);
  });

  it('selling owned property adds currentValue to balance', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeWealth(teams[0].id, new SeededRandom('init'));
    const prop = state.marketProperties[0];
    state.ownedProperties.push({
      property: prop,
      yearAcquired: 0,
      purchasePrice: prop.price,
      currentValue: prop.price * 1.1
    });

    const result = processOffseasonWealth({
      player,
      currentState: state,
      currentYear: 1,
      grossEarningsThisYear: 0,
      userTeamId: teams[0].id,
      decisionsCallback: () => ({
        buyPropertyIds: [],
        sellPropertyIds: [prop.id],
        buyVehicleIds: [],
        sellVehicleIds: []
      }),
      rng: new SeededRandom('w1')
    });

    // Encontrar el evento de venta para saber el precio real (con fluctuación)
    const saleEvent = result.events.find(e => e.type === 'property_sold');
    expect(saleEvent).toBeDefined();
    const actualSalePrice = saleEvent!.amount;

    // El balance final debe ser PrecioVenta - Mantenimiento (ya que se cobra antes de vender)
    expect(result.newState.balance).toBeCloseTo(actualSalePrice - result.maintenancePaid);
    expect(result.newState.ownedProperties).toHaveLength(0);
  });

  it('annual maintenance is auto-charged from balance', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeWealth(teams[0].id, new SeededRandom('init'));
    const prop = state.marketProperties[0];
    state.ownedProperties.push({
      property: prop,
      yearAcquired: 0,
      purchasePrice: prop.price,
      currentValue: prop.price
    });
    state.balance = 10;

    const expectedMaintenance = prop.annualMaintenance / 1000;

    const result = processOffseasonWealth({
      player,
      currentState: state,
      currentYear: 1,
      grossEarningsThisYear: 0,
      userTeamId: teams[0].id,
      decisionsCallback: () => ({
        buyPropertyIds: [],
        sellPropertyIds: [],
        buyVehicleIds: [],
        sellVehicleIds: []
      }),
      rng: new SeededRandom('w1')
    });

    expect(result.maintenancePaid).toBeCloseTo(expectedMaintenance);
    expect(result.newState.balance).toBeCloseTo(10 - expectedMaintenance);
  });

  it('vehicle held for 1 year depreciates 15%', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeWealth(teams[0].id, new SeededRandom('init'));
    const veh = state.marketVehicles[0];
    state.ownedVehicles.push({
      vehicle: veh,
      yearAcquired: 0,
      purchasePrice: veh.price,
      currentValue: veh.price
    });

    const result = processOffseasonWealth({
      player,
      currentState: state,
      currentYear: 1,
      grossEarningsThisYear: 0,
      userTeamId: teams[0].id,
      decisionsCallback: () => ({
        buyPropertyIds: [],
        sellPropertyIds: [],
        buyVehicleIds: [],
        sellVehicleIds: []
      }),
      rng: new SeededRandom('w1')
    });

    expect(result.newState.ownedVehicles[0].currentValue).toBeCloseTo(veh.price * 0.85);
  });

  it('property held varies by random ±5%', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const state = initializeWealth(teams[0].id, new SeededRandom('init'));
    const prop = state.marketProperties[0];
    state.ownedProperties.push({
      property: prop,
      yearAcquired: 0,
      purchasePrice: prop.price,
      currentValue: prop.price
    });

    const result = processOffseasonWealth({
      player,
      currentState: state,
      currentYear: 1,
      grossEarningsThisYear: 0,
      userTeamId: teams[0].id,
      decisionsCallback: () => ({
        buyPropertyIds: [],
        sellPropertyIds: [],
        buyVehicleIds: [],
        sellVehicleIds: []
      }),
      rng: new SeededRandom('w1')
    });

    const val = result.newState.ownedProperties[0].currentValue;
    expect(val).toBeGreaterThanOrEqual(prop.price * 0.95 - 0.0001);
    expect(val).toBeLessThanOrEqual(prop.price * 1.05 + 0.0001);
  });
});

describe('Market rotation', () => {
  it('70% of unsold items persist year-to-year (statistical)', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });

    let totalInitialItemsFound = 0;
    const trials = 100;
    for (let i = 0; i < trials; i++) {
      const initialState = initializeWealth(teams[0].id, new SeededRandom(`test-rot-${i}`));
      const initialIds = new Set(initialState.marketVehicles.map(v => v.id));

      const result = processOffseasonWealth({
        player,
        currentState: initialState,
        currentYear: 1,
        grossEarningsThisYear: 0,
        userTeamId: teams[0].id,
        decisionsCallback: () => ({
          buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: []
        }),
        rng: new SeededRandom(`test-rot-rng-${i}`)
      });

      const kept = result.newState.marketVehicles.filter(v => initialIds.has(v.id)).length;
      totalInitialItemsFound += kept;
    }

    const avgKept = totalInitialItemsFound / trials;
    // 12 items * 0.7 = 8.4 expected
    expect(avgKept).toBeGreaterThan(7.5);
    expect(avgKept).toBeLessThan(9.5);
  });
});

describe('simulateCareer with wealth integration', () => {
  it('career produces wealthHistory with at least one salary event', () => {
    const teams = loadTeams();
    const player = createPlayer({
      position: 'QB',
      tier: 'user',
      rng: new SeededRandom('p'),
      options: { ageOverride: 35 }
    });

    const result = simulateCareer({
      teams,
      userPlayer: player,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: (ctx) => ctx.player.age >= 38,
      faCallback: (offers) => offers[0],
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom('career'),
      maxYears: 25
    });

    expect(result.wealthHistory.events.length).toBeGreaterThan(0);
    expect(result.wealthState.totalLifetimeEarnings).toBeGreaterThan(0);
  });

  it('determinism: same seeds produce identical wealth', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });
    const params = {
      teams,
      userPlayer: player,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: (ctx: any) => ctx.player.age >= 38,
      faCallback: (offers: any[]) => offers[0],
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      maxYears: 25
    };

    const r1 = simulateCareer({ ...params, rng: new SeededRandom('wealth-det') });
    const r2 = simulateCareer({ ...params, rng: new SeededRandom('wealth-det') });

    expect(r1.wealthState).toEqual(r2.wealthState);
    expect(r1.wealthHistory).toEqual(r2.wealthHistory);
  });
});
