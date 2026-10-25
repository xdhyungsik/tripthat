import { useState } from 'react'
import Modal from '../Modal'
import { CATEGORIES, STATUSES, PRICE_RANGES } from '../../utils/helpers'

const defaults = {
  name: '', category: 'Food', address: '', notes: '', link: '',
  status: 'Want to Go', isBackup: false,
  cuisine: '', priceRange: '', mustTryDish: '',
}

function extractNameFromMapsUrl(url) {
  try {
    const u = new URL(url)

    // Standard: /maps/place/NAME/ or /maps/search/NAME/
    const placeMatch = url.match(/\/maps\/(?:place|search)\/([^/@?]+)/)
    if (placeMatch) {
      const name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim()
      if (name && !name.startsWith('!') && name.length > 1) return name
    }

    // Simple q= or query= parameter
    const q = u.searchParams.get('q') || u.searchParams.get('query')
    if (q) return q

    // lqi= is a base64-encoded proto used in complex search/POI URLs
    // The first proto field is the search query string
    const lqi = u.searchParams.get('lqi')
    if (lqi) {
      try {
        const padded = lqi + '=='.slice((lqi.length * 3) % 4)
        const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
        // Pull out all readable ASCII runs, take the longest meaningful one
        const readable = (decoded.match(/[\x20-\x7E]{4,}/g) || [])
          .filter(s => /[a-zA-Z]/.test(s))
        if (readable.length) {
          return readable.reduce((a, b) => a.length > b.length ? a : b).trim()
        }
      } catch {}
    }
  } catch {}
  return ''
}

async function geocodePlace(name, cityName) {
  const q = encodeURIComponent([name, cityName].filter(Boolean).join(', '))
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=1`,
      { headers: { 'Accept-Language': 'en-US,en' } }
    )
    if (!res.ok) return { address: '' }
    const data = await res.json()
    if (!data[0]) return { address: '' }
    const a = data[0].address || {}
    const parts = [
      a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village || a.municipality,
      a.country,
    ].filter(Boolean)
    return { address: parts.join(', ') }
  } catch {
    return { address: '' }
  }
}

export default function PlaceForm({ onSave, onClose, initial, cityName }) {
  const [form, setForm] = useState({ ...defaults, ...initial })
  const [mapsInput, setMapsInput] = useState('')
  const [filling, setFilling] = useState(false)
  const [fillError, setFillError] = useState('')
  const [fillSuccess, setFillSuccess] = useState(false)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const isFood = form.category === 'Food'

  async function runFill() {
    if (!mapsInput.trim()) return
    setFilling(true)
    setFillError('')
    setFillSuccess(false)

    const name = extractNameFromMapsUrl(mapsInput)
    if (!name) {
      setFillError('Could not read place name from this URL.')
      setFilling(false)
      return
    }

    const { address } = await geocodePlace(name, cityName)
    setForm(f => ({
      ...f,
      name: f.name || name,
      address: f.address || address,
      link: f.link || mapsInput,
    }))
    setFillSuccess(true)
    setFilling(false)
  }

  return (
    <Modal title={initial?.id ? 'Edit Place' : `Add Place${cityName ? ' — ' + cityName : ''}`} onClose={onClose} wide>
      <div className="space-y-4">

        {/* Maps autofill */}
        {!initial?.id && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-blue-700">Auto-fill from Google Maps link</p>
            <div className="flex gap-2">
              <input
                className="input text-sm flex-1"
                placeholder="Paste any Google Maps URL…"
                value={mapsInput}
                onChange={e => { setMapsInput(e.target.value); setFillError(''); setFillSuccess(false) }}
                onKeyDown={e => e.key === 'Enter' && runFill()}
              />
              <button
                onClick={runFill}
                disabled={filling || !mapsInput.trim()}
                className="btn-primary text-xs px-3 py-2 whitespace-nowrap disabled:opacity-50 flex-shrink-0"
              >
                {filling ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Filling…
                  </span>
                ) : 'Fill'}
              </button>
            </div>
            {fillError && <p className="text-xs text-red-600">{fillError}</p>}
            {fillSuccess && (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Done — edit any fields below if needed
              </p>
            )}
          </div>
        )}

        <div>
          <label className="label">Name *</label>
          <input className="input" placeholder="Restaurant, attraction, hotel name…" value={form.name} onChange={e => set('name', e.target.value)} autoFocus={!!initial?.id} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {isFood && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
            <div>
              <label className="label">Cuisine</label>
              <input className="input" placeholder="e.g. Thai" value={form.cuisine} onChange={e => set('cuisine', e.target.value)} />
            </div>
            <div>
              <label className="label">Price</label>
              <select className="input" value={form.priceRange} onChange={e => set('priceRange', e.target.value)}>
                <option value="">—</option>
                {PRICE_RANGES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Must-try dish</label>
              <input className="input" placeholder="Optional" value={form.mustTryDish} onChange={e => set('mustTryDish', e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <label className="label">Address or Neighborhood</label>
          <input className="input" placeholder="Street, area, or district" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>

        <div>
          <label className="label">Link</label>
          <input className="input" placeholder="Google Maps, Instagram, article URL…" value={form.link} onChange={e => set('link', e.target.value)} />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={3} placeholder="Why you want to go, tips, things to order…" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => set('isBackup', !form.isBackup)}
            className={`w-9 h-5 rounded-full transition-colors ${form.isBackup ? 'bg-blue-600' : 'bg-slate-200'} relative flex-shrink-0`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isBackup ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-slate-600">Mark as backup option</span>
        </label>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {initial?.id ? 'Save Changes' : 'Add Place'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
