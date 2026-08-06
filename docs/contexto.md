# Brief del proyecto — Tierra de Viajes by Fraveo

Documento de referencia del proyecto: objetivo, marca, estructura y stack.

---

## 1. Resumen

Presencia digital de la agencia **Tierra de Viajes by Fraveo** (Cuernavaca, Morelos),
enfocada en su servicio **Diseño de Viajes**: itinerarios a la medida diseñados por la
asesora **Karla**, especialista en Europa y experta en Italia, con más de 12 años
viviendo y trabajando en turismo en el continente. El objetivo del sitio es **llevar al
visitante a contactar por WhatsApp**.

El proyecto contempla dos entregables:

1. **Landing page** — sitio informativo y responsivo para presentar el servicio (este repositorio).
2. **Portal de itinerarios** — panel privado para la asesora + página por cliente para ver y
   descargar su itinerario. Diseñado, aún sin construir (ver `sistema-itinerarios/CONTEXTO.md`).

---

## 2. Marca

Sin manual de marca formal. Dirección visual definida para el proyecto:

**Paleta:**
- Azul marino `#15233B` — principal (titulares, fondos de secciones destacadas)
- Dorado `#E0A526` — acento (líneas, eyebrows, detalles)
- Crema `#F7F2E9` — fondo cálido principal (en vez de blanco puro)
- Verde `#25D366` — acción de contacto (WhatsApp)
- Rojo `#C2362F` — detalles mínimos

**Tipografía:**
- Titulares: serif **Fraunces** (Google Fonts)
- Texto y UI: sans **Plus Jakarta Sans** (Google Fonts)

**Logo:** pequeño y limpio en la barra superior y el pie. El look moderno lo cargan la
fotografía y la tipografía, no el logo.

---

## 3. Estructura de la landing

1. **Barra superior:** logo · navegación · botón de contacto.
2. **Héroe:** eyebrow "Diseño de Viajes" · titular "Viaja a tu aire, sin límite de tiempos" ·
   subtítulo · botón de contacto · foto a pantalla completa · tira de confianza.
3. **Karla:** presentación de la asesora y sus credenciales (la persona es el diferenciador).
4. **Por qué un asesor:** conexión con el problema del viajero.
5. **Destinos:** mosaico fotográfico.
6. **Cómo trabajamos:** 4 pasos, con la ruta animada y el avión.
7. **Testimonios:** reseñas reales de clientes.
8. **La inversión:** paquetes con presentación editorial.
9. **Salida secundaria y pie:** CTA final, contacto, redes y datos legales.

**Regla de CTAs:** los botones de contacto enlazan a WhatsApp mediante `wa.me` con un
mensaje precargado según el contexto (cotización o asesoría).

---

## 4. Contenido (real, no inventar)

**Paquetes Diseño de Viajes:**

| Paquete | Precio base | Adicional |
|---|---|---|
| Smart "Escápate" | $1,500 MXN (hasta 3 ciudades) | +$500 por ciudad |
| Plus "Descúbrelo" *(destacado)* | $1,950 MXN (hasta 3 días) | +$650/día |
| Elite "Vívelo al máximo" | $2,400 MXN (hasta 3 días) | +$800/día |
| Asesoría puntual | $500 MXN | videollamada de 1.5 hrs |

**Credenciales de confianza:**
- RNT `04170070089d5` · RET `00347`
- Miembro de la mesa directiva de **AMORAV** (Asociación Morelense de Agencias de Viajes)
- Verificable en Sectur Nacional y Estatal (Morelos)

**Contacto:**
- WhatsApp: 777 444 8065 → `https://wa.me/527774448065`
- Correo: `reservas@tierradeviajes.com`
- Cuernavaca, Morelos
- Redes: Instagram `@agencia.tierradeviajes` · Facebook `TierradeViajesMX`
- Google Business: 5.0 estrellas, 29 reseñas

> Los testimonios del sitio son reseñas reales de clientes. No se inventan testimonios.

---

## 5. Stack

- **Frontend:** HTML, CSS y JavaScript estáticos, sin frameworks. Fuentes vía Google Fonts.
  Animación con GSAP + ScrollTrigger y Lenis; avión 3D con Three.js (carga diferida).
- **Backend (fase 2):** Supabase (PostgreSQL, Storage, Auth) para el portal de itinerarios.
- **Hosting:** estático (Hostinger, Cloudflare Pages o Netlify).
- **Contacto:** WhatsApp (deep links `wa.me`).

---

## 6. Pendientes

- Sustituir las fotografías de placeholder por las reales de la agencia.
- Integrar el logotipo definitivo.
- Conectar las reseñas reales de Google.
- Pase de rendimiento (WebP, `preload`) antes de campañas de anuncios.
- Construir el portal de itinerarios.

---

## 7. Reglas

- Solo fotografías propias de la agencia o de bancos con licencia comercial (Unsplash, Pexels).
  Nunca imágenes tomadas de buscadores.
- Nunca inventar testimonios; usar solo los reales.
- Mantener el logo discreto; el look lo dan la fotografía y la tipografía.
