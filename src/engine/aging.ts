import { Position } from './types';

/**
 * Calculates the age factor for OVR according to SIMULATION_ENGINE section 4.5.
 * Prime ages vary by position:
 * - RB prime: 24-26
 * - QB/WR prime: 27-32
 */
export function getAgeFactor(position: Position, age: number): number {
  if (age <= 23) return 0.95; // Rookie penalty

  if (position === 'QB') {
    if (age <= 26) return 1.00;
    if (age <= 32) return 1.05; // Elite prime
    if (age <= 35) return 1.00;
    return 0.95; // Decline
  }

  if (position === 'RB') {
    if (age <= 26) return 1.05; // Peak RB performance
    if (age <= 29) return 1.00;
    if (age <= 32) return 0.92; // Sharp decline
    return 0.85; // Retired or extreme outlier
  }

  if (position === 'WR') {
    if (age <= 26) return 1.00;
    if (age <= 32) return 1.05; // WR prime
    if (age <= 35) return 0.95;
    return 0.90;
  }

  return 1.00;
}
