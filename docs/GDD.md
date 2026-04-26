# Gridiron Legend — Game Design Document

**Versión:** 1.0 (con cambios pendientes del CHANGELOG v1.1)
**Estado:** Living document
**Última revisión:** Sesión inicial

---

## 1. Visión del juego

### 1.1 Elevator pitch

Gridiron Legend es un simulador narrativo de carrera deportiva para iOS y Android donde el jugador encarna la vida completa de una estrella de fútbol americano, desde el momento en que es seleccionado en el draft hasta su retirada. Inspirado en el formato de decisiones y texto de BitLife, pero con una simulación deportiva profunda y un mundo vivo alrededor del protagonista: contratos, lesiones, medios, vida personal, rivalidades y legado.

### 1.2 Qué ES este juego

- Un simulador de carrera profesional, no un juego de acción.
- Una experiencia narrativa impulsada por texto, con soporte visual minimalista (retratos, stats, escudos).
- Un juego de decisiones significativas con consecuencias a largo plazo.
- Una simulación deportivamente creíble: las posiciones se comportan de forma distinta, los atributos importan, los equipos tienen identidad.
- Rejugable: cada carrera es diferente por el equipo que te draftea, tus atributos, tus decisiones y los eventos aleatorios.

### 1.3 Qué NO es este juego

- No es Madden. No hay control de jugadas en tiempo real ni simulación visual 3D.
- No es Retro Bowl. No es arcade; es narrativo y estratégico.
- No es Franchise Manager. No gestionas un equipo entero; eres UN jugador.
- No es un MMO ni tiene multijugador en el MVP.

### 1.4 Referencias y benchmarks

- **The Athletic / ESPN**: estilo narrativo de las historias de jugadores. La fuente del tono que queremos.
- **NFL Films / Hard Knocks**: documentales como referencia tonal de cómo se siente la vida del jugador.
- **Retro Bowl**: estética minimalista, nombres ficticios inspirados en reales, profundidad accesible.
- **Football Manager (serie)**: profundidad de simulación, atributos, escenas narrativas.
- **New Star Soccer**: gestión de vida del deportista (energía, dinero, relaciones, entrenamiento).
- **NFL Head Coach 09**: texto de partido, decisiones tácticas, gestión de roster.

### 1.5 Público objetivo

- **Primario**: fans de la NFL de entre 18-45 años que consumen contenido deportivo en el móvil (ESPN, The Athletic, podcasts).
- **Secundario**: jugadores de simuladores deportivos (Madden Franchise, OOTP, Football Manager) buscando algo más ligero en móvil.
- **Terciario**: jugadores de simuladores de vida que disfrutan deportes.

### 1.6 Proposición de valor única

La única aplicación móvil que combina la simulación deportiva profunda de un manager de fútbol americano con la narrativa íntima de un documental ESPN/The Athletic, vista desde la perspectiva de UN jugador desde el draft hasta la retirada. No es BitLife con NFL — es un simulador deportivo serio con momentos narrativos puntuales muy bien hechos.

---

## 2. Liga ficticia: el universo del juego

### 2.1 Principio de diseño

Toda la propiedad intelectual del juego debe ser original desde el día uno para evitar riesgo legal. La referencia a la realidad será implícita (mismo número de equipos, mismas ciudades donde sea posible, estructura de conferencias/divisiones similar) pero los nombres, logos y ficciones narrativas serán propios.

**Decisión sobre colores (refinada):** Los colores de los equipos seguirán las mismas familias cromáticas que los reales (rojo cálido para Kansas City, azul/rojo para Buffalo) pero suficientemente distintos para evitar reclamación por "trade dress".

### 2.2 Estructura de la liga

- Nombre: **Professional Football League (PFL)**
- 32 equipos divididos en 2 conferencias de 16 equipos
- Cada conferencia dividida en 4 divisiones de 4 equipos
- Temporada regular de 17 semanas + playoffs + championship final
- Conferencias: **Eastern Conference / Western Conference**

### 2.3 Eventos y premios de la liga

- **Championship Bowl** (equivalente a Super Bowl)
- **Pro Roster Game** (equivalente a Pro Bowl)
- **League MVP, Offensive Player of the Year, Rookie of the Year**
- **Position awards**: Best QB, Best RB, Best WR
- **Hall of Legends** (equivalente a Hall of Fame)

> Para la lista completa de los 32 equipos ver `LIGA_FICTICIA.md`.

---

## 3. Mecánicas core: loop de juego

### 3.1 Los tres loops anidados

#### Loop de TEMPORADA (macro)

- Offseason: combine (solo año rookie), draft (año rookie), firma de contratos, free agency
- Training camp: elección de habilidades a desarrollar, competencia por titularidad
- Preseason: 3-4 partidos simulados rápidamente
- Regular season: 17 semanas de partidos + eventos de vida entre partidos
- Playoffs (si clasificas): Wild Card → Divisional → Conference → Championship Bowl
- Post-season: premios individuales, entrevistas, decisiones sobre contratos/traspasos

#### Loop de SEMANA (meso)

- Lunes: análisis del partido anterior, estado físico, reacción mediática
- Martes-viernes: entrenamiento, eventos de vida, decisiones de la semana (1-3 eventos)
- Sábado: preview del partido, última preparación
- Domingo: partido (presentación narrativa con decisiones puntuales)

#### Loop de PARTIDO (micro)

- Pre-partido: selección de mentalidad (conservadora/agresiva/equilibrada)
- Simulación automática con narración texto: cada drive se resume en 2-4 líneas
- Decisiones clave (3-6 por partido) en momentos críticos
- Post-partido: stats, rating del jugador, reacción del vestuario, titulares de prensa

### 3.2 Experiencia por posición

#### Quarterback (QB)

- La posición más narrativa: eres la cara del equipo
- Decisiones: lectura de defensa pre-snap, selección de receptor, audibles
- Stats clave: yardas de pase, TDs, INTs, rating de pase, completion %
- Narrativas especiales: rivalidad QB1 vs QB2 del equipo, expectativas de franquicia

#### Running Back (RB)

- La posición más física: desgaste y durabilidad son centrales
- Decisiones: tipo de carrera (dentro/fuera), protección de balón, bloqueo en pase
- Stats clave: yardas por carrera, TDs de tierra, fumbles, yardas después del contacto
- Narrativas especiales: vida útil corta (crisis de renovación tras 4-5 años), lesiones frecuentes

#### Wide Receiver (WR)

- La posición más explosiva: grandes jugadas, gran ego
- Decisiones: ruta a correr, ajuste a coverage, celebración tras touchdown
- Stats clave: recepciones, yardas, TDs, drops, yardas después de recepción
- Narrativas especiales: relación con el QB (química), conflictos con coordinator ofensivo, branding personal

### 3.3 Selección de arquetipo

**Decisión refinada (sesión post v1.0):** El arquetipo del jugador-usuario NO se elige al crear la carrera. Se determina automáticamente por los atributos generados aleatoriamente, así cada nueva carrera es distinta y se respeta el realismo (un jugador real no elige su tipo).

---

## 4. Sistema de atributos y progresión

### 4.1 Atributos físicos (comunes a todas las posiciones)

| Atributo | Descripción | Rango |
|----------|-------------|-------|
| Velocidad | Velocidad máxima en línea recta | 40-99 |
| Aceleración | Rapidez en alcanzar velocidad máxima | 40-99 |
| Agilidad | Capacidad de cambiar dirección | 40-99 |
| Fuerza | Potencia física, romper tackles | 40-99 |
| Resistencia | Fatiga durante partido/temporada | 40-99 |
| Durabilidad | Resistencia a lesiones | 40-99 |

### 4.2 Atributos mentales (comunes)

- Inteligencia futbolística (Football IQ): lectura del juego, adaptación
- Conciencia (Awareness): detección de presión, oportunidades
- Compostura (Composure): rendimiento bajo presión / en momentos clave
- Liderazgo (Leadership): influencia en vestuario, química del equipo
- Trabajo ético (Work Ethic): ritmo de progresión en entrenamientos

### 4.3 Atributos específicos por posición

> Para el detalle completo y fórmulas, ver `SIMULATION_ENGINE.md` sección 2.3.

#### QB-específicos
Arm Strength, Short Accuracy, Medium Accuracy, Deep Accuracy, Pocket Presence, Mobility, Read Defense, Decision Making, Play Action

#### RB-específicos
Vision, Juke Move, Spin Move, Trucking, Ball Security, Route Running, Catching, Pass Protection, Breakaway Speed

#### WR-específicos
Hands, Route Running, Separation, Catch in Traffic, YAC Ability, Release, Body Control, Blocking, Contested Catches

### 4.4 Sistema de progresión por edad

| Edad | Fase | Tendencia general |
|------|------|-------------------|
| 21-24 | Rookie / desarrollo | Crecimiento rápido, potencial alto |
| 25-28 | Prime | Crecimiento moderado, pico de rendimiento |
| 29-31 | Experiencia | Mental sube, físico empieza a bajar |
| 32-34 | Veteranía | Físico baja notable; RB usualmente retira |
| 35+ | Leyenda | Solo QBs de élite continúan |

---

## 5. Eventos narrativos deportivos (MVP)

> **Esta sección reemplaza la "Vida fuera del campo" del GDD v1.0 original.** Ver CHANGELOG_v1.1.md para el contexto del cambio.

### 5.1 Principio de diseño

Los eventos narrativos son momentos puntuales en la carrera del jugador donde la simulación deportiva pura cede paso a una historia con texto, contexto y (en la mayoría de casos) decisión del jugador. Su propósito es crear momentos memorables que se sientan como noticias reales de la NFL, no aleatoriedad arcade.

### 5.2 Frecuencia y disparo

- **Frecuencia**: 1-3 eventos por temporada (17 semanas)
- **Distribución**: principalmente contextual (~80%), con componente menor aleatorio (~20%)
- Pueden no aparecer eventos en una temporada si el contexto no los dispara (un rookie sin protagonismo). Esto es deseable, no un error.

### 5.3 Categorías incluidas en MVP

Solo eventos deportivos. Cinco subcategorías:

- **Contractuales** (firma rookie, extensión, año de contrato, free agency, cláusulas)
- **Lesiones** (decisión sobre cirugía, jugar lesionado, rehabilitación)
- **Tácticas** (cambio de coordinator, conflicto con coach por playbook, audibles propios)
- **Internas** (competencia con otro QB del roster, capitanía, conflicto en vestuario)
- **Reconocimiento** (selección Pro Roster, premios individuales, récords)

### 5.4 Categorías que llegarán en updates posteriores (NO en MVP)

- Eventos económicos (cuando exista sistema de finanzas personales)
- Eventos de relaciones (cuando exista sistema de familia/pareja)
- Eventos mediáticos (cuando exista sistema de redes sociales/imagen pública)
- Eventos de salud mental (cuando exista sistema de bienestar psicológico)

### 5.5 Estructura de un evento

- **Trigger**: condición que dispara el evento
- **Header**: titular tipo ESPN
- **Cuerpo**: 3-6 líneas de contexto narrativo, con tono adaptado al tipo de evento
- **Opciones**: 0-4 decisiones (la mayoría tienen 2-3)
- **Consecuencias**: cambios concretos en stats, atributos, contratos, relaciones, etc.
- **Severidad**: "menor", "moderada" o "crítica"

### 5.6 Distribución de eventos

- ~70% incluyen decisión del jugador con consecuencias
- ~30% son noticias informativas que el jugador recibe pasivamente
- Severidades: ~50% menores, ~35% moderadas, ~15% críticas

---

## 6. Contratos, draft y economía

### 6.1 Sistema de draft (año rookie)

- Combine: pruebas físicas que afectan tu posición en el draft
- Ranking pre-draft: visible tras el combine, va de Top-5 a Undrafted
- Día del draft: narración ronda por ronda
- Impacto del pick: los rookies de Round 1 tienen contratos garantizados más altos y más paciencia del equipo

### 6.2 Estructura de contratos

- Duración (años)
- Valor total
- Dinero garantizado (base + bonus de firma)
- Bonus de firma (pago inmediato)
- Incentivos por rendimiento
- Cláusulas de salida

### 6.3 Rookie contract (4 años, estructura fija)

- Round 1: $15-40M, 100% garantizado, opción de 5º año
- Round 2-3: $5-10M, ~60% garantizado
- Round 4-7: $3-4M, ~20% garantizado
- Undrafted: contrato mínimo, sin garantías

### 6.4 Free agency y trades

- Al expirar un contrato: mercado abierto, múltiples ofertas
- Trade: posible durante la temporada
- Cut (corte): el equipo puede liberarte
- Retirada: decisión voluntaria o forzada por falta de ofertas

---

## 7. UI/UX del MVP

### 7.1 Principios de diseño visual

- Minimalismo funcional
- Tipografía como héroe (estilo ESPN Ticker)
- Color como información: verde = positivo, rojo = negativo, amarillo = atención
- Animaciones sutiles
- **Dark mode por defecto**

### 7.2 Pantallas principales (5 para MVP)

#### A. Dashboard
- Header: retrato del jugador + nombre + equipo + OVR
- Resumen: edad, temporada, posición, salario, próximo partido
- Widgets: stats, lesiones activas, eventos pendientes
- Navegación inferior: Inicio / Equipo / Carrera / Vida / Stats

#### B. Calendario semanal
- Vista tipo agenda con eventos de la semana
- Tap en evento abre tarjeta de decisión
- Indicador de descanso/fatiga

#### C. Tarjeta de decisión (modal)
- Titular tipo noticia
- Indicador visual de severidad (menor/moderada/crítica) con código de color
- 0-4 opciones de respuesta
- Botón "recibido" para eventos solo informativos

#### D. Pantalla de partido
- Scoreboard superior en vivo
- Feed de play-by-play textual
- Decisiones aparecen como overlay modal
- Post-partido: resumen + stats + highlights

#### E. Perfil del jugador
- Bio: edad, altura, peso, universidad ficticia, draft
- Atributos con barras de progreso
- Stats de carrera por temporada
- Logros y trofeos

### 7.3 Retratos de jugadores

- Avatars generados proceduralmente: sistema de capas
- Personalización del jugador propio al inicio

---

## 8. Monetización

### 8.1 Modelo: Freemium + Suscripción Premium

### 8.2 Tier gratuito

- Una carrera activa a la vez
- Solo posición QB disponible al inicio
- Anuncios entre semanas (30-60 segundos cada 2-3 semanas de juego)
- Rewind limitado: 1 deshacer por temporada
- Customización visual básica
- Stats básicos

### 8.3 Tier Premium

- Sin anuncios
- Todas las posiciones (QB, RB, WR)
- Múltiples carreras simultáneas (hasta 3)
- Rewind ilimitado
- Modo Leyenda (atributos iniciales más altos)
- Generador de jugador avanzado
- Scouting report detallado
- Análisis avanzado de stats
- Catálogo expandido de eventos narrativos (100+ vs 30 base)
- Soporte prioritario

### 8.4 Pricing propuesto

| Plan | Precio | Objetivo |
|------|--------|----------|
| Mensual | $4.99 / mes | Prueba corta |
| Anual | $29.99 / año | Conversión principal (50% off) |
| Lifetime | $59.99 único | Fans hardcore |

### 8.5 Compromiso ético

- NO lootboxes
- NO pay-to-win
- NO dark patterns
- Trial de 7 días gratis de premium

---

## 9. Roadmap técnico por fases

### 9.1 Enfoque: construcción incremental

Construimos en fases, validando cada una antes de pasar a la siguiente.

### 9.2 Fase 0: Preparación (1-2 semanas)
- GDD finalizado (este documento)
- Documentos anexos: LIGA_FICTICIA.md, SIMULATION_ENGINE.md
- Setup de Google Antigravity
- Stack técnico definitivo
- Repositorio Git

### 9.3 Fase 1: Motor de simulación en consola (2-4 semanas)
- Sin UI, sin móvil: puro código TypeScript en terminal
- Sistema de atributos y progresión
- Generador de jugador
- Simulación de partido por drives
- Simulación de temporada

### 9.4 Fase 2: MVP móvil básico (4-6 semanas)
- Pantalla de creación de jugador
- Dashboard principal
- Simulación de temporada con UI
- Solo posición QB
- 4-5 pantallas esenciales

### 9.5 Fase 3: Expansión de contenido (4-6 semanas)
- Añadir RB y WR
- Diseñar y escribir 30 eventos deportivos del MVP
- Implementar motor de triggers contextuales
- Implementar UI de tarjeta de evento con severidad
- Sistema de consecuencias persistentes
- Retratos generados proceduralmente
- Contratos y free agency

### 9.6 Fase 4: Pulido y monetización (3-4 semanas)
- Integración StoreKit + Google Billing
- Tier gratuito vs premium
- Anuncios (AdMob)
- Cloud saves
- Onboarding y tutorial
- Beta testing

### 9.7 Fase 5: Lanzamiento (2 semanas)
- App Store Connect + Google Play Console
- ASO (descripciones, screenshots, trailer)
- Soft launch en 1-2 países
- Lanzamiento global

### 9.8 Timeline realista

- **Optimista** (full-time): 4-5 meses
- **Realista** (1-2h/día): 6-9 meses
- **Conservador**: 9-12 meses

---

## 10. Stack técnico

### 10.1 Stack confirmado

- **Framework**: React Native + Expo
- **Lenguaje**: TypeScript
- **Estado**: Zustand
- **Persistencia local**: AsyncStorage + MMKV
- **Backend (post-MVP)**: Supabase (auth + DB + cloud saves)
- **Pagos**: RevenueCat (unifica StoreKit + Google Billing)
- **Anuncios**: AdMob
- **Analytics**: Amplitude o PostHog
- **Crash reporting**: Sentry
- **Control de versiones**: Git + GitHub

### 10.2 Razones de la elección
- Background web del developer (JS/TS) reduce curva
- LLMs (Antigravity con Gemini/Claude) tienen muchos datos en RN
- Expo simplifica setup y deploy
- Para un juego de texto + gráficos simples, performance suficiente

---

## 11. Cómo trabajar con Google Antigravity

### 11.1 Filosofía

- Antigravity es agente, no equipo. El humano es arquitecto.
- NUNCA tareas tipo "hazme el juego". SIEMPRE tareas acotadas.
- SIEMPRE darle estos documentos como contexto base.
- SIEMPRE pedirle plan antes de ejecutar.
- SIEMPRE revisar y testear.

### 11.2 Estructura del repositorio

```
/docs       — toda la documentación (pinnear en Antigravity)
/src        — código de la app
  /engine   — motor de simulación puro
  /screens  — pantallas
  /components — componentes reutilizables
  /data     — datos estáticos (equipos, nombres ficticios)
/tests      — tests unitarios
/assets     — imágenes, retratos, escudos
```

### 11.3 Buena vs mala tarea

**Buena tarea:**
> "Dado el GDD en /docs/GDD.md y SIMULATION_ENGINE.md, implementa en /src/engine/player.ts una clase Player con los atributos definidos en sección 4. Incluye método calculateOverall() con las fórmulas de SIMULATION_ENGINE.md sección 4. Tests en /tests/player.test.ts."

**Mala tarea:**
> "Haz el sistema de jugadores."

---

## 12. Riesgos y mitigaciones

### 12.1 Producto

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Simulación aburrida o irrealista | Alto | Invertir 30% del tiempo en engine; playtesting temprano |
| Scope creep | Alto | Roadmap por fases, lista "Post-MVP" separada |
| Demanda legal por similitud NFL | Crítico | IP 100% ficticia desde día 1, colores familias similares pero distintos |
| App Store rechaza la app | Medio | Seguir guidelines, no infringir marcas |
| Free canibaliza Premium | Alto | Análisis conversión, ajustar límites |

### 12.2 Técnicos
- Antigravity genera bugs sutiles → tests obligatorios
- Performance Android low-end → profiling temprano
- Pérdida de datos del jugador → cloud backup
- Curva de aprendizaje RN → proyecto-juguete previo

### 12.3 Personales
- Burnout → ritmo sostenido, no maratón
- Pérdida de motivación → entregas semanales visibles
- Perfeccionismo → mentalidad MVP estricta

---

## 13. Próximos pasos inmediatos

### 13.1 Esta semana
- Setup proyecto + repositorio público GitHub
- Convertir docs a markdown
- Trastear con Antigravity proyecto-juguete
- Primer prompt al agente: PRNG seedeado

### 13.2 Próximas 2 semanas
- LIGA_FICTICIA v1.1 con refinamientos (Green Bay, colores intermedios, etc.)
- Implementar Player + tests
- Implementar Team
- Empezar simulador de drive

---

## Apéndice: Decisiones cerradas

| Decisión | Estado | Documento |
|----------|--------|-----------|
| Identidad: simulador serio tipo The Athletic | ✅ | Este GDD |
| 32 equipos / 8 divisiones / 2 conferencias | ✅ | LIGA_FICTICIA |
| Eventos: 1-3 por temporada, solo deportivos | ✅ | CHANGELOG_v1.1 |
| Stack: React Native + Expo | ✅ | Este GDD |
| Simulación por drives | ✅ | SIMULATION_ENGINE |
| OVR con arquetipos | ✅ | SIMULATION_ENGINE |
| Atributos: físicos visibles, mentales ocultos | ✅ | SIMULATION_ENGINE |
| Roster mínimo viable (~55 jugadores) | ✅ | SIMULATION_ENGINE |
| Varianza modulada por contexto | ✅ | SIMULATION_ENGINE |
| Fatiga acumulada por temporada | ✅ | SIMULATION_ENGINE |
| Monetización: freemium + suscripción | ✅ | Este GDD |
| Colores: familias similares pero distintos | ✅ | Esta sesión |
| Arquetipo del usuario por atributos generados | ✅ | Esta sesión |
| Green Bay (no Milwaukee) para Brewers | ✅ | Esta sesión |
