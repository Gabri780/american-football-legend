import { Player } from './player';
import { SeededRandom } from './prng';
import { PlayerSeasonStats } from './season';
import { Team } from './team';

export interface Contract {
  teamId: string;
  yearsTotal: number;
  yearsRemaining: number;
  salaryPerYear: number;          // en millones de dólares
  guaranteedTotal: number;        // total garantizado del contrato
  guaranteedRemaining: number;    // garantizado pendiente de pagar
  signingBonus: number;
  yearSigned: number;             // year en que se firmó
  isRookieContract: boolean;
}

export interface ContractOffer {
  teamId: string;
  years: number;
  salaryPerYear: number;
  guaranteedTotal: number;
  signingBonus: number;
  isCurrentTeam: boolean;          // true si es renovación del equipo actual
  isContender: boolean;            // true si el team tuvo récord >9 wins último año
  isExtension: boolean;            // true si es oferta de extensión (no free agency)
}

export interface FreeAgencyContext {
  player: Player;
  yearsPlayed: number;
  currentContract: Contract;
  isExtensionWindow: boolean;      // true si estamos en ventana de extensión (años 1-2 antes de expirar)
  wasJustCut: boolean;             // true si el equipo lo cortó este offseason
}

export type FreeAgencyDecisionCallback = (
  offers: ContractOffer[],
  context: FreeAgencyContext
) => ContractOffer | null;            // null = retire por mercado vacío

export interface ContractEvent {
  year: number;
  type: 'rookie_signed' | 'extension_signed' | 'free_agency_signed' | 'cut' | 'retired_no_market';
  oldTeamId?: string;
  newTeamId: string;
  contractValue: number;             // valor total del contrato firmado
  yearsTotal: number;
  guaranteedTotal: number;
}

export interface ContractsHistory {
  events: ContractEvent[];           // un evento por cada cambio contractual
  totalEarnings: number;             // suma del salario cobrado (incluyendo años parciales si fue cortado)
}

export function generateRookieContract(player: Player, teamId: string, year: number, rng: SeededRandom): Contract {
  const ovr = player.overall;
  let years: number, salaryRange: [number, number], guaranteedPct: number;
  
  if (ovr >= 80) {
    // Round 1
    years = 4;
    salaryRange = [15, 40];
    guaranteedPct = 1.0;
  } else if (ovr >= 75) {
    // Round 2
    years = 4;
    salaryRange = [8, 12];
    guaranteedPct = 0.7;
  } else if (ovr >= 70) {
    // Round 3-4
    years = 4;
    salaryRange = [4, 7];
    guaranteedPct = 0.4;
  } else if (ovr >= 65) {
    // Round 5-7
    years = 4;
    salaryRange = [3, 4];
    guaranteedPct = 0.2;
  } else {
    // Undrafted
    years = 1;
    salaryRange = [1, 2];
    guaranteedPct = 0.0;
  }
  
  const salaryTotal = rng.random() * (salaryRange[1] - salaryRange[0]) + salaryRange[0];
  const guaranteedTotal = salaryTotal * guaranteedPct;
  const signingBonus = guaranteedTotal * 0.3;  // ~30% del garantizado va como bonus de firma
  
  return {
    teamId,
    yearsTotal: years,
    yearsRemaining: years,
    salaryPerYear: salaryTotal / years,
    guaranteedTotal,
    guaranteedRemaining: guaranteedTotal,
    signingBonus,
    yearSigned: year,
    isRookieContract: true
  };
}

export function computeMarketScore(player: Player, recentStats: PlayerSeasonStats[], yearsPlayed: number): number {
  // OVR component (50%)
  const ovrComponent = player.overall * 0.50;
  
  // Performance recent component (30%) — based on last 1-2 seasons stats
  const performanceComponent = computePerformanceScore(player.position, recentStats) * 0.30;
  
  // Age component (20%)
  const age = player.age;
  let ageScore: number;
  if (age <= 26) ageScore = 100;
  else if (age <= 29) ageScore = 95;
  else if (age <= 31) ageScore = 80;
  else if (age <= 33) ageScore = 60;
  else ageScore = 40;
  const ageComponent = ageScore * 0.20;
  
  return ovrComponent + performanceComponent + ageComponent;
}

export function computePerformanceScore(position: string, recentStats: PlayerSeasonStats[]): number {
  if (recentStats.length === 0) return 50; // neutral si no hay historia
  
  // Promediar últimas 2 temporadas
  const lastN = recentStats.slice(-2);
  
  if (position === 'QB') {
    // Bench marks NFL: élite 4500yd / 35TD = 100, regular 3500/22 = 70, malo 2500/15 = 40
    const avgYards = lastN.reduce((s, x) => s + x.passYards, 0) / lastN.length;
    const avgTDs = lastN.reduce((s, x) => s + x.passTDs, 0) / lastN.length;
    const yardsScore = Math.min(100, (avgYards / 4500) * 100);
    const tdsScore = Math.min(100, (avgTDs / 35) * 100);
    return (yardsScore + tdsScore) / 2;
  }
  
  if (position === 'RB') {
    // Bench: élite 1500yd rush / 15TD = 100
    const avgYards = lastN.reduce((s, x) => s + x.rushYards, 0) / lastN.length;
    const avgTDs = lastN.reduce((s, x) => s + x.rushTDs, 0) / lastN.length;
    const yardsScore = Math.min(100, (avgYards / 1500) * 100);
    const tdsScore = Math.min(100, (avgTDs / 15) * 100);
    return (yardsScore + tdsScore) / 2;
  }
  
  if (position === 'WR') {
    // Bench: élite 1500 rec yards / 12 TDs = 100
    const avgYards = lastN.reduce((s, x) => s + x.receivingYards, 0) / lastN.length;
    const avgTDs = lastN.reduce((s, x) => s + x.receivingTDs, 0) / lastN.length;
    const yardsScore = Math.min(100, (avgYards / 1500) * 100);
    const tdsScore = Math.min(100, (avgTDs / 12) * 100);
    return (yardsScore + tdsScore) / 2;
  }
  
  return 50;
}

export function generateOffers(
  player: Player,
  currentContract: Contract,
  marketScore: number,
  teams: Team[],
  isExtension: boolean,        // true si es ventana de extensión (no free agency)
  wasJustCut: boolean,
  recentTeamRecords: Map<string, number>, // teamId -> wins último año
  rng: SeededRandom
): ContractOffer[] {
  // Determinar tier y rangos
  let numOffers: number;
  let salaryRange: [number, number];
  let yearsRange: [number, number];
  let guaranteedPctRange: [number, number];
  
  if (marketScore >= 90) {
    numOffers = rng.randomInt(5, 7);
    salaryRange = [40, 60];
    yearsRange = [4, 6];
    guaranteedPctRange = [0.6, 0.8];
  } else if (marketScore >= 80) {
    numOffers = rng.randomInt(4, 6);
    salaryRange = [25, 40];
    yearsRange = [3, 5];
    guaranteedPctRange = [0.5, 0.7];
  } else if (marketScore >= 70) {
    numOffers = rng.randomInt(3, 5);
    salaryRange = [12, 25];
    yearsRange = [3, 4];
    guaranteedPctRange = [0.3, 0.5];
  } else if (marketScore >= 60) {
    numOffers = rng.randomInt(2, 4);
    salaryRange = [4, 12];
    yearsRange = [2, 3];
    guaranteedPctRange = [0.15, 0.3];
  } else {
    numOffers = rng.randomInt(1, 2);
    salaryRange = [1, 3];
    yearsRange = [1, 2];
    guaranteedPctRange = [0.0, 0.1];
  }
  
  // Si fue cortado, mercado castigado: -1 oferta, salarios -20%
  if (wasJustCut) {
    numOffers = Math.max(1, numOffers - 1);
    salaryRange = [salaryRange[0] * 0.8, salaryRange[1] * 0.8];
  }
  
  // Si es extensión: solo 1 oferta del equipo actual
  if (isExtension) {
    numOffers = 1;
  }
  
  const offers: ContractOffer[] = [];
  const usedTeamIds = new Set<string>();
  
  // Si NO es extensión, garantizar que el equipo actual está en las ofertas
  if (!isExtension && !wasJustCut) {
    offers.push(makeOffer(currentContract.teamId, salaryRange, yearsRange, guaranteedPctRange, true, recentTeamRecords.get(currentContract.teamId) ?? 8, false, rng));
    usedTeamIds.add(currentContract.teamId);
  }
  
  // Si es extensión, solo 1 del current team
  if (isExtension) {
    offers.push(makeOffer(currentContract.teamId, salaryRange, yearsRange, guaranteedPctRange, true, recentTeamRecords.get(currentContract.teamId) ?? 8, true, rng));
    return offers;
  }
  
  // Generar resto de ofertas de equipos aleatorios
  while (offers.length < numOffers) {
    const team = teams[rng.randomInt(0, teams.length - 1)];
    if (usedTeamIds.has(team.id)) continue;
    usedTeamIds.add(team.id);
    
    const teamRecord = recentTeamRecords.get(team.id) ?? 8;
    offers.push(makeOffer(team.id, salaryRange, yearsRange, guaranteedPctRange, false, teamRecord, false, rng));
  }
  
  return offers;
}

export function makeOffer(
  teamId: string,
  salaryRange: [number, number],
  yearsRange: [number, number],
  guaranteedPctRange: [number, number],
  isCurrentTeam: boolean,
  teamRecord: number,
  isExtension: boolean,
  rng: SeededRandom
): ContractOffer {
  const years = rng.randomInt(yearsRange[0], yearsRange[1]);
  const salaryPerYear = rng.random() * (salaryRange[1] - salaryRange[0]) + salaryRange[0];
  const totalValue = years * salaryPerYear;
  const guaranteedPct = rng.random() * (guaranteedPctRange[1] - guaranteedPctRange[0]) + guaranteedPctRange[0];
  const guaranteedTotal = totalValue * guaranteedPct;
  const signingBonus = guaranteedTotal * 0.3;
  
  return {
    teamId,
    years,
    salaryPerYear,
    guaranteedTotal,
    signingBonus,
    isCurrentTeam,
    isContender: teamRecord >= 9,
    isExtension
  };
}

export function shouldTeamCut(player: Player, contract: Contract, rng: SeededRandom): boolean {
  // Solo se puede cortar si quedan años no garantizados
  const nonGuaranteedYears = contract.yearsRemaining - 
    (contract.guaranteedRemaining / contract.salaryPerYear);
  if (nonGuaranteedYears <= 0) return false;
  
  // Cut probability: a más sueldo y menos OVR, más probable
  const expectedOVR = contract.salaryPerYear * 0.5 + 60;  // $20M → expect OVR 70, $40M → expect OVR 80
  const ovrGap = expectedOVR - player.overall;
  
  if (ovrGap <= 0) return false; // performing arriba de expectativa, NO cut
  if (ovrGap < 5) return rng.random() < 0.10;   // ligero gap, 10% cut
  if (ovrGap < 10) return rng.random() < 0.30;  // medio gap, 30% cut
  if (ovrGap < 15) return rng.random() < 0.60;  // gap grande, 60% cut
  return rng.random() < 0.85;                   // gap masivo, 85% cut
}

export function teamOffersExtension(player: Player, contract: Contract, marketScore: number, rng: SeededRandom): boolean {
  // Solo si quedan 1-2 años de contrato
  if (contract.yearsRemaining > 2 || contract.yearsRemaining < 1) return false;
  
  // Probabilidad basada en market score:
  // - >=90: 70% chance equipo ofrece extensión (jugador élite)
  // - 80-89: 50%
  // - 70-79: 30%
  // - <70: 10%
  
  let prob: number;
  if (marketScore >= 90) prob = 0.70;
  else if (marketScore >= 80) prob = 0.50;
  else if (marketScore >= 70) prob = 0.30;
  else prob = 0.10;
  
  return rng.random() < prob;
}

export interface OffseasonContractResult {
  newContract: Contract | null;     // null si retired by no_market
  retired: boolean;
  retirementReason: 'no_market' | null;
  contractEvents: ContractEvent[];  // eventos generados este offseason
  earningsThisYear: number;         // dinero cobrado el año que ACABA de terminar
}

export function processOffseasonContracts(params: {
  player: Player;
  currentContract: Contract;
  currentYear: number;
  yearsPlayed: number;
  recentStats: PlayerSeasonStats[];     // últimas 1-3 temporadas
  recentTeamRecords: Map<string, number>; // teamId -> wins último año
  teams: Team[];
  faCallback: FreeAgencyDecisionCallback;
  rng: SeededRandom;
}): OffseasonContractResult {
  const { player, currentContract, currentYear, yearsPlayed, recentStats, recentTeamRecords, teams, faCallback, rng } = params;

  let earningsThisYear = currentContract.salaryPerYear;
  currentContract.yearsRemaining -= 1;
  currentContract.guaranteedRemaining = Math.max(0, currentContract.guaranteedRemaining - currentContract.salaryPerYear);

  const marketScore = computeMarketScore(player, recentStats, yearsPlayed);
  let newContract: Contract | null = currentContract;
  let retired = false;
  let retirementReason: 'no_market' | null = null;
  const contractEvents: ContractEvent[] = [];

  if (currentContract.yearsRemaining === 0) {
    const offers = generateOffers(player, currentContract, marketScore, teams, false, false, recentTeamRecords, rng);
    const ctx: FreeAgencyContext = { player, yearsPlayed, currentContract, isExtensionWindow: false, wasJustCut: false };
    const decision = faCallback(offers, ctx);

    if (decision === null) {
      retired = true;
      retirementReason = 'no_market';
      newContract = null;
      contractEvents.push({
        year: currentYear,
        type: 'retired_no_market',
        newTeamId: currentContract.teamId,
        contractValue: 0,
        yearsTotal: 0,
        guaranteedTotal: 0
      });
    } else {
      newContract = {
        teamId: decision.teamId,
        yearsTotal: decision.years,
        yearsRemaining: decision.years,
        salaryPerYear: decision.salaryPerYear,
        guaranteedTotal: decision.guaranteedTotal,
        guaranteedRemaining: decision.guaranteedTotal,
        signingBonus: decision.signingBonus,
        yearSigned: currentYear,
        isRookieContract: false
      };
      contractEvents.push({
        year: currentYear,
        type: 'free_agency_signed',
        oldTeamId: currentContract.teamId,
        newTeamId: decision.teamId,
        contractValue: decision.salaryPerYear * decision.years,
        yearsTotal: decision.years,
        guaranteedTotal: decision.guaranteedTotal
      });
    }
  } else if (currentContract.yearsRemaining > 0) {
    if (shouldTeamCut(player, currentContract, rng)) {
      earningsThisYear += currentContract.guaranteedRemaining;
      currentContract.yearsRemaining = 0;
      contractEvents.push({
        year: currentYear,
        type: 'cut',
        oldTeamId: currentContract.teamId,
        newTeamId: currentContract.teamId,
        contractValue: 0,
        yearsTotal: 0,
        guaranteedTotal: 0
      });

      const offers = generateOffers(player, currentContract, marketScore, teams, false, true, recentTeamRecords, rng);
      const ctx: FreeAgencyContext = { player, yearsPlayed, currentContract, isExtensionWindow: false, wasJustCut: true };
      const decision = faCallback(offers, ctx);

      if (decision === null) {
        retired = true;
        retirementReason = 'no_market';
        newContract = null;
        contractEvents.push({
          year: currentYear,
          type: 'retired_no_market',
          newTeamId: currentContract.teamId,
          contractValue: 0,
          yearsTotal: 0,
          guaranteedTotal: 0
        });
      } else {
        newContract = {
          teamId: decision.teamId,
          yearsTotal: decision.years,
          yearsRemaining: decision.years,
          salaryPerYear: decision.salaryPerYear,
          guaranteedTotal: decision.guaranteedTotal,
          guaranteedRemaining: decision.guaranteedTotal,
          signingBonus: decision.signingBonus,
          yearSigned: currentYear,
          isRookieContract: false
        };
        contractEvents.push({
          year: currentYear,
          type: 'free_agency_signed',
          oldTeamId: currentContract.teamId,
          newTeamId: decision.teamId,
          contractValue: decision.salaryPerYear * decision.years,
          yearsTotal: decision.years,
          guaranteedTotal: decision.guaranteedTotal
        });
      }
    } else {
      if (teamOffersExtension(player, currentContract, marketScore, rng)) {
        const offers = generateOffers(player, currentContract, marketScore, teams, true, false, recentTeamRecords, rng);
        const ctx: FreeAgencyContext = { player, yearsPlayed, currentContract, isExtensionWindow: true, wasJustCut: false };
        const decision = faCallback(offers, ctx);

        if (decision !== null) {
          newContract = {
            teamId: decision.teamId,
            yearsTotal: decision.years,
            yearsRemaining: decision.years,
            salaryPerYear: decision.salaryPerYear,
            guaranteedTotal: decision.guaranteedTotal,
            guaranteedRemaining: decision.guaranteedTotal,
            signingBonus: decision.signingBonus,
            yearSigned: currentYear,
            isRookieContract: false
          };
          contractEvents.push({
            year: currentYear,
            type: 'extension_signed',
            oldTeamId: currentContract.teamId,
            newTeamId: decision.teamId,
            contractValue: decision.salaryPerYear * decision.years,
            yearsTotal: decision.years,
            guaranteedTotal: decision.guaranteedTotal
          });
        }
      }
    }
  }

  return {
    newContract,
    retired,
    retirementReason,
    contractEvents,
    earningsThisYear
  };
}
