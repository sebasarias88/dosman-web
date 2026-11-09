import { Icon } from './Icon'

type Props = { value: number; onChange: (v: number) => void; label: string; min?: number; max?: number; size?: 'md' | 'sm' }

export function Stepper({ value, onChange, label, min = 1, max = 20, size = 'md' }: Props) {
  const btn = `grid ${size === 'sm' ? 'size-8' : 'size-10'} place-items-center rounded-xl transition-colors hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent`
  return (
    <div className="inline-flex items-center gap-0.5 rounded-2xl bg-surface p-1" role="group" aria-label={`Cantidad de ${label}`}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Quitar uno de ${label}`}>
        <Icon name={value === 1 && min === 0 ? 'trash' : 'minus'} className="size-4" strokeWidth={2.4} />
      </button>
      <span className="price w-6 text-center font-extrabold" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Agregar uno de ${label}`}>
        <Icon name="plus" className="size-4" strokeWidth={2.4} />
      </button>
    </div>
  )
}
