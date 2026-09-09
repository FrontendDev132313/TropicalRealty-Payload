import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const rawServerURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000')

// Se valida aqui, y no donde se usa, porque este es el primer sitio que la lee:
// `next.config.ts` se carga antes que nada, asi que un valor malformado se
// detecta antes de compilar. Sin esto, el fallo aparece varias capas mas abajo
// como `TypeError: Invalid URL` desde `remotePatterns`, sin decir que variable
// lo provoco. El caso real: pegar la linea entera `NEXT_PUBLIC_SERVER_URL=https://...`
// en el campo del *valor* del panel del hosting deja la clave dentro del valor.
const NEXT_PUBLIC_SERVER_URL = (() => {
  try {
    new URL(rawServerURL)
    return rawServerURL
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SERVER_URL no es una URL valida: ${JSON.stringify(rawServerURL)}\n` +
        `Se espera solo el valor, p.ej. https://tropicalrealty.com.mx — sin el nombre ` +
        `de la variable delante, sin comillas y sin barra final.`,
    )
  }
})()

const nextConfig: NextConfig = {
  // Passenger (cPanel) arranca un unico proceso Node sin `node_modules` completo:
  // `standalone` emite `.next/standalone/server.js` con solo lo que se usa en runtime.
  output: 'standalone',
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
