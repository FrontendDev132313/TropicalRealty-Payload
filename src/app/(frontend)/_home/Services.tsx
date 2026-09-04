import React from 'react'

import { services } from './data'

export const Services: React.FC = () => {
  return (
    <section className="border-y border-border bg-card">
      <div className="container py-20">
        <h2 className="max-w-2xl text-3xl font-semibold md:text-4xl">
          Comprar en la costa tiene reglas propias. Nosotros ya las conocemos.
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {services.map((service, index) => (
            <div key={service.title}>
              <span className="font-mono text-sm text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-xl font-medium">{service.title}</h3>
              <p className="mt-2 text-muted-foreground">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
