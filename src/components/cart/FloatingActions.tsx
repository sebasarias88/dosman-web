import { useStore } from '@nanostores/react'
import { useEffect, useRef, useState } from 'react'
import { $cartCount, $cartOpen, $cartSubtotal } from '@/lib/cart'
import { formatCOP } from '@/lib/format'
import { store } from '@/data/store'
import { Icon } from '@/components/ui/Icon'

/**
 * Floating actions on public pages:
 * - Phone: the frosted cart bar while the cart has items; otherwise the WhatsApp button.
 *   Never both at once.
 * - Desktop (lg+): only the WhatsApp button. The cart lives in the header.
 */
export default function FloatingActions({ hideCartBar = false }: { hideCartBar?: boolean }) {
  const count = useStore($cartCount)
  const total = useStore($cartSubtotal)
  const drawerOpen = useStore($cartOpen)
  const [mounted, setMounted] = useState(false)
  const [bump, setBump] = useState(false)
  const prev = useRef(0)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!mounted) return
    if (count > prev.current) {
      setBump(true)
      const t = setTimeout(() => setBump(false), 420)
      prev.current = count
      return () => clearTimeout(t)
    }
    prev.current = count
  }, [count, mounted])

  const showBar = mounted && !hideCartBar && count > 0 && !drawerOpen
  const waText = encodeURIComponent('Hola Dosman, tengo una pregunta.')

  return (
    <>
      <a
        href={`https://wa.me/${store.whatsapp}?text=${waText}`}
        target="_blank"
        rel="noopener"
        aria-label="Escribir a Dosman por WhatsApp"
        className={`fixed right-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_-6px_rgb(37_211_102/0.55)] transition-transform hover:scale-105 sm:right-6 size-14 lg:grid ${
          showBar ? 'hidden' : 'grid'
        } ${drawerOpen ? 'pointer-events-none opacity-0' : ''}`}
      >
        <Icon name="whatsapp" className="size-7" strokeWidth={1.9} />
      </a>

      {showBar && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:hidden">
          <button
            type="button"
            onClick={() => $cartOpen.set(true)}
            aria-label={`Ver tu pedido: ${count} ${count === 1 ? 'producto' : 'productos'}, ${formatCOP(total)}`}
            className="glass-dark pointer-events-auto flex h-16 w-full max-w-[520px] items-center gap-3 rounded-[22px] pr-2 pl-3 text-white shadow-[var(--shadow-float)] motion-safe:animate-[rise-in_450ms_var(--ease-pour)]"
          >
            <span className={`relative grid size-11 place-items-center rounded-[14px] bg-accent transition-transform duration-300 ${bump ? 'scale-115' : ''}`}>
              <Icon name="bag" className="size-[22px]" />
              <span className="price absolute -top-1.5 -right-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-mango px-1 text-xs font-extrabold text-fg ring-2 ring-fg">
                {count}
              </span>
            </span>
            <span className="price flex-1 text-left text-lg font-extrabold">{formatCOP(total)}</span>
            <span className="rounded-2xl bg-white px-4 py-3 text-[15px] font-extrabold text-fg">Ver pedido</span>
          </button>
        </div>
      )}
    </>
  )
}
