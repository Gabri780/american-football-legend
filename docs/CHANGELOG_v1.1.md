# GDD Changelog v1.0 → v1.1

**Cambio mayor:** filosofía de eventos narrativos
**Fecha:** Sesión inicial
**Estado:** aplicado al GDD principal

---

## Resumen del cambio

Esta versión modifica la sección 5 ("Vida fuera del campo") del GDD v1.0 original. El cambio responde a una preocupación legítima:

> "Tengo miedo de que lo de los eventos vuelva demasiado arcade el juego. Me gustaría hacerlo muy realista y mantenerlo simple, y ya ir profundizando más en ello más adelante."

El GDD v1.0 proponía un sistema de eventos amplio y multicategoría inspirado en BitLife, lo cual entra en tensión con el objetivo declarado de "realismo extremo". Esta versión corrige esa tensión.

### Filosofía: profundidad antes que amplitud

En vez de tener muchos eventos repartidos en 5 categorías, vamos a tener pocos eventos pero muy bien hechos en una sola categoría: deportiva. Cuando esa categoría esté madura y exista un sistema sólido detrás, expandiremos a relaciones, economía, etc.

Cada categoría de eventos requiere primero un sistema simulado debajo. No tiene sentido un evento "tu pareja te pide más tiempo en casa" si en el juego no existe el sistema "pareja".

---

## Decisiones tomadas

### Decisión 1: Cantidad de eventos por temporada

- **Pregunta:** ¿Cuántos eventos narrativos por temporada?
- **Decisión:** **1-3 por temporada (muy realista, casi documental)**
- **Razonamiento:** Realismo prima sobre saturación narrativa. Una temporada NFL real tiene pocos eventos memorables por jugador. Un rookie de 7ª ronda puede vivir su primer año sin titulares; un veterano en año de contrato vive 3 momentos críticos. Ambos casos son realistas.

### Decisión 2: Categorías de eventos en MVP

- **Pregunta:** ¿Qué categorías de eventos incluir?
- **Decisión:** **Solo deportivos en MVP. Económicos y de relaciones cuando exista un sistema decente para ellos.**
- **Razonamiento:** Cada categoría necesita un sistema simulado debajo. Mejor 30 eventos deportivos profundos que 200 eventos mediocres dispersos.

### Decisión 3: Tono narrativo

- **Pregunta:** ¿Cómo redactar los eventos?
- **Decisión:** **Mezcla según el evento.**
- **Razonamiento:** Una negociación de contrato suena a noticia ESPN. Una lesión grave puede tener componente subjetivo. Una conversación con el coach va en estilo diálogo.

### Decisión 4: Disparo contextual vs aleatorio

- **Pregunta:** ¿Eventos por contexto o por azar?
- **Decisión:** **Lo más realista. Principalmente contextual (80%) con componente menor de azar (20%).**
- **Razonamiento:** Eventos puramente azarosos rompen inmersión. Puramente contextuales son predecibles. La realidad NFL es 80% predecible y 20% azarosa.

### Decisión 5: ¿Siempre hay que decidir?

- **Pregunta:** ¿Cada evento incluye decisión del jugador?
- **Decisión:** **La mayoría con decisión, algunos solo informativos.**
- **Razonamiento:** Flujo todo-informativo es pasivo. Flujo todo-decisión satura. Equilibrio: ~70% decisión / ~30% noticias que afectan al jugador.

### Decisión 6: Severidad de consecuencias

- **Pregunta:** ¿Consecuencias duras o suaves?
- **Decisión:** **Depende del evento: algunos críticos, otros menores.**
- **Razonamiento:** Una decisión sobre cirugía es irreversible. Una respuesta a periodista molesta una semana. Mezclar severidades hace que el jugador SIENTA cuando aparece algo grande.

---

## Cambios concretos al GDD

### Sección 5 — REEMPLAZADA

La sección "Vida fuera del campo" se reemplaza por "Eventos narrativos deportivos (MVP)" con:

- Frecuencia: 1-3 por temporada
- Categorías solo deportivas: Contractuales, Lesiones, Tácticas, Internas, Reconocimiento
- Tono mixto según tipo de evento
- 70% con decisión / 30% informativos
- Severidades mezcladas: 50% menores, 35% moderadas, 15% críticas

### Sección 1.4 (Referencias)

- ELIMINADO: BitLife (ya no es referencia válida)
- AÑADIDO: The Athletic / ESPN (estilo narrativo)
- AÑADIDO: NFL Films / Hard Knocks (referencia tonal)

### Sección 1.6 (Proposición de valor única)

REEMPLAZADO por:
> "La única aplicación móvil que combina la simulación deportiva profunda de un manager de fútbol americano con la narrativa íntima de un documental ESPN/The Athletic, vista desde la perspectiva de UN jugador desde el draft hasta la retirada. No es BitLife con NFL — es un simulador deportivo serio con momentos narrativos puntuales muy bien hechos."

### Sección 7.2 (Tarjeta de decisión)

ACTUALIZADO:
- Header con titular tipo noticia (no genérico)
- Indicador visual de severidad con código de color
- Botón "recibido" para eventos solo informativos

### Sección 8.3 (Tier Premium)

AJUSTE: "Eventos narrativos premium" pasa a ser "Catálogo expandido: gratuito 30 eventos base, premium 100+ con variantes contextuales y rama narrativa multi-evento."

### Sección 9.5 (Fase 3)

REEMPLAZADO:
- Diseñar y escribir 30 eventos deportivos del MVP
- Implementar motor de triggers contextuales
- Implementar UI de tarjeta de evento con severidad
- Sistema de consecuencias persistentes

---

## Ejemplos concretos de eventos

### Ejemplo 1 — Contractual (severidad crítica, con decisión)

**Header:** Tu agente convoca reunión urgente

**Body:**
Tras tu cuarta temporada con 4.100 yardas y 32 TDs, el frente del equipo te ofrece una extensión de 5 años / $215M con $130M garantizados. Tu agente te avisa: hay tres equipos contendientes vigilando tu free agency dentro de 14 meses. Aceptar ahora te ata a Kansas City; esperar te puede valer $40-60M más en mercado abierto, pero también arriesgas a una lesión que destruya tu valor.

**Opciones:**
- Aceptar la extensión ahora (seguridad financiera, +5 química con coach)
- Pedir más, negociar duro (riesgo: el equipo puede retirar la oferta y franquiciarte)
- Rechazar y jugar por mercado abierto (mayor potencial económico, riesgo si te lesionas)

**Trigger:** jugador en año 4 de rookie deal + OVR ≥ 87 + posición QB
**Tono:** periodístico mezclado con asesoramiento del agente

### Ejemplo 2 — Lesión (severidad moderada, con decisión)

**Header:** Te sientes el hombro en el calentamiento

**Body:**
Es Lunes Night Football. Llevas tres semanas con molestias en el hombro de lanzar; los médicos dicen que es bursitis y han recomendado descansar dos semanas. Pero tu equipo está 6-3 luchando por el primer seed y este partido es contra tu rival de división. El coordinator ofensivo te pregunta si estás listo. Sabes que jugar lesionado puede agravar el problema; no jugar puede ser leído como falta de compromiso por un vestuario que te observa.

**Opciones:**
- Jugar (50% probabilidad de empeorar lesión a 4-6 semanas; +liderazgo si juegas bien)
- Sentarte y descansar (recuperación garantizada en 2 semanas; -química temporal con coach)
- Inyección de cortisona y jugar (rendimiento normal hoy; +20% riesgo de lesión crónica futura)

### Ejemplo 3 — Informativo (sin decisión, severidad moderada)

**Header:** Tu coordinator ofensivo se va a Carolina

**Body:**
ESPN reporta que Mike Daniels, tu coordinator ofensivo durante las últimas tres temporadas, ha aceptado el puesto de head coach en Charlotte. La noticia llega en pleno enero, y el equipo abre proceso de búsqueda. Daniels diseñó el sistema en el que tú prosperaste; un nuevo coordinator significará nuevo playbook, nueva terminología, posiblemente nueva mecánica de pase.

**Consecuencias automáticas (sin decisión del jugador):**
- Atributo "Conocimiento del playbook" baja temporalmente -10
- Próxima offseason habrá un evento de "adaptación al nuevo sistema"
- Si tu OVR de inteligencia es alto, te recuperarás más rápido

**Trigger:** equipo del jugador entre top 5 ofensivo + 30% chance al final de cada temporada
**Tono:** noticia ESPN pura, 3ª persona

---

## Implicaciones para el desarrollo

### Más fácil:
- Reducimos alcance de ~200 eventos hipotéticos a ~30 muy bien hechos
- No necesitamos sistemas de familia, redes sociales, finanzas en MVP
- Pantalla de evento más uniforme
- Testing más fácil

### Más difícil:
- Cada evento tiene que estar MUY bien escrito
- Motor de triggers contextuales más complejo
- Sistema de consecuencias debe ser robusto y persistente
- Curva de retención necesita otros mecanismos
