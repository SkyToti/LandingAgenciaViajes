# Puesta en producción

> **Estado al 2026-08-11: el sitio ESTÁ PUBLICADO y funcionando** en
> `https://viajaconkarla.com.mx`. Este documento pasa de ser un plan a ser el
> registro de cómo quedó y de lo que falta.

---

## 1. Dónde vive el sitio (y por qué acabó ahí)

**GitHub Pages**, sirviendo el contenido de `public/` desde la rama `main`.

El camino no fue directo y conviene dejarlo escrito para que nadie repita los
mismos intentos:

| Intento | Qué pasó |
|---|---|
| **Hostinger** | La clienta contrató el plan Premium, pero en modalidad de **prueba gratuita**, que solo da acceso al Creador de Sitios Web. Para subir archivos propios hay que pasar a un plan de pago. Se descartó por costo |
| **Netlify** | Funcionó y se desplegó bien, pero **suspendieron la cuenta** el mismo día, al poco de configurar el dominio. Probablemente un filtro automático anti-abuso |
| **GitHub Pages** | ✅ Es donde está ahora. Gratis, sin cuenta que puedan suspender, y el repositorio ya estaba conectado |

**Vercel** quedó descartado desde el principio: su plan gratuito prohíbe el uso
comercial, y esto es el negocio de una agencia.

### Cómo se publica

El workflow `.github/workflows/pages.yml` publica **el contenido de `public/`**
en cada `push` a `main`. No hay que hacer nada más: se sube el cambio y el sitio
se actualiza solo en un par de minutos.

```
viajaconkarla.com.mx/              → la landing        (public/index.html)
viajaconkarla.com.mx/admin/        → el panel de Karla (public/admin/)
viajaconkarla.com.mx/viaje/{token} → el itinerario     (public/viaje/)
```

### Las URL limpias en tres proveedores

El proyecto lleva **tres archivos de reescritura** que conviven sin estorbarse;
cada proveedor lee el suyo y los otros dos le resultan invisibles:

- `public/viaje/.htaccess` — para Apache (Hostinger), si algún día se vuelve allá.
- `public/_redirects` — para Netlify y Cloudflare Pages.
- `public/404.html` — **el que está en uso.** GitHub Pages no tiene reescritura,
  así que su página de error recupera el token de la dirección y reenvía a
  `/viaje/?v={token}`. Después, `viaje.js` restaura la dirección limpia en la
  barra del navegador.

---

## 2. Configuración del dominio

Dominio `viajaconkarla.com.mx`, registrado en Hostinger hasta 2029 con
renovación automática activada. Los **nameservers siguen en Hostinger**; solo se
cambiaron los registros:

| Tipo | Nombre | Valor |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `SkyToti.github.io` |

> ⚠️ **Las dos renovaciones automáticas están activadas** (hosting y dominio).
> Si la tarjeta caduca y el dominio se pierde, se pierden con él **todos los
> enlaces de itinerarios** que Karla haya mandado. Es el único gasto que no se
> puede dejar de pagar.

---

## 3. Configuración de Supabase

Ya aplicada:

- **Site URL** → `https://viajaconkarla.com.mx`
- **Redirect URLs** → `https://viajaconkarla.com.mx/**` y las de `localhost:4174`
  para poder seguir probando en local.
- **Registro público desactivado**, comprobado desde fuera.

---

## 4. Lo que FALTA

### 4.1 El SMTP propio — el pendiente de verdad

**Estado: sin resolver.** Se optó por invitar a Karla a la organización de
Supabase como Owner, lo que hace que los correos sí le lleguen. Eso resuelve la
entrega, pero **no el límite**: el servidor de correo de Supabase reparte
**2 correos por hora para todo el proyecto**, y ese número no se puede subir
sin un SMTP propio.

Las consecuencias prácticas, que Karla ya tiene anotadas en su guía:

- Si se equivoca al teclear su correo y reintenta, gastó los dos y se queda
  fuera **una hora**.
- Mientras no cierre sesión no necesita enlaces, pero las sesiones se pierden
  solas: al cambiar de dispositivo, al limpiar el navegador o con el tiempo.

**Cuando se decida resolverlo:** Resend o Brevo, cuenta gratuita, en
Authentication → Emails → SMTP Settings. Al configurarlo, el campo de
Rate Limits deja de estar bloqueado y se puede subir el límite.

### 4.2 El pausado del proyecto

Resuelto a medias con `.github/workflows/mantener-supabase-despierto.yml`, que
consulta la base a diario. **Su punto débil:** GitHub apaga las tareas
programadas si el repositorio pasa 60 días sin actividad. Si eso ocurre, a la
semana siguiente Supabase se pausa y **todos los enlaces dejan de abrir**.

Salidas: pasar Supabase a plan de pago, o duplicar esa llamada en un cron
externo (cron-job.org, gratuito) que no dependa del repositorio.

### 4.3 Limpieza pendiente

En la base quedan **cinco itinerarios de prueba** y un PDF en el bucket:

```sql
-- Borrar los de prueba (ejecutar en el SQL Editor de Supabase)
delete from public.itinerarios where token like 'PRUEBA%';
delete from public.itinerarios where token = 'AgOTa2GF-gYSbs7Tly4rfcWJ';
```

El PDF de ese último hay que borrarlo aparte, desde Storage →
`itinerarios/AgOTa2GF-gYSbs7Tly4rfcWJ/v2.pdf`.

### 4.4 Otros pendientes menores

- **Quitar la contraseña** de la cuenta `skytotifama123@gmail.com`: el panel
  entra por enlace mágico y esa contraseña solo es superficie de ataque.
- **Crear la cuenta de Karla** en Authentication → Users, sin contraseña.
- **Pegar la plantilla del correo** en español
  (`supabase/plantillas-correo/enlace-de-acceso.html`), con asunto
  `Tu acceso al panel · Tierra de Viajes`.
- **Apagar el workflow de GitHub Pages** si algún día el sitio se mueve a otro
  proveedor, para no acabar con dos versiones desincronizadas.

---

## 5. Verificado en producción

- Landing con los precios 2026 · `/admin/` responde · `/viaje/` responde
- **URL limpia funcionando**: `viajaconkarla.com.mx/viaje/{token}` abre el
  itinerario con los datos reales de Supabase
- HTTPS con certificado válido
- QR de impresión con la dirección correcta
- Evento de calendario creado en un iPhone real, del 13 de agosto al 18 de
  diciembre, con el 18 incluido
