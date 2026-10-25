import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import HotelForm from './HotelForm'
import { formatDateTimeLocal } from '../../utils/helpers'

function HotelCard({ hotel, onEdit, onDelete }) {
  function openMaps() {
    if (hotel.mapsUrl) {
      window.open(hotel.mapsUrl, '_blank', 'noopener')
    } else {
      const q = encodeURIComponent(hotel.address || hotel.name)
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener')
    }
  }

  return (
    <div className="card p-4 group hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-semibold text-ink text-sm">{hotel.name}</span>
          </div>

          {hotel.address && (
            <button
              onClick={openMaps}
              className="text-xs text-accent hover:text-accent-soft hover:underline text-left mb-2 flex items-center gap-1"
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {hotel.address}
            </button>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
            {hotel.checkIn && (
              <span className="flex items-center gap-1">
                <span className="text-ink-3">Check-in:</span>
                <span className="font-medium text-ink-2">{formatDateTimeLocal(hotel.checkIn)}</span>
              </span>
            )}
            {hotel.checkOut && (
              <span className="flex items-center gap-1">
                <span className="text-ink-3">Check-out:</span>
                <span className="font-medium text-ink-2">{formatDateTimeLocal(hotel.checkOut)}</span>
              </span>
            )}
          </div>

          {hotel.notes && (
            <p className="text-xs text-ink-3 mt-2 pt-2 border-t border-line">{hotel.notes}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={openMaps}
            className="p-1.5 text-accent-soft hover:text-accent-soft hover:bg-accent/10 rounded-lg transition-colors"
            title="Open in Google Maps"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(hotel)}
            className="p-1.5 text-ink-3 hover:text-ink-2 hover:bg-raised rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(hotel.id)}
            className="p-1.5 text-ink-4 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HotelList({ tripId, cityId, cityName }) {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const hotels = (state.hotels || []).filter(h => h.tripId === tripId && h.cityId === cityId)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink text-sm">
          Hotels <span className="text-ink-3 font-normal">{hotels.length}</span>
        </h3>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5 px-3">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Hotel
        </button>
      </div>

      {hotels.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-line rounded-2xl bg-surface">
          <svg className="w-8 h-8 text-ink-4 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm text-ink-3 mb-3">No hotels added yet</p>
          <button onClick={() => setShowForm(true)} className="btn-secondary text-xs">Add hotel for {cityName}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {hotels.map(hotel => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              onEdit={setEditing}
              onDelete={id => dispatch({ type: 'DELETE_HOTEL', id })}
            />
          ))}
        </div>
      )}

      {showForm && (
        <HotelForm
          onSave={data => {
            dispatch({ type: 'ADD_HOTEL', payload: { ...data, tripId, cityId } })
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}
      {editing && (
        <HotelForm
          initial={editing}
          onSave={data => {
            dispatch({ type: 'UPDATE_HOTEL', id: editing.id, payload: data })
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
