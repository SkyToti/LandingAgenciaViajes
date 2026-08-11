// Texto compartido entre el panel de Karla y la página del cliente.
// Viven juntos a propósito: el saludo del mensaje de WhatsApp y el de la página
// tienen que sonar igual, o el cliente nota la costura.

// "¡Hola Alicia!" suena a Karla; "¡Hola Alicia Ocampo Ramírez!" suena al banco.
// Pero si el itinerario va a nombre de dos personas ("Ana y Luis") se deja
// completo: recortarlo dejaría fuera a uno de los dos.
export function nombreParaSaludar(nombre) {
  if (!nombre) return '';
  if (/\sy\s/i.test(nombre)) return nombre.trim();
  return nombre.trim().split(/\s+/)[0];
}

// Las fechas llegan como 'YYYY-MM-DD'. Se les pone hora de mediodía para que el
// huso horario no las corra un día hacia atrás, que es el clásico "mi viaje
// empieza el 12" convertido en 11.
function comoFecha(iso) {
  return iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
}

export function formatearFecha(iso, conAnio = true) {
  const opciones = conAnio
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'long' };
  return comoFecha(iso).toLocaleDateString('es-MX', opciones);
}

// "13 de agosto — 18 de diciembre de 2026": el año no se repite si es el mismo.
export function formatearRango(inicio, fin) {
  if (!inicio && !fin) return '';
  if (inicio && !fin)  return `A partir del ${formatearFecha(inicio)}`;
  if (!inicio && fin)  return `Hasta el ${formatearFecha(fin)}`;

  const mismoAnio = comoFecha(inicio).getFullYear() === comoFecha(fin).getFullYear();
  return `${formatearFecha(inicio, !mismoAnio)} — ${formatearFecha(fin)}`;
}
