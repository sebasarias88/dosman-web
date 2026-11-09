import { store } from '@/data/store'
import { formatCOP } from './format'
import { methodLabel, paymentLabel, statusLabel, type Order } from './demo-backend'

/** Full, ready-to-send WhatsApp message with everything the customer chose. */
export function orderMessage(order: Order): string {
  const lines = order.lines.map(
    (l) => `• ${l.qty} × ${l.name}${l.detail ? ` (${l.detail})` : ''}${l.note ? ` — “${l.note}”` : ''}: ${formatCOP(l.total)}`,
  )
  const where =
    order.method === 'delivery'
      ? `Domicilio a ${order.address} (${order.zoneName})${order.reference ? `. Referencia: ${order.reference}` : ''}`
      : order.method === 'park'
        ? `Entregar en el parque: ${order.parkNote}`
        : 'Recojo en el local'
  return [
    `Hola Dosman, soy ${order.customer.name}. Mi pedido es el ${order.id}:`,
    '',
    ...lines,
    '',
    `Subtotal: ${formatCOP(order.subtotal)}`,
    order.deliveryFee ? `Domicilio: ${formatCOP(order.deliveryFee)}` : null,
    `Total: ${formatCOP(order.total)}`,
    '',
    `Entrega: ${where}`,
    `Pago: ${paymentLabel[order.payment]}${order.payment === 'cash' && order.cashFor ? `, pago con ${formatCOP(order.cashFor)}` : ''}${order.payment === 'online' && order.paymentStatus === 'approved' ? ' (aprobado)' : ''}`,
    `Estado: ${statusLabel[order.status]}`,
  ]
    .filter((x) => x !== null)
    .join('\n')
}

export const whatsappUrl = (text: string) => `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`

export { methodLabel }
