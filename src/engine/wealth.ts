import { Property, PROPERTIES_BY_TEAM, VACATION_PROPERTIES } from '../data/properties';
import { Vehicle, VEHICLES } from '../data/vehicles';
import { SeededRandom } from './prng';
import { Player } from './player';

export interface OwnedProperty {
  property: Property;        // referencia al item del catálogo
  yearAcquired: number;      // year en que se compró
  purchasePrice: number;     // precio que pagó (en millones, fijo desde compra)
  currentValue: number;      // valor actual (en millones, varía con devaluación anual)
}

export interface OwnedVehicle {
  vehicle: Vehicle;
  yearAcquired: number;
  purchasePrice: number;     // en millones (e.g. 0.085 = $85K)
  currentValue: number;
}

export interface WealthState {
  balance: number;                       // en millones de dólares (puede ser negativo)
  ownedProperties: OwnedProperty[];
  ownedVehicles: OwnedVehicle[];
  marketProperties: Property[];          // 12 propiedades disponibles para comprar este año
  marketVehicles: Vehicle[];             // 12 vehículos disponibles este año
  totalLifetimeEarnings: number;         // suma neta cobrada (después de impuestos) en toda la carrera
  totalLifetimeTaxesPaid: number;        // impuestos pagados acumulados
  totalLifetimeMaintenance: number;      // mantenimiento pagado acumulado
}

export interface WealthEvent {
  year: number;
  type: 'salary_received' | 'property_bought' | 'property_sold' | 'vehicle_bought' | 'vehicle_sold' | 'maintenance_paid' | 'devaluation_applied';
  amount: number;            // delta al balance (positivo = entró, negativo = salió). En millones.
  description: string;       // texto descriptivo para histórico
  itemId?: string;           // id del item afectado si aplica
}

export interface WealthHistory {
  events: WealthEvent[];
}

export interface WealthDecisions {
  buyPropertyIds: string[];   // ids de items en marketProperties que quiere comprar
  sellPropertyIds: string[];  // ids de items en ownedProperties que quiere vender
  buyVehicleIds: string[];
  sellVehicleIds: string[];
}

export type WealthDecisionCallback = (
  state: WealthState,
  context: { player: Player; year: number; salaryThisYear: number; netEarningsThisYear: number }
) => WealthDecisions;

const FEDERAL_TAX_RATE = 0.37;
const PROPERTIES_PER_YEAR = 12;
const VEHICLES_PER_YEAR = 12;
const MARKET_PERSISTENCE_RATE = 0.70;  // 70% chance item no comprado siga disponible

const VEHICLE_FIRST_YEAR_DEPRECIATION = 0.15;   // -15% año 1 desde compra
const VEHICLE_SUBSEQUENT_DEPRECIATION = 0.05;   // -5% años siguientes
const PROPERTY_MAX_VARIATION = 0.05;

// Helper Fisher-Yates determinístico con SeededRandom
function shuffle<T>(arr: T[], rng: SeededRandom): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.randomInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateInitialPropertyMarket(userTeamId: string, rng: SeededRandom): Property[] {
  const regional = PROPERTIES_BY_TEAM[userTeamId] ?? [];
  const result: Property[] = [...regional];
  
  const vacationShuffled = shuffle([...VACATION_PROPERTIES], rng);
  for (const p of vacationShuffled) {
    if (result.length >= PROPERTIES_PER_YEAR) break;
    result.push(p);
  }
  
  return result.slice(0, PROPERTIES_PER_YEAR);
}

function generateInitialVehicleMarket(rng: SeededRandom): Vehicle[] {
  const all = [...VEHICLES];
  const shuffled = shuffle(all, rng);
  return shuffled.slice(0, VEHICLES_PER_YEAR);
}

export function initializeWealth(
  userTeamId: string,
  rng: SeededRandom
): WealthState {
  return {
    balance: 0,
    ownedProperties: [],
    ownedVehicles: [],
    marketProperties: generateInitialPropertyMarket(userTeamId, rng),
    marketVehicles: generateInitialVehicleMarket(rng),
    totalLifetimeEarnings: 0,
    totalLifetimeTaxesPaid: 0,
    totalLifetimeMaintenance: 0
  };
}

function rotatePropertyMarket(
  currentMarket: Property[],
  userTeamId: string,
  rng: SeededRandom
): Property[] {
  const result: Property[] = [];
  
  for (const p of currentMarket) {
    if (rng.random() < MARKET_PERSISTENCE_RATE) {
      result.push(p);
    }
  }
  
  const inMarketIds = new Set(result.map(p => p.id));
  const regional = PROPERTIES_BY_TEAM[userTeamId] ?? [];
  const candidates: Property[] = [];
  for (const p of regional) {
    if (!inMarketIds.has(p.id)) candidates.push(p);
  }
  for (const p of VACATION_PROPERTIES) {
    if (!inMarketIds.has(p.id)) candidates.push(p);
  }
  
  const shuffled = shuffle(candidates, rng);
  for (const p of shuffled) {
    if (result.length >= PROPERTIES_PER_YEAR) break;
    result.push(p);
  }
  
  return result.slice(0, PROPERTIES_PER_YEAR);
}

function rotateVehicleMarket(currentMarket: Vehicle[], rng: SeededRandom): Vehicle[] {
  const result: Vehicle[] = [];
  
  for (const v of currentMarket) {
    if (rng.random() < MARKET_PERSISTENCE_RATE) {
      result.push(v);
    }
  }
  
  const inMarketIds = new Set(result.map(v => v.id));
  const candidates = VEHICLES.filter(v => !inMarketIds.has(v.id));
  
  const shuffled = shuffle(candidates, rng);
  for (const v of shuffled) {
    if (result.length >= VEHICLES_PER_YEAR) break;
    result.push(v);
  }
  
  return result.slice(0, VEHICLES_PER_YEAR);
}

function applyAnnualDevaluation(
  state: WealthState,
  currentYear: number,
  rng: SeededRandom,
  events: WealthEvent[]
): void {
  for (const ov of state.ownedVehicles) {
    const yearsHeld = currentYear - ov.yearAcquired;
    if (yearsHeld === 0) continue;
    
    let depreciation = 0;
    if (yearsHeld === 1) {
      depreciation = ov.currentValue * VEHICLE_FIRST_YEAR_DEPRECIATION;
    } else {
      depreciation = ov.currentValue * VEHICLE_SUBSEQUENT_DEPRECIATION;
    }
    
    ov.currentValue -= depreciation;
    
    events.push({
      year: currentYear,
      type: 'devaluation_applied',
      amount: -depreciation,
      description: `Vehicle ${ov.vehicle.brand} ${ov.vehicle.model} depreciated`,
      itemId: ov.vehicle.id
    });
  }
  
  for (const op of state.ownedProperties) {
    const yearsHeld = currentYear - op.yearAcquired;
    if (yearsHeld === 0) continue;
    
    const variationRate = (rng.random() * 2 - 1) * PROPERTY_MAX_VARIATION;
    const variationValue = op.currentValue * variationRate;
    op.currentValue += variationValue;
    
    events.push({
      year: currentYear,
      type: 'devaluation_applied',
      amount: variationValue,
      description: `Property ${op.property.city} varied by ${(variationRate * 100).toFixed(1)}%`,
      itemId: op.property.id
    });
  }
}

export interface OffseasonWealthResult {
  newState: WealthState;
  events: WealthEvent[];
  grossSalary: number;
  taxesPaid: number;
  netEarnings: number;
  maintenancePaid: number;
}

export function processOffseasonWealth(params: {
  player: Player;
  currentState: WealthState;
  currentYear: number;
  grossEarningsThisYear: number;
  userTeamId: string;
  decisionsCallback: WealthDecisionCallback;
  rng: SeededRandom;
}): OffseasonWealthResult {
  const { player, currentState, currentYear, grossEarningsThisYear, userTeamId, decisionsCallback, rng } = params;
  
  // Clone state to avoid mutating input directly (though typical engine pattern might mutate, we'll clone to be safe and clear)
  const state = structuredClone(currentState);
  const events: WealthEvent[] = [];

  // 1. Calcular cobro del salario
  const grossSalary = grossEarningsThisYear;
  const taxesPaid = grossSalary * FEDERAL_TAX_RATE;
  const netEarnings = grossSalary - taxesPaid;
  
  state.balance += netEarnings;
  state.totalLifetimeEarnings += netEarnings;
  state.totalLifetimeTaxesPaid += taxesPaid;
  
  events.push({
    year: currentYear,
    type: 'salary_received',
    amount: netEarnings,
    description: `Salary $${grossSalary.toFixed(2)}M (gross), -$${taxesPaid.toFixed(2)}M tax, +$${netEarnings.toFixed(2)}M net`
  });

  // 2. Aplicar devaluación
  applyAnnualDevaluation(state, currentYear, rng, events);

  // 3. Cobrar mantenimiento
  let maintenanceTotal = 0;
  for (const op of state.ownedProperties) {
    maintenanceTotal += op.property.annualMaintenance / 1000; // convert thousands to millions
  }
  for (const ov of state.ownedVehicles) {
    maintenanceTotal += ov.vehicle.annualMaintenance / 1000;
  }
  
  if (maintenanceTotal > 0) {
    state.balance -= maintenanceTotal;
    state.totalLifetimeMaintenance += maintenanceTotal;
    events.push({
      year: currentYear,
      type: 'maintenance_paid',
      amount: -maintenanceTotal,
      description: `Paid $${maintenanceTotal.toFixed(3)}M in annual maintenance`
    });
  }

  // 4. Llamar decisionsCallback
  const decisions = decisionsCallback(state, { 
    player, 
    year: currentYear, 
    salaryThisYear: grossSalary, 
    netEarningsThisYear: netEarnings 
  });

  // 5. Procesar ventas
  for (const propertyId of decisions.sellPropertyIds) {
    const idx = state.ownedProperties.findIndex(p => p.property.id === propertyId);
    if (idx !== -1) {
      const op = state.ownedProperties[idx];
      state.balance += op.currentValue;
      events.push({
        year: currentYear,
        type: 'property_sold',
        amount: op.currentValue,
        description: `Sold property ${op.property.city} for $${op.currentValue.toFixed(2)}M`,
        itemId: op.property.id
      });
      state.ownedProperties.splice(idx, 1);
    }
  }

  for (const vehicleId of decisions.sellVehicleIds) {
    const idx = state.ownedVehicles.findIndex(v => v.vehicle.id === vehicleId);
    if (idx !== -1) {
      const ov = state.ownedVehicles[idx];
      state.balance += ov.currentValue;
      events.push({
        year: currentYear,
        type: 'vehicle_sold',
        amount: ov.currentValue,
        description: `Sold vehicle ${ov.vehicle.brand} ${ov.vehicle.model} for $${ov.currentValue.toFixed(3)}M`,
        itemId: ov.vehicle.id
      });
      state.ownedVehicles.splice(idx, 1);
    }
  }

  // 6. Procesar compras
  for (const propertyId of decisions.buyPropertyIds) {
    const marketIdx = state.marketProperties.findIndex(p => p.id === propertyId);
    if (marketIdx !== -1) {
      const prop = state.marketProperties[marketIdx];
      if (state.balance >= prop.price) {
        state.balance -= prop.price;
        state.ownedProperties.push({
          property: prop,
          yearAcquired: currentYear,
          purchasePrice: prop.price,
          currentValue: prop.price
        });
        state.marketProperties.splice(marketIdx, 1);
        events.push({
          year: currentYear,
          type: 'property_bought',
          amount: -prop.price,
          description: `Bought property ${prop.city} for $${prop.price.toFixed(2)}M`,
          itemId: prop.id
        });
      }
    }
  }

  for (const vehicleId of decisions.buyVehicleIds) {
    const marketIdx = state.marketVehicles.findIndex(v => v.id === vehicleId);
    if (marketIdx !== -1) {
      const veh = state.marketVehicles[marketIdx];
      if (state.balance >= veh.price) {
        state.balance -= veh.price;
        state.ownedVehicles.push({
          vehicle: veh,
          yearAcquired: currentYear,
          purchasePrice: veh.price,
          currentValue: veh.price
        });
        state.marketVehicles.splice(marketIdx, 1);
        events.push({
          year: currentYear,
          type: 'vehicle_bought',
          amount: -veh.price,
          description: `Bought vehicle ${veh.brand} ${veh.model} for $${veh.price.toFixed(3)}M`,
          itemId: veh.id
        });
      }
    }
  }

  // 7. Rotar el mercado
  state.marketProperties = rotatePropertyMarket(state.marketProperties, userTeamId, rng.derive('rotate-prop'));
  state.marketVehicles = rotateVehicleMarket(state.marketVehicles, rng.derive('rotate-veh'));

  return {
    newState: state,
    events,
    grossSalary,
    taxesPaid,
    netEarnings,
    maintenancePaid: maintenanceTotal
  };
}
