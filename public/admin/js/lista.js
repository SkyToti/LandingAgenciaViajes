// La lista de itinerarios de Karla.
//
// Sin esto, ella crea enlaces y los pierde — que es exactamente el problema que
// vinimos a resolver, solo que movido de su cliente a ella. Aquí puede volver a
// encontrar cualquier itinerario, recopiar el enlace, reemplazar el PDF,
// reactivar uno caducado o cerrarlo.

import { cliente } from './sesion.js';
import { nombreParaSaludar, formatearFecha, formatearRango } from '../../js/comun.js';
import {
  TOPE_MB,
  urlDelItinerario, estadoDe, ETIQUETAS_DE_ESTADO,
  mensajeWhatsApp, mensajeActualizacion, caducidadReactivada, copiar,
} from './itinerarios.js';

const lista        = document.getElementById('lista-itinerarios');
const buscador     = document.getElementById('buscador');
const vacio        = document.getElementById('lista-vacia');
const cargando     = document.getElementById('lista-cargando');
const errorLista   = document.getElementById('error-lista');
const entradaPdf   = document.getElementById('reemplazo-pdf');

let itinerarios = [];
let tokenAReemplazar = null;

// ------------------------------------------------------------------ datos

export async function recargarLista() {
  cargando.hidden = false;
  errorLista.hidden = true;

  const { data, error } = await cliente
    .from('itinerarios')
    .select('token, cliente_nombre, titulo, tipo, fecha_inicio, fecha_fin, pdf_path, version, revoked, expires_at, updated_at, created_at, last_opened_at')
    .order('created_at', { ascending: false });

  cargando.hidden = true;

  if (error) {
    errorLista.textContent = `No se pudo cargar la lista: ${error.message}`;
    errorLista.hidden = false;
    return;
  }

  itinerarios = data ?? [];
  pintarLista();
}

// ------------------------------------------------------------------ pintado

function filtrados() {
  const busqueda = buscador.value.trim().toLowerCase();
  if (!busqueda) return itinerarios;
  // Busca por cliente y también por título: Karla se acuerda de "el de Francia"
  // tan a menudo como del nombre de la persona.
  return itinerarios.filter((i) =>
    i.cliente_nombre.toLowerCase().includes(busqueda) ||
    i.titulo.toLowerCase().includes(busqueda));
}

function boton(texto, accion, clase = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `itin__accion ${clase}`.trim();
  b.dataset.accion = accion;
  b.textContent = texto;
  return b;
}

function tarjeta(itinerario) {
  const estado = estadoDe(itinerario);

  const art = document.createElement('article');
  art.className = `itin itin--${estado}`;
  art.dataset.token = itinerario.token;

  const insignia = document.createElement('span');
  insignia.className = `itin__estado itin__estado--${estado}`;
  insignia.textContent = ETIQUETAS_DE_ESTADO[estado];

  const nombre = document.createElement('h3');
  nombre.className = 'itin__cliente';
  nombre.textContent = itinerario.cliente_nombre;

  const titulo = document.createElement('p');
  titulo.className = 'itin__titulo';
  titulo.textContent = itinerario.titulo;

  const meta = document.createElement('p');
  meta.className = 'itin__meta';
  const rango = formatearRango(itinerario.fecha_inicio, itinerario.fecha_fin);
  const caduca = estado === 'caducado'
    ? `Caducó el ${formatearFecha(itinerario.expires_at)}`
    : `Caduca el ${formatearFecha(itinerario.expires_at)}`;
  meta.textContent = [rango, caduca].filter(Boolean).join(' · ');

  // "¿Ya lo abrió?" es lo primero que Karla quiere saber después de mandar el
  // enlace, así que va en la tarjeta y no escondido en un detalle.
  const apertura = document.createElement('p');
  apertura.className = itinerario.last_opened_at
    ? 'itin__apertura itin__apertura--visto'
    : 'itin__apertura';
  apertura.textContent = itinerario.last_opened_at
    ? `Lo abrió el ${formatearFecha(itinerario.last_opened_at)}`
    : 'Todavía no lo ha abierto';

  const acciones = document.createElement('div');
  acciones.className = 'itin__acciones';
  acciones.append(
    boton('Copiar enlace', 'copiar-enlace'),
    boton('Copiar mensaje', 'copiar-mensaje'),
    boton('Reemplazar PDF', 'reemplazar'),
  );

  // Reactivar solo tiene sentido si el enlace está muerto o a punto.
  if (estado === 'caducado' || estado === 'por_caducar') {
    acciones.append(boton('Reactivar 3 meses', 'reactivar', 'itin__accion--destacada'));
  }
  acciones.append(
    itinerario.revoked
      ? boton('Volver a abrir', 'restaurar')
      : boton('Revocar', 'revocar', 'itin__accion--peligro'),
  );

  art.append(insignia, nombre, titulo, meta);

  if (itinerario.version > 1) {
    const version = document.createElement('p');
    version.className = 'itin__version';
    version.textContent = `Versión ${itinerario.version} · actualizado el ${formatearFecha(itinerario.updated_at)}`;
    art.append(version);
  }

  art.append(apertura, acciones);

  const aviso = document.createElement('p');
  aviso.className = 'itin__aviso';
  aviso.hidden = true;
  art.append(aviso);

  return art;
}

function pintarLista() {
  lista.replaceChildren();
  const visibles = filtrados();

  vacio.hidden = visibles.length > 0;
  if (!visibles.length) {
    vacio.textContent = itinerarios.length
      ? 'Ningún itinerario coincide con esa búsqueda.'
      : 'Todavía no has creado ningún itinerario.';
    return;
  }

  visibles.forEach((i) => lista.append(tarjeta(i)));
}

buscador.addEventListener('input', pintarLista);

// ------------------------------------------------------------------ acciones

function buscarPorToken(token) {
  return itinerarios.find((i) => i.token === token);
}

function avisar(art, texto) {
  const aviso = art.querySelector('.itin__aviso');
  aviso.textContent = texto;
  aviso.hidden = false;
}

// Revocar deja al cliente fuera de su propio itinerario, así que no se dispara
// al primer clic: el botón pregunta primero y se arrepiente solo a los 4 segundos.
function pedirConfirmacion(boton, alConfirmar) {
  if (boton.dataset.confirmando === 'si') {
    delete boton.dataset.confirmando;
    alConfirmar();
    return;
  }
  const original = boton.textContent;
  boton.dataset.confirmando = 'si';
  boton.textContent = '¿Seguro?';
  setTimeout(() => {
    if (boton.dataset.confirmando === 'si') {
      delete boton.dataset.confirmando;
      boton.textContent = original;
    }
  }, 4000);
}

async function actualizar(token, cambios) {
  const { error } = await cliente.from('itinerarios').update(cambios).eq('token', token);
  if (error) throw new Error(error.message);
  await recargarLista();
}

lista.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('.itin__accion');
  if (!boton) return;

  const art   = boton.closest('.itin');
  const token = art.dataset.token;
  const itinerario = buscarPorToken(token);
  if (!itinerario) return;

  const enlace = urlDelItinerario(token);
  const nombre = nombreParaSaludar(itinerario.cliente_nombre);

  switch (boton.dataset.accion) {
    case 'copiar-enlace':
      copiar(enlace, boton, 'Copiar enlace');
      break;

    case 'copiar-mensaje':
      copiar(mensajeWhatsApp(nombre, enlace), boton, 'Copiar mensaje');
      break;

    case 'reemplazar':
      tokenAReemplazar = token;
      entradaPdf.value = '';       // permite volver a elegir el mismo archivo
      entradaPdf.click();
      break;

    case 'reactivar':
      boton.disabled = true;
      try {
        await actualizar(token, { expires_at: caducidadReactivada() });
      } catch (e) {
        avisar(art, `No se pudo reactivar: ${e.message}`);
        boton.disabled = false;
      }
      break;

    case 'revocar':
      pedirConfirmacion(boton, async () => {
        try {
          await actualizar(token, { revoked: true });
        } catch (e) {
          avisar(art, `No se pudo revocar: ${e.message}`);
        }
      });
      break;

    case 'restaurar':
      boton.disabled = true;
      try {
        await actualizar(token, { revoked: false });
      } catch (e) {
        avisar(art, `No se pudo reabrir: ${e.message}`);
        boton.disabled = false;
      }
      break;
  }
});

// ------------------------------------------------------------------ reemplazar el PDF

entradaPdf.addEventListener('change', async () => {
  const archivo = entradaPdf.files[0];
  const token   = tokenAReemplazar;
  tokenAReemplazar = null;
  if (!archivo || !token) return;

  const art = lista.querySelector(`.itin[data-token="${CSS.escape(token)}"]`);
  const itinerario = buscarPorToken(token);
  if (!art || !itinerario) return;

  if (archivo.type !== 'application/pdf') {
    return avisar(art, 'El archivo tiene que ser un PDF.');
  }
  if (archivo.size > TOPE_MB * 1024 * 1024) {
    return avisar(art, `El PDF pesa más de ${TOPE_MB} MB. Hay que comprimirlo.`);
  }

  avisar(art, 'Subiendo el PDF nuevo…');

  const versionNueva = itinerario.version + 1;
  const rutaNueva    = `${token}/v${versionNueva}.pdf`;
  const rutaVieja    = itinerario.pdf_path;

  const { error: errorSubida } = await cliente.storage
    .from('itinerarios')
    .upload(rutaNueva, archivo, { contentType: 'application/pdf', upsert: false });

  if (errorSubida) {
    return avisar(art, `No se pudo subir: ${errorSubida.message}`);
  }

  try {
    // updated_at se toca AQUÍ y solo aquí: es lo que el cliente ve como
    // "Actualizado el…", así que no puede moverse al revocar o reactivar.
    await actualizar(token, {
      pdf_path: rutaNueva,
      version: versionNueva,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    // Si el registro no se actualizó, el archivo nuevo sobra.
    await cliente.storage.from('itinerarios').remove([rutaNueva]);
    return avisar(art, `No se pudo guardar: ${e.message}`);
  }

  // El anterior ya no lo sirve nadie. Se borra al final, cuando el registro
  // nuevo está confirmado: si esto fallara, solo quedaría un archivo de más.
  if (rutaVieja && rutaVieja !== rutaNueva) {
    await cliente.storage.from('itinerarios').remove([rutaVieja]);
  }

  // El cliente ya se descargó la versión vieja y no se entera solo
  // (PLAN-DE-TRABAJO.md §2.5). Se le ofrece a Karla el aviso listo para pegar.
  const nuevoArt = lista.querySelector(`.itin[data-token="${CSS.escape(token)}"]`);
  if (nuevoArt) {
    const aviso = nuevoArt.querySelector('.itin__aviso');
    aviso.textContent = 'Listo, ya está la versión nueva. ';
    aviso.hidden = false;

    const copiarAviso = document.createElement('button');
    copiarAviso.type = 'button';
    copiarAviso.className = 'itin__accion itin__accion--destacada';
    copiarAviso.textContent = 'Copiar aviso para WhatsApp';
    copiarAviso.addEventListener('click', () => copiar(
      mensajeActualizacion(nombreParaSaludar(itinerario.cliente_nombre), urlDelItinerario(token)),
      copiarAviso,
      'Copiar aviso para WhatsApp',
    ));
    aviso.append(copiarAviso);
  }
});

recargarLista();
