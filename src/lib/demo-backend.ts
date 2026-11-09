/**
 * DEMO BACKEND — runs entirely in the browser.
 *
 * Orders, sold-out products and store settings live in localStorage and are
 * shared live between tabs with a BroadcastChannel, so the client can open the
 * site in one tab and the admin panel in another and watch an order arrive.
 *
 * In production every function here becomes a call to the Dosman system
 * (Supabase): createOrder → validated RPC that recalculates prices on the
 * server, subscribe → Supabase Realtime, etc. The function names and shapes are
 * kept on purpose so the swap is mechanical.
 */
import { sleep } from './format'

export type OrderMethod = 'delivery' | 'pickup' | 'park'
export type PaymentMethod = 'cash' | 'transfer' | 'online'
export type PaymentStatus = 'pending' | 'in_review' | 'approved'
export type OrderStatus = 'new' | 'preparing' | 'on_the_way' | 'ready' | 'delivered' | 'cancelled'

export type OrderLine = { name: string; detail: string; qty: number; unit: number; total: number; note?: string }

export type Order = {
  id: string
  createdAt: number
  customer: { name: string; phone: string }
  method: OrderMethod
  zoneId?: string
  zoneName?: string
  address?: string
  reference?: string
  parkNote?: string
  payment: PaymentMethod
  paymentStatus: PaymentStatus
  cashFor?: number
  proofName?: string
  lines: OrderLine[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  history: { status: OrderStatus; at: number }[]
}

export type StoreSettings = {
  /** auto = follow the opening hours */
  openMode: 'auto' | 'open' | 'closed'
  onlinePayments: boolean
}

const KEYS = {
  orders: 'dosman:demo:orders:v1',
  soldOut: 'dosman:demo:sold-out:v1',
  settings: 'dosman:demo:settings:v1',
  seq: 'dosman:demo:seq:v1',
}

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dosman-demo') : null

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode or full storage: the demo keeps working in memory */
  }
  channel?.postMessage({ key })
}

/** Calls `fn` whenever demo data changes in this tab or any other tab. */
export function subscribe(fn: () => void) {
  const onMessage = () => fn()
  const onStorage = (e: StorageEvent) => {
    if (e.key && Object.values(KEYS).includes(e.key)) fn()
  }
  channel?.addEventListener('message', onMessage)
  window.addEventListener('storage', onStorage)
  return () => {
    channel?.removeEventListener('message', onMessage)
    window.removeEventListener('storage', onStorage)
  }
}

// ── Menu availability ───────────────────────────────────────────────

export const readSoldOut = () => new Set(read<string[]>(KEYS.soldOut, []))

/** Simulates the network so the menu shows its skeleton like it will in production. */
export async function fetchSoldOut(): Promise<Set<string>> {
  await sleep(650)
  return readSoldOut()
}

export async function setSoldOut(productId: string, soldOut: boolean) {
  await sleep(500)
  const set = readSoldOut()
  if (soldOut) set.add(productId)
  else set.delete(productId)
  write(KEYS.soldOut, [...set])
}

// ── Store settings ──────────────────────────────────────────────────

const defaultSettings: StoreSettings = { openMode: 'auto', onlinePayments: true }

export const readSettings = (): StoreSettings => ({ ...defaultSettings, ...read<Partial<StoreSettings>>(KEYS.settings, {}) })

export async function saveSettings(patch: Partial<StoreSettings>) {
  await sleep(450)
  write(KEYS.settings, { ...readSettings(), ...patch })
}

// ── Orders ──────────────────────────────────────────────────────────

export const readOrders = (): Order[] => read<Order[]>(KEYS.orders, []).sort((a, b) => b.createdAt - a.createdAt)

export const findOrder = (id: string) => readOrders().find((o) => o.id === id)

export type NewOrder = Omit<Order, 'id' | 'createdAt' | 'status' | 'history'>

export async function createOrder(input: NewOrder): Promise<Order> {
  await sleep(1100)
  const seq = read<number>(KEYS.seq, 412) + 1
  write(KEYS.seq, seq)
  const now = Date.now()
  const order: Order = { ...input, id: `D-${seq}`, createdAt: now, status: 'new', history: [{ status: 'new', at: now }] }
  write(KEYS.orders, [order, ...readOrders()])
  return order
}

export function statusFlow(method: OrderMethod): OrderStatus[] {
  return method === 'delivery' ? ['new', 'preparing', 'on_the_way', 'delivered'] : ['new', 'preparing', 'ready', 'delivered']
}

export function nextStatus(order: Order): OrderStatus | null {
  const flow = statusFlow(order.method)
  const i = flow.indexOf(order.status)
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null
}

export async function updateOrder(id: string, patch: Partial<Pick<Order, 'status' | 'paymentStatus'>>) {
  await sleep(600)
  const orders = readOrders().map((o) => {
    if (o.id !== id) return o
    const history = patch.status && patch.status !== o.status ? [...o.history, { status: patch.status, at: Date.now() }] : o.history
    return { ...o, ...patch, history }
  })
  write(KEYS.orders, orders)
}

export async function resetDemo() {
  await sleep(500)
  for (const key of Object.values(KEYS)) localStorage.removeItem(key)
  channel?.postMessage({ key: 'reset' })
}

export const statusLabel: Record<OrderStatus, string> = {
  new: 'Recibido',
  preparing: 'Preparando',
  on_the_way: 'En camino',
  ready: 'Listo para entregar',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const methodLabel: Record<OrderMethod, string> = {
  delivery: 'Domicilio',
  pickup: 'Recoge en el local',
  park: 'En el parque',
}

export const paymentLabel: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  online: 'Pago en línea',
}
