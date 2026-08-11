// Reglas del dominio, compartidas por el alta y la lista.
// Viven juntas para que "cuánto dura un enlace" o "cómo se ve el mensaje de
// WhatsApp" tengan una sola respuesta en todo el panel.

export const AVISO_MB = 8;    // a partir de aquí se avisa: bajarlo con datos en el extranjero duele
export const TOPE_MB  = 25;   // tope duro, el mismo que tiene configurado el bucket

// Días antes de caducar en los que el itinerario se marca como "por caducar".
// Un mes da margen de sobra para reactivarlo antes de que el cliente se quede fuera.
const DIAS_DE_AVISO = 30;

// El token de la URL del cliente. 24 caracteres del alfabeto seguro para URLs
// (64 símbolos = 6 bits por carácter → 144 bits de azar). El plan pide 21 o más.
// Se usa crypto y no Math.random porque este token ES la credencial de acceso.
export function generarToken(longitud = 24) {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = crypto.getRandomValues(new Uint8Array(longitud));
  let token = '';
  for (const b of bytes) token += alfabeto[b & 63];
  return token;
}

function sumarMeses(fecha, meses) {
  const resultado = new Date(fecha);
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
}

// Caducidad al crear: fin del viaje + 3 meses (decisión de Karla, CONTEXTO.md §7.1).
// Sin fechas, el respaldo son 6 meses desde hoy: ningún registro se queda sin caducar.
export function calcularCaducidad(fechaFin) {
  const base = fechaFin ? new Date(`${fechaFin}T12:00:00`) : new Date();
  return sumarMeses(base, fechaFin ? 3 : 6).toISOString();
}

// "Reactivar 3 meses más": se cuentan desde hoy, no desde la caducidad vieja.
// Si se contaran desde la vieja, reactivar un enlace de hace un año seguiría
// dejándolo muerto, que es justo lo contrario de lo que Karla quiere.
export function caducidadReactivada() {
  return sumarMeses(new Date(), 3).toISOString();
}

export function urlDelItinerario(token) {
  // En local no hay reescritura de Apache, así que se usa ?v=. En el dominio real
  // el .htaccess sirve la URL limpia. El lector del token soporta las dos formas.
  const enLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  return enLocal
    ? `${location.origin}/viaje/?v=${token}`
    : `${location.origin}/viaje/${token}`;
}

// Los cuatro estados que Karla necesita distinguir de un vistazo.
export function estadoDe(itinerario) {
  if (itinerario.revoked) return 'revocado';

  const caduca = new Date(itinerario.expires_at);
  const ahora  = new Date();
  if (caduca <= ahora) return 'caducado';

  const dias = Math.ceil((caduca - ahora) / (1000 * 60 * 60 * 24));
  return dias <= DIAS_DE_AVISO ? 'por_caducar' : 'activo';
}

export const ETIQUETAS_DE_ESTADO = {
  activo:      'Activo',
  por_caducar: 'Por caducar',
  caducado:    'Caducado',
  revocado:    'Revocado',
};

// Plantilla acordada en CONTEXTO.md §7.2. Karla la edita antes de mandarla.
export function mensajeWhatsApp(nombre, enlace) {
  return `¡Hola ${nombre}! Ya quedó listo tu itinerario ✈️

Aquí lo puedes ver y descargar:
${enlace}

Te recomiendo descargarlo antes de viajar para tenerlo aunque no tengas internet.
Cualquier duda me escribes por aquí. ¡Ya falta poco!`;
}

// Para cuando se reemplaza el PDF: el cliente ya se descargó la versión vieja y
// no se entera solo (PLAN-DE-TRABAJO.md §2.5). En un viaje, un vuelo que cambió
// es un problema de verdad.
export function mensajeActualizacion(nombre, enlace) {
  return `¡Hola ${nombre}! Actualicé tu itinerario ✈️

Ábrelo de nuevo aquí para tener la versión más reciente:
${enlace}

Si ya lo habías descargado, vuelve a descargarlo para que no se te quede el viejo.`;
}

export async function copiar(texto, boton, textoOriginal) {
  try {
    await navigator.clipboard.writeText(texto);
    boton.textContent = '¡Copiado!';
  } catch {
    boton.textContent = 'No se pudo copiar';
  }
  setTimeout(() => { boton.textContent = textoOriginal; }, 2000);
}
