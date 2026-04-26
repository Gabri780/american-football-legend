# Simulation Engine — Documento técnico

**Versión:** 1.0
**Estado:** especificación para implementación con Antigravity
**Lenguaje target:** TypeScript

---

## 0. Introducción

### 0.1 Propósito
Define el motor de simulación: estructuras de datos, fórmulas matemáticas y algoritmos que producen una carrera realista de fútbol americano. Este documento es la especificación técnica que el agente de Antigravity usa para escribir código.

### 0.2 Decisiones cerradas

| Decisión | Implementación |
|----------|----------------|
| Profundidad de simulación | Por DRIVES (posesiones), no por jugada |
| Cálculo de OVR | Fórmula con ARQUETIPOS por posición |
| Visibilidad de atributos | Físicos VISIBLES, mentales/técnicos OCULTOS hasta scouting |
| Roster | Mínimo viable: ~55 jugadores con identidad en toda la liga |
| Varianza | Modulada por contexto (compostura, presión, momentum) |
| Fatiga | Acumulada por temporada, bye week recupera |
| Selección arquetipo usuario | Aleatoria por atributos generados (no elegida) |

### 0.3 Notación
- Lenguaje: TypeScript
- Rangos: `[40, 99]` significa entre 40 y 99 inclusive
- Probabilidades en decimal: `0.65` = 65%

---

## 1. Filosofía del motor

### 1.1 Realismo, no simulación perfecta
- Stats agregadas anuales caen dentro de rangos NFL históricos
- Outliers existen pero son raros
- Regresión a la media es real
- Narrativas emergen de los números, no se fuerzan

### 1.2 Determinismo controlado
Toda la aleatoriedad usa un PRNG (generador pseudoaleatorio) con seed:
- Permite testing reproducible
- Permite debugging
- Evita "reload abuse"

**Librería:** seedrandom (npm) o equivalente. Cada partida tiene seed maestro; cada partido deriva sub-seed.

### 1.3 Capas del motor

```
CAPA 5: NARRATIVA  (eventos, titulares, lore)
CAPA 4: TEMPORADA  (calendario, playoffs)
CAPA 3: PARTIDO    (drives, marcador, stats)
CAPA 2: DRIVE      (jugadas resumen)
CAPA 1: JUGADOR    (atributos, fatiga, OVR)
CAPA 0: PRNG       (aleatoriedad seedeable)
```

Cada capa solo conoce las inferiores.

---

## 2. Estructura de jugador

### 2.1 Concepto
Modelamos solo ~55 jugadores como individuos completos: el jugador-usuario + ~5 compañeros clave + ~50 estrellas de la liga. El resto contribuye solo como OVR agregado del equipo.

### 2.2 Estructura completa

```typescript
interface Player {
  // Identidad
  id: string;
  firstName: string;
  lastName: string;
  position: 'QB' | 'RB' | 'WR';
  archetype: Archetype;
  jerseyNumber: number;

  // Físico (visibles al jugador)
  age: number;             // 21-40
  heightCm: number;        // 175-205
  weightKg: number;        // 80-130
  speed: number;           // 40-99
  acceleration: number;    // 40-99
  agility: number;         // 40-99
  strength: number;        // 40-99
  stamina: number;         // 40-99
  durability: number;      // 40-99

  // Mentales (ocultos hasta scouting)
  footballIQ: number;      // 40-99
  awareness: number;       // 40-99
  composure: number;       // 40-99
  leadership: number;      // 40-99
  workEthic: number;       // 40-99

  // Específicos por posición
  positionalSkills: QBSkills | RBSkills | WRSkills;

  // Potencial (oculto, define techo)
  potential: number;       // 40-99

  // Estado dinámico
  freshness: number;       // 0-100
  morale: number;          // 0-100
  injuries: Injury[];
  chemistry: Map<string, number>; // playerId -> química [0-100]

  // Carrera
  draftYear: number;
  draftRound: number;
  draftPick: number;
  collegeId: string;
  contract: Contract;
  careerStats: SeasonStats[];

  // Metadata
  scoutingLevel: number;   // 0-100
  overall: number;         // calculated, 40-99
}
```

### 2.3 Skills por posición

```typescript
interface QBSkills {
  armStrength: number;     // 40-99
  shortAccuracy: number;   // 40-99
  mediumAccuracy: number;  // 40-99
  deepAccuracy: number;    // 40-99
  pocketPresence: number;  // 40-99
  mobility: number;        // 40-99
  readDefense: number;     // 40-99
  decisionMaking: number;  // 40-99
  playAction: number;      // 40-99
}

interface RBSkills {
  vision: number;          // 40-99
  jukeMove: number;        // 40-99
  spinMove: number;        // 40-99
  trucking: number;        // 40-99
  ballSecurity: number;    // 40-99
  routeRunning: number;    // 40-99
  catching: number;        // 40-99
  passProtection: number;  // 40-99
  breakawaySpeed: number;  // 40-99
}

interface WRSkills {
  hands: number;           // 40-99
  routeRunning: number;    // 40-99
  separation: number;      // 40-99
  catchInTraffic: number;  // 40-99
  yacAbility: number;      // 40-99
  release: number;         // 40-99
  bodyControl: number;     // 40-99
  blocking: number;        // 40-99
  contestedCatches: number;// 40-99
}
```

### 2.4 Visibilidad de atributos

| Categoría | Visibilidad inicial | Descubrimiento |
|-----------|---------------------|----------------|
| Físicos | VISIBLES siempre | N/A |
| Mentales | OCULTOS al inicio | Se revelan jugando |
| Técnicos | RANGO inicial ("alta") | Rango se estrecha con experiencia |
| Potencial | OCULTO siempre | Solo se ve techo alcanzado |

### 2.5 Sistema de scouting

| Scouting Level | Qué se revela | Cómo se gana |
|---------------|---------------|--------------|
| 0-25 | Solo físicos + rangos amplios técnicos | Inicio rookie |
| 25-50 | Mentales en rango amplio, técnicos ±10 | 1ª temporada completa |
| 50-75 | Mentales rango medio, técnicos ±5 | 2ª-3ª temporada |
| 75-100 | Todos exactos | 4ª+ temporada |

---

## 3. Arquetipos por posición

### 3.1 Concepto
4 arquetipos por posición. Cada uno define:
- Distribución típica de atributos al generar
- Fórmula de OVR diferente
- Narrativa propia
- Es VISIBLE al jugador

### 3.2 QB

| Arquetipo | Inspiración | Características |
|-----------|-------------|-----------------|
| Pocket Passer | Tom Brady, Manning | Brazo medio-alto, precisión élite, IQ máximo, movilidad baja |
| Gunslinger | Favre, Mahomes | Brazo élite, deep accuracy alta, decisión variable, INTs |
| Mobile QB | Lamar, Vick | Movilidad élite, brazo medio, agility alta |
| Game Manager | Smith, Cousins | Precisión corta/media alta, decisión élite, brazo medio |

### 3.3 RB

| Arquetipo | Inspiración | Características |
|-----------|-------------|-----------------|
| Power Back | Henry, Lynch | Fuerza élite, trucking máximo, velocidad media |
| Speed Back | C. Johnson, Charles | Velocidad élite, breakaway máximo, fuerza media |
| Receiving Back | McCaffrey, Faulk | Manos élite, route running alto, balance equilibrado |
| Elusive Back | Sanders, Barkley | Agility y juke élite, vision máxima |

### 3.4 WR

| Arquetipo | Inspiración | Características |
|-----------|-------------|-----------------|
| Deep Threat | Hill, D. Jackson | Velocidad y separation élite |
| Possession | Fitzgerald, K. Allen | Hands élite, route running máximo |
| Red Zone | Mike Evans, Megatron | Tamaño y contested catch élite |
| YAC Specialist | Deebo, Diggs | YAC ability máxima, agility alta |

### 3.5 Distribución de atributos al generar — QB

| Atributo | Pocket | Gunslinger | Mobile | Manager |
|----------|--------|-----------|--------|---------|
| Arm Strength | 70-90 | 85-99 | 70-85 | 65-80 |
| Short Accuracy | 85-99 | 70-85 | 70-85 | 85-99 |
| Deep Accuracy | 75-90 | 85-99 | 65-80 | 60-75 |
| Mobility | 40-65 | 55-75 | 85-99 | 55-75 |
| Pocket Presence | 85-99 | 65-80 | 60-75 | 75-90 |
| Decision Making | 80-95 | 60-80 | 70-85 | 85-99 |
| Football IQ | 85-99 | 70-85 | 70-85 | 85-99 |

---

## 4. Cálculo de OVR

### 4.1 Fórmula general

```
OVR = Σ (atributo_i × peso_i) × factor_edad × factor_potencial
```

- Suma de pesos siempre = 1.0
- factor_edad: 0.95-1.05 según prime de la posición
- factor_potencial: 0.98-1.02

### 4.2 Pesos OVR — QB

| Atributo | Pocket | Gunslinger | Mobile | Manager |
|----------|--------|-----------|--------|---------|
| Arm Strength | 0.10 | 0.20 | 0.10 | 0.05 |
| Short Accuracy | 0.15 | 0.10 | 0.15 | 0.20 |
| Medium Accuracy | 0.15 | 0.10 | 0.10 | 0.15 |
| Deep Accuracy | 0.10 | 0.20 | 0.05 | 0.05 |
| Pocket Presence | 0.15 | 0.05 | 0.05 | 0.10 |
| Mobility | 0.05 | 0.10 | 0.25 | 0.05 |
| Read Defense | 0.10 | 0.05 | 0.10 | 0.15 |
| Decision Making | 0.10 | 0.05 | 0.10 | 0.15 |
| Football IQ | 0.05 | 0.05 | 0.05 | 0.05 |
| Composure | 0.05 | 0.10 | 0.05 | 0.05 |
| **TOTAL** | **1.00** | **1.00** | **1.00** | **1.00** |

### 4.3 Pesos OVR — RB

| Atributo | Power | Speed | Receiving | Elusive |
|----------|-------|-------|-----------|---------|
| Speed | 0.05 | 0.20 | 0.10 | 0.10 |
| Acceleration | 0.10 | 0.15 | 0.10 | 0.10 |
| Agility | 0.05 | 0.10 | 0.15 | 0.20 |
| Strength | 0.20 | 0.05 | 0.05 | 0.05 |
| Vision | 0.15 | 0.10 | 0.10 | 0.20 |
| Juke Move | 0.05 | 0.05 | 0.05 | 0.15 |
| Trucking | 0.20 | 0.05 | 0.05 | 0.05 |
| Ball Security | 0.10 | 0.10 | 0.10 | 0.05 |
| Catching | 0.05 | 0.05 | 0.20 | 0.05 |
| Route Running | 0.00 | 0.05 | 0.10 | 0.05 |
| Breakaway Speed | 0.05 | 0.10 | 0.00 | 0.00 |

### 4.4 Pesos OVR — WR

| Atributo | Deep | Possession | RedZone | YAC |
|----------|------|-----------|---------|-----|
| Speed | 0.20 | 0.05 | 0.05 | 0.10 |
| Acceleration | 0.10 | 0.05 | 0.05 | 0.10 |
| Agility | 0.05 | 0.10 | 0.05 | 0.20 |
| Strength | 0.05 | 0.05 | 0.15 | 0.05 |
| Hands | 0.10 | 0.20 | 0.15 | 0.10 |
| Route Running | 0.10 | 0.20 | 0.10 | 0.10 |
| Separation | 0.20 | 0.15 | 0.05 | 0.10 |
| Catch in Traffic | 0.05 | 0.10 | 0.10 | 0.05 |
| YAC Ability | 0.05 | 0.05 | 0.05 | 0.20 |
| Contested Catches | 0.05 | 0.05 | 0.25 | 0.00 |
| Body Control | 0.05 | 0.00 | 0.00 | 0.00 |

### 4.5 Factor de edad

| Edad | QB | RB | WR | Notas |
|------|-----|-----|-----|-------|
| 21-23 | 0.95 | 0.95 | 0.95 | Rookie penalty |
| 24-26 | 1.00 | 1.05 | 1.00 | RB prime |
| 27-29 | 1.05 | 1.00 | 1.05 | QB/WR prime |
| 30-32 | 1.05 | 0.92 | 1.00 | RB declina |
| 33-35 | 1.00 | 0.85 | 0.95 | RB ya no existe |
| 36+ | 0.95 | N/A | 0.90 | Solo QBs élite |

### 4.6 Ejemplo numérico

```
Tyler Boone, 27, Pocket Passer
Atributos: ArmStr 82, ShortAcc 95, MediumAcc 92, DeepAcc 85,
           Pocket 94, Mob 55, ReadDef 90, DecMak 88, IQ 96, Comp 89

Aplicar pesos Pocket:
  82×0.10 + 95×0.15 + 92×0.15 + 85×0.10 + 94×0.15 +
  55×0.05 + 90×0.10 + 88×0.10 + 96×0.05 + 89×0.05
  = 88.65

Factor edad (27 QB → 1.05):
  88.65 × 1.05 = 93.08

OVR = 93 (élite)
```

---

## 5. Estructura de equipo

### 5.1 Estructura completa

```typescript
interface Team {
  // Identidad
  id: string;
  city: string;
  name: string;
  conference: 'Eastern' | 'Western';
  division: 'East' | 'North' | 'South' | 'Atlantic' |
            'Central' | 'Mountain' | 'Pacific' | 'Southwest';
  primaryColor: string;
  secondaryColor: string;
  rivalId: string;

  // Personal técnico
  headCoach: Coach;
  offensiveCoordinator: Coordinator;
  defensiveCoordinator: Coordinator;

  // Roster con identidad (~5 propios)
  keyPlayers: Player[];

  // Resto del roster (agregado)
  offensiveRating: number;  // 0-99
  defensiveRating: number;  // 0-99
  specialTeamsRating: number; // 0-99

  // Temporada
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;

  // Económico
  salaryCap: number;
  capUsed: number;
}
```

### 5.2 OVR ofensivo total

```
OVR_off_total = (Σ OVR_jugadores_id × peso_pos) + (offensiveRating × factor_resto)
```

Pesos del jugador-usuario en OVR del equipo:
- QB: 0.40
- RB: 0.20
- WR1: 0.18
- WR2: 0.12

### 5.3 Coach y Coordinator

```typescript
interface Coach {
  id: string;
  name: string;
  age: number;
  philosophy: 'Aggressive' | 'Conservative' | 'Balanced';
  playerDevelopment: number;  // 40-99
  motivation: number;          // 40-99
  reputation: number;          // 0-100
  yearsWithTeam: number;
}

interface Coordinator {
  id: string;
  name: string;
  side: 'Offense' | 'Defense';
  scheme: string;     // 'West Coast', 'Air Raid', '3-4', etc
  ratingBoost: number; // -5 a +5
  fitWithPlayer: number; // 0-100
}
```

---

## 6. Simulación de drive

### 6.1 Concepto
El drive es la unidad atómica de simulación. Un partido = ~22-26 drives totales. Cada drive es un proceso estocástico con outcome final.

### 6.2 Estructura del drive

```typescript
interface Drive {
  id: string;
  teamOnOffense: string;
  startingYardLine: number;
  startingTime: GameClock;
  quarter: 1 | 2 | 3 | 4 | 'OT';

  plays: number;
  totalYards: number;
  timeConsumed: number;

  outcome: 'TD' | 'FG' | 'MISSED_FG' | 'PUNT' |
           'TURNOVER_INT' | 'TURNOVER_FUMBLE' |
           'DOWNS' | 'SAFETY' | 'END_HALF' | 'END_GAME';

  pointsScored: number;
  playerStats: PlayerDriveStats;
  description: string;
  highlightPlay?: string;
}
```

### 6.3 Algoritmo

```typescript
function simulateDrive(
  offense: Team,
  defense: Team,
  startYard: number,
  context: GameContext,
  rng: SeededRandom
): Drive {
  // 1. Ventaja ofensiva neta
  const matchupDelta = offense.totalOffensiveRating() - defense.totalDefensiveRating();

  // 2. Modular por contexto
  const adjustedDelta = applyContextModifiers(matchupDelta, context);

  // 3. Probabilidades base de outcomes
  const probs = computeOutcomeProbabilities(adjustedDelta, startYard, context);

  // 4. Sortear con PRNG
  const outcome = weightedRandom(probs, rng);

  // 5. Generar detalles
  const drive = generateDriveDetails(outcome, offense, defense, startYard, rng);

  // 6. Stats del jugador
  drive.playerStats = computePlayerStats(drive, offense.userPlayer, rng);

  // 7. Narrativa
  drive.description = generateNarrative(drive, offense, defense);

  return drive;
}
```

### 6.4 Probabilidades base (drive desde yarda 25, OVRs igualados)

| Outcome | Prob base | Notas |
|---------|-----------|-------|
| TD | 0.20 | 20% drives terminan en TD en NFL real |
| FG (acierto) | 0.18 | Field goal exitoso |
| PUNT | 0.42 | Outcome más común |
| TURNOVER (INT) | 0.07 | Modulado por arquetipo QB |
| TURNOVER (Fumble) | 0.05 | Modulado por ball security |
| DOWNS | 0.04 | Falla 4ª oportunidad |
| MISSED FG | 0.03 | Patada fallada |
| END_HALF/GAME | 0.01 | Tiempo termina |

### 6.5 Modulación por matchupDelta

```
P_TD_ajustada = P_TD_base × (1 + matchupDelta × 0.015)
P_TURNOVER_ajustada = P_TURNOVER_base × (1 - matchupDelta × 0.012)
```

### 6.6 Modulación por yarda inicial

| Yarda inicial | Mult P(TD) | Mult P(FG) | Mult P(PUNT) |
|---------------|-----------|-----------|-------------|
| 1-15 (propia) | 0.70 | 0.85 | 1.20 |
| 16-30 | 0.90 | 0.95 | 1.10 |
| 31-50 (medio) | 1.00 | 1.00 | 1.00 |
| 51-70 (territorio rival) | 1.30 | 1.20 | 0.70 |
| 71-99 (cerca end zone) | 1.80 | 1.10 | 0.20 |

### 6.7 Stats del jugador en un drive

#### QB
- yardasPorAire = yardasTotales × %_aire (Air Raid 75%, balanced 60%, run-heavy 45%)
- nIntentos = yardasPorAire / yardasPromedio
- nCompleciones = nIntentos × completionRate
- completionRate = base 0.62 + (shortAccuracy - 75) × 0.005
- Si outcome = TD por pase: passTD += 1
- Si outcome = INT: INTs += 1

#### RB
- yardasPorTierra = yardasTotales × (1 - %_aire) × %_carga_RB
- nCarreras = yardasPorTierra / promedioYardasPorCarrera
- promedioYardasPorCarrera = 4.2 + (vision - 75) × 0.03 + (trucking - 75) × 0.02
- Si outcome = TD carrera: rushTD += 1
- Si outcome = FUMBLE: fumble += 1 (modulado por ballSecurity)

#### WR
- WR1 capta ~30% de pases del QB
- WR2 capta ~22%
- yardasRecibidas = yardasPorAireTotales × %_carga_WR
- Si TD por pase y tu WR fue receptor: recTD += 1

### 6.8 Ejemplo de drive

```
Setup:
  Ofensa Cavalry (OVR 87) vs defensa Blizzard (OVR 79)
  matchupDelta = +8
  Yarda inicial: 32 (propia)
  4º cuarto, 6:42 restantes

Probabilidades:
  P(TD) = 0.20 × 1.12 × 1.00 = 0.224
  P(FG) = 0.18 × 1.10 × 1.00 = 0.198
  P(PUNT) = 0.42 × 0.90 × 1.00 = 0.378
  ...

PRNG sortea: 0.156 → TD

Drive generado:
  Plays: 9, Yardas: 68, Tiempo: 4:18
  Yardas por aire: 60% × 68 = 41
  Intentos: 5, Completaciones: 4 (80% por shortAcc 95)
  TD pase de 12 yardas

PlayerStats Tyler Boone:
  passYards: 41, completions: 4/5, passTD: 1, INT: 0
```

---

## 7. Sistema de varianza

### 7.1 Concepto
Varianza modulada por contexto: la suerte existe pero atenuada por mentalidad y amplificada por presión.

### 7.2 Aplicación a stats

```
stat_real = stat_calculada × (1 + variance × random_normal)
```

- random_normal: distribución normal media 0, std 1, truncado [-2, +2]
- variance: 0.05 a 0.25
- variance 0.10 → 95% resultados en ±20% del esperado

### 7.3 Cálculo de variance

```
variance = 0.20 - (composure - 50) × 0.0015 + factor_presion + factor_lesion
```

Componentes:
- Base: 0.20
- Compostura: cada pt sobre 50 reduce 0.0015. Composure 99 → base 0.13
- Factor presión: +0.03 playoff, +0.02 contra rival, +0.02 primetime, +0.01 road
- Factor lesión: +0.05 si lesión activa menor

### 7.4 Anti-varianza (clamps)
- Stats ofensivas: 50%-200% del esperado
- INTs: máx 4 por partido
- Fumbles: máx 3 por partido

---

## 8. Sistema de fatiga

### 8.1 Concepto
Atributo dinámico `freshness` (0-100) que se desgasta con partidos y se recupera con bye/offseason.

### 8.2 Niveles
- 100: totalmente fresco
- 80-99: óptimo, sin penalización
- 60-79: ligero cansancio, -5% rendimiento
- 40-59: cansado, -12% rendimiento, +20% riesgo lesión
- 0-39: agotado, -25% rendimiento, +40% riesgo lesión

### 8.3 Pérdida por partido

```
freshness_perdida = base_pos + carga_partido - stamina_factor
```

| Posición | Base perdida | Mod. carga | Recup. bye |
|----------|--------------|-----------|-----------|
| QB | 3-5 pts | +1 por cada 10 dropbacks sobre 30 | +25 |
| RB | 8-12 pts | +1 por cada 5 carries sobre 15 | +30 |
| WR | 4-7 pts | +1 por cada 5 targets sobre 8 | +25 |

- stamina_factor: cada pt sobre 70 reduce pérdida 0.05
- Tras temporada: freshness se resetea a 100

### 8.4 Diferencia por arquetipo
- Power Backs: pérdida más rápida
- Pocket Passer QB: pérdida mínima
- Mobile QB: pérdida tipo RB ligero
- Speed Backs: pérdida intermedia + mayor probabilidad de lesión

---

## 9. Progresión de atributos

### 9.1 Algoritmo anual

```typescript
function progressPlayer(player: Player, year: Year): Player {
  const progressionPoints = calculateProgressionPoints(player);
  const distribution = distributeProgression(player.archetype, progressionPoints);
  const decline = calculateAgeDecline(player);
  player = applyChanges(player, distribution, decline);
  player.overall = computeOverall(player);
  return player;
}
```

### 9.2 Puntos de progresión

```
progressionPoints = base_edad + workEthic_bonus + coach_bonus + perf_bonus
```

| Componente | Valor |
|-----------|-------|
| Base por edad | 21-23: +12 / 24-26: +6 / 27-29: +2 / 30+: 0 |
| Bonus workEthic | +(workEthic - 70) × 0.05 |
| Bonus coach dev | +(coach.playerDevelopment - 70) × 0.04 |
| Bonus rendimiento | +3 Pro Roster / +5 All-Pro / +2 record personal |

### 9.3 Declive por edad

| Edad | Físicos | Técnicos | Mentales |
|------|---------|----------|----------|
| 21-26 | 0 | 0 | 0 |
| 27-29 | -1 vel/acel | 0 | +1 IQ/awareness |
| 30-32 | -2 físicos | -1 técnicos físicos | +1 IQ/composure |
| 33-35 | -3 físicos | -2 técnicos | +1 |
| 36+ | -4 físicos | -3 técnicos | 0 |

### 9.4 Potencial (techo)

| Potential | Descripción |
|-----------|-------------|
| 50-65 | Limitado |
| 66-80 | Sólido titular |
| 81-90 | Estrella |
| 91-99 | Generacional, candidato HOF |

---

## 10. Generación procedural

### 10.1 Generación inicial de la liga

```typescript
function generateInitialLeague(seed: string): League {
  const rng = new SeededRandom(seed);
  const teams = loadStaticTeams(); // de LIGA_FICTICIA

  for (const team of teams) {
    team.headCoach = generateCoach(rng);
    team.offensiveCoordinator = generateCoordinator('Offense', rng);
    team.defensiveCoordinator = generateCoordinator('Defense', rng);
  }

  const stars = generateStars(50, rng);
  distributeStarsAcrossTeams(stars, teams);

  for (const team of teams) {
    team.offensiveRating = generateAggregateRating(team, 'O', rng);
    team.defensiveRating = generateAggregateRating(team, 'D', rng);
  }

  return new League(teams);
}
```

### 10.2 Generación del jugador-usuario
- Selecciona posición (QB / RB / WR)
- Sistema asigna arquetipo según atributos generados (no eligible por usuario)
- Genera atributos en rangos del arquetipo
- Potencial alto-medio (75-90 base)
- Universidad ficticia aleatoria
- Nombre y apellido del banco

### 10.3 Generación del draft anual

```typescript
function generateDraftClass(year: Year, rng: SeededRandom): Player[] {
  // Solo modelamos individualmente:
  //   - Jugador-usuario (si va a ser drafteado)
  //   - 5-10 estrellas top picks
  //   - Resto agregados en stats de equipo

  const stars = [];
  for (let i = 0; i < 10; i++) {
    stars.push(generateRookie(randomPosition(rng), rng, { potentialMin: 80 }));
  }
  return stars;
}
```

---

## 11. Simulación de temporada

### 11.1 Calendario
- 17 semanas regular
- Cada equipo: 17 partidos + 1 bye (18 semanas)
- 14 equipos a playoffs (7 por conferencia)
- Playoffs: Wild Card, Divisional, Conference, Championship Bowl

### 11.2 Loop semanal

```typescript
function simulateWeek(league: League, week: number): WeekResult {
  const games = league.scheduleForWeek(week);
  const results = [];

  for (const game of games) {
    if (game.involvesUser()) {
      results.push(simulateUserGame(game)); // detallado, drives
    } else {
      results.push(simulateBackgroundGame(game)); // rápido, estadístico
    }
  }

  league.applyFatigue(results);
  league.resolveInjuries(results);
  league.checkEventTriggers(results);

  return { week, results };
}
```

### 11.3 Background games (simulación rápida)
- Calcular OVR ofensivo y defensivo
- Generar puntuaciones probabilísticamente (distribución normal por OVR)
- Solo marcador importa para ranking
- Si una estrella generada juega, se generan stats individuales

---

## 12. Validación y testing

### 12.1 Tests obligatorios
Cada función DEBE tener tests unitarios. Sin tests, fórmulas se rompen.

### 12.2 Tests de Player
- `computeOverall()` devuelve [40, 99] todos los arquetipos
- Progresión a 22 años aumenta OVR si workEthic alto
- Progresión a 33 años con muchas temporadas reduce físicos
- Generar 1000 QBs Pocket Passer → OVR distribuido [60, 90]

### 12.3 Tests de Drive
- 1000 drives → distribución de outcomes parecida a NFL real
- Drives desde yarda 80 → TDs en 50%+
- Defensa 99 vs ofensa 50 → TDs <5%

### 12.4 Tests de Season
- 1 temporada simulada → 14 clasificados a playoffs
- Suma wins+losses por equipo = 17
- QB élite (OVR 90+) → 3500-5000 yardas, 25-45 TDs por temporada
- Tras 10 temporadas → 5+ jugadores retirados por edad

### 12.5 Sniff tests (validación estadística)
QB élite Pocket Passer tras 5 temporadas:
- Yardas/temp: 4200-4800 (NFL real ~4500)
- TDs: 30-40 (NFL real top 10: 30-50)
- INTs: 8-15 (NFL real: 10-15)
- Completion %: 64-68% (NFL real élite: 65-70%)

### 12.6 Si algo huele mal
- 80 TDs/año → varianza alta o ponderación rota
- Todos partidos 21-21 → varianza baja o PRNG roto
- Equipo gana 16-1 cada temporada → ponderación usuario alta
- Nadie se lesiona → probabilidades de lesión mal calibradas

---

## 13. Implementación: orden recomendado

| # | Tarea | Estimación | Validación |
|---|-------|-----------|------------|
| 1 | PRNG seedeado + tests | 0.5 días | Mismo seed = mismo output |
| 2 | Estructura Player + OVR + tests | 2 días | OVR ∈ [40, 99] |
| 3 | Generador de jugadores por arquetipo | 1.5 días | Distribuciones realistas |
| 4 | Estructura Team + carga JSON | 1 día | Carga sin errores |
| 5 | Simulador de drive + tests | 3 días | Distribución NFL realista |
| 6 | Stats individuales por drive | 2 días | Stats coherentes |
| 7 | Sistema de varianza | 1 día | Compostura afecta |
| 8 | Sistema de fatiga | 1 día | RB se cansa |
| 9 | Simulador de partido completo | 2 días | Marcadores realistas |
| 10 | Progresión anual + envejecimiento | 1.5 días | Carrera de 15 años |
| 11 | Calendario + temporada completa | 1 día | 17 semanas, 14 playoffs |
| 12 | CLI playable end-to-end | 1.5 días | Carrera completa en consola |

**Total estimado:** 18-20 días con Antigravity.

### Hitos
- Tras tarea 6: puedes ver un partido con stats narrativas
- Tras tarea 9: simular semana entera
- Tras tarea 12: vivir carrera completa en CLI → motor hecho

---

## 14. Próximos pasos

### 14.1 Documentos faltantes
- NOMBRES_JUGADORES.md: ~500 nombres + apellidos
- UNIVERSIDADES_FICTICIAS.md: ~30 universidades
- EVENTOS_DEPORTIVOS.md: ~30 eventos del MVP

### 14.2 Setup Antigravity
- Instalar
- Workspace nuevo
- Pinnear: GDD.md, LIGA_FICTICIA.md, CHANGELOG_v1.1.md, SIMULATION_ENGINE.md
- Modelo: Gemini 3 Pro o Claude Sonnet 4.5

### 14.3 Primera tarea para Antigravity

```
Contexto: lee /docs/SIMULATION_ENGINE.md y /docs/GDD.md

Tarea: Implementa el módulo PRNG seedeado en /src/engine/prng.ts.

Requisitos:
  - Clase SeededRandom con métodos: random(), randomInt(min, max),
    randomNormal(), pick(array), weightedRandom(weights).
  - Constructor recibe un seed string.
  - Determinista: mismo seed produce misma secuencia.
  - Sub-seeds: método derive(name) crea SeededRandom hijo.

Tests en /tests/prng.test.ts:
  - Mismo seed produce misma secuencia (10 valores iguales).
  - randomInt(1, 6) genera valores en [1, 6] tras 10000 iteraciones.
  - randomNormal() centra en 0 ±0.05 tras 10000 iteraciones.
  - derive('test') crea instancia distinta del padre.

No implementes ninguna otra cosa. Esta es la base.
Haz un plan antes de ejecutar y muéstralo.
```

### 14.4 Disclaimer
Las fórmulas y rangos son la primera versión razonada. NO son finales.

Tras implementar y testear cada módulo, vamos a descubrir que ciertos parámetros producen resultados raros. Proceso correcto:
1. Implementar la fórmula como está aquí
2. Simular muchas veces
3. Comparar con realidad NFL
4. Ajustar parámetros (NO la estructura)
5. Volver a 2

El balanceo final será iterativo.
