import { getImage } from '@/lib/images'

type Props = {
  imageKey: string
  name: string
  sizes: string
  className?: string
  priority?: boolean
}

/**
 * Responsive photo (AVIF → WebP) with a blurred preview behind it.
 * If the photos haven't been downloaded yet (`npm run images`), it shows a
 * clean placeholder with the product name instead of a broken image.
 */
export function ProductImage({ imageKey, name, sizes, className = '', priority = false }: Props) {
  const img = getImage(imageKey)
  if (!img.ready) {
    return (
      <div
        className={`grid place-items-center bg-surface ${className}`}
        role="img"
        aria-label={img.alt || name}
      >
        <span
          aria-hidden="true"
          className="brand-mask block aspect-[172/221] w-1/3 max-w-24 text-muted opacity-40"
          style={{ maskImage: 'url(/brand/isotype-current.svg)', WebkitMaskImage: 'url(/brand/isotype-current.svg)' }}
        />
      </div>
    )
  }
  return (
    <picture
      className={`block overflow-hidden ${className}`}
      style={{ backgroundColor: img.color, backgroundImage: `url(${img.blur})`, backgroundSize: 'cover' }}
    >
      <source type="image/avif" srcSet={img.avif} sizes={sizes} />
      <source type="image/webp" srcSet={img.webp} sizes={sizes} />
      <img
        src={img.src}
        alt={img.alt}
        width={800}
        height={1000}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="size-full object-cover"
      />
    </picture>
  )
}
