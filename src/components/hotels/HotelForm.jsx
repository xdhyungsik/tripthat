import { useState } from 'react'
import Modal from '../Modal'

const defaults = {
  name: '', address: '', checkIn: '', checkOut: '', notes: '', mapsUrl: '',
}

async function parseMapsUrl(url) {
  const trimmed = url.trim()

  // Short links (maps.app.goo.gl) can't be followed due to CORS — need full URL
  if (trimmed.includes('maps.app.goo.gl')) {
    return { error: 'Short link detected. In Google Maps, tap Share → Copy link, then choose "Copy link to place" (the long URL) instead of the shortened one.' }
  }

  if (!trimmed.includes('google.com/maps')) {
    return { error: 'Paste a Google Maps URL (should contain google.com/maps).' }
  }

  // Extract place name from /maps/place/NAME/
  const placeMatch = trimmed.match(/maps\/(?:place|search)\/([^/@?]+)/)
  let name = ''
  if (placeMatch) {
    name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim()
    // Clean up URL-encoded Thai/unicode chars that decode fine
    if (name.startsWith('!') || name.length < 2) name = ''
  }

  // Extract coordinates from @lat,lng
  const coordMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (!coordMatch) {
    // No coords in URL — try geocoding by name if we have one
    if (name) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en-US,en' } }
        )
        const data = await res.json()
        if (data[0]) {
          return { name, address: data[0].display_name || '' }
        }
      } catch {}
      return { name, address: '' }
    }
    return { error: 'Could not find coordinates in this URL. Try opening the place in Google Maps on desktop and copying the URL from the address bar.' }
  }

  const lat = coordMatch[1]
  const lon = coordMatch[2]

  let address = ''
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en-US,en' } }
    )
    if (res.ok) {
      const data = await res.json()
      const a = data.address || {}
      const parts = [
        a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
        a.suburb || a.neighbourhood || a.quarter,
        a.city || a.town || a.village || a.municipality,
        a.country,
      ].filter(Boolean)
      address = parts.join(', ')
      if (!name && data.name) name = data.name
    }
  } catch {}

  return { name, address }
}

export default function HotelForm({ onSave, onClose, initial }) {
  const [form, setForm] = useState({ ...defaults, ...initial })
  const [mapsInput, setMapsInput] = useState(initial?.mapsUrl || '')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parseSuccess, setParseSuccess] = useState(false)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  async function runAutofill() {
    if (!mapsInput.trim()) return
    setParsing(true)
    setParseError('')
    setParseSuccess(false)
    const result = await parseMapsUrl(mapsInput)
    setParsing(false)
    if (result.error) {
      setParseError(result.error)
      return
    }
    setForm(f => ({
      ...f,
      mapsUrl: mapsInput,
      name: f.name || result.name || '',
      address: f.address || result.address || '',
    }))
    setParseSuccess(true)
  }

  const canSave = form.name.trim()

  return (
    <Modal title={initial?.id ? 'Edit Hotel' : 'Add Hotel'} onClose={onClose}>
      <div className="space-y-4">

        {/* Google Maps auto-fill */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-700">Auto-fill from Google Maps link</p>
          <div className="flex gap-2">
            <input
              className="input text-sm flex-1"
              placeholder="Paste a Google Maps URL and click Fill…"
              value={mapsInput}
              onChange={e => { setMapsInput(e.target.value); setParseError(''); setParseSuccess(false) }}
              onKeyDown={e => e.key === 'Enter' && runAutofill()}
            />
            <button
              onClick={runAutofill}
              disabled={parsing || !mapsInput.trim()}
              className="btn-primary text-xs px-3 py-2 whitespace-nowrap disabled:opacity-50 flex-shrink-0"
            >
              {parsing ? (
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
          {parseError && <p className="text-xs text-red-600">{parseError}</p>}
          {parseSuccess && (
            <p className="text-xs text-green-700 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Done — edit any fields below if needed
            </p>
          )}
        </div>

        <div>
          <label className="label">Hotel Name *</label>
          <input
            className="input"
            placeholder="e.g. Marina Bay Sands"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="label">Address</label>
          <input
            className="input"
            placeholder="e.g. 10 Bayfront Ave, Singapore"
            value={form.address}
            onChange={e => set('address', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Check-in</label>
            <input
              type="datetime-local"
              className="input"
              value={form.checkIn}
              onChange={e => {
                set('checkIn', e.target.value)
                if (!form.checkOut || form.checkOut < e.target.value) {
                  set('checkOut', e.target.value)
                }
              }}
            />
          </div>
          <div>
            <label className="label">Check-out</label>
            <input
              type="datetime-local"
              className="input"
              value={form.checkOut}
              min={form.checkIn || undefined}
              onChange={e => set('checkOut', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Room type, parking, early check-in…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {initial?.id ? 'Save Changes' : 'Add Hotel'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
