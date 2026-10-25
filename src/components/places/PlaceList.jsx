import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import PlaceCard from './PlaceCard'
import PlaceForm from './PlaceForm'
import { CATEGORIES, STATUSES } from '../../utils/helpers'

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

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-sm font-semibold text-slate-700">
          {places.length} place{places.length !== 1 ? 's' : ''}
        </span>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5 px-3">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Place
        </button>
      </div>

      {places.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            className="input max-w-[140px] py-1.5 text-xs"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input w-auto py-1.5 text-xs" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input w-auto py-1.5 text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm text-slate-400 mb-3">
            {places.length === 0 ? `No places saved for ${cityName} yet` : 'No places match your filters'}
          </p>
          {places.length === 0 && (
            <button onClick={() => setShowForm(true)} className="btn-secondary text-xs">Add your first place</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {catOrder.filter(c => grouped[c]).map(cat => (
            <div key={cat}>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{cat}</h4>
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
