import { Drive, DriveOutcome } from './drive';
import { SeededRandom } from './prng';

const HIGHLIGHT_TEMPLATES: Record<DriveOutcome, string[]> = {
  'TD': [
    "Touchdown. A methodical drive capped off with points in the end zone.",
    "Touchdown! An explosive play leaves the defense searching for answers.",
    "The offense punch it in for a crucial touchdown after a gritty series.",
    "Flawless execution ends in a touchdown. Total dominance on display.",
    "A laser-accurate pass finds the target for the score."
  ],
  'FG': [
    "The kick is up and it's good. Three points added to the tally.",
    "The kicker splits the uprights to secure points after a solid drive.",
    "Field goal converted. The offense salvages points from the possession.",
    "Perfect strike from the hold. Three more points on the board.",
    "After stalling in the red zone, the field goal is true."
  ],
  'MISSED_FG': [
    "The kick sails wide right. A massive missed opportunity for points.",
    "The field goal clanks off the upright! Heartbreak for the kicking unit.",
    "No good! The attempt falls short as the wind plays a factor.",
    "Wide left. The kicker fails to connect from distance.",
    "A promising drive ends in frustration as the field goal misses."
  ],
  'PUNT': [
    "The drive stalls at midfield, forcing the punting unit onto the field.",
    "Three and out. The defense completely suffocated that possession.",
    "A booming punt pins the opponent deep in their own territory.",
    "Stymied by the defense, the offense is forced to kick it away.",
    "No way through. The ball is punted back to the opposition."
  ],
  'TURNOVER_INT': [
    "Intercepted! An ill-advised pass is picked off in the secondary.",
    "A poor read results in a momentum-shifting interception.",
    "Picked off! The defense jumps the route to steal the ball.",
    "The pass is tipped and hauled in by the defense. Costly turnover.",
    "The quarterback forces it into coverage and pays the price."
  ],
  'TURNOVER_FUMBLE': [
    "Fumble! The ball is loose and the defense pounces on it.",
    "Devastating fumble! Possession is surrendered on a heavy hit.",
    "Ball security issues prove costly as the defense recovers the fumble.",
    "The defense rips it away! A crucial turnover in a key moment.",
    "Disaster strikes as the runner coughs up the football."
  ],
  'DOWNS': [
    "The fourth-down gamble fails. The defense holds the line.",
    "Stopped short! The defense comes up huge on fourth down.",
    "A gutsy call on fourth down backfires. Turnover on downs.",
    "The defense shuts the door, forcing a change of possession.",
    "Inches short! The marker remains out of reach."
  ],
  'SAFETY': [
    "Safety! The quarterback is swarmed in the end zone for two points.",
    "Disaster in the backfield: the runner is tackled for a safety.",
    "A catastrophic error results in a safety and a change of possession.",
    "Nowhere to run! The defense scores two on a dominant safety.",
    "Pinned deep, the offense surrenders a safety under heavy pressure."
  ],
  'END_HALF': [
    "The clock strikes zero. Both teams head to the locker rooms.",
    "Time expires on the half. A tactical battle so far.",
    "End of the second quarter. The drive concludes with the buzzer.",
    "No time remaining. The half comes to an end.",
    "Clock management exhausts the final seconds of the period."
  ],
  'END_GAME': [
    "The final whistle blows. That'll do it from this one.",
    "Zeroes on the clock. Victory is secured as time expires.",
    "The game concludes with this final possession.",
    "Hostilities end as the game clock reaches its limit.",
    "Game over. The final drive ends with the conclusion of the match."
  ]
};

export function generateDriveNarrative(drive: Drive, rng: SeededRandom): { description: string, highlight: string } {
  const timeStr = formatTime(drive.timeConsumed);
  const description = `Drive of ${drive.plays} plays, ${drive.totalYards} yards in ${timeStr}.`;
  
  const templates = HIGHLIGHT_TEMPLATES[drive.outcome];
  const highlight = rng.pick(templates);

  return { description, highlight };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
