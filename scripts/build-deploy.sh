#!/usr/bin/env bash
#
# Genera el artefacto que se sube al hosting de GoDaddy (cPanel > Setup Node.js
# App, que corre Phusion Passenger). Se ejecuta en la maquina de desarrollo: el
# plan compartido no tiene memoria ni CPU para un `next build`.
#
#   ./scripts/build-deploy.sh
#
# Resultado: deploy/dist/tropicalrealty.tar.gz  (~55 MB, ~1.900 ficheros)

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"
BUNDLE="$ROOT/.next/standalone"
OUT="$ROOT/deploy/dist"

log() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

# --- 1. Entorno de produccion -------------------------------------------------
# Ojo: NEXT_PUBLIC_SERVER_URL se incrusta en el bundle del navegador durante el
# build, no se lee en runtime. Si aqui apunta a localhost, el sitio publicado
# generara enlaces, canonicals y URLs de imagen apuntando a localhost.

if [ ! -f "$ROOT/.env.production" ]; then
  echo "ERROR: falta .env.production en la raiz (copia .env.production.example)." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. "$ROOT/.env.production"
set +a

for var in DATABASE_URL PAYLOAD_SECRET NEXT_PUBLIC_SERVER_URL; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: $var no esta definida en .env.production." >&2
    exit 1
  fi
done

case "$NEXT_PUBLIC_SERVER_URL" in
  *localhost*|*127.0.0.1*)
    echo "ERROR: NEXT_PUBLIC_SERVER_URL apunta a localhost ($NEXT_PUBLIC_SERVER_URL)." >&2
    echo "       Tiene que ser el dominio publico; se congela dentro del build." >&2
    exit 1
    ;;
esac

log "Build de produccion contra $NEXT_PUBLIC_SERVER_URL"
rm -rf "$ROOT/.next" "$OUT"
pnpm build

# --- 2. Assets que `standalone` no copia --------------------------------------
# Documentado en next.config.js/output: server.js los sirve si estan colocados,
# pero el build no los mueve porque asume un CDN delante.

log "Copiando public/ y .next/static al bundle"
cp -R "$ROOT/public" "$BUNDLE/public"
cp -R "$ROOT/.next/static" "$BUNDLE/.next/static"
# Los uploads de produccion viven en MEDIA_DIR, fuera del arbol desplegado.
rm -rf "$BUNDLE/public/media"

# --- 3. sharp para Linux x64 --------------------------------------------------
# El artefacto se compila en macOS/arm64 pero corre en Linux/x64. pnpm trae los
# binarios de las dos plataformas (ver supportedArchitectures en
# pnpm-workspace.yaml) y el file tracing de Next los empaqueta, pero NO baja
# @img/sharp-libvips-linux-x64, contra el que sharp-linux-x64.node enlaza
# dinamicamente. El RPATH del binario es $ORIGIN/../../sharp-libvips-linux-x64,
# asi que la carpeta tiene que quedar hermana de sharp-linux-x64.

log "Completando sharp para Linux x64"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

found_sharp=0
for pkg in "$BUNDLE"/node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64; do
  [ -d "$pkg" ] || continue
  found_sharp=1
  vips_ver="$(node -p "require('$pkg/package.json').optionalDependencies['@img/sharp-libvips-linux-x64']")"
  dest="$(dirname "$pkg")/sharp-libvips-linux-x64"
  [ -d "$dest" ] && continue

  rm -rf "$TMP/pack" && mkdir -p "$TMP/pack"
  tgz="$(cd "$TMP/pack" && npm pack "@img/sharp-libvips-linux-x64@$vips_ver" --silent)"
  tar xzf "$TMP/pack/$tgz" -C "$TMP/pack"
  mv "$TMP/pack/package" "$dest"
  echo "    + libvips $vips_ver -> ${dest#$BUNDLE/}"
done

if [ "$found_sharp" -eq 0 ]; then
  echo "ERROR: el bundle no contiene @img/sharp-linux-x64." >&2
  echo "       Revisa supportedArchitectures en pnpm-workspace.yaml y reinstala." >&2
  exit 1
fi

# Fuera las plataformas que no son la del servidor (~40 MB de libvips de macOS)
# y los symlinks que quedan colgando al quitarlas.
find "$BUNDLE/node_modules/.pnpm" -maxdepth 1 -type d \
  \( -name '@img+*darwin*' -o -name '@img+*musl*' -o -name '@img+*linux-arm*' \) \
  -exec rm -rf {} +
find "$BUNDLE/node_modules" -type l ! -exec test -e {} \; -exec rm -f {} +

# --- 4. Higiene del bundle ----------------------------------------------------
# Next copia el .env de desarrollo dentro de standalone: fuera. El .env de
# produccion se crea a mano en el servidor y no viaja en el artefacto.
rm -f "$BUNDLE/.env" "$BUNDLE"/.env.*

# El package.json que copia Next es el del repo, con devDependencies y scripts.
# Si alguien pulsa "Run NPM Install" en cPanel, intentaria instalar todo el arbol
# y reventaria el limite de inodos. Este lo deja en no-op, conservando
# "type": "module", que server.js necesita para cargarse como ESM.
cat > "$BUNDLE/package.json" <<'JSON'
{
  "name": "tropicalrealty",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=20.9.0"
  }
}
JSON

cp "$ROOT/deploy/app.cjs" "$BUNDLE/app.cjs"

# --- 5. Empaquetado -----------------------------------------------------------
# tar preserva los symlinks del layout de pnpm; un zip hecho desde Finder no
# siempre lo hace, y el bundle deja de resolver sus dependencias.

log "Empaquetando"
mkdir -p "$OUT"
tar czf "$OUT/tropicalrealty.tar.gz" -C "$BUNDLE" .

printf '\n  artefacto : %s\n' "$OUT/tropicalrealty.tar.gz"
printf '  tamano    : %s\n' "$(du -h "$OUT/tropicalrealty.tar.gz" | cut -f1)"
printf '  ficheros  : %s\n' "$(find "$BUNDLE" -type f | wc -l | tr -d ' ')"
printf '  dominio   : %s\n\n' "$NEXT_PUBLIC_SERVER_URL"
echo "  Siguiente paso: DEPLOY.md, seccion 4."
