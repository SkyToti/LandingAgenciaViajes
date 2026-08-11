// Acceso al panel — enlace mágico por correo, sin contraseña.
//
// Karla no es técnica: la única acción posible aquí es escribir su correo.
// No hay registro, ni recuperación de contraseña, ni nada que se pueda olvidar.

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../../js/supabase-config.js';

const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Al volver del correo, la sesión llega en el hash de la URL.
    detectSessionInUrl: true,
  },
});

// ---------------------------------------------------------------- pantallas
const pantallas = document.querySelectorAll('.pantalla');

function mostrar(nombre) {
  pantallas.forEach((p) => {
    p.hidden = p.dataset.pantalla !== nombre;
  });
}

// ---------------------------------------------------------------- elementos
const form         = document.getElementById('form-acceso');
const campoCorreo  = document.getElementById('correo');
const botonEnviar  = document.getElementById('boton-enviar');
const cajaError    = document.getElementById('error-acceso');
const correoEnviado = document.getElementById('correo-enviado');
const botonVolver  = document.getElementById('boton-volver');
const correoSesion = document.getElementById('correo-sesion');
const botonSalir   = document.getElementById('boton-salir');

function mostrarError(texto) {
  cajaError.textContent = texto;
  cajaError.hidden = false;
}

function limpiarError() {
  cajaError.hidden = true;
  cajaError.textContent = '';
}

// Supabase responde en inglés y con jerga. Karla merece algo que se entienda.
function explicar(error) {
  const codigo  = error?.code ?? '';
  const mensaje = (error?.message ?? '').toLowerCase();

  if (codigo === 'otp_disabled' || codigo === 'signup_disabled' || mensaje.includes('signups not allowed')) {
    return 'Ese correo no tiene acceso al panel. Revisa que esté bien escrito.';
  }
  if (codigo === 'over_email_send_rate_limit' || mensaje.includes('rate limit')) {
    return 'Acabas de pedir un enlace. Espera un minuto antes de pedir otro.';
  }
  if (mensaje.includes('invalid') && mensaje.includes('email')) {
    return 'Ese correo no parece estar completo. Revísalo y vuelve a intentar.';
  }
  if (mensaje.includes('failed to fetch') || mensaje.includes('networkerror')) {
    return 'No hay conexión. Revisa tu internet y vuelve a intentar.';
  }
  return 'Algo falló al enviar el enlace. Vuelve a intentar en un momento.';
}

// ---------------------------------------------------------------- acceso
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarError();

  const correo = campoCorreo.value.trim();
  if (!correo || !correo.includes('@')) {
    mostrarError('Escribe tu correo para poder mandarte el enlace.');
    campoCorreo.focus();
    return;
  }

  botonEnviar.disabled = true;
  botonEnviar.textContent = 'Enviando…';

  const { error } = await cliente.auth.signInWithOtp({
    email: correo,
    options: {
      // El enlace del correo devuelve aquí mismo. Funciona igual en local
      // (localhost:4174) que en el dominio real, sin tocar el código.
      emailRedirectTo: `${location.origin}/admin/`,
      // Nadie se da de alta desde aquí: la cuenta de Karla se crea a mano.
      // El registro público ya está cerrado en el servidor; esto es el segundo cerrojo.
      shouldCreateUser: false,
    },
  });

  botonEnviar.disabled = false;
  botonEnviar.textContent = 'Enviarme el enlace';

  if (error) {
    mostrarError(explicar(error));
    return;
  }

  correoEnviado.textContent = correo;
  mostrar('enviado');
});

botonVolver.addEventListener('click', () => {
  limpiarError();
  mostrar('acceso');
  campoCorreo.focus();
});

botonSalir.addEventListener('click', async () => {
  await cliente.auth.signOut();
  mostrar('acceso');
});

// ---------------------------------------------------------------- arranque
function pintarSesion(sesion) {
  if (sesion) {
    correoSesion.textContent = sesion.user.email ?? '';
    mostrar('panel');
  } else {
    mostrar('acceso');
  }
}

mostrar('cargando');

// getSession espera a que se procese el hash del correo antes de responder.
const { data, error } = await cliente.auth.getSession();

if (error) {
  mostrar('acceso');
  mostrarError('No se pudo comprobar la sesión. Vuelve a pedir un enlace.');
} else {
  pintarSesion(data.session);
}

// El token de acceso no tiene por qué quedarse a la vista en la barra del navegador.
if (location.hash.includes('access_token')) {
  history.replaceState(null, '', location.pathname + location.search);
}

// Mantiene la pantalla en su sitio si la sesión caduca o se cierra en otra pestaña.
cliente.auth.onAuthStateChange((_evento, sesion) => pintarSesion(sesion));

export { cliente };
