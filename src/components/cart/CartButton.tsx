import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { $cartCount, $cartOpen } from '@/lib/cart'
import { Icon } from '@/components/ui/Icon'

export default function CartButton() {
  const count = useStore($cartCount)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const n = mounted ? count : 0
  return (
    <button
      type="button"
      id="cart-button"
      onClick={() => $cartOpen.set(true)}
      aria-label={n ? `Ver tu pedido, ${n} ${n === 1 ? 'producto' : 'productos'}` : 'Ver tu pedido, vacío'}
      className="icon-btn relative"
    >
      <Icon name="bag" className="size-[22px]" />
      {n > 0 && (
        <span className="price absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-white ring-2 ring-white">
          {n}
        </span>
      )}
    </button>
  )
}
