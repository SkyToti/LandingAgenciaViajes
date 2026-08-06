# Sistema de Itinerarios — Tierra de Viajes by Fraveo

Contexto para Claude Code. Proyecto independiente de la landing (que vive en la carpeta padre).
Este documento define **QUÉ** construir y **POR QUÉ**.

> 👉 El **CÓMO** (orden de construcción, criterios de aceptación y trampas técnicas ya
> identificadas) está en **`PLAN-DE-TRABAJO.md`**. Leer ambos antes de empezar.

---

## 1. El problema real (contado por la dueña)

Karla (dueña/asesora de la agencia, Cuernavaca) entrega itinerarios de viaje a sus clientes.
Hoy los manda como **PDF por WhatsApp** y eso falla en la práctica:

- El PDF **se pierde** entre los mensajes; semanas después nadie lo encuentra.
- La descarga de WhatsApp **caduca** o falla; cambian de teléfono y desaparece.
- **Nadie lo imprime**, y cuando lo necesitan en el viaje no tienen cómo verlo bien.
- El cliente típico tiene **35–45+ años**: paga bien, pero no es techie. Nada de apps
  que instalar, ni contraseñas, ni pasos complicados.
- **Viajan sin internet**: roaming apagado, WiFi solo en hoteles, pueblos sin señal.

**Objetivo:** que el itinerario viva en un lugar del que nunca se pierda, se pueda ver
bonito en el celular, imprimir, descargar y consultar SIN internet. Y que para Karla
compartirlo sea trivial (un enlace por WhatsApp).

## 2. La solución (arquitectura ya validada, extendida)

> Nota: la base de esto ya estaba esbozada en `../contexto.md` §5. Aquí se extiende
> con los requisitos de offline/impresión/calendario que pidió la dueña.

**Principio:** el itinerario canónico es UNA PÁGINA WEB por cliente, no un archivo.
De la página salen todos los demás formatos.

### ⚠️ Principio rector: el contenido NO se estandariza
Cada itinerario es artesanal, en lenguaje natural, distinto por cliente — así trabaja
Karla y así debe seguir. **El sistema estandariza el SOBRE (entrega, acceso, formatos),
nunca el contenido.** El PDF que ella ya hace es la fuente de verdad y una caja cerrada
para el sistema. PROHIBIDO diseñar formularios rígidos de "actividad/hora/lugar":
no los va a usar y con razón.

### a) Panel privado `/admin` (solo Karla, con Supabase Auth)
- Formulario MÍNIMO (30 segundos): nombre del cliente, título del viaje
  ("Italia de Ana y Luis"), tipo (`asesoria`|`viaje`), fechas inicio/fin (opcional),
  **subir su PDF**. Nada más. Su creatividad no se toca.
- Al guardar: genera **token largo no adivinable** (nanoid ≥21 chars) y devuelve el
  enlace listo para copiar: `https://dominio.com/viaje/{token}` → Karla lo pega en WhatsApp.
- Reenviar = mismo enlace. Nunca se regenera (salvo que ella lo revoque).
- **Además del alta, necesita administrar:** lista de itinerarios con buscador por
  nombre de cliente, recopiar enlace, reemplazar el PDF y revocar. Sin esto tendría que
  guardar los enlaces por su cuenta, que es volver al problema original.

### b) Página del cliente `/viaje/{token}` (sin login)
- Diseño con la marca de la agencia (paleta navy/dorado/crema, Fraunces + Plus Jakarta
  — ver `../contexto.md` §3), tipografía GRANDE (público 35-45+), mobile-first.
- Contenido: resumen del viaje, itinerario día por día si está estructurado,
  y el PDF embebido/descargable (URL firmada de Supabase con caducidad).
- **Botonera de formatos (el corazón de la solución):**
  1. **Descargar PDF** (URL firmada, regenerable).
  2. **Imprimir** — CSS `@media print` cuidado: blanco/negro digno, sin botones,
     con QR del enlace al final ("si pierdes este papel, escanea aquí").
  3. **Agregar a mi calendario** (.ics) — en 3 niveles según cuánta estructura exista:
     - **Nivel 0 (MVP, solo requiere fechas):** UN evento que abarca todo el viaje:
       "✈️ Tu viaje a Italia — toca para ver tu itinerario" con el enlace dentro.
       Offline, útil, cero trabajo extra para Karla.
     - **Nivel 1 (opcional por viaje):** textarea libre en /admin, una línea = un día
       ("12 jun — Roma, llegada y Trastevere"). NO es un formulario, es pegar texto.
     - **Nivel 2 (futuro, fase F3+):** IA (Claude Haiku, centavos por itinerario) lee
       el PDF en lenguaje natural y PROPONE el desglose día por día; Karla solo
       revisa/aprueba. Es la respuesta a "no hay estándar": la IA lee lo no-estándar.
     El calendario nativo funciona OFFLINE y avisa solo. Cero curva de aprendizaje.
  4. (Opcional) "Guardar en tu pantalla de inicio" con instrucciones simples.

### c) Offline
> ⚠️ **Decisión revisada.** Esta sección proponía una PWA con service worker.
> Se descartó para el v1 — ver el razonamiento en `PLAN-DE-TRABAJO.md` §4.
> Resumen: el PDF descargado ya resuelve el offline y lo entiende cualquiera, mientras
> que un service worker mal versionado puede servir un itinerario viejo, que es
> justo el fallo peligroso en un viaje.

**Enfoque para el v1 (UX, no tecnología):** un bloque claro en la página del cliente,
*"Antes de viajar: descarga tu itinerario para tenerlo sin internet"*, con el botón de
descarga al lado. Se apoya en dos capas que sí funcionan sin conexión: el **PDF
descargado** y el **evento de calendario**.

### d) Seguridad (modelo "capability URL")
- Quien tiene el enlace, entra (como "cualquiera con el enlace" de Google Docs).
- Token en URL, imposible de adivinar; el bucket de Storage es PRIVADO y el PDF
  se sirve solo con URL firmada temporal.
- Opcional por cliente: **PIN de 4 dígitos** (ej. últimos 4 del teléfono). Sin cuentas
  ni contraseñas — este público las pierde.
- `expires_at` opcional (ej. 6 meses tras el viaje) + botón de revocar en /admin.
- RLS activado: la tabla solo se lee vía función/consulta por token exacto, nunca listado.

## 3. Modelo de datos (Supabase / PostgreSQL)

```
itinerarios
  id            uuid pk
  token         text unique  (nanoid 21+, indexado)
  cliente_nombre text
  titulo        text
  tipo          text  ('asesoria'|'viaje')
  fecha_inicio  date
  fecha_fin     date
  pdf_path      text  (Storage, bucket privado)
  dias          jsonb (opcional: [{fecha, titulo, actividades[]}] para render web + .ics)
  pin           text  (opcional, hash)
  expires_at    timestamptz (opcional)
  revoked       bool default false
  version       int default 1        (sube al reemplazar el PDF)
  updated_at    timestamptz          (se muestra como "Actualizado el ..." al cliente)
  last_opened_at timestamptz         (opcional: para que Karla sepa si ya lo vieron)
  created_at    timestamptz
```

> `version` y `updated_at` no son opcionales: resuelven el problema de la copia vieja
> descargada en el teléfono del cliente. Ver `PLAN-DE-TRABAJO.md` §2.5.

## 4. Stack

- **Supabase**: PostgreSQL + Storage (bucket privado) + Auth (solo /admin). Igual que la landing.
- **Frontend estático** (HTML/CSS/JS) o Astro/Vite si se quiere plantillas — mantener simple.
- **.ics**: generación en el cliente (es texto plano, formato iCalendar RFC 5545 — sin librería o con `ics` npm).
- **QR**: librería ligera (ej. `qrcode`) generado en cliente.
- **PWA**: manifest.json + service worker a mano (Workbox si se complica).
- **Hosting**: el mismo del proyecto (Hostinger / Cloudflare Pages). NO Vercel Hobby (uso comercial).
- Puede vivir en el MISMO dominio de la landing (`/viaje/...`, `/admin`) — más simple y
  la marca queda unificada. Decidir al integrar.

## 5. Los escenarios que el sistema debe sobrevivir (checklist de diseño)

1. Cliente pierde el mensaje de WhatsApp → Karla reenvía el mismo enlace. ✔
2. Cliente cambia de teléfono → el enlace sigue funcionando; re-cachea la PWA. ✔
3. Sin internet en el destino → PWA cacheada + PDF descargado + calendario. ✔
4. "No sé usar esto" (55+ acompañante) → versión impresa con QR. ✔
5. PDF actualizado a última hora (cambio de vuelo) → Karla re-sube; el MISMO enlace
   muestra la versión nueva; la PWA actualiza el caché al tener señal. ✔ (versionar caché)
6. Enlace compartido a un tercero indebido → PIN opcional + expiración + revocar. ✔
7. El PDF pesa 20MB con fotos → comprimir al subir o avisar en /admin; el caché offline
   tiene límite razonable. ⚠ decidir política.
8. Cliente abre el enlace 1 vez con datos y nunca más con señal → el service worker
   debe cachear TODO en esa primera visita (precache agresivo del PDF incluido).

## 6. Roadmap sugerido (fases)

- **F1 — MVP (lo que ya resuelve el 80%):** tabla + /admin (subir PDF, obtener enlace)
  + /viaje/{token} con visor + Descargar + Imprimir con QR. ~1-2 sesiones.
- **F2 — Offline:** PWA (manifest + service worker + banner "guardado").
- **F3 — Calendario:** Nivel 0 (evento único del viaje) entra ya en F1 casi gratis;
  aquí se agrega el Nivel 1 (textarea por día) y/o Nivel 2 (extracción con IA).
- **F4 — Pulido:** PIN, expiración/revocado, estadísticas simples ("¿ya lo abrió?"),
  plantilla de mensaje de WhatsApp prellenada para Karla.

## 7. Respuestas de Karla — decisiones de producto CERRADAS

> Contestadas el 2026-08-05. No volver a preguntar; construir con esto.

| Pregunta | Respuesta | Consecuencia para el desarrollo |
|---|---|---|
| ¿Cambia el itinerario tras entregarlo? | **Casi nunca.** Se entrega como versión final | El aviso de actualización baja de prioridad: basta con `version` + "Actualizado el…". El botón de "copiar aviso" pasa al Paso 7 |
| ¿Capturar el día por día? | **No. Solo sube su PDF tal cual** | Sin captura estructurada. El calendario se queda en **nivel 0** (un evento que cubre el viaje). El campo `dias` no se usa por ahora |
| ¿PIN de 4 dígitos? | **No.** Enlace directo | Fuera del alcance. Dejar el campo `pin` en la tabla por si algún día se pide, pero sin interfaz |
| ¿Caducidad de enlaces? | **Sí: 3 meses después de terminar el viaje** | Ver §7.1 abajo — tiene implicaciones |
| ¿Volumen mensual? | **Pocos al mes** (ticket alto, viajes de ~$200 mil MXN) | El plan gratuito de Supabase sobra con holgura |
| ¿Qué le escribe al cliente por WhatsApp? | Lo delega — su estilo es muy informal | Redactar nosotros la plantilla (§7.2) y dejarla editable |

### 7.1 Caducidad: consecuencias que hay que respetar

La caducidad se calcula como **`fecha_fin` + 3 meses**. Eso obliga a dos cosas:

1. **Las fechas del viaje dejan de ser opcionales en la práctica.** Alimentan tanto la
   caducidad como el botón de calendario. En el formulario deben pedirse de forma
   destacada. Si aun así se dejan vacías, el respaldo es: **caducar 6 meses después de
   la creación** (nunca dejar un registro sin fecha de caducidad).
2. **Un enlace caducado no puede ser un callejón sin salida.** La página debe mostrar
   un mensaje cálido del tipo *"Este enlace ya caducó. Escríbeme y te lo reactivo en un
   momento"* con el botón de WhatsApp de Karla. Y en `/admin` debe existir un botón
   **"Reactivar 3 meses más"** de un solo clic.

> Nota: la recomendación técnica era no caducar (un cliente que revisa su viaje años
> después es un recuerdo y una recomendación). Karla prefirió caducar; se respeta, y por
> eso reactivar debe ser trivial en vez de imposible.

### 7.2 Plantilla del mensaje de WhatsApp

Se ofrece en `/admin` con un botón "Copiar mensaje", ya con el enlace insertado, y
**editable** antes de enviar:

```
¡Hola {nombre}! Ya quedó listo tu itinerario para {destino} ✈️

Aquí lo puedes ver y descargar:
{enlace}

Te recomiendo descargarlo antes de viajar para tenerlo aunque no tengas internet.
Cualquier duda me escribes por aquí. ¡Ya falta poco!
```

Tono: cálido y directo, sin sonar corporativo. Un solo emoji. El "te recomiendo
descargarlo" no es adorno: es la instrucción que resuelve el modo sin conexión.

## 8. Reglas heredadas del proyecto madre

- Marca y paleta: `../contexto.md` §3. Tipografía grande y cálida — el público es 35-45+.
- Tono: cálido, personal, "hecho a mano por Karla" — la página del itinerario es parte
  de la EXPERIENCIA premium del servicio, no un archivo utilitario.
- Contacto siempre a la mano: botón WhatsApp de Karla en la página del itinerario
  ("¿Algo cambió en tu viaje? Escríbeme").
