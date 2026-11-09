import { useEffect, useState } from 'react'
import { findOrder, methodLabel, paymentLabel, statusFlow, statusLabel, subscribe, type Order } from '@/lib/demo-backend'
import { formatCOP, sleep } from '@/lib/format'
import { orderMessage, whatsappUrl } from '@/lib/whatsapp'

const timeFmt = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })

const headline: Record<string, string> = {
  new: 'Recibimos tu pedido',
  preparing: 'Lo estamos preparando',
  on_the_way: 'Va en camino',
  ready: 'Ya está listo',
  delivered: 'Entregado. ¡Que lo disfrutes!',
  cancelled: 'Pedido cancelado',
}

export default function OrderTracking() {
  const [order, setOrder] = useState<Order | null | undefined>(undefined)

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id') ?? ''
    // Small delay to show the loading state like a real request would.
    sleep(500).then(() => setOrder(findOrder(id) ?? null))
    return subscribe(() => setOrder(findOrder(id) ?? null))
  }, [])

  if (order === undefined)
    return (
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-14 sm:px-6" aria-busy="true">
        <span className="sr-only" role="status">
          Cargando…
        </span>
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-20 w-4/5" />
        <div className="skeleton h-40" />
        <div className="skeleton h-56" />
      </div>
    )

  if (order === null)
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <h1 className="font-display font-extrabold text-5xl">No encontramos ese pedido</h1>
        <p className="mt-4 text-lg text-muted">Revisa el enlace o escríbenos por WhatsApp con tu número de pedido.</p>
        <a href="/menu" className="btn btn-primary mt-8">
          Hacer un pedido
        </a>
      </div>
    )

  const flow = statusFlow(order.method)
  const current = flow.indexOf(order.status)
  const at = (s: string) => order.history.find((h) => h.status === s)?.at

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-24 sm:px-6 sm:pt-14">
      <p className="price font-semibold text-muted">Pedido {order.id}</p>
      <h1 className="mt-2 font-display font-extrabold text-[clamp(2.6rem,8vw,4.75rem)] leading-[0.92] tracking-[-0.02em]" aria-live="polite">
        {headline[order.status]}
      </h1>
      <p className="mt-3 text-lg text-muted">
        {order.method === 'delivery' && order.status !== 'delivered' && `Llega a ${order.address} en unos 30–40 minutos.`}
        {order.method === 'pickup' && order.status !== 'delivered' && 'Te avisamos por WhatsApp cuando puedas pasar.'}
        {order.method === 'park' && order.status !== 'delivered' && `Te lo llevamos a: ${order.parkNote}.`}
      </p>

      <ol className="mt-10 grid gap-0" aria-label="Estado del pedido">
        {flow.map((s, i) => {
          const done = i <= current
          const now = i === current
          const t = at(s)
          return (
            <li key={s} className="relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 pb-8 last:pb-0">
              {i < flow.length - 1 && (
                <span className={`absolute top-10 bottom-0 left-[1.2rem] w-0.5 ${i < current ? 'bg-fg' : 'bg-line/20'}`} aria-hidden="true" />
              )}
              <span
                className={`relative grid size-10 place-items-center rounded-full border-2 border-line ${done ? 'bg-fg text-white' : 'bg-bg'} ${now ? 'ring-4 ring-accent/35' : ''}`}
                aria-hidden="true"
              >
                {done && !now ? (
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12.5 10 17l9-10" />
                  </svg>
                ) : (
                  <span className="price font-semibold">{i + 1}</span>
                )}
              </span>
              <span className={`text-lg ${done ? 'font-semibold' : 'text-muted'}`}>
                {statusLabel[s]}
                {now && <span className="sr-only"> (estado actual)</span>}
              </span>
              <span className="price text-sm text-muted">{t ? timeFmt.format(t) : ''}</span>
            </li>
          )
        })}
      </ol>

      <div className="mt-12 rounded-[28px] border-2 border-line p-5 sm:p-7">
        <h2 className="font-display font-extrabold text-3xl">Detalle</h2>
        <ul className="mt-4 space-y-3">
          {order.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                <span className="font-semibold">
                  {l.qty} × {l.name}
                </span>
                {l.detail && <span className="block text-sm text-muted">{l.detail}</span>}
              </span>
              <span className="price shrink-0">{formatCOP(l.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-1.5 border-t-2 border-line pt-4">
          {order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Domicilio · {order.zoneName}</dt>
              <dd className="price">{formatCOP(order.deliveryFee)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Entrega</dt>
            <dd>{methodLabel[order.method]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Pago</dt>
            <dd>
              {paymentLabel[order.payment]}
              {order.paymentStatus === 'approved' && ' · aprobado'}
              {order.paymentStatus === 'in_review' && ' · en revisión'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <dt className="text-lg font-semibold">Total</dt>
            <dd className="price font-display font-extrabold text-3xl">{formatCOP(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href={whatsappUrl(orderMessage(order))} target="_blank" rel="noopener" className="btn btn-primary">
          Escribir por WhatsApp
        </a>
        <a href="/menu" className="btn btn-ghost">
          Pedir algo más
        </a>
      </div>

      <p className="mt-10 rounded-2xl bg-surface px-4 py-3 text-sm">
        <strong>Modo demo:</strong> abre el{' '}
        <a href="/admin" target="_blank" rel="noopener" className="font-semibold underline underline-offset-4">
          panel del negocio
        </a>{' '}
        en otra pestaña y mueve este pedido. Esta pantalla se actualiza sola.
      </p>
    </div>
  )
}
