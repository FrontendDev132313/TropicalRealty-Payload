import { Search } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import { stats } from './data'

const destinations = ['Tulum', 'Playa del Carmen', 'Cancún', 'Mérida', 'Bacalar', 'Progreso']

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-cyan-400/10 to-amber-300/20"
      />

      <div className="container relative py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Caribe mexicano · Yucatán
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            Casas frente al mar, sin sorpresas en el camino.
          </h1>

          <p className="mt-6 text-lg text-muted-foreground">
            Tropical Realty selecciona, verifica y acompaña la compra de propiedades en la costa.
            Cada listado pasa por inspección física y revisión legal antes de llegar a esta página.
          </p>
        </div>

        {/* Formulario de búsqueda de marcador de posición: navega por GET, sin lógica todavía. */}
        <form
          action="/propiedades"
          className="mt-10 grid gap-3 rounded-lg border border-border bg-background/90 p-4 backdrop-blur sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto]"
          method="get"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Destino</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
              name="destino"
            >
              <option value="">Todos los destinos</option>
              {destinations.map((destination) => (
                <option key={destination} value={destination.toLowerCase()}>
                  {destination}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Operación</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
              name="operacion"
            >
              <option value="">Venta y renta</option>
              <option value="venta">Venta</option>
              <option value="renta">Renta</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Presupuesto máx.</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
              name="presupuesto"
            >
              <option value="">Sin límite</option>
              <option value="500000">Hasta $500,000 USD</option>
              <option value="1000000">Hasta $1,000,000 USD</option>
              <option value="2000000">Hasta $2,000,000 USD</option>
            </select>
          </label>

          <Button className="h-10 self-end" size="lg" type="submit">
            <Search />
            Buscar
          </Button>
        </form>

        <dl className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-3xl font-semibold">{stat.value}</dd>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </dl>

        <p className="mt-10 text-sm text-muted-foreground">
          ¿Ya sabes lo que buscas?{' '}
          <Link className="font-medium text-foreground underline" href="/contacto">
            Habla con un asesor
          </Link>
        </p>
      </div>
    </section>
  )
}
