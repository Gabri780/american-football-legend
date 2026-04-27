import { Drive, DriveOutcome } from './drive';
import { SeededRandom } from './prng';

const HIGHLIGHT_TEMPLATES: Record<DriveOutcome, string[]> = {
  'TD': [
    "Touchdown. A clean execution capped with points in the end zone.",
    "Touchdown! An electric play that left the defense without answers.",
    "The offense breaks the final line of resistance for a crucial touchdown.",
    "Touchdown after a series of flawless plays. Total dominance.",
    "A precise pass into the heart of the defense for the score."
  ],
  'FG': [
    "The kick is good. The drive results in three valuable points.",
    "The kicker makes no mistake, securing points after a solid series.",
    "Field goal converted. The offense salvages points from the possession.",
    "Perfect split of the uprights. Three more points on the board.",
    "After stalling in the red zone, the field goal goes through without issues."
  ],
  'MISSED_FG': [
    "The kick sails wide. A missed opportunity to put points on the board.",
    "The field goal hits the upright and bounces out. Tough luck for the team.",
    "Failed attempt. Wind or poor aim denies the three points.",
    "No points. The kicker fails to connect between the uprights.",
    "A wasted opportunity after a long drive ends in nothing."
  ],
  'PUNT': [
    "The offense stalls and is forced to punt.",
    "Three and out. The defense completely dominated this series.",
    "A long punt pins the opponent deep in their own territory.",
    "No options to advance. Punting is the only way out.",
    "Drive stalled at midfield. Ball goes over to the opponent."
  ],
  'TURNOVER_INT': [
    "Intercepted! The QB takes too much risk and gives away possession.",
    "A poor read that ends up in the hands of the opposing safety.",
    "Picked off. The defense reads the play and steals the ball.",
    "Deflected pass ends up being intercepted by the linebacker.",
    "Costly mistake by the quarterback as he surrenders the ball through the air."
  ],
  'TURNOVER_FUMBLE': [
    "Fumble! The runner loses the ball and the defense recovers.",
    "Loose ball on impact. Possession goes to the opposing team.",
    "Ball-handling error results in a loss of possession.",
    "The defense forces the fumble and jumps on it successfully.",
    "Traumatic turnover in the middle of a promising drive."
  ],
  'DOWNS': [
    "Failed fourth-down attempt. The defense holds firm.",
    "They fail to reach the marker. Turnover on downs.",
    "Risky gamble on 4th down that doesn't pay off.",
    "The defense shuts down all lanes and takes the ball back.",
    "Stopped inches short. Change of possession."
  ],
  'SAFETY': [
    "Safety! The QB is tackled in his own end zone.",
    "Disaster on the line: the runner is stopped for a safety.",
    "Fatal error that gives away two points and the ball to the rival.",
    "Trapped in the end zone. The defensive pressure claims its prize.",
    "Penalty or tackle in the end zone. Two points for the opponent."
  ],
  'END_HALF': [
    "Time runs out. The drive ends with the conclusion of the half.",
    "The clock hits zero before they can attempt to score.",
    "End of the second quarter. Players head to the locker rooms.",
    "No more time. The possession dies with the buzzer.",
    "Clock management ends up exhausting the period's time."
  ],
  'END_GAME': [
    "Final whistle. The drive concludes with the end of the game.",
    "No time left on the clock. Victory secured.",
    "The match ends during this possession.",
    "End of hostilities. The clock dictates the verdict.",
    "Game time expires. The match is over."
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
