import { simulateCareer, CareerResult, RetirementReason } from '../src/engine/career';
import { loadTeams } from '../src/data/loadTeams';
import { createPlayer } from '../src/engine/player';
import { SeededRandom } from '../src/engine/prng';
import { ContractOffer, ContractEvent } from '../src/engine/contracts';

/**
 * Script de análisis estadístico — 50 carreras simuladas
 * Genera un informe detallado comparando con benchmarks NFL.
 */

async function main() {
  const allTeams = loadTeams();
  const startYear = 2024;
  const numCareers = 50;

  const results: (CareerResult | { error: string, pos: string, id: number })[] = [];
  const allFAOffersCounts: number[] = [];

  console.log("Starting simulation of 50 careers...");

  for (let i = 1; i <= numCareers; i++) {
    const careerId = i;
    const careerSeed = `analysis-${String(i).padStart(3, '0')}`;
    const masterRng = new SeededRandom(careerSeed);
    
    // Aislamos RNGs según Ajuste 2
    const engineRng = masterRng.derive('engine');
    const callbackRng = masterRng.derive('callbacks');

    // Distribución de posiciones
    let position: 'QB' | 'RB' | 'WR';
    if (i <= 20) position = 'QB';
    else if (i <= 35) position = 'RB';
    else position = 'WR';

    // Selección de equipo aleatoria (Ajuste 3)
    const userTeamId = engineRng.pick(allTeams.map(t => t.id));

    const player = createPlayer({
      position,
      tier: 'user',
      rng: engineRng.derive('player-gen')
    });

    try {
      const result = simulateCareer({
        teams: allTeams,
        userPlayer: player,
        userTeamId,
        startYear,
        maxYears: 25, // Ajuste 4
        rng: engineRng,
        // Ajuste 1: retireDecisionCallback realista
        retireDecisionCallback: (ctx) => {
          // Edad ALTA + carrera ya cumplida: retiro voluntario más probable
          // Edad media: aguanta hasta que el motor le suelte
          let acceptProb;
          const player = ctx.player;
          if (player.age >= 35 && player.overall < 75) acceptProb = 0.5;
          else if (player.age >= 33 && player.overall < 70) acceptProb = 0.4;
          else if (player.overall < 60) acceptProb = 0.6; // jugador roto
          else acceptProb = 0.05; // 5% caprichoso retiro
          return callbackRng.random() < acceptProb;
        },
        faCallback: (offers, ctx) => {
          allFAOffersCounts.push(offers.length);

          if (ctx.isExtensionWindow) {
            // Lógica de extensiones: 60% aceptarla
            if (offers.length > 0 && callbackRng.random() < 0.6) {
              return offers[0];
            }
            return null; // Ir a FA o seguir contrato actual
          }

          // Lógica Free Agency pura o post-cut
          if (offers.length === 0) return null;

          // Elegir la de mayor totalValue (years * salary)
          let best = offers[0];
          let bestVal = best.years * best.salaryPerYear;
          for (const offer of offers) {
            const val = offer.years * offer.salaryPerYear;
            if (val > bestVal) {
              best = offer;
              bestVal = val;
            }
          }
          return best;
        },
        wealthCallback: () => ({
          buyPropertyIds: [],
          sellPropertyIds: [],
          buyVehicleIds: [],
          sellVehicleIds: []
        })
      });

      results.push(result);
    } catch (e: any) {
      results.push({ error: e.message, pos: position, id: i });
    }

    if (i % 10 === 0) {
      console.log(`Simulated ${i}/50 careers...`);
    }
  }

  printReport(results, allFAOffersCounts, startYear);
}

function getMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function getPercentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * s.length) - 1;
  return s[Math.max(0, idx)];
}

function getMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function formatCurrency(val: number): string {
  return `$${val.toFixed(1)}M`;
}

function printReport(results: (CareerResult | any)[], faOffersCounts: number[], startYear: number) {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("BLOQUE 1 — Tabla resumen de las 50 carreras\n");
  console.log("  #   POS  PICK  YRS  PEAK  REASON       CHAMP  EARN($M)  TEAMS  EXT  CUT");
  console.log("  " + "─".repeat(73));

  results.forEach((res, idx) => {
    const num = String(idx + 1).padStart(3, ' ');
    if (res.error) {
      console.log(`${num}   ${res.pos.padEnd(3)}  ERROR: ${res.error.substring(0, 50)}`);
      return;
    }

    const pos = res.playerAtStart.position.padEnd(3);
    const pick = String(res.userDraftPick).padStart(4, ' ');
    const yrs = String(res.yearsPlayed).padStart(3, ' ');
    const peak = String(res.peakOverall).padStart(4, ' ');
    const reason = res.retirementReason.padEnd(12);
    const champ = String(res.championshipsWon).padStart(5, ' ');
    const earn = formatCurrency(res.contractsHistory.totalEarnings).padStart(8, ' ');
    
    const teamIds = new Set<string>();
    res.contractsHistory.events.forEach((e: ContractEvent) => {
      if (e.newTeamId) teamIds.add(e.newTeamId);
    });
    const teamsCount = String(teamIds.size).padStart(5, ' ');
    
    const extCount = String(res.contractsHistory.events.filter((e: any) => e.type === 'extension_signed').length).padStart(4, ' ');
    const cutCount = String(res.contractsHistory.events.filter((e: any) => e.type === 'cut').length).padStart(4, ' ');

    console.log(`${num}   ${pos}  ${pick}  ${yrs}  ${peak}  ${reason} ${champ}  ${earn}  ${teamsCount}  ${extCount}  ${cutCount}`);
  });

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("BLOQUE 2 — Agregados por posición\n");

  const positions = ['QB', 'RB', 'WR'];
  const successResults = results.filter(r => !r.error) as CareerResult[];

  positions.forEach(pos => {
    const posResults = successResults.filter(r => r.playerAtStart.position === pos);
    const n = posResults.length;
    if (n === 0) return;

    const yrs = posResults.map(r => r.yearsPlayed);
    const peaks = posResults.map(r => r.peakOverall);
    const earns = posResults.map(r => r.contractsHistory.totalEarnings);
    const champs = posResults.map(r => r.championshipsWon);
    
    const teamCounts = posResults.map(r => {
      const s = new Set();
      r.contractsHistory.events.forEach(e => s.add(e.newTeamId));
      return s.size;
    });

    const reasons: Record<string, number> = {};
    posResults.forEach(r => {
      reasons[r.retirementReason] = (reasons[r.retirementReason] || 0) + 1;
    });

    console.log(`  POSITION: ${pos} (n=${n})`);
    console.log(`    Years played:      median ${getMedian(yrs).toFixed(0).padStart(2)}  p25 ${getPercentile(yrs, 25).toFixed(0).padStart(2)}  p75 ${getPercentile(yrs, 75).toFixed(0).padStart(2)}  p95 ${getPercentile(yrs, 95).toFixed(0).padStart(2)}`);
    console.log(`    Peak OVR:          median ${getMedian(peaks).toFixed(0).padStart(2)}  p25 ${getPercentile(peaks, 25).toFixed(0).padStart(2)}  p75 ${getPercentile(peaks, 75).toFixed(0).padStart(2)}  p95 ${getPercentile(peaks, 95).toFixed(0).padStart(2)}`);
    console.log(`    Earnings ($M):     median ${getMedian(earns).toFixed(1).padStart(4)}  p25 ${getPercentile(earns, 25).toFixed(1).padStart(4)}  p75 ${getPercentile(earns, 75).toFixed(1).padStart(4)}  p95 ${getPercentile(earns, 95).toFixed(1).padStart(4)}`);
    console.log(`    Championships:     mean ${getMean(champs).toFixed(2)}  % with 1+ ${(champs.filter(c => c > 0).length / n * 100).toFixed(0)}%`);
    
    const t1 = (teamCounts.filter(t => t === 1).length / n * 100).toFixed(0);
    const t23 = (teamCounts.filter(t => t >= 2 && t <= 3).length / n * 100).toFixed(0);
    const t4p = (teamCounts.filter(t => t >= 4).length / n * 100).toFixed(0);
    console.log(`    Number of teams:   1 team ${t1}%   2-3 teams ${t23}%   4+ teams ${t4p}%`);
    
    console.log(`    Retirement reason:`);
    ['forced_max_age', 'no_market', 'callback_chose'].forEach(reason => {
      const pct = ((reasons[reason] || 0) / n * 100).toFixed(0);
      console.log(`      ${reason.padEnd(15)}: ${pct}%`);
    });
    const othersCount = Object.keys(reasons).filter(k => !['forced_max_age', 'no_market', 'callback_chose'].includes(k)).reduce((s, k) => s + reasons[k], 0);
    console.log(`      (otros)        : ${(othersCount / n * 100).toFixed(0)}%`);
    console.log("");
  });

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("BLOQUE 3 — Análisis de eventos contractuales (los 50 jugadores agregados)\n");

  const allEvents = successResults.flatMap(r => r.contractsHistory.events);
  const eventCounts: Record<string, number> = {};
  allEvents.forEach(e => eventCounts[e.type] = (eventCounts[e.type] || 0) + 1);

  console.log(`Total de eventos en las 50 carreras:`);
  console.log(`  rookie_signed:      ${(eventCounts['rookie_signed'] || 0)}`);
  console.log(`  extension_signed:   ${(eventCounts['extension_signed'] || 0)}`);
  console.log(`  free_agency_signed: ${(eventCounts['free_agency_signed'] || 0)}`);
  console.log(`  cut:                ${(eventCounts['cut'] || 0)}`);
  console.log(`  retired_no_market:  ${(eventCounts['retired_no_market'] || 0)}`);
  console.log("");

  console.log(`Análisis de extensions (sobre los extension_signed):`);
  const extensionEvents = successResults.flatMap(r => {
    const rookie = r.contractsHistory.events.find(e => e.type === 'rookie_signed');
    if (!rookie) return [];
    return r.contractsHistory.events
      .filter(e => e.type === 'extension_signed')
      .map(e => ({ diff: e.year - rookie.year + 1 }));
  });
  
  const extYears = [3, 4, 5];
  extYears.forEach(y => {
    const count = extensionEvents.filter(e => e.diff === y).length;
    const pct = extensionEvents.length > 0 ? (count / extensionEvents.length * 100).toFixed(0) : "0";
    console.log(`    Year ${y} of career (approx): ${count} (${pct}%)`);
  });
  console.log("");

  console.log(`Análisis de Free Agency:`);
  console.log(`  Distribución del número de ofertas recibidas en eventos FA:`);
  const faCounts = faOffersCounts; // captured in callback
  const faBuckets: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
  faCounts.forEach(c => {
    if (c >= 5) faBuckets['5+']++;
    else faBuckets[String(c)]++;
  });
  Object.entries(faBuckets).forEach(([k, v]) => {
    const label = k === '0' ? '0 offers (no_market)' : `${k} offer${k==='1'?'':'s'}`;
    console.log(`    ${label.padEnd(21)}: ${v}`);
  });

  const faSigned = allEvents.filter(e => e.type === 'free_agency_signed');
  const stayed = faSigned.filter(e => e.oldTeamId === e.newTeamId).length;
  const stayedPct = faSigned.length > 0 ? (stayed / faSigned.length * 100).toFixed(0) : "0";
  console.log(`\n  % de FA donde la firma fue con current team: ${stayedPct}%`);
  console.log("");

  console.log(`Análisis de Cuts:`);
  const cutPlayers = successResults.filter(r => r.contractsHistory.events.some(e => e.type === 'cut'));
  console.log(`  Carreras que sufrieron 1+ cut: ${cutPlayers.length} de 50 (${(cutPlayers.length/50*100).toFixed(0)}%)`);
  
  const firstCutYears = cutPlayers.map(r => {
    const cutEvent = r.contractsHistory.events.find(e => e.type === 'cut');
    return cutEvent ? (cutEvent.year - startYear + 1) : 0;
  });
  console.log(`  Mediana del año del primer cut: año ${getMedian(firstCutYears).toFixed(0)} de carrera`);
  console.log("");

  console.log(`Earnings (las 50 carreras, todas posiciones):`);
  const allEarns = successResults.map(r => r.contractsHistory.totalEarnings);
  console.log(`  Percentiles globales: p25 ${formatCurrency(getPercentile(allEarns, 25))}  p50 ${formatCurrency(getPercentile(allEarns, 50))}  p75 ${formatCurrency(getPercentile(allEarns, 75))}  p95 ${formatCurrency(getPercentile(allEarns, 95))}`);
  
  let maxEarn = -1;
  let maxCareerIdx = -1;
  successResults.forEach((r, idx) => {
    if (r.contractsHistory.totalEarnings > maxEarn) {
      maxEarn = r.contractsHistory.totalEarnings;
      maxCareerIdx = idx + 1;
    }
  });
  const maxPlayer = successResults.find((_, i) => i + 1 === maxCareerIdx);
  console.log(`  Carrera con earnings máximos: ${formatCurrency(maxEarn)} (carrera #${maxCareerIdx}, position ${maxPlayer?.playerAtStart.position})`);

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("BLOQUE 4 — Comparación con benchmarks NFL reales\n");
  console.log("  Metric                          | Engine   | NFL real    | Verdict");
  console.log("  " + "─".repeat(31) + "┼" + "─".repeat(10) + "┼" + "─".repeat(13) + "┼" + "─".repeat(8));

  const qbRes = successResults.filter(r => r.playerAtStart.position === 'QB');
  const rbRes = successResults.filter(r => r.playerAtStart.position === 'RB');
  const wrRes = successResults.filter(r => r.playerAtStart.position === 'WR');

  const getVerdict = (val: number, range: [number, number] | number) => {
    let min, max;
    if (Array.isArray(range)) {
      [min, max] = range;
    } else {
      min = range * 0.8;
      max = range * 1.2;
    }
    if (val < min) return "LOW";
    if (val > max) return "HIGH";
    return "OK";
  };

  const metrics = [
    { name: "QB median career length", engine: getMedian(qbRes.map(r => r.yearsPlayed)), nfl: [9, 12], unit: " yrs" },
    { name: "RB median career length", engine: getMedian(rbRes.map(r => r.yearsPlayed)), nfl: [4, 6], unit: " yrs" },
    { name: "WR median career length", engine: getMedian(wrRes.map(r => r.yearsPlayed)), nfl: [7, 9], unit: " yrs" },
    { name: "% careers 15+ years", engine: (successResults.filter(r => r.yearsPlayed >= 15).length / 50 * 100), nfl: [5, 10], unit: "%" },
    { name: "% careers <3 years (busts)", engine: (successResults.filter(r => r.yearsPlayed < 3).length / 50 * 100), nfl: [25, 35], unit: "%" },
    { name: "Retirement: forced_max_age %", engine: (successResults.filter(r => r.retirementReason === 'forced_max_age').length / 50 * 100), nfl: [15, 20], unit: "%" },
    { name: "Retirement: no_market %", engine: (successResults.filter(r => r.retirementReason === 'no_market').length / 50 * 100), nfl: [60, 70], unit: "%" },
    { name: "Retirement: callback_chose %", engine: (successResults.filter(r => r.retirementReason === 'callback_chose').length / 50 * 100), nfl: [15, 25], unit: "%" },
    { name: "Peak OVR 90+ rate", engine: (successResults.filter(r => r.peakOverall >= 90).length / 50 * 100), nfl: [10, 15], unit: "%" },
    { name: "% careers with 1+ championship", engine: (successResults.filter(r => r.championshipsWon > 0).length / 50 * 100), nfl: [10, 15], unit: "%" },
    { name: "% one-team men (1 team only)", engine: (successResults.filter(r => {
        const s = new Set();
        r.contractsHistory.events.forEach(e => s.add(e.newTeamId));
        return s.size === 1;
      }).length / 50 * 100), nfl: [5, 10], unit: "%" },
    { name: "% journeymen (4+ teams)", engine: (successResults.filter(r => {
        const s = new Set();
        r.contractsHistory.events.forEach(e => s.add(e.newTeamId));
        return s.size >= 4;
      }).length / 50 * 100), nfl: [15, 20], unit: "%" },
    { name: "Extensions in year 2 of rookie", engine: (extensionEvents.filter(e => e.diff === 2).length / (extensionEvents.length || 1) * 100), nfl: 5, unit: "%" },
    { name: "Extensions in year 3-4 of rookie", engine: (extensionEvents.filter(e => e.diff === 3 || e.diff === 4).length / (extensionEvents.length || 1) * 100), nfl: 80, unit: "%" },
    { name: "% FA where signs with current", engine: parseFloat(stayedPct), nfl: [40, 50], unit: "%" },
    { name: "Median total earnings", engine: getMedian(allEarns), nfl: [30, 50], unit: "M", prefix: "$" },
    { name: "P95 total earnings", engine: getPercentile(allEarns, 95), nfl: 200, unit: "M", prefix: "$" },
  ];

  metrics.forEach(m => {
    const engineVal = (m.prefix || "") + m.engine.toFixed(m.name.includes("length") || m.name.includes("earnings") ? 1 : 0) + m.unit;
    const nflStr = Array.isArray(m.nfl) ? `${m.nfl[0]}-${m.nfl[1]}${m.unit}` : `${m.prefix||""}${m.nfl}${m.unit}`;
    const verdict = getVerdict(m.engine, m.nfl);
    console.log(`  ${m.name.padEnd(31)} | ${engineVal.padEnd(8)} | ${nflStr.padEnd(11)} | ${verdict}`);
  });

  console.log("═══════════════════════════════════════════════════════════════\n");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
