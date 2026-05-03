export type Position = 'QB' | 'RB' | 'WR';

export type QBArchetype = 'Pocket Passer' | 'Gunslinger' | 'Mobile QB' | 'Game Manager';
export type RBArchetype = 'Power Back' | 'Speed Back' | 'Receiving Back' | 'Elusive Back';
export type WRArchetype = 'Deep Threat' | 'Possession' | 'Red Zone' | 'YAC Specialist';

export type Archetype = QBArchetype | RBArchetype | WRArchetype;

export interface GameClock {
  minutes: number;
  seconds: number;
}

export type InjurySeverity = 'minor' | 'moderate' | 'major' | 'season_ending';

export type InjuryType = 
  | 'hamstring' | 'knee' | 'shoulder' | 'concussion' 
  | 'ankle' | 'back' | 'wrist' | 'rib' | 'foot' | 'groin';

export interface Injury {
  id: string;                    // unique within career
  type: InjuryType;
  severity: InjurySeverity;
  weeksOut: number;              // total weeks DNP when diagnosed
  weeksRemaining: number;        // weeks left (decrements per week/game)
  yearOccurred: number;
  weekOccurred: number;          // 1-17 regular or 18+ playoffs
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
