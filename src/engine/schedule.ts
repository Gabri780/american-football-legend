import { SeededRandom } from './prng';
import { Team } from './team';

export type MatchupType = 
  | 'divisional' 
  | 'intra_conference' 
  | 'inter_conference' 
  | 'same_place_intra' 
  | 'seventeenth';

export interface Matchup {
  teamAId: string;    // orden canónico: alfabético ascendente
  teamBId: string;    // teamAId < teamBId siempre
  type: MatchupType;
}

export interface ScheduledGame {
  week: number;       // 1-18
  homeTeamId: string;
  awayTeamId: string;
  type: MatchupType;
}

export interface Schedule {
  year: number;
  games: ScheduledGame[];           // exactamente 272
  byeWeeks: Map<string, number>;    // teamId → week (5-14)
}

function getSyntheticDivisionStandings(divisionTeams: Team[]): Team[] {
  return [...divisionTeams].sort((a, b) => {
    const ratingA = (a.offenseRating ?? 0) + (a.defenseRating ?? 0);
    const ratingB = (b.offenseRating ?? 0) + (b.defenseRating ?? 0);
    if (ratingA !== ratingB) return ratingB - ratingA; // DESC
    return a.id.localeCompare(b.id); // ASC
  });
}

function groupByDivision(teams: Team[]): Map<string, Team[]> {
  const map = new Map<string, Team[]>();
  for (const t of teams) {
    const key = `${t.conference}_${t.division}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}

function makeMatchup(t1: Team, t2: Team, type: MatchupType): Matchup {
  if (t1.id < t2.id) {
    return { teamAId: t1.id, teamBId: t2.id, type };
  } else {
    return { teamAId: t2.id, teamBId: t1.id, type };
  }
}

function generateDivisionalMatchups(teams: Team[]): Matchup[] {
  const result: Matchup[] = [];
  const divisions = groupByDivision(teams);
  
  for (const divTeams of divisions.values()) {
    if (divTeams.length !== 4) {
      throw new Error(`Division has ${divTeams.length} teams, expected 4`);
    }
    // Cada par dentro de la división aparece DOS veces
    for (let i = 0; i < divTeams.length; i++) {
      for (let j = i + 1; j < divTeams.length; j++) {
        result.push(makeMatchup(divTeams[i], divTeams[j], 'divisional'));
        result.push(makeMatchup(divTeams[i], divTeams[j], 'divisional'));
      }
    }
  }
  
  if (result.length !== 96) {
    throw new Error(`Expected 96 divisional matchups, got ${result.length}`);
  }
  return result;
}

const INTRA_CONFERENCE_ROTATION: Record<number, Array<[string, string]>> = {
  0: [
    ['Eastern_East', 'Eastern_Atlantic'],
    ['Eastern_North', 'Eastern_South'],
    ['Western_Central', 'Western_Mountain'],
    ['Western_Pacific', 'Western_Southwest'],
  ],
  1: [
    ['Eastern_East', 'Eastern_North'],
    ['Eastern_Atlantic', 'Eastern_South'],
    ['Western_Central', 'Western_Pacific'],
    ['Western_Mountain', 'Western_Southwest'],
  ],
  2: [
    ['Eastern_East', 'Eastern_South'],
    ['Eastern_Atlantic', 'Eastern_North'],
    ['Western_Central', 'Western_Southwest'],
    ['Western_Mountain', 'Western_Pacific'],
  ],
};

function generateIntraConferenceMatchups(teams: Team[], year: number): Matchup[] {
  const result: Matchup[] = [];
  const divisions = groupByDivision(teams);
  const rotation = INTRA_CONFERENCE_ROTATION[year % 3];
  
  for (const [divA, divB] of rotation) {
    const teamsA = divisions.get(divA);
    const teamsB = divisions.get(divB);
    if (!teamsA || !teamsB) {
      throw new Error(`Division not found: ${divA} or ${divB}`);
    }
    for (const a of teamsA) {
      for (const b of teamsB) {
        result.push(makeMatchup(a, b, 'intra_conference'));
      }
    }
  }
  
  if (result.length !== 64) {
    throw new Error(`Expected 64 intra-conference matchups, got ${result.length}`);
  }
  return result;
}

const INTER_CONFERENCE_ROTATION: Record<number, Array<[string, string]>> = {
  0: [
    ['Eastern_East', 'Western_Central'],
    ['Eastern_Atlantic', 'Western_Mountain'],
    ['Eastern_North', 'Western_Pacific'],
    ['Eastern_South', 'Western_Southwest'],
  ],
  1: [
    ['Eastern_East', 'Western_Mountain'],
    ['Eastern_Atlantic', 'Western_Pacific'],
    ['Eastern_North', 'Western_Southwest'],
    ['Eastern_South', 'Western_Central'],
  ],
  2: [
    ['Eastern_East', 'Western_Pacific'],
    ['Eastern_Atlantic', 'Western_Southwest'],
    ['Eastern_North', 'Western_Central'],
    ['Eastern_South', 'Western_Mountain'],
  ],
  3: [
    ['Eastern_East', 'Western_Southwest'],
    ['Eastern_Atlantic', 'Western_Central'],
    ['Eastern_North', 'Western_Mountain'],
    ['Eastern_South', 'Western_Pacific'],
  ],
};

function generateInterConferenceMatchups(teams: Team[], year: number): Matchup[] {
  const result: Matchup[] = [];
  const divisions = groupByDivision(teams);
  const rotation = INTER_CONFERENCE_ROTATION[year % 4];
  
  for (const [divEast, divWest] of rotation) {
    const teamsE = divisions.get(divEast);
    const teamsW = divisions.get(divWest);
    if (!teamsE || !teamsW) {
      throw new Error(`Division not found: ${divEast} or ${divWest}`);
    }
    for (const a of teamsE) {
      for (const b of teamsW) {
        result.push(makeMatchup(a, b, 'inter_conference'));
      }
    }
  }
  
  if (result.length !== 64) {
    throw new Error(`Expected 64 inter-conference matchups, got ${result.length}`);
  }
  return result;
}

function generateSamePlaceIntraMatchups(teams: Team[], year: number): Matchup[] {
  const result: Matchup[] = [];
  const divisions = groupByDivision(teams);
  const rotation = INTRA_CONFERENCE_ROTATION[year % 3];
  
  const EASTERN_DIVS = ['Eastern_East', 'Eastern_Atlantic', 'Eastern_North', 'Eastern_South'];
  const WESTERN_DIVS = ['Western_Central', 'Western_Mountain', 'Western_Pacific', 'Western_Southwest'];
  
  for (const confDivs of [EASTERN_DIVS, WESTERN_DIVS]) {
    // Pares cruzados ese año en esta conferencia (orden canónico)
    const crossedKeys = new Set(
      rotation
        .filter(([a]) => confDivs.includes(a))
        .map(([a, b]) => [a, b].sort().join('|'))
    );
    
    // Generar todos los C(4,2)=6 pares de divisiones de la conferencia
    for (let i = 0; i < confDivs.length; i++) {
      for (let j = i + 1; j < confDivs.length; j++) {
        const key = [confDivs[i], confDivs[j]].sort().join('|');
        if (crossedKeys.has(key)) continue;  // saltar los 2 cruzados en regla 2
        
        const standingsA = getSyntheticDivisionStandings(divisions.get(confDivs[i])!);
        const standingsB = getSyntheticDivisionStandings(divisions.get(confDivs[j])!);
        
        // Posición 0 vs 0, 1 vs 1, 2 vs 2, 3 vs 3
        for (let pos = 0; pos < 4; pos++) {
          result.push(makeMatchup(standingsA[pos], standingsB[pos], 'same_place_intra'));
        }
      }
    }
  }
  
  if (result.length !== 32) {
    throw new Error(`Expected 32 same-place intra matchups, got ${result.length}`);
  }
  return result;
}

function generateSeventeenthGameMatchups(teams: Team[], year: number): Matchup[] {
  const result: Matchup[] = [];
  const divisions = groupByDivision(teams);
  const rotation = INTER_CONFERENCE_ROTATION[(year + 1) % 4];
  
  for (const [divEast, divWest] of rotation) {
    const standingsE = getSyntheticDivisionStandings(divisions.get(divEast)!);
    const standingsW = getSyntheticDivisionStandings(divisions.get(divWest)!);
    
    for (let pos = 0; pos < 4; pos++) {
      result.push(makeMatchup(standingsE[pos], standingsW[pos], 'seventeenth'));
    }
  }
  
  if (result.length !== 16) {
    throw new Error(`Expected 16 seventeenth-game matchups, got ${result.length}`);
  }
  return result;
}

export function generateMatchups(teams: Team[], year: number): Matchup[] {
  if (teams.length !== 32) {
    throw new Error(`Expected 32 teams, got ${teams.length}`);
  }
  
  const all = [
    ...generateDivisionalMatchups(teams),
    ...generateIntraConferenceMatchups(teams, year),
    ...generateInterConferenceMatchups(teams, year),
    ...generateSamePlaceIntraMatchups(teams, year),
    ...generateSeventeenthGameMatchups(teams, year),
  ];
  
  if (all.length !== 272) {
    throw new Error(`Expected 272 total matchups, got ${all.length}`);
  }
  
  // Verificación: cada equipo aparece exactamente 17 veces
  const counts = new Map<string, number>();
  for (const m of all) {
    counts.set(m.teamAId, (counts.get(m.teamAId) ?? 0) + 1);
    counts.set(m.teamBId, (counts.get(m.teamBId) ?? 0) + 1);
  }
  for (const [teamId, count] of counts) {
    if (count !== 17) {
      throw new Error(`Team ${teamId} has ${count} matchups, expected 17`);
    }
  }
  
  return all;
}

function assignWeeks(matchups: Matchup[], teams: Team[], rng: SeededRandom): Schedule {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const attemptRng = rng.derive(`attempt-${attempt}`);
    
    try {
      const byeWeeks = new Map<string, number>();
      const shuffledTeams = [...teams];
      for (let i = shuffledTeams.length - 1; i > 0; i--) {
        const j = attemptRng.randomInt(0, i);
        [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
      }
      
      // Reparto en 10 semanas (5 a 14) asegurando un número PAR de equipos por semana
      // Si descansan 3 equipos, quedan 29 jugando = 14.5 partidos (IMPOSIBLE).
      // Distribución: 6 semanas con 4 equipos, 4 semanas con 2 equipos.
      const byeWks = [
        5,5,5,5,
        6,6,6,6,
        7,7,7,7,
        8,8,8,8,
        9,9,9,9,
        10,10,10,10,
        11,11,
        12,12,
        13,13,
        14,14
      ];
      for (let i = 0; i < 32; i++) {
        byeWeeks.set(shuffledTeams[i].id, byeWks[i]);
      }
      
      const remainingMatchups = [...matchups];
      
      // PROBLEMA 2: Pre-asignar semana 18 (100% divisional)
      const week18Matchups: Matchup[] = [];
      const divisions = groupByDivision(teams);
      for (const divTeams of divisions.values()) {
        const sorted = [...divTeams].sort((a, b) => a.id.localeCompare(b.id));
        // Pares (0,1) y (2,3)
        const pairs = [[sorted[0], sorted[1]], [sorted[2], sorted[3]]];
        for (const [t1, t2] of pairs) {
          const idx = remainingMatchups.findIndex(m => 
            (m.teamAId === t1.id && m.teamBId === t2.id) || 
            (m.teamAId === t2.id && m.teamBId === t1.id)
          );
          if (idx === -1) throw new Error(`Divisional matchup not found for ${t1.id} vs ${t2.id}`);
          week18Matchups.push(remainingMatchups.splice(idx, 1)[0]);
        }
      }

      const teamUsedWeeks = new Map<string, Set<number>>();
      for (const t of teams) {
        teamUsedWeeks.set(t.id, new Set([byeWeeks.get(t.id)!, 18]));
      }
      
      const weekLoads = new Array(19).fill(0);
      weekLoads[18] = 16;
      const scheduledGames: ScheduledGame[] = [];
      for (const m of week18Matchups) {
        scheduledGames.push({ week: 18, homeTeamId: m.teamAId, awayTeamId: m.teamBId, type: m.type });
      }

      for (let i = remainingMatchups.length - 1; i > 0; i--) {
        const j = attemptRng.randomInt(0, i);
        [remainingMatchups[i], remainingMatchups[j]] = [remainingMatchups[j], remainingMatchups[i]];
      }

      let backtrackSteps = 0;
      const MAX_STEPS = 200000;

      function isAdjacentRematch(m: Matchup, w: number): boolean {
        return scheduledGames.some(sg => 
          (sg.week === w - 1 || sg.week === w + 1) &&
          ((sg.homeTeamId === m.teamAId && sg.awayTeamId === m.teamBId) ||
           (sg.homeTeamId === m.teamBId && sg.awayTeamId === m.teamAId))
        );
      }

      function solve(unassigned: Matchup[]): boolean {
        if (unassigned.length === 0) return true;
        
        backtrackSteps++;
        if (backtrackSteps > MAX_STEPS) return false;

        let bestIdx = -1;
        let minOptions = Infinity;

        for (let i = 0; i < unassigned.length; i++) {
          const m = unassigned[i];
          const usedA = teamUsedWeeks.get(m.teamAId)!;
          const usedB = teamUsedWeeks.get(m.teamBId)!;
          
          let count = 0;
          for (let w = 1; w <= 18; w++) {
            if (!usedA.has(w) && !usedB.has(w)) count++;
          }
          
          if (count < minOptions) {
            minOptions = count;
            bestIdx = i;
            if (minOptions === 0) return false;
            if (minOptions === 1) break; // Optimization
          }
        }

        const m = unassigned[bestIdx];
        const usedA = teamUsedWeeks.get(m.teamAId)!;
        const usedB = teamUsedWeeks.get(m.teamBId)!;

        const options: number[] = [];
        for (let w = 1; w <= 18; w++) {
          if (!usedA.has(w) && !usedB.has(w)) options.push(w);
        }

        // Try weeks with lowest load first, penalizing adjacent rematches
        options.sort((a, b) => {
          const adjA = isAdjacentRematch(m, a) ? 1 : 0;
          const adjB = isAdjacentRematch(m, b) ? 1 : 0;
          if (adjA !== adjB) return adjA - adjB;
          return weekLoads[a] - weekLoads[b];
        });

        const nextUnassigned = [...unassigned];
        nextUnassigned.splice(bestIdx, 1);

        for (const w of options) {
          usedA.add(w);
          usedB.add(w);
          weekLoads[w]++;
          scheduledGames.push({ week: w, homeTeamId: m.teamAId, awayTeamId: m.teamBId, type: m.type });
          
          if (solve(nextUnassigned)) return true;
          
          usedA.delete(w);
          usedB.delete(w);
          weekLoads[w]--;
          scheduledGames.pop();
        }

        return false;
      }

      if (!solve(remainingMatchups)) {
        throw new Error(`Could not assign matchups. Backtracking steps exceeded or no solution.`);
      }

      // Verificación Semana 18
      const week18Games = scheduledGames.filter(g => g.week === 18);
      if (week18Games.length !== 16 || week18Games.some(g => g.type !== 'divisional')) {
        throw new Error("Week 18 integrity check failed: must be 16 divisional games.");
      }

      // Asignar Home/Away con retry loop (greedy inteligente)
      let homeAwaySuccess = false;
      let globalFailureType: "homeCount" | "roadtrip" = "homeCount";
      let globalFailingTeam = "";

      for (let haAttempt = 0; haAttempt < 10000; haAttempt++) {
        const haRng = attemptRng.derive(`ha-${haAttempt}`);
        const tempHomeCounts = new Map<string, number>(teams.map(t => [t.id, 0]));
        const currentAwayStreaks = new Map<string, number>(teams.map(t => [t.id, 0]));
        
        // Ordenar cronológicamente para gestionar streaks, pero aleatorio dentro de cada semana
        const gamesForAssignment = [...scheduledGames].sort((a, b) => {
          if (a.week !== b.week) return a.week - b.week;
          return haRng.random() - 0.5;
        });
        
        for (const m of gamesForAssignment) {
          const tA = m.homeTeamId; // IDs originales (orden alfabético)
          const tB = m.awayTeamId;
          
          const hA = tempHomeCounts.get(tA)!;
          const hB = tempHomeCounts.get(tB)!;
          const sA = currentAwayStreaks.get(tA)!;
          const sB = currentAwayStreaks.get(tB)!;

          // Decidir quién es Local basándose en streaks y conteo total
          let tAHome = haRng.random() > 0.5;

          // Restricciones críticas: evitar roadtrip de 4
          if (sA >= 3) tAHome = true;
          else if (sB >= 3) tAHome = false;
          // Restricción: no exceder 9 home games
          else if (hA >= 9) tAHome = false;
          else if (hB >= 9) tAHome = true;
          // Preferencia: balancear hacia 8-9
          else if (hA < hB) tAHome = true;
          else if (hB < hA) tAHome = false;

          if (tAHome) {
            tempHomeCounts.set(tA, hA + 1);
            currentAwayStreaks.set(tA, 0);
            currentAwayStreaks.set(tB, sB + 1);
            m.homeTeamId = tA;
            m.awayTeamId = tB;
          } else {
            tempHomeCounts.set(tB, hB + 1);
            currentAwayStreaks.set(tB, 0);
            currentAwayStreaks.set(tA, sA + 1);
            m.homeTeamId = tB;
            m.awayTeamId = tA;
          }
        }
        
        let allValid = true;
        for (const [teamId, count] of tempHomeCounts) {
          if (count < 8 || count > 9) {
            allValid = false;
            globalFailingTeam = teamId;
            globalFailureType = "homeCount";
            break;
          }
        }

        if (allValid) {
          // Doble verificación de Roadtrips (especialmente por el bye que no rompe streak)
          for (const team of teams) {
            const sortedGames = gamesForAssignment
              .filter(g => g.homeTeamId === team.id || g.awayTeamId === team.id)
              .sort((a, b) => a.week - b.week);
            
            let maxAwayStreak = 0;
            let currentStreak = 0;
            for (const g of sortedGames) {
              if (g.awayTeamId === team.id) {
                currentStreak++;
                if (currentStreak > maxAwayStreak) maxAwayStreak = currentStreak;
              } else {
                currentStreak = 0;
              }
            }
            if (maxAwayStreak >= 4) {
              allValid = false;
              globalFailingTeam = team.id;
              globalFailureType = "roadtrip";
              break;
            }
          }
        }
        
        if (allValid) {
          homeAwaySuccess = true;
          break;
        } else {
          // Revertir para el siguiente intento
          for (const m of scheduledGames) {
            if (m.homeTeamId > m.awayTeamId) {
              const temp = m.homeTeamId;
              m.homeTeamId = m.awayTeamId;
              m.awayTeamId = temp;
            }
          }
        }
      }

      if (!homeAwaySuccess) {
        throw new Error(`Attempt ${attempt}: Could not balance home/away or roadtrip constraints (${globalFailureType} failed for ${globalFailingTeam}).`);
      }
      
      return {
        year: 0, // se sobrescribe luego
        games: scheduledGames,
        byeWeeks
      };
      
    } catch (e) {
      if (attempt === 5) {
        throw new Error(`Schedule assignment failed after 5 attempts. Last error: ${(e as Error).message}`);
      }
    }
  }
  throw new Error("Unreachable");
}

export function generateSchedule(teams: Team[], year: number, rng: SeededRandom): Schedule {
  const matchups = generateMatchups(teams, year);
  const schedule = assignWeeks(matchups, teams, rng);
  schedule.year = year;
  return schedule;
}
