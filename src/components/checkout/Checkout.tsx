import { useStore } from '@nanostores/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { $cartSubtotal, $pricedCart, clearCart, setQty } from '@/lib/cart'
import { deliveryZones, paymentInfo, store } from '@/data/store'
import { createOrder, readSettings, subscribe, type OrderMethod, type PaymentMethod, type StoreSettings } from '@/lib/demo-backend'
import { formatCOP } from '@/lib/format'
import { Combobox } from '@/components/ui/Combobox'
import { Button } from '@/components/ui/Button'
import { Stepper } from '@/components/ui/Stepper'
import { ProductImage } from '@/components/ui/ProductImage'
import { useOpenState } from '@/components/layout/OpenBadge'
import PaymentGateway from './PaymentGateway'
import { Icon, type IconName } from '@/components/ui/Icon'

type Errors = Partial<Record<'name' | 'phone' | 'zone' | 'address' | 'parkNote' | 'proof', string>>

export default function Checkout() {
  const lines = useStore($pricedCart)
  const subtotal = useStore($cartSubtotal)
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const openState = useOpenState()

  const [method, setMethod] = useState<OrderMethod>('delivery')
  const [zoneId, setZoneId] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [reference, setReference] = useState('')
  const [parkNote, setParkNote] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('cash')
  const [cashFor, setCashFor] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [gatewayOpen, setGatewayOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setMounted(true)
    setSettings(readSettings())
    // Remember the customer's details for the next order (only on this device).
    try {
      const saved = JSON.parse(localStorage.getItem('dosman:customer:v1') ?? '{}')
      if (saved.name) setName(saved.name)
      if (saved.phone) setPhone(saved.phone)
      if (saved.zoneId) setZoneId(saved.zoneId)
      if (saved.address) setAddress(saved.address)
      if (saved.reference) setReference(saved.reference)
    } catch {}
    return subscribe(() => setSettings(readSettings()))
  }, [])

  const zone = deliveryZones.find((z) => z.id === zoneId)
  const deliveryFee = method === 'delivery' ? (zone?.fee ?? 0) : 0
  const total = subtotal + deliveryFee
  const onlineOff = settings ? !settings.onlinePayments : false

  const zoneOptions = useMemo(
    () => deliveryZones.map((z) => ({ value: z.id, label: z.name, hint: `${formatCOP(z.fee)} · ${z.eta}` })),
    [],
  )

  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = 'Escribe tu nombre para saber a quién entregar.'
    if (!/^3\d{9}$/.test(phone.replace(/\D/g, ''))) e.phone = 'Escribe un celular de 10 dígitos que empiece por 3.'
    if (method === 'delivery') {
      if (!zoneId) e.zone = 'Elige tu zona para calcular el domicilio.'
      if (address.trim().length < 6) e.address = 'Escribe la dirección completa, con número.'
    }
    if (method === 'park' && parkNote.trim().length < 4) e.parkNote = 'Cuéntanos en qué banca estás o cómo te reconocemos.'
    if (payment === 'transfer' && !proof) e.proof = 'Sube la captura de la transferencia.'
    return e
  }

  const placeOrder = async (paidOnline: boolean) => {
    setSending(true)
    try {
      localStorage.setItem('dosman:customer:v1', JSON.stringify({ name, phone, zoneId, address, reference }))
    } catch {}
    const order = await createOrder({
      customer: { name: name.trim(), phone: phone.replace(/\D/g, '') },
      method,
      zoneId: method === 'delivery' ? zoneId ?? undefined : undefined,
      zoneName: method === 'delivery' ? zone?.name : undefined,
      address: method === 'delivery' ? address.trim() : undefined,
      reference: method === 'delivery' ? reference.trim() || undefined : undefined,
      parkNote: method === 'park' ? parkNote.trim() : undefined,
      payment,
      paymentStatus: paidOnline ? 'approved' : payment === 'transfer' ? 'in_review' : 'pending',
      cashFor: payment === 'cash' && cashFor ? Number(cashFor.replace(/\D/g, '')) : undefined,
      proofName: payment === 'transfer' ? proof?.name : undefined,
      lines: lines.map((l) => ({ name: l.product.name, detail: l.detail, qty: l.qty, unit: l.unit, total: l.total, note: l.note })),
      subtotal,
      deliveryFee,
      total,
    })
    clearCart()
    location.href = `/pedido?id=${order.id}`
  }

  const submit = (ev: { preventDefault: () => void }) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    if (payment === 'online') setGatewayOpen(true)
    else placeOrder(false)
  }

  if (!mounted) return <CheckoutSkeleton />

  if (lines.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <span className="grid size-20 place-items-center rounded-full bg-tint-fresa text-accent"><Icon name="bag" className="size-9" /></span>
        <h1 className="mt-6 font-display text-4xl font-extrabold sm:text-5xl">Tu pedido está vacío</h1>
        <p className="mt-3 text-lg text-muted">Elige algo del menú y vuelve aquí para terminar.</p>
        <a href="/menu" className="btn btn-primary mt-8">
          Ver el menú
        </a>
      </div>
    )

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="mx-auto grid max-w-7xl gap-10 px-4 pt-8 pb-24 sm:px-6 sm:pt-12 lg:grid-cols-[1.25fr_0.9fr] lg:gap-16">
      <div>
        <a href="/menu" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
          <Icon name="back" className="size-4" /> Seguir pidiendo
        </a>
        <h1 className="mt-2 font-display text-[clamp(2.2rem,6vw,3.75rem)] leading-none font-extrabold">Terminar pedido</h1>
        {openState && !openState.open && (
          <p className="mt-5 rounded-2xl bg-tint-mango px-4 py-3.5 text-[15px]" role="status">
            <strong>{openState.label.replace(/\.$/, '')}.</strong> Tu pedido queda programado y lo preparamos apenas abramos.
          </p>
        )}

        <Section title="¿Cómo lo recibes?">
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Forma de entrega">
            <ChoiceCard checked={method === 'delivery'} onSelect={() => setMethod('delivery')} title="Domicilio" text="Te lo llevamos" icon="bike" />
            <ChoiceCard checked={method === 'pickup'} onSelect={() => setMethod('pickup')} title="Recoger" text={`Listo en ~${store.prepMinutes} min`} icon="store" />
            <ChoiceCard checked={method === 'park'} onSelect={() => setMethod('park')} title="En el parque" text="Te buscamos en tu banca" icon="bench" />
          </div>

          {method === 'delivery' && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Zona" error={errors.zone} htmlFor="zone">
                <Combobox id="zone" label="Zona" options={zoneOptions} value={zoneId} onChange={setZoneId} placeholder="Elige tu zona" invalid={!!errors.zone} />
              </Field>
              <Field label="Dirección" error={errors.address} htmlFor="address">
                <input id="address" className="field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Cra 14 # 20-35, apto 302" autoComplete="street-address" aria-invalid={!!errors.address || undefined} />
              </Field>
              <Field label="Referencia (opcional)" htmlFor="reference" className="sm:col-span-2">
                <input id="reference" className="field" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Casa esquinera, portón negro" />
              </Field>
            </div>
          )}
          {method === 'pickup' && (
            <p className="mt-5 flex items-start gap-3 rounded-2xl bg-surface px-4 py-3.5 text-[15px]">
              <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-accent" />
              <span>Recógelo en {store.address}. Te avisamos por WhatsApp cuando esté listo, sin hacer fila.</span>
            </p>
          )}
          {method === 'park' && (
            <Field label="¿Dónde estás y cómo te reconocemos?" error={errors.parkNote} htmlFor="park" className="mt-6">
              <textarea id="park" rows={2} className="field resize-none" value={parkNote} onChange={(e) => setParkNote(e.target.value.slice(0, 120))} placeholder="Banca frente a la fuente, camiseta roja" aria-invalid={!!errors.parkNote || undefined} />
            </Field>
          )}
        </Section>

        <Section title="Tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" error={errors.name} htmlFor="name">
              <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" placeholder="¿A nombre de quién?" aria-invalid={!!errors.name || undefined} />
            </Field>
            <Field label="Celular (WhatsApp)" error={errors.phone} htmlFor="phone">
              <input id="phone" className="field price" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="300 123 4567" aria-invalid={!!errors.phone || undefined} />
            </Field>
          </div>
        </Section>

        <Section title="¿Cómo pagas?">
          <div className="grid gap-3" role="radiogroup" aria-label="Forma de pago">
            <PayRow checked={payment === 'cash'} onSelect={() => setPayment('cash')} title="Efectivo" text={method === 'delivery' ? 'Le pagas al domiciliario' : 'Pagas al recibir'} icon="cash" />
            <PayRow checked={payment === 'transfer'} onSelect={() => setPayment('transfer')} title="Transferencia" text="Nequi, Bancolombia o llave Bre-B" icon="bank" />
            <PayRow
              checked={payment === 'online'}
              onSelect={() => setPayment('online')}
              title="Pago en línea"
              text={onlineOff ? 'No disponible en este momento' : 'Tarjeta, PSE o Nequi. Confirmación inmediata'}
              disabled={onlineOff}
              icon="card"
            />
          </div>

          {payment === 'cash' && (
            <Field label="¿Con cuánto pagas? (opcional)" htmlFor="cash" className="mt-5 max-w-xs">
              <input id="cash" className="field price" inputMode="numeric" value={cashFor} onChange={(e) => setCashFor(e.target.value.replace(/\D/g, ''))} placeholder={`Ej.: ${formatCOP(Math.ceil(total / 10000) * 10000 || 50000)}`} />
            </Field>
          )}
          {payment === 'transfer' && (
            <div className="mt-5 rounded-[22px] bg-surface p-5">
              <p className="text-muted">Transfiere {formatCOP(total)} a</p>
              <p className="mt-1 flex flex-wrap items-center gap-3">
                <span className="price font-display text-3xl font-extrabold">{paymentInfo.transferKey}</span>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-bold">{paymentInfo.transferBank}</span>
              </p>
              <Field label="Captura de la transferencia" error={errors.proof} htmlFor="proof" className="mt-4">
                <label
                  htmlFor="proof"
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed bg-white px-4 py-4 hover:border-fg/30 ${errors.proof ? 'border-danger' : 'border-line'}`}
                >
                  <Icon name={proof ? 'check' : 'upload'} className={`size-6 shrink-0 ${proof ? 'text-ok' : ''}`} />
                  <span className="min-w-0 truncate font-medium">{proof ? proof.name : 'Subir imagen'}</span>
                </label>
                <input id="proof" type="file" accept="image/*" className="sr-only" onChange={(e) => setProof(e.target.files?.[0] ?? null)} aria-invalid={!!errors.proof || undefined} />
              </Field>
              <p className="mt-3 text-sm text-muted">Revisamos el pago y te confirmamos por WhatsApp.</p>
            </div>
          )}
        </Section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start" aria-labelledby="summary-title">
        <div className="rounded-[28px] bg-surface p-5 sm:p-7">
          <h2 id="summary-title" className="font-display text-2xl font-extrabold">
            Resumen
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.lineId} className="flex gap-3 py-3">
                <ProductImage imageKey={l.product.image} name={l.product.name} sizes="56px" className="size-14 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="leading-snug font-extrabold">{l.product.name}</p>
                    <p className="price shrink-0 font-bold">{formatCOP(l.total)}</p>
                  </div>
                  {l.detail && <p className="text-sm text-muted">{l.detail}</p>}
                  <div className="mt-2">
                    <Stepper value={l.qty} onChange={(q) => setQty(l.lineId, q)} label={l.product.name} min={0} size="sm" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-line pt-4">
            <Row label="Subtotal" value={formatCOP(subtotal)} />
            {method === 'delivery' && <Row label={`Domicilio${zone ? ` · ${zone.name}` : ''}`} value={zone ? formatCOP(zone.fee) : 'Elige tu zona'} />}
            <div className="flex items-baseline justify-between pt-2">
              <dt className="text-lg font-extrabold">Total</dt>
              <dd className="price font-display text-4xl font-extrabold">{formatCOP(total)}</dd>
            </div>
          </dl>
          <Button type="submit" loading={sending} className="mt-6 w-full !justify-between text-lg">
            <span>{payment === 'online' ? 'Ir a pagar' : 'Confirmar pedido'}</span> <span className="price">{formatCOP(total)}</span>
          </Button>
          <p className="mt-3 text-center text-sm text-muted">Al confirmar, el pedido llega directo a la cocina.</p>
        </div>
      </aside>

      <PaymentGateway
        open={gatewayOpen}
        amount={total}
        onCancel={() => setGatewayOpen(false)}
        onApproved={() => {
          setGatewayOpen(false)
          placeOrder(true)
        }}
      />
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-extrabold sm:text-[28px]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({ label, error, htmlFor, className = '', children }: { label: string; error?: string; htmlFor: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="price">{value}</dd>
    </div>
  )
}

function ChoiceCard({ checked, onSelect, title, text, icon }: { checked: boolean; onSelect: () => void; title: string; text: string; icon: IconName }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-[22px] border-2 p-3.5 text-left transition-colors sm:flex-col sm:items-start sm:p-4 ${checked ? 'border-accent bg-tint-fresa' : 'border-line hover:border-fg/20'}`}
    >
      <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${checked ? 'bg-accent text-white' : 'bg-surface'}`}>
        <Icon name={icon} className="size-6" />
      </span>
      <span>
        <span className="block font-extrabold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </button>
  )
}

function PayRow({ checked, onSelect, title, text, disabled, icon }: { checked: boolean; onSelect: () => void; title: string; text: string; disabled?: boolean; icon: IconName }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onSelect()}
      className={`flex items-center gap-3.5 rounded-[22px] border-2 px-3.5 py-3 text-left transition-colors ${checked ? 'border-accent bg-tint-fresa' : 'border-line hover:border-fg/20'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${checked ? 'bg-accent text-white' : 'bg-surface'}`}>
        <Icon name={icon} className="size-6" />
      </span>
      <span className="flex-1">
        <span className="block font-extrabold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
      <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-accent bg-accent text-white' : 'border-line'}`} aria-hidden="true">
        {checked && <Icon name="check" className="size-3.5" strokeWidth={3.4} />}
      </span>
    </button>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-12 pb-24 sm:px-6 lg:grid-cols-[1.25fr_0.9fr]" aria-busy="true">
      <span className="sr-only" role="status">
        Cargando…
      </span>
      <div className="space-y-6">
        <div className="skeleton h-16 w-3/4" />
        <div className="skeleton h-8 w-1/3" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
        </div>
        <div className="skeleton h-14" />
        <div className="skeleton h-14" />
      </div>
      <div className="skeleton h-96 rounded-[28px]" />
    </div>
  )
}
