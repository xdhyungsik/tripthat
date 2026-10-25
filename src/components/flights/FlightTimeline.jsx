import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../../context/AppContext'
import { useNow } from '../../hooks/useNow'
import FlightForm from './FlightForm'
import FlightCard from './FlightCard'
import { Plane, Plus } from '../icons'
import { flightPhase } from '../../utils/helpers'

export default function FlightTimeline({ tripId }) {
  const { state, dispatch } = useApp()
  const now = useNow(60000)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const sortKey = f => f.departureTimeUTC || f.departureTime || ''
  const flights = state.flights
    .filter(f => f.tripId === tripId)
    .sort((a, b) => !a.departureTime ? 1 : !b.departureTime ? -1 : sortKey(a).localeCompare(sortKey(b)))

  const active = flights.filter(f => flightPhase(f, now).phase !== 'landed')
  const past = flights.filter(f => flightPhase(f, now).phase === 'landed').reverse()

  const renderList = list => (
    <div className="space-y-3">
      {list.map((flight, i) => (
        <motion.div
          key={flight.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <FlightCard flight={flight} onEdit={setEditing} onDelete={id => dispatch({ type: 'DELETE_FLIGHT', id })} />
        </motion.div>
      ))}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-ink tracking-tight font-display">
          Flights <span className="text-ink-4 font-semibold">{flights.length}</span>
        </h2>
        <button onClick={() => setShowForm(true)} className="btn-primary py-2 px-3.5">
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          Add
        </button>
      </div>

      {flights.length === 0 ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full text-center py-14 rounded-3xl border border-dashed border-white/10 hover:border-accent/40 hover:bg-accent/[0.04] transition-colors group"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plane className="w-6 h-6 rotate-45" />
          </div>
          <p className="text-sm font-semibold text-ink">Add your first flight</p>
          <p className="text-xs text-ink-3 mt-1">Type a flight number and we'll fill in the rest</p>
        </button>
      ) : (
        <>
          {active.length > 0 && renderList(active)}
          {past.length > 0 && (
            <>
              <h3 className="eyebrow mt-8 mb-3">Past flights</h3>
              {renderList(past)}
            </>
          )}
        </>
      )}

      {showForm && <FlightForm onSave={data => { dispatch({ type: 'ADD_FLIGHT', payload: { ...data, tripId } }); setShowForm(false) }} onClose={() => setShowForm(false)} />}
      {editing && <FlightForm initial={editing} onSave={data => { dispatch({ type: 'UPDATE_FLIGHT', id: editing.id, payload: data }); setEditing(null) }} onClose={() => setEditing(null)} />}
    </div>
  )
}
