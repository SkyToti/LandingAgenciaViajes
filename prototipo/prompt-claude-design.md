# Prompt para Claude Design — Landing Tierra de Viajes

> Adjunta junto a este prompt: (1) una CAPTURA del prototipo `hero.html` abierto en el navegador, y (2) el archivo `hero.html`. Son el NORTE visual.

--- 

Eres director de arte y diseñador web senior, especializado en marcas de viajes de lujo accesible y cálido. Diseña una **landing page de una sola página, mobile-first**, para **"Tierra de Viajes by Fraveo"**, su servicio **"Diseño de Viajes"** (itinerarios a la medida de la asesora **Karla**). **Objetivo ÚNICO de la página: que el usuario contacte por WhatsApp.**

Te adjunto un prototipo (HTML + captura): **es el NORTE visual, respétalo**. Quiero exactamente esa sensación premium.

## DIRECCIÓN DE ARTE (tono: cálido y emocional)
- Lujo discreto y editorial. Sensación de "sueño de viaje", NO de "estudio de software".
- Sesga CÁLIDO: usa crema y dorado con generosidad, fotos soñadoras, acogedor.
- Mucho espacio en blanco, asimetría intencional, tipografía protagonista a gran escala.
- **Paleta:** azul marino `#15233B`, dorado `#E0A526`, crema `#F7F2E9` (fondo principal, NUNCA blanco puro), verde WhatsApp `#25D366` (TODOS los CTA), rojo `#C2362F` (mínimo).
- **Tipografía:** titulares serif **Fraunces** (Google Fonts); texto/UI **Plus Jakarta Sans**.
- **Fotografía:** real, grande, editorial, de Europa/Italia. Full-bleed en el héroe. Tratamiento cálido, sin filtros neón.
- Detalles artesanales: marcos dorados finos, líneas delgadas (1px), hovers sutiles, un grano muy sutil sobre las fotos.
- Scroll fluido y revelados sutiles al entrar en viewport (con propósito, no en absolutamente todo).

## PROHIBIDO (esto es lo que hace que un diseño "parezca IA genérica" — NO lo hagas)
- Degradados azul-morado-neón en los títulos. El texto va en color plano.
- Tipografías Inter / system-ui. Usa Fraunces + Plus Jakarta.
- "3 columnas de iconitos / beneficios". NO existen aquí.
- Tabla de precios estilo SaaS con el plan del centro "Más elegido" resaltado. Los precios van presentados de forma EDITORIAL.
- Todo centrado y simétrico; cards idénticas con radius 16px. Usa asimetría y radius sutil (~4px).
- Que todos los elementos aparezcan con el mismo fade-up idéntico.

## ESTRUCTURA (en este orden EXACTO)
1. **Barra superior:** logo "Tierra de Viajes by Fraveo" (pequeño, izquierda) · links (Cómo funciona · Sobre mí · Inversión) · botón verde WhatsApp.
2. **Héroe:** eyebrow dorado "DISEÑO DE VIAJES" · titular Fraunces enorme **"Viaja a tu aire, sin límite de tiempos"** (resalta "sin límite" en dorado/itálica) · subtítulo "Itinerarios a la medida, diseñados a mano por una especialista que vivió 12 años en Europa" · 1 botón "Cotizar por WhatsApp" · foto full-bleed de Italia · tira de confianza discreta (5.0 en Google · 29 reseñas · RNT registrado · Miembro de AMORAV).
3. **Karla, la persona (protagonista):** foto editorial vertical con marco dorado desplazado + titular "Doce años viviendo Europa, ahora diseñando el viaje que tú sí vas a disfrutar" + texto cálido que integra como PROSA (no columnas) las ideas de Exclusividad, Tranquilidad y Experiencia + sellos (Especialista en Italia · +12 años en turismo en Europa · RNT 04170070089d5 · Mesa directiva AMORAV).
4. **El problema (conexión emocional, breve):** "Planear tu viaje solo son 40 pestañas abiertas y el miedo a equivocarte de hotel o de tren." Resuelto por Karla.
5. **Cómo trabajamos juntos (4 pasos como narrativa, no tarjetas frías):** (1) Te conozco por WhatsApp o videollamada · (2) Diseño tu itinerario a la medida · (3) Reservas sin estrés, con liga de pago segura · (4) Recibes tu itinerario detallado.
6. **Testimonios reales (NUNCA inventar):**
   - Marcelo Sandoval: "El apoyo que tuvimos al principio, durante y al final del viaje fue espectacular. Lo recomiendo ampliamente."
   - Paulina Moguel: "Excelente servicio. Me encantó el acompañamiento y la atención en todo mi viaje."
   - Laura Herrera: "Súper bien organizado, muy amables, mucha comunicación y atención personalizada."
   - Adriana Guajardo: "Karla me explicó todo con detalle y logró que mi viaje fuera seguro y placentero."
7. **La inversión (precios — presentación EDITORIAL, fondo azul marino, NO pricing-SaaS):**
   - Smart "Escápate" — $1,500 MXN (hasta 3 ciudades, +$500 por ciudad).
   - Plus "Descúbrelo" — $1,950 MXN (hasta 3 días) — *destacado de forma sutil*.
   - Elite "Vívelo al máximo" — $2,400 MXN (hasta 3 días).
   - Banda inferior: Asesoría puntual $500 MXN (videollamada de 1.5 hrs).
   - Nota: 50% de anticipo, saldo contra entrega.
8. **Salida secundaria (SIN precios):** "¿Prefieres un todo incluido o un viaje en grupo?" — CTA WhatsApp.
9. **CTA final + pie:** logo · contacto (777 444 8065 · reservas@tierradeviajes.com · Cuernavaca, Morelos) · redes (Instagram @agencia.tierradeviajes · Facebook TierradeViajesMX) · nota legal (RNT 04170070089d5 · RET 00347 · AMORAV · verificable en Sectur).

## CTAs (enlaces exactos)
- Botones verdes principales → `https://wa.me/527774448065?text=Hola,%20me%20interesa%20el%20Dise%C3%B1o%20de%20Viajes`
- Botón de asesoría → `https://wa.me/527774448065?text=Hola,%20quiero%20agendar%20una%20asesor%C3%ADa`

Entrega HTML y CSS limpios, responsivos (mobile-first). Las fotos pueden ser placeholders de Unsplash con temática Europa/Italia; las sustituiré después por las reales.
