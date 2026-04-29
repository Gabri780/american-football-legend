// src/data/properties.ts
// Catálogo de propiedades del sistema de patrimonio.
// 32 equipos × ~6 propiedades regionales (~192 items) + 35 propiedades vacation/destino globales.
// Precios en millones de dólares (M). annualMaintenance en miles ($K) — incluye property tax + utilities + staff básico.
// Todas las propiedades son ficticias pero los neighborhoods/ciudades son reales.

export type PropertyType =
    | 'apartment'
    | 'starter_house'
    | 'luxury_house'
    | 'mansion'
    | 'iconic_mansion'
    | 'beach_house'
    | 'penthouse';

export interface Property {
    id: string;
    name: string;
    type: PropertyType;
    city: string;
    state: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    price: number;             // en millones
    annualMaintenance: number; // en miles
    features: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPIEDADES POR EQUIPO (regionales)
// Cada entry contiene ~6 propiedades en las áreas reales donde viven los
// jugadores NFL del mercado de ese equipo.
// ═══════════════════════════════════════════════════════════════════════════

export const PROPERTIES_BY_TEAM: Record<string, Property[]> = {
    // ───────────────────────────────────────────────────────────────────────
    // EASTERN CONFERENCE
    // ───────────────────────────────────────────────────────────────────────

    // BOSTON MINUTEMEN — área Boston/Newton/Wellesley/Brookline
    'BOS_MIN': [
        { id: 'BOS_MIN_001', name: 'Back Bay Brownstone Condo', type: 'apartment', city: 'Boston', state: 'MA', bedrooms: 2, bathrooms: 2, squareFeet: 1400, price: 1.85, annualMaintenance: 32, features: ['historic building', 'fireplace', 'garage parking'] },
        { id: 'BOS_MIN_002', name: 'Newton Suburban Home', type: 'starter_house', city: 'Newton', state: 'MA', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 2.2, annualMaintenance: 38, features: ['smart home', 'finished basement', 'large yard'] },
        { id: 'BOS_MIN_003', name: 'Wellesley Estate', type: 'starter_house', city: 'Wellesley', state: 'MA', bedrooms: 5, bathrooms: 4, squareFeet: 5000, price: 4.5, annualMaintenance: 65, features: ['gated community', 'tennis court', 'guest house'] },
        { id: 'BOS_MIN_004', name: 'Brookline Colonial', type: 'luxury_house', city: 'Brookline', state: 'MA', bedrooms: 6, bathrooms: 6, squareFeet: 6800, price: 7.8, annualMaintenance: 110, features: ['historic district', 'library', 'wine cellar'] },
        { id: 'BOS_MIN_005', name: 'Weston Country Estate', type: 'luxury_house', city: 'Weston', state: 'MA', bedrooms: 6, bathrooms: 7, squareFeet: 7800, price: 9.5, annualMaintenance: 135, features: ['private acreage', 'pool', 'tennis court', 'horse stable'] },
        { id: 'BOS_MIN_006', name: 'Manchester-by-the-Sea Mansion', type: 'mansion', city: 'Manchester-by-the-Sea', state: 'MA', bedrooms: 8, bathrooms: 9, squareFeet: 11000, price: 15.5, annualMaintenance: 220, features: ['oceanfront', 'private beach', 'guest house', 'boat dock'] },
    ],

    // NEW YORK SENTINELS — área NYC/Westchester/Greenwich
    'NYS_SEN': [
        { id: 'NYS_SEN_001', name: 'Midtown East 1BR', type: 'apartment', city: 'New York', state: 'NY', bedrooms: 1, bathrooms: 1, squareFeet: 720, price: 1.2, annualMaintenance: 28, features: ['doorman', 'subway access'] },
        { id: 'NYS_SEN_002', name: 'SoHo Loft', type: 'apartment', city: 'New York', state: 'NY', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 3.2, annualMaintenance: 50, features: ['cast iron columns', 'oversized windows', 'doorman'] },
        { id: 'NYS_SEN_003', name: 'White Plains Tudor', type: 'starter_house', city: 'White Plains', state: 'NY', bedrooms: 5, bathrooms: 4, squareFeet: 4200, price: 2.6, annualMaintenance: 48, features: ['stone exterior', 'library', 'guest suite'] },
        { id: 'NYS_SEN_004', name: 'Greenwich Estate', type: 'luxury_house', city: 'Greenwich', state: 'CT', bedrooms: 7, bathrooms: 8, squareFeet: 9000, price: 12.5, annualMaintenance: 175, features: ['gated', 'pool', 'tennis court', 'guest cottage'] },
        { id: 'NYS_SEN_005', name: 'Old Westbury Estate', type: 'mansion', city: 'Old Westbury', state: 'NY', bedrooms: 8, bathrooms: 9, squareFeet: 11000, price: 13.5, annualMaintenance: 195, features: ['gated', 'tennis court', 'pool', 'horse stable'] },
        { id: 'NYS_SEN_006', name: 'Park Avenue Penthouse', type: 'penthouse', city: 'New York', state: 'NY', bedrooms: 4, bathrooms: 5, squareFeet: 5500, price: 28.5, annualMaintenance: 420, features: ['Central Park view', 'private elevator', 'butler service', 'wine cellar'] },
    ],

    // NEW YORK EMPIRE — mismo mercado que Sentinels (ambos juegan en NY area)
    'NYE_EMP': [
        { id: 'NYE_EMP_001', name: 'UWS Pre-War 2BR', type: 'apartment', city: 'New York', state: 'NY', bedrooms: 2, bathrooms: 2, squareFeet: 1300, price: 2.4, annualMaintenance: 40, features: ['pre-war', 'high ceilings', 'doorman'] },
        { id: 'NYE_EMP_002', name: 'TriBeCa Loft', type: 'apartment', city: 'New York', state: 'NY', bedrooms: 3, bathrooms: 2.5, squareFeet: 2200, price: 4.5, annualMaintenance: 70, features: ['cast iron building', 'concierge', 'private terrace'] },
        { id: 'NYE_EMP_003', name: 'Scarsdale Family Home', type: 'starter_house', city: 'Scarsdale', state: 'NY', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 3.4, annualMaintenance: 55, features: ['top schools area', 'large yard', 'finished basement'] },
        { id: 'NYE_EMP_004', name: 'Alpine Estate', type: 'luxury_house', city: 'Alpine', state: 'NJ', bedrooms: 7, bathrooms: 8, squareFeet: 9500, price: 11.8, annualMaintenance: 165, features: ['gated', 'pool', 'tennis court', 'home theater'] },
        { id: 'NYE_EMP_005', name: 'Saddle River Mansion', type: 'mansion', city: 'Saddle River', state: 'NJ', bedrooms: 8, bathrooms: 10, squareFeet: 12500, price: 16.5, annualMaintenance: 240, features: ['gated estate', 'wine cellar', 'pool', 'guest house'] },
        { id: 'NYE_EMP_006', name: '432 Park Penthouse', type: 'penthouse', city: 'New York', state: 'NY', bedrooms: 5, bathrooms: 6, squareFeet: 8200, price: 38.5, annualMaintenance: 580, features: ['Central Park view', 'private elevator', 'wine cellar', 'library'] },
    ],

    // MIAMI TIDES — Miami/Coral Gables/Indian Creek
    'MIA_TID': [
        { id: 'MIA_TID_001', name: 'Brickell High-Rise Studio', type: 'apartment', city: 'Miami', state: 'FL', bedrooms: 1, bathrooms: 1, squareFeet: 850, price: 0.55, annualMaintenance: 18, features: ['city view', 'gym access', 'concierge'] },
        { id: 'MIA_TID_002', name: 'Coral Gables Ranch', type: 'starter_house', city: 'Coral Gables', state: 'FL', bedrooms: 4, bathrooms: 3, squareFeet: 3400, price: 2.0, annualMaintenance: 40, features: ['mediterranean style', 'pool', 'mature trees'] },
        { id: 'MIA_TID_003', name: 'Pinecrest Family Estate', type: 'starter_house', city: 'Pinecrest', state: 'FL', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 3.6, annualMaintenance: 58, features: ['large lot', 'pool', 'tropical landscaping'] },
        { id: 'MIA_TID_004', name: 'Coconut Grove Modern', type: 'luxury_house', city: 'Miami', state: 'FL', bedrooms: 6, bathrooms: 7, squareFeet: 7200, price: 8.5, annualMaintenance: 125, features: ['waterfront', 'boat dock', 'pool', 'guest house'] },
        { id: 'MIA_TID_005', name: 'Indian Creek Estate', type: 'mansion', city: 'Indian Creek', state: 'FL', bedrooms: 7, bathrooms: 9, squareFeet: 11500, price: 22.5, annualMaintenance: 320, features: ['gated island', 'private dock', 'pool', 'staff house'] },
        { id: 'MIA_TID_006', name: 'Star Island Mega-Estate', type: 'iconic_mansion', city: 'Miami Beach', state: 'FL', bedrooms: 11, bathrooms: 15, squareFeet: 22000, price: 42.0, annualMaintenance: 600, features: ['gated island', 'private beach', 'mega yacht dock', 'pool complex'] },
    ],

    // PHILADELPHIA REVOLUTION — Philly/Main Line
    'PHI_REV': [
        { id: 'PHI_REV_001', name: 'Rittenhouse Square Condo', type: 'apartment', city: 'Philadelphia', state: 'PA', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 1.4, annualMaintenance: 28, features: ['park view', 'doorman', 'historic'] },
        { id: 'PHI_REV_002', name: 'Bryn Mawr Suburban Home', type: 'starter_house', city: 'Bryn Mawr', state: 'PA', bedrooms: 5, bathrooms: 4, squareFeet: 4400, price: 2.5, annualMaintenance: 42, features: ['main line', 'private yard', 'finished basement'] },
        { id: 'PHI_REV_003', name: 'Villanova Estate', type: 'starter_house', city: 'Villanova', state: 'PA', bedrooms: 5, bathrooms: 5, squareFeet: 5200, price: 3.6, annualMaintenance: 60, features: ['gated community', 'pool', 'tennis court access'] },
        { id: 'PHI_REV_004', name: 'Gladwyne Country Estate', type: 'luxury_house', city: 'Gladwyne', state: 'PA', bedrooms: 6, bathrooms: 7, squareFeet: 8000, price: 7.5, annualMaintenance: 110, features: ['private acreage', 'pool', 'horse stable', 'wine cellar'] },
        { id: 'PHI_REV_005', name: 'Radnor Hunt Estate', type: 'mansion', city: 'Radnor', state: 'PA', bedrooms: 8, bathrooms: 9, squareFeet: 11500, price: 13.8, annualMaintenance: 200, features: ['historic main line', 'pool', 'guest house', 'orchard'] },
        { id: 'PHI_REV_006', name: 'Chadds Ford Manor', type: 'mansion', city: 'Chadds Ford', state: 'PA', bedrooms: 9, bathrooms: 11, squareFeet: 14500, price: 17.5, annualMaintenance: 260, features: ['stone manor', 'art gallery', 'staff wing', 'pond'] },
    ],

    // WASHINGTON GENERALS — DC/Northern Virginia/Maryland
    'WAS_GEN': [
        { id: 'WAS_GEN_001', name: 'Georgetown Townhouse', type: 'apartment', city: 'Washington', state: 'DC', bedrooms: 3, bathrooms: 2.5, squareFeet: 2200, price: 2.8, annualMaintenance: 48, features: ['historic district', 'rooftop deck', 'private garage'] },
        { id: 'WAS_GEN_002', name: 'McLean Family Home', type: 'starter_house', city: 'McLean', state: 'VA', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 3.2, annualMaintenance: 50, features: ['large lot', 'pool', 'home office'] },
        { id: 'WAS_GEN_003', name: 'Great Falls Estate', type: 'starter_house', city: 'Great Falls', state: 'VA', bedrooms: 6, bathrooms: 5, squareFeet: 5500, price: 4.2, annualMaintenance: 65, features: ['gated', 'pool', 'wine cellar'] },
        { id: 'WAS_GEN_004', name: 'Potomac Estate', type: 'luxury_house', city: 'Potomac', state: 'MD', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 8.8, annualMaintenance: 130, features: ['gated community', 'pool', 'tennis court', 'guest house'] },
        { id: 'WAS_GEN_005', name: 'Middleburg Horse Country Estate', type: 'mansion', city: 'Middleburg', state: 'VA', bedrooms: 8, bathrooms: 10, squareFeet: 13000, price: 14.5, annualMaintenance: 215, features: ['horse country', 'stable', 'pasture', 'guest cottages'] },
        { id: 'WAS_GEN_006', name: 'Kalorama Embassy-Row Mansion', type: 'mansion', city: 'Washington', state: 'DC', bedrooms: 8, bathrooms: 11, squareFeet: 12000, price: 18.5, annualMaintenance: 280, features: ['embassy row', 'historic mansion', 'staff quarters', 'private garden'] },
    ],

    // BUFFALO BLIZZARD — Buffalo/Orchard Park area
    'BUF_BLI': [
        { id: 'BUF_BLI_001', name: 'Downtown Buffalo Loft', type: 'apartment', city: 'Buffalo', state: 'NY', bedrooms: 2, bathrooms: 2, squareFeet: 1600, price: 0.55, annualMaintenance: 14, features: ['historic conversion', 'exposed brick', 'parking'] },
        { id: 'BUF_BLI_002', name: 'Orchard Park Family Home', type: 'starter_house', city: 'Orchard Park', state: 'NY', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 0.95, annualMaintenance: 22, features: ['near stadium', 'large yard', 'finished basement'] },
        { id: 'BUF_BLI_003', name: 'East Aurora Estate', type: 'starter_house', city: 'East Aurora', state: 'NY', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 1.6, annualMaintenance: 32, features: ['country setting', 'pool', 'large acreage'] },
        { id: 'BUF_BLI_004', name: 'Williamsville Manor', type: 'starter_house', city: 'Williamsville', state: 'NY', bedrooms: 5, bathrooms: 4, squareFeet: 4800, price: 2.2, annualMaintenance: 40, features: ['gated', 'pool', 'home theater'] },
        { id: 'BUF_BLI_005', name: 'Lewiston Riverfront Estate', type: 'luxury_house', city: 'Lewiston', state: 'NY', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 3.8, annualMaintenance: 60, features: ['Niagara River view', 'private dock', 'pool'] },
        { id: 'BUF_BLI_006', name: 'Clarence Country Mansion', type: 'mansion', city: 'Clarence', state: 'NY', bedrooms: 8, bathrooms: 9, squareFeet: 11000, price: 6.5, annualMaintenance: 95, features: ['private acreage', 'pool', 'guest house', 'tennis court'] },
    ],

    // INDIANAPOLIS COLTS — Indianapolis/Carmel
    'IND_COL': [
        { id: 'IND_COL_001', name: 'Downtown Indianapolis Condo', type: 'apartment', city: 'Indianapolis', state: 'IN', bedrooms: 2, bathrooms: 2, squareFeet: 1400, price: 0.55, annualMaintenance: 16, features: ['city view', 'concierge', 'gym'] },
        { id: 'IND_COL_002', name: 'Carmel Family Home', type: 'starter_house', city: 'Carmel', state: 'IN', bedrooms: 5, bathrooms: 4, squareFeet: 4200, price: 1.1, annualMaintenance: 22, features: ['top schools', 'large yard', 'pool'] },
        { id: 'IND_COL_003', name: 'Zionsville Estate', type: 'starter_house', city: 'Zionsville', state: 'IN', bedrooms: 5, bathrooms: 5, squareFeet: 5000, price: 1.8, annualMaintenance: 32, features: ['rural setting', 'pool', 'horse paddock'] },
        { id: 'IND_COL_004', name: 'Meridian-Kessler Historic', type: 'starter_house', city: 'Indianapolis', state: 'IN', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 1.5, annualMaintenance: 28, features: ['historic neighborhood', 'wraparound porch', 'mature trees'] },
        { id: 'IND_COL_005', name: 'Carmel Bridgewater Estate', type: 'luxury_house', city: 'Carmel', state: 'IN', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 3.5, annualMaintenance: 55, features: ['gated golf course', 'pool', 'wine cellar'] },
        { id: 'IND_COL_006', name: 'Geist Reservoir Mansion', type: 'mansion', city: 'Fishers', state: 'IN', bedrooms: 8, bathrooms: 10, squareFeet: 11500, price: 6.5, annualMaintenance: 95, features: ['waterfront', 'private dock', 'pool', 'guest house'] },
    ],

    // PITTSBURGH FORGEMEN — Pittsburgh/Sewickley
    'PIT_FOR': [
        { id: 'PIT_FOR_001', name: 'Downtown Pittsburgh Condo', type: 'apartment', city: 'Pittsburgh', state: 'PA', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.7, annualMaintenance: 18, features: ['river view', 'doorman', 'gym'] },
        { id: 'PIT_FOR_002', name: 'Squirrel Hill Family Home', type: 'starter_house', city: 'Pittsburgh', state: 'PA', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 1.4, annualMaintenance: 26, features: ['historic neighborhood', 'large yard'] },
        { id: 'PIT_FOR_003', name: 'Sewickley Heights Estate', type: 'starter_house', city: 'Sewickley', state: 'PA', bedrooms: 5, bathrooms: 5, squareFeet: 5500, price: 2.2, annualMaintenance: 38, features: ['historic estate', 'pool', 'guest house'] },
        { id: 'PIT_FOR_004', name: 'Fox Chapel Manor', type: 'luxury_house', city: 'Fox Chapel', state: 'PA', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 4.2, annualMaintenance: 65, features: ['gated', 'pool', 'tennis court'] },
        { id: 'PIT_FOR_005', name: 'Mt. Lebanon Estate', type: 'luxury_house', city: 'Pittsburgh', state: 'PA', bedrooms: 6, bathrooms: 6, squareFeet: 6800, price: 3.5, annualMaintenance: 55, features: ['large lot', 'pool', 'home theater'] },
        { id: 'PIT_FOR_006', name: 'Sewickley River Estate', type: 'mansion', city: 'Sewickley', state: 'PA', bedrooms: 8, bathrooms: 10, squareFeet: 11000, price: 7.5, annualMaintenance: 110, features: ['Ohio River frontage', 'private dock', 'pool', 'guest house'] },
    ],

    // CLEVELAND IRONHAWKS — Cleveland/Hunting Valley
    'CLE_IRO': [
        { id: 'CLE_IRO_001', name: 'Downtown Cleveland Loft', type: 'apartment', city: 'Cleveland', state: 'OH', bedrooms: 2, bathrooms: 2, squareFeet: 1400, price: 0.45, annualMaintenance: 14, features: ['lakefront view', 'historic conversion'] },
        { id: 'CLE_IRO_002', name: 'Westlake Family Home', type: 'starter_house', city: 'Westlake', state: 'OH', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 0.85, annualMaintenance: 20, features: ['family neighborhood', 'pool', 'finished basement'] },
        { id: 'CLE_IRO_003', name: 'Shaker Heights Tudor', type: 'starter_house', city: 'Shaker Heights', state: 'OH', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 1.6, annualMaintenance: 30, features: ['historic district', 'wraparound porch'] },
        { id: 'CLE_IRO_004', name: 'Pepper Pike Estate', type: 'luxury_house', city: 'Pepper Pike', state: 'OH', bedrooms: 6, bathrooms: 6, squareFeet: 6500, price: 2.8, annualMaintenance: 45, features: ['gated', 'pool', 'wine cellar'] },
        { id: 'CLE_IRO_005', name: 'Hunting Valley Manor', type: 'luxury_house', city: 'Hunting Valley', state: 'OH', bedrooms: 7, bathrooms: 8, squareFeet: 9000, price: 5.5, annualMaintenance: 80, features: ['horse country', 'stable', 'pool', 'guest house'] },
        { id: 'CLE_IRO_006', name: 'Gates Mills Estate', type: 'mansion', city: 'Gates Mills', state: 'OH', bedrooms: 8, bathrooms: 10, squareFeet: 12000, price: 8.5, annualMaintenance: 130, features: ['private acreage', 'pool', 'horse paddock', 'guest cottage'] },
    ],

    // BALTIMORE RAVENS — Baltimore area
    'BAL_RAV': [
        { id: 'BAL_RAV_001', name: 'Inner Harbor Condo', type: 'apartment', city: 'Baltimore', state: 'MD', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.85, annualMaintenance: 22, features: ['harbor view', 'concierge'] },
        { id: 'BAL_RAV_002', name: 'Roland Park Colonial', type: 'starter_house', city: 'Baltimore', state: 'MD', bedrooms: 5, bathrooms: 4, squareFeet: 4200, price: 1.6, annualMaintenance: 30, features: ['historic neighborhood', 'private yard'] },
        { id: 'BAL_RAV_003', name: 'Towson Family Estate', type: 'starter_house', city: 'Towson', state: 'MD', bedrooms: 5, bathrooms: 4, squareFeet: 4800, price: 1.95, annualMaintenance: 35, features: ['gated', 'pool', 'home office'] },
        { id: 'BAL_RAV_004', name: 'Ruxton Manor', type: 'luxury_house', city: 'Ruxton', state: 'MD', bedrooms: 6, bathrooms: 6, squareFeet: 6500, price: 3.5, annualMaintenance: 55, features: ['historic estate', 'pool', 'tennis court'] },
        { id: 'BAL_RAV_005', name: 'Severna Park Waterfront', type: 'luxury_house', city: 'Severna Park', state: 'MD', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 5.5, annualMaintenance: 80, features: ['Chesapeake waterfront', 'private dock', 'pool'] },
        { id: 'BAL_RAV_006', name: 'Greenspring Valley Estate', type: 'mansion', city: 'Stevenson', state: 'MD', bedrooms: 8, bathrooms: 9, squareFeet: 11000, price: 8.5, annualMaintenance: 130, features: ['horse country', 'stable', 'pool', 'guest house'] },
    ],

    // CINCINNATI BENGALS — Cincinnati area
    'CIN_BEN': [
        { id: 'CIN_BEN_001', name: 'Downtown Cincinnati Condo', type: 'apartment', city: 'Cincinnati', state: 'OH', bedrooms: 2, bathrooms: 2, squareFeet: 1400, price: 0.45, annualMaintenance: 14, features: ['river view', 'concierge'] },
        { id: 'CIN_BEN_002', name: 'Hyde Park Family Home', type: 'starter_house', city: 'Cincinnati', state: 'OH', bedrooms: 4, bathrooms: 3, squareFeet: 3800, price: 1.1, annualMaintenance: 22, features: ['historic neighborhood', 'pool'] },
        { id: 'CIN_BEN_003', name: 'Indian Hill Estate', type: 'starter_house', city: 'Indian Hill', state: 'OH', bedrooms: 5, bathrooms: 5, squareFeet: 5500, price: 2.4, annualMaintenance: 42, features: ['private acreage', 'pool', 'tennis court'] },
        { id: 'CIN_BEN_004', name: 'Mariemont Manor', type: 'luxury_house', city: 'Mariemont', state: 'OH', bedrooms: 6, bathrooms: 6, squareFeet: 6500, price: 3.2, annualMaintenance: 50, features: ['gated', 'pool', 'wine cellar'] },
        { id: 'CIN_BEN_005', name: 'Indian Hill Country Estate', type: 'luxury_house', city: 'Indian Hill', state: 'OH', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 5.5, annualMaintenance: 82, features: ['private acreage', 'horse stable', 'pool', 'guest house'] },
        { id: 'CIN_BEN_006', name: 'Indian Hill Iconic Mansion', type: 'mansion', city: 'Indian Hill', state: 'OH', bedrooms: 8, bathrooms: 10, squareFeet: 11500, price: 8.5, annualMaintenance: 130, features: ['private acreage', 'pool', 'tennis court', 'guest mansion'] },
    ],

    // ATLANTA THUNDERHAWKS — Atlanta/Buckhead
    'ATL_THU': [
        { id: 'ATL_THU_001', name: 'Buckhead Tower 2BR', type: 'apartment', city: 'Atlanta', state: 'GA', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 1.1, annualMaintenance: 24, features: ['skyline view', 'pool', 'valet'] },
        { id: 'ATL_THU_002', name: 'Marietta Family Home', type: 'starter_house', city: 'Marietta', state: 'GA', bedrooms: 4, bathrooms: 3.5, squareFeet: 3800, price: 1.35, annualMaintenance: 28, features: ['large yard', 'wraparound porch'] },
        { id: 'ATL_THU_003', name: 'Sandy Springs Estate', type: 'starter_house', city: 'Sandy Springs', state: 'GA', bedrooms: 5, bathrooms: 5, squareFeet: 5200, price: 2.4, annualMaintenance: 42, features: ['gated', 'pool', 'home theater'] },
        { id: 'ATL_THU_004', name: 'Buckhead Ranch House', type: 'luxury_house', city: 'Atlanta', state: 'GA', bedrooms: 5, bathrooms: 4.5, squareFeet: 4800, price: 3.2, annualMaintenance: 50, features: ['gated', 'pool', 'guest house'] },
        { id: 'ATL_THU_005', name: 'Tuxedo Park Manor', type: 'luxury_house', city: 'Atlanta', state: 'GA', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 8.5, annualMaintenance: 125, features: ['historic Buckhead', 'pool', 'tennis court', 'guest house'] },
        { id: 'ATL_THU_006', name: 'Buckhead Iconic Mansion', type: 'mansion', city: 'Atlanta', state: 'GA', bedrooms: 8, bathrooms: 11, squareFeet: 13000, price: 14.5, annualMaintenance: 215, features: ['gated', 'ballroom', 'wine cellar', 'staff wing', 'pool'] },
    ],

    // CHARLOTTE PANTHERS — Charlotte area
    'CHA_PAN': [
        { id: 'CHA_PAN_001', name: 'Uptown Charlotte Condo', type: 'apartment', city: 'Charlotte', state: 'NC', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.85, annualMaintenance: 22, features: ['skyline view', 'pool', 'concierge'] },
        { id: 'CHA_PAN_002', name: 'Myers Park Family Home', type: 'starter_house', city: 'Charlotte', state: 'NC', bedrooms: 4, bathrooms: 3, squareFeet: 3800, price: 1.6, annualMaintenance: 32, features: ['historic neighborhood', 'mature trees', 'pool'] },
        { id: 'CHA_PAN_003', name: 'Eastover Estate', type: 'starter_house', city: 'Charlotte', state: 'NC', bedrooms: 5, bathrooms: 5, squareFeet: 5200, price: 2.8, annualMaintenance: 48, features: ['gated', 'pool', 'home office'] },
        { id: 'CHA_PAN_004', name: 'Lake Norman Waterfront', type: 'luxury_house', city: 'Cornelius', state: 'NC', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 4.5, annualMaintenance: 70, features: ['lakefront', 'private dock', 'pool', 'boat house'] },
        { id: 'CHA_PAN_005', name: 'Eastover Manor', type: 'luxury_house', city: 'Charlotte', state: 'NC', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 6.5, annualMaintenance: 95, features: ['historic district', 'pool', 'tennis court', 'guest house'] },
        { id: 'CHA_PAN_006', name: 'Lake Norman Mansion', type: 'mansion', city: 'Cornelius', state: 'NC', bedrooms: 8, bathrooms: 10, squareFeet: 12000, price: 11.5, annualMaintenance: 170, features: ['lakefront', 'private dock', 'pool', 'guest house', 'helipad'] },
    ],

    // TAMPA CORSAIRS — Tampa area
    'TAM_COR': [
        { id: 'TAM_COR_001', name: 'Channelside Condo', type: 'apartment', city: 'Tampa', state: 'FL', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.95, annualMaintenance: 24, features: ['waterfront view', 'pool', 'concierge'] },
        { id: 'TAM_COR_002', name: 'Hyde Park Bungalow', type: 'starter_house', city: 'Tampa', state: 'FL', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 1.85, annualMaintenance: 35, features: ['historic district', 'pool', 'mature trees'] },
        { id: 'TAM_COR_003', name: 'Bayshore Family Home', type: 'starter_house', city: 'Tampa', state: 'FL', bedrooms: 5, bathrooms: 4, squareFeet: 4400, price: 3.5, annualMaintenance: 52, features: ['waterfront', 'boat dock', 'pool'] },
        { id: 'TAM_COR_004', name: 'Davis Islands Estate', type: 'luxury_house', city: 'Tampa', state: 'FL', bedrooms: 6, bathrooms: 7, squareFeet: 7200, price: 6.8, annualMaintenance: 100, features: ['island living', 'private dock', 'pool', 'guest house'] },
        { id: 'TAM_COR_005', name: 'Avila Country Club Estate', type: 'luxury_house', city: 'Tampa', state: 'FL', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 8.5, annualMaintenance: 125, features: ['gated golf community', 'pool', 'tennis court', 'wine cellar'] },
        { id: 'TAM_COR_006', name: 'Davis Islands Waterfront Mansion', type: 'mansion', city: 'Tampa', state: 'FL', bedrooms: 8, bathrooms: 10, squareFeet: 12500, price: 18.5, annualMaintenance: 270, features: ['waterfront', 'private dock', 'pool', 'guest house', 'helipad'] },
    ],

    // JACKSONVILLE STINGRAYS — Jacksonville area
    'JAX_STI': [
        { id: 'JAX_STI_001', name: 'Downtown Jacksonville Condo', type: 'apartment', city: 'Jacksonville', state: 'FL', bedrooms: 2, bathrooms: 2, squareFeet: 1400, price: 0.55, annualMaintenance: 16, features: ['river view', 'pool'] },
        { id: 'JAX_STI_002', name: 'San Marco Family Home', type: 'starter_house', city: 'Jacksonville', state: 'FL', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 1.2, annualMaintenance: 24, features: ['historic neighborhood', 'mature trees'] },
        { id: 'JAX_STI_003', name: 'Ponte Vedra Beach Home', type: 'starter_house', city: 'Ponte Vedra Beach', state: 'FL', bedrooms: 5, bathrooms: 4, squareFeet: 4200, price: 2.5, annualMaintenance: 42, features: ['near beach', 'pool', 'gated community'] },
        { id: 'JAX_STI_004', name: 'Ortega Estate', type: 'luxury_house', city: 'Jacksonville', state: 'FL', bedrooms: 6, bathrooms: 6, squareFeet: 6500, price: 3.8, annualMaintenance: 60, features: ['historic riverfront', 'private dock', 'pool'] },
        { id: 'JAX_STI_005', name: 'Ponte Vedra Beach Estate', type: 'luxury_house', city: 'Ponte Vedra Beach', state: 'FL', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 5.5, annualMaintenance: 82, features: ['oceanfront', 'pool', 'private beach access'] },
        { id: 'JAX_STI_006', name: 'Epping Forest Estate', type: 'mansion', city: 'Jacksonville', state: 'FL', bedrooms: 8, bathrooms: 10, squareFeet: 12000, price: 9.5, annualMaintenance: 145, features: ['gated riverfront', 'private dock', 'pool', 'guest house'] },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // WESTERN CONFERENCE
    // ───────────────────────────────────────────────────────────────────────

    // CHICAGO MONSTERS — Chicago/North Shore
    'CHI_MON': [
        { id: 'CHI_MON_001', name: 'River North Loft', type: 'apartment', city: 'Chicago', state: 'IL', bedrooms: 2, bathrooms: 2, squareFeet: 1400, price: 0.95, annualMaintenance: 22, features: ['exposed brick', 'rooftop terrace'] },
        { id: 'CHI_MON_002', name: 'Lincoln Park Townhouse', type: 'apartment', city: 'Chicago', state: 'IL', bedrooms: 3, bathrooms: 3, squareFeet: 2400, price: 2.2, annualMaintenance: 40, features: ['historic district', 'private garage', 'rooftop deck'] },
        { id: 'CHI_MON_003', name: 'Winnetka Family Home', type: 'starter_house', city: 'Winnetka', state: 'IL', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 2.8, annualMaintenance: 48, features: ['North Shore', 'pool', 'large yard'] },
        { id: 'CHI_MON_004', name: 'Lake Forest Estate', type: 'luxury_house', city: 'Lake Forest', state: 'IL', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 5.5, annualMaintenance: 82, features: ['gated', 'pool', 'tennis court', 'guest house'] },
        { id: 'CHI_MON_005', name: 'Glencoe Lakefront', type: 'luxury_house', city: 'Glencoe', state: 'IL', bedrooms: 7, bathrooms: 7, squareFeet: 8000, price: 7.5, annualMaintenance: 110, features: ['Lake Michigan view', 'private beach', 'pool'] },
        { id: 'CHI_MON_006', name: 'Lake Forest Iconic Estate', type: 'mansion', city: 'Lake Forest', state: 'IL', bedrooms: 9, bathrooms: 12, squareFeet: 14000, price: 13.5, annualMaintenance: 200, features: ['historic estate', 'pool', 'tennis court', 'horse stable', 'guest mansion'] },
    ],

    // GREEN BAY BREWERS — Green Bay/Wisconsin
    'GRB_BRE': [
        { id: 'GRB_BRE_001', name: 'Downtown Green Bay Condo', type: 'apartment', city: 'Green Bay', state: 'WI', bedrooms: 2, bathrooms: 2, squareFeet: 1400, price: 0.35, annualMaintenance: 12, features: ['river view', 'parking'] },
        { id: 'GRB_BRE_002', name: 'De Pere Family Home', type: 'starter_house', city: 'De Pere', state: 'WI', bedrooms: 4, bathrooms: 3, squareFeet: 3200, price: 0.65, annualMaintenance: 16, features: ['family neighborhood', 'large yard'] },
        { id: 'GRB_BRE_003', name: 'Ledgeview Estate', type: 'starter_house', city: 'Green Bay', state: 'WI', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 1.1, annualMaintenance: 22, features: ['gated community', 'pool'] },
        { id: 'GRB_BRE_004', name: 'Door County Lakeside Cabin', type: 'luxury_house', city: 'Sister Bay', state: 'WI', bedrooms: 5, bathrooms: 5, squareFeet: 5500, price: 2.4, annualMaintenance: 38, features: ['lakefront', 'private dock', 'guest cottage'] },
        { id: 'GRB_BRE_005', name: 'Lake Geneva Estate', type: 'luxury_house', city: 'Lake Geneva', state: 'WI', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 4.5, annualMaintenance: 70, features: ['lakefront', 'private beach', 'boat house', 'pool'] },
        { id: 'GRB_BRE_006', name: 'Door County Iconic Lakefront', type: 'mansion', city: 'Ephraim', state: 'WI', bedrooms: 8, bathrooms: 9, squareFeet: 10500, price: 6.5, annualMaintenance: 95, features: ['Green Bay waterfront', 'private dock', 'pool', 'guest house'] },
    ],

    // DETROIT MOTORS — Detroit/Bloomfield Hills
    'DET_MOT': [
        { id: 'DET_MOT_001', name: 'Downtown Detroit Loft', type: 'apartment', city: 'Detroit', state: 'MI', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.5, annualMaintenance: 14, features: ['historic conversion', 'rooftop access'] },
        { id: 'DET_MOT_002', name: 'Birmingham Family Home', type: 'starter_house', city: 'Birmingham', state: 'MI', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 1.2, annualMaintenance: 24, features: ['walkable downtown', 'large yard'] },
        { id: 'DET_MOT_003', name: 'Bloomfield Hills Estate', type: 'starter_house', city: 'Bloomfield Hills', state: 'MI', bedrooms: 5, bathrooms: 5, squareFeet: 5200, price: 2.4, annualMaintenance: 42, features: ['gated', 'pool', 'tennis court'] },
        { id: 'DET_MOT_004', name: 'Grosse Pointe Manor', type: 'luxury_house', city: 'Grosse Pointe', state: 'MI', bedrooms: 6, bathrooms: 6, squareFeet: 6500, price: 3.5, annualMaintenance: 55, features: ['historic district', 'lakefront', 'pool'] },
        { id: 'DET_MOT_005', name: 'Bloomfield Hills Country Estate', type: 'luxury_house', city: 'Bloomfield Hills', state: 'MI', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 5.8, annualMaintenance: 88, features: ['private acreage', 'pool', 'tennis court', 'guest house'] },
        { id: 'DET_MOT_006', name: 'Grosse Pointe Lakefront Mansion', type: 'mansion', city: 'Grosse Pointe', state: 'MI', bedrooms: 8, bathrooms: 10, squareFeet: 11500, price: 9.5, annualMaintenance: 145, features: ['Lake St. Clair frontage', 'private dock', 'pool', 'guest house'] },
    ],

    // MINNEAPOLIS AURORA — Minneapolis/Edina
    'MIN_AUR': [
        { id: 'MIN_AUR_001', name: 'North Loop Loft', type: 'apartment', city: 'Minneapolis', state: 'MN', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.65, annualMaintenance: 18, features: ['historic conversion', 'rooftop deck'] },
        { id: 'MIN_AUR_002', name: 'Edina Family Home', type: 'starter_house', city: 'Edina', state: 'MN', bedrooms: 5, bathrooms: 4, squareFeet: 4200, price: 1.5, annualMaintenance: 30, features: ['top schools', 'large yard', 'pool'] },
        { id: 'MIN_AUR_003', name: 'Wayzata Lakeside Home', type: 'starter_house', city: 'Wayzata', state: 'MN', bedrooms: 5, bathrooms: 5, squareFeet: 5000, price: 2.6, annualMaintenance: 45, features: ['Lake Minnetonka access', 'pool', 'boat slip'] },
        { id: 'MIN_AUR_004', name: 'Edina Modern Estate', type: 'luxury_house', city: 'Edina', state: 'MN', bedrooms: 5, bathrooms: 5, squareFeet: 5200, price: 3.8, annualMaintenance: 56, features: ['indoor pool', 'wine cellar', 'home gym'] },
        { id: 'MIN_AUR_005', name: 'Lake Minnetonka Manor', type: 'luxury_house', city: 'Wayzata', state: 'MN', bedrooms: 7, bathrooms: 7, squareFeet: 8500, price: 6.5, annualMaintenance: 95, features: ['lakefront', 'boat house', 'pool', 'guest suites'] },
        { id: 'MIN_AUR_006', name: 'Lake Minnetonka Iconic Estate', type: 'mansion', city: 'Orono', state: 'MN', bedrooms: 8, bathrooms: 10, squareFeet: 11500, price: 11.5, annualMaintenance: 170, features: ['lakefront', 'private dock', 'pool', 'guest house', 'helipad'] },
    ],

    // DENVER STALLIONS — Denver/Cherry Hills
    'DEN_STA': [
        { id: 'DEN_STA_001', name: 'LoDo Loft', type: 'apartment', city: 'Denver', state: 'CO', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.85, annualMaintenance: 22, features: ['historic district', 'mountain view'] },
        { id: 'DEN_STA_002', name: 'Wash Park Family Home', type: 'starter_house', city: 'Denver', state: 'CO', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 1.6, annualMaintenance: 30, features: ['walking to park', 'mountain view', 'mature trees'] },
        { id: 'DEN_STA_003', name: 'Cherry Creek Estate', type: 'starter_house', city: 'Denver', state: 'CO', bedrooms: 5, bathrooms: 5, squareFeet: 5000, price: 3.2, annualMaintenance: 50, features: ['walkable neighborhood', 'pool', 'home theater'] },
        { id: 'DEN_STA_004', name: 'Cherry Hills Estate', type: 'luxury_house', city: 'Cherry Hills Village', state: 'CO', bedrooms: 6, bathrooms: 7, squareFeet: 7200, price: 5.5, annualMaintenance: 82, features: ['mountain view', 'pool', 'wine cellar'] },
        { id: 'DEN_STA_005', name: 'Cherry Hills Country Estate', type: 'luxury_house', city: 'Cherry Hills Village', state: 'CO', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 8.5, annualMaintenance: 125, features: ['private acreage', 'pool', 'tennis court', 'guest house'] },
        { id: 'DEN_STA_006', name: 'Cherry Hills Iconic Estate', type: 'mansion', city: 'Cherry Hills Village', state: 'CO', bedrooms: 8, bathrooms: 10, squareFeet: 12000, price: 13.5, annualMaintenance: 200, features: ['mountain view', 'pool', 'tennis court', 'guest house', 'wine cellar'] },
    ],

    // KANSAS CITY CAVALRY — KC/Mission Hills
    'KCC_CAV': [
        { id: 'KCC_CAV_001', name: 'Power & Light Loft', type: 'apartment', city: 'Kansas City', state: 'MO', bedrooms: 2, bathrooms: 2, squareFeet: 1400, price: 0.45, annualMaintenance: 14, features: ['downtown', 'rooftop access'] },
        { id: 'KCC_CAV_002', name: 'Brookside Family Home', type: 'starter_house', city: 'Kansas City', state: 'MO', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 0.85, annualMaintenance: 20, features: ['historic neighborhood', 'large yard'] },
        { id: 'KCC_CAV_003', name: 'Leawood Estate', type: 'starter_house', city: 'Leawood', state: 'KS', bedrooms: 5, bathrooms: 5, squareFeet: 4800, price: 1.6, annualMaintenance: 30, features: ['gated', 'pool', 'home theater'] },
        { id: 'KCC_CAV_004', name: 'Mission Hills Manor', type: 'luxury_house', city: 'Mission Hills', state: 'KS', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 3.5, annualMaintenance: 55, features: ['historic district', 'pool', 'tennis court'] },
        { id: 'KCC_CAV_005', name: 'Lake Quivira Estate', type: 'luxury_house', city: 'Lake Quivira', state: 'KS', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 4.8, annualMaintenance: 72, features: ['lakefront', 'private dock', 'pool', 'guest house'] },
        { id: 'KCC_CAV_006', name: 'Mission Hills Iconic Estate', type: 'mansion', city: 'Mission Hills', state: 'KS', bedrooms: 8, bathrooms: 10, squareFeet: 11500, price: 8.5, annualMaintenance: 130, features: ['historic estate', 'pool', 'tennis court', 'guest house', 'wine cellar'] },
    ],

    // SALT LAKE SENTINELS — SLC/Park City
    'SLC_SEN': [
        { id: 'SLC_SEN_001', name: 'Downtown SLC Loft', type: 'apartment', city: 'Salt Lake City', state: 'UT', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.55, annualMaintenance: 16, features: ['mountain view', 'rooftop access'] },
        { id: 'SLC_SEN_002', name: 'Holladay Family Home', type: 'starter_house', city: 'Holladay', state: 'UT', bedrooms: 5, bathrooms: 4, squareFeet: 4200, price: 1.4, annualMaintenance: 28, features: ['mountain view', 'large yard'] },
        { id: 'SLC_SEN_003', name: 'Sandy Suburban Home', type: 'starter_house', city: 'Sandy', state: 'UT', bedrooms: 5, bathrooms: 5, squareFeet: 4800, price: 1.9, annualMaintenance: 35, features: ['gated', 'pool', 'mountain view'] },
        { id: 'SLC_SEN_004', name: 'Holladay Mountain Home', type: 'luxury_house', city: 'Holladay', state: 'UT', bedrooms: 6, bathrooms: 7, squareFeet: 8000, price: 6.2, annualMaintenance: 88, features: ['mountain view', 'great room', 'wine cellar', 'gym'] },
        { id: 'SLC_SEN_005', name: 'Park City Ski Lodge', type: 'luxury_house', city: 'Park City', state: 'UT', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 8.5, annualMaintenance: 125, features: ['ski-in/ski-out', 'great room', 'hot tub'] },
        { id: 'SLC_SEN_006', name: 'Deer Valley Iconic Estate', type: 'mansion', city: 'Park City', state: 'UT', bedrooms: 8, bathrooms: 10, squareFeet: 11500, price: 14.5, annualMaintenance: 220, features: ['ski-in/ski-out', 'spa', 'wine cellar', 'guest cabins'] },
    ],

    // PHOENIX SCORPIONS — Phoenix/Paradise Valley
    'PHO_SCO': [
        { id: 'PHO_SCO_001', name: 'Downtown Phoenix Condo', type: 'apartment', city: 'Phoenix', state: 'AZ', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.65, annualMaintenance: 18, features: ['city view', 'pool'] },
        { id: 'PHO_SCO_002', name: 'Scottsdale Family Home', type: 'starter_house', city: 'Scottsdale', state: 'AZ', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 1.4, annualMaintenance: 28, features: ['desert landscape', 'pool', 'casita'] },
        { id: 'PHO_SCO_003', name: 'Arcadia Family Home', type: 'starter_house', city: 'Phoenix', state: 'AZ', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 2.4, annualMaintenance: 42, features: ['Camelback Mountain view', 'pool', 'casita'] },
        { id: 'PHO_SCO_004', name: 'Paradise Valley Estate', type: 'luxury_house', city: 'Paradise Valley', state: 'AZ', bedrooms: 6, bathrooms: 7, squareFeet: 7400, price: 6.5, annualMaintenance: 90, features: ['mountain view', 'pool', 'casita', 'desert garden'] },
        { id: 'PHO_SCO_005', name: 'Silverleaf Estate', type: 'luxury_house', city: 'Scottsdale', state: 'AZ', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 8.5, annualMaintenance: 125, features: ['gated golf community', 'pool', 'tennis court', 'guest house'] },
        { id: 'PHO_SCO_006', name: 'Paradise Valley Iconic Estate', type: 'mansion', city: 'Paradise Valley', state: 'AZ', bedrooms: 8, bathrooms: 10, squareFeet: 12000, price: 14.5, annualMaintenance: 215, features: ['mountain view', 'pool complex', 'tennis court', 'guest house', 'helipad'] },
    ],

    // SAN FRANCISCO MINERS — SF/Atherton/Hillsborough
    'SFO_MIN': [
        { id: 'SFO_MIN_001', name: 'Pacific Heights Condo', type: 'apartment', city: 'San Francisco', state: 'CA', bedrooms: 2, bathrooms: 2, squareFeet: 1400, price: 2.4, annualMaintenance: 42, features: ['Bay view', 'historic building'] },
        { id: 'SFO_MIN_002', name: 'Russian Hill Apartment', type: 'apartment', city: 'San Francisco', state: 'CA', bedrooms: 3, bathrooms: 2.5, squareFeet: 2200, price: 3.8, annualMaintenance: 58, features: ['city view', 'historic district', 'parking'] },
        { id: 'SFO_MIN_003', name: 'Hillsborough Family Home', type: 'starter_house', city: 'Hillsborough', state: 'CA', bedrooms: 5, bathrooms: 5, squareFeet: 5000, price: 5.5, annualMaintenance: 82, features: ['gated peninsula', 'pool', 'mature trees'] },
        { id: 'SFO_MIN_004', name: 'Atherton Estate', type: 'luxury_house', city: 'Atherton', state: 'CA', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 12.5, annualMaintenance: 180, features: ['gated', 'pool', 'tennis court', 'wine cellar'] },
        { id: 'SFO_MIN_005', name: 'Woodside Country Estate', type: 'luxury_house', city: 'Woodside', state: 'CA', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 14.5, annualMaintenance: 215, features: ['private acreage', 'horse stable', 'pool', 'guest house'] },
        { id: 'SFO_MIN_006', name: 'Atherton Iconic Estate', type: 'mansion', city: 'Atherton', state: 'CA', bedrooms: 8, bathrooms: 10, squareFeet: 12500, price: 22.5, annualMaintenance: 335, features: ['gated', 'pool complex', 'tennis court', 'guest mansion', 'wine cellar'] },
    ],

    // LOS ANGELES ADMIRALS — LA/Bel-Air/Beverly Hills
    'LAA_ADM': [
        { id: 'LAA_ADM_001', name: 'Downtown LA Penthouse Suite', type: 'apartment', city: 'Los Angeles', state: 'CA', bedrooms: 2, bathrooms: 2.5, squareFeet: 1800, price: 2.4, annualMaintenance: 38, features: ['city view', 'private elevator', 'wine cellar'] },
        { id: 'LAA_ADM_002', name: 'West Hollywood Modern', type: 'starter_house', city: 'Los Angeles', state: 'CA', bedrooms: 4, bathrooms: 4, squareFeet: 3500, price: 3.8, annualMaintenance: 58, features: ['canyon view', 'pool', 'private gate'] },
        { id: 'LAA_ADM_003', name: 'Brentwood Contemporary', type: 'luxury_house', city: 'Los Angeles', state: 'CA', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 8.5, annualMaintenance: 115, features: ['canyon view', 'pool house', 'tennis court'] },
        { id: 'LAA_ADM_004', name: 'Beverly Hills Modern', type: 'luxury_house', city: 'Beverly Hills', state: 'CA', bedrooms: 5, bathrooms: 6, squareFeet: 6200, price: 12.8, annualMaintenance: 185, features: ['infinity pool', 'home theater', 'wine cellar', 'staff'] },
        { id: 'LAA_ADM_005', name: 'Hidden Hills Compound', type: 'mansion', city: 'Hidden Hills', state: 'CA', bedrooms: 8, bathrooms: 12, squareFeet: 14000, price: 18.5, annualMaintenance: 280, features: ['gated community', 'pool', 'tennis court', 'staff house', 'home theater'] },
        { id: 'LAA_ADM_006', name: 'Bel-Air Trophy Estate', type: 'iconic_mansion', city: 'Bel-Air', state: 'CA', bedrooms: 12, bathrooms: 16, squareFeet: 25000, price: 52.0, annualMaintenance: 780, features: ['gated', 'art gallery', 'screening room', 'spa', 'guest mansion', '4 acres'] },
    ],

    // SAN DIEGO MARLINS — SD/La Jolla/Rancho Santa Fe
    'SDM_MAR': [
        { id: 'SDM_MAR_001', name: 'Downtown San Diego Condo', type: 'apartment', city: 'San Diego', state: 'CA', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 1.4, annualMaintenance: 28, features: ['Bay view', 'pool'] },
        { id: 'SDM_MAR_002', name: 'La Jolla Family Home', type: 'starter_house', city: 'La Jolla', state: 'CA', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 3.5, annualMaintenance: 55, features: ['ocean view', 'pool', 'mature trees'] },
        { id: 'SDM_MAR_003', name: 'Del Mar Beach House', type: 'starter_house', city: 'Del Mar', state: 'CA', bedrooms: 4, bathrooms: 4, squareFeet: 3800, price: 5.5, annualMaintenance: 80, features: ['oceanfront', 'private deck', 'walk to beach'] },
        { id: 'SDM_MAR_004', name: 'Rancho Santa Fe Estate', type: 'luxury_house', city: 'Rancho Santa Fe', state: 'CA', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 8.5, annualMaintenance: 125, features: ['gated', 'pool', 'tennis court', 'guest house'] },
        { id: 'SDM_MAR_005', name: 'La Jolla Cliffside Estate', type: 'luxury_house', city: 'La Jolla', state: 'CA', bedrooms: 6, bathrooms: 7, squareFeet: 7800, price: 12.5, annualMaintenance: 180, features: ['ocean cliff', 'infinity pool', 'wine cellar'] },
        { id: 'SDM_MAR_006', name: 'Rancho Santa Fe Iconic Estate', type: 'mansion', city: 'Rancho Santa Fe', state: 'CA', bedrooms: 9, bathrooms: 11, squareFeet: 14500, price: 21.8, annualMaintenance: 320, features: ['gated', 'horse stable', 'pool', 'tennis court', 'guest house'] },
    ],

    // SEATTLE SASQUATCH — Seattle/Bellevue/Medina
    'SEA_SAS': [
        { id: 'SEA_SAS_001', name: 'Belltown Condo', type: 'apartment', city: 'Seattle', state: 'WA', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 1.4, annualMaintenance: 28, features: ['Sound view', 'concierge'] },
        { id: 'SEA_SAS_002', name: 'Capitol Hill Townhouse', type: 'starter_house', city: 'Seattle', state: 'WA', bedrooms: 4, bathrooms: 3, squareFeet: 3200, price: 2.2, annualMaintenance: 38, features: ['historic district', 'rooftop deck', 'parking'] },
        { id: 'SEA_SAS_003', name: 'Bellevue Family Home', type: 'starter_house', city: 'Bellevue', state: 'WA', bedrooms: 5, bathrooms: 5, squareFeet: 4500, price: 3.5, annualMaintenance: 55, features: ['top schools', 'pool', 'home theater'] },
        { id: 'SEA_SAS_004', name: 'Medina Lakefront Home', type: 'luxury_house', city: 'Medina', state: 'WA', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 8.5, annualMaintenance: 125, features: ['Lake Washington frontage', 'private dock', 'pool'] },
        { id: 'SEA_SAS_005', name: 'Hunts Point Estate', type: 'luxury_house', city: 'Hunts Point', state: 'WA', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 13.5, annualMaintenance: 200, features: ['lakefront', 'private dock', 'pool', 'guest house'] },
        { id: 'SEA_SAS_006', name: 'Medina Iconic Lakefront', type: 'mansion', city: 'Medina', state: 'WA', bedrooms: 8, bathrooms: 10, squareFeet: 12500, price: 22.5, annualMaintenance: 335, features: ['Lake Washington frontage', 'private dock', 'pool', 'guest house', 'helipad'] },
    ],

    // DALLAS RANGERS — Dallas/Highland Park/Frisco
    'DAL_RAN': [
        { id: 'DAL_RAN_001', name: 'Uptown Dallas Loft', type: 'apartment', city: 'Dallas', state: 'TX', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.85, annualMaintenance: 22, features: ['city view', 'pool', 'concierge'] },
        { id: 'DAL_RAN_002', name: 'Plano Suburban Home', type: 'starter_house', city: 'Plano', state: 'TX', bedrooms: 4, bathrooms: 3, squareFeet: 3200, price: 1.1, annualMaintenance: 25, features: ['pool', '3-car garage', 'open kitchen'] },
        { id: 'DAL_RAN_003', name: 'Frisco Family Estate', type: 'starter_house', city: 'Frisco', state: 'TX', bedrooms: 5, bathrooms: 4, squareFeet: 4100, price: 1.6, annualMaintenance: 32, features: ['game room', 'pool', 'home theater'] },
        { id: 'DAL_RAN_004', name: 'Highland Park Cottage', type: 'starter_house', city: 'Dallas', state: 'TX', bedrooms: 3, bathrooms: 3, squareFeet: 2800, price: 1.85, annualMaintenance: 30, features: ['historic neighborhood', 'tree-lined street'] },
        { id: 'DAL_RAN_005', name: 'Highland Park Estate', type: 'luxury_house', city: 'Dallas', state: 'TX', bedrooms: 7, bathrooms: 8, squareFeet: 9000, price: 7.5, annualMaintenance: 105, features: ['gated', 'tennis court', 'ballroom', 'wine cellar'] },
        { id: 'DAL_RAN_006', name: 'Highland Park Iconic Manor', type: 'mansion', city: 'Dallas', state: 'TX', bedrooms: 8, bathrooms: 10, squareFeet: 12500, price: 14.9, annualMaintenance: 215, features: ['gated', 'ballroom', 'wine cellar', 'staff quarters', 'pool'] },
    ],

    // HOUSTON WILDCATTERS — Houston/River Oaks/Memorial
    'HOU_WIL': [
        { id: 'HOU_WIL_001', name: 'Houston Galleria 3BR', type: 'apartment', city: 'Houston', state: 'TX', bedrooms: 3, bathrooms: 3, squareFeet: 2200, price: 1.65, annualMaintenance: 30, features: ['gym', 'spa', 'private storage'] },
        { id: 'HOU_WIL_002', name: 'Memorial Family Home', type: 'starter_house', city: 'Houston', state: 'TX', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 1.85, annualMaintenance: 35, features: ['large yard', 'pool', 'mature trees'] },
        { id: 'HOU_WIL_003', name: 'West University Place Home', type: 'starter_house', city: 'West University Place', state: 'TX', bedrooms: 5, bathrooms: 5, squareFeet: 5000, price: 3.2, annualMaintenance: 50, features: ['walkable', 'pool', 'home office'] },
        { id: 'HOU_WIL_004', name: 'River Oaks Bungalow', type: 'luxury_house', city: 'Houston', state: 'TX', bedrooms: 4, bathrooms: 4, squareFeet: 4000, price: 4.5, annualMaintenance: 65, features: ['historic district', 'garden', 'staff quarters'] },
        { id: 'HOU_WIL_005', name: 'River Oaks Manor', type: 'luxury_house', city: 'Houston', state: 'TX', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 8.5, annualMaintenance: 125, features: ['historic district', 'pool', 'tennis court', 'guest house'] },
        { id: 'HOU_WIL_006', name: 'River Oaks Iconic Mansion', type: 'mansion', city: 'Houston', state: 'TX', bedrooms: 9, bathrooms: 12, squareFeet: 15000, price: 16.5, annualMaintenance: 240, features: ['historic district', 'ballroom', 'pool', 'staff wing', 'wine cellar'] },
    ],

    // NEW ORLEANS VOODOO — NOLA/Old Metairie
    'NOV_VOO': [
        { id: 'NOV_VOO_001', name: 'French Quarter Apartment', type: 'apartment', city: 'New Orleans', state: 'LA', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.85, annualMaintenance: 22, features: ['historic balcony', 'courtyard'] },
        { id: 'NOV_VOO_002', name: 'Garden District Home', type: 'starter_house', city: 'New Orleans', state: 'LA', bedrooms: 4, bathrooms: 3, squareFeet: 3500, price: 1.4, annualMaintenance: 28, features: ['historic district', 'wraparound porch', 'mature oaks'] },
        { id: 'NOV_VOO_003', name: 'Old Metairie Family Home', type: 'starter_house', city: 'Metairie', state: 'LA', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 1.85, annualMaintenance: 35, features: ['large yard', 'pool', 'home theater'] },
        { id: 'NOV_VOO_004', name: 'Audubon Place Estate', type: 'luxury_house', city: 'New Orleans', state: 'LA', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 4.5, annualMaintenance: 70, features: ['gated historic district', 'pool', 'guest house'] },
        { id: 'NOV_VOO_005', name: 'Garden District Manor', type: 'luxury_house', city: 'New Orleans', state: 'LA', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 6.5, annualMaintenance: 95, features: ['historic mansion', 'pool', 'guest house', 'wine cellar'] },
        { id: 'NOV_VOO_006', name: 'St. Charles Iconic Mansion', type: 'mansion', city: 'New Orleans', state: 'LA', bedrooms: 9, bathrooms: 11, squareFeet: 13000, price: 9.5, annualMaintenance: 145, features: ['historic St. Charles Avenue', 'ballroom', 'staff quarters', 'pool'] },
    ],

    // NASHVILLE TITANS — Nashville/Brentwood/Belle Meade
    'NAS_TIT': [
        { id: 'NAS_TIT_001', name: 'Downtown Nashville Loft', type: 'apartment', city: 'Nashville', state: 'TN', bedrooms: 2, bathrooms: 2, squareFeet: 1500, price: 0.85, annualMaintenance: 22, features: ['city view', 'rooftop access'] },
        { id: 'NAS_TIT_002', name: 'Brentwood Hills Home', type: 'starter_house', city: 'Brentwood', state: 'TN', bedrooms: 5, bathrooms: 4, squareFeet: 4500, price: 2.4, annualMaintenance: 36, features: ['hillside lot', 'recording studio', 'pool'] },
        { id: 'NAS_TIT_003', name: 'Franklin Family Estate', type: 'starter_house', city: 'Franklin', state: 'TN', bedrooms: 5, bathrooms: 5, squareFeet: 5000, price: 2.8, annualMaintenance: 45, features: ['gated community', 'pool', 'home theater'] },
        { id: 'NAS_TIT_004', name: 'Belle Meade Manor', type: 'luxury_house', city: 'Belle Meade', state: 'TN', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 5.5, annualMaintenance: 82, features: ['historic district', 'pool', 'guest house', 'mature trees'] },
        { id: 'NAS_TIT_005', name: 'Forest Hills Estate', type: 'luxury_house', city: 'Nashville', state: 'TN', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 7.5, annualMaintenance: 110, features: ['private acreage', 'pool', 'tennis court', 'guest house'] },
        { id: 'NAS_TIT_006', name: 'Belle Meade Iconic Estate', type: 'mansion', city: 'Belle Meade', state: 'TN', bedrooms: 8, bathrooms: 10, squareFeet: 12000, price: 11.5, annualMaintenance: 170, features: ['historic estate', 'pool', 'tennis court', 'guest mansion', 'horse stable'] },
    ],
};

// ═══════════════════════════════════════════════════════════════════════════
// PROPIEDADES VACATION / DESTINO (globales — aparecen para cualquier equipo)
// Casas trofeo en destinos clásicos de jugadores NFL: Aspen, Hamptons, Malibu,
// Bel-Air iconic, Pebble Beach, Hawaii, Las Vegas estate, etc.
// ═══════════════════════════════════════════════════════════════════════════

export const VACATION_PROPERTIES: Property[] = [
    // ─── ASPEN / VAIL (esquí destino élite) ─────────────────────────────────
    { id: 'VAC_001', name: 'Aspen Ski Lodge', type: 'luxury_house', city: 'Aspen', state: 'CO', bedrooms: 5, bathrooms: 6, squareFeet: 6500, price: 9.2, annualMaintenance: 130, features: ['ski-in/ski-out', 'great room', 'hot tub', 'fireplace'] },
    { id: 'VAC_002', name: 'Aspen Mountain Compound', type: 'mansion', city: 'Aspen', state: 'CO', bedrooms: 8, bathrooms: 10, squareFeet: 12500, price: 28.5, annualMaintenance: 425, features: ['ski-in/ski-out', 'spa', 'wine cellar', 'guest cabins'] },
    { id: 'VAC_003', name: 'Vail Slopeside Estate', type: 'luxury_house', city: 'Vail', state: 'CO', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 12.5, annualMaintenance: 185, features: ['ski-in/ski-out', 'great room', 'spa', 'guest house'] },
    { id: 'VAC_004', name: 'Telluride Mountain Retreat', type: 'luxury_house', city: 'Telluride', state: 'CO', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 8.5, annualMaintenance: 125, features: ['mountain view', 'hot tub', 'wine cellar', 'guest cottage'] },

    // ─── HAMPTONS (verano NYC élite) ───────────────────────────────────────
    { id: 'VAC_005', name: 'Hamptons Oceanfront', type: 'beach_house', city: 'East Hampton', state: 'NY', bedrooms: 6, bathrooms: 7, squareFeet: 6800, price: 22.5, annualMaintenance: 330, features: ['private beach', 'pool', 'tennis court', 'pool house'] },
    { id: 'VAC_006', name: 'Bridgehampton Oceanfront', type: 'iconic_mansion', city: 'Bridgehampton', state: 'NY', bedrooms: 12, bathrooms: 14, squareFeet: 21000, price: 48.5, annualMaintenance: 720, features: ['private beach', 'pool', 'tennis court', 'orchard', 'staff quarters', 'art gallery'] },
    { id: 'VAC_007', name: 'Sag Harbor Estate', type: 'luxury_house', city: 'Sag Harbor', state: 'NY', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 12.5, annualMaintenance: 185, features: ['waterfront', 'private dock', 'pool', 'guest cottage'] },
    { id: 'VAC_008', name: 'Southampton Beach Estate', type: 'luxury_house', city: 'Southampton', state: 'NY', bedrooms: 7, bathrooms: 8, squareFeet: 8500, price: 18.5, annualMaintenance: 280, features: ['oceanfront', 'pool', 'tennis court'] },

    // ─── MALIBU / BEL-AIR (LA destino aspiracional) ────────────────────────
    { id: 'VAC_009', name: 'Malibu Beachfront', type: 'beach_house', city: 'Malibu', state: 'CA', bedrooms: 5, bathrooms: 6, squareFeet: 5500, price: 15.5, annualMaintenance: 220, features: ['private beach', 'glass walls', 'infinity pool', 'guest house'] },
    { id: 'VAC_010', name: 'Malibu Colony Compound', type: 'mansion', city: 'Malibu', state: 'CA', bedrooms: 7, bathrooms: 9, squareFeet: 10000, price: 32.5, annualMaintenance: 485, features: ['private beach', 'gated colony', 'pool', 'guest house'] },
    { id: 'VAC_011', name: 'Bel-Air Modern Estate', type: 'mansion', city: 'Bel-Air', state: 'CA', bedrooms: 9, bathrooms: 13, squareFeet: 16000, price: 25.5, annualMaintenance: 380, features: ['canyon view', 'infinity pool', 'art gallery', 'wine cellar', 'spa'] },
    { id: 'VAC_012', name: 'The Manor (Holmby Hills)', type: 'iconic_mansion', city: 'Holmby Hills', state: 'CA', bedrooms: 14, bathrooms: 27, squareFeet: 56000, price: 58.5, annualMaintenance: 850, features: ['ballroom', 'beauty salon', 'bowling alley', 'screening room', '8 acres', 'staff wing'] },

    // ─── PEBBLE BEACH / CARMEL (golf destino) ──────────────────────────────
    { id: 'VAC_013', name: 'Pebble Beach Estate', type: 'iconic_mansion', city: 'Pebble Beach', state: 'CA', bedrooms: 10, bathrooms: 12, squareFeet: 18500, price: 36.0, annualMaintenance: 525, features: ['ocean cliff', 'private golf access', 'wine cellar', 'guest house', 'helipad'] },
    { id: 'VAC_014', name: 'Carmel Coastal Estate', type: 'luxury_house', city: 'Carmel', state: 'CA', bedrooms: 6, bathrooms: 7, squareFeet: 7800, price: 14.2, annualMaintenance: 200, features: ['ocean cliff', 'wine cellar', 'guest house'] },

    // ─── MONTECITO / SANTA BARBARA (costa central CA) ──────────────────────
    { id: 'VAC_015', name: 'Montecito Coastal Estate', type: 'mansion', city: 'Montecito', state: 'CA', bedrooms: 8, bathrooms: 10, squareFeet: 13800, price: 26.5, annualMaintenance: 400, features: ['ocean view', 'pool', 'orchard', 'guest house', 'private trails'] },
    { id: 'VAC_016', name: 'Santa Barbara Coastal Manor', type: 'luxury_house', city: 'Santa Barbara', state: 'CA', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 8.5, annualMaintenance: 125, features: ['ocean view', 'pool', 'mediterranean style'] },

    // ─── LAS VEGAS (residencia y entertainment) ────────────────────────────
    { id: 'VAC_017', name: 'Las Vegas Strip Highrise', type: 'apartment', city: 'Las Vegas', state: 'NV', bedrooms: 2, bathrooms: 2, squareFeet: 1600, price: 1.4, annualMaintenance: 26, features: ['strip view', 'pool', '24h security'] },
    { id: 'VAC_018', name: 'Summerlin Estate', type: 'luxury_house', city: 'Las Vegas', state: 'NV', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 5.5, annualMaintenance: 80, features: ['gated golf community', 'pool', 'casita'] },
    { id: 'VAC_019', name: 'The Ridges Mansion', type: 'mansion', city: 'Las Vegas', state: 'NV', bedrooms: 8, bathrooms: 10, squareFeet: 12500, price: 13.5, annualMaintenance: 200, features: ['gated', 'pool complex', 'wine cellar', 'home theater', 'mountain view'] },

    // ─── LAKE TAHOE (montaña/lago) ─────────────────────────────────────────
    { id: 'VAC_020', name: 'Lake Tahoe Lodge', type: 'mansion', city: 'Lake Tahoe', state: 'NV', bedrooms: 8, bathrooms: 10, squareFeet: 13000, price: 17.5, annualMaintenance: 250, features: ['lakefront', 'private dock', 'great room', 'guest cabins'] },
    { id: 'VAC_021', name: 'Incline Village Estate', type: 'luxury_house', city: 'Incline Village', state: 'NV', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 8.5, annualMaintenance: 125, features: ['lake view', 'pool', 'guest house'] },

    // ─── HAWAII (paraíso aspiracional) ─────────────────────────────────────
    { id: 'VAC_022', name: 'Maui Oceanfront Villa', type: 'beach_house', city: 'Maui', state: 'HI', bedrooms: 5, bathrooms: 6, squareFeet: 6000, price: 12.5, annualMaintenance: 185, features: ['oceanfront', 'private pool', 'guest cottage'] },
    { id: 'VAC_023', name: 'Big Island Estate', type: 'luxury_house', city: 'Kona', state: 'HI', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 9.5, annualMaintenance: 145, features: ['ocean view', 'pool', 'tropical landscape'] },
    { id: 'VAC_024', name: 'Maui Iconic Beachfront', type: 'iconic_mansion', city: 'Wailea', state: 'HI', bedrooms: 10, bathrooms: 12, squareFeet: 15500, price: 38.5, annualMaintenance: 580, features: ['private beach', 'pool complex', 'guest mansion', 'helipad'] },

    // ─── JACKSON HOLE / MONTANA (montaña wilderness) ───────────────────────
    { id: 'VAC_025', name: 'Jackson Hole Lodge', type: 'luxury_house', city: 'Jackson', state: 'WY', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 12.5, annualMaintenance: 185, features: ['mountain view', 'great room', 'hot tub', 'guest cabins'] },
    { id: 'VAC_026', name: 'Yellowstone Club Estate', type: 'mansion', city: 'Big Sky', state: 'MT', bedrooms: 8, bathrooms: 10, squareFeet: 11500, price: 22.5, annualMaintenance: 335, features: ['ski-in/ski-out', 'private club', 'spa', 'guest cabins'] },

    // ─── NAPA / SONOMA (vinos) ─────────────────────────────────────────────
    { id: 'VAC_027', name: 'Napa Valley Vineyard Estate', type: 'luxury_house', city: 'Napa', state: 'CA', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 14.5, annualMaintenance: 215, features: ['vineyard', 'wine cave', 'pool', 'guest cottage'] },
    { id: 'VAC_028', name: 'Sonoma Wine Country Manor', type: 'luxury_house', city: 'Sonoma', state: 'CA', bedrooms: 6, bathrooms: 7, squareFeet: 7000, price: 9.5, annualMaintenance: 145, features: ['vineyard view', 'pool', 'guest house'] },

    // ─── PALM BEACH / NAPLES (FL premium) ──────────────────────────────────
    { id: 'VAC_029', name: 'Palm Beach Oceanfront', type: 'mansion', city: 'Palm Beach', state: 'FL', bedrooms: 8, bathrooms: 10, squareFeet: 12500, price: 28.5, annualMaintenance: 425, features: ['oceanfront', 'pool', 'tennis court', 'guest house'] },
    { id: 'VAC_030', name: 'Naples Beach Estate', type: 'luxury_house', city: 'Naples', state: 'FL', bedrooms: 6, bathrooms: 7, squareFeet: 7500, price: 11.5, annualMaintenance: 170, features: ['beachfront', 'pool', 'private boat dock'] },
    { id: 'VAC_031', name: 'Jupiter Island Retreat', type: 'beach_house', city: 'Jupiter Island', state: 'FL', bedrooms: 5, bathrooms: 6, squareFeet: 6200, price: 9.8, annualMaintenance: 145, features: ['oceanfront', 'pool', 'private dock', 'cabana'] },

    // ─── NYC PENTHOUSES (residencia secundaria élite) ──────────────────────
    { id: 'VAC_032', name: 'Hudson Yards Penthouse', type: 'penthouse', city: 'New York', state: 'NY', bedrooms: 4, bathrooms: 5, squareFeet: 6500, price: 28.5, annualMaintenance: 430, features: ['city view', 'private elevator', 'wine cellar'] },
    { id: 'VAC_033', name: 'One57 Penthouse', type: 'penthouse', city: 'New York', state: 'NY', bedrooms: 5, bathrooms: 6, squareFeet: 7500, price: 35.5, annualMaintenance: 540, features: ['Central Park view', 'butler service', 'private terrace'] },

    // ─── MIAMI PENTHOUSE (vacation FL) ─────────────────────────────────────
    { id: 'VAC_034', name: 'Brickell Sky Penthouse', type: 'penthouse', city: 'Miami', state: 'FL', bedrooms: 4, bathrooms: 5, squareFeet: 6500, price: 18.5, annualMaintenance: 265, features: ['ocean and bay view', 'private rooftop pool', 'wine cellar', 'home theater'] },
    { id: 'VAC_035', name: 'Fisher Island Estate', type: 'iconic_mansion', city: 'Fisher Island', state: 'FL', bedrooms: 9, bathrooms: 12, squareFeet: 14500, price: 36.0, annualMaintenance: 540, features: ['private island', 'beachfront', 'pool complex', 'staff house', 'helipad'] },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Devuelve todas las propiedades disponibles para un equipo dado:
 * sus propiedades regionales + todas las vacation/destino.
 */
export function getPropertiesForTeam(teamId: string): Property[] {
    const regional = PROPERTIES_BY_TEAM[teamId] ?? [];
    return [...regional, ...VACATION_PROPERTIES];
}

/**
 * Devuelve todas las propiedades del catálogo (para tests o admin).
 */
export function getAllProperties(): Property[] {
    const allRegional = Object.values(PROPERTIES_BY_TEAM).flat();
    return [...allRegional, ...VACATION_PROPERTIES];
}