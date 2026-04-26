import { Team, Conference, Division } from '../engine/team';
import teamsData from './teams.json';

/**
 * Loads the 32 teams from the JSON file and performs integrity validations.
 * Throws an error if any validation fails.
 */
export function loadTeams(testData?: Team[]): Team[] {
  const teams = testData || (teamsData as Team[]);

  // 1. Exactly 32 teams
  if (teams.length !== 32) {
    throw new Error(`Invalid league size: expected 32 teams, found ${teams.length}`);
  }

  const conferenceCounts: Record<Conference, number> = {
    'Eastern': 0,
    'Western': 0
  };

  const divisionCounts: Record<string, number> = {};
  const ids = new Set<string>();
  const abbreviations = new Set<string>();

  for (const team of teams) {
    // 2. Uniqueness of IDs
    if (ids.has(team.id)) {
      throw new Error(`Duplicate team ID found: ${team.id}`);
    }
    ids.add(team.id);

    // 3. Uniqueness and format of Abbreviations
    if (abbreviations.has(team.abbreviation)) {
      throw new Error(`Duplicate abbreviation found: ${team.abbreviation}`);
    }
    if (team.abbreviation.length !== 3) {
      throw new Error(`Invalid abbreviation format for ${team.id}: must be exactly 3 letters`);
    }
    abbreviations.add(team.abbreviation);

    // Count by conference
    conferenceCounts[team.conference]++;

    // Count by division
    const divKey = `${team.conference}-${team.division}`;
    divisionCounts[divKey] = (divisionCounts[divKey] || 0) + 1;
  }

  // 4. Distribution by Conference (16 each)
  if (conferenceCounts.Eastern !== 16 || conferenceCounts.Western !== 16) {
    throw new Error(`Invalid conference distribution: Eastern=${conferenceCounts.Eastern}, Western=${conferenceCounts.Western}`);
  }

  // 5. Distribution by Division (4 each)
  const expectedDivisions = [
    'Eastern-East', 'Eastern-Atlantic', 'Eastern-North', 'Eastern-South',
    'Western-Central', 'Western-Mountain', 'Western-Pacific', 'Western-Southwest'
  ];

  for (const divKey of expectedDivisions) {
    if (divisionCounts[divKey] !== 4) {
      throw new Error(`Invalid division distribution for ${divKey}: expected 4 teams, found ${divisionCounts[divKey] || 0}`);
    }
  }

  // 6. Valid Rival IDs
  for (const team of teams) {
    for (const rivalId of team.historicalRivalIds) {
      if (!ids.has(rivalId)) {
        throw new Error(`Invalid rival ID '${rivalId}' for team ${team.id}: rival does not exist`);
      }
    }
  }

  return teams;
}
