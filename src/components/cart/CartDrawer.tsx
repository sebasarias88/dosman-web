import { useStore } from '@nanostores/react'
import { useEffect, useRef, useState } from 'react'
import { $cart, $cartOpen, $cartSubtotal, $pricedCart, cartToParam, setQty } from '@/lib/cart'
import { formatCOP } from '@/lib/format'
import { ProductImage } from '@/components/ui/ProductImage'
import { Stepper } from '@/components/ui/Stepper'
import { Icon } from '@/components/ui/Icon'

export default function CartDrawer() {
  const open = useStore($cartOpen)
  const lines = useStore($pricedCart)
  const subtotal = useStore($cartSubtotal)
  const ref = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)
  // The cart lives in localStorage, so it only exists after mounting (avoids a hydration mismatch).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const copyLink = async () => {
    const url = `${location.origin}/menu?c=${cartToParam($cart.get())}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      prompt('Copia este enlace para abrir tu pedido en otro celular:', url)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const count = lines.reduce((n, l) => n + l.qty, 0)

  return (
    <dialog
      ref={ref}
      onClose={() => $cartOpen.set(false)}
      onClick={(e) => e.target === ref.current && $cartOpen.set(false)}
      aria-labelledby="cart-title"
      className="m-0 mt-auto ml-auto h-[88dvh] max-h-none w-full max-w-none overflow-hidden rounded-t-[30px] bg-white p-0 text-fg shadow-[var(--shadow-float)] sm:m-3 sm:ml-auto sm:h-[calc(100dvh-1.5rem)] sm:w-[440px] sm:rounded-[30px]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 id="cart-title" className="font-display text-3xl font-extrabold">
              Tu pedido
            </h2>
            {mounted && count > 0 && (
              <p className="text-sm text-muted">
                {count} {count === 1 ? 'producto' : 'productos'}
              </p>
            )}
          </div>
          <button type="button" onClick={() => $cartOpen.set(false)} className="icon-btn" aria-label="Cerrar tu pedido">
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {!mounted ? null : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-tint-fresa text-accent">
              <Icon name="bag" className="size-9" />
            </span>
            <p className="mt-2 font-display text-2xl font-extrabold">Todavía no hay nada aquí</p>
            <p className="text-muted">Abre el menú, toca lo que se te antoje y aparecerá en tu pedido.</p>
            <a href="/menu" className="btn btn-primary mt-3" onClick={() => $cartOpen.set(false)}>
              Ver el menú
            </a>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-2 overflow-y-auto px-3">
              {lines.map((l) => (
                <li key={l.lineId} className="flex gap-3 rounded-[22px] p-2 hover:bg-surface-2">
                  <ProductImage imageKey={l.product.image} name={l.product.name} sizes="80px" className="size-20 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="leading-snug font-extrabold">{l.product.name}</p>
                      <p className="price shrink-0 font-extrabold">{formatCOP(l.total)}</p>
                    </div>
                    {l.detail && <p className="mt-0.5 text-[13px] leading-snug text-muted">{l.detail}</p>}
                    {l.note && <p className="mt-0.5 text-[13px] text-muted italic">“{l.note}”</p>}
                    <div className="mt-2">
                      <Stepper value={l.qty} onChange={(q) => setQty(l.lineId, q)} label={l.product.name} min={0} size="sm" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-muted">Subtotal</span>
                <span className="price font-display text-3xl font-extrabold">{formatCOP(subtotal)}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted">El domicilio se calcula en el siguiente paso.</p>
              <a href="/checkout" className="btn btn-primary mt-4 w-full !justify-between">
                <span>Continuar</span>
                <Icon name="arrow" className="size-5" />
              </a>
              <button type="button" onClick={copyLink} className="mt-2 flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-muted hover:text-fg">
                <Icon name={copied ? 'check' : 'copy'} className="size-4" />
                {copied ? 'Enlace copiado' : 'Copiar enlace de este pedido'}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}
