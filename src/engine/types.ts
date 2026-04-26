export type Position = 'QB' | 'RB' | 'WR';

export type QBArchetype = 'Pocket Passer' | 'Gunslinger' | 'Mobile QB' | 'Game Manager';
export type RBArchetype = 'Power Back' | 'Speed Back' | 'Receiving Back' | 'Elusive Back';
export type WRArchetype = 'Deep Threat' | 'Possession' | 'Red Zone' | 'YAC Specialist';

export type Archetype = QBArchetype | RBArchetype | WRArchetype;

export interface GameClock {
  minutes: number;
  seconds: number;
}

export interface Injury {
  id: string;
  type: string;
  severity: 'Minor' | 'Moderate' | 'Major';
  weeksRemaining: number;
}

export interface Contract {
  years: number;
  totalValue: number;
  guaranteed: number;
  signingBonus: number;
}

export interface SeasonStats {
  year: number;
  teamId: string;
  // Stats will be expanded in future tasks
  gamesPlayed: number;
}
