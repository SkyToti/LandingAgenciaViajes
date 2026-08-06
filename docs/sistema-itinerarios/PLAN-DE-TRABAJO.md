# Plan de trabajo — Portal de Itinerarios

> **Léeme junto con `CONTEXTO.md`** (el qué y el porqué). Este archivo es el **cómo**:
> orden de construcción, criterios de aceptación y las trampas técnicas ya identificadas.
> Escrito para que una sesión nueva de Claude Code arranque sin re-decidir nada.

> 📍 **Los cuatro documentos del proyecto:**
> · `CONTEXTO.md` — qué construir y por qué
> · `PLAN-DE-TRABAJO.md` (este) — cómo construirlo, en qué orden, y las trampas
> · `COMO-FUNCIONA.md` — cómo funciona lo que ya está construido
> · `PUESTA-EN-PRODUCCION.md` — qué cambia el día que se publica

---

## 0. Estado

**Al 2026-08-05: hechos los pasos 1, 2, 3 y 5. Faltan el 4, el 6 y el 7.**
Karla ya puede entrar al panel, crear un itinerario y mandar el enlace; el cliente ya
puede abrirlo, descargarlo e imprimirlo. Todo probado en local contra Supabase.
El detalle de lo construido está en `COMO-FUNCIONA.md`.

### Estado original al escribir este documento

- **Nada construido todavía.** Solo diseño y decisiones.
- La **landing ya está terminada y desplegada** en la carpeta padre. De ahí se hereda
  el sistema de diseño completo (`../css/styles.css`): paleta, escala tipográfica con
  `clamp()`, tipografías Fraunces + Plus Jakarta, componente de botón. **Reutilizarlo,
  no reinventarlo** — así el portal se siente parte del mismo producto.
- Supabase: **sin crear**. Dominio real: **sin contratar** (la landing vive hoy en
  GitHub Pages).

---

## 1. Decisiones técnicas ya cerradas (no re-litigar)

| Tema | Decisión | Por qué |
|---|---|---|
| Modelo de acceso | Capability URL (token largo en la URL), sin cuenta para el cliente | El público es 35-45+; una contraseña más es una barrera y una llamada de soporte |
| Contenido | El PDF de Karla es la fuente de verdad, caja cerrada | Cada itinerario es artesanal; estandarizarlo la haría abandonar la herramienta |
| Auth de Karla | Supabase Auth con **magic link** (correo, sin contraseña) | Ella tampoco es técnica; elimina "olvidé mi contraseña" para siempre |
| Storage | Bucket **privado** + URL firmada temporal | Un bucket público haría el token inútil |
| Stack front | HTML/CSS/JS estático, sin framework ni build | Igual que la landing: se despliega en cualquier hosting, sin pasos de compilación |
| Backend propio | **No existe.** El navegador habla directo a Supabase | Menos piezas, menos costo, menos que mantener |
| Hosting y dominio | **Hostinger** (Apache), un solo dominio para todo | Landing en `/`, panel en `/admin`, itinerarios en `/viaje/{token}`. Un pago, un certificado, misma marca en el enlace que llega por WhatsApp |
| PWA / service worker | **Fuera del v1** (ver §4) | Complejidad alta y riesgo de servir contenido viejo, que es justo el fallo peligroso |

---

## 2. Trampas técnicas (decidir ANTES de escribir código)

Estas son las que hacen perder horas si se descubren tarde.

### 2.1 La ruta `/viaje/{token}` no funciona sola en hosting estático
Un hosting estático busca un archivo llamado `viaje/xY7k2Lp9`, que no existe → 404.

> ✅ **DECIDIDO (2026-08-05): reescritura con `.htaccess`.**
> El cliente contrata **dominio + hosting en Hostinger**, que corre sobre Apache, así que
> la reescritura está disponible desde el día uno. Se usa la URL limpia
> `tudominio.com/viaje/xY7k2Lp9` porque el enlace llega por WhatsApp a alguien que acaba
> de pagar un viaje caro: una URL limpia genera confianza y una con `?v=` parece un enlace
> de rastreo.

Archivo `/viaje/.htaccess` (o en la raíz, ajustando la ruta):

```apache
RewriteEngine On
# Si el recurso pedido no existe como archivo o carpeta, sirve la página
# del itinerario y deja el token disponible en la variable "v".
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^([A-Za-z0-9_-]+)/?$ index.html?v=$1 [L,QSA]
```

En el JavaScript, leer el token de forma tolerante para que ambas formas funcionen:

```js
const token = new URLSearchParams(location.search).get('v')
           || location.pathname.split('/').filter(Boolean).pop();
```

*Alternativas si algún día cambia el hosting:* query param `/viaje/?v=token` (funciona en
cualquier lado) o hash `/viaje/#token` (el token nunca llega al servidor). El código de
arriba ya soporta la primera sin cambios.

### 2.2 WhatsApp genera vista previa del enlace — cuidado con la fuga
Al pegar el enlace, WhatsApp **descarga la página** para armar la miniatura. Implica:
- Las etiquetas `og:title` / `og:description` deben ser **genéricas y de marca**
  ("Tu itinerario · Tierra de Viajes"), **nunca** el nombre del cliente ni el destino.
- Si más adelante se registran aperturas, esa visita automática **contaría como una
  apertura falsa**. Filtrar por user-agent o no contar la primera.

### 2.3 Incrustar el PDF con `<iframe>` falla en iOS
Safari en iPhone frecuentemente muestra el iframe en blanco o solo la primera página.
Como el público es mayoritariamente móvil, **no depender de la incrustación**:
- Móvil: botón grande **"Abrir mi itinerario"** + botón **"Descargar"**. Sin iframe.
- Escritorio: ahí sí se puede incrustar, es fiable.
- Alternativa si se quiere previsualización real en móvil: renderizar la primera página
  como imagen con PDF.js. Solo si sobra tiempo.

### 2.4 El nombre del archivo descargado importa
Debe descargarse como `Itinerario Italia - Ana y Luis.pdf`, **no** como `xY7k2Lp9.pdf`.
Es literalmente el problema que vinimos a resolver: que el archivo no se pierda en el
teléfono. Usar el atributo `download` con el nombre construido, o el parámetro de
descarga de la URL firmada de Supabase.

### 2.5 El PDF actualizado y la copia vieja en el teléfono
Karla puede re-subir el PDF y el enlace sirve la versión nueva — **pero el cliente ya
descargó la anterior y no se entera**. En viajes, un vuelo que cambió es un problema real.
Mitigación (barata y obligatoria en el MVP):
- Mostrar visible en la página: **"Actualizado el 12 de junio"**.
- Guardar un contador `version` y la fecha `updated_at`.
- En `/admin`, al reemplazar el PDF, ofrecer un botón **"copiar aviso para WhatsApp"**
  con un texto listo: *"Actualicé tu itinerario, ábrelo de nuevo aquí: {enlace}"*.

### 2.6 Tamaño de los PDF
Un itinerario con fotos puede pesar 20 MB: descarga lenta con datos móviles en el
extranjero y consumo del plan gratuito. Definir política en `/admin`:
avisar si supera ~8 MB y sugerir comprimir. Verificar los límites vigentes del plan
gratuito de Supabase al momento de construir (cambian).

> Al construir el Paso 1 se fijó el tope duro del bucket en **25 MB por archivo**, con
> el aviso de los ~8 MB pendiente para el formulario de `/admin`.

### 2.7 El cliente sin sesión no puede firmar la URL del PDF por sí mismo
*(Descubierta al construir el Paso 1, 2026-08-05.)*

Parecía que el navegador podría pedirle a Supabase una URL firmada directamente, pero
`createSignedUrl` exige permiso de lectura sobre `storage.objects`, y ese permiso no se
puede acotar a "un solo archivo": si se le concede al rol anónimo, cualquiera con la clave
publicable puede **listar el bucket entero** y descargar los PDFs de todos los clientes.
Postgres no distingue "leer este archivo" de "listar todos" — las dos cosas son un `SELECT`.

> ✅ **DECIDIDO: una Edge Function firma la URL.** Recibe el token, lo valida contra la
> tabla y devuelve la URL firmada solo si el itinerario está vigente.

No contradice "backend propio: no existe" (§1): la función vive dentro de Supabase, no hay
servidor que contratar ni mantener, y el hosting sigue siendo estático. Usa la clave de
servicio que Supabase le inyecta sola como variable de entorno, así que esa clave nunca
pasa por el repositorio ni por el navegador.

Dos ventajas que salen gratis:
- La firma se genera **solo al pulsar "Descargar"**, no al cargar la página, así que la
  precarga de WhatsApp (§2.2) no consume firmas.
- Es el sitio natural donde registrar `last_opened_at` filtrando esa precarga (Paso 7).

*(En `/admin` no hace falta: Karla está autenticada y firma directamente.)*

### 2.8 Con magic link, "usuario autenticado" no significa "Karla"
*(Descubierta al construir el Paso 1, 2026-08-05.)*

Las políticas de escritura de la tabla dan acceso total al rol `authenticated`, que es lo
correcto **siempre que solo exista la cuenta de Karla**. Supabase, por defecto, permite que
cualquiera se registre: bastaría con pedir un enlace mágico a un correo propio para entrar
con ese rol y leer todos los itinerarios.

**Obligatorio antes de dar por bueno el Paso 2:** desactivar el registro público en el
dashboard (Authentication → Sign In / Providers → *Allow new users to sign up*) y crear la
cuenta de Karla a mano por invitación.

> ✅ Hecho el 2026-08-05 y **comprobado desde fuera**: `/auth/v1/signup` responde
> `signup_disabled` y `auth.users` sigue vacío tras el intento.

### 2.9 El correo del enlace mágico no le va a llegar a Karla
*(Descubierta al construir el Paso 2, 2026-08-05.)*

Supabase trae un servicio de correo incluido, pero con dos límites que aquí duelen:

1. **Solo entrega a miembros de la organización de Supabase.** Textual en su documentación:
   *"Supabase Auth will refuse to deliver messages to addresses that are not part of the
   project's team."* Karla nunca va a ser miembro de la organización, así que su enlace de
   acceso **no llegaría jamás**. Fallaría el día de la entrega, no antes.
2. Es de "mejor esfuerzo" y con un tope de pocos correos por hora. No es para producción.

**Durante el desarrollo** basta con usar el correo de la cuenta de Supabase, o invitar a la
organización el correo con el que se quiera probar.

**Antes de entregar es obligatorio configurar un SMTP propio** (Authentication → Emails →
SMTP Settings). Resend, Brevo, SendGrid, AWS SES o ZeptoMail sirven; el plan gratuito de
cualquiera sobra, porque los únicos correos que manda el sistema son los accesos de Karla
—los clientes reciben su enlace por WhatsApp, no por correo—.

> Sin este paso el portal funciona en local y **Karla no puede entrar en producción**.
> Es el fallo más silencioso de todo el proyecto: no da error hasta la entrega.

También conviene dejar el **Site URL** apuntando al sitio real (viene por defecto en
`http://localhost:3000`): es el destino al que Supabase redirige cuando una URL no coincide
con la lista permitida.

---

## 3. Orden de construcción (cada paso entrega algo funcionando)

### Paso 0 — Prerrequisitos

> **El hosting NO bloquea el desarrollo.** Los pasos 1 a 7 se construyen y se prueban
> en local contra Supabase, que es un servicio independiente del hosting. Solo la
> publicación final necesita el dominio contratado. No esperar por él.

**Bloqueante — se necesita antes de escribir código:**
- [x] Proyecto de Supabase creado (2026-08-05), región us-east-2, Postgres 17.
      URL y clave publicable ya en `public/js/supabase-config.js`.

      ✅ **Titularidad DECIDIDA (2026-08-05): el proyecto vive en la cuenta personal
      del desarrollador y no se transfiere a la agencia.**
      Queda constancia de lo que eso implica: la agencia no es titular, así que el día
      que la relación termine perdería el acceso a la base de datos y a los PDFs de sus
      clientes. Si algún día se quiere revertir, Supabase permite transferir el proyecto
      a otra organización sin migrar los datos.

      Las dos credenciales que necesita el front (URL del proyecto y **clave publicable**)
      viven en `public/js/supabase-config.js`, que **sí se versiona**: son públicas por
      diseño y la seguridad descansa en RLS (§5.7). La `service_role` / *secret key*, la
      contraseña de la base de datos y el *personal access token* **nunca** entran al
      repositorio ni al navegador.

**No bloqueante — se resuelve más adelante:**
- [ ] Correo de Karla para el acceso al panel. Durante el desarrollo se puede probar
      el enlace mágico con el correo del propio desarrollador; el de ella se registra
      al entregar. (Solo se necesita la dirección, nunca el acceso a su bandeja.)
- [ ] Dominio y hosting en Hostinger (plan **Single**, ya elegido por la clienta) con
      el SSL gratuito activado. Necesario únicamente para publicar.

**Ya cerrado:**
- [x] Ruta de los itinerarios → `.htaccess` con URL limpia (§2.1).
      En local `.htaccess` no aplica, así que durante el desarrollo se usa la forma
      `?v=token`. El código de lectura del token de §2.1 ya soporta ambas sin cambios.
- [x] Preguntas de producto para Karla → contestadas, ver `CONTEXTO.md` §7.
- [x] Estructura del repositorio → el sitio vive en `public/`; el portal se construye
      dentro de `public/admin/` y `public/viaje/`.

### Paso 1 — Base de datos y almacenamiento  ✅ HECHO
- Tabla `itinerarios` (esquema en `CONTEXTO.md` §3, más `version` y `updated_at` por §2.5).
- Bucket **privado** `itinerarios`.
- **RLS activo**: escritura solo para el usuario autenticado; lectura pública
  **únicamente** a través de una función que reciba el token exacto.
  Nunca permitir `select *` sobre la tabla desde el cliente.
- ✅ *Aceptación:* desde el navegador sin sesión, intentar listar la tabla → devuelve vacío
  o error. Con el token exacto → devuelve un registro.

### Paso 2 — Acceso de Karla  ✅ HECHO
- `/admin` protegido con magic link.
- ✅ *Aceptación:* sin sesión redirige a la pantalla de acceso; con el enlace del correo entra.

### Paso 3 — Crear itinerario (el corazón para Karla)  ✅ HECHO
- Formulario mínimo: nombre del cliente · título · tipo · **fechas del viaje** · PDF.
  Las fechas van destacadas, no como campo secundario: alimentan la caducidad y el
  calendario (`CONTEXTO.md` §7.1). Si se dejan vacías, caducidad de respaldo a 6 meses.
- Al guardar: sube el PDF, genera token (nanoid ≥21), calcula `expires_at`
  (= `fecha_fin` + 3 meses), inserta registro.
- Devuelve el enlace con **botón "Copiar"** y **botón "Copiar mensaje para WhatsApp"**
  (plantilla en `CONTEXTO.md` §7.2, editable antes de enviar).
- ✅ *Aceptación:* Karla completa el flujo en menos de 60 segundos y pega el mensaje en WhatsApp.

### Paso 4 — Listar y administrar  ⏳ PENDIENTE
- Lista de itinerarios: cliente, título, fecha, estado (activo / por caducar / caducado).
- Acciones: recopiar enlace · recopiar mensaje · reemplazar PDF (sube `version`) ·
  **"Reactivar 3 meses más"** (un clic, §7.1) · revocar.
- Buscador por nombre de cliente.
- ✅ *Aceptación:* Karla encuentra un itinerario de hace 3 meses, recopia su enlace y
  reactiva uno caducado sin ayuda.

### Paso 5 — Página del cliente `/viaje/{token}`  ✅ HECHO
- Marca completa heredada de la landing, tipografía grande, mobile-first.
- Saludo personal ("Hola Ana, aquí está tu viaje a Italia"), fechas, "Actualizado el…".
- Botones: **Abrir / Descargar** (§2.3, §2.4) · **Imprimir**.
- `@media print`: sin botones, digno en blanco y negro, con **QR del enlace** al final.
- Bloque de contacto: *"¿Algo cambió en tu viaje? Escríbeme"* → WhatsApp de Karla.
- Estados de error con cariño: enlace inválido, revocado o caducado → mensaje amable
  con el WhatsApp de Karla, nunca un error técnico.
- ✅ *Aceptación:* abrir en un iPhone real y en un Android real; descargar el PDF con el
  nombre correcto; imprimir y que el QR devuelva a la misma página.

### Paso 6 — Calendario (nivel 0)  ⏳ PENDIENTE
- Botón "Agregar a mi calendario" → `.ics` con **un evento** que cubre el viaje,
  con el enlace en la descripción. Solo requiere las fechas.
- ✅ *Aceptación:* el archivo abre en iOS y Android y crea el evento.

### Paso 7 — Pulido  ⏳ PENDIENTE
- Aviso de actualización (§2.5): botón "copiar aviso" al reemplazar el PDF.
  *Baja prioridad:* Karla confirmó que el itinerario casi nunca cambia tras entregarse.
- Métrica mínima: "última apertura" (útil para que Karla sepa si el cliente ya lo vio).
- **PIN: descartado** por decisión de Karla. Dejar la columna en la tabla, sin interfaz.

---

## 4. Sobre la PWA / modo offline — recomendación honesta

`CONTEXTO.md` §2c la contemplaba. **Revisada la decisión: fuera del v1.**

Motivos:
1. **El PDF descargado ya es el modo offline**, y es el que el cliente entiende sin explicación.
2. Un service worker mal versionado **sirve contenido viejo**, que es exactamente el fallo
   peligroso de §2.5 (un itinerario desactualizado en un viaje).
3. Cuesta bastante trabajo mantener para una ganancia marginal en este caso.

**En su lugar, resolverlo con UX (más barato y más efectivo):** en la página del cliente,
un bloque claro y amable tipo *"Antes de viajar: descarga tu itinerario para tenerlo sin
internet"*, con el botón de descarga al lado. El paso offline lo hace la persona, a
conciencia, y sabe que lo hizo.

Revisar la PWA solo si aparece evidencia real de que hace falta.

---

## 5. Cómo debe trabajar Claude en la sesión nueva

1. Leer `CONTEXTO.md` (qué y por qué) y este archivo (cómo).
2. **No re-decidir** lo de §1. Si algo parece mal, decirlo y esperar respuesta.
3. Confirmar el Paso 0 con el usuario antes de escribir código.
4. Construir **en el orden de §3**, verificando cada paso en el navegador antes de seguir.
5. Reutilizar el sistema de diseño de `../css/styles.css`. No inventar estilos nuevos.
6. Probar siempre en móvil (375 px) además de escritorio.
7. Nunca subir al repo público: claves privadas, PDFs reales de clientes, datos de personas.
   La clave publicable de Supabase sí puede ir en el front (es su diseño), pero
   **la seguridad debe descansar en RLS**, no en esconder la clave.
