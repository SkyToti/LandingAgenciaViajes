# Sistema de Itinerarios — Tierra de Viajes by Fraveo

Contexto para Claude Code. Proyecto independiente de la landing (que vive en la carpeta padre).
Este documento define QUÉ construir y POR QUÉ, para arrancar el desarrollo en una sesión nueva.

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

### c) Offline: PWA
- Service worker que cachea la página del itinerario + assets + el PDF al primer visit.
- Después funciona en modo avión / sin señal, abre desde el ícono como una app.
- Banner discreto la primera vez: "✓ Tu itinerario ya quedó guardado en este teléfono".
- Capas de redundancia offline: PWA + PDF descargado + eventos de calendario.
  (Si una falla, las otras sostienen.)

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
  created_at    timestamptz
```

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

## 7. Preguntas abiertas para Karla (resolver antes/durante F1)

1. ¿El itinerario cambia después de entregado con qué frecuencia? (afecta F1: versionado)
2. ¿Quiere capturar el día-por-día estructurado o solo subir su PDF? (afecta F3)
3. ¿PIN sí o no por defecto? (fricción vs privacidad)
4. ¿Caducidad de enlaces? (sugerencia: nunca, o 12 meses tras fecha_fin)
5. ¿Cuántos itinerarios al mes? (dimensionar plan gratuito de Supabase — sobra de sobra)

## 8. Reglas heredadas del proyecto madre

- Marca y paleta: `../contexto.md` §3. Tipografía grande y cálida — el público es 35-45+.
- Tono: cálido, personal, "hecho a mano por Karla" — la página del itinerario es parte
  de la EXPERIENCIA premium del servicio, no un archivo utilitario.
- Contacto siempre a la mano: botón WhatsApp de Karla en la página del itinerario
  ("¿Algo cambió en tu viaje? Escríbeme").
