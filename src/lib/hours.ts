import { store } from '@/data/store'

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Day and minutes in Colombia time, whatever the visitor's own time zone is. */
function bogotaNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0'
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return { day: days.indexOf(get('weekday')), minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'p. m.' : 'a. m.'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export type OpenState = { open: boolean; label: string }

export function getOpenState(date = new Date()): OpenState {
  const { day, minutes } = bogotaNow(date)
  const today = store.hours.find((h) => (h.days as readonly number[]).includes(day))
  if (today) {
    const open = toMinutes(today.open)
    const close = toMinutes(today.close)
    if (minutes >= open && minutes < close) return { open: true, label: `Abierto hasta las ${formatTime(today.close)}` }
    if (minutes < open) return { open: false, label: `Cerrado · abrimos hoy a las ${formatTime(today.open)}` }
  }
  const tomorrow = store.hours.find((h) => (h.days as readonly number[]).includes((day + 1) % 7))
  return { open: false, label: tomorrow ? `Cerrado · abrimos mañana a las ${formatTime(tomorrow.open)}` : 'Cerrado' }
}
