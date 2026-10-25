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
    Food: 'bg-orange-50 text-orange-700 border-orange-200',
    Sightseeing: 'bg-blue-50 text-blue-700 border-blue-200',
    Accommodation: 'bg-violet-50 text-violet-700 border-violet-200',
    'Night Market': 'bg-pink-50 text-pink-700 border-pink-200',
    Shopping: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Other: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return map[category] || map.Other
}

export function categoryDotColor(category) {
  const map = {
    Food: '#f97316',
    Sightseeing: '#3b82f6',
    Accommodation: '#8b5cf6',
    'Night Market': '#ec4899',
    Shopping: '#10b981',
    Other: '#94a3b8',
  }
  return map[category] || map.Other
}

export function statusColor(status) {
  const map = {
    'Want to Go': 'bg-amber-50 text-amber-700 border-amber-200',
    Confirmed: 'bg-green-50 text-green-700 border-green-200',
    Done: 'bg-slate-100 text-slate-500 border-slate-200',
    Skipped: 'bg-red-50 text-red-500 border-red-200',
  }
  return map[status] || map['Want to Go']
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
