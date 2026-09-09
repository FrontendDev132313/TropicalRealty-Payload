#!/usr/bin/env node
//
// Punto de entrada de `pnpm dev`.
//
// El contenedor donde vive el sitio ejecuta siempre `pnpm dev` y no expone
// ningun campo para cambiar el comando de arranque. Dejar ahi un `next dev`
// significaria servir produccion desde el servidor de desarrollo: compila en
// cada peticion, no prerenderiza nada y consume bastante mas memoria.
//
// La alternativa habitual —reapuntar el script `dev` a build+start— romperia el
// desarrollo local, asi que la decision se toma por entorno:
//
//   DEPLOY_TARGET=container   migraciones -> next build -> next start
//   (sin definir)             next dev
//
// Interruptores para el contenedor, todos opcionales:
//   SKIP_MIGRATE=1   no aplica migraciones al arrancar
//   REUSE_BUILD=1    reutiliza `.next` si ya hay un build hecho, en vez de
//                    recompilar en cada reinicio del contenedor
//
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bin = (name) => path.join(root, 'node_modules', '.bin', name)

/** Ejecuta un paso y aborta el arranque si falla, para no servir un build a medias. */
const run = (label, command, args) => {
  console.log(`\n[start] ${label}`)
  const { status, error } = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --no-deprecation`.trim() },
  })

  if (error) {
    console.error(`[start] no se pudo ejecutar "${label}":`, error.message)
    process.exit(1)
  }
  if (status !== 0) {
    console.error(`[start] "${label}" fallo con codigo ${status}`)
    process.exit(status ?? 1)
  }
}

if (process.env.DEPLOY_TARGET !== 'container') {
  // Maquina local: comportamiento de siempre.
  run('next dev', bin('next'), ['dev'])
  process.exit(0)
}

for (const key of ['DATABASE_URL', 'PAYLOAD_SECRET', 'NEXT_PUBLIC_SERVER_URL']) {
  if (!process.env[key]) {
    console.error(`[start] falta la variable ${key}. Definela en el panel del contenedor.`)
    process.exit(1)
  }
}

if (process.env.SKIP_MIGRATE === '1') {
  console.log('\n[start] SKIP_MIGRATE=1 — se omiten las migraciones')
} else {
  // Payload no hace push del esquema en produccion: aplica las migraciones de
  // src/migrations. Es idempotente, las ya aplicadas se saltan.
  run('payload migrate', bin('payload'), ['migrate'])
}

const alreadyBuilt = existsSync(path.join(root, '.next', 'BUILD_ID'))

if (process.env.REUSE_BUILD === '1' && alreadyBuilt) {
  console.log('\n[start] REUSE_BUILD=1 y existe .next/BUILD_ID — se omite el build')
} else {
  run('next build', bin('next'), ['build'])
}

run('next start', bin('next'), ['start'])
