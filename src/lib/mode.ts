import { persistentAtom } from '@nanostores/persistent'

/** What the visitor feels like: everything, cold things or hot drinks. Filters the menu. */
export type Mood = 'all' | 'cold' | 'hot'

export const $mood = persistentAtom<Mood>('dosman:mood', 'all')

export function applyMood(mood: Mood) {
  document.documentElement.dataset.mode = mood === 'hot' ? 'hot' : 'cold'
  window.dispatchEvent(new CustomEvent('dosman:mode', { detail: mood }))
}

export function setMood(mood: Mood) {
  $mood.set(mood)
  applyMood(mood)
}
