import { useState } from 'react'
import { motion } from 'framer-motion'
import { categoryDotColor, statusColor, openInMaps, searchReviews, STATUSES } from '../../utils/helpers'
import { MapPin, Pencil, Trash, Sparkle, Globe } from '../icons'
import PlaceForm from './PlaceForm'

export default function PlaceCard({ place, cityName, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  function handleSave(data) {
    onUpdate(place.id, data)
    setEditing(false)
  }

  const color = categoryDotColor(place.category)
  const statClass = statusColor(place.status)
  const isDone = place.status === 'Done'
  const isSkipped = place.status === 'Skipped'
  const isFood = place.category === 'Food'

  return (
    <>
      <motion.div
        layout
        className={`group relative overflow-hidden rounded-2xl bg-surface border border-white/[0.06] shadow-card hover:border-white/[0.12] transition-colors ${isDone || isSkipped ? 'opacity-55' : ''}`}
      >
        {/* category color edge */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color }} />

        <div className="pl-4 pr-3 py-3.5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold text-[15px] leading-snug truncate ${isDone ? 'line-through text-ink-3' : 'text-ink'}`}>
                  {place.name}
                </h4>
                {place.isBackup && (
                  <span className="badge bg-white/5 text-ink-3 border-white/10 text-[10px] flex-shrink-0">Backup</span>
                )}
              </div>

              {(isFood && (place.cuisine || place.priceRange)) && (
                <p className="text-xs text-ink-3 mt-0.5">
                  {[place.cuisine, place.priceRange].filter(Boolean).join(' · ')}
                </p>
              )}

              {place.address && (
                <p className="text-xs text-ink-3 flex items-center gap-1 mt-1.5 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{place.address}</span>
                </p>
              )}

              {place.notes && (
                <p
                  onClick={() => place.notes.length > 90 && setExpanded(e => !e)}
                  className={`text-[13px] text-ink-2 leading-relaxed mt-2 ${!expanded && place.notes.length > 90 ? 'line-clamp-2 cursor-pointer' : ''}`}
                >
                  {place.notes}
                </p>
              )}
              {isFood && place.mustTryDish && (
                <p className="text-xs text-orange-300 mt-2 font-medium flex items-center gap-1">
                  <Sparkle className="w-3.5 h-3.5" /> Must try: {place.mustTryDish}
                </p>
              )}
            </div>

            {/* Status pill doubles as a quick picker */}
            <label className={`relative badge ${statClass} px-2.5 py-1 cursor-pointer flex-shrink-0`}>
              {place.status}
              <select
                value={place.status}
                onChange={e => onUpdate(place.id, { status: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Change status"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            <button onClick={() => openInMaps(place, cityName)} className="flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink bg-raised hover:bg-line px-2.5 py-1.5 rounded-lg transition-colors">
              <MapPin className="w-3.5 h-3.5" /> Maps
            </button>
            <button onClick={() => searchReviews(place, cityName)} className="flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink bg-raised hover:bg-line px-2.5 py-1.5 rounded-lg transition-colors">
              <Globe className="w-3.5 h-3.5" /> Reviews
            </button>
            <div className="ml-auto flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-raised transition-colors" aria-label="Edit place">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(place.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Delete place">
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {editing && (
        <PlaceForm initial={place} cityName={cityName} onSave={handleSave} onClose={() => setEditing(false)} />
      )}
    </>
  )
}
