import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

export const CallToAction: React.FC = () => {
  return (
    <section className="container py-20">
      <div className="flex flex-col items-start gap-6 rounded-lg border border-border bg-gradient-to-br from-teal-500/15 via-cyan-400/10 to-amber-300/15 p-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Agenda un recorrido, presencial o por video
          </h2>
          <p className="mt-2 text-muted-foreground">
            Un asesor te responde el mismo día con disponibilidad real y costos totales de cierre.
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/contacto">Solicitar recorrido</Link>
        </Button>
      </div>
    </section>
  )
}
