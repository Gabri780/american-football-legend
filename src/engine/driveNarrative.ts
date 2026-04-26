import { Drive, DriveOutcome } from './drive';
import { SeededRandom } from './prng';

const HIGHLIGHT_TEMPLATES: Record<DriveOutcome, string[]> = {
  'TD': [
    "¡Touchdown! Una ejecución perfecta que culmina con puntos en la endzone.",
    "TD en una jugada eléctrica que deja a la defensa sin respuestas.",
    "El ataque rompe la resistencia final y anota un touchdown crucial.",
    "TD tras una serie de jugadas impecables. Dominio total.",
    "Pase preciso al corazón de la defensa para el touchdown."
  ],
  'FG': [
    "La patada es buena. El drive se traduce en 3 puntos valiosos.",
    "El kicker no falla y asegura los puntos tras una serie sólida.",
    "Field goal convertido. El ataque logra rescatar puntos de la posesión.",
    "División de los postes perfecta. 3 puntos más al marcador.",
    "Tras atascarse en la redzone, el field goal entra sin problemas."
  ],
  'MISSED_FG': [
    "La patada se va desviada. Una oportunidad perdida de sumar puntos.",
    "El field goal golpea el poste y sale. Mala suerte para el equipo.",
    "Intento fallido. El viento o la mala puntería niegan los 3 puntos.",
    "No hay puntos. El kicker no logra conectar entre los tres palos.",
    "Ocasión desperdiciada tras un drive largo que acaba en nada."
  ],
  'PUNT': [
    "El ataque no carbura y se ven obligados a despejar el balón.",
    "Tres y fuera. La defensa ha dominado completamente esta serie.",
    "Punt largo que encajona al rival en su propio campo.",
    "Sin opciones de avanzar. El despeje es la única salida.",
    "Serie estancada en el medio del campo. Balón para el oponente."
  ],
  'TURNOVER_INT': [
    "¡Interceptado! El QB arriesga demasiado y regala la posesión.",
    "Lectura horrible que termina en manos del safety rival.",
    "Picked off. La defensa lee la jugada y roba el ovoide.",
    "Pase desviado que acaba siendo interceptado por el linebacker.",
    "Error costoso del mariscal de campo que entrega el balón por aire."
  ],
  'TURNOVER_FUMBLE': [
    "¡Fumble! El corredor pierde el balón y la defensa lo recupera.",
    "Balón suelto en el impacto. Posesión para el equipo contrario.",
    "Error de manejo del balón que termina en pérdida de posesión.",
    "La defensa fuerza el balón suelto y salta sobre él con éxito.",
    "Pérdida de balón traumática en mitad de un avance prometedor."
  ],
  'DOWNS': [
    "Fallo en cuarta oportunidad. La defensa resiste el envite.",
    "No logran alcanzar la marca. Pérdida de balón por downs.",
    "Apuesta arriesgada en 4th down que no sale bien.",
    "La defensa cierra todos los huecos y recupera el balón.",
    "Se quedan cortos por centímetros. Cambio de posesión."
  ],
  'SAFETY': [
    "¡Safety! El QB es placado en su propia zona de anotación.",
    "Desastre en la línea: el corredor es detenido para un safety.",
    "Error fatal que regala dos puntos y el balón al rival.",
    "Atrapados en la endzone. La presión defensiva cobra su premio.",
    "Penalización o placaje en la zona final. 2 puntos para el rival."
  ],
  'END_HALF': [
    "Se acaba el tiempo. El drive termina con el final de la mitad.",
    "El reloj llega a cero antes de que puedan intentar anotar.",
    "Final del segundo cuarto. Jugadores a vestuarios.",
    "Sin tiempo para más. La posesión muere con la bocina.",
    "Gestión de reloj que termina agotando el tiempo del periodo."
  ],
  'END_GAME': [
    "Final del partido. El drive concluye con el pitido final.",
    "No queda tiempo en el reloj. Victoria asegurada.",
    "El encuentro termina durante esta posesión.",
    "Final de las hostilidades. El reloj dicta sentencia.",
    "Se agota el tiempo de juego. Partido finalizado."
  ]
};

export function generateDriveNarrative(drive: Drive, rng: SeededRandom): { description: string, highlight: string } {
  const timeStr = formatTime(drive.timeConsumed);
  const description = `Drive de ${drive.plays} jugadas, ${drive.totalYards} yardas en ${timeStr}.`;
  
  const templates = HIGHLIGHT_TEMPLATES[drive.outcome];
  const highlight = rng.pick(templates);

  return { description, highlight };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
