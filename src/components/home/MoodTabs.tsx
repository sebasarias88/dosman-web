import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { $mood, setMood, type Mood } from '@/lib/mode'
import { Icon } from '@/components/ui/Icon'

const items: { value: Mood; label: string; icon?: 'snow' | 'cup' }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'cold', label: 'Frío', icon: 'snow' },
  { value: 'hot', label: 'Caliente', icon: 'cup' },
]

/** Todo / Frío / Caliente — filters what the visitor sees. */
export default function MoodTabs({ className = '' }: { className?: string }) {
  const stored = useStore($mood)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const mood = mounted ? stored : 'all'
  return (
    <div role="radiogroup" aria-label="¿Frío o caliente?" className={`flex gap-2 ${className}`}>
      {items.map((it) => (
        <button key={it.value} type="button" role="radio" aria-checked={mood === it.value} onClick={() => setMood(it.value)} className="chip">
          {it.icon && <Icon name={it.icon} className="size-4" />}
          {it.label}
        </button>
      ))}
    </div>
  )
}
