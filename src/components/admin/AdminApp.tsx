import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { categories, products } from '@/data/menu'
import { deliveryZones, store } from '@/data/store'
import {
  createOrder,
  methodLabel,
  nextStatus,
  paymentLabel,
  readOrders,
  readSettings,
  readSoldOut,
  resetDemo,
  saveSettings,
  setSoldOut,
  subscribe,
  updateOrder,
  type Order,
  type OrderStatus,
  type StoreSettings,
} from '@/lib/demo-backend'
import { formatCOP, sleep } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

type Tab = 'orders' | 'menu' | 'store'

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  useEffect(() => setAuthed(sessionStorage.getItem('dosman:admin') === '1'), [])
  if (authed === null) return null
  if (!authed) return <Login onDone={() => setAuthed(true)} />
  return <Panel onLogout={() => (sessionStorage.removeItem('dosman:admin'), setAuthed(false))} />
}

function Login({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <form
        className="w-full max-w-sm"
        onSubmit={async (e) => {
          e.preventDefault()
          setLoading(true)
          await sleep(700)
          sessionStorage.setItem('dosman:admin', '1')
          onDone()
        }}
      >
        <span
          className="brand-mask block aspect-[425/344] h-24"
          style={{ maskImage: 'url(/brand/logo-vertical-current.svg)', WebkitMaskImage: 'url(/brand/logo-vertical-current.svg)' }}
          role="img"
          aria-label="Dosman"
        />
        <h1 className="mt-8 font-display font-extrabold text-4xl">Panel del negocio</h1>
        <p className="mt-2 text-muted">Demo: los datos ya están puestos, solo entra.</p>
        <label className="mt-6 block">
          <span className="mb-1.5 block font-medium">Correo</span>
          <input className="field" defaultValue="admin@dosman.co" autoComplete="off" />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block font-medium">Contraseña</span>
          <input className="field" type="password" defaultValue="demo-dosman" autoComplete="off" />
        </label>
        <Button type="submit" loading={loading} className="mt-6 w-full">
          Entrar
        </Button>
      </form>
    </div>
  )
}

function Panel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const known = useRef<Set<string> | null>(null)

  useEffect(() => {
    const load = () => {
      const list = readOrders()
      // Detect orders that arrived from the website since the last look.
      if (known.current) {
        const fresh = list.filter((o) => !known.current!.has(o.id))
        if (fresh.length) {
          setFlash(fresh[0].id)
          ding()
          setTimeout(() => setFlash(null), 4000)
        }
      }
      known.current = new Set(list.map((o) => o.id))
      setOrders(list)
    }
    sleep(500).then(load)
    return subscribe(load)
  }, [])

  const newCount = orders?.filter((o) => o.status === 'new').length ?? 0
  useEffect(() => {
    document.title = newCount ? `(${newCount}) Pedidos nuevos | Dosman` : 'Panel | Dosman'
  }, [newCount])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b-2 border-line bg-bg">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="brand-mask block aspect-[172/221] h-9"
              style={{ maskImage: 'url(/brand/isotype-current.svg)', WebkitMaskImage: 'url(/brand/isotype-current.svg)' }}
              aria-hidden="true"
            />
            <div className="leading-tight">
              <p className="font-semibold">Panel Dosman</p>
              <p className="text-sm text-muted">{store.branch}</p>
            </div>
          </div>
          <nav className="order-3 flex w-full gap-2 overflow-x-auto sm:order-none sm:w-auto" role="tablist" aria-label="Secciones">
            {(
              [
                ['orders', `Pedidos${newCount ? ` (${newCount})` : ''}`],
                ['menu', 'Menú y agotados'],
                ['store', 'Tienda'],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className="chip">
                {label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener" className="chip hover:bg-surface">
              Ver la web
            </a>
            <button type="button" onClick={onLogout} className="chip hover:bg-surface">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        {tab === 'orders' && <OrdersBoard orders={orders} flash={flash} />}
        {tab === 'menu' && <MenuAdmin />}
        {tab === 'store' && <StoreAdmin />}
      </main>
    </div>
  )
}

// ── Orders board ────────────────────────────────────────────────────

const columns: { id: string; title: string; statuses: OrderStatus[] }[] = [
  { id: 'new', title: 'Nuevos', statuses: ['new'] },
  { id: 'preparing', title: 'Preparando', statuses: ['preparing'] },
  { id: 'out', title: 'En camino o listos', statuses: ['on_the_way', 'ready'] },
  { id: 'done', title: 'Entregados', statuses: ['delivered'] },
]

const actionLabel: Record<OrderStatus, string> = {
  new: '',
  preparing: 'Empezar a preparar',
  on_the_way: 'Enviar con domiciliario',
  ready: 'Marcar como listo',
  delivered: 'Marcar entregado',
  cancelled: '',
}

function OrdersBoard({ orders, flash }: { orders: Order[] | null; flash: string | null }) {
  const [simulating, setSimulating] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const advance = async (o: Order, patch: Partial<Pick<Order, 'status' | 'paymentStatus'>>, key: string) => {
    setBusy(key)
    await updateOrder(o.id, patch)
    setBusy(null)
  }

  const todayTotal = useMemo(() => (orders ?? []).filter((o) => o.status === 'delivered').reduce((n, o) => n + o.total, 0), [orders])

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl">Pedidos de la web</h1>
          <p className="mt-1 text-muted">Llegan solos, con sonido. En producción también entran al sistema de caja.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="soft"
            loading={simulating}
            onClick={async () => {
              setSimulating(true)
              await createOrder(randomOrder())
              setSimulating(false)
            }}
          >
            Simular un pedido
          </Button>
          <Button
            variant="soft"
            loading={resetting}
            onClick={async () => {
              if (!confirm('¿Borrar todos los pedidos y agotados del demo?')) return
              setResetting(true)
              await resetDemo()
              setResetting(false)
            }}
          >
            Reiniciar demo
          </Button>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Nuevos" value={orders ? String(orders.filter((o) => o.status === 'new').length) : null} />
        <Stat label="En proceso" value={orders ? String(orders.filter((o) => ['preparing', 'on_the_way', 'ready'].includes(o.status)).length) : null} />
        <Stat label="Entregados" value={orders ? String(orders.filter((o) => o.status === 'delivered').length) : null} />
        <Stat label="Vendido por la web" value={orders ? formatCOP(todayTotal) : null} />
      </dl>

      <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {columns.map((col) => {
          const list = orders?.filter((o) => col.statuses.includes(o.status)) ?? []
          return (
            <section key={col.id} className="w-[86vw] max-w-sm shrink-0 snap-start rounded-[24px] bg-surface p-3 lg:w-auto lg:max-w-none" aria-labelledby={`col-${col.id}`}>
              <h2 id={`col-${col.id}`} className="flex items-center justify-between px-2 py-1 font-semibold">
                {col.title}
                <span className="price grid min-w-7 place-items-center rounded-full bg-fg px-2 text-sm text-white">{orders ? list.length : '–'}</span>
              </h2>
              <div className="mt-2 space-y-3">
                {orders === null && (
                  <>
                    <div className="skeleton h-40 bg-bg" />
                    <div className="skeleton h-32 bg-bg" />
                  </>
                )}
                {orders !== null && list.length === 0 && (
                  <p className="rounded-2xl border-2 border-dashed border-line/30 px-4 py-6 text-center text-sm text-muted">
                    {col.id === 'new' ? 'Sin pedidos nuevos. Cuando alguien pida en la web aparece aquí.' : 'Nada por ahora.'}
                  </p>
                )}
                {list.map((o) => (
                  <OrderCard key={o.id} order={o} highlight={flash === o.id} busy={busy} onAction={advance} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border-2 border-line px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="price mt-1 font-display font-extrabold text-3xl">{value ?? <span className="skeleton block h-8 w-16" />}</dd>
    </div>
  )
}

function OrderCard({
  order: o,
  highlight,
  busy,
  onAction,
}: {
  order: Order
  highlight: boolean
  busy: string | null
  onAction: (o: Order, patch: Partial<Pick<Order, 'status' | 'paymentStatus'>>, key: string) => Promise<void>
}) {
  const next = nextStatus(o)
  const anyBusy = busy !== null
  const minutes = Math.max(0, Math.round((Date.now() - o.createdAt) / 60000))
  return (
    <article
      className={`rounded-2xl border-2 border-line bg-bg p-4 transition-shadow ${highlight ? 'shadow-[0_0_0_4px_var(--color-accent)] motion-safe:animate-[pop_500ms_var(--ease-pour)]' : ''}`}
      aria-label={`Pedido ${o.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="price text-lg font-semibold">{o.id}</p>
          <p className="text-sm text-muted">
            {o.customer.name} · hace {minutes < 1 ? 'un momento' : `${minutes} min`}
          </p>
        </div>
        <span className="rounded-full border-2 border-line px-2.5 py-0.5 text-xs font-semibold">{methodLabel[o.method]}</span>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {o.lines.map((l, i) => (
          <li key={i}>
            <span className="font-semibold">{l.qty}×</span> {l.name}
            {l.detail && <span className="block pl-5 text-muted">{l.detail}</span>}
            {l.note && <span className="block pl-5 text-muted italic">“{l.note}”</span>}
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-1 border-t border-line/15 pt-3 text-sm">
        {o.method === 'delivery' && (
          <p>
            <span className="text-muted">Dirección:</span> {o.address} ({o.zoneName}){o.reference ? `. ${o.reference}` : ''}
          </p>
        )}
        {o.method === 'park' && (
          <p>
            <span className="text-muted">Parque:</span> {o.parkNote}
          </p>
        )}
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-muted">Pago:</span> {paymentLabel[o.payment]}
          {o.cashFor ? <span className="text-muted">(paga con {formatCOP(o.cashFor)})</span> : null}
          {o.paymentStatus === 'approved' && <span className="rounded-full bg-ok px-2 text-xs font-semibold text-white">Pagado</span>}
          {o.paymentStatus === 'in_review' && <span className="rounded-full bg-mango px-2 text-xs font-semibold text-fg">Revisar comprobante</span>}
        </p>
        <p className="price flex justify-between pt-1 text-base font-semibold">
          <span>Total</span>
          {formatCOP(o.total)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {o.paymentStatus === 'in_review' && (
          <Button variant="soft" className="!px-4 !py-2 text-sm" loading={busy === `${o.id}:pay`} disabled={anyBusy} onClick={() => onAction(o, { paymentStatus: 'approved' }, `${o.id}:pay`)}>
            Aprobar pago
          </Button>
        )}
        {next && (
          <Button className="flex-1 !px-4 !py-2 text-sm" loading={busy === `${o.id}:next`} disabled={anyBusy} onClick={() => onAction(o, { status: next }, `${o.id}:next`)}>
            {actionLabel[next]}
          </Button>
        )}
      </div>
      <style>{`@keyframes pop { 0% { transform: scale(.94); opacity: 0 } }`}</style>
    </article>
  )
}

// ── Menu availability ───────────────────────────────────────────────

function MenuAdmin() {
  const [soldOut, setSold] = useState<Set<string> | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  useEffect(() => {
    sleep(450).then(() => setSold(readSoldOut()))
    return subscribe(() => setSold(readSoldOut()))
  }, [])

  const toggle = async (id: string, available: boolean) => {
    setBusy(id)
    await setSoldOut(id, available)
    setSold(readSoldOut())
    setBusy(null)
  }

  return (
    <>
      <h1 className="font-display font-extrabold text-4xl sm:text-5xl">Menú y agotados</h1>
      <p className="mt-1 max-w-2xl text-muted">
        Si se acaba algo, apágalo y en la web sale como “Agotado hoy” al instante. En producción, aquí también se editan precios, fotos y adiciones, y los agotados se marcan solos cuando se acaba un insumo del inventario.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {categories.map((c) => (
          <section key={c.id} aria-labelledby={`adm-${c.id}`}>
            <h2 id={`adm-${c.id}`} className="border-b-2 border-line pb-2 font-display font-extrabold text-2xl">
              {c.name}
            </h2>
            <ul className="divide-y divide-line/15">
              {products
                .filter((p) => p.categoryId === c.id)
                .map((p) => {
                  const available = soldOut ? !soldOut.has(p.id) : true
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="price text-sm text-muted">{formatCOP(p.price)}</p>
                      </div>
                      {soldOut === null ? (
                        <span className="skeleton h-8 w-14 rounded-full" aria-hidden="true" />
                      ) : (
                        <Switch
                          checked={available}
                          loading={busy === p.id}
                          disabled={busy !== null}
                          label={`${p.name} disponible`}
                          onChange={() => toggle(p.id, available)}
                        />
                      )}
                    </li>
                  )
                })}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

function Switch({ checked, loading, disabled, label, onChange }: { checked: boolean; loading: boolean; disabled: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-8 w-14 shrink-0 rounded-full border-2 border-line transition-colors ${checked ? 'bg-ok' : 'bg-surface'} ${disabled && !loading ? 'opacity-60' : ''}`}
    >
      <span className={`absolute top-0.5 grid size-6 place-items-center rounded-full border-2 border-line bg-bg transition-transform ${checked ? 'translate-x-[1.55rem]' : 'translate-x-0.5'}`}>
        {loading && <Spinner className="size-3.5" />}
      </span>
    </button>
  )
}

// ── Store settings ──────────────────────────────────────────────────

function StoreAdmin() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  useEffect(() => {
    sleep(400).then(() => setSettings(readSettings()))
    return subscribe(() => setSettings(readSettings()))
  }, [])

  const save = async (patch: Partial<StoreSettings>, key: string) => {
    setBusy(key)
    await saveSettings(patch)
    setSettings(readSettings())
    setBusy(null)
  }

  return (
    <>
      <h1 className="font-display font-extrabold text-4xl sm:text-5xl">Tienda</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="¿Estamos recibiendo pedidos?">
          <p className="text-muted">Por defecto la web abre y cierra sola según el horario. Puedes forzarlo si cierran temprano.</p>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Estado de la tienda">
            {(
              [
                ['auto', 'Según el horario'],
                ['open', 'Abierto'],
                ['closed', 'Cerrado'],
              ] as const
            ).map(([v, label]) =>
              settings === null ? (
                <span key={v} className="skeleton h-10 w-28 rounded-full" />
              ) : (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={settings.openMode === v}
                  aria-selected={settings.openMode === v}
                  disabled={busy !== null}
                  onClick={() => save({ openMode: v }, `open:${v}`)}
                  className="chip relative"
                >
                  <span className={busy === `open:${v}` ? 'invisible' : ''}>{label}</span>
                  {busy === `open:${v}` && (
                    <span className="absolute inset-0 grid place-items-center">
                      <Spinner className="size-4" />
                    </span>
                  )}
                </button>
              ),
            )}
          </div>
        </Card>

        <Card title="Pagos en línea">
          <div className="flex items-start justify-between gap-6">
            <p className="text-muted">Tarjeta, PSE y Nequi con la pasarela. Si la apagas, solo se ofrece efectivo y transferencia.</p>
            {settings === null ? (
              <span className="skeleton h-8 w-14 rounded-full" />
            ) : (
              <Switch
                checked={settings.onlinePayments}
                loading={busy === 'online'}
                disabled={busy !== null}
                label="Pagos en línea"
                onChange={() => save({ onlinePayments: !settings.onlinePayments }, 'online')}
              />
            )}
          </div>
        </Card>

        <Card title="Zonas de domicilio">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-muted">
                <th className="py-1 font-medium">Zona</th>
                <th className="py-1 font-medium">Valor</th>
                <th className="py-1 font-medium">Tiempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/15">
              {deliveryZones.map((z) => (
                <tr key={z.id}>
                  <td className="py-2 font-medium">{z.name}</td>
                  <td className="price py-2">{formatCOP(z.fee)}</td>
                  <td className="py-2 text-muted">{z.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Conectado al sistema Dosman">
          <ul className="space-y-2 text-muted">
            <li>Los pedidos de la web entran a la caja como pedidos a domicilio de la sede principal.</li>
            <li>El menú, los precios y las fotos se manejan desde el mismo sistema.</li>
            <li>Cada pedido nuevo avisa a los dueños por Telegram.</li>
          </ul>
        </Card>
      </div>
    </>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border-2 border-line p-5 sm:p-6">
      <h2 className="font-display font-extrabold text-2xl">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Short two-tone chime for new orders (no audio file needed). */
function ding() {
  try {
    const ctx = new AudioContext()
    ;[880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16)
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.16 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.16)
      osc.stop(ctx.currentTime + i * 0.16 + 0.4)
    })
  } catch {}
}

const names = ['Valentina', 'Juan David', 'Mariana', 'Santiago', 'Laura', 'Andrés', 'Camila', 'Felipe']
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

function randomOrder() {
  const items = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => pick(products))
  const lines = items.map((p) => {
    const qty = 1 + Math.floor(Math.random() * 2)
    const size = p.groups.find((g) => g.id === 'size')?.options[0]
    return { name: p.name, detail: size?.label ?? '', qty, unit: p.price, total: p.price * qty }
  })
  const subtotal = lines.reduce((n, l) => n + l.total, 0)
  const method = pick(['delivery', 'delivery', 'pickup', 'park'] as const)
  const zone = pick(deliveryZones)
  const fee = method === 'delivery' ? zone.fee : 0
  const payment = pick(['cash', 'transfer', 'online'] as const)
  return {
    customer: { name: pick(names), phone: '3001234567' },
    method,
    zoneId: method === 'delivery' ? zone.id : undefined,
    zoneName: method === 'delivery' ? zone.name : undefined,
    address: method === 'delivery' ? `Cra ${10 + Math.floor(Math.random() * 20)} # ${Math.floor(Math.random() * 40)}-${Math.floor(Math.random() * 90)}` : undefined,
    parkNote: method === 'park' ? 'Banca frente a la fuente, gorra azul' : undefined,
    payment,
    paymentStatus: payment === 'online' ? ('approved' as const) : payment === 'transfer' ? ('in_review' as const) : ('pending' as const),
    lines,
    subtotal,
    deliveryFee: fee,
    total: subtotal + fee,
  }
}
