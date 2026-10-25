import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { getDatesInRange, formatDate, formatTimeDisplay, categoryDotColor } from '../../utils/helpers'

function AddBlockForm({ dayId, places, onAdd, onCancel }) {
  const [mode, setMode] = useState('place')
  const [selectedId, setSelectedId] = useState('')
  const [customText, setCustomText] = useState('')
  const [time, setTime] = useState('09:00')
  const [notes, setNotes] = useState('')

  function handleAdd() {
    if (mode === 'place' && !selectedId) return
    if (mode === 'custom' && !customText.trim()) return
    onAdd({
      placeId: mode === 'place' ? selectedId : undefined,
      customActivity: mode === 'custom' ? customText.trim() : undefined,
      time,
      notes,
    })
  }

  return (
    <div className="mt-3 p-3 bg-raised border border-line rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="time"
          className="input py-1.5 text-xs w-32"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
        <div className="flex gap-1 ml-auto">
          {['place', 'custom'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${mode === m ? 'bg-accent text-white' : 'text-ink-3 hover:text-ink-2 bg-surface border border-line'}`}
            >
              {m === 'place' ? 'Saved place' : 'Custom'}
            </button>
          ))}
        </div>
      </div>
      {mode === 'place' ? (
        <select className="input text-xs py-1.5" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">Select place…</option>
          {places.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
        </select>
      ) : (
        <input className="input text-xs py-1.5" placeholder="Activity name…" value={customText} onChange={e => setCustomText(e.target.value)} autoFocus />
      )}
      <input
        className="input text-xs py-1.5"
        placeholder="Notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary text-xs py-1.5 flex-1">Cancel</button>
        <button
          onClick={handleAdd}
          disabled={mode === 'place' ? !selectedId : !customText.trim()}
          className="btn-primary text-xs py-1.5 flex-1 justify-center disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function EditBlockForm({ block, onSave, onCancel }) {
  const [time, setTime] = useState(block.time || '09:00')
  const [notes, setNotes] = useState(block.notes || '')

  return (
    <div className="mt-1 p-2.5 bg-accent/10 border border-accent/30 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-ink-3 flex-shrink-0">Time</label>
        <input
          type="time"
          className="input py-1 text-xs flex-1"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
      </div>
      <input
        className="input text-xs py-1"
        placeholder="Notes"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary text-xs py-1 flex-1">Cancel</button>
        <button onClick={() => onSave({ time, notes })} className="btn-primary text-xs py-1 flex-1 justify-center">Save</button>
      </div>
    </div>
  )
}

function BlockItem({ block, places, onDelete, onUpdate }) {
  const place = places.find(p => p.id === block.placeId)
  const [editing, setEditing] = useState(false)
  const dotColor = place ? categoryDotColor(place.category) : '#94a3b8'

  return (
    <div className="group">
      <div className="flex items-start gap-0">
        {/* Time */}
        <div className="w-20 text-right pr-3 pt-0.5 flex-shrink-0">
          <span className="text-xs font-medium text-ink-3 tabular-nums">
            {block.time ? formatTimeDisplay(block.time) : '--:--'}
          </span>
        </div>
        {/* Dot */}
        <div className="flex flex-col items-center flex-shrink-0 pt-1">
          <div
            className="w-3 h-3 rounded-full ring-2 ring-surface flex-shrink-0"
            style={{ background: dotColor }}
          />
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0 pl-3 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink leading-tight">
                {place ? place.name : block.customActivity || 'Activity'}
              </div>
              {place && (
                <div className="text-xs text-ink-3 mt-0.5">{place.category}</div>
              )}
              {block.notes && (
                <div className="text-xs text-ink-3 mt-0.5">{block.notes}</div>
              )}
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
              <button
                onClick={() => setEditing(e => !e)}
                className="p-1 text-ink-3 hover:text-accent hover:bg-accent/10 rounded transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(block.id)}
                className="p-1 text-ink-4 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {editing && (
            <EditBlockForm
              block={block}
              onSave={data => { onUpdate(block.id, data); setEditing(false) }}
              onCancel={() => setEditing(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function DayCard({ day, places, onAddBlock, onDeleteBlock, onUpdateBlock }) {
  const [adding, setAdding] = useState(false)
  const sortedBlocks = useMemo(
    () => [...day.blocks].sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [day.blocks]
  )

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-ink text-sm">{formatDate(day.date)}</div>
          <div className="text-xs text-ink-3 mt-0.5">
            {sortedBlocks.length} {sortedBlocks.length === 1 ? 'activity' : 'activities'}
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print btn-ghost text-xs py-1.5 px-2.5 gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        {sortedBlocks.length > 0 && (
          <div className="absolute top-2 bottom-0 bg-raised" style={{ left: '5.25rem', width: '1px' }} />
        )}
        {sortedBlocks.map(block => (
          <BlockItem
            key={block.id}
            block={block}
            places={places}
            onDelete={id => onDeleteBlock(day.id, id)}
            onUpdate={(id, data) => onUpdateBlock(day.id, id, data)}
          />
        ))}

        {sortedBlocks.length === 0 && !adding && (
          <div className="text-center py-6 text-xs text-ink-4">No activities yet</div>
        )}
      </div>

      {adding ? (
        <AddBlockForm
          dayId={day.id}
          places={places}
          onAdd={block => { onAddBlock(day.id, block); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-1 text-xs text-ink-3 hover:text-accent flex items-center gap-1.5 transition-colors w-full justify-center py-1.5 border border-dashed border-line hover:border-accent/50 rounded-lg"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add activity
        </button>
      )}
    </div>
  )
}

export default function ItineraryBuilder({ tripId, cityId, city }) {
  const { state, dispatch } = useApp()
  const cityDays = useMemo(
    () => city.startDate && city.endDate ? getDatesInRange(city.startDate, city.endDate) : [],
    [city.startDate, city.endDate]
  )
  const days = useMemo(
    () => state.itinerary.filter(d => d.tripId === tripId && d.cityId === cityId),
    [state.itinerary, tripId, cityId]
  )
  const places = useMemo(
    () => state.places.filter(p => p.tripId === tripId && p.cityId === cityId),
    [state.places, tripId, cityId]
  )

  if (!city.startDate || !city.endDate) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-line rounded-xl">
        <p className="text-sm text-ink-3">Set arrival and departure dates for {city.name} to build a day-by-day itinerary.</p>
        <p className="text-xs text-ink-4 mt-1">Edit the trip to add city dates.</p>
      </div>
    )
  }

  const allDays = cityDays.map(date => {
    const found = days.find(d => d.date === date)
    return found || { id: `pending-${date}`, date, blocks: [], isPending: true }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink-2 text-sm">
          Day-by-Day Itinerary
          <span className="ml-2 text-ink-3 font-normal">{cityDays.length} days</span>
        </h3>
      </div>
      <div className="space-y-3">
        {allDays.map(day => day.isPending ? (
          <div
            key={day.date}
            className="card p-4 cursor-pointer hover:border-accent/50 hover:shadow-md transition-all"
            onClick={() => dispatch({ type: 'UPSERT_DAY', payload: { tripId, cityId, date: day.date } })}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-ink text-sm">{formatDate(day.date)}</div>
                <div className="text-xs text-ink-3 mt-0.5">Click to plan this day</div>
              </div>
              <svg className="w-4 h-4 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        ) : (
          <DayCard
            key={day.id}
            day={day}
            places={places}
            onAddBlock={(dayId, block) => dispatch({ type: 'ADD_BLOCK', payload: { dayId, block } })}
            onDeleteBlock={(dayId, blockId) => dispatch({ type: 'DELETE_BLOCK', payload: { dayId, blockId } })}
            onUpdateBlock={(dayId, blockId, data) => dispatch({ type: 'UPDATE_BLOCK', payload: { dayId, blockId, data } })}
          />
        ))}
      </div>
    </div>
  )
}
