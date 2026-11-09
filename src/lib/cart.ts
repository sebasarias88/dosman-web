import { atom, computed } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import { productById, type Product } from '@/data/menu'

/** selections: groupId → chosen option ids */
export type Selections = Record<string, string[]>

export type CartLine = {
  lineId: string
  productId: string
  selections: Selections
  qty: number
  note?: string
}

// Versioned key: if the shape ever changes, old carts are dropped instead of breaking the page.
export const $cart = persistentAtom<CartLine[]>('dosman:cart:v1', [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },
})
export const $cartOpen = atom(false)

export function defaultSelections(product: Product): Selections {
  const out: Selections = {}
  for (const g of product.groups) {
    out[g.id] = g.type === 'single' && g.required ? [g.options[0].id] : []
  }
  return out
}

/** Price is always recomputed from the menu, never trusted from storage. */
export function unitPrice(product: Product, selections: Selections): number {
  const sizeGroup = product.groups.find((g) => g.id === 'size')
  let total = product.price
  if (sizeGroup) {
    const sizeId = selections.size?.[0]
    total = sizeGroup.options.find((o) => o.id === sizeId)?.price ?? sizeGroup.options[0].price
  }
  for (const g of product.groups) {
    if (g.id === 'size') continue
    for (const id of selections[g.id] ?? []) total += g.options.find((o) => o.id === id)?.price ?? 0
  }
  return total
}

/** Human description of the choices, e.g. "Grande · 24 oz, Queso rallado" */
export function describeSelections(product: Product, selections: Selections): string {
  const parts: string[] = []
  for (const g of product.groups) {
    for (const id of selections[g.id] ?? []) {
      const o = g.options.find((x) => x.id === id)
      if (o) parts.push(g.id === 'size' ? o.label : g.type === 'single' ? `${g.label}: ${o.label}` : o.label)
    }
  }
  return parts.join(', ')
}

const sameChoice = (a: Selections, b: Selections) => JSON.stringify(a) === JSON.stringify(b)

export function addToCart(productId: string, selections: Selections, qty: number, note?: string) {
  const lines = $cart.get()
  const existing = lines.find((l) => l.productId === productId && sameChoice(l.selections, selections) && (l.note ?? '') === (note ?? ''))
  if (existing) {
    $cart.set(lines.map((l) => (l === existing ? { ...l, qty: Math.min(l.qty + qty, 20) } : l)))
  } else {
    const lineId = `${productId}-${Date.now().toString(36)}`
    $cart.set([...lines, { lineId, productId, selections, qty, note: note || undefined }])
  }
}

export function setQty(lineId: string, qty: number) {
  if (qty <= 0) return removeLine(lineId)
  $cart.set($cart.get().map((l) => (l.lineId === lineId ? { ...l, qty: Math.min(qty, 20) } : l)))
}

export function removeLine(lineId: string) {
  $cart.set($cart.get().filter((l) => l.lineId !== lineId))
}

export function clearCart() {
  $cart.set([])
}

export type PricedLine = CartLine & { product: Product; unit: number; total: number; detail: string }

export const $pricedCart = computed($cart, (lines): PricedLine[] =>
  lines.flatMap((l) => {
    const product = productById.get(l.productId)
    if (!product) return []
    const unit = unitPrice(product, l.selections)
    return [{ ...l, product, unit, total: unit * l.qty, detail: describeSelections(product, l.selections) }]
  }),
)

export const $cartCount = computed($pricedCart, (lines) => lines.reduce((n, l) => n + l.qty, 0))
export const $cartSubtotal = computed($pricedCart, (lines) => lines.reduce((n, l) => n + l.total, 0))

// ── "Guardar mi carrito": a link that rebuilds the cart on any device ──
// Only ids, choices and quantities travel in the link; prices are re-read from the menu.

export function cartToParam(lines: CartLine[]): string {
  const compact = lines.map((l) => [l.productId, l.qty, l.selections, l.note ?? ''])
  const bytes = new TextEncoder().encode(JSON.stringify(compact))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function cartFromParam(param: string): CartLine[] {
  try {
    const binary = atob(param.replace(/-/g, '+').replace(/_/g, '/'))
    const json = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
    const compact = JSON.parse(json) as [string, number, Selections, string][]
    return compact
      .filter(([id]) => productById.has(id))
      .map(([productId, qty, selections, note], i) => ({
        lineId: `${productId}-${i}-${Date.now().toString(36)}`,
        productId,
        qty: Math.max(1, Math.min(20, Number(qty) || 1)),
        selections,
        note: note || undefined,
      }))
  } catch {
    return []
  }
}
