export type CollegeTier = 'POWERHOUSE' | 'STRONG' | 'MID' | 'SMALL';

export interface College {
  id: string;
  name: string;
  city: string;
  tier: CollegeTier;
  identity: string;
}

export const COLLEGES: College[] = [
  // POWERHOUSE (5)
  { id: 'TUSC', name: 'Tuscaloosa State', city: 'Tuscaloosa, AL', tier: 'POWERHOUSE', identity: 'Discipline, dynasty, dominant' },
  { id: 'BUCK', name: 'Buckeye University', city: 'Columbus, OH', tier: 'POWERHOUSE', identity: 'Tradition, size, physical' },
  { id: 'ATHN', name: 'Athens College', city: 'Athens, GA', tier: 'POWERHOUSE', identity: 'Brutal defense, top recruiting' },
  { id: 'LONE', name: 'Lone Star University', city: 'Austin, TX', tier: 'POWERHOUSE', identity: 'Resources, glamour, expectations' },
  { id: 'BAYO', name: 'Bayou State', city: 'Baton Rouge, LA', tier: 'POWERHOUSE', identity: 'Speed, night atmosphere' },

  // STRONG PROGRAM (10)
  { id: 'DOMR', name: 'South Bend University', city: 'South Bend, IN', tier: 'STRONG', identity: 'Historic, tradition' },
  { id: 'BLUE', name: 'Ann Arbor State', city: 'Ann Arbor, MI', tier: 'STRONG', identity: 'Balanced, elite coaching' },
  { id: 'CARD', name: 'Palo Alto Tech', city: 'Palo Alto, CA', tier: 'STRONG', identity: 'Intelligence, technical' },
  { id: 'SOON', name: 'Norman University', city: 'Norman, OK', tier: 'STRONG', identity: 'High-octane offense' },
  { id: 'WOLF', name: 'Pacific Northwest U', city: 'Seattle, WA', tier: 'STRONG', identity: 'Aggressive, loud crowd' },
  { id: 'HRRC', name: 'Coral State', city: 'Coral Gables, FL', tier: 'STRONG', identity: 'Swagger, speed' },
  { id: 'GATR', name: 'Gainesville State', city: 'Gainesville, FL', tier: 'STRONG', identity: 'Physical, hot weather' },
  { id: 'CLEM', name: 'Upstate Carolina', city: 'Clemson, SC', tier: 'STRONG', identity: 'Elite defense, orange valley' },
  { id: 'HRRN', name: 'Lincoln State', city: 'Lincoln, NE', tier: 'STRONG', identity: 'Run-heavy, massive fan base' },
  { id: 'WOLV', name: 'Madison University', city: 'Madison, WI', tier: 'STRONG', identity: 'Power running, cold weather' },

  // MID-TIER (10)
  { id: 'MTNW', name: 'Mountain West College', city: 'Provo, UT', tier: 'MID', identity: 'Disciplined, tactical' },
  { id: 'ROCK', name: 'Rocky Mountain State', city: 'Boulder, CO', tier: 'MID', identity: 'Altitude, resilient' },
  { id: 'BTAR', name: 'Twin Cities University', city: 'Minneapolis, MN', tier: 'MID', identity: 'Gritty, physical' },
  { id: 'KNTU', name: 'Bluegrass State', city: 'Lexington, KY', tier: 'MID', identity: 'Versatile, defensive focus' },
  { id: 'DESM', name: 'Tempe University', city: 'Tempe, AZ', tier: 'MID', identity: 'Fast-paced, desert heat' },
  { id: 'HURL', name: 'Tobacco Road University', city: 'Chapel Hill, NC', tier: 'MID', identity: 'Athletic, playmaker focus' },
  { id: 'MIZZ', name: 'Show-Me State', city: 'Columbia, MO', tier: 'MID', identity: 'Underdogs, chip on shoulder' },
  { id: 'BOIL', name: 'Boilermaker U', city: 'West Lafayette, IN', tier: 'MID', identity: 'Pass-happy, innovative' },
  { id: 'RAZR', name: 'Ozark State', city: 'Fayetteville, AR', tier: 'MID', identity: 'Tough, ground game' },
  { id: 'CYCL', name: 'Heartland State', city: 'Ames, IA', tier: 'MID', identity: 'Hard-working, defensive' },

  // SMALL SCHOOL (5)
  { id: 'FRGO', name: 'North Plains State', city: 'Fargo, ND', tier: 'SMALL', identity: 'Cold, disciplined, winner mentality' },
  { id: 'EWSH', name: 'Cheney College', city: 'Cheney, WA', tier: 'SMALL', identity: 'Creative, underdog energy' },
  { id: 'CHAT', name: 'Chattanooga U', city: 'Chattanooga, TN', tier: 'SMALL', identity: 'Small but fierce' },
  { id: 'RICH', name: 'Capital City U', city: 'Richmond, VA', tier: 'SMALL', identity: 'Technical, well-coached' },
  { id: 'GROV', name: 'Grove State', city: 'Conway, AR', tier: 'SMALL', identity: 'Family atmosphere, gritty' }
];

export const COLLEGES_BY_TIER: Record<CollegeTier, string[]> = {
  POWERHOUSE: COLLEGES.filter(c => c.tier === 'POWERHOUSE').map(c => c.id),
  STRONG: COLLEGES.filter(c => c.tier === 'STRONG').map(c => c.id),
  MID: COLLEGES.filter(c => c.tier === 'MID').map(c => c.id),
  SMALL: COLLEGES.filter(c => c.tier === 'SMALL').map(c => c.id)
};
