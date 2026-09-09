# Despliegue en GoDaddy (cPanel · Setup Node.js App)

Esta app **no es un sitio estatico**: es Payload 3 sobre Next 16, necesita un
proceso Node vivo, PostgreSQL y un directorio con permisos de escritura para los
uploads. En GoDaddy eso se monta con **Setup Node.js App** (Phusion Passenger),
disponible en los planes Linux con cPanel.

El reparto de trabajo es: **se compila en local, el servidor solo ejecuta**. El
plan compartido no tiene memoria ni CPU para un `next build`, y un
`node_modules` completo de Payload + Next supera el limite de inodos del plan.
El artefacto que se sube es el bundle `standalone` de Next: ~55 MB comprimido,
~1.900 ficheros, sin necesidad de instalar dependencias en el servidor.

---

## 0. Verificaciones bloqueantes

Antes de nada, en cPanel → **Setup Node.js App** → *Create Application*:

1. **Version de Node ≥ 20.9.** Es el minimo de Next 16.3.3 (`engines` del
   paquete). Si el desplegable solo ofrece 18 o menos, este plan no sirve y hay
   que subir a VPS: no hay forma de sortearlo sin bajar de version Next y
   Payload.
2. **Salida TCP hacia la base de datos.** La base vive fuera (Neon/Supabase) y
   el hosting compartido a veces bloquea la salida a puertos no estandar. Con
   acceso SSH:

   ```bash
   curl -sv telnet://<host-de-la-base>:5432 --max-time 8
   ```

   Si conecta, adelante. Si no, la alternativa es Neon sobre HTTPS (puerto 443)
   cambiando a `@payloadcms/db-vercel-postgres`, que habla con Neon por
   WebSocket en vez de TCP directo. Es un cambio de adaptador en
   `src/payload.config.ts`, no de esquema.

---

## 1. Base de datos

Crear un proyecto Postgres en [Neon](https://neon.tech) o
[Supabase](https://supabase.com) y copiar la cadena de conexion. En los dos
casos hay que conservar `?sslmode=require`.

**Con Neon** (recomendado para este montaje): usar la cadena **pooled**. Neon
resuelve por IPv4 sin configuracion extra y reactiva el proyecto suspendido en
~500 ms de forma automatica.

**Con Supabase**, dos detalles que no son opcionales en hosting compartido:

- Usar la cadena del **Shared Pooler en session mode** —
  `aws-<region>.pooler.supabase.com:5432`, usuario `postgres.<project-ref>`— y
  **no** la conexion directa `db.<project-ref>.supabase.co:5432`. La directa
  resuelve solo por IPv6 desde enero de 2024, y el add-on de IPv4 exige plan
  Pro. El pooler compartido es IPv4 en todos los planes, free incluido.
- **No usar transaction mode (puerto 6543)**: no soporta prepared statements y
  Payload los usa a traves de drizzle/node-postgres. Session mode si.

Ademas, los proyectos free de Supabase se **pausan tras 7 dias sin actividad de
base de datos** y hay que despausarlos a mano desde el dashboard. Para un sitio
publicado con trafico no suele ocurrir; si el sitio va a estar tranquilo al
principio, un cron diario de cPanel contra cualquier URL mantiene el proyecto
despierto.

## 2. Entorno de build

```bash
cp .env.production.example .env.production
openssl rand -hex 32   # PAYLOAD_SECRET
openssl rand -hex 32   # CRON_SECRET
openssl rand -hex 32   # PREVIEW_SECRET
```

`NEXT_PUBLIC_SERVER_URL` debe ser el dominio publico final, **sin barra final**.
Se congela dentro del bundle del navegador durante el build: si esta mal, hay
que recompilar entera la app, no basta con corregir el `.env` del servidor.

## 3. Migraciones

La base local se creo con el `push` automatico del modo desarrollo. En
produccion Payload no hace push: aplica migraciones. La inicial ya esta en
`src/migrations/`.

```bash
set -a && . ./.env.production && set +a
pnpm payload migrate
```

Esto crea todo el esquema en la base remota. Cada cambio posterior de colecciones
o campos necesita `pnpm payload migrate:create <nombre>` y volver a correr
`pnpm payload migrate` antes de desplegar.

## 4. Artefacto

```bash
pnpm deploy:build
```

Deja `deploy/dist/tropicalrealty.tar.gz`. El script comprueba el entorno,
compila, copia `public/` y `.next/static` dentro del bundle, completa los
binarios de `sharp` para Linux x64, elimina el `.env` de desarrollo que Next
copia dentro y empaqueta con `tar` (que preserva los symlinks del layout de
pnpm; un zip hecho desde Finder puede romperlos).

## 5. Crear la aplicacion en cPanel

1. **Setup Node.js App → Create Application**
   - Node.js version: la mas alta disponible ≥ 20.9
   - Application mode: `Production`
   - Application root: `tropicalrealty`
   - Application URL: el dominio
   - Application startup file: **`app.cjs`**

   El startup file es `app.cjs` y no `server.js` a proposito: Passenger carga el
   fichero de arranque con `require()`, y el `server.js` que genera Next es ESM.
   `app.cjs` es el puente de una linea.

2. Subir `tropicalrealty.tar.gz` a `~/tropicalrealty` (File Manager o SFTP) y
   extraerlo ahi mismo. Al terminar, en la raiz de la app deben verse
   `app.cjs`, `server.js`, `.next/`, `public/` y `node_modules/`.

3. Crear el directorio de uploads **fuera** de la app, para que sobreviva a cada
   redespliegue:

   ```bash
   mkdir -p ~/tropicalrealty-media
   ```

4. Crear `~/tropicalrealty/.env` con el entorno de runtime:

   ```ini
   DATABASE_URL=postgresql://...?sslmode=require
   PAYLOAD_SECRET=...
   NEXT_PUBLIC_SERVER_URL=https://tudominio.com
   CRON_SECRET=...
   PREVIEW_SECRET=...
   MEDIA_DIR=/home/USUARIO/tropicalrealty-media
   ```

   `MEDIA_DIR` tiene que ser **ruta absoluta**. Sustituye `USUARIO` por el
   usuario real de cPanel (`echo $HOME` por SSH).

5. **Restart** en el panel de la aplicacion.

## 6. Primer acceso

Entrar a `https://tudominio.com/admin` y crear el primer usuario. Payload lo
permite mientras la coleccion `users` este vacia.

## 7. Redespliegues

```bash
pnpm deploy:build
```

Subir, extraer sobre `~/tropicalrealty` y pulsar **Restart**. El `.env` y
`~/tropicalrealty-media` no viajan en el artefacto, asi que no se pisan.

---

## Diagnostico

**La app no arranca / "We're sorry, but something went wrong"**
Passenger escribe el error en `~/logs/` o en el `stderr.log` de la app. El fallo
tipico en el primer arranque es `ERR_REQUIRE_ESM`: significa que el startup file
quedo apuntando a `server.js` en vez de `app.cjs`.

**Las imagenes no se procesan al subirlas**
Es `sharp` no encontrando `libvips`. Confirmar que existe
`node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/lib/`
en el servidor; si falta, el paso 3 de `build-deploy.sh` no corrio o el zip
perdio los symlinks al extraer.

**Timeout al conectar a la base**
Salida TCP bloqueada: volver a la verificacion 0.2.

**Enlaces o imagenes apuntando a localhost**
`NEXT_PUBLIC_SERVER_URL` estaba mal en el momento del build. Corregir
`.env.production` y recompilar; cambiar el `.env` del servidor no lo arregla.

**Los archivos subidos desaparecen tras un redespliegue**
`MEDIA_DIR` no estaba definida y Payload escribio dentro del arbol de la app.
