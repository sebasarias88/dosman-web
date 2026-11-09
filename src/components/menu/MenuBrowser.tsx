import { useStore } from '@nanostores/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, products, productById, type Product } from '@/data/menu'
import { $cart, $cartOpen, cartFromParam } from '@/lib/cart'
import { $mood } from '@/lib/mode'
import { fetchSoldOut, subscribe, readSoldOut } from '@/lib/demo-backend'
import { formatCOP, normalize } from '@/lib/format'
import { ProductImage } from '@/components/ui/ProductImage'
import { Icon } from '@/components/ui/Icon'
import MoodTabs from '@/components/home/MoodTabs'
import ProductSheet from './ProductSheet'
import { useOpenState } from '@/components/layout/OpenBadge'

export default function MenuBrowser() {
  const storedMood = useStore($mood)
  const cart = useStore($cart)
  const [mounted, setMounted] = useState(false)
  const [soldOut, setSoldOut] = useState<Set<string> | null>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string>(categories[0].id)
  const [selected, setSelected] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const openState = useOpenState()
  const chipsRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => setMounted(true), [])
  const mood = mounted ? storedMood : 'all'

  // How many of each product are already in the cart (any options).
  const inCart = useMemo(() => {
    const map = new Map<string, number>()
    if (mounted) for (const l of cart) map.set(l.productId, (map.get(l.productId) ?? 0) + l.qty)
    return map
  }, [cart, mounted])

  // Availability comes from "the server" (the admin can mark products as sold out).
  useEffect(() => {
    fetchSoldOut().then(setSoldOut)
    return subscribe(() => setSoldOut(readSoldOut()))
  }, [])

  // Deep links: ?p=<product> opens it, ?c=<cart> restores a shared cart, ?q=<text> searches.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const p = params.get('p')
    const c = params.get('c')
    const q = params.get('q')
    if (c) {
      const lines = cartFromParam(c)
      if (lines.length) {
        $cart.set(lines)
        $cartOpen.set(true)
      }
    }
    if (q) setQuery(q)
    if (p && productById.has(p)) setSelected(productById.get(p)!)
    if (p || c || q) history.replaceState(null, '', '/menu' + location.hash)
  }, [])

  const cats = useMemo(() => (mood === 'all' ? categories : categories.filter((c) => c.mode === mood)), [mood])

  const q = normalize(query)
  const visible = useMemo(
    () =>
      cats
        .map((c) => ({
          cat: c,
          items: products.filter((p) => p.categoryId === c.id && (!q || normalize(`${p.name} ${p.description} ${c.name}`).includes(q))),
        }))
        .filter((g) => g.items.length),
    [cats, q],
  )

  useEffect(() => {
    if (visible[0]) setActive(visible[0].cat.id)
  }, [visible])

  // Highlight the category on screen.
  useEffect(() => {
    const els = visible.map((g) => document.getElementById(`cat-${g.cat.id}`)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setActive(top.target.id.replace('cat-', ''))
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [visible])

  useEffect(() => {
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`)
    const bar = chipsRef.current
    if (chip && bar) bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  const showToast = (text: string) => {
    clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-[clamp(2.4rem,7vw,4.5rem)] leading-none font-extrabold">Menú</h1>
            <p className="mt-2 text-muted">Toca un producto para elegir tamaño y adiciones.</p>
          </div>
          <div className="flex flex-col gap-3 lg:w-[440px]">
            <label className="flex items-center gap-3 rounded-[18px] bg-surface px-4 py-1.5 focus-within:ring-2 focus-within:ring-fg/10">
              <Icon name="search" className="size-5 text-muted" />
              <span className="sr-only">Buscar en el menú</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca: fresas, café, oreo…"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-muted"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="grid size-8 place-items-center rounded-full hover:bg-line" aria-label="Borrar búsqueda">
                  <Icon name="close" className="size-4" />
                </button>
              )}
            </label>
            <MoodTabs />
          </div>
        </div>

        {openState && !openState.open && (
          <p className="mt-5 flex items-start gap-3 rounded-2xl bg-tint-mango px-4 py-3.5 text-[15px]" role="status">
            <Icon name="clock" className="mt-0.5 size-5 shrink-0" />
            <span>
              <strong className="font-bold">{openState.label.replace(/\.$/, '')}.</strong> Puedes dejar tu pedido listo y lo preparamos apenas abramos.
            </span>
          </p>
        )}
      </div>

      <div className="glass-light sticky top-16 z-30 mt-5 border-b border-line/70 sm:top-[72px]">
        <div ref={chipsRef} className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6" aria-label="Categorías">
          {visible.map(({ cat }) => (
            <a key={cat.id} href={`#cat-${cat.id}`} data-cat={cat.id} aria-current={active === cat.id ? 'true' : undefined} className="chip shrink-0">
              {cat.name}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-32 sm:px-6">
        {soldOut === null && (
          <span className="sr-only" role="status">
            Cargando disponibilidad…
          </span>
        )}
        {visible.length === 0 && (
          <div className="py-20 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-surface">
              <Icon name="search" className="size-7 text-muted" />
            </span>
            <p className="mt-5 font-display text-2xl font-extrabold">No encontramos “{query}”</p>
            <p className="mt-2 text-muted">Prueba con otra palabra, como “fresa”, “café” o “limonada”.</p>
            <button type="button" onClick={() => setQuery('')} className="btn btn-soft mt-6">
              Ver todo el menú
            </button>
          </div>
        )}

        {visible.map(({ cat, items }) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-36 pt-10 sm:scroll-mt-40" aria-labelledby={`h-${cat.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 id={`h-${cat.id}`} className="font-display text-2xl font-extrabold sm:text-3xl">
                {cat.name}
              </h2>
              <p className="text-sm text-muted sm:text-base">{cat.blurb}</p>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {items.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  tint={cat.tint}
                  count={inCart.get(p.id) ?? 0}
                  soldOut={soldOut?.has(p.id) ?? false}
                  loading={soldOut === null}
                  onOpen={() => setSelected(p)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <ProductSheet
        product={selected}
        soldOut={selected ? (soldOut?.has(selected.id) ?? false) : false}
        onClose={() => setSelected(null)}
        onAdded={(name) => showToast(`${name} agregado`)}
      />

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 lg:bottom-8">
        {toast && (
          <div className="flex items-center gap-2.5 rounded-full bg-white py-2.5 pr-4 pl-2.5 text-[15px] font-bold shadow-[var(--shadow-soft)] motion-safe:animate-[rise-in_300ms_var(--ease-pour)]">
            <span className="grid size-7 place-items-center rounded-full bg-ok text-white">
              <Icon name="check" className="size-4" strokeWidth={3} />
            </span>
            {toast}
          </div>
        )}
      </div>
    </>
  )
}

function ProductRow({
  product: p,
  tint,
  count,
  soldOut,
  loading,
  onOpen,
}: {
  product: Product
  tint: string
  count: number
  soldOut: boolean
  loading: boolean
  onOpen: () => void
}) {
  const hasSizes = p.groups.some((g) => g.id === 'size')
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        disabled={soldOut}
        aria-label={`${p.name}, ${hasSizes ? 'desde ' : ''}${formatCOP(p.price)}${soldOut ? ', agotado hoy' : count ? `, tienes ${count} en tu pedido` : '. Elegir y agregar'}`}
        className={`group flex w-full items-center gap-3.5 rounded-[24px] p-2.5 text-left transition-colors disabled:cursor-not-allowed sm:gap-4 ${
          count ? `${tint}` : 'hover:bg-surface-2'
        }`}
      >
        <div className="relative shrink-0">
          <ProductImage
            imageKey={p.image}
            name={p.name}
            sizes="104px"
            className={`size-[92px] rounded-[18px] sm:size-[104px] ${soldOut ? 'opacity-50 grayscale' : ''}`}
          />
          {p.tag && !soldOut && (
            <span className={`absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${p.tag === 'crown' ? 'bg-mango text-fg' : 'bg-ok text-white'}`}>
              {p.tag === 'crown' ? 'De la casa' : 'Nuevo'}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <h3 className={`text-base leading-snug font-extrabold ${soldOut ? 'text-muted' : ''}`}>{p.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted sm:text-sm">{soldOut ? 'Agotado por hoy' : p.description}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="price text-[15px] font-extrabold">
              {hasSizes && <span className="text-xs font-semibold text-muted">desde </span>}
              {formatCOP(p.price)}
            </p>
            {loading ? (
              <span className="skeleton size-10 rounded-full" aria-hidden="true" />
            ) : soldOut ? null : count ? (
              <span className="price grid size-10 place-items-center rounded-full bg-accent text-sm font-extrabold text-white" aria-hidden="true">
                {count}
              </span>
            ) : (
              <span className="grid size-10 place-items-center rounded-full bg-fg text-white transition-transform group-hover:scale-110" aria-hidden="true">
                <Icon name="plus" className="size-[18px]" strokeWidth={2.6} />
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}
