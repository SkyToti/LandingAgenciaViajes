// "Agregar a mi calendario" — el nivel 0 del plan: UN evento que cubre todo el
// viaje, con el enlace dentro (CONTEXTO.md §2b).
//
// Por qué esto importa más de lo que parece: el calendario del teléfono funciona
// SIN INTERNET y avisa solo. Para alguien que viaja con el roaming apagado, ese
// evento es un recordatorio que le llega igual y que además lleva dentro la
// dirección de su itinerario. Cero curva de aprendizaje: ya sabe usar su calendario.

// El formato iCalendar (RFC 5545) es texto plano, así que no hace falta ninguna
// librería. Solo hay que respetar tres reglas y son fáciles de romper:
//
//   1. Las líneas se separan con CRLF (\r\n), no con \n. Outlook rechaza el
//      archivo si solo hay \n.
//   2. Las comas, los punto y coma y las barras invertidas van escapados dentro
//      de los textos, o el archivo se parte donde no debe.
//   3. En un evento de día completo, DTEND es EXCLUSIVO: para que el último día
//      del viaje quede dentro, hay que sumarle uno.

function escapar(texto) {
  return String(texto)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// 'YYYY-MM-DD' → 'YYYYMMDD'
function comoFechaIcs(iso) {
  return iso.slice(0, 10).replace(/-/g, '');
}

function diaSiguiente(iso) {
  const fecha = new Date(`${iso}T12:00:00`);
  fecha.setDate(fecha.getDate() + 1);
  return fecha.toISOString().slice(0, 10);
}

// Marca de tiempo UTC para DTSTAMP: 'YYYYMMDDTHHMMSSZ'
function ahoraUtc() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Las líneas de más de 75 octetos hay que plegarlas, o algunos clientes cortan
// el contenido. Se pliega con un salto seguido de un espacio.
//
// Dos trampas aquí, y las dos importan porque este texto lleva acentos y un emoji:
//   · El límite del RFC son OCTETOS, no caracteres. "descárgalo" ocupa más bytes
//     que letras, así que contar caracteres se pasa del límite sin avisar.
//   · Hay que cortar por caracteres completos. Partir un emoji por la mitad
//     produce un archivo con basura que algunos calendarios rechazan entero.
const LIMITE_OCTETOS = 75;
const codificador = new TextEncoder();
const octetosDe = (texto) => codificador.encode(texto).length;

function plegar(linea) {
  if (octetosDe(linea) <= LIMITE_OCTETOS) return linea;

  const trozos = [];
  let actual = '';

  // Array.from recorre por caracteres completos, no por unidades UTF-16,
  // así que un emoji nunca se parte en dos.
  for (const caracter of Array.from(linea)) {
    if (octetosDe(actual + caracter) > LIMITE_OCTETOS) {
      trozos.push(actual);
      actual = ' ' + caracter;   // las continuaciones empiezan con un espacio
    } else {
      actual += caracter;
    }
  }
  if (actual) trozos.push(actual);

  return trozos.join('\r\n');
}

export function construirIcs({ titulo, inicio, fin, enlace, token }) {
  // Sin fechas no hay evento posible. Quien llama ya lo comprueba, pero más vale
  // no generar un archivo roto si algún día se llama desde otro sitio.
  if (!inicio && !fin) return null;

  const desde = inicio ?? fin;
  const hasta = fin ?? inicio;

  const descripcion =
    `Aquí puedes ver y descargar tu itinerario completo:\n${enlace}\n\n` +
    `Consejo: descárgalo antes de viajar para tenerlo aunque no tengas internet.`;

  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tierra de Viajes by Fraveo//Portal de itinerarios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // El UID tiene que ser estable: si el cliente vuelve a agregarlo, el
    // calendario actualiza el evento en vez de duplicarlo.
    `UID:${token}@tierradeviajes`,
    `DTSTAMP:${ahoraUtc()}`,
    `DTSTART;VALUE=DATE:${comoFechaIcs(desde)}`,
    `DTEND;VALUE=DATE:${comoFechaIcs(diaSiguiente(hasta))}`,
    plegar(`SUMMARY:${escapar(`✈️ ${titulo}`)}`),
    plegar(`DESCRIPTION:${escapar(descripcion)}`),
    plegar(`URL:${escapar(enlace)}`),
    'TRANSP:TRANSPARENT',   // no marca los días como "ocupado" en el trabajo
    'BEGIN:VALARM',
    // Un aviso tres días antes: el momento útil para acordarse de descargarlo.
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    plegar(`DESCRIPTION:${escapar('Ya casi. Descarga tu itinerario para tenerlo sin internet.')}`),
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lineas.join('\r\n') + '\r\n';
}

// El nombre del archivo también acaba en el teléfono del cliente.
export function nombreDelArchivo(titulo) {
  const limpio = String(titulo)
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return `${limpio || 'Mi viaje'}.ics`;
}

export function descargarIcs(contenido, nombre) {
  // text/calendar es lo que hace que iOS y Android ofrezcan "abrir en Calendario"
  // en vez de tratarlo como un archivo de texto cualquiera.
  const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  // Sin esto el blob se queda en memoria hasta que se cierra la pestaña.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
