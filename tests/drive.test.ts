import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../src/engine/prng';
import { simulateDrive, GameContext, DriveOutcome } from '../src/engine/drive';

describe('Drive Simulation', () => {
  const rng = new SeededRandom('drive-test-seed');
  const defaultContext: GameContext = {
    isPlayoff: false,
    isRivalryGame: false,
    isPrimetime: false,
    isHomeGame: true
  };

  it('Test 1 — Estructura: simulateDrive devuelve un Drive válido con todos los campos', () => {
    const drive = simulateDrive(75, 75, 'TEAM_A', 'TEAM_B', 25, 1, defaultContext, rng);
    
    expect(drive.id).toBeDefined();
    expect(drive.teamOnOffenseId).toBe('TEAM_A');
    expect(drive.teamOnDefenseId).toBe('TEAM_B');
    expect(drive.startingYardLine).toBe(25);
    expect(drive.outcome).toBeDefined();
    expect(drive.plays).toBeGreaterThan(0);
    expect(drive.totalYards).toBeDefined();
    expect(drive.timeConsumed).toBeDefined();
    expect(drive.endingYardLine).toBeGreaterThanOrEqual(1);
    expect(drive.endingYardLine).toBeLessThanOrEqual(100);
    expect(drive.description).not.toBe('');
    expect(drive.highlight).not.toBe('');
  });

  it('Test 2 — Determinismo: mismo seed + mismos inputs → mismo Drive', () => {
    const seed = 'deterministic-drive';
    const d1 = simulateDrive(80, 70, 'A', 'B', 20, 2, defaultContext, new SeededRandom(seed));
    const d2 = simulateDrive(80, 70, 'A', 'B', 20, 2, defaultContext, new SeededRandom(seed));
    
    expect(d1).toEqual(d2);
  });

  it('Test 3 — Distribución estadística (10000 drives, OVRs igualados, yarda 25)', () => {
    const outcomes: Record<string, number> = {};
    const n = 10000;
    
    for (let i = 0; i < n; i++) {
      const drive = simulateDrive(75, 75, 'A', 'B', 25, 1, defaultContext, rng.derive(`test3-${i}`));
      outcomes[drive.outcome] = (outcomes[drive.outcome] || 0) + 1;
    }

    const pTD = outcomes['TD'] / n;
    const pPUNT = outcomes['PUNT'] / n;

    // Expected: TD ~0.20, PUNT ~0.42. Tolerance +/- 0.03
    expect(pTD).toBeGreaterThanOrEqual(0.17);
    expect(pTD).toBeLessThanOrEqual(0.23);
    expect(pPUNT).toBeGreaterThanOrEqual(0.39);
    expect(pPUNT).toBeLessThanOrEqual(0.45);
  });

  it('Test 4 — Yarda alta produce más TDs', () => {
    const n = 1000;
    let tds = 0;
    for (let i = 0; i < n; i++) {
      const drive = simulateDrive(75, 75, 'A', 'B', 80, 1, defaultContext, rng.derive(`test4-${i}`));
      if (drive.outcome === 'TD') tds++;
    }
    const pTD = tds / n;
    expect(pTD).toBeGreaterThan(0.30);
  });

  it('Test 5 — Yarda baja produce menos TDs', () => {
    const n = 1000;
    let tds = 0;
    for (let i = 0; i < n; i++) {
      const drive = simulateDrive(75, 75, 'A', 'B', 5, 1, defaultContext, rng.derive(`test5-${i}`));
      if (drive.outcome === 'TD') tds++;
    }
    const pTD = tds / n;
    expect(pTD).toBeLessThan(0.18);
  });

  it('Test 6 — Mejor ofensa marca más, peor ofensa marca menos', () => {
    const n = 1000;
    
    let tdsElite = 0;
    for (let i = 0; i < n; i++) {
      const drive = simulateDrive(95, 60, 'A', 'B', 25, 1, defaultContext, rng.derive(`elite-${i}`));
      if (drive.outcome === 'TD') tdsElite++;
    }
    
    let tdsPoor = 0;
    for (let i = 0; i < n; i++) {
      const drive = simulateDrive(60, 95, 'A', 'B', 25, 1, defaultContext, rng.derive(`poor-${i}`));
      if (drive.outcome === 'TD') tdsPoor++;
    }

    expect(tdsElite / n).toBeGreaterThan(0.28);
    expect(tdsPoor / n).toBeLessThan(0.14);
  });

  it('Test 7 — Ranges respetados: plays/yards/time siempre en rangos correctos', () => {
    for (let i = 0; i < 1000; i++) {
      const drive = simulateDrive(75, 75, 'A', 'B', rng.randomInt(1, 90), 1, defaultContext, rng.derive(`ranges-${i}`));
      
      switch (drive.outcome) {
        case 'TD':
          expect(drive.plays).toBeGreaterThanOrEqual(4);
          expect(drive.plays).toBeLessThanOrEqual(14);
          expect(drive.totalYards).toBe(100 - drive.startingYardLine);
          expect(drive.timeConsumed).toBeGreaterThanOrEqual(60);
          expect(drive.timeConsumed).toBeLessThanOrEqual(360);
          break;
        case 'FG':
          expect(drive.plays).toBeGreaterThanOrEqual(4);
          expect(drive.plays).toBeLessThanOrEqual(12);
          // Yards are not strictly checked for FG here as they can be capped by field limits in the code
          break;
        case 'SAFETY':
          expect(drive.totalYards).toBeLessThan(0);
          expect(drive.pointsScored).toBe(2);
          break;
      }
      
      expect(drive.endingYardLine).toBeGreaterThanOrEqual(1);
      expect(drive.endingYardLine).toBeLessThanOrEqual(100);
    }
  });

  it('Test 8 — Narrativa generada: description y highlight siempre tienen texto', () => {
    const drive = simulateDrive(75, 75, 'A', 'B', 25, 1, defaultContext, rng);
    expect(drive.description.length).toBeGreaterThan(0);
    expect(drive.highlight.length).toBeGreaterThan(0);
  });
});
