import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { normalize } from '@/lib/format'

export type ComboOption = { value: string; label: string; hint?: string; disabled?: boolean; reason?: string }

type Props = {
  label: string
  options: ComboOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  id?: string
}

/**
 * Custom dropdown that replaces the native <select>.
 * - The list lives in the top layer (Popover API) so no panel or dialog clips it.
 * - Full keyboard: arrows, Home/End, Enter, Escape, type to jump.
 * - Adds a search box automatically when there are more than 8 options.
 */
export function Combobox({ label, options, value, onChange, placeholder = 'Elegir…', invalid, id }: Props) {
  const autoId = useId()
  const baseId = id ?? autoId
  const listId = `${baseId}-list`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, up: false })
  const typed = useRef({ text: '', at: 0 })

  const searchable = options.length > 8
  const visible = useMemo(
    () => (query ? options.filter((o) => normalize(o.label).includes(normalize(query))) : options),
    [options, query],
  )
  const selected = options.find((o) => o.value === value)

  const place = () => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const listH = Math.min(320, visible.length * 52 + (searchable ? 64 : 12))
    const up = window.innerHeight - r.bottom < listH + 16 && r.top > listH + 16
    setPos({ top: up ? r.top - listH - 8 : r.bottom + 8, left: r.left, width: r.width, up })
  }

  useLayoutEffect(() => {
    const pop = popRef.current
    if (!pop) return
    if (open) {
      place()
      try {
        pop.showPopover()
      } catch {}
      const i = Math.max(0, visible.findIndex((o) => o.value === value))
      setActive(i)
      requestAnimationFrame(() => (searchable ? searchRef.current : pop)?.focus())
    } else {
      try {
        pop.hidePopover()
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onMove = () => place()
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!popRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false)
    }
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
      document.removeEventListener('pointerdown', onDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visible.length])

  const choose = (o: ComboOption | undefined) => {
    if (!o || o.disabled) return
    onChange(o.value)
    setOpen(false)
    setQuery('')
    triggerRef.current?.focus()
  }

  const move = (delta: number) => {
    if (!visible.length) return
    let i = active
    for (let step = 0; step < visible.length; step++) {
      i = (i + delta + visible.length) % visible.length
      if (!visible[i].disabled) break
    }
    setActive(i)
    document.getElementById(`${baseId}-opt-${i}`)?.scrollIntoView({ block: 'nearest' })
  }

  const onListKey = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(visible.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        choose(visible[active])
        break
      case 'Escape':
        // Close only the list, never the dialog that contains it.
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        triggerRef.current?.focus()
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        if (!searchable && e.key.length === 1) {
          const now = Date.now()
          typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + e.key, at: now }
          const i = visible.findIndex((o) => normalize(o.label).startsWith(normalize(typed.current.text)))
          if (i >= 0) setActive(i)
        }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className={`field flex items-center justify-between gap-3 text-left ${invalid ? 'border-danger' : ''}`}
      >
        <span className={selected ? '' : 'text-muted'}>
          {selected ? selected.label : placeholder}
          {selected?.hint && <span className="ml-2 text-muted">{selected.hint}</span>}
        </span>
        <svg className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      <div
        ref={popRef}
        popover="manual"
        tabIndex={-1}
        onKeyDown={onListKey}
        className="m-0 overflow-hidden rounded-2xl border border-line bg-white p-1.5 text-fg shadow-[var(--shadow-float)]"
        style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, maxHeight: 320, inset: 'auto' as const, translate: 'none' }}
      >
        {searchable && (
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            placeholder="Buscar…"
            aria-label={`Buscar en ${label}`}
            aria-controls={listId}
            aria-activedescendant={visible[active] ? `${baseId}-opt-${active}` : undefined}
            className="field mb-1.5 py-2"
          />
        )}
        <ul id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto">
          {visible.length === 0 && <li className="px-3 py-3 text-muted">Sin resultados para “{query}”</li>}
          {visible.map((o, i) => {
            const isSel = o.value === value
            return (
              <li
                key={o.value}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.disabled || undefined}
                onPointerEnter={() => !o.disabled && setActive(i)}
                onClick={() => choose(o)}
                className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl px-3 py-2.5 ${
                  i === active ? 'bg-surface' : ''
                } ${o.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span>
                  <span className="block font-medium">{o.label}</span>
                  {(o.reason || o.hint) && <span className="block text-sm text-muted">{o.disabled ? o.reason : o.hint}</span>}
                </span>
                {isSel && (
                  <svg className="mt-1 size-4 shrink-0" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
