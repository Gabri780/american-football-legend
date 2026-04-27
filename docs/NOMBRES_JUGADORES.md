# Player Names + Fictional Universities

**Versión:** 1.0
**Estado:** especificación de datos para el motor de generación
**Idioma:** Inglés (consistente con la decisión de idioma del juego)

---

## 0. Propósito

Este documento define los bancos de datos que el generador procedural usa para crear jugadores con identidad. Cubre:

1. **Banco de primeros nombres** (300 entradas)
2. **Banco de apellidos** (300 entradas)
3. **Universidades ficticias** (30 con categorías y probabilidades)
4. **Reglas de uso** para el generador

Estos datos sustituyen los placeholders actuales (`firstName: 'Elite'`, `collegeId: 'GENERIC_U'`) y permiten que cada partida del juego se sienta poblada con personajes únicos.

---

## 1. Filosofía de los nombres

### 1.1 Realismo NFL

La NFL real refleja una mezcla cultural concreta. Este documento la respeta:

| Origen | Proporción target | Notas |
|--------|------------------|-------|
| Anglosajón / clásico americano | ~50% | Mike, John, Brian, Smith, Johnson |
| Afroamericano | ~30% | DeShawn, Tyrese, Marquise, Jamal |
| Polinesio / samoano | ~5% | Tua, Manti, Vita, Penei |
| Latino | ~5% | Diego, Mateo, Tomás, García |
| Otros / inventado | ~10% | Variedad para textura |

### 1.2 Reglas de generación

- Los nombres no están "marcados" por origen en el código. El motor selecciona aleatoriamente.
- Esto evita estereotipar ("este jugador con nombre afroamericano debe tener stat X").
- Cualquier combinación de firstName + lastName es válida — refleja la realidad de la sociedad estadounidense mestiza.

---

## 2. Banco de primeros nombres (300)

### 2.1 Anglosajones / clásicos americanos (~150)

```
Aaron, Adam, Alex, Andrew, Anthony, Austin, Beau, Ben, Bill, Blake,
Bo, Brad, Brady, Brandon, Brent, Brett, Brian, Bruce, Bryce, Caleb,
Cam, Carson, Casey, Chad, Charles, Chase, Chris, Christian, Cody, Cole,
Colin, Connor, Cooper, Craig, Curtis, Dale, Dalton, Dan, Daniel, Dave,
David, Dean, Derek, Devin, Doug, Drew, Dustin, Dylan, Eli, Eric,
Ethan, Frank, Gabe, Gary, Gavin, George, Grant, Greg, Henry, Hunter,
Ian, Isaac, Jack, Jackson, Jacob, Jake, James, Jared, Jason, Jeff,
Jeremy, Jesse, Jim, Joe, John, Jonah, Jordan, Joseph, Josh, Justin,
Keith, Kenny, Kevin, Kyle, Lance, Landon, Larry, Lee, Levi, Logan,
Luke, Mark, Mason, Matt, Max, Michael, Mike, Mitch, Nate, Nick,
Noah, Owen, Parker, Pat, Paul, Peter, Phil, Quinn, Rick, Robert,
Ross, Russell, Ryan, Sam, Scott, Sean, Seth, Shane, Shawn, Spencer,
Steve, Tanner, Taylor, Ted, Thomas, Tim, Todd, Tom, Tony, Travis,
Trent, Trevor, Trey, Troy, Tucker, Tyler, Wade, Walt, Warren, Wayne,
Wes, Will, Wyatt, Zach, Zane, Beau, Brock, Cade, Garrett, Holden
```

### 2.2 Afroamericanos comunes en NFL (~90)

```
Adrian, Akeem, Alvin, Amari, Andre, Anquan, Antoine, Antonio, Bakari, Bilal,
Brandon, Bryson, Cedric, Champ, Chauncey, Cordell, Cordarrelle, Corey, Cortez, Curtis,
Damar, Damarcus, Damari, Damian, Dameon, Damon, DaQuan, Darius, Darnell, Darrell,
Davante, DeAndre, Deion, Demarcus, DeMarius, Demaryius, DeMeco, Demetrius, DeShaun, DeShawn,
Devonte, DK, Donovan, DonTay, Dre, Dwight, Earl, Ed, Eddie, Elgton,
Emmitt, Emory, Eric, Frank, Garrett, Geno, Gerald, Hakeem, Harold, Henry,
Isaac, Isaiah, Jabaal, Jabrill, Jadeveon, Jakobi, Jalen, Jamaal, Jamal, JaMarcus,
Jamarr, Jameis, Jamel, Jameson, Jamir, Jaquan, Jarrett, Jarvis, Jaylen, Jaylon,
JC, Jermaine, Jerome, Jerry, Jevon, Jihad, Joelle, Jon, Justin, Karim,
Keenan, Kendrick, Kenyon, Kerry, Khalil, Kobe, Kwame, Kwity, Kyler, LaDainian
```

### 2.3 Polinesios / samoanos (~20)

```
Tua, Manti, Vita, Penei, Polynesian-style: Tevita, Mosi, Manu, Sione,
Junior, Tunoa, Eluemunor, Taumoepenu, Falepule, Tagovailoa-style fictional:
Lano, Talo, Maile, Sefo, Ifo, Tama, Aulelei, Faleomavaega
```

### 2.4 Latinos (~20)

```
Antonio, Carlos, Diego, Eduardo, Emilio, Esteban, Fernando, Gabriel, Hector,
Javier, Joaquín, Jorge, José, Julio, Luis, Manuel, Marco, Mateo, Miguel, Rafael,
Ramón, Rodrigo, Tomás
```

### 2.5 Inventados / variados (~20)

Estos son nombres menos comunes pero que dan textura. Pueden ser nombres reales raros o invenciones plausibles:

```
Asher, Brixton, Caelum, Daxon, Eero, Felton, Greyson, Holden, Idris, Jaxson,
Kano, Larkin, Maddox, Nico, Oren, Pax, Quentin, Reeve, Stellan, Tobin,
Ulf, Vance, Whit, Xavier, York, Zaire, Beck, Crew, Drift, Knox
```

---

## 3. Banco de apellidos (300)

### 3.1 Anglosajones (~150)

```
Adams, Allen, Anderson, Armstrong, Bailey, Baker, Barnes, Barrett, Bell, Bennett,
Bishop, Blackwell, Blake, Boone, Brooks, Brown, Burns, Butler, Campbell, Carlson,
Carpenter, Carter, Chapman, Clark, Cole, Collins, Cooper, Cox, Crawford, Cunningham,
Curtis, Dalton, Daniels, Davis, Dawson, Dean, Dixon, Donovan, Drake, Duncan,
Edwards, Ellis, Evans, Fisher, Fletcher, Ford, Foster, Fox, Franklin, Garner,
Gibson, Graham, Grant, Gray, Green, Griffith, Hall, Hamilton, Hanson, Harper,
Harris, Hawkins, Hayes, Henderson, Hill, Holden, Holloway, Holmes, Hopkins, Howard,
Hughes, Hunt, Hunter, Jackson, James, Jenkins, Johnson, Jones, Kelly, Kennedy,
King, Knight, Lane, Lawson, Lee, Lewis, Lloyd, Lockwood, Long, Lowe,
Marshall, Martin, Mason, Matthews, McCarthy, McKinley, Mead, Meyer, Miller, Mitchell,
Moore, Morgan, Morris, Murphy, Nelson, Nichols, Norman, North, Olsen, Owens,
Palmer, Parker, Patterson, Payne, Peters, Phillips, Pierce, Porter, Powell, Quinn,
Reed, Reynolds, Rhodes, Riley, Roberts, Robinson, Rogers, Ross, Russell, Ryan,
Saunders, Scott, Sharp, Shaw, Shepherd, Sherman, Simmons, Sloan, Smith, Spencer,
Stafford, Stevens, Stewart, Stone, Sullivan, Sutton, Taylor, Thompson, Turner, Wade
```

### 3.2 Afroamericanos comunes en NFL (~80)

```
Allen, Anderson, Banks, Barber, Bennett, Berry, Bridges, Brown, Brunson, Bryant,
Carter, Charles, Childs, Coleman, Cooks, Cox, Crowder, Davis, Demps, Dixon,
Dorsey, Douglas, Edwards, Floyd, Foreman, Foster, Freeman, Gaines, Gates, Gilmore,
Glover, Goodwin, Greene, Hairston, Hardman, Hardrick, Henderson, Henry, Hightower, Hilton,
Holmes, Hopkins, Howard, Hyde, Ingram, Ivory, Jackson, Jackson, James, Jefferson,
Jeffery, Johnson, Jones, Jordan, Kearse, Kelce-style fictional Kelman, Lawrence, Lewis, Mack, Mathis,
McGee, McKenzie, Mims, Moss, Mostert, Murray, Newton, Norman, Ogletree, Owens,
Patterson, Peterson, Pope, Ramsey, Robinson, Sanders, Singleton, Slater, Smith, Watson,
Whitney, Williams, Willis, Wilson, Wright, Young
```

### 3.3 Polinesios / samoanos (~20)

```
Aiono, Alualu, Atogwe, Faleafine, Faumui, Faupula, Fua, Iosefa, Iupati, Kahale,
Kemoeatu, Lealaitafea, Mailata, Manumaleuna, Polamalu-style fictional Polenui, Saluni, Su'a, Tuipulotu, Vaitai, Vea
```

### 3.4 Latinos (~20)

```
Alvarez, Castillo, Chávez, Domínguez, Espinoza, Flores, García, Gómez, González, Guerrero,
Hernández, Herrera, López, Martínez, Mendoza, Morales, Núñez, Ortiz, Ramírez, Reyes,
Rodríguez, Romero, Sánchez, Torres, Vargas, Vásquez, Vega
```

### 3.5 Otros (~30)

Apellidos de otros orígenes que dan textura realista (judío, italiano, irlandés, asiático-americano, europeo del este):

```
Becker, Bergstrom, Boroughs, Caruso, Cohen, Donatelli, Esposito, Falconi, Fitzgerald,
Friedman, Gallo, Holtzman, Kaufman, Kowalski, Larsen, Mancini, McAllister, Nguyen,
O'Brien, O'Connor, Park, Petrov, Romano, Schultz, Stein, Volkov, Walsh, Yamamoto, Zhao
```

---

## 4. Universidades ficticias (30)

### 4.1 Principio de diseño

- Cada universidad **inspirada en una NCAA real** pero legalmente distinta.
- Usar ciudades/regiones reales (no son IP) pero nombres de programa originales.
- Cada universidad tiene un **archetype** de identidad.
- Las powerhouses producen mayoría de talento élite. Las small schools son sleepers que pueden producir alguna estrella.

### 4.2 Categorías y probabilidades

Cuando el motor elige universidad para un nuevo jugador procedural, usa estos pesos por tier:

| Tier | Cantidad | Peso (% probabilidad) | Talento esperado |
|------|----------|----------------------|------------------|
| Powerhouse | 5 | 50% | Alto. Mayoría de top picks |
| Strong Program | 10 | 30% | Bueno. Player consistente |
| Mid-tier | 10 | 15% | Medio. Surprise picks ocasionales |
| Small School | 5 | 5% | Bajo. Cinderella stories raros |

### 4.3 POWERHOUSE (5)

Universidades-fábrica de talento. Cuando un fan ve que un jugador viene de aquí, espera élite.

| ID | Nombre | Ciudad | Inspiración real | Identidad |
|----|--------|--------|------------------|-----------|
| TUSC | Tuscaloosa State | Tuscaloosa, AL | Alabama | Disciplina, dinastía, dominante |
| BUCK | Buckeye University | Columbus, OH | Ohio State | Tradición, tamaño, físico |
| ATHN | Athens College | Athens, GA | Georgia | Defensa brutal, recruiting top |
| LONE | Lone Star University | Austin, TX | Texas | Recursos, glamour, expectativas |
| BAYO | Bayou State | Baton Rouge, LA | LSU | Velocidad, atmósfera nocturna |

### 4.4 STRONG PROGRAM (10)

Programas históricos de éxito. Producen talento profesional regularmente.

| ID | Nombre | Ciudad | Inspiración real |
|----|--------|--------|------------------|
| DOMR | South Bend University | South Bend, IN | Notre Dame |
| BLUE | Ann Arbor State | Ann Arbor, MI | Michigan |
| CARD | Stanford-style: Palo Alto Tech | Palo Alto, CA | Stanford |
| SOON | Norman University | Norman, OK | Oklahoma |
| WOLF | Pacific Northwest U | Seattle, WA | Washington |
| HRRC | Coral State | Coral Gables, FL | Miami |
| GATR | Gainesville State | Gainesville, FL | Florida |
| CLEM | Upstate Carolina | Clemson, SC | Clemson |
| HRRN | Lincoln State | Lincoln, NE | Nebraska |
| WOLV | Madison University | Madison, WI | Wisconsin |

### 4.5 MID-TIER (10)

Programas competentes, no powerhouses, producen talento ocasional.

| ID | Nombre | Ciudad | Inspiración real |
|----|--------|--------|------------------|
| MTNW | Mountain West College | Provo, UT | BYU |
| ROCK | Rocky Mountain State | Boulder, CO | Colorado |
| BTAR | Twin Cities University | Minneapolis, MN | Minnesota |
| KNTU | Bluegrass State | Lexington, KY | Kentucky |
| DESM | Tempe University | Tempe, AZ | Arizona State |
| HURL | Tobacco Road University | Chapel Hill, NC | UNC |
| MIZZ | Show-Me State | Columbia, MO | Missouri |
| BOIL | Boilermaker U | West Lafayette, IN | Purdue |
| RAZR | Ozark State | Fayetteville, AR | Arkansas |
| CYCL | Heartland State | Ames, IA | Iowa State |

### 4.6 SMALL SCHOOL (5)

"Sleeper" schools — raras vez producen un drafteable, pero cuando lo hacen es historia.

| ID | Nombre | Ciudad | Inspiración real |
|----|--------|--------|------------------|
| FRGO | North Plains State | Fargo, ND | NDSU (FCS power) |
| EWSH | Cheney College | Cheney, WA | Eastern Washington |
| CHAT | Chattanooga U | Chattanooga, TN | UT Chattanooga |
| RICH | Capital City U | Richmond, VA | Richmond / William & Mary |
| GROV | Grove State | Conway, AR | Central Arkansas |

---

## 5. Reglas para el generador (especificación técnica)

### 5.1 Selección de nombre

```typescript
function generatePlayerName(rng: SeededRandom): { firstName: string; lastName: string } {
  return {
    firstName: rng.pick(FIRST_NAMES),
    lastName: rng.pick(LAST_NAMES)
  };
}
```

- Selección **uniformemente aleatoria** dentro de cada banco.
- No se asigna origen cultural a nivel código.
- La proporción cultural emerge naturalmente del banco (50/30/5/5/10).

### 5.2 Selección de universidad

```typescript
function generateCollegeId(rng: SeededRandom, talentTier: 'star' | 'regular' | 'user'): string {
  const distribution = {
    star: { POWERHOUSE: 0.55, STRONG: 0.30, MID: 0.13, SMALL: 0.02 },
    regular: { POWERHOUSE: 0.20, STRONG: 0.35, MID: 0.35, SMALL: 0.10 },
    user: { POWERHOUSE: 0.50, STRONG: 0.30, MID: 0.15, SMALL: 0.05 }  // base 50/30/15/5
  };
  
  const tier = rng.weightedRandom(distribution[talentTier]);
  return rng.pick(COLLEGES_BY_TIER[tier]);
}
```

**Modulación por tier del jugador:**
- Si el jugador es **estrella** generada (`tier='star'`), aumenta probabilidad de venir de Powerhouse (~55%).
- Si es **regular**, distribución más equitativa (más small schools).
- Si es el **jugador-usuario**, distribución base (50/30/15/5).

Esto refleja la realidad: la mayoría de élite NFL viene de programas top, pero hay sleeper stories.

### 5.3 Detección de duplicados

El sistema NO previene activamente duplicados de nombre completo. Probabilidad de colisión es baja con 90,000 combinaciones × 1,696 jugadores totales ≈ 16 colisiones esperadas (aceptable para realismo NFL — en la NFL real también hay jugadores con nombres muy parecidos).

---

## 6. Próximos pasos (Tarea 3B)

Tras aprobar este documento:

1. **Crear `/src/data/firstNames.ts`** con array de 300 firstName
2. **Crear `/src/data/lastNames.ts`** con array de 300 lastName  
3. **Crear `/src/data/colleges.ts`** con datos completos de 30 universidades:
   - id, name, city, tier, primaryColor, identity
4. **Modificar `createPlayer`** en `player.ts` para:
   - Si no se pasa `firstName`/`lastName` en options, generarlos del banco
   - Asignar `collegeId` aleatorio según tier
5. **Tests** para verificar:
   - Distribución cultural (~50/30/5/5/10)
   - Distribución de tiers de universidad
   - Sin duplicados sistemáticos en simulación de 1000 jugadores

---

## Apéndice — Notas de revisión

### Lo que probablemente quieras revisar

- **Algunos firstNames pueden chirriar.** Si ves "Damar", "Damari", "DaQuan" todos juntos, puede sentirse que estoy haciendo cliché. Si te parece mal, podemos sustituir.
- **"Polynesian fictional"**: sé que mi banco polinesio es flojo. Tua, Manti, Vita son nombres reales de jugadores NFL actuales. Si te preocupa la sensibilidad cultural, podemos:
  - Reducir la proporción polinesia a ~3%
  - O dejarla y aceptar que es parte de la NFL real
- **Universidades**: las que más probablemente quieras cambiar son las inspiradas en universidades muy icónicas (Notre Dame → "South Bend University" suena raro). Podemos iterar.

Tú apruebas el documento (o pides cambios) antes de pasar a la implementación.
