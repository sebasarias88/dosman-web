/**
 * Business information for the demo.
 * Everything marked `demo: true` is placeholder content and must be replaced
 * with the real data before going live.
 */
export const store = {
  name: 'Dosman',
  tagline: 'Cholao & Coffee',
  legalName: 'Dosman · Cholao & Coffee',
  branch: 'Sede principal',
  city: 'Armenia',
  region: 'Quindío',
  country: 'CO',
  address: 'Calle 21 # 14-30, Centro', // demo
  mapsQuery: 'Armenia, Quindío, Colombia',
  whatsapp: '573000000000', // demo — the client's real number goes here
  whatsappDisplay: '300 000 0000', // demo
  instagram: 'dosman', // demo
  // 0 = Sunday … 6 = Saturday. Hours in 24h, Colombia time.
  hours: [
    { days: [1, 2, 3, 4], open: '14:00', close: '22:00' },
    { days: [5, 6], open: '13:00', close: '23:00' },
    { days: [0], open: '13:00', close: '22:00' },
  ],
  hoursLabel: [
    { label: 'Lunes a jueves', value: '2:00 p. m. – 10:00 p. m.' },
    { label: 'Viernes y sábado', value: '1:00 p. m. – 11:00 p. m.' },
    { label: 'Domingos y festivos', value: '1:00 p. m. – 10:00 p. m.' },
  ],
  prepMinutes: 15,
  demo: true,
} as const

export type DeliveryZone = { id: string; name: string; fee: number; eta: string }

/** Delivery zones and fees (demo values, editable from the admin panel). */
export const deliveryZones: DeliveryZone[] = [
  { id: 'centro', name: 'Centro', fee: 4000, eta: '25–35 min' },
  { id: 'norte', name: 'Norte', fee: 5000, eta: '30–40 min' },
  { id: 'sur', name: 'Sur', fee: 5000, eta: '30–40 min' },
  { id: 'occidente', name: 'Occidente', fee: 6000, eta: '35–45 min' },
  { id: 'oriente', name: 'Oriente', fee: 6000, eta: '35–45 min' },
  { id: 'calarca', name: 'Calarcá (vía)', fee: 9000, eta: '45–60 min' },
]

export const paymentInfo = {
  transferKey: '@dosman', // demo — Bre-B key / Nequi
  transferBank: 'Nequi · Bre-B', // demo
}
