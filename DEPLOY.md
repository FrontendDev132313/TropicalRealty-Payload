# Despliegue

Esta app no es un sitio estatico: es Payload 3 sobre Next 16, necesita un proceso
Node vivo, PostgreSQL y un sitio donde guardar los uploads.

Hay dos caminos posibles en GoDaddy y **el vigente es el primero**:

1. **Contenedor** (el que estas usando) — GoDaddy ejecuta `pnpm dev` dentro de un
   contenedor Node con `node_modules` completo. Se compila alli mismo.
2. **cPanel / Setup Node.js App** (Passenger) — se compila en local y se sube un
   bundle `standalone`. Documentado en el anexo del final, por si algun dia hace
   falta.

---

# 1. Contenedor

## Como arranca

El panel del contenedor ejecuta siempre `pnpm dev` y no ofrece un campo para
cambiar el comando. Por eso el script `dev` **no** es `next dev`, sino
`node scripts/start.mjs`, que decide segun el entorno:

| Entorno | Que hace |
|---|---|
| `DEPLOY_TARGET=container` | `payload migrate` → `next build` → `next start` |
| Sin esa variable (tu Mac) | `next dev`, exactamente como antes |

Asi el contenedor sirve un build de produccion y tu flujo local no cambia.

## Pasos

### 1. Base de datos

Proyecto Postgres en [Supabase](https://supabase.com). Copiar la cadena del
**Session pooler** (Dashboard → Connect → Session pooler), no la conexion
directa:

- La directa (`db.<ref>.supabase.co:5432`) solo publica registro AAAA, es decir
  **solo IPv6**. Desde una red sin IPv6 enrutable falla con `ENOTFOUND` y tumba
  el build, que necesita la base para prerenderizar.
- El pooler es IPv4 en todos los planes, free incluido.
- Puerto **5432** (session mode), **no 6543**: transaction mode no soporta
  prepared statements y Payload los usa a traves de drizzle.

Conservar `?sslmode=require`.

Los proyectos free se pausan tras 7 dias sin actividad de base de datos y hay
que despausarlos a mano desde el dashboard.

### 2. Bucket de uploads

El disco del contenedor es efimero: lo que se sube al admin desaparece en el
siguiente redespliegue. Por eso los uploads van a Supabase Storage.

1. Dashboard → Storage → crear un bucket llamado `media`.
2. Dashboard → Storage → **S3 Access Keys** → generar una clave. Da un
   `access key id` y un `secret`. **No** son la anon key ni la service_role key.
3. Anotar la region del proyecto y el endpoint
   `https://<ref>.supabase.co/storage/v1/s3`.

El cableado esta en `src/plugins/index.ts` y se activa solo si `S3_BUCKET` esta
definida. Sin esa variable, Payload escribe en `public/media` como siempre — que
es lo que quieres en local.

### 3. Variables en el panel

Dar de alta todas las de `.env.container.example`.

> **El error que ya te costo una tarde:** en el editor del panel, el nombre va en
> el campo *nombre* y el valor en el campo *valor*. Si pegas la linea entera
> `NEXT_PUBLIC_SERVER_URL=https://...` en el campo del valor, el valor acaba
> conteniendo la clave y el arranque muere con `TypeError: Invalid URL`.
> `next.config.ts` ahora detecta ese caso y lo dice con nombres y apellidos en
> vez del error cripto de Next.

`NEXT_PUBLIC_SERVER_URL` se congela dentro del bundle del navegador durante el
build. Si esta mal, no basta con corregir la variable: hay que reconstruir.

### 4. Arrancar

Reiniciar el contenedor. En el log deberias ver, en este orden:

```
[start] payload migrate
[start] next build
[start] next start
```

El primer arranque tarda: compila la app entera. Los siguientes tambien, salvo
que definas `REUSE_BUILD=1`.

### 5. Primer acceso

Entrar a `https://tudominio.com/admin` y crear el primer usuario. Payload lo
permite mientras la coleccion `users` este vacia.

## Redespliegues

Subir el codigo y reiniciar. Las migraciones se aplican solas al arrancar (son
idempotentes: las ya aplicadas se saltan).

Cada cambio de colecciones o campos necesita generar la migracion **en local**
antes de desplegar:

```bash
pnpm payload migrate:create <nombre>
```

`REUSE_BUILD=1` ahorra el build en cada reinicio, pero hay que quitarla cuando
despliegues codigo nuevo o cambies `NEXT_PUBLIC_SERVER_URL` — si no, el
contenedor seguira sirviendo el build viejo.

## Diagnostico

**`TypeError: Invalid URL` al cargar next.config**
El valor de `NEXT_PUBLIC_SERVER_URL` contiene el nombre de la variable. Ver el
aviso del paso 3.

**`cannot connect to Postgres` / `ENOTFOUND db.<ref>.supabase.co`**
Estas usando la conexion directa, que es IPv6. Cambiar al Session pooler.

**El build se queda sin memoria**
Definir `NODE_OPTIONS=--max-old-space-size=2048`. Si aun asi no cabe, hay que
compilar fuera del contenedor y volver al camino de cPanel.

**Las imagenes desaparecen tras un redespliegue**
`S3_BUCKET` no estaba definida, asi que Payload escribio en el disco efimero.

**Las imagenes no se procesan al subirlas**
`sharp` no encuentra `libvips`. En el contenedor se instala nativo para Linux,
asi que suele ser un `pnpm install` incompleto.

**Enlaces o imagenes apuntando a localhost**
`NEXT_PUBLIC_SERVER_URL` estaba mal en el momento del build. Corregirla y
reconstruir (reiniciar sin `REUSE_BUILD`).

---

# Anexo: cPanel / Setup Node.js App (Passenger)

Camino alternativo, **actualmente desactivado**. Se compila en local y el
servidor solo ejecuta: el plan compartido no tiene memoria para un `next build`,
y un `node_modules` completo de Payload + Next supera el limite de inodos.

Las piezas siguen en el repo: `scripts/build-deploy.sh`, `deploy/app.cjs`,
`output: 'standalone'` en `next.config.ts` y `.env.production.example`.

**Para reactivarlo hay que restaurar `supportedArchitectures` en
`pnpm-workspace.yaml`** y reinstalar:

```yaml
supportedArchitectures:
  os: [current, linux]
  cpu: [current, x64]
  libc: [current, glibc]
```

Se quito porque obliga a descargar los binarios de las cuatro plataformas
(`@next/swc` ×5, lightningcss, esbuild, sharp/libvips): cientos de MB que en el
contenedor no sirven para nada, porque alli se compila sobre Linux nativo.
`build-deploy.sh` aborta con un mensaje claro si faltan.

Resumen del procedimiento:

1. Verificar en *Setup Node.js App* que hay Node ≥ 20.9 y salida TCP al 5432.
2. `cp .env.production.example .env.production` y rellenarlo.
3. `pnpm payload migrate` contra la base remota.
4. `pnpm deploy:build` → `deploy/dist/tropicalrealty.tar.gz`.
5. Crear la app con **Application startup file: `app.cjs`** (no `server.js`:
   Passenger carga el arranque con `require()` y el `server.js` de Next es ESM).
6. Extraer el tar en `~/tropicalrealty`, crear `~/tropicalrealty-media`, escribir
   el `.env` de runtime con `MEDIA_DIR` en ruta absoluta y pulsar **Restart**.
