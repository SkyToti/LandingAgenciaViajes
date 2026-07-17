# CLAUDE.md — Tierra de Viajes · Proyecto web

Contexto del proyecto para Claude Code. Léelo antes de empezar a construir.

---

## 1. Resumen del proyecto

Desarrollar la presencia digital de la agencia **Agencia Tierra de Viajes by Fraveo** (Cuernavaca, Morelos, México), enfocada en su servicio propio **Diseño de Viajes**. El objetivo central de todo el sitio es **llevar al usuario a contactar por WhatsApp**.

Dos entregables:

1. **Landing page** — sitio informativo y responsivo para presentar el servicio y captar prospectos.
2. **Sistema de envío de itinerarios** — panel privado para la dueña + página privada por cliente para ver/descargar su itinerario en PDF.

La dueña/asesora se llama **Karla**. Es **especialista en Europa, experta en Italia**, con +12 años viviendo y trabajando en turismo en Europa.

---

## 2. Contexto de negocio (importante para no equivocar el enfoque)

La agencia tiene **dos líneas de negocio**:

- **Diseño de Viajes (FOCO de este proyecto):** servicio propio de itinerarios a la medida, con **marca, proceso y precios fijos**. Es 100% remoto (plática por WhatsApp/Meet, anticipo y pago por liga). Es el producto que se anuncia digitalmente.
- **Reventa de paquetes (secundario):** revende paquetes de mayoristas (MegaTravel), ticket alto, cierre en persona, **sin precios propios**. En la landing va solo como salida secundaria al final, sin precios, con CTA a WhatsApp.

**Nota:** ya existe un sitio `tierradeviajes.com`, que es una **plantilla white-label de "2Business Travel"** (con motor de reservas RMT y paquetes de MegaTravel). Ese sitio NO se toca; se queda como backend de reservas. Lo que construimos es una **landing nueva e independiente** de marketing.

---

## 3. Marca

Sin manual de marca formal; solo existe el logo (`TIERRA DE VIAJES BY FRAVEO`, archivo .jpg). Dirección de marca definida para este proyecto:

**Paleta:**
- Azul marino `#15233B` — principal (titulares, fondos de secciones destacadas)
- Dorado `#E0A526` — acento (líneas, eyebrows, botones secundarios)
- Crema `#F7F2E9` — fondo cálido principal (en vez de blanco puro)
- Verde WhatsApp `#25D366` — TODOS los botones de acción principal
- Rojo `#C2362F` — solo detalles mínimos, casi sin usar

**Tipografía:**
- Titulares: serif **Fraunces** (vía Google Fonts)
- Texto y UI: sans **Plus Jakarta Sans** (vía Google Fonts)

**Logo:** pequeño y limpio en barra superior izquierda y en el pie. No protagonista. La fotografía + tipografía cargan el look moderno.

---

## 4. Entregable 1 — Landing page

Frontend estático (HTML/CSS/JS). El diseño base ya se prototipó en **Claude Design** y se exporta como HTML standalone; en Claude Code se limpia, se hace responsivo de verdad y se conecta lo dinámico.

**Estructura (en orden):**
1. **Barra superior:** logo · links (Cómo funciona, Paquetes, Sobre mí) · botón verde WhatsApp.
2. **Héroe:** eyebrow "DISEÑO DE VIAJES" · titular "Viaja a tu aire, sin límite de tiempos" · subtítulo "Itinerarios a la medida, diseñados por una especialista en Europa" · botón "Cotizar por WhatsApp" · foto grande de Italia/Europa · tira de confianza (5.0 en Google · 29 reseñas · RNT registrado · Miembro de AMORAV).
3. **Por qué un asesor (no una app):** 3 columnas — Exclusividad · Tranquilidad · Experiencia.
4. **Cómo funciona:** 4 pasos — (1) Te conozco por WhatsApp/videollamada, (2) Diseño tu itinerario, (3) Reservas sin estrés (con liga de pago segura), (4) Recibes tu itinerario detallado.
5. **Paquetes (fondo azul marino, con precios MXN):** ver tabla abajo. Plus va destacado ("Más elegido"). Banda inferior: asesoría puntual $500.
6. **Sobre mí (Karla):** foto + bio + sellos de confianza.
7. **Testimonios:** reseñas REALES (ver sección 6). Nunca inventar testimonios.
8. **Salida secundaria:** "¿Prefieres un todo incluido o un viaje en grupo?" — sin precios, CTA WhatsApp.
9. **CTA final + pie:** logo · contacto (tel, correo) · redes (Instagram, Facebook) · nota legal (RNT, RET, AMORAV, Sectur).

**Regla de CTAs:** todos los botones verdes enlazan a
`https://wa.me/527774448065?text=Hola,%20me%20interesa%20el%20Diseño%20de%20Viajes`
El botón de asesoría: `https://wa.me/527774448065?text=Hola,%20quiero%20agendar%20una%20asesoría`

Opcional: registrar prospectos (leads) en Supabase para seguimiento.

---

## 5. Entregable 2 — Sistema de envío de itinerarios

NO es una app ni un dashboard grande. Es:

**a) Panel privado `/admin`** (protegido con Supabase Auth, solo para Karla):
- Formulario: nombre del cliente, título/tipo (`asesoria` | `viaje`), subir PDF.
- Al guardar: sube el PDF a **Supabase Storage (bucket privado)** e inserta un registro con un **token aleatorio largo e imposible de adivinar** (UUID o nanoid).
- Devuelve un enlace copiable: `https://tudominio.com/viaje/{token}` que Karla pega en WhatsApp.

**b) Página privada `/viaje/[token]`** (sin login para el cliente):
- Lee el token de la URL, consulta el registro, sirve el PDF mediante **URL firmada de Supabase con caducidad**.
- Muestra el itinerario embebido + botón de descarga, con branding de la agencia.
- Opcional: PIN simple (últimos 4 dígitos del teléfono) para más privacidad.

**Modelo de datos sugerido (tabla `itinerarios`):**
`id` (token), `cliente_nombre`, `titulo`, `tipo`, `pdf_path`, `created_at`, `expires_at` (opcional), `pin` (opcional).

El modelo de seguridad es "capability URL" (como "cualquiera con el enlace" de Google Docs) + URL firmada temporal sobre bucket privado.

---

## 6. Contenido real (usar tal cual, no inventar)

**Paquetes Diseño de Viajes:**

| Paquete | Precio base | Adicional |
|---|---|---|
| Smart "Escápate" | $1,500 MXN (hasta 3 ciudades) | +$500 por ciudad |
| Plus "Descúbrelo" *(destacado)* | $1,950 MXN (hasta 3 días) | +$650/día · $550/día desde el día 11 |
| Elite "Vívelo al máximo" | $2,400 MXN (hasta 3 días) | +$800/día · $600/día desde el día 11 |
| Asesoría puntual | $500 MXN | videollamada de 1.5 hrs |

- Smart: itinerario sugerido, distribución de días, apps para reservar.
- Plus: ruta diseñada a detalle, mejor opción de vuelo, 2 hoteles por ciudad, transportes internos.
- Elite: todo lo de Plus + actividades con itinerario diario.

**Pago:** 50% de anticipo, saldo contra entrega. Viajes >11 días pueden hacerse en 3 pagos. Pagos por depósito, transferencia o liga de pago.

**Credenciales de confianza:**
- RNT: `04170070089d5` · RET: `00347`
- Miembro de la mesa directiva de **AMORAV** (Asociación Morelense de Agencias de Viajes)
- Verificable en Sectur Nacional y Estatal (Morelos)
- +12 años en turismo, viviendo y trabajando en Europa

**Testimonios reales (versiones cortas; hay más en el folleto):**
- Marcelo Sandoval: "El apoyo que tuvimos al principio, durante y al final del viaje fue espectacular. Lo recomiendo ampliamente."
- Paulina Moguel: "Excelente servicio. Me encantó el acompañamiento y la atención en todo mi viaje."
- Laura Herrera: "Súper bien organizado, muy amables, mucha comunicación y atención personalizada."
- Adriana Guajardo: "Karla me explicó todo con detalle y logró que mi viaje fuera seguro y placentero."

**Datos de contacto:**
- Teléfono / WhatsApp: 777 444 8065 → `https://wa.me/527774448065`
- Correo: `reservas@tierradeviajes.com`
- Ubicación: Cuexcontitla 406, Lomas de la Selva, 62270, Cuernavaca, Morelos
- Redes: Instagram (`@agencia.tierradeviajes`), Facebook (`TierradeViajesMX`)
- Google Business: 5.0 estrellas, 29 reseñas

---

## 7. Stack tecnológico

- **Frontend:** HTML, CSS, JavaScript (estático). Partimos del export de Claude Design. Fuentes vía Google Fonts (Fraunces, Plus Jakarta Sans).
- **Backend / DB / Auth / Storage:** **Supabase** (PostgreSQL, Storage, Auth). Es el "cerebro": el frontend estático le habla directo desde el navegador. No se necesita Node propio.
- **Hosting:** **Hostinger Premium** (incluye dominio 1 año) como opción elegida. Alternativas gratuitas con uso comercial permitido: **Cloudflare Pages** o **Netlify** (+ dominio aparte).
  - ⚠️ NO usar el plan gratis (Hobby) de **Vercel**: sus términos son para uso no comercial.
- **Canal de contacto:** WhatsApp (deep links `wa.me`).
- **Herramientas de desarrollo:** Claude Design (diseño/prototipo) → Claude Code (programación).

---

## 8. Estado actual

- Investigación del negocio: completa.
- Marca (paleta + tipografía): definida.
- Landing: prototipo generado en Claude Design, con una ronda de correcciones aplicada (testimonios reales, marco de imagen único, copys). Pendiente: exportar a HTML y traerlo aquí.
- Sistema de itinerarios: diseñado (arquitectura definida), sin construir.

**Tareas para Claude Code:**
1. Limpiar el HTML exportado de Claude Design y dejarlo responsivo y mantenible.
2. Confirmar/arreglar todos los enlaces de WhatsApp y el correo real.
3. Insertar fotos reales (héroe: Italia/Europa; Sobre mí: foto de Karla).
4. Montar Supabase: tabla `itinerarios`, bucket privado, Auth para `/admin`.
5. Construir `/admin` (subir PDF + generar link) y `/viaje/[token]` (visor con URL firmada).
6. (Opcional) Captura de leads de la landing en Supabase.
7. Configurar deploy en el hosting elegido con dominio propio.

---

## 9. Trampas y reglas a recordar

- **No usar imágenes de Google Imágenes** (derechos de autor). Solo fotos propias de Karla o bancos con licencia comercial (Unsplash, Pexels).
- **Nunca inventar testimonios.** Usar solo los reales del folleto.
- En el **preview de Claude Design**, los botones de WhatsApp y el correo aparecen "bloqueados/protegidos" por el sandbox y Cloudflare. **No es un bug**: en el dominio real funcionan. Verificar los enlaces aquí, no en el preview.
- Mantener el logo pequeño; el look moderno lo dan la fotografía y la tipografía.
- Precios: Smart se cobra por ciudades; Plus/Elite por días (fiel al folleto; si la dueña quiere unificarlo, es decisión de negocio).

---

## 10. Fase 2 (opcional, NO ahora)

- **Asistente de IA en WhatsApp** vía **WhatsApp Cloud API** + Claude (modelo **Haiku** por costo). Rol: responder FAQ y **calificar prospectos**, luego pasar el lead a Karla. NO cierra ventas ni cotiza precios (el cierre siempre es humano).
- **Feed de reseñas de Google en vivo** vía Google Places API. Límite: máx. 5 reseñas, no se eligen cuáles, tiene costo. Con solo 29 reseñas, curar a mano se ve mejor. Baja prioridad.
