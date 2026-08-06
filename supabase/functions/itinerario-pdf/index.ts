// Firma la URL del PDF de un itinerario.
//
// Existe porque el navegador del cliente NO puede firmarla por su cuenta:
// darle permiso de lectura sobre el bucket al rol anónimo le permitiría listarlo
// entero y bajarse los PDFs de todos los clientes (PLAN-DE-TRABAJO.md §2.7).
//
// Aquí sí se puede: esta función corre en el servidor con la clave de servicio
// —que Supabase inyecta sola como variable de entorno, nunca pasa por el repo ni
// por el navegador— y solo firma después de comprobar que el token existe, que el
// itinerario no está revocado y que no ha caducado.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  // Abierto a propósito: la credencial es el token, no el origen. Restringir por
  // dominio no añadiría seguridad y rompería las pruebas en local.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VALIDEZ_SEGUNDOS = 60 * 60; // una hora: de sobra para abrir o descargar

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// El archivo tiene que llegar al teléfono llamándose algo reconocible, no
// "AgOTa2GF-gYSbs7.pdf" (PLAN-DE-TRABAJO.md §2.4). Es literalmente el problema
// que vinimos a resolver: que no se pierda entre los archivos del celular.
function nombreDeDescarga(titulo: string) {
  const limpio = titulo
    .replace(/[\\/:*?"<>|]/g, '')  // caracteres que Windows y macOS no aceptan
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return `Itinerario - ${limpio || 'Tierra de Viajes'}.pdf`;
}

Deno.serve(async (peticion) => {
  if (peticion.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (peticion.method !== 'POST') {
    return responder({ error: 'metodo_no_permitido' }, 405);
  }

  let token: unknown;
  try {
    ({ token } = await peticion.json());
  } catch {
    return responder({ error: 'peticion_invalida' }, 400);
  }

  // Mismo corte que en la base: por debajo de 21 no puede ser un token real.
  if (typeof token !== 'string' || token.length < 21 || token.length > 64) {
    return responder({ error: 'no_encontrado' }, 404);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: itinerario, error } = await supabase
    .from('itinerarios')
    .select('titulo, pdf_path, revoked, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error)       return responder({ error: 'error_interno' }, 500);
  if (!itinerario) return responder({ error: 'no_encontrado' }, 404);

  // Un enlace muerto no entrega el PDF. La página ya sabe contarlo con cariño.
  if (itinerario.revoked)                                return responder({ error: 'revocado' }, 403);
  if (new Date(itinerario.expires_at) <= new Date())     return responder({ error: 'caducado' }, 403);
  if (!itinerario.pdf_path)                              return responder({ error: 'sin_pdf' }, 404);

  const { data: firmada, error: errorFirma } = await supabase.storage
    .from('itinerarios')
    .createSignedUrl(itinerario.pdf_path, VALIDEZ_SEGUNDOS);

  const { data: descarga } = await supabase.storage
    .from('itinerarios')
    .createSignedUrl(itinerario.pdf_path, VALIDEZ_SEGUNDOS, {
      download: nombreDeDescarga(itinerario.titulo),
    });

  if (errorFirma || !firmada) return responder({ error: 'error_al_firmar' }, 500);

  return responder({
    // Para abrir en el visor del navegador (o del teléfono).
    url_abrir: firmada.signedUrl,
    // Para el botón de descargar: fuerza el nombre de archivo reconocible.
    url_descargar: descarga?.signedUrl ?? firmada.signedUrl,
    valida_segundos: VALIDEZ_SEGUNDOS,
  });
});
