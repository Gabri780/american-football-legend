import { SeededRandom } from './prng';
import { computeOutcomeProbabilities } from './driveProbabilities';
import { generateDriveNarrative } from './driveNarrative';

export type DriveOutcome = 
  | 'TD' | 'FG' | 'MISSED_FG' | 'PUNT' 
  | 'TURNOVER_INT' | 'TURNOVER_FUMBLE'
  | 'DOWNS' | 'SAFETY' | 'END_HALF' | 'END_GAME';

export interface GameContext {
  isPlayoff: boolean;
  isRivalryGame: boolean;
  isPrimetime: boolean;
  isHomeGame: boolean;
}

export interface Drive {
  id: string;
  teamOnOffenseId: string;
  teamOnDefenseId: string;
  startingYardLine: number;     // 1-99
  quarter: 1 | 2 | 3 | 4;
  
  plays: number;                // total de jugadas (estimado)
  totalYards: number;           // yardas avanzadas
  timeConsumed: number;         // segundos quitados del reloj
  
  outcome: DriveOutcome;
  pointsScored: number;
  defensivePointsScored: number; // puntos que la defensa marca en este drive
  endingYardLine: number;       // 1-99 donde acabó
  
  description: string;          // 1-2 frases resumen
  highlight: string;            // frase con la jugada destacada
}

export function simulateDrive(
  offenseRating: number,
  defenseRating: number,
  offenseTeamId: string,
  defenseTeamId: string,
  startYard: number,
  quarter: 1 | 2 | 3 | 4,
  context: GameContext,
  rng: SeededRandom,
  gameId?: string,
  driveNumber?: number
): Drive {
  // 1. Matchup Delta
  const matchupDelta = offenseRating - defenseRating;

  // 2-4. Probabilities & Modulation
  const probabilities = computeOutcomeProbabilities(matchupDelta, startYard, quarter);

  // 5. Pick Outcome
  const outcome = rng.weightedRandom(probabilities);

  // 6. Generate physical stats
  let plays = 0;
  let totalYards = 0;
  let timeConsumed = 0;
  let pointsScored = 0;
  let defensivePointsScored = 0;

  switch (outcome) {
    case 'TD':
      plays = rng.randomInt(4, 14);
      totalYards = 100 - startYard;
      timeConsumed = rng.randomInt(60, 360);
      pointsScored = 7;
      break;
    case 'FG':
      plays = rng.randomInt(4, 12);
      totalYards = rng.randomInt(10, 70);
      timeConsumed = rng.randomInt(60, 300);
      pointsScored = 3;
      break;
    case 'PUNT':
      plays = rng.randomInt(3, 8);
      totalYards = rng.randomInt(-5, 25);
      timeConsumed = rng.randomInt(60, 240);
      break;
    case 'TURNOVER_INT':
      plays = rng.randomInt(1, 7);
      totalYards = rng.randomInt(-5, 40);
      timeConsumed = rng.randomInt(30, 180);
      break;
    case 'TURNOVER_FUMBLE':
      plays = rng.randomInt(1, 8);
      totalYards = rng.randomInt(-5, 50);
      timeConsumed = rng.randomInt(30, 240);
      break;
    case 'DOWNS':
      plays = rng.randomInt(3, 8);
      totalYards = rng.randomInt(0, 30);
      timeConsumed = rng.randomInt(60, 240);
      break;
    case 'MISSED_FG':
      plays = rng.randomInt(4, 12);
      totalYards = rng.randomInt(10, 60);
      timeConsumed = rng.randomInt(60, 300);
      break;
    case 'SAFETY':
      plays = rng.randomInt(1, 3);
      totalYards = rng.randomInt(-10, -2);
      timeConsumed = rng.randomInt(10, 60);
      pointsScored = 0; // La ofensa NO marca puntos en safety
      defensivePointsScored = 2; // Puntos para el equipo defensor
      break;
    case 'END_HALF':
    case 'END_GAME':
      plays = rng.randomInt(1, 8);
      totalYards = rng.randomInt(0, 50);
      timeConsumed = 0;
      break;
  }

  // Ensure yards don't exceed field limits (except TD which is fixed)
  if (outcome !== 'TD') {
    if (startYard + totalYards > 99) {
      totalYards = 99 - startYard;
    }
    if (startYard + totalYards < 1) {
      totalYards = 1 - startYard;
    }
  }

  const endingYardLine = startYard + totalYards;
  const legacyId = rng.randomInt(1000, 9999).toString();

  const drive: Drive = {
    id: (gameId !== undefined && driveNumber !== undefined) 
      ? `${gameId}-${driveNumber}` 
      : legacyId,
    teamOnOffenseId: offenseTeamId,
    teamOnDefenseId: defenseTeamId,
    startingYardLine: startYard,
    quarter,
    plays,
    totalYards,
    timeConsumed,
    outcome,
    pointsScored,
    defensivePointsScored,
    endingYardLine,
    description: '',
    highlight: ''
  };

  const narrative = generateDriveNarrative(drive, rng);
  drive.description = narrative.description;
  drive.highlight = narrative.highlight;

  return drive;
}
