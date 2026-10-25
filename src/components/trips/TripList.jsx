import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useTripSync } from '../../hooks/useTripSync'
import TripForm from './TripForm'
import { formatDate } from '../../utils/helpers'

function TripCard({ trip, onOpen, onDelete, deleteConfirm, onDeleteClick }) {
  const { state } = useApp()
  const places = state.places.filter(p => p.tripId === trip.id)
  const flights = state.flights.filter(f => f.tripId === trip.id)

  return (
    <div className="relative">
      {deleteConfirm && (
        <div className="absolute inset-0 z-10 bg-white/95 border border-red-200 rounded-xl flex flex-col items-center justify-center gap-3 shadow-lg">
          <p className="text-sm text-slate-700">Delete <strong>{trip.name}</strong>?</p>
          <div className="flex gap-2">
            <button onClick={() => onDeleteClick(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
            <button onClick={() => onDelete(trip.id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
          </div>
        </div>
      )}
      <div
        className="card p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        onClick={() => onOpen(trip)}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-[15px] group-hover:text-blue-700 transition-colors truncate">{trip.name}</h3>
            {(trip.startDate || trip.endDate) && (
              <p className="text-xs text-slate-400 mt-0.5">
                {formatDate(trip.startDate)}{trip.endDate ? ` — ${formatDate(trip.endDate)}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDeleteClick(trip.id) }}
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 rounded flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {trip.cities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {trip.cities.map((c, i) => (
              <span key={c.id} className="flex items-center gap-1 text-xs text-slate-500">
                {i > 0 && <span className="text-slate-300">→</span>}
                {c.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span>{places.length} place{places.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-200">·</span>
          <span>{flights.length} flight{flights.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-200">·</span>
          <span>{trip.cities?.length || 0} cit{trip.cities?.length !== 1 ? 'ies' : 'y'}</span>
        </div>
      </div>
    </div>
  )
}

function JoinTripModal({ onClose, onJoined }) {
  const { state, dispatch } = useApp()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { joinTrip, isConfigured } = useTripSync(null, state, dispatch)

  async function handleJoin() {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    const result = await joinTrip(code)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    onJoined()
    onClose()
  }

  if (!isConfigured) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-bold text-slate-900 text-lg">Join a shared trip</h2>
        <p className="text-sm text-slate-500">Enter the 6-character code from the trip owner.</p>
        <input
          className="input font-mono uppercase text-center text-2xl tracking-widest"
          placeholder="ABC123"
          value={code}
          maxLength={6}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          autoFocus
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleJoin}
            disabled={loading || code.length < 4}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {loading ? 'Joining…' : 'Join Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TripList({ onOpenTrip }) {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { isConfigured } = useTripSync(null, state, dispatch)

  function handleCreate(data) {
    dispatch({ type: 'ADD_TRIP', payload: data })
    setShowForm(false)
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_TRIP', id })
    setDeleteConfirm(null)
  }

  function handleDeleteClick(id) {
    setDeleteConfirm(id)
    if (id) setTimeout(() => setDeleteConfirm(d => d === id ? null : d), 3500)
  }

  const sorted = [...state.trips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Trips</h1>
          <p className="text-sm text-slate-500 mt-1">Plan and organize your multi-city adventures</p>
        </div>
        <div className="flex gap-2">
          {isConfigured && (
            <button onClick={() => setShowJoin(true)} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Join Trip
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Trip
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold mb-1">No trips yet</p>
          <p className="text-sm text-slate-400 mb-6">Create your first trip to start planning</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Create Your First Trip</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              onOpen={onOpenTrip}
              onDelete={handleDelete}
              deleteConfirm={deleteConfirm === trip.id}
              onDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {showForm && <TripForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
      {showJoin && <JoinTripModal onClose={() => setShowJoin(false)} onJoined={() => {}} />}
    </div>
  )
}
