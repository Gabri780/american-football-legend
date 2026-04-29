// src/data/vehicles.ts
// Catálogo de 60 vehículos para el sistema de patrimonio.
// Globales — no se filtran por equipo (mercado de lujo NFL es uniforme nacional).
//
// Precios en MILLONES de dólares (M) para coherencia con properties.ts.
// (Ejemplo: 0.085 = $85,000; 1.5 = $1.5M; 3.4 = $3.4M)
// annualMaintenance en miles ($K) — incluye seguro premium + servicio + impuestos.

export type VehicleType =
    | 'daily_luxury'
    | 'sports_car'
    | 'supercar'
    | 'hypercar'
    | 'vintage'
    | 'luxury_suv';

export interface Vehicle {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;            // modelo del año
    type: VehicleType;
    price: number;           // en millones (0.085 = $85K)
    annualMaintenance: number; // en miles
    topSpeed: number;        // mph (flavor stat)
    horsepower: number;      // hp (flavor stat)
}

export const VEHICLES: Vehicle[] = [
    // ─── DAILY LUXURY (15) — $50K-$150K ──────────────────────────────────────
    { id: 'VEH_001', name: '2024 BMW M3 Competition', brand: 'BMW', model: 'M3 Competition', year: 2024, type: 'daily_luxury', price: 0.085, annualMaintenance: 6, topSpeed: 180, horsepower: 503 },
    { id: 'VEH_002', name: '2024 Mercedes-AMG E63 S', brand: 'Mercedes-AMG', model: 'E63 S', year: 2024, type: 'daily_luxury', price: 0.118, annualMaintenance: 8, topSpeed: 186, horsepower: 603 },
    { id: 'VEH_003', name: '2024 Audi RS6 Avant', brand: 'Audi', model: 'RS6 Avant', year: 2024, type: 'daily_luxury', price: 0.125, annualMaintenance: 8, topSpeed: 190, horsepower: 591 },
    { id: 'VEH_004', name: '2024 Porsche 911 Carrera S', brand: 'Porsche', model: '911 Carrera S', year: 2024, type: 'daily_luxury', price: 0.135, annualMaintenance: 9, topSpeed: 191, horsepower: 443 },
    { id: 'VEH_005', name: '2024 Mercedes-Maybach S680', brand: 'Mercedes-Maybach', model: 'S680', year: 2024, type: 'daily_luxury', price: 0.232, annualMaintenance: 14, topSpeed: 155, horsepower: 621 },
    { id: 'VEH_006', name: '2024 Range Rover Autobiography', brand: 'Land Rover', model: 'Range Rover Autobiography', year: 2024, type: 'daily_luxury', price: 0.178, annualMaintenance: 12, topSpeed: 162, horsepower: 523 },
    { id: 'VEH_007', name: '2024 Bentley Continental GT', brand: 'Bentley', model: 'Continental GT', year: 2024, type: 'daily_luxury', price: 0.245, annualMaintenance: 15, topSpeed: 207, horsepower: 542 },
    { id: 'VEH_008', name: '2024 BMW M8 Competition', brand: 'BMW', model: 'M8 Competition', year: 2024, type: 'daily_luxury', price: 0.142, annualMaintenance: 9, topSpeed: 190, horsepower: 617 },
    { id: 'VEH_009', name: '2024 Mercedes-AMG GT63 S', brand: 'Mercedes-AMG', model: 'GT63 S 4-Door', year: 2024, type: 'daily_luxury', price: 0.165, annualMaintenance: 11, topSpeed: 196, horsepower: 630 },
    { id: 'VEH_010', name: '2024 Porsche Panamera Turbo', brand: 'Porsche', model: 'Panamera Turbo', year: 2024, type: 'daily_luxury', price: 0.195, annualMaintenance: 12, topSpeed: 196, horsepower: 670 },
    { id: 'VEH_011', name: '2024 Audi RS e-tron GT', brand: 'Audi', model: 'RS e-tron GT', year: 2024, type: 'daily_luxury', price: 0.148, annualMaintenance: 7, topSpeed: 155, horsepower: 637 },
    { id: 'VEH_012', name: '2024 Lexus LC 500', brand: 'Lexus', model: 'LC 500', year: 2024, type: 'daily_luxury', price: 0.105, annualMaintenance: 6, topSpeed: 168, horsepower: 471 },
    { id: 'VEH_013', name: '2024 Aston Martin Vantage', brand: 'Aston Martin', model: 'Vantage', year: 2024, type: 'daily_luxury', price: 0.155, annualMaintenance: 11, topSpeed: 195, horsepower: 503 },
    { id: 'VEH_014', name: '2024 Maserati GranTurismo Trofeo', brand: 'Maserati', model: 'GranTurismo Trofeo', year: 2024, type: 'daily_luxury', price: 0.205, annualMaintenance: 13, topSpeed: 199, horsepower: 542 },
    { id: 'VEH_015', name: '2024 Tesla Model S Plaid', brand: 'Tesla', model: 'Model S Plaid', year: 2024, type: 'daily_luxury', price: 0.108, annualMaintenance: 5, topSpeed: 200, horsepower: 1020 },

    // ─── SPORTS CAR (15) — $150K-$400K ───────────────────────────────────────
    { id: 'VEH_016', name: '2024 Porsche 911 Turbo S', brand: 'Porsche', model: '911 Turbo S', year: 2024, type: 'sports_car', price: 0.232, annualMaintenance: 14, topSpeed: 205, horsepower: 640 },
    { id: 'VEH_017', name: '2024 Porsche 911 GT3 RS', brand: 'Porsche', model: '911 GT3 RS', year: 2024, type: 'sports_car', price: 0.245, annualMaintenance: 15, topSpeed: 184, horsepower: 518 },
    { id: 'VEH_018', name: '2024 Mercedes-AMG GT Black Series', brand: 'Mercedes-AMG', model: 'GT Black Series', year: 2024, type: 'sports_car', price: 0.335, annualMaintenance: 18, topSpeed: 202, horsepower: 720 },
    { id: 'VEH_019', name: '2024 Audi R8 V10 Performance', brand: 'Audi', model: 'R8 V10 Performance', year: 2024, type: 'sports_car', price: 0.205, annualMaintenance: 13, topSpeed: 205, horsepower: 602 },
    { id: 'VEH_020', name: '2024 Aston Martin DB12', brand: 'Aston Martin', model: 'DB12', year: 2024, type: 'sports_car', price: 0.245, annualMaintenance: 14, topSpeed: 202, horsepower: 671 },
    { id: 'VEH_021', name: '2024 Lamborghini Huracán Tecnica', brand: 'Lamborghini', model: 'Huracán Tecnica', year: 2024, type: 'sports_car', price: 0.245, annualMaintenance: 16, topSpeed: 202, horsepower: 631 },
    { id: 'VEH_022', name: '2024 Aston Martin Vantage F1 Edition', brand: 'Aston Martin', model: 'Vantage F1', year: 2024, type: 'sports_car', price: 0.185, annualMaintenance: 12, topSpeed: 200, horsepower: 527 },
    { id: 'VEH_023', name: '2024 Acura NSX Type S', brand: 'Acura', model: 'NSX Type S', year: 2024, type: 'sports_car', price: 0.171, annualMaintenance: 10, topSpeed: 191, horsepower: 600 },
    { id: 'VEH_024', name: '2024 Nissan GT-R Nismo', brand: 'Nissan', model: 'GT-R Nismo', year: 2024, type: 'sports_car', price: 0.215, annualMaintenance: 12, topSpeed: 196, horsepower: 600 },
    { id: 'VEH_025', name: '2024 Chevrolet Corvette Z06', brand: 'Chevrolet', model: 'Corvette Z06', year: 2024, type: 'sports_car', price: 0.165, annualMaintenance: 9, topSpeed: 195, horsepower: 670 },
    { id: 'VEH_026', name: '2024 Maserati MC20', brand: 'Maserati', model: 'MC20', year: 2024, type: 'sports_car', price: 0.255, annualMaintenance: 15, topSpeed: 202, horsepower: 621 },
    { id: 'VEH_027', name: '2024 BMW M4 CSL', brand: 'BMW', model: 'M4 CSL', year: 2024, type: 'sports_car', price: 0.165, annualMaintenance: 10, topSpeed: 191, horsepower: 543 },
    { id: 'VEH_028', name: '2024 Lotus Emira V6', brand: 'Lotus', model: 'Emira V6', year: 2024, type: 'sports_car', price: 0.155, annualMaintenance: 9, topSpeed: 180, horsepower: 400 },
    { id: 'VEH_029', name: '2024 Porsche 911 Sport Classic', brand: 'Porsche', model: '911 Sport Classic', year: 2024, type: 'sports_car', price: 0.298, annualMaintenance: 16, topSpeed: 196, horsepower: 543 },
    { id: 'VEH_030', name: '2024 Mercedes-AMG SL63', brand: 'Mercedes-AMG', model: 'SL63', year: 2024, type: 'sports_car', price: 0.198, annualMaintenance: 12, topSpeed: 196, horsepower: 577 },

    // ─── SUPERCAR (15) — $400K-$1.5M ─────────────────────────────────────────
    { id: 'VEH_031', name: '2024 Lamborghini Revuelto', brand: 'Lamborghini', model: 'Revuelto', year: 2024, type: 'supercar', price: 0.605, annualMaintenance: 28, topSpeed: 217, horsepower: 1001 },
    { id: 'VEH_032', name: '2024 Ferrari 296 GTB', brand: 'Ferrari', model: '296 GTB', year: 2024, type: 'supercar', price: 0.422, annualMaintenance: 24, topSpeed: 205, horsepower: 819 },
    { id: 'VEH_033', name: '2024 Ferrari SF90 Stradale', brand: 'Ferrari', model: 'SF90 Stradale', year: 2024, type: 'supercar', price: 0.625, annualMaintenance: 32, topSpeed: 211, horsepower: 986 },
    { id: 'VEH_034', name: '2024 McLaren 750S', brand: 'McLaren', model: '750S', year: 2024, type: 'supercar', price: 0.345, annualMaintenance: 22, topSpeed: 206, horsepower: 740 },
    { id: 'VEH_035', name: '2024 McLaren Artura', brand: 'McLaren', model: 'Artura', year: 2024, type: 'supercar', price: 0.245, annualMaintenance: 18, topSpeed: 205, horsepower: 671 },
    { id: 'VEH_036', name: '2024 Lamborghini Huracán Sterrato', brand: 'Lamborghini', model: 'Huracán Sterrato', year: 2024, type: 'supercar', price: 0.275, annualMaintenance: 18, topSpeed: 162, horsepower: 602 },
    { id: 'VEH_037', name: '2024 Aston Martin DBS 770 Ultimate', brand: 'Aston Martin', model: 'DBS 770 Ultimate', year: 2024, type: 'supercar', price: 0.405, annualMaintenance: 24, topSpeed: 211, horsepower: 759 },
    { id: 'VEH_038', name: '2024 Ferrari Roma', brand: 'Ferrari', model: 'Roma', year: 2024, type: 'supercar', price: 0.248, annualMaintenance: 16, topSpeed: 199, horsepower: 612 },
    { id: 'VEH_039', name: '2024 Porsche 911 GT2 RS', brand: 'Porsche', model: '911 GT2 RS', year: 2018, type: 'supercar', price: 0.485, annualMaintenance: 26, topSpeed: 211, horsepower: 691 },
    { id: 'VEH_040', name: '2024 Lamborghini Aventador SVJ', brand: 'Lamborghini', model: 'Aventador SVJ', year: 2022, type: 'supercar', price: 0.715, annualMaintenance: 35, topSpeed: 217, horsepower: 759 },
    { id: 'VEH_041', name: '2024 Ferrari 812 Competizione', brand: 'Ferrari', model: '812 Competizione', year: 2024, type: 'supercar', price: 0.815, annualMaintenance: 38, topSpeed: 211, horsepower: 818 },
    { id: 'VEH_042', name: '2024 McLaren 765LT', brand: 'McLaren', model: '765LT', year: 2023, type: 'supercar', price: 0.395, annualMaintenance: 22, topSpeed: 205, horsepower: 755 },
    { id: 'VEH_043', name: '2024 Bentley Continental GT Speed', brand: 'Bentley', model: 'Continental GT Speed', year: 2024, type: 'supercar', price: 0.305, annualMaintenance: 18, topSpeed: 208, horsepower: 650 },
    { id: 'VEH_044', name: '2024 Aston Martin Valhalla', brand: 'Aston Martin', model: 'Valhalla', year: 2024, type: 'supercar', price: 0.825, annualMaintenance: 38, topSpeed: 217, horsepower: 998 },
    { id: 'VEH_045', name: '2024 Ferrari Purosangue', brand: 'Ferrari', model: 'Purosangue', year: 2024, type: 'supercar', price: 0.435, annualMaintenance: 26, topSpeed: 193, horsepower: 715 },

    // ─── HYPERCAR (8) — $1.5M-$5M ────────────────────────────────────────────
    { id: 'VEH_046', name: '2024 Bugatti Chiron Super Sport', brand: 'Bugatti', model: 'Chiron Super Sport', year: 2024, type: 'hypercar', price: 3.825, annualMaintenance: 95, topSpeed: 273, horsepower: 1577 },
    { id: 'VEH_047', name: '2024 Bugatti Chiron Pur Sport', brand: 'Bugatti', model: 'Chiron Pur Sport', year: 2023, type: 'hypercar', price: 3.595, annualMaintenance: 90, topSpeed: 217, horsepower: 1479 },
    { id: 'VEH_048', name: '2024 Koenigsegg Jesko Absolut', brand: 'Koenigsegg', model: 'Jesko Absolut', year: 2024, type: 'hypercar', price: 3.0, annualMaintenance: 75, topSpeed: 330, horsepower: 1600 },
    { id: 'VEH_049', name: '2024 Pagani Utopia', brand: 'Pagani', model: 'Utopia', year: 2024, type: 'hypercar', price: 2.5, annualMaintenance: 65, topSpeed: 217, horsepower: 852 },
    { id: 'VEH_050', name: '2024 Ferrari LaFerrari Aperta', brand: 'Ferrari', model: 'LaFerrari Aperta', year: 2017, type: 'hypercar', price: 4.5, annualMaintenance: 95, topSpeed: 217, horsepower: 949 },
    { id: 'VEH_051', name: '2024 McLaren Speedtail', brand: 'McLaren', model: 'Speedtail', year: 2020, type: 'hypercar', price: 2.65, annualMaintenance: 70, topSpeed: 250, horsepower: 1035 },
    { id: 'VEH_052', name: '2024 Rimac Nevera', brand: 'Rimac', model: 'Nevera', year: 2024, type: 'hypercar', price: 2.4, annualMaintenance: 55, topSpeed: 258, horsepower: 1914 },
    { id: 'VEH_053', name: '2024 Aston Martin Valkyrie', brand: 'Aston Martin', model: 'Valkyrie', year: 2023, type: 'hypercar', price: 3.5, annualMaintenance: 85, topSpeed: 217, horsepower: 1140 },

    // ─── VINTAGE / CLASSIC (5) — $200K-$3M ───────────────────────────────────
    { id: 'VEH_054', name: '1973 Porsche 911 Carrera RS', brand: 'Porsche', model: '911 Carrera RS', year: 1973, type: 'vintage', price: 1.2, annualMaintenance: 22, topSpeed: 152, horsepower: 210 },
    { id: 'VEH_055', name: '1968 Ferrari Daytona', brand: 'Ferrari', model: '365 GTB/4 Daytona', year: 1968, type: 'vintage', price: 0.825, annualMaintenance: 18, topSpeed: 174, horsepower: 352 },
    { id: 'VEH_056', name: '1955 Mercedes-Benz 300SL Gullwing', brand: 'Mercedes-Benz', model: '300SL Gullwing', year: 1955, type: 'vintage', price: 1.85, annualMaintenance: 28, topSpeed: 161, horsepower: 215 },
    { id: 'VEH_057', name: '1965 Shelby Cobra 427', brand: 'Shelby', model: 'Cobra 427', year: 1965, type: 'vintage', price: 1.55, annualMaintenance: 20, topSpeed: 165, horsepower: 425 },
    { id: 'VEH_058', name: '1971 Lamborghini Miura SV', brand: 'Lamborghini', model: 'Miura SV', year: 1971, type: 'vintage', price: 2.95, annualMaintenance: 38, topSpeed: 180, horsepower: 380 },

    // ─── LUXURY SUV (2) — $200K-$700K ────────────────────────────────────────
    { id: 'VEH_059', name: '2024 Rolls-Royce Cullinan Black Badge', brand: 'Rolls-Royce', model: 'Cullinan Black Badge', year: 2024, type: 'luxury_suv', price: 0.485, annualMaintenance: 32, topSpeed: 155, horsepower: 600 },
    { id: 'VEH_060', name: '2024 Lamborghini Urus Performante', brand: 'Lamborghini', model: 'Urus Performante', year: 2024, type: 'luxury_suv', price: 0.265, annualMaintenance: 18, topSpeed: 190, horsepower: 657 },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Devuelve todos los vehículos disponibles. Los vehículos NO se filtran por
 * equipo (el mercado de coches de lujo es uniforme nacional en NFL real).
 */
export function getAllVehicles(): Vehicle[] {
    return VEHICLES;
}

/**
 * Devuelve vehículos filtrados por tipo.
 */
export function getVehiclesByType(type: VehicleType): Vehicle[] {
    return VEHICLES.filter(v => v.type === type);
}