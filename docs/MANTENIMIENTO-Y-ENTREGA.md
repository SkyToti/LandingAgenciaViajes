# Manual de mantenimiento y entrega técnica

**Tierra de Viajes by Fraveo** — sitio web y portal de itinerarios

*Última revisión: 16 de agosto de 2026*

---

## 0. Para quién es este documento

Son dos lectores distintos y conviene decirlo de entrada:

- **Karla (la agencia).** Le interesan las secciones 1, 2, 3 y 8. Ahí está qué se entregó,
  de qué cuentas es dueña, qué se paga y qué hay que revisar cada cierto tiempo.
  No necesita entender el resto.
- **Quien haga cambios en el futuro** (una persona que programa). Le interesa todo.
  Este documento asume que sabe HTML, CSS, JavaScript y Git, pero **no** asume que
  conoce el proyecto.

El proyecto lo desarrolló Janette Alicia Tapia Ramírez durante sus estadías profesionales.
Esa etapa terminó. **No hay nadie asignado al mantenimiento**, y por eso existe este
documento: para que cualquier desarrollador pueda retomarlo sin depender de quien lo hizo.

---

## 1. Qué se entregó

Tres piezas que comparten un mismo diseño y una misma infraestructura.

| Pieza | Dirección | Quién la usa |
|---|---|---|
| **Página de aterrizaje** | `https://viajaconkarla.com.mx` | Público. Es el destino de los anuncios de Facebook e Instagram |
| **Panel administrativo** | `https://viajaconkarla.com.mx/admin/` | Solo Karla, con enlace por correo |
| **Página del itinerario** | `https://viajaconkarla.com.mx/viaje/{token}` | El cliente al que Karla le mandó el enlace |

**No hay servidor propio.** El navegador habla directamente con Supabase. El sitio son
archivos estáticos que se sirven desde GitHub Pages. Esto importa mucho para entender
qué se puede y qué no se puede hacer más adelante (sección 9).

El sistema está **en operación**. La cuenta de Karla ya está dada de alta y entra al panel
con el mismo nivel de acceso que el desarrollador. Quedan dos tareas menores de limpieza,
listadas en la sección 11, que la propia agencia puede resolver desde Supabase.

---

## 2. Cuentas, accesos y titularidad

Esta es la sección que decide si el sistema sobrevive a un cambio de desarrollador.

| Servicio | Para qué | Titular / acceso |
|---|---|---|
| **Dominio** `viajaconkarla.com.mx` | La dirección del sitio | **Cuenta de Hostinger de la propia agencia.** Karla tiene el control total: es su cuenta, no la del desarrollador. Registrado hasta 2029, con renovación automática |
| **Supabase** | Base de datos, archivos, acceso al panel y correos | El proyecto vive en la **organización personal del desarrollador**. Karla está invitada como *Owner* de esa organización, lo que le da control operativo, pero **la agencia no es titular de la cuenta** |
| **GitHub** | El código y la publicación automática | Repositorio `SkyToti/LandingAgenciaViajes`, en cuenta personal. Karla ya es colaboradora con permiso de escritura |
| **images.unsplash.com** | Cuatro fotografías de la página, cargadas en caliente | Servicio público, sin cuenta. Si deja de responder, esas imágenes desaparecen (ver §11.5) |
| **Google Fonts y CDN** | Tipografías y librerías de animación de la página | Servicios públicos, sin cuenta |

### Lo que está a salvo

**El dominio es de la agencia.** `viajaconkarla.com.mx` está registrado en la cuenta de
Hostinger de la propia Karla, no en una del desarrollador. Es la pieza más importante del
sistema —de ella cuelgan todos los enlaces de itinerarios entregados— y no depende de nadie
externo. Lo único que hay que cuidar es que **la tarjeta de la renovación automática siga
vigente**: si el dominio caduca, los enlaces que los clientes ya tienen dejan de funcionar.

### El punto de fallo que sigue abierto

**La titularidad de Supabase y GitHub — riesgo asumido y documentado.**

El proyecto de Supabase y el repositorio de GitHub viven en cuentas personales del
desarrollador. **Se decidió no transferirlos**, y la agencia lo sabe. Queda aquí por escrito
lo que eso implica, para que nadie lo descubra tarde:

- Karla está invitada como *Owner* de la organización de Supabase y como colaboradora del
  repositorio. En el día a día puede hacer todo: entrar al panel, consultar la base, subir y
  borrar datos, y publicar cambios en el sitio.
- Pero **ser *Owner* de la organización no es ser titular de la cuenta que la contiene.**
  Si la cuenta personal del desarrollador se cerrara, o si esa persona dejara de estar
  localizable, la agencia perdería el acceso a la base de datos y a los PDF de sus clientes.
- **Cómo revertirlo el día que se quiera:** Supabase permite mover un proyecto entre
  organizaciones sin migrar datos y sin cambiar la dirección ni las claves, así que el sitio
  no se entera. GitHub permite transferir el repositorio, pero eso **sí** implica corte de
  servicio: el dominio personalizado no vive en el repositorio (no hay archivo `CNAME`; está
  en *Settings → Pages*), así que después hay que volver a activar GitHub Pages con origen
  *GitHub Actions*, volver a escribir `viajaconkarla.com.mx` y esperar a que se reemita el
  certificado. En DNS solo cambiaría el CNAME de `www`, que hoy apunta a `SkyToti.github.io`;
  los cuatro registros A siguen igual.

> **Si algún día se transfiere:** hacerlo en un rato tranquilo, nunca con una campaña de
> anuncios corriendo. El sitio queda caído mientras se reemite el certificado.

### Estado de los accesos

| Acceso | Estado |
|---|---|
| Dominio en la cuenta de Hostinger de la agencia | ✅ Es de Karla, control total |
| Cuenta de Karla en el panel de itinerarios | ✅ Creada y en uso |
| Karla como *Owner* de la organización de Supabase | ✅ Hecho |
| Karla como colaboradora del repositorio de GitHub | ✅ Hecha, con permiso de escritura |
| Titularidad de las cuentas de Supabase y GitHub | ⚠️ En cuentas personales del desarrollador, por decisión |

### Lo que nunca debe salir del entorno seguro

La clave `service_role` de Supabase (empieza con `sb_secret_…`), la contraseña de la base
de datos y el token personal de acceso. **No están en el repositorio y no deben acabar ahí.**
La función de servidor recibe la clave de servicio como variable de entorno que Supabase
inyecta sola.

En cambio, `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`, que sí están en
`public/js/supabase-config.js`, **son públicas por diseño**. Viajan dentro del JavaScript
que cualquiera puede leer. No son un descuido: la seguridad no vive en ocultarlas, sino en
las políticas de la base de datos.

---

## 3. Lo que se paga

| Concepto | Costo | Si se deja de pagar |
|---|---|---|
| **Dominio** `viajaconkarla.com.mx` | Renovación anual en la cuenta de Hostinger de la agencia, hasta 2029 | **Todos los enlaces ya entregados dejan de funcionar.** Es el único gasto que no se puede saltar |
| Supabase | Plan gratuito | No se paga, pero impone los límites de la sección 9 |
| GitHub Pages | Gratuito | — |

---

## 4. Cómo está construido, y por qué

- **Sin marcos de trabajo.** HTML, CSS y JavaScript estándar. Sin React, sin Vue, sin
  gestor de dependencias, sin proceso de compilación. Los archivos se publican tal cual.
- **Animación de la página de aterrizaje:** GSAP con ScrollTrigger y Lenis, cargados desde
  CDN. El avión tridimensional del cierre usa Three.js con carga diferida (solo se descarga
  si el visitante llega a esa sección).
- **Librerías del portal, copiadas a mano.** El panel y la página del cliente **no** usan
  CDN: `supabase-js` y el generador de códigos QR están copiados dentro del repositorio
  (`public/admin/js/vendor/supabase.js`, 206 KB; `public/viaje/js/vendor/qrcode.js`, 58 KB),
  para que el portal no dependa de un servicio ajeno que pueda cambiar el código de un día
  para otro. **La contrapartida:** no hay gestor de dependencias que avise de
  actualizaciones. La versión de `supabase-js` en uso es la **2.112.1**. Para actualizarla
  hay que descargar el paquete UMD nuevo, sustituir el archivo y probar el panel entero a
  mano (acceso, alta, subida, reemplazo). *Anotar aquí la versión cada vez que se cambie.*
- **Tipografías:** Fraunces (titulares) y Plus Jakarta Sans (texto), desde Google Fonts.
- **Backend:** Supabase — PostgreSQL, autenticación, almacenamiento de archivos y una
  función de servidor.
- **Publicación:** GitHub Pages, automática en cada `push` a `main`.

**Por qué sin marcos de trabajo:** el sitio es de contenido, no administra estado complejo,
y el público llega desde anuncios en teléfonos de gama media donde cada kilobyte cuenta.

**Consecuencia para quien venga después:** no hay `npm install`. Se clona el repositorio,
se levanta un servidor estático y ya se está trabajando. Tampoco hay forma de "romper el
build", porque no hay build.

---

## 5. El repositorio

```
public/                       ← LO ÚNICO QUE SE PUBLICA
  index.html                  Página de aterrizaje
  css/styles.css              Sistema de diseño, maquetación y animaciones
  js/main.js                  Scroll suave (Lenis) y animaciones (GSAP)
  js/plane3d.js               Avión 3D (Three.js), carga diferida
  js/supabase-config.js       Dirección del proyecto, clave publicable y función llamarRpc
  js/comun.js
  img/                        Solo 3 archivos: karla.webp, roma-coliseo.webp, logo-emblema.png
  404.html                    Recupera las URL limpias en GitHub Pages — EL QUE ESTÁ EN USO
  .htaccess                   Cabeceras de seguridad, HTTPS y caché (solo Apache, hoy sin uso)
  _redirects                  Reescritura de /viaje/{token} en Netlify y Cloudflare (sin uso)

  admin/                      Panel de Karla
    index.html · css/admin.css
    js/sesion.js              Acceso por enlace de un solo uso
    js/panel.js               Alta de itinerario
    js/lista.js               Listado, estados y acciones
    js/itinerarios.js         Reglas de negocio: token, caducidad, topes de peso
    js/navegacion.js
    js/vendor/supabase.js     Copia local de supabase-js 2.112.1

  viaje/                      Página del cliente
    index.html · css/viaje.css
    js/viaje.js               Consulta, estados y botones
    js/calendario.js          Generación del evento .ics (iCalendar)
    js/vendor/qrcode.js       Copia local del generador de códigos QR
    .htaccess                 Reescritura de /viaje/{token} en Apache (hoy sin uso)

supabase/                     ← NO se publica
  migrations/                 4 archivos SQL, en este orden:
                                1. tabla itinerarios + políticas RLS
                                2. función itinerario_por_token
                                3. bucket privado + políticas de Storage
                                4. función registrar_apertura
  functions/itinerario-pdf/   Función de servidor que firma la descarga
  plantillas-correo/          Plantilla del correo de acceso

.github/workflows/
  pages.yml                         Publica public/ en cada push a main
  mantener-supabase-despierto.yml   Consulta diaria para que el proyecto no se pause

docs/                         ← documentación, NO se publica
prototipo/                    ← archivo histórico, NO se publica
```

**Regla importante:** solo `public/` llega al sitio. Si se añade algo que deba publicarse,
tiene que ir dentro de `public/`.

**El dominio personalizado no está en el repositorio**: se configura en *Settings → Pages*.
Si algún día se quiere fijar en código, basta con crear `public/CNAME` con una sola línea:
`viajaconkarla.com.mx`.

---

## 6. Cómo trabajar en el proyecto

### Levantarlo en local

```bash
npx serve -l 4174 public
```

Y abrir `http://localhost:4174`.

**Usa el puerto 4174, no otro.** Esa dirección está dada de alta en Supabase como URL de
redirección permitida; con otro puerto, el acceso al panel por correo no regresa a la
aplicación. *(El `README.md` dice 4173: está desactualizado, el bueno es el 4174.)*

### Publicar un cambio del sitio

```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

El flujo `pages.yml` publica `public/` automáticamente. El sitio se actualiza en un par de
minutos y se puede seguir en la pestaña *Actions*.

### ⚠️ Lo que `git push` NO despliega

Esto es lo primero que sorprende a quien llega:

> **`git push` publica únicamente `public/`.** Las migraciones de la base de datos y la
> función de servidor **no se despliegan solas**. El repositorio no tiene la CLI de Supabase
> configurada (no hay `supabase/config.toml`): las migraciones y la función se aplicaron a
> mano desde el panel web de Supabase.

**Para cambiar la base de datos:**
1. Escribir un archivo nuevo en `supabase/migrations/`, con la fecha por delante del nombre.
2. Ejecutar ese SQL en Supabase → *SQL Editor*.
3. Confirmar el archivo en el repositorio.

Si se cambia algo desde el panel de Supabase **sin escribir la migración**, el repositorio
deja de describir la realidad y quien venga después trabajará con información falsa.

**Para cambiar la función de servidor** (`supabase/functions/itinerario-pdf/index.ts`):
desplegarla desde Supabase → *Edge Functions*, o enlazando la CLI (`supabase link` y
`supabase functions deploy itinerario-pdf`). **Si se edita el archivo y solo se hace push,
el cambio no llega a producción.** Y si se despliega mal, ningún cliente puede descargar
su PDF.

---

## 7. Cómo funciona el portal por dentro

### La base de datos

Una sola tabla, `public.itinerarios`. No hay tablas de clientes, reservaciones ni
actividades: el contenido del itinerario es el PDF que Karla ya elabora, y el sistema no lo
interpreta.

Columnas: `token`, `cliente_nombre`, `titulo`, `tipo`, `fecha_inicio`, `fecha_fin`,
`pdf_path`, `expires_at`, `revoked`, `version`, `updated_at`, `last_opened_at`, `created_at`.

Las columnas `dias` y `pin` existen pero **no se usan**: quedaron de decisiones que se
descartaron. No hay que darles significado.

### La seguridad, en tres capas

1. **Seguridad a nivel de fila (RLS).** La tabla solo se lee y escribe con sesión iniciada.
   Una consulta sin sesión devuelve un conjunto vacío; una inserción, un rechazo.

2. **El cliente entra por dos funciones, y solo por esas dos.**
   - `itinerario_por_token` recibe el token exacto y devuelve solo los campos que la
     pantalla necesita. **No permite enumerar:** sin el token completo no devuelve nada.
     Si el enlace está revocado o caducado, omite la ruta del PDF.
   - `registrar_apertura` marca `last_opened_at`, para que Karla vea si el cliente ya
     abrió el enlace. **Es la única escritura sin sesión de todo el sistema**: no devuelve
     nada, ignora los enlaces revocados o caducados y solo puede tocar esa columna. Va
     aparte a propósito, para que un fallo en la estadística no impida ver el itinerario.

   Las dos son `security definer` —saltan el RLS deliberadamente— y están concedidas al rol
   anónimo. Si se tocan, hay que **conservar el corte de longitud mínima de 21 caracteres**,
   que es lo que impide sondear la tabla.

3. **El contenedor de archivos es privado**, con tope de 25 MB y solo PDF. Cuando el cliente
   pulsa un botón, la función `itinerario-pdf` comprueba que el token existe, que no está
   revocado y que no ha caducado, y solo entonces firma una dirección válida **una hora**.

**El token es la credencial.** 24 caracteres generados con la interfaz criptográfica del
navegador sobre un alfabeto de 64 símbolos: 144 bits de aleatoriedad. Quien tiene el enlace,
entra. Es el mismo modelo de los documentos compartidos de las suites ofimáticas en la nube.

### El acceso de Karla

Enlace de un solo uso por correo, **sin contraseña**: una contraseña se olvida y genera
solicitudes de recuperación que la agencia no puede atender.

El **registro público está desactivado**, y el panel pide el enlace con
`shouldCreateUser: false`. Consecuencia práctica: **un correo que no esté dado de alta como
usuario nunca recibe enlace.** Las cuentas se crean a mano en Supabase.

### Reglas de negocio (están en `public/admin/js/itinerarios.js`)

- **Caducidad:** fin del viaje **+ 3 meses**. Sin fechas, 6 meses desde el registro.
- **Reactivar:** 3 meses **desde hoy**, no desde la caducidad anterior.
- **Aviso de peso a 8 MB. Tope duro a 25 MB**, aplicado en el navegador y en el contenedor.
- **`updated_at` solo se toca al reemplazar el PDF**, nunca al revocar o reactivar. Al
  cliente se le muestra como "Actualizado el…", y moverlo por otras operaciones le
  comunicaría un cambio que no existe.

---

## 8. Mantenimiento: qué revisar y cada cuánto

### Automático, sin intervención

| Qué | Cuándo |
|---|---|
| Publicación del sitio | En cada `push` a `main` |
| Consulta para que Supabase no se pause | Todos los días a las 06:00 (centro de México) |
| Renovación del certificado HTTPS | Automática |

### Cada mes (10 minutos)

- [ ] Abrir `https://viajaconkarla.com.mx` y comprobar que carga con el candado bien.
- [ ] Entrar a `/admin/` y verificar que llega el correo de acceso.
- [ ] Abrir un itinerario real desde un teléfono y descargar el PDF.
- [ ] En GitHub → *Actions*, comprobar que **Mantener Supabase despierto** corrió en verde
      los últimos días.

### Cada dos meses — la revisión crítica

- [ ] **Comprobar que la tarea programada sigue activa.**

  GitHub **desactiva las tareas programadas cuando un repositorio pasa 60 días sin
  actividad**. Si eso pasa, a la semana siguiente Supabase pausa el proyecto y **todos los
  enlaces dejan de abrir**. El cliente que consulta su itinerario en pleno viaje se
  encuentra una página muerta.

  Basta con hacer cualquier cambio en el repositorio, o lanzarla a mano desde
  *Actions → Mantener Supabase despierto → Run workflow*.

  **Solución permanente** (recomendada si nadie va a estar pendiente): duplicar esa llamada
  en un cron externo gratuito como cron-job.org, que no depende del repositorio. O pasar
  Supabase a plan de pago, donde el pausado no existe.

### Cada seis meses

- [ ] Revisar el consumo en Supabase: almacenamiento y tamaño de la base.
- [ ] Borrar itinerarios muy antiguos y sus PDF, si la agencia lo autoriza. **No existe
      borrado definitivo desde el panel**: hay que hacerlo desde Supabase (§11).
- [ ] Comprobar con la agencia que fotografías y precios siguen vigentes. Los precios viven
      **solo** en `public/index.html`, bloque *Inversión*. **No cotejar contra
      `docs/contexto.md`**, que se quedó con los de 2025.

### Cada año

- [ ] **Revisar la tarjeta de la renovación automática del dominio.** Lo hace la propia
      agencia desde su cuenta de Hostinger. Es la revisión anual más importante del sistema.
- [ ] Comprobar que las librerías del CDN y las fotos de Unsplash siguen respondiendo.

---

## 9. Limitaciones técnicas

No son defectos: son consecuencias de decisiones tomadas para que el proyecto funcionara
sin costo. Quien venga después tiene que conocerlas antes de prometer nada.

### 9.1 Supabase, plan gratuito

| Límite | Consecuencia |
|---|---|
| **El proyecto se pausa tras ~1 semana sin actividad** | Todos los enlaces dejan de abrir. Mitigado con la tarea diaria, que a su vez depende de la actividad del repositorio (§8) |
| **2 correos de acceso por hora, para todo el proyecto** | Si Karla se equivoca al teclear su correo y reintenta, gasta los dos y se queda fuera **una hora** |
| Almacenamiento y tamaño de base limitados | Suficiente para el volumen actual, pero hay que vigilarlo |

**Sobre el límite de correos: la agencia lo conoce y lo aceptó.** No se configuró un
servidor de correo propio porque, con el uso real —Karla entra al panel de vez en cuando y
la sesión se mantiene entre visitas—, dos enlaces por hora bastan. Karla sabe que si teclea
mal su correo y reintenta, se queda fuera una hora.

**Si algún día molesta**, se resuelve en una tarde: cuenta gratuita en Resend o Brevo, dada
de alta en Supabase → *Authentication → Emails → SMTP Settings*. Al hacerlo se desbloquea el
campo *Rate Limits* y el límite se puede subir.

### 9.2 GitHub Pages

- **No ejecuta código en el servidor.** Toda la lógica dinámica ocurre en el navegador o en
  Supabase. No se puede añadir un formulario que mande correos por su cuenta, ni procesar
  pagos, ni nada que necesite un servidor.
- **No tiene reescritura de direcciones.** Las URL limpias `/viaje/{token}` funcionan gracias
  a `public/404.html`, que recupera el token y reenvía. **Si se toca ese archivo sin
  entenderlo, todos los enlaces entregados dejan de funcionar.**

### 9.3 Sitio estático

- **No hay panel de administración de contenidos.** Cambiar un texto, un precio o una
  fotografía de la página significa **editar el código y publicar**. Karla no puede hacerlo
  sola, y no se le debe pedir que aprenda.
- Si la agencia quiere autonomía para editar textos, es un proyecto aparte: implica meter un
  gestor de contenidos, con su costo y su mantenimiento.

### 9.4 Lo que el sistema deliberadamente no hace

- Pagos en línea y contratos firmados electrónicamente.
- Aplicación móvil nativa. El acceso es desde el navegador, sin instalar nada.
- Módulo de reservación en línea. La venta se cierra por mensajería instantánea.
- **Capturar el contenido del itinerario en un formulario.** Es la decisión más importante
  del proyecto: el itinerario es artesanal y en lenguaje natural. El sistema estandariza la
  **entrega**, nunca el **contenido**. Un formulario rígido de "actividad / hora / lugar" no
  se usaría, y con razón.

---

## 10. Qué se puede cambiar, y con cuánto cuidado

### Fácil y de bajo riesgo

| Cambio | Dónde |
|---|---|
| Textos, precios, testimonios | `public/index.html` |
| Colores, tipografías, tamaños | Variables del selector `:root` en `public/css/styles.css`. **Un cambio ahí se propaga a las tres piezas** |
| Fotografías propias | `public/img/`, conservando el nombre del archivo |
| **Las otras cuatro fotografías** | **No están en el repositorio.** Se cargan desde Unsplash: héroe y corte central en `public/css/styles.css` (líneas 90 y 243), Venecia y Toscana en `public/index.html` (líneas 98 y 100) |
| Número de WhatsApp o mensajes precargados | **Dos sitios, y hay que tocar los dos:** las direcciones `wa.me` de `public/index.html` (6 apariciones) y la constante `WHATSAPP_KARLA` de `public/viaje/js/viaje.js` (línea 12), que es a donde escriben los clientes desde su itinerario |
| Textos del panel o de la página del cliente | Los HTML de `public/admin/` y `public/viaje/` |

### Requiere entender el proyecto

| Cambio | Por qué |
|---|---|
| Caducidad, topes de peso, reactivación | En `public/admin/js/itinerarios.js`; tienen que seguir cuadrando con lo que ve el cliente |
| Estructura de la base o políticas de seguridad | Hay que escribir una migración **y ejecutarla a mano** (§6) |
| La función de servidor `itinerario-pdf` | Es la única pieza fuera del navegador, y **no se despliega con `git push`** (§6) |
| Las librerías copiadas en `vendor/` | Sin gestor de dependencias: se sustituyen a mano y se prueba el panel entero |
| Las animaciones de la página | GSAP y Lenis están afinados; hay degradación segura si las librerías no cargan |

### No tocar sin saber exactamente qué se hace

- **`public/404.html`** — sostiene las URL limpias de todos los itinerarios entregados.
- **La generación del token** — es la credencial. Debe seguir usando la interfaz
  criptográfica del navegador, nunca el generador aleatorio convencional.
- **Las políticas de seguridad a nivel de fila** — quitarlas expondría los datos de todos
  los clientes.
- **El corte de 21 caracteres** de las dos funciones públicas — es lo que impide sondear la
  tabla.
- **El contenedor de archivos** — si se vuelve público, el token deja de servir de nada y
  cualquiera puede listar y descargar los PDF de todos los clientes.

---

## 11. Deudas técnicas conocidas

1. **No hay pruebas automatizadas.** Cualquier cambio se verifica a mano.
2. **Las políticas de acceso son por usuario autenticado, no por rol.** Hoy solo existe la
   cuenta de Karla, así que funciona. **Antes de dar de alta a una segunda persona hay que
   rehacer las políticas por rol**, o esa persona vería todos los itinerarios.
3. **No existe borrado definitivo** desde el panel; solo revocación. Para borrar de verdad
   hay que entrar a Supabase, eliminar la fila y después el PDF del contenedor, por separado.
4. **Sin servidor de correo propio.** Decisión tomada, no descuido: la agencia aceptó el
   límite de 2 correos de acceso por hora (§9.1).
5. **Cuatro fotografías cargadas desde Unsplash.** El héroe, el corte central, Venecia y
   Toscana **no viven en el repositorio**: se cargan en caliente desde `images.unsplash.com`,
   declaradas en cuatro puntos de dos archivos (§10). Al sustituirlas por las de la agencia
   conviene bajarlas a `public/img/` en WebP y dejar de depender de un servicio externo para
   las imágenes principales.
6. **Reseñas de Google sin conectar.** Los testimonios están escritos en el HTML; son reales,
   pero no se actualizan solos.
7. **Librerías copiadas sin registro de versión** más allá de lo anotado en §4.

### Pendientes de limpieza

Ninguno bloquea el uso del sistema. **Karla puede hacer los dos desde Supabase**, con el
acceso que ya tiene.

- [ ] **Borrar los itinerarios de prueba** que quedan en la base. En Supabase →
      *SQL Editor*, pegar y ejecutar:
  ```sql
  delete from public.itinerarios where token like 'PRUEBA%';
  delete from public.itinerarios where token = 'AgOTa2GF-gYSbs7Tly4rfcWJ';
  ```
  Y después borrar sus PDF en *Storage → itinerarios*, incluido
  `AgOTa2GF-gYSbs7Tly4rfcWJ/v2.pdf`. **Borrar la fila no borra el archivo: son dos
  operaciones distintas.**

- [ ] **Poner el correo de acceso en español.** Hoy Karla recibe la plantilla que trae
      Supabase por defecto, que está en inglés. Funciona, pero se ve genérico. Para
      cambiarlo: copiar el contenido de `supabase/plantillas-correo/enlace-de-acceso.html`
      y pegarlo en Supabase → *Authentication → Emails → Magic Link*, con el asunto
      `Tu acceso al panel · Tierra de Viajes`. Es puramente cosmético.

### Ya resuelto

- ✅ Cuenta de Karla creada en *Authentication → Users*, sin contraseña.
- ✅ Contraseña quitada de la cuenta de administración: el acceso es solo por enlace.
- ✅ Registro público desactivado y comprobado desde fuera.

---

## 12. Diagnóstico rápido

| Síntoma | Causa más probable | Qué hacer |
|---|---|---|
| **Ningún enlace de itinerario abre** | El proyecto de Supabase se pausó | Entrar a Supabase y reanudarlo. Después revisar por qué se detuvo la tarea diaria (§8) |
| **Todo el sitio está caído** | El dominio caducó, o falló la publicación | Revisar Hostinger y la pestaña *Actions* |
| **Sale «Ese correo no tiene acceso al panel»** | El correo no corresponde a ningún usuario de Supabase Auth | Comprobar la dirección. Si es correcta, darla de alta en *Authentication → Users*: el registro público está cerrado y el panel no crea cuentas solo |
| **Sale «Se enviaron varios enlaces en poco tiempo»** | Se agotaron los 2 correos por hora | Esperar una hora. Solución definitiva: SMTP propio (§9.1) |
| **Un enlace concreto no abre** | Caducado o revocado | Según la insignia de la tarjeta: **Caducado** o **Por caducar** → *Reactivar 3 meses*. **Revocado** → *Volver a abrir* (el botón de reactivar no aparece en ese estado). Si estaba revocado **y** caducado: primero *Volver a abrir*, después *Reactivar 3 meses* |
| **El cliente ve el itinerario pero no baja el PDF** | Falla la función de servidor | Revisar los registros de *Edge Functions* en Supabase |
| **Un cambio no aparece en el sitio** | Falló la publicación, o es la caché | Revisar *Actions*; recargar con `Ctrl+Shift+R` |
| **Se cambió la función de servidor y no pasa nada** | No se desplegó | `git push` no la despliega (§6) |
| **Las animaciones no corren** | El CDN no respondió | El contenido se muestra completo igual; la degradación segura está prevista |

---

## 13. Si algún día hay que mudarse de proveedor

- **El sitio** son archivos estáticos, se sube a cualquier hospedaje. El repositorio ya trae
  los tres archivos de reescritura (`public/viaje/.htaccess` para Apache, `public/_redirects`
  para Netlify y Cloudflare, `public/404.html` para GitHub Pages). Cada proveedor lee el suyo.
- **La base de datos** se reconstruye ejecutando las cuatro migraciones **en orden** en el
  SQL Editor del proyecto nuevo, y desplegando después la función de servidor (§6).
- **Lo que no se puede mudar sin romper nada es el dominio.** Los enlaces que Karla ya
  entregó apuntan a `viajaconkarla.com.mx`. Mientras se conserve, se puede cambiar de
  hospedaje sin que ningún cliente se entere.

**Intentos previos, para no repetirlos:** Hostinger requería pasar a plan de pago para subir
archivos propios. Netlify funcionó pero suspendió la cuenta el mismo día de configurar el
dominio, probablemente por un filtro automático. Vercel quedó descartado desde el inicio
porque su plan gratuito prohíbe el uso comercial.

---

## 14. Documentación complementaria

| Archivo | Contenido |
|---|---|
| `docs/sistema-itinerarios/PLAN-DE-TRABAJO.md` | Decisiones de construcción numeradas. **Es el documento al que apuntan los comentarios del código** («PLAN-DE-TRABAJO.md §2.5» y similares): tenerlo abierto al leer `viaje.js`, `lista.js` o la función de servidor. Registra también la decisión sobre la titularidad de Supabase |
| `docs/sistema-itinerarios/COMO-FUNCIONA.md` | El portal por dentro, con diagrama de flujo. Dos detalles desfasados: habla de 3 migraciones (hay 4) y da el SMTP propio como bloqueante para producción (ya no lo es) |
| `docs/sistema-itinerarios/CONTEXTO.md` | Qué se construyó y por qué se decidió así |
| `docs/sistema-itinerarios/PUESTA-EN-PRODUCCION.md` | Cómo quedó el despliegue y la configuración del dominio |
| `docs/sistema-itinerarios/GUIA-PARA-KARLA.md` | Guía de uso del panel, en lenguaje no técnico |
| `docs/contexto.md` | Marca, paleta, tono y reglas de negocio. **Su tabla de precios está desactualizada** (lleva los de 2025): la fuente de verdad es `public/index.html` |
| `README.md` | Presentación del proyecto. **Desactualizado:** manda usar el puerto 4173 (el bueno es el 4174), describe el despliegue abandonado en Hostinger y da el portal como pendiente de construir |

**Para arrancar de cero:** leer este documento, después `COMO-FUNCIONA.md` y
`PLAN-DE-TRABAJO.md`, y levantar el proyecto en local. Con eso basta para hacer el primer
cambio con seguridad.

> Si se corrige algo de este manual, corregir también el `README.md`: hoy es la primera
> fuente de confusión para quien llega.
