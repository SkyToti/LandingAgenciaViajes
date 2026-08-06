// Alta de itinerarios — el corazón del panel para Karla.
//
// Regla de oro del proyecto: el PDF es una caja cerrada. Aquí no se abre,
// no se analiza y no se le pide a Karla que capture nada de su contenido.
// El formulario solo recoge el sobre: a quién va, cómo se llama y cuándo es.

import { cliente } from './sesion.js';
import { nombreParaSaludar } from '../../js/comun.js';

const AVISO_MB = 8;    // a partir de aquí se avisa: descargarlo con datos en el extranjero duele
const TOPE_MB  = 25;   // tope duro, el mismo que tiene el bucket

// ------------------------------------------------------------------ utilidades

// Token de la URL del cliente. 24 caracteres del alfabeto seguro para URLs
// (64 símbolos = 6 bits por carácter → 144 bits de azar). El plan pide 21 o más.
// Se usa crypto, no Math.random: este token ES la credencial de acceso.
function generarToken(longitud = 24) {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = crypto.getRandomValues(new Uint8Array(longitud));
  let token = '';
  for (const b of bytes) token += alfabeto[b & 63];
  return token;
}

// Caducidad: fecha de fin + 3 meses (decisión de Karla, CONTEXTO.md §7.1).
// Sin fechas, el respaldo son 6 meses desde hoy: ningún registro se queda sin caducar.
function calcularCaducidad(fechaFin) {
  const base = fechaFin ? new Date(`${fechaFin}T12:00:00`) : new Date();
  const meses = fechaFin ? 3 : 6;
  const caducidad = new Date(base);
  caducidad.setMonth(caducidad.getMonth() + meses);
  return caducidad.toISOString();
}

function urlDelItinerario(token) {
  // En local no hay reescritura de Apache, así que se usa ?v=. En el dominio
  // real el .htaccess sirve la URL limpia. El lector del token soporta ambas.
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? `${location.origin}/viaje/?v=${token}`
    : `${location.origin}/viaje/${token}`;
}

// Plantilla acordada en CONTEXTO.md §7.2. Karla la edita antes de mandarla.
// El saludo usa la misma función que la página del cliente (js/comun.js) para
// que el mensaje de WhatsApp y la página digan el nombre igual.
function mensajeWhatsApp(nombreCompleto, enlace) {
  const nombre = nombreParaSaludar(nombreCompleto);
  return `¡Hola ${nombre}! Ya quedó listo tu itinerario ✈️

Aquí lo puedes ver y descargar:
${enlace}

Te recomiendo descargarlo antes de viajar para tenerlo aunque no tengas internet.
Cualquier duda me escribes por aquí. ¡Ya falta poco!`;
}

async function copiar(texto, boton, textoOriginal) {
  try {
    await navigator.clipboard.writeText(texto);
    boton.textContent = '¡Copiado!';
  } catch {
    boton.textContent = 'No se pudo copiar';
  }
  setTimeout(() => { boton.textContent = textoOriginal; }, 2000);
}

// ------------------------------------------------------------------ elementos
const form          = document.getElementById('form-itinerario');
const vistaAlta     = document.getElementById('vista-alta');
const vistaResultado = document.getElementById('vista-resultado');
const campoPdf      = document.getElementById('pdf');
const ayudaPdf      = document.getElementById('ayuda-pdf');
const campoInicio   = document.getElementById('inicio');
const campoFin      = document.getElementById('fin');
const ayudaCaducidad = document.getElementById('ayuda-caducidad');
const cajaError     = document.getElementById('error-alta');
const botonCrear    = document.getElementById('boton-crear');

const resultadoIntro   = document.getElementById('resultado-intro');
const enlaceGenerado   = document.getElementById('enlace-generado');
const campoMensaje     = document.getElementById('mensaje');
const botonCopiarEnlace  = document.getElementById('boton-copiar-enlace');
const botonCopiarMensaje = document.getElementById('boton-copiar-mensaje');
const botonOtro        = document.getElementById('boton-otro');

function mostrarError(texto) {
  cajaError.textContent = texto;
  cajaError.hidden = false;
  cajaError.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function limpiarError() {
  cajaError.hidden = true;
  cajaError.textContent = '';
}

// ------------------------------------------------------------------ avisos en vivo

// El peso del PDF se avisa al elegirlo, no al enviar: si pesa 20 MB conviene
// que Karla lo sepa antes de esperar la subida.
campoPdf.addEventListener('change', () => {
  const archivo = campoPdf.files[0];
  if (!archivo) {
    ayudaPdf.textContent = 'Solo PDF, hasta 25 MB.';
    ayudaPdf.className = 'campo__ayuda';
    return;
  }

  const mb = archivo.size / (1024 * 1024);
  if (mb > TOPE_MB) {
    ayudaPdf.textContent = `Pesa ${mb.toFixed(1)} MB y el tope son ${TOPE_MB} MB. Hay que comprimirlo.`;
    ayudaPdf.className = 'campo__ayuda campo__ayuda--error';
  } else if (mb > AVISO_MB) {
    ayudaPdf.textContent = `Pesa ${mb.toFixed(1)} MB. Funciona, pero a tu cliente le va a costar bajarlo desde el extranjero con datos. Si puedes comprimirlo, mejor.`;
    ayudaPdf.className = 'campo__ayuda campo__ayuda--aviso';
  } else {
    ayudaPdf.textContent = `${archivo.name} · ${mb.toFixed(1)} MB`;
    ayudaPdf.className = 'campo__ayuda campo__ayuda--ok';
  }
});

// Karla ve la fecha de caducidad real mientras escribe, no una regla abstracta.
function refrescarCaducidad() {
  const caducidad = new Date(calcularCaducidad(campoFin.value || null));
  const texto = caducidad.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  ayudaCaducidad.textContent = campoFin.value
    ? `El enlace va a caducar el ${texto} (3 meses después del viaje). Se puede reactivar cuando quieras.`
    : `Sin fechas, el enlace caduca el ${texto} (6 meses). Y no habrá botón de calendario.`;
}
campoFin.addEventListener('change', refrescarCaducidad);
campoInicio.addEventListener('change', refrescarCaducidad);

// ------------------------------------------------------------------ alta

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarError();

  const nombre  = document.getElementById('cliente').value.trim();
  const titulo  = document.getElementById('titulo').value.trim();
  const tipo    = form.querySelector('input[name="tipo"]:checked').value;
  const inicio  = campoInicio.value || null;
  const fin     = campoFin.value || null;
  const archivo = campoPdf.files[0];

  if (!nombre)  return mostrarError('Falta el nombre del cliente.');
  if (!titulo)  return mostrarError('Falta el título del viaje.');
  if (!archivo) return mostrarError('Falta el PDF del itinerario.');

  if (archivo.type !== 'application/pdf') {
    return mostrarError('El archivo tiene que ser un PDF.');
  }
  if (archivo.size > TOPE_MB * 1024 * 1024) {
    return mostrarError(`El PDF pesa más de ${TOPE_MB} MB. Hay que comprimirlo antes de subirlo.`);
  }
  if (inicio && fin && fin < inicio) {
    return mostrarError('La fecha de regreso es anterior a la de salida. Revísalas.');
  }

  botonCrear.disabled = true;
  botonCrear.textContent = 'Subiendo el PDF…';

  const token = generarToken();
  // La ruta cuelga del token: quien puede adivinar la ruta ya tenía el token.
  // El número de versión evita pisar el archivo anterior al reemplazarlo.
  const ruta = `${token}/v1.pdf`;

  const { error: errorSubida } = await cliente.storage
    .from('itinerarios')
    .upload(ruta, archivo, { contentType: 'application/pdf', upsert: false });

  if (errorSubida) {
    botonCrear.disabled = false;
    botonCrear.textContent = 'Crear el enlace';
    return mostrarError(`No se pudo subir el PDF: ${errorSubida.message}`);
  }

  botonCrear.textContent = 'Guardando…';

  const { error: errorInsercion } = await cliente.from('itinerarios').insert({
    token,
    cliente_nombre: nombre,
    titulo,
    tipo,
    fecha_inicio: inicio,
    fecha_fin: fin,
    pdf_path: ruta,
    expires_at: calcularCaducidad(fin),
  });

  botonCrear.disabled = false;
  botonCrear.textContent = 'Crear el enlace';

  if (errorInsercion) {
    // El PDF ya subió pero el registro falló: sin registro ese archivo es basura.
    await cliente.storage.from('itinerarios').remove([ruta]);
    return mostrarError(`No se pudo guardar el itinerario: ${errorInsercion.message}`);
  }

  const enlace = urlDelItinerario(token);
  resultadoIntro.textContent = `El itinerario de ${nombre} ya está en línea. Mándaselo por WhatsApp.`;
  enlaceGenerado.textContent = enlace;
  campoMensaje.value = mensajeWhatsApp(nombre, enlace);

  vistaAlta.hidden = true;
  vistaResultado.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ------------------------------------------------------------------ resultado

botonCopiarEnlace.addEventListener('click', () => {
  copiar(enlaceGenerado.textContent, botonCopiarEnlace, 'Copiar');
});

botonCopiarMensaje.addEventListener('click', () => {
  copiar(campoMensaje.value, botonCopiarMensaje, 'Copiar mensaje');
});

botonOtro.addEventListener('click', () => {
  form.reset();
  ayudaPdf.textContent = 'Solo PDF, hasta 25 MB.';
  ayudaPdf.className = 'campo__ayuda';
  refrescarCaducidad();
  vistaResultado.hidden = true;
  vistaAlta.hidden = false;
  document.getElementById('cliente').focus();
});

refrescarCaducidad();
