import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { categoryById, products, modeOfProduct, type Product } from '@/data/menu'
import { $mood, type Mood } from '@/lib/mode'
import { formatCOP } from '@/lib/format'
import { ProductImage } from '@/components/ui/ProductImage'
import { Icon } from '@/components/ui/Icon'

const FAVORITES = ['fresas-crema', 'limonada-hierbabuena', 'malteada-oreo', 'cholao-clasico', 'ensalada-frutas', 'iced-latte', 'cappuccino', 'fresas-oreo']

function pick(mood: Mood): Product[] {
  const fav = FAVORITES.map((id) => products.find((p) => p.id === id)!).filter(Boolean)
  if (mood === 'all') return fav.slice(0, 4)
  const byMood = products.filter((p) => modeOfProduct(p) === mood)
  const sorted = [...fav.filter((p) => modeOfProduct(p) === mood), ...byMood.filter((p) => !FAVORITES.includes(p.id))]
  return sorted.slice(0, 4)
}

/** "Los más pedidos": follows the Todo / Frío / Caliente filter. */
export default function FeaturedGrid() {
  const stored = useStore($mood)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const list = pick(mounted ? stored : 'all')

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {list.map((p) => (
        <li key={p.id}>
          <a
            href={`/menu?p=${p.id}`}
            aria-label={`${p.name}, ${formatCOP(p.price)}. Elegir y agregar`}
            className={`group relative block rounded-[24px] p-2.5 transition-transform duration-300 hover:-translate-y-1 ${categoryById.get(p.categoryId)?.tint ?? 'bg-surface'}`}
          >
            <ProductImage
              imageKey={p.image}
              name={p.name}
              sizes="(min-width: 1024px) 280px, 45vw"
              className="aspect-[4/3.4] w-full rounded-[18px] sm:aspect-[4/3.6]"
            />
            <p className="mt-2.5 pr-11 pl-1 text-[15px] leading-snug font-extrabold sm:text-base">{p.name}</p>
            <p className="price mt-0.5 mb-1 px-1 text-sm font-bold text-muted">{formatCOP(p.price)}</p>
            <span className="absolute right-2.5 bottom-2.5 grid size-10 place-items-center rounded-full bg-fg text-white transition-transform group-hover:scale-110" aria-hidden="true">
              <Icon name="plus" className="size-[18px]" strokeWidth={2.6} />
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
