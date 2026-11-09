import { useEffect, useMemo, useRef, useState } from 'react'
import type { OptionGroup, Product } from '@/data/menu'
import { addToCart, defaultSelections, unitPrice, type Selections } from '@/lib/cart'
import { formatCOP, sleep } from '@/lib/format'
import { ProductImage } from '@/components/ui/ProductImage'
import { Button } from '@/components/ui/Button'
import { Stepper } from '@/components/ui/Stepper'
import { Icon } from '@/components/ui/Icon'

type Props = {
  product: Product | null
  soldOut: boolean
  onClose: () => void
  onAdded: (name: string) => void
}

export default function ProductSheet({ product, soldOut, onClose, onAdded }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [selections, setSelections] = useState<Selections>({})
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (product) {
      setSelections(defaultSelections(product))
      setQty(1)
      setNote('')
      if (!d.open) d.showModal()
    } else if (d.open) d.close()
  }, [product])

  const unit = useMemo(() => (product ? unitPrice(product, selections) : 0), [product, selections])

  const toggle = (g: OptionGroup, optionId: string) => {
    setSelections((prev) => {
      const current = prev[g.id] ?? []
      if (g.type === 'single') return { ...prev, [g.id]: [optionId] }
      if (current.includes(optionId)) return { ...prev, [g.id]: current.filter((x) => x !== optionId) }
      if (g.max && current.length >= g.max) return prev
      return { ...prev, [g.id]: [...current, optionId] }
    })
  }

  const add = async () => {
    if (!product) return
    setAdding(true)
    await sleep(350) // feels like a real request; in production the cart is local and instant
    addToCart(product.id, selections, qty, note.trim())
    setAdding(false)
    onAdded(product.name)
    onClose()
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="sheet-title"
      className="m-0 mt-auto h-[92dvh] max-h-none w-full max-w-none overflow-hidden rounded-t-[30px] bg-white p-0 text-fg shadow-[var(--shadow-float)] md:m-auto md:h-auto md:max-h-[86dvh] md:w-[min(940px,92vw)] md:rounded-[32px]"
    >
      {product && (
        <div className="flex h-full flex-col md:grid md:max-h-[86dvh] md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative shrink-0 md:h-full md:p-3">
            <ProductImage
              imageKey={product.image}
              name={product.name}
              sizes="(min-width: 768px) 440px, 100vw"
              className="h-60 w-full sm:h-72 md:h-full md:rounded-[24px]"
              priority
            />
            <span className="absolute top-2.5 left-1/2 h-1.5 w-11 -translate-x-1/2 rounded-full bg-white/80 md:hidden" aria-hidden="true" />
            <button
              type="button"
              onClick={onClose}
              className="glass-light absolute top-4 right-4 grid size-11 place-items-center rounded-full md:hidden"
              aria-label="Cerrar"
            >
              <Icon name="close" className="size-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div tabIndex={-1} className="flex-1 overflow-y-auto px-5 pt-5 pb-4 outline-none sm:px-7 md:pt-7">
              <div className="flex items-start justify-between gap-4">
                <h2 id="sheet-title" tabIndex={-1} autoFocus className="font-display text-3xl leading-none font-extrabold outline-none sm:text-4xl">
                  {product.name}
                </h2>
                <button type="button" onClick={onClose} className="icon-btn hidden md:grid" aria-label="Cerrar">
                  <Icon name="close" className="size-5" />
                </button>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{product.description}</p>

              {product.groups.map((g) => (
                <fieldset key={g.id} className="mt-6">
                  <legend className="flex w-full items-baseline justify-between gap-3">
                    <span className="text-base font-extrabold">{g.label}</span>
                    <span className="text-[13px] text-muted">{g.type === 'single' ? 'Elige una' : `Opcional${g.max ? `, hasta ${g.max}` : ''}`}</span>
                  </legend>

                  {g.id === 'size' ? (
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      {g.options.map((o) => {
                        const on = selections[g.id]?.includes(o.id) ?? false
                        return (
                          <label
                            key={o.id}
                            className={`cursor-pointer rounded-2xl border-2 px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${on ? 'border-accent bg-tint-fresa' : 'border-line hover:border-fg/20'}`}
                          >
                            <input type="radio" name={`${product.id}-${g.id}`} checked={on} onChange={() => toggle(g, o.id)} className="sr-only" />
                            <span className="block font-bold">{o.label}</span>
                            <span className={`price block text-sm ${on ? 'font-bold text-accent' : 'text-muted'}`}>{formatCOP(o.price)}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : g.type === 'single' ? (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {g.options.map((o) => {
                        const on = selections[g.id]?.includes(o.id) ?? false
                        return (
                          <label
                            key={o.id}
                            className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${on ? 'bg-fg text-white' : 'bg-surface hover:bg-line'}`}
                          >
                            <input type="radio" name={`${product.id}-${g.id}`} checked={on} onChange={() => toggle(g, o.id)} className="sr-only" />
                            {o.label}
                            {o.price > 0 && <span className={`price font-semibold ${on ? 'text-white/70' : 'text-muted'}`}>+{formatCOP(o.price)}</span>}
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-1.5 divide-y divide-line">
                      {g.options.map((o) => {
                        const on = selections[g.id]?.includes(o.id) ?? false
                        const full = !on && !!g.max && (selections[g.id]?.length ?? 0) >= g.max
                        return (
                          <label key={o.id} className={`flex cursor-pointer items-center gap-3 py-3 ${full ? 'cursor-not-allowed opacity-45' : ''}`}>
                            <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(g, o.id)} className="peer sr-only" />
                            <span
                              className={`grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${on ? 'border-accent bg-accent text-white' : 'border-line'}`}
                              aria-hidden="true"
                            >
                              {on && <Icon name="check" className="size-4" strokeWidth={3.2} />}
                            </span>
                            <span className="flex-1 font-semibold">{o.label}</span>
                            <span className="price text-sm text-muted">+ {formatCOP(o.price)}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </fieldset>
              ))}

              <label className="mt-6 block">
                <span className="text-base font-extrabold">¿Algo que debamos saber?</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 140))}
                  rows={2}
                  placeholder="Ej.: sin piña, poco hielo, el queso aparte"
                  className="field mt-2 resize-none"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 border-t border-line px-5 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
              <Stepper value={qty} onChange={setQty} label={product.name} />
              <Button onClick={add} loading={adding} disabled={soldOut} className="flex-1 !justify-between">
                {soldOut ? (
                  'Agotado hoy'
                ) : (
                  <>
                    <span>Agregar</span>
                    <span className="price">{formatCOP(unit * qty)}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
