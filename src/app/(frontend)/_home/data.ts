/**
 * Datos de marcador de posición para la homepage estática.
 * Todo esto se reemplaza cuando exista la colección `properties` en Payload.
 */

export type Property = {
  id: string
  title: string
  location: string
  price: number
  currency: 'USD'
  operation: 'venta' | 'renta'
  beds: number
  baths: number
  area: number
  tag?: string
  /** Placeholder visual mientras no hay imágenes reales cargadas. */
  gradient: string
}

export const featuredProperties: Property[] = [
  {
    id: 'villa-palmar',
    title: 'Villa Palmar',
    location: 'Tulum, Quintana Roo',
    price: 1250000,
    currency: 'USD',
    operation: 'venta',
    beds: 4,
    baths: 4,
    area: 320,
    tag: 'Frente al mar',
    gradient: 'from-teal-400 via-emerald-500 to-cyan-700',
  },
  {
    id: 'casa-arrecife',
    title: 'Casa Arrecife',
    location: 'Playa del Carmen, Quintana Roo',
    price: 685000,
    currency: 'USD',
    operation: 'venta',
    beds: 3,
    baths: 3,
    area: 210,
    tag: 'Nuevo',
    gradient: 'from-sky-400 via-cyan-500 to-blue-700',
  },
  {
    id: 'penthouse-coral',
    title: 'Penthouse Coral',
    location: 'Cancún, Quintana Roo',
    price: 940000,
    currency: 'USD',
    operation: 'venta',
    beds: 3,
    baths: 3,
    area: 245,
    gradient: 'from-amber-300 via-orange-400 to-rose-600',
  },
  {
    id: 'residencia-ceiba',
    title: 'Residencia Ceiba',
    location: 'Mérida, Yucatán',
    price: 4200,
    currency: 'USD',
    operation: 'renta',
    beds: 4,
    baths: 3,
    area: 280,
    tag: 'Renta amueblada',
    gradient: 'from-lime-300 via-emerald-400 to-teal-700',
  },
  {
    id: 'loft-manglar',
    title: 'Loft Manglar',
    location: 'Bacalar, Quintana Roo',
    price: 315000,
    currency: 'USD',
    operation: 'venta',
    beds: 2,
    baths: 2,
    area: 120,
    gradient: 'from-cyan-300 via-teal-500 to-emerald-800',
  },
  {
    id: 'hacienda-sisal',
    title: 'Hacienda Sisal',
    location: 'Progreso, Yucatán',
    price: 1580000,
    currency: 'USD',
    operation: 'venta',
    beds: 6,
    baths: 5,
    area: 540,
    tag: 'Exclusiva',
    gradient: 'from-orange-300 via-amber-500 to-yellow-700',
  },
]

export const stats = [
  { value: '480+', label: 'Propiedades en cartera' },
  { value: '18', label: 'Destinos en el Caribe y Golfo' },
  { value: '12 años', label: 'Operando en la región' },
  { value: '96%', label: 'Clientes que recomiendan' },
]

export const services = [
  {
    title: 'Curaduría local',
    description:
      'Visitamos y verificamos cada propiedad antes de listarla. Nada entra al catálogo sin inspección física.',
  },
  {
    title: 'Acompañamiento legal',
    description:
      'Fideicomiso, escrituración y permisos de zona federal gestionados por nuestro equipo notarial aliado.',
  },
  {
    title: 'Rentabilidad medida',
    description:
      'Proyección de ocupación y retorno con datos reales del destino, no promedios genéricos del mercado.',
  },
]

const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const formatPrice = (property: Property): string => {
  const amount = priceFormatter.format(property.price)

  return property.operation === 'renta' ? `${amount} / mes` : amount
}
