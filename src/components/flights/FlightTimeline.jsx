import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import FlightForm from './FlightForm'
import { formatDateTime } from '../../utils/helpers'

function FlightCard({ flight, onEdit, onDelete }) {
  const dep = flight.departureTimeUTC ? new Date(flight.departureTimeUTC)
    : flight.departureTime ? new Date(flight.departureTime) : null
  const arr = flight.arrivalTimeUTC ? new Date(flight.arrivalTimeUTC)
    : flight.arrivalTime ? new Date(flight.arrivalTime) : null
  const duration = dep && arr ? Math.round((arr - dep) / 60000) : null

  return (
    <div className="card p-4 group hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            {flight.airline && <span className="text-sm font-semibold text-slate-900">{flight.airline}</span>}
            {flight.flightNumber && (
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">{flight.flightNumber}</span>
            )}
            {flight.confirmationCode && (
              <span className="ml-auto text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {flight.confirmationCode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900">{flight.origin}</div>
              {flight.departureTime && (
                <div className="text-xs text-slate-400 mt-0.5">{formatDateTime(flight.departureTime)}</div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 w-full">
                <div className="flex-1 h-px bg-slate-200" />
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              {duration && (
                <span className="text-[10px] text-slate-400">{Math.floor(duration / 60)}h {duration % 60}m</span>
              )}
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-slate-900">{flight.destination}</div>
              {flight.arrivalTime && (
                <div className="text-xs text-slate-400 mt-0.5">{formatDateTime(flight.arrivalTime)}</div>
              )}
            </div>
          </div>

          {flight.notes && (
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">{flight.notes}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(flight)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => onDelete(flight.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FlightTimeline({ tripId }) {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const sortKey = f => f.departureTimeUTC || f.departureTime || ''
  const flights = state.flights
    .filter(f => f.tripId === tripId)
    .sort((a, b) => !a.departureTime ? 1 : !b.departureTime ? -1 : sortKey(a).localeCompare(sortKey(b)))

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-slate-900 text-lg">Flights <span className="text-slate-400 font-normal text-base">{flights.length}</span></h2>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5 px-3">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Flight
        </button>
      </div>

      {flights.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-sm text-slate-400 mb-3">No flights added yet</p>
          <button onClick={() => setShowForm(true)} className="btn-secondary text-xs">Add your first flight</button>
        </div>
      ) : (
        <div className="space-y-3">
          {flights.map((flight, i) => (
            <div key={flight.id} className="relative">
              {i < flights.length - 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-px h-3 bg-slate-200" />
              )}
              <FlightCard flight={flight} onEdit={setEditing} onDelete={id => dispatch({ type: 'DELETE_FLIGHT', id })} />
            </div>
          ))}
        </div>
      )}

      {showForm && <FlightForm onSave={data => { dispatch({ type: 'ADD_FLIGHT', payload: { ...data, tripId } }); setShowForm(false) }} onClose={() => setShowForm(false)} />}
      {editing && <FlightForm initial={editing} onSave={data => { dispatch({ type: 'UPDATE_FLIGHT', id: editing.id, payload: data }); setEditing(null) }} onClose={() => setEditing(null)} />}
    </div>
  )
}
