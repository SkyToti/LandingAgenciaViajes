# Puesta en producción

> Todo lo que cambia el día que esto deja de vivir en `localhost:4174`.
> Escrito el 2026-08-05, cuando el hosting todavía no estaba contratado.

---

## 1. Dónde se publica (decidido, no hay que volver a pensarlo)

**Hostinger, plan Single, un solo dominio, un solo sitio.**

No son dos proyectos. La landing y el portal son **la misma carpeta**:

```
tudominio.com/            → la landing        (public/index.html)
tudominio.com/admin/      → el panel de Karla (public/admin/)
tudominio.com/viaje/{token} → el itinerario   (public/viaje/)
```

Se publica subiendo **el contenido de `public/`** a `public_html/`. Nada más: `docs/`,
`supabase/` y el resto del repositorio no se suben.

### Por qué no Vercel

- El plan **Hobby prohíbe el uso comercial**, y esto es el negocio de una agencia.
- El plan Pro cuesta unos 20 USD al mes, cuando Hostinger ya está contratado y sirve
  archivos estáticos perfectamente.
- Hostinger corre **Apache**, que es lo que hace funcionar el `.htaccess` de las URLs
  limpias. Vercel necesitaría otra configuración distinta.

### Por qué un solo sitio y no dos

- Un pago, un dominio, un certificado.
- El enlace que llega por WhatsApp lleva **la marca de la agencia**:
  `tierradeviajes.com/viaje/xY7k…` genera confianza. Un subdominio raro o un dominio
  distinto, no.
- Menos piezas que mantener y menos cosas que se pueden desincronizar.

---

## 2. Qué cambia exactamente

### En el código: casi nada, y a propósito

| Cosa | Cómo está resuelto |
|---|---|
| URL de los itinerarios | El código detecta `localhost` y usa `?v=token`; en el dominio real usa `/viaje/token`. **No hay que tocar nada** |
| Enlace de vuelta del correo | Se construye con `location.origin`, así que apunta solo al dominio correcto |
| Claves de Supabase | Las mismas. Son públicas por diseño y no dependen del dominio |

La única línea que mira el entorno está en `viaje.js` y en `panel.js`, y ya está escrita.

### En Supabase: cuatro cosas

1. **Site URL** → `https://tudominio.com`
   (hoy sigue en `http://localhost:3000`, que es el valor de fábrica).
2. **Redirect URLs** → añadir `https://tudominio.com/**`.
   El `/**` no es opcional: el enlace del correo vuelve a `/admin/`, no a la raíz.
3. **SMTP propio** → Authentication → Emails → SMTP Settings.
   **Sin esto Karla no puede entrar.** Ver §4.
4. **Plantilla del correo** → pegar `supabase/plantillas-correo/enlace-de-acceso.html`
   con el asunto `Tu acceso al panel · Tierra de Viajes`.

### En el hosting

- **SSL activado** antes de mandar ningún enlace. Sin HTTPS el navegador marca el sitio
  como no seguro, y esto lo abre gente que acaba de pagar un viaje caro.
- **Subir los archivos ocultos.** `public/viaje/.htaccess` empieza con punto y muchos
  clientes de FTP no lo muestran por defecto. Si no sube, las URLs limpias dan 404 y
  parece que el sistema está roto.

---

## 3. Checklist de lanzamiento

Ordenado: cada punto asume que el anterior está hecho.

### Antes de subir nada

- [ ] Terminar los pasos 4, 6 y 7 del plan (lista, calendario y pulido).
- [ ] Borrar los itinerarios de prueba de la base:
      `PRUEBA_local_no_borrar_1`, `PRUEBA_caducado_no_borrar1`, `PRUEBA_revocado_no_borrar1`
      y el de "Francia completo", junto con sus PDFs del bucket.
- [ ] Comprobar que el repositorio no tiene PDFs de clientes reales ni claves de servicio.

### Configurar Supabase para producción

- [ ] Contratar el SMTP (§4) y probarlo mandándose un enlace a un correo cualquiera.
- [ ] Site URL y Redirect URLs con el dominio real.
- [ ] Pegar la plantilla del correo en español.
- [ ] Crear la cuenta de Karla con **su** correo, **sin contraseña**, marcando
      *Auto Confirm User*.
- [ ] Borrar la cuenta de pruebas (`skytotifama123@gmail.com`) o dejarla como respaldo,
      pero quitándole la contraseña.

### Subir el sitio

- [ ] Subir el contenido de `public/` a `public_html/`.
- [ ] Verificar que `.htaccess` llegó a `public_html/viaje/`.
- [ ] Activar el SSL gratuito y forzar HTTPS.

### Probar en producción, en este orden

- [ ] Abrir `tudominio.com` → la landing carga igual que siempre.
- [ ] Abrir `tudominio.com/admin/` → pide el correo.
- [ ] Pedir el enlace mágico → **llega** (esto prueba el SMTP) y entra.
- [ ] Crear un itinerario de prueba con un PDF cualquiera.
- [ ] Abrir el enlace **con la URL limpia**, sin `?v=`. Si da 404, el `.htaccess` no subió.
- [ ] Abrirlo **en un iPhone real y en un Android real**. No vale el simulador: el fallo
      del PDF incrustado en Safari solo aparece en un iPhone de verdad.
- [ ] Descargar el PDF y comprobar que llega como `Itinerario - {título}.pdf`.
- [ ] Imprimir y escanear el QR con la cámara del teléfono: tiene que volver a la página.
- [ ] Pegar el enlace en un chat de WhatsApp propio y mirar la vista previa: debe decir
      *"Tu itinerario · Tierra de Viajes"*, **nunca** el nombre del cliente.
- [ ] Borrar el itinerario de prueba.

### Entregar

- [ ] Enseñarle el panel a Karla con un itinerario real, de principio a fin.
- [ ] Dejarle escrito cómo entrar (el correo del enlace mágico) y a quién escribirle si
      algo falla.

---

## 4. El SMTP: lo único que puede arruinar el lanzamiento

Es el punto más traicionero de todo el proyecto porque **no da error hasta el día de la
entrega**. Todo funciona en local, todo funciona en producción, y el enlace de acceso
de Karla simplemente no llega nunca.

**La causa:** el servicio de correo que trae Supabase solo entrega a direcciones que son
miembros de la organización de Supabase. Karla no lo es ni tiene por qué serlo.

**La solución:** configurar un SMTP propio en Authentication → Emails → SMTP Settings.
Sirve cualquiera de estos, y el plan gratuito de todos sobra —los únicos correos que
manda el sistema son los accesos de Karla, unos pocos al mes; los clientes reciben su
enlace por WhatsApp, no por correo—:

| Proveedor | Nota |
|---|---|
| **Resend** | El más simple de configurar con Supabase. Pide verificar el dominio |
| **Brevo** | Permite verificar un remitente suelto sin dominio propio. Útil si el dominio tarda |
| SendGrid · AWS SES · ZeptoMail | También funcionan; más pasos de configuración |

**Cuándo hacerlo:** cuando el dominio esté contratado, porque el remitente ideal es algo
como `hola@tudominio.com`. Un gmail como remitente funciona pero se ve menos serio y
tiene más probabilidades de caer en spam.

---

## 5. Qué NO cambia

Para tranquilidad, porque la lista de arriba se ve larga:

- **El código de las páginas.** Ni una línea.
- **Las claves de Supabase.** Las mismas en local y en producción.
- **El esquema de la base ni el bucket.** Ya están como tienen que estar.
- **Los enlaces ya generados** seguirían funcionando si se hubieran creado con el
  dominio real. Los de `localhost` no, evidentemente — son de pruebas.

---

## 6. Después de lanzar

- **Al actualizar archivos**, el navegador puede seguir sirviendo la versión vieja de
  CSS o JS desde su caché. Si un cambio "no se ve", esa suele ser la causa.
- **Vigilar el plan gratuito de Supabase**: 500 MB de base y 1 GB de almacenamiento.
  Con PDFs de ~10 MB y pocos itinerarios al mes hay margen para años, pero conviene
  mirarlo una vez al año.
- **Los enlaces caducan** a los 3 meses del viaje. El botón de reactivar (Paso 4) tiene
  que estar construido y probado antes de entregar, o Karla se quedará sin poder
  ayudar a un cliente que vuelva meses después.
