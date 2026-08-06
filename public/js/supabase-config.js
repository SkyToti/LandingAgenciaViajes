// Conexión a Supabase — Portal de itinerarios
//
// Estas dos credenciales son PÚBLICAS por diseño: viajan dentro del JavaScript
// que cualquiera puede leer. No son un descuido y no hay nada que esconder aquí.
// La seguridad del portal descansa en las políticas RLS de la base de datos:
//   · la tabla `itinerarios` no se puede listar sin sesión,
//   · el bucket es privado,
//   · el cliente solo lee a través de la función `itinerario_por_token`.
//
// Lo que NUNCA debe aparecer en este archivo ni en ningún otro del repositorio:
// la clave `service_role` (sb_secret_…), la contraseña de la base de datos y el
// personal access token de Supabase.

export const SUPABASE_URL = 'https://rnoauhspkuxkwxnidsab.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_uN7bZNDdj8j2vsHBkt4cBw_WQrc3TyN';

// La página del cliente (/viaje) no carga la librería de Supabase: le basta un
// fetch y así pesa menos, que es lo que importa cuando se abre desde el celular
// con mala señal. El panel (/admin) sí la usa, porque necesita sesión y subidas.
export async function llamarRpc(nombre, parametros) {
  const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parametros),
  });

  if (!respuesta.ok) {
    throw new Error(`Supabase respondió ${respuesta.status} al llamar a ${nombre}`);
  }

  return respuesta.json();
}
