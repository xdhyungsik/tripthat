import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import PlaceCard from './PlaceCard'
import PlaceForm from './PlaceForm'
import { Plus, MapPin } from '../icons'
import { CATEGORIES, STATUSES, categoryDotColor } from '../../utils/helpers'

export default function PlaceList({ tripId, cityId, cityName }) {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [search, setSearch] = useState('')

  const places = useMemo(() =>
    state.places.filter(p => p.tripId === tripId && p.cityId === cityId),
    [state.places, tripId, cityId]
  )

  const filtered = useMemo(() => places.filter(p => {
    if (filterCat !== 'All' && p.category !== filterCat) return false
    if (filterStatus !== 'All' && p.status !== filterStatus) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.notes?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [places, filterCat, filterStatus, search])

  function handleAdd(data) {
    dispatch({ type: 'ADD_PLACE', payload: { ...data, tripId, cityId } })
    setShowForm(false)
  }

  const catOrder = ['Accommodation', 'Food', 'Sightseeing', 'Night Market', 'Shopping', 'Other']
  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(p => { (g[p.category] = g[p.category] || []).push(p) })
    return g
  }, [filtered])

  const countFor = cat => places.filter(p => p.category === cat).length
  const usedCats = CATEGORIES.filter(c => countFor(c) > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-lg font-bold text-ink tracking-tight font-display">
          {cityName} <span className="text-ink-4 font-semibold">{places.length}</span>
        </h3>
        <button onClick={() => setShowForm(true)} className="btn-primary py-2 px-3.5">
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          Add
        </button>
      </div>

      {places.length > 0 && (
        <div className="space-y-2.5 mb-4">
          <div className="flex gap-2">
            <input
              className="input py-2"
              placeholder={`Search ${cityName}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="input w-auto py-2 text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Filter by status">
              <option value="All">Any status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {usedCats.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {['All', ...usedCats].map(cat => {
                const on = filterCat === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${on ? 'bg-white text-bg border-white' : 'bg-surface text-ink-2 border-white/[0.08] hover:border-white/20'}`}
                  >
                    {cat !== 'All' && <span className="w-2 h-2 rounded-full" style={{ background: categoryDotColor(cat) }} />}
                    {cat}
                    <span className={on ? 'text-bg/50' : 'text-ink-4'}>{cat === 'All' ? places.length : countFor(cat)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        places.length === 0 ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full text-center py-12 rounded-3xl border border-dashed border-white/10 hover:border-accent/40 hover:bg-accent/[0.04] transition-colors group"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-ink">Save your first spot in {cityName}</p>
            <p className="text-xs text-ink-3 mt-1">Restaurants, sights, markets — paste a Google Maps link to autofill</p>
          </button>
        ) : (
          <p className="text-sm text-ink-3 text-center py-10">No places match your filters</p>
        )
      ) : (
        <div className="space-y-5">
          {catOrder.filter(c => grouped[c]).map(cat => (
            <div key={cat}>
              <h4 className="eyebrow mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: categoryDotColor(cat) }} />
                {cat}
              </h4>
              <div className="space-y-2">
                {grouped[cat].map(place => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    cityName={cityName}
                    onUpdate={(id, data) => dispatch({ type: 'UPDATE_PLACE', id, payload: data })}
                    onDelete={id => dispatch({ type: 'DELETE_PLACE', id })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <PlaceForm cityName={cityName} onSave={handleAdd} onClose={() => setShowForm(false)} />}
    </div>
  )
}
