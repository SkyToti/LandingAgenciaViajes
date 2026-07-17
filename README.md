# Tierra de Viajes by Fraveo — Landing page

**🔗 Demo en vivo: <https://skytoti.github.io/LandingAgenciaViajes/>**

Sitio web de marketing para la agencia **Tierra de Viajes by Fraveo** (Cuernavaca, Morelos),
enfocado en su servicio **Diseño de Viajes**: itinerarios a la medida de la asesora Karla,
especialista en Europa. El objetivo de la página es llevar al visitante a contactar por WhatsApp.

## Cómo verlo

Es un sitio estático. La forma más simple:

```bash
npx serve -l 4173 .
```

Y abrir <http://localhost:4173>. También se puede abrir `index.html` directamente en el navegador.

## Estructura

```
index.html                  Estructura (HTML semántico)
css/
  styles.css                Sistema de diseño, layout y animaciones
js/
  main.js                   Scroll suave (Lenis) y animaciones de scroll (GSAP)
  plane3d.js                Avión 3D (Three.js) con carga diferida
prototipo/
  hero.html                 Primer prototipo del héroe (base del sistema de diseño)
  prompt-claude-design.md    Prompt usado en la fase de diseño
  Logito agencia.jpg.jpeg    Logotipo de la agencia
sistema-itinerarios/
  CONTEXTO.md               Diseño de la fase 2 (portal de itinerarios, aún sin construir)
contexto.md                 Brief del proyecto (marca, contenido, alcances)
.claude/launch.json         Configuración del servidor de previsualización
```

El HTML, los estilos y el comportamiento están separados en archivos distintos. Se optó
deliberadamente por **no** usar bundlers ni frameworks: para un sitio de este tamaño
añaden complejidad sin beneficio, y así el proyecto se abre y despliega sin ningún paso
de compilación.

## Detalles técnicos

- **Sin frameworks.** HTML, CSS y JavaScript estándar, para carga rápida y mantenimiento simple.
- **Tipografía:** Fraunces (titulares) + Plus Jakarta Sans (texto), vía Google Fonts.
- **Animación:** GSAP + ScrollTrigger y Lenis (scroll suave), cargados desde CDN. Títulos con
  revelado de máscara, imágenes con `clip-path`, y una ruta punteada animada con un avión de papel.
- **Avión 3D interactivo** (Three.js) en el cierre, construido por código y con **carga diferida**:
  la librería solo se descarga cuando el visitante se acerca a esa sección, para no penalizar la
  velocidad inicial.
- **Degradación segura:** si las librerías no cargan o el usuario prefiere movimiento reducido,
  el contenido se muestra completo y estático.
- **Responsivo**, con prioridad en la experiencia móvil.

## Pendientes

- Sustituir las fotografías de placeholder (Unsplash) por las reales de la agencia.
- Integrar el logotipo definitivo.
- Conectar las reseñas reales de Google.
- Pase de rendimiento (WebP, `preload`) antes de lanzar campañas de anuncios.
- Construir el portal de itinerarios (ver `sistema-itinerarios/CONTEXTO.md`).

---

Hecho con [Claude Code](https://claude.com/claude-code).
