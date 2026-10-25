export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function getDatesInRange(startDate, endDate) {
  const dates = []
  const cur = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function categoryColor(category) {
  const map = {
    Food: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    Sightseeing: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    Accommodation: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    'Night Market': 'bg-pink-500/10 text-pink-300 border-pink-500/20',
    Shopping: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    Other: 'bg-white/5 text-ink-2 border-white/10',
  }
  return map[category] || map.Other
}

export function categoryDotColor(category) {
  const map = {
    Food: '#FB923C',
    Sightseeing: '#38BDF8',
    Accommodation: '#A78BFA',
    'Night Market': '#F472B6',
    Shopping: '#34D399',
    Other: '#9CA3AF',
  }
  return map[category] || map.Other
}

export function statusColor(status) {
  const map = {
    'Want to Go': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    Confirmed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    Done: 'bg-white/5 text-ink-3 border-white/10',
    Skipped: 'bg-red-500/10 text-red-300 border-red-500/20',
  }
  return map[status] || map['Want to Go']
}

// ── Time helpers for flight countdowns and trip status ─────────────────────

// Best-effort absolute time for a flight endpoint: prefer stored UTC, else treat local as browser-local
export function flightInstant(flight, which) {
  const utc = flight[`${which}TimeUTC`]
  const local = flight[`${which}Time`]
  if (utc) return new Date(utc)
  if (local) return new Date(local)
  return null
}

export function formatDuration(mins) {
  if (mins == null || mins < 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

// "in 3d 4h", "in 2h 15m", "in 12m"
export function formatCountdown(ms) {
  const mins = Math.max(0, Math.round(ms / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function flightPhase(flight, now = new Date()) {
  const dep = flightInstant(flight, 'departure')
  const arr = flightInstant(flight, 'arrival')
  if (!dep) return { phase: 'unscheduled', progress: 0 }
  if (now < dep) return { phase: 'upcoming', progress: 0, msUntil: dep - now }
  if (arr && now < arr) return { phase: 'inair', progress: (now - dep) / (arr - dep), msLeft: arr - now }
  return { phase: 'landed', progress: 1 }
}

export function daysUntil(dateStr, now = new Date()) {
  if (!dateStr) return null
  const start = new Date(dateStr + 'T00:00:00')
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((start - today) / 86400000)
}

export function tripPhase(trip, now = new Date()) {
  const toStart = daysUntil(trip.startDate, now)
  const toEnd = daysUntil(trip.endDate || trip.startDate, now)
  if (toStart == null) return { phase: 'draft', label: 'No dates yet' }
  if (toStart > 0) return { phase: 'upcoming', label: toStart === 1 ? 'Tomorrow' : `In ${toStart} days`, days: toStart }
  if (toEnd >= 0) return { phase: 'now', label: 'Happening now' }
  return { phase: 'past', label: 'Completed' }
}

export function tripNights(trip) {
  if (!trip.startDate || !trip.endDate) return null
  return Math.max(0, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))
}

// Short date like "Dec 20"
export function formatShortDate(iso) {
  if (!iso) return ''
  return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDateRange(start, end) {
  if (!start) return ''
  if (!end || end === start) return formatShortDate(start)
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const sameYear = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()
  const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const eStr = sameMonth
    ? e.toLocaleDateString('en-US', { day: 'numeric' })
    : e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${sStr} – ${eStr}, ${e.getFullYear()}`
}

export function openInMaps(place, cityName) {
  if (place.link) {
    window.open(place.link, '_blank', 'noopener')
  } else {
    const q = encodeURIComponent(`${place.name} ${cityName}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener')
  }
}

export function searchReviews(place, cityName) {
  const q = encodeURIComponent(`${place.name} ${cityName} review`)
  window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener')
}

export function formatTimeDisplay(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

// Parse "YYYY-MM-DDTHH:MM" without browser TZ conversion
export function formatTimeLocal(str) {
  if (!str) return ''
  const time = str.slice(11, 16)
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function formatDateTimeLocal(str) {
  if (!str) return ''
  const d = new Date(str.slice(0, 10) + 'T12:00:00')
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${formatTimeLocal(str)}`
}

export const CATEGORIES = ['Food', 'Sightseeing', 'Accommodation', 'Night Market', 'Shopping', 'Other']
export const STATUSES = ['Want to Go', 'Confirmed', 'Done', 'Skipped']
export const PRICE_RANGES = ['$', '$$', '$$$', '$$$$']
