import { useState } from 'react'
import { geocodeCity } from '../../utils/geocoding'
import Modal from '../Modal'

const emptyCity = () => ({ id: Math.random().toString(36).slice(2), name: '', country: '', startDate: '', endDate: '', lat: null, lng: null })

export default function TripForm({ onSave, onClose, initial }) {
  const [name, setName] = useState(initial?.name || '')
  const [startDate, setStartDate] = useState(initial?.startDate || '')
  const [endDate, setEndDate] = useState(initial?.endDate || '')
  const [cities, setCities] = useState(initial?.cities?.length ? initial.cities : [emptyCity()])
  const [saving, setSaving] = useState(false)

  function updateCity(id, field, value) {
    setCities(cs => cs.map(c => c.id === id ? { ...c, [field]: value } : c))
  }
  function addCity() { setCities(cs => [...cs, emptyCity()]) }
  function removeCity(id) { setCities(cs => cs.filter(c => c.id !== id)) }
  function moveCity(id, dir) {
    setCities(cs => {
      const idx = cs.findIndex(c => c.id === id)
      const next = [...cs]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return cs
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  async function handleSave() {
    if (!name.trim()) return
    const validCities = cities.filter(c => c.name.trim())
    if (!validCities.length) return
    setSaving(true)
    const geocoded = await Promise.all(
      validCities.map(async (c, i) => {
        if (c.lat && c.lng) return { ...c, order: i }
        const coords = await geocodeCity(`${c.name}${c.country ? ', ' + c.country : ''}`)
        return { ...c, order: i, lat: coords?.lat || null, lng: coords?.lng || null }
      })
    )
    onSave({ name: name.trim(), startDate, endDate, cities: geocoded })
    setSaving(false)
  }

  return (
    <Modal title={initial ? 'Edit Trip' : 'New Trip'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Trip Name</label>
          <input className="input" placeholder="e.g. Southeast Asia 2025" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Cities (in order)</label>
            <button onClick={addCity} className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors">+ Add City</button>
          </div>
          <div className="space-y-2">
            {cities.map((city, i) => (
              <div key={city.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveCity(city.id, -1)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-30 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => moveCity(city.id, 1)} disabled={i === cities.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-30 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <input className="input flex-1 min-w-0" placeholder="City name" value={city.name} onChange={e => updateCity(city.id, 'name', e.target.value)} />
                  <input className="input w-28 flex-shrink-0" placeholder="Country" value={city.country} onChange={e => updateCity(city.id, 'country', e.target.value)} />
                  {cities.length > 1 && (
                    <button onClick={() => removeCity(city.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 pl-9">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-0.5 block">Arrival</label>
                    <input
                      type="date"
                      className="input py-1.5 text-xs"
                      value={city.startDate}
                      onChange={e => {
                        const val = e.target.value
                        updateCity(city.id, 'startDate', val)
                        if (!city.endDate || city.endDate < val) {
                          updateCity(city.id, 'endDate', val)
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-0.5 block">Departure</label>
                    <input
                      type="date"
                      className="input py-1.5 text-xs"
                      value={city.endDate}
                      min={city.startDate || undefined}
                      onChange={e => updateCity(city.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {saving ? 'Saving...' : initial ? 'Save Changes' : 'Create Trip'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
