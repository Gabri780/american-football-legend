import { describe, it, expect } from 'vitest';
import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { simulateCareer } from '../src/engine/career';
import { SeededRandom } from '../src/engine/prng';

describe('User draft pick', () => {
  it('userDraftPick is between 1 and 32 inclusive', () => {
    const teams = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });
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
    expect(result.userDraftPick).toBeGreaterThanOrEqual(1);
    expect(result.userDraftPick).toBeLessThanOrEqual(32);
  });

  it('user team with worst combined rating gets pick #1', () => {
    const teams = loadTeams();
    // Forzar a un equipo a tener el peor combined rating
    const targetTeam = teams[5];
    targetTeam.offenseRating = 40;
    targetTeam.defenseRating = 40;
    // Asegurar que el resto sean superiores
    teams.forEach((t, i) => {
      if (i !== 5) {
        t.offenseRating = Math.max(60, t.offenseRating);
        t.defenseRating = Math.max(60, t.defenseRating);
      }
    });
    
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });
    const result = simulateCareer({
      teams,
      userPlayer: player,
      userTeamId: targetTeam.id,
      startYear: 0,
      retireDecisionCallback: (ctx) => ctx.player.age >= 38,
      faCallback: (offers) => offers[0],
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom('career'),
      maxYears: 25
    });
    
    expect(result.userDraftPick).toBe(1);
  });

  it('user team with best combined rating gets pick #32', () => {
    const teams = loadTeams();
    const targetTeam = teams[5];
    targetTeam.offenseRating = 99;
    targetTeam.defenseRating = 99;
    teams.forEach((t, i) => {
      if (i !== 5) {
        t.offenseRating = Math.min(80, t.offenseRating);
        t.defenseRating = Math.min(80, t.defenseRating);
      }
    });
    
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });
    const result = simulateCareer({
      teams,
      userPlayer: player,
      userTeamId: targetTeam.id,
      startYear: 0,
      retireDecisionCallback: (ctx) => ctx.player.age >= 38,
      faCallback: (offers) => offers[0],
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom('career'),
      maxYears: 25
    });
    
    expect(result.userDraftPick).toBe(32);
  });

  it('determinism: same teams config produces same pick', () => {
    const teams1 = loadTeams();
    const teams2 = loadTeams();
    const player = createPlayer({ position: 'QB', tier: 'user', rng: new SeededRandom('p'), options: { ageOverride: 35 } });
    
    const r1 = simulateCareer({
      teams: teams1, userPlayer: player, userTeamId: teams1[0].id, startYear: 0,
      retireDecisionCallback: (ctx) => ctx.player.age >= 38,
      faCallback: (offers) => offers[0],
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom('career'), maxYears: 25
    });
    const r2 = simulateCareer({
      teams: teams2, userPlayer: player, userTeamId: teams2[0].id, startYear: 0,
      retireDecisionCallback: (ctx) => ctx.player.age >= 38,
      faCallback: (offers) => offers[0],
      wealthCallback: () => ({ buyPropertyIds: [], sellPropertyIds: [], buyVehicleIds: [], sellVehicleIds: [] }),
      rng: new SeededRandom('career'), maxYears: 25
    });
    
    expect(r1.userDraftPick).toBe(r2.userDraftPick);
  });
});
