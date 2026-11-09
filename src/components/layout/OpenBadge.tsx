import { useEffect, useState } from 'react'
import { getOpenState, type OpenState } from '@/lib/hours'
import { readSettings, subscribe } from '@/lib/demo-backend'

/** Works out "open / closed" in Colombia time; the admin can force it either way. */
export function useOpenState(): OpenState | null {
  const [state, setState] = useState<OpenState | null>(null)
  useEffect(() => {
    const compute = () => {
      const { openMode } = readSettings()
      if (openMode === 'open') return setState({ open: true, label: 'Abierto ahora' })
      if (openMode === 'closed') return setState({ open: false, label: 'Cerrado por hoy' })
      setState(getOpenState())
    }
    compute()
    const t = setInterval(compute, 60_000)
    const off = subscribe(compute)
    return () => {
      clearInterval(t)
      off()
    }
  }, [])
  return state
}

export default function OpenBadge() {
  const state = useOpenState()
  if (!state) return <span className="block h-9 w-24 rounded-full bg-surface sm:w-40" aria-hidden="true" />
  const short = state.open ? state.label.replace('Abierto hasta las', 'Abierto · hasta') : 'Cerrado'
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-bold ${state.open ? 'bg-ok-soft text-ok' : 'bg-tint-fresa text-danger'}`}
      title={state.label}
    >
      <span className={`size-2 rounded-full ${state.open ? 'bg-ok' : 'bg-danger'}`} aria-hidden="true" />
      <span className="sm:hidden">{state.open ? 'Abierto' : 'Cerrado'}</span>
      <span className="hidden sm:inline">{short}</span>
      <span className="sr-only">: {state.label}</span>
    </span>
  )
}
