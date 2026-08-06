// La página que abre el cliente. Sin login, sin cuenta, sin nada que instalar:
// quien tiene el enlace, entra.
//
// Aquí no se carga la librería de Supabase a propósito. Esta página se abre desde
// un celular, a veces con mala señal y a veces en el extranjero; cada kilobyte que
// no se manda es tiempo que el cliente no espera. Con fetch basta.

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, llamarRpc } from '../../js/supabase-config.js';
import { nombreParaSaludar, formatearFecha, formatearRango } from '../../js/comun.js';

const WHATSAPP_KARLA = '527774448065';

// ---------------------------------------------------------------- el token

// Tolerante a propósito: en el dominio real el .htaccess sirve /viaje/{token},
// y en local (donde no hay Apache) se usa /viaje/?v={token}. Las dos funcionan
// con este mismo código, sin condicionales repartidos por ahí.
function leerToken() {
  const enConsulta = new URLSearchParams(location.search).get('v');
  if (enConsulta) return enConsulta.trim();

  const ultimo = location.pathname.split('/').filter(Boolean).pop() ?? '';
  // "/viaje/" a secas deja "viaje" como último trozo: eso no es un token.
  if (!ultimo || ultimo === 'viaje' || ultimo.endsWith('.html')) return '';
  return ultimo.trim();
}

// La dirección que se imprime en el papel y se mete en el QR. Se reconstruye a
// partir del token en vez de usar location.href para que ningún parámetro extra
// pegado a la URL acabe colándose en el código impreso.
function urlCanonica(token) {
  const enLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  return enLocal
    ? `${location.origin}/viaje/?v=${token}`
    : `${location.origin}/viaje/${token}`;
}

// El QR es lo que convierte la hoja impresa en algo útil: sin él habría que
// teclear 24 caracteres a mano. Se dibuja en SVG para que salga nítido en papel.
function pintarQr(url) {
  const caja = document.getElementById('qr');
  if (typeof qrcode !== 'function') return;   // sin librería, queda la dirección escrita

  try {
    // Versión automática y corrección de errores media: aguanta que el papel se
    // arrugue o se manche un poco y el código siga leyéndose.
    const codigo = qrcode(0, 'M');
    codigo.addData(url);
    codigo.make();
    caja.innerHTML = codigo.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch {
    caja.remove();
  }
}

// ---------------------------------------------------------------- pantallas

function mostrar(nombre) {
  document.querySelectorAll('.estado').forEach((seccion) => {
    seccion.hidden = seccion.dataset.estado !== nombre;
  });
}

function enlaceWhatsApp(texto) {
  return `https://wa.me/${WHATSAPP_KARLA}?text=${encodeURIComponent(texto)}`;
}

// Los tres finales tristes. Ninguno enseña un código de error ni deja al cliente
// sin salida: siempre hay un botón que lleva a Karla (CONTEXTO.md §7.1).
const FINALES = {
  no_encontrado: {
    titulo: 'No encontramos este itinerario',
    texto: 'Puede que el enlace se haya cortado al copiarlo. Escríbeme y te lo mando de nuevo en un momento.',
    mensaje: 'Hola Karla, abrí el enlace de mi itinerario y no encuentra nada. ¿Me lo puedes reenviar?',
  },
  caducado: {
    titulo: 'Este enlace ya caducó',
    texto: 'Los enlaces se cierran unos meses después del viaje. Escríbeme y te lo reactivo enseguida.',
    mensaje: 'Hola Karla, mi enlace del itinerario ya caducó. ¿Me lo puedes reactivar?',
  },
  revocado: {
    titulo: 'Este enlace ya no está disponible',
    texto: 'Escríbeme y lo revisamos juntos.',
    mensaje: 'Hola Karla, el enlace de mi itinerario ya no funciona. ¿Me ayudas?',
  },
  error: {
    titulo: 'No pudimos abrir tu itinerario',
    texto: 'Puede ser la conexión. Intenta de nuevo en un momento y, si sigue igual, escríbeme.',
    mensaje: 'Hola Karla, no puedo abrir mi itinerario. ¿Me ayudas?',
  },
};

function mostrarProblema(clave) {
  const final = FINALES[clave] ?? FINALES.error;
  document.getElementById('triste-titulo').textContent = final.titulo;
  document.getElementById('triste-texto').textContent  = final.texto;
  document.getElementById('triste-whatsapp').href      = enlaceWhatsApp(final.mensaje);
  mostrar('problema');
}

// ---------------------------------------------------------------- pintar

function pintar(itinerario, token) {
  const nombre = nombreParaSaludar(itinerario.cliente_nombre);

  // Se arma con nodos en vez de innerHTML: el título lo escribe Karla a mano y
  // no tiene por qué acabar interpretándose como HTML.
  const titulo = document.getElementById('saludo-titulo');
  titulo.textContent = nombre ? `Hola ${nombre},` : 'Tu itinerario';
  const destacado = document.createElement('em');
  destacado.textContent = itinerario.titulo;
  titulo.append(destacado);

  const rango = formatearRango(itinerario.fecha_inicio, itinerario.fecha_fin);
  const fechas = document.getElementById('saludo-fechas');
  fechas.textContent = rango;
  fechas.hidden = !rango;

  // "Actualizado el…" es la señal barata de que hay una versión nueva, para el
  // cliente que ya se descargó la anterior (PLAN-DE-TRABAJO.md §2.5).
  document.getElementById('saludo-actualizado').textContent =
    `Actualizado el ${formatearFecha(itinerario.updated_at)}`;

  document.getElementById('boton-whatsapp').href = enlaceWhatsApp(
    `Hola Karla, tengo una duda sobre mi itinerario (${itinerario.titulo}).`,
  );

  const url = urlCanonica(token);
  document.getElementById('enlace-impreso').textContent = url;
  pintarQr(url);

  mostrar('ok');
}

// ---------------------------------------------------------------- el PDF

const errorPdf = document.getElementById('error-pdf');

// La firma se pide solo cuando el cliente pulsa un botón, nunca al cargar. Así la
// vista previa que arma WhatsApp no gasta firmas ni cuenta como visita real.
async function pedirFirma(token) {
  const respuesta = await fetch(`${SUPABASE_URL}/functions/v1/itinerario-pdf`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error ?? 'error');
  return datos;
}

function conBotonOcupado(boton, textoOriginal, tarea) {
  boton.disabled = true;
  boton.textContent = 'Un momento…';
  return tarea().finally(() => {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  });
}

function fallo(mensaje) {
  errorPdf.textContent = mensaje;
  errorPdf.hidden = false;
}

// ---------------------------------------------------------------- arranque

const token = leerToken();

if (!token) {
  mostrarProblema('no_encontrado');
} else {
  try {
    const itinerario = await llamarRpc('itinerario_por_token', { p_token: token });

    if (itinerario.estado !== 'ok') {
      mostrarProblema(itinerario.estado);
    } else {
      pintar(itinerario, token);

      const botonAbrir      = document.getElementById('boton-abrir');
      const botonDescargar  = document.getElementById('boton-descargar');
      const visor           = document.getElementById('visor');
      const marco           = document.getElementById('visor-marco');

      botonAbrir.addEventListener('click', () => {
        errorPdf.hidden = true;
        // En pantalla grande el PDF se incrusta aquí mismo. En el celular no:
        // Safari en iPhone lo deja en blanco (PLAN-DE-TRABAJO.md §2.3), así que
        // ahí se abre en una pestaña, que es lo que sí funciona siempre.
        const cabeEnLaPagina = window.matchMedia('(min-width: 900px)').matches;

        // La pestaña se abre ANTES de pedir la firma: si se abriera después,
        // el navegador la trataría como emergente y la bloquearía.
        const pestania = cabeEnLaPagina ? null : window.open('', '_blank');

        conBotonOcupado(botonAbrir, 'Abrir mi itinerario', async () => {
          try {
            const { url_abrir } = await pedirFirma(token);
            if (cabeEnLaPagina) {
              marco.src = url_abrir;
              visor.hidden = false;
              visor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (pestania) {
              pestania.location = url_abrir;
            } else {
              location.href = url_abrir;
            }
          } catch {
            pestania?.close();
            fallo('No pudimos abrir el archivo. Revisa tu conexión e intenta otra vez.');
          }
        });
      });

      botonDescargar.addEventListener('click', () => {
        errorPdf.hidden = true;
        conBotonOcupado(botonDescargar, 'Descargar', async () => {
          try {
            const { url_descargar } = await pedirFirma(token);
            const enlace = document.createElement('a');
            enlace.href = url_descargar;
            enlace.rel = 'noopener';
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
          } catch {
            fallo('No pudimos descargar el archivo. Revisa tu conexión e intenta otra vez.');
          }
        });
      });

      document.getElementById('boton-imprimir').addEventListener('click', () => window.print());
    }
  } catch {
    mostrarProblema('error');
  }
}
