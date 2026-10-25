import { useState } from 'react'
import Modal from '../Modal'

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY

const defaults = {
  airline: '', flightNumber: '', origin: '', destination: '',
  departureTime: '', arrivalTime: '', confirmationCode: '', notes: '',
  originCoords: null, destinationCoords: null,
}

function parseLocalTime(str) {
  // Returns local display string "YYYY-MM-DDTHH:MM" and UTC ISO for sorting
  if (!str) return { local: '', utc: '' }
  const withT = str.replace(' ', 'T')
  const local = withT.slice(0, 16)
  try {
    const d = new Date(withT)
    if (!isNaN(d.getTime())) return { local, utc: d.toISOString() }
  } catch {}
  return { local, utc: '' }
}

export default function FlightForm({ onSave, onClose, initial }) {
  const [form, setForm] = useState({ ...defaults, ...initial })
  const [lookupDate, setLookupDate] = useState(
    initial?.departureTime ? initial.departureTime.slice(0, 10) : ''
  )
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [lookupSuccess, setLookupSuccess] = useState(false)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  async function lookupFlight() {
    if (!form.flightNumber.trim() || !lookupDate) {
      setLookupError('Enter a flight number and date first.')
      return
    }
    setLookingUp(true)
    setLookupError('')
    setLookupSuccess(false)
    try {
      const num = form.flightNumber.trim().replace(/\s+/g, '')
      const res = await fetch(
        `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(num)}/${lookupDate}`,
        {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
          },
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `Flight not found (${res.status})`)
      }
      const data = await res.json()
      const flight = Array.isArray(data) ? data[0] : data
      if (!flight) throw new Error('No flight data returned.')

      const dep = parseLocalTime(flight.departure?.scheduledTime?.local)
      const arr = parseLocalTime(flight.arrival?.scheduledTime?.local)

      setForm(f => ({
        ...f,
        origin: flight.departure?.airport?.iata || f.origin,
        destination: flight.arrival?.airport?.iata || f.destination,
        airline: flight.airline?.name || f.airline,
        departureTime: dep.local || f.departureTime,
        departureTimeUTC: dep.utc || f.departureTimeUTC,
        arrivalTime: arr.local || f.arrivalTime,
        arrivalTimeUTC: arr.utc || f.arrivalTimeUTC,
        originCoords: flight.departure?.airport?.location
          ? { lat: flight.departure.airport.location.lat, lng: flight.departure.airport.location.lon }
          : f.originCoords,
        destinationCoords: flight.arrival?.airport?.location
          ? { lat: flight.arrival.airport.location.lat, lng: flight.arrival.airport.location.lon }
          : f.destinationCoords,
      }))
      setLookupSuccess(true)
    } catch (e) {
      setLookupError(e.message || 'Could not look up flight.')
    } finally {
      setLookingUp(false)
    }
  }

  const canSave = form.origin.trim() && form.destination.trim()

  return (
    <Modal title={initial?.id ? 'Edit Flight' : 'Add Flight'} onClose={onClose} wide>
      <div className="space-y-4">

        {/* Autofill row */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-3">
          <p className="text-xs font-semibold text-blue-700">Auto-fill from flight number</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="label text-xs">Flight Number</label>
              <input
                className="input text-sm font-mono uppercase"
                placeholder="e.g. AA100, SQ321"
                value={form.flightNumber}
                onChange={e => { set('flightNumber', e.target.value.toUpperCase()); setLookupSuccess(false) }}
                onKeyDown={e => e.key === 'Enter' && lookupFlight()}
              />
            </div>
            <div className="flex-1">
              <label className="label text-xs">Date</label>
              <input
                type="date"
                className="input text-sm"
                value={lookupDate}
                onChange={e => { setLookupDate(e.target.value); setLookupSuccess(false) }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={lookupFlight}
                disabled={lookingUp || !form.flightNumber.trim() || !lookupDate}
                className="btn-primary text-xs py-2 px-3 disabled:opacity-50 whitespace-nowrap"
              >
                {lookingUp ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Looking…
                  </span>
                ) : 'Look up'}
              </button>
            </div>
          </div>
          {lookupError && (
            <p className="text-xs text-red-600">{lookupError}</p>
          )}
          {lookupSuccess && (
            <p className="text-xs text-green-700 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Flight found — fields filled in below
            </p>
          )}
        </div>

        {/* Airline (auto-filled or manual) */}
        <div>
          <label className="label">Airline</label>
          <input className="input" placeholder="e.g. Singapore Airlines" value={form.airline} onChange={e => set('airline', e.target.value)} />
        </div>

        {/* Route */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">From *</label>
            <input className="input font-mono uppercase" placeholder="JFK / New York" value={form.origin} onChange={e => set('origin', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="label">To *</label>
            <input className="input font-mono uppercase" placeholder="NRT / Tokyo" value={form.destination} onChange={e => set('destination', e.target.value.toUpperCase())} />
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Departure</label>
            <input
              type="datetime-local"
              className="input"
              value={form.departureTime}
              onChange={e => {
                set('departureTime', e.target.value)
                if (!form.arrivalTime || form.arrivalTime < e.target.value) {
                  set('arrivalTime', e.target.value)
                }
              }}
            />
          </div>
          <div>
            <label className="label">Arrival</label>
            <input
              type="datetime-local"
              className="input"
              value={form.arrivalTime}
              min={form.departureTime || undefined}
              onChange={e => set('arrivalTime', e.target.value)}
            />
          </div>
        </div>

        {/* Confirmation */}
        <div>
          <label className="label">Confirmation Code</label>
          <input className="input font-mono uppercase" placeholder="e.g. ABC123" value={form.confirmationCode} onChange={e => set('confirmationCode', e.target.value.toUpperCase())} />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={2} placeholder="Seat, terminal, baggage info…" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {initial?.id ? 'Save Changes' : 'Add Flight'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
