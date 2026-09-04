import type { Metadata } from 'next'
import React from 'react'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { CallToAction } from './_home/CallToAction'
import { FeaturedProperties } from './_home/FeaturedProperties'
import { Hero } from './_home/Hero'
import { Services } from './_home/Services'

/**
 * Homepage estática de marcador de posición.
 *
 * Sustituye al render por bloques del CMS: antes este archivo reexportaba
 * `./[slug]/page` y la home salía del documento `pages` con slug `home`.
 * Para volver a ese comportamiento basta con restaurar el reexport y borrar
 * la carpeta `_home`. El resto de rutas sigue resolviéndose desde Payload.
 */
export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturedProperties />
      <Services />
      <CallToAction />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Tropical Realty — Propiedades en el Caribe mexicano y Yucatán',
  description:
    'Casas, villas y departamentos verificados en Tulum, Playa del Carmen, Cancún, Mérida y Bacalar.',
  openGraph: mergeOpenGraph({
    title: 'Tropical Realty — Propiedades en el Caribe mexicano y Yucatán',
    description:
      'Casas, villas y departamentos verificados en Tulum, Playa del Carmen, Cancún, Mérida y Bacalar.',
    siteName: 'Tropical Realty',
  }),
}
