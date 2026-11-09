import manifest from '@/data/images.json'
import meta from '@/data/image-meta.json'

type Meta = { widths: number[]; ratio: number; blur: string; color: string }

export type ProductImageData = {
  alt: string
  /** null while `npm run images` hasn't been run yet */
  ready: boolean
  avif?: string
  webp?: string
  src?: string
  blur?: string
  color?: string
}

const entries = manifest.images as Record<string, { unsplash: string; alt: string }>
const metas = meta as Record<string, Meta>

export function getImage(key: string): ProductImageData {
  const entry = entries[key]
  const m = metas[key]
  const alt = entry?.alt ?? ''
  if (!m) return { alt, ready: false }
  const set = (ext: string) => m.widths.map((w) => `/images/products/${key}-${w}.${ext} ${w}w`).join(', ')
  const largest = m.widths[m.widths.length - 1]
  return {
    alt,
    ready: true,
    avif: set('avif'),
    webp: set('webp'),
    src: `/images/products/${key}-${largest >= 800 ? 800 : largest}.webp`,
    blur: m.blur,
    color: m.color,
  }
}
