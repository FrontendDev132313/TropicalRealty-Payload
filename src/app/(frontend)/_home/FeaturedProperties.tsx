import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { featuredProperties } from './data'
import { PropertyCard } from './PropertyCard'

export const FeaturedProperties: React.FC = () => {
  return (
    <section className="container py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold md:text-4xl">Propiedades destacadas</h2>
          <p className="mt-3 text-muted-foreground">
            Una muestra de la cartera activa. Actualizamos disponibilidad y precios cada semana.
          </p>
        </div>

        <Link
          className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4"
          href="/propiedades"
        >
          Ver catálogo completo
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featuredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  )
}
