export type Conference = 'Eastern' | 'Western';

export type Division = 
  | 'East' | 'Atlantic' | 'North' | 'South'  // Eastern
  | 'Central' | 'Mountain' | 'Pacific' | 'Southwest';  // Western

export interface Team {
  // Identidad
  id: string;              // ej: "BOS_MIN" (formato: ciudadAbrev_nombreAbrev)
  abbreviation: string;    // 3 letras, ej: "BOS"
  city: string;
  name: string;            // ej: "Minutemen"
  fullName: string;        // ej: "Boston Minutemen"
  
  // Liga
  conference: Conference;
  division: Division;
  
  // Identidad visual
  primaryColor: string;    // hex, ej: "#002244"
  secondaryColor: string;  // hex
  tertiaryColor?: string;  // hex, opcional
  
  // Estadio
  stadium: string;         // ej: "Harbor Field"
  
  // Lore
  logoDescription: string;
  identity: string;
  lore: string;
  
  // Rivalidades históricas
  historicalRivalIds: string[];
}
