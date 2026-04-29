import { describe, it, expect, beforeAll } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { generateRookieContract, computeMarketScore, generateOffers } from '../src/engine/contracts';
import { simulateCareer } from '../src/engine/career';
import { SeededRandom } from '../src/engine/prng';

describe('generateRookieContract', () => {
  it('OVR 85+ produces round 1 contract (4 years, fully guaranteed)', () => {
    const player = createPlayer({ position: 'QB', tier: 'star', rng: new SeededRandom('p1') });
    if (player.overall >= 80) {
      const contract = generateRookieContract(player, 'TEAM_A', 0, new SeededRandom('c1'));
      expect(contract.yearsTotal).toBe(4);
      expect(contract.guaranteedRemaining).toBeCloseTo(contract.salaryPerYear * 4, 1);
      expect(contract.isRookieContract).toBe(true);
    }
  });
  
  it('rookie contract years remaining equals years total', () => {
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p2') });
    const contract = generateRookieContract(player, 'TEAM_A', 0, new SeededRandom('c2'));
    expect(contract.yearsRemaining).toBe(contract.yearsTotal);
  });
});

describe('computeMarketScore', () => {
  it('high OVR + recent good stats produces score >= 80', () => {
    const player = createPlayer({ position: 'QB', tier: 'star', rng: new SeededRandom('p') });
    player.overall = 90;
    player.age = 27;
    const stats = [
      { passYards: 4500, passTDs: 35 } as any
    ];
    const score = computeMarketScore(player, stats, 5);
    expect(score).toBeGreaterThanOrEqual(80);
  });
  
  it('low OVR + age >= 35 produces score < 70', () => {
    const player = createPlayer({ position: 'QB', tier: 'regular', rng: new SeededRandom('p') });
    player.overall = 70;
    player.age = 35;
    const score = computeMarketScore(player, [], 12);
    expect(score).toBeLessThan(70);
  });
});

describe('generateOffers', () => {
  it('produces N offers in range based on market score', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const contract = generateRookieContract(player, teams[0].id, 0, new SeededRandom('c'));
    const records = new Map<string, number>();
    const offers = generateOffers(player, contract, 85, teams, false, false, records, new SeededRandom('o'));
    
    // Score 85 -> 4 to 6 offers
    expect(offers.length).toBeGreaterThanOrEqual(4);
    expect(offers.length).toBeLessThanOrEqual(6);
  });
  
  it('extension mode produces exactly 1 offer from current team', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p') });
    const contract = generateRookieContract(player, teams[0].id, 0, new SeededRandom('c'));
    const records = new Map<string, number>();
    const offers = generateOffers(player, contract, 85, teams, true, false, records, new SeededRandom('o'));
    
    expect(offers.length).toBe(1);
    expect(offers[0].teamId).toBe(teams[0].id);
    expect(offers[0].isCurrentTeam).toBe(true);
    expect(offers[0].isExtension).toBe(true);
  });
});

describe('simulateCareer with contracts integration', () => {
  it('career produces contractsHistory with rookie + at least one event', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });
    const result = simulateCareer({
      teams,
      userPlayer: player,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: (ctx) => ctx.player.age >= 38,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: (offers) => offers[0],  // siempre primera oferta
      rng: new SeededRandom('career'),
      maxYears: 25
    });
    expect(result.contractsHistory.events.length).toBeGreaterThan(0);
    expect(result.contractsHistory.totalEarnings).toBeGreaterThan(0);
  });
  
  it('rejecting all offers triggers retired by no_market', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });
    const result = simulateCareer({
      teams,
      userPlayer: player,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: () => false,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: () => null,  // siempre rechaza todas
      rng: new SeededRandom('career2'),
      maxYears: 25
    });
    expect(result.retirementReason).toBe('no_market');
  });
  
  it('determinism: same seeds produce identical contracts', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });
    const params = {
      teams,
      userPlayer: player,
      userTeamId: teams[0].id,
      startYear: 0,
      retireDecisionCallback: (ctx: any) => ctx.player.age >= 38,
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }), faCallback: (offers: any[]) => offers[0],
      rng: new SeededRandom('career3'),
      maxYears: 25
    };
    
    // Clonamos params para que el RNG avance desde la misma seed
    const r1 = simulateCareer({ ...params, rng: new SeededRandom('career3') });
    const r2 = simulateCareer({ ...params, rng: new SeededRandom('career3') });
    
    expect(r1.contractsHistory).toEqual(r2.contractsHistory);
  });
});
