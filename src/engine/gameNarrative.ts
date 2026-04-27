import { Game } from './game';
import { Drive } from './drive';

export function generateGameNarrative(game: Game): {
  summary: string;
  highlightPlay: string;
} {
  const summary = generateSummary(game);
  const highlightPlay = generateHighlight(game);

  return { summary, highlightPlay };
}

function generateSummary(game: Game): string {
  const diff = Math.abs(game.homeScore - game.awayScore);
  const isTie = game.homeScore === game.awayScore;
  const winnerId = game.winnerTeamId;
  const homeName = "HOME"; // In a real app, we'd get the name from a team registry, but here we just use the IDs or generic placeholders if names aren't in Game object
  // Actually, the Game object has homeTeamId and awayTeamId.
  // I'll use the IDs as names for now, or just focus on the score format.
  
  let scoreLine = "";
  if (isTie) {
    scoreLine = `${game.homeTeamId} ${game.homeScore}, ${game.awayTeamId} ${game.awayScore}. `;
  } else {
    if (game.winnerTeamId === game.homeTeamId) {
      scoreLine = `${game.homeTeamId} ${game.homeScore}, ${game.awayTeamId} ${game.awayScore}. `;
    } else {
      scoreLine = `${game.awayTeamId} ${game.awayScore}, ${game.homeTeamId} ${game.homeScore}. `;
    }
  }

  const templates = {
    blowout: [
      "A complete mismatch from the opening kickoff.",
      "Total domination as one side never stood a chance.",
      "The game was over by halftime in this lopsided affair.",
      "A masterclass in all phases of the game led to a massive victory.",
      "One team asserted its will early and never looked back."
    ],
    comfortable: [
      "A solid performance that kept the opponent at arm's length.",
      "Commanding control of the tempo throughout the afternoon.",
      "A comfortable win secured by efficient execution in key moments.",
      "Steady pressure and consistent scoring paved the way for a decisive result.",
      "The outcome was rarely in doubt after a strong second half."
    ],
    close: [
      "A back-and-forth battle decided in the final minutes.",
      "Gritty performance in a game that could have gone either way.",
      "A defensive struggle where every yard was hard-earned.",
      "High-stakes drama that came down to the wire.",
      "Both teams traded blows in a physical and closely contested matchup."
    ],
    tie: [
      "Neither side could find the breakthrough in a hard-fought draw.",
      "The clock expires with both teams locked in a stalemate.",
      "Both defenses held firm to ensure the spoils were shared.",
      "A rare deadlock after four quarters of intense competition.",
      "Both squads settled for a draw after a defensive struggle."
    ]
  };

  let category: 'blowout' | 'comfortable' | 'close' | 'tie';
  if (isTie) category = 'tie';
  else if (diff >= 14) category = 'blowout';
  else if (diff >= 8) category = 'comfortable';
  else category = 'close';

  // Use a simple pseudo-random based on game ID for determinism if we don't pass RNG
  // But wait, generateGameNarrative doesn't take RNG.
  // The requirement says "same seed -> same narrative". 
  // I should probably pass the RNG or use game.id to derive a seed.
  // Since I can't change the signature if it was strictly defined, but the prompt says:
  // "Crear /src/engine/gameNarrative.ts con la función: export function generateGameNarrative(game: Game)"
  // I will use game.id to create a deterministic selection.
  
  const getDeterministicTemplate = (arr: string[]) => {
    let hash = 0;
    for (let i = 0; i < game.id.length; i++) {
      hash = (hash << 5) - hash + game.id.charCodeAt(i);
      hash |= 0;
    }
    return arr[Math.abs(hash) % arr.length];
  };

  let summaryText = scoreLine + getDeterministicTemplate(templates[category]);

  // User Player Performance
  if (game.userPlayerStats && game.userPlayer) {
    const p = game.userPlayer;
    const stats = game.userPlayerStats;
    let perfSentence = "";

    if (p.position === 'QB') {
      const qb = stats as any; // Cast to access QB specific stats
      if (qb.passYards > 300 || qb.passTDs >= 3) {
        perfSentence = ` ${p.firstName} ${p.lastName} threw for ${qb.passYards} yards and ${qb.passTDs} TDs in a standout performance.`;
      } else if (qb.passYards >= 150 && (qb.passTDs >= 1 && qb.passTDs <= 2)) {
        perfSentence = ` ${p.firstName} ${p.lastName} managed the offense efficiently.`;
      } else if (qb.passTDs === 0 && qb.interceptions >= 2) {
        perfSentence = ` ${p.firstName} ${p.lastName} struggled with ${qb.interceptions} interceptions.`;
      }
    } else if (p.position === 'RB') {
      const rb = stats as any;
      if (rb.rushYards > 100 || rb.rushTDs >= 2) {
        perfSentence = ` ${p.firstName} ${p.lastName} punished the defense with ${rb.rushYards} yards on the ground.`;
      } else if (rb.rushYards >= 50 && rb.rushYards <= 100) {
        perfSentence = ` ${p.firstName} ${p.lastName} grinded out tough yards.`;
      }
    } else if (p.position === 'WR') {
      const wr = stats as any;
      if (wr.receivingYards > 100 || wr.receivingTDs >= 2) {
        perfSentence = ` ${p.firstName} ${p.lastName} was unstoppable with ${wr.receptions} catches for ${wr.receivingYards} yards.`;
      } else if (wr.receptions >= 5) {
        perfSentence = ` ${p.firstName} ${p.lastName} was a reliable target.`;
      }
    }

    summaryText += perfSentence;
  }

  return summaryText;
}

function generateHighlight(game: Game): string {
  if (game.drives.length === 0) return "No significant plays recorded.";

  // Priority: TD > FG > Turnover
  // Within TD: Max yardage, then last quarter
  
  let pool = [...game.drives];

  // Fix Pulido-B: Prefer drives from the winning team
  if (game.winnerTeamId) {
    const winnerDrives = pool.filter(d => d.teamOnOffenseId === game.winnerTeamId);
    const hasImpact = winnerDrives.some(d => 
      ['TD', 'FG', 'TURNOVER_INT', 'TURNOVER_FUMBLE'].includes(d.outcome)
    );
    if (hasImpact) {
      pool = winnerDrives;
    }
  }

  const scoreDrives = pool.filter(d => d.outcome === 'TD');
  let highlightDrive: Drive | null = null;

  if (scoreDrives.length > 0) {
    // Sort by yards (desc), then by quarter (desc)
    scoreDrives.sort((a, b) => {
      if (b.totalYards !== a.totalYards) return b.totalYards - a.totalYards;
      return b.quarter - a.quarter;
    });
    highlightDrive = scoreDrives[0];
  } else {
    const fgDrives = pool.filter(d => d.outcome === 'FG');
    if (fgDrives.length > 0) {
      fgDrives.sort((a, b) => b.quarter - a.quarter);
      highlightDrive = fgDrives[0];
    } else {
      const turnovers = pool.filter(d => ['TURNOVER_INT', 'TURNOVER_FUMBLE'].includes(d.outcome));
      if (turnovers.length > 0) {
        turnovers.sort((a, b) => b.quarter - a.quarter);
        highlightDrive = turnovers[0];
      }
    }
  }

  if (!highlightDrive) {
    highlightDrive = pool[0]; // Fallback
  }

  const qStr = highlightDrive.quarter === 'OT' ? "overtime" : `quarter ${highlightDrive.quarter}`;
  const team = highlightDrive.teamOnOffenseId;
  const yards = highlightDrive.totalYards;

  const templates = {
    'TD': [
      `The decisive moment came on ${team}'s ${yards}-yard touchdown drive in ${qStr}.`,
      `${team} ignited the crowd with a major touchdown drive during the ${qStr}.`,
      `A clinical touchdown march by ${team} in ${qStr} shifted the momentum.`,
      `The highlights were headlined by ${team}'s touchdown scoring drive in ${qStr}.`,
      `${team} broke the game open with a massive touchdown in ${qStr}.`
    ],
    'FG': [
      `${team}'s critical field goal in ${qStr} proved to be a turning point.`,
      `A clutch kick by ${team} in ${qStr} provided a much-needed boost.`,
      `The scoreboard was kept moving by ${team}'s field goal in ${qStr}.`,
      `Precision kicking from ${team} in ${qStr} was a key highlight.`,
      `${team} managed to salvage points with a field goal in ${qStr}.`
    ],
    'TURNOVER': [
      `${team}'s costly turnover in ${qStr} turned the momentum permanently.`,
      `A game-changing takeaway in ${qStr} gave the defense something to cheer about.`,
      `The ball was cough up by ${team} in ${qStr}, leading to a crucial swing.`,
      `Defensive heroics forced a turnover from ${team} during ${qStr}.`,
      `Momentum shifted when ${team} surrendered the ball in ${qStr}.`
    ],
    'DEFAULT': [
      `A key series of plays by ${team} in ${qStr} stood out in this contest.`,
      `${team} controlled the pace during a significant drive in ${qStr}.`,
      `Tactical execution by ${team} in ${qStr} was a highlight of the game.`,
      `The intensity peaked during ${team}'s possession in ${qStr}.`,
      `Fans will remember ${team}'s determined effort in ${qStr}.`
    ]
  };

  let type: keyof typeof templates = 'DEFAULT';
  if (highlightDrive.outcome === 'TD') type = 'TD';
  else if (highlightDrive.outcome === 'FG') type = 'FG';
  else if (['TURNOVER_INT', 'TURNOVER_FUMBLE'].includes(highlightDrive.outcome)) type = 'TURNOVER';

  const getDeterministicTemplate = (arr: string[]) => {
    let hash = 0;
    const str = game.id + highlightDrive!.teamOnOffenseId + highlightDrive!.quarter;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return arr[Math.abs(hash) % arr.length];
  };

  return getDeterministicTemplate(templates[type]);
}
