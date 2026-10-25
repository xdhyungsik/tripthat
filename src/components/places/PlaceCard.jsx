import { useState } from 'react'
import { categoryColor, categoryDotColor, statusColor, openInMaps, searchReviews } from '../../utils/helpers'
import PlaceForm from './PlaceForm'

export default function PlaceCard({ place, cityName, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  function handleSave(data) {
    onUpdate(place.id, data)
    setEditing(false)
  }

  const dotColor = categoryDotColor(place.category)
  const catClass = categoryColor(place.category)
  const statClass = statusColor(place.status)
  const isDone = place.status === 'Done'
  const isSkipped = place.status === 'Skipped'

  return (
    <>
      <div className={`group border border-slate-200 rounded-xl bg-white hover:shadow-md transition-all ${isDone || isSkipped ? 'opacity-55' : ''}`}>
        <div className="p-3.5">
          <div className="flex items-start gap-3">
            {/* Category dot */}
            <div className="mt-1 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: dotColor }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h4 className={`font-semibold text-sm leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {place.name}
                </h4>
                {place.isBackup && (
                  <span className="badge bg-slate-100 text-slate-500 text-[10px] flex-shrink-0 mt-0.5">backup</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1 mb-1.5">
                <span className={`badge border text-[11px] ${catClass}`}>{place.category}</span>
                <span className={`badge border text-[11px] ${statClass}`}>{place.status}</span>
                {place.category === 'Food' && place.priceRange && (
                  <span className="badge bg-slate-100 text-slate-500 text-[11px]">{place.priceRange}</span>
                )}
                {place.category === 'Food' && place.cuisine && (
                  <span className="badge bg-slate-100 text-slate-500 text-[11px]">{place.cuisine}</span>
                )}
              </div>

              {place.address && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {place.address}
                </p>
              )}

              {place.notes && (
                <p className={`text-xs text-slate-500 leading-relaxed ${!expanded && place.notes.length > 90 ? 'line-clamp-2' : ''}`}>
                  {place.notes}
                </p>
              )}
              {place.notes && place.notes.length > 90 && (
                <button onClick={() => setExpanded(e => !e)} className="text-[11px] text-blue-500 hover:text-blue-700">
                  {expanded ? 'Less' : 'More'}
                </button>
              )}
              {place.category === 'Food' && place.mustTryDish && (
                <p className="text-[11px] text-orange-600 mt-1 font-medium">Try: {place.mustTryDish}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => onDelete(place.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
            <button onClick={() => openInMaps(place, cityName)} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Maps
            </button>
            <span className="text-slate-200">·</span>
            <button onClick={() => searchReviews(place, cityName)} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Reviews
            </button>
            <div className="ml-auto">
              <select
                value={place.status}
                onChange={e => onUpdate(place.id, { status: e.target.value })}
                className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer outline-none bg-transparent"
                onClick={e => e.stopPropagation()}
              >
                <option>Want to Go</option>
                <option>Confirmed</option>
                <option>Done</option>
                <option>Skipped</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <PlaceForm initial={place} cityName={cityName} onSave={handleSave} onClose={() => setEditing(false)} />
      )}
    </>
  )
}
