# Tierra de Viajes by Fraveo — Landing page

**🔗 Demo en vivo: <https://skytoti.github.io/LandingAgenciaViajes/>**

Sitio web de marketing para la agencia **Tierra de Viajes by Fraveo** (Cuernavaca, Morelos),
enfocado en su servicio **Diseño de Viajes**: itinerarios a la medida de la asesora Karla,
especialista en Europa. El objetivo de la página es llevar al visitante a contactar por WhatsApp.

## Cómo verlo

Es un sitio estático. La forma más simple:

```bash
npx serve -l 4173 public
```

Y abrir <http://localhost:4173>.

## Estructura

Lo que se publica y lo que no está separado a propósito: **solo `public/` llega al
servidor**. La documentación del proyecto vive en el repositorio pero nunca se sirve.

```
public/                     ← LO ÚNICO QUE SE PUBLICA
  index.html                Estructura (HTML semántico)
  css/styles.css            Sistema de diseño, layout y animaciones
  js/main.js                Scroll suave (Lenis) y animaciones de scroll (GSAP)
  js/plane3d.js             Avión 3D (Three.js) con carga diferida
  img/                      Fotografías y emblema, optimizados
  .htaccess                 Cabeceras de seguridad, HTTPS y caché (solo Hostinger)

docs/                       ← documentación, NO se publica
  contexto.md               Brief del proyecto (marca, contenido, alcances)
  sistema-itinerarios/      Diseño del portal de itinerarios (fase 2)

prototipo/                  ← archivo histórico, NO se publica
.github/workflows/pages.yml Publica automáticamente public/ en GitHub Pages
.claude/launch.json         Configuración del servidor de previsualización
```

El HTML, los estilos y el comportamiento están separados en archivos distintos. Se optó
deliberadamente por **no** usar bundlers ni frameworks: para un sitio de este tamaño
añaden complejidad sin beneficio, y así el proyecto se abre y despliega sin ningún paso
de compilación.

## Despliegue

Cada `push` a `main` publica `public/` en GitHub Pages mediante el flujo de trabajo de
`.github/workflows/`. Para el hosting de producción se apunta la raíz del sitio
(`public_html`) a la carpeta `public/` del repositorio, de modo que la documentación
nunca se sube. El archivo `public/.htaccess` añade, como segunda línea de defensa,
el bloqueo de archivos que no deberían servirse jamás.

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

- Sustituir las fotografías de placeholder restantes (héroe, Toscana y corte central)
  por fotografías reales de la agencia. La de la asesora y la de Roma ya son definitivas.
- Conectar las reseñas reales de Google.
- Pase de rendimiento (WebP, `preload`) antes de lanzar campañas de anuncios.
- Construir el portal de itinerarios (ver `docs/sistema-itinerarios/`).

---

Hecho con [Claude Code](https://claude.com/claude-code).
