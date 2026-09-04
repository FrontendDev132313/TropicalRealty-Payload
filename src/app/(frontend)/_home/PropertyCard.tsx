import { Bath, BedDouble, MapPin, Maximize } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/ui'
import { formatPrice, type Property } from './data'

export const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  return (
    <Link
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
      href="/propiedades"
    >
      <div className={cn('relative aspect-[4/3] bg-gradient-to-br', property.gradient)}>
        {property.tag && (
          <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground">
            {property.tag}
          </span>
        )}
        <span className="absolute right-4 top-4 rounded-full bg-foreground/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-background">
          {property.operation}
        </span>
      </div>

      <div className="p-5">
        <p className="text-lg font-semibold">{formatPrice(property)}</p>
        <h3 className="mt-1 text-base font-medium group-hover:underline">{property.title}</h3>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {property.location}
        </p>

        <ul className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <BedDouble className="size-4" />
            {property.beds} rec.
          </li>
          <li className="flex items-center gap-1.5">
            <Bath className="size-4" />
            {property.baths} baños
          </li>
          <li className="flex items-center gap-1.5">
            <Maximize className="size-4" />
            {property.area} m²
          </li>
        </ul>
      </div>
    </Link>
  )
}
