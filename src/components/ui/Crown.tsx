/** Crown cut from the official Dosman isotype; marks the house favorites. */
export function Crown({ className = 'h-3.5' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`brand-mask inline-block aspect-[155/74] ${className}`}
      style={{ maskImage: 'url(/brand/crown.svg)', WebkitMaskImage: 'url(/brand/crown.svg)' }}
    />
  )
}
