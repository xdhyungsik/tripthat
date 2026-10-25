import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../../context/AppContext'
import { useTripSync } from '../../hooks/useTripSync'
import TripForm from './TripForm'
import Modal from '../Modal'
import { Plane, Plus, Trash, Users, ChevronRight, Globe } from '../icons'
import { formatDateRange, tripPhase, tripNights, flightPhase, formatCountdown } from '../../utils/helpers'
import { useNow } from '../../hooks/useNow'

const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }),
}

function useTripStats(trip) {
  const { state } = useApp()
  return {
    places: state.places.filter(p => p.tripId === trip.id).length,
    flights: state.flights.filter(f => f.tripId === trip.id).length,
    cities: trip.cities?.length || 0,
  }
}

function DeleteConfirm({ trip, onCancel, onConfirm }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-10 bg-surface/95 backdrop-blur-sm border border-red-500/30 rounded-3xl flex flex-col items-center justify-center gap-3"
      onClick={e => e.stopPropagation()}
    >
      <p className="text-sm text-ink-2">Delete <strong className="text-ink">{trip.name}</strong>?</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
        <button onClick={() => onConfirm(trip.id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
      </div>
    </motion.div>
  )
}

function DeleteButton({ onClick }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className="w-8 h-8 rounded-full flex items-center justify-center text-ink-4 hover:text-red-400 hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100"
      aria-label="Delete trip"
    >
      <Trash className="w-4 h-4" />
    </button>
  )
}

// Live strip for the flight that's in the air, or the next one up
function HeroFlight({ tripId }) {
  const { state } = useApp()
  const now = useNow(30000)
  const flights = state.flights
    .filter(f => f.tripId === tripId)
    .sort((a, b) => (a.departureTimeUTC || a.departureTime || '').localeCompare(b.departureTimeUTC || b.departureTime || ''))
  const flight = flights.find(f => flightPhase(f, now).phase === 'inair') || flights.find(f => flightPhase(f, now).phase === 'upcoming')
  if (!flight) return null
  const p = flightPhase(flight, now)
  const live = p.phase === 'inair'

  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl bg-black/25 border border-white/10 px-3.5 py-2.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${live ? 'bg-emerald-400 text-bg shadow-[0_0_14px_rgba(52,211,153,0.6)]' : 'bg-accent text-white'}`}>
        <Plane className="w-4 h-4 rotate-90" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate">
          {flight.origin} → {flight.destination}
          {flight.flightNumber && <span className="text-white/45 font-mono text-xs ml-2">{flight.flightNumber}</span>}
        </div>
        <div className={`text-xs ${live ? 'text-emerald-300' : 'text-white/60'}`}>
          {live ? `In the air · lands in ${formatCountdown(p.msLeft)}` : `Departs in ${formatCountdown(p.msUntil)}`}
        </div>
      </div>
      {live && (
        <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${p.progress * 100}%` }} />
        </div>
      )}
    </div>
  )
}

// The next trip gets a big boarding-pass style card with a countdown
function HeroTrip({ trip, onOpen, onDeleteClick, deleting, onDelete }) {
  const stats = useTripStats(trip)
  const phase = tripPhase(trip)
  const nights = tripNights(trip)
  const cities = trip.cities || []
  const first = cities[0]?.name
  const last = cities.length > 1 ? cities[cities.length - 1]?.name : null

  return (
    <motion.div custom={0} variants={listItem} initial="hidden" animate="show" className="relative group">
      {deleting && <DeleteConfirm trip={trip} onCancel={() => onDeleteClick(null)} onConfirm={onDelete} />}
      <motion.div
        whileTap={{ scale: 0.985 }}
        onClick={() => onOpen(trip)}
        className="relative overflow-hidden rounded-3xl cursor-pointer border border-white/[0.08] bg-[radial-gradient(120%_120%_at_0%_0%,#2A4A9A_0%,#16244A_38%,#111520_75%)] shadow-[0_24px_60px_-24px_rgba(79,140,255,0.55)]"
      >
        {/* faint globe lines */}
        <svg className="absolute -right-16 -top-16 w-72 h-72 text-white/[0.05]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="100" cy="100" r="90" />
          <ellipse cx="100" cy="100" rx="40" ry="90" />
          <ellipse cx="100" cy="100" rx="70" ry="90" />
          <path d="M10 100h180M22 55h156M22 145h156" />
        </svg>

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full ${phase.phase === 'now' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-white/80'}`}>
                {phase.phase === 'now' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />}
                {phase.phase === 'now' ? 'Happening now' : 'Next trip'}
              </span>
            </div>
            <DeleteButton onClick={() => onDeleteClick(trip.id)} />
          </div>

          <h2 className="mt-4 text-[28px] sm:text-[32px] leading-[1.1] font-bold tracking-tight text-white font-display">{trip.name}</h2>
          <p className="mt-1 text-sm text-white/60">
            {formatDateRange(trip.startDate, trip.endDate) || 'Dates not set'}
            {nights != null && <span className="text-white/40"> · {nights} night{nights !== 1 ? 's' : ''}</span>}
          </p>

          {first && (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-lg font-semibold text-white truncate">{first}</span>
              {last && (
                <>
                  <div className="flex-1 relative h-px min-w-[40px] bg-gradient-to-r from-white/40 via-white/20 to-white/40">
                    <Plane className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-accent-soft rotate-90" />
                  </div>
                  <span className="text-lg font-semibold text-white truncate">{last}</span>
                </>
              )}
            </div>
          )}
          {cities.length > 2 && (
            <p className="mt-1.5 text-xs text-white/45 truncate">via {cities.slice(1, -1).map(c => c.name).join(', ')}</p>
          )}

          <HeroFlight tripId={trip.id} />

          <div className="mt-6 pt-5 border-t border-dashed border-white/15 flex items-end justify-between gap-4">
            <div className="flex gap-6">
              {[['Cities', stats.cities], ['Places', stats.places], ['Flights', stats.flights]].map(([label, v]) => (
                <div key={label}>
                  <div className="text-xl font-bold text-white tabular-nums">{v}</div>
                  <div className="text-[11px] uppercase tracking-[0.1em] text-white/45 font-semibold">{label}</div>
                </div>
              ))}
            </div>
            {phase.phase === 'upcoming' && (
              <div className="text-right">
                <div className="text-[44px] leading-none font-bold text-white tabular-nums tracking-tight font-display">{phase.days}</div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-accent-soft font-semibold mt-1">{phase.days === 1 ? 'day to go' : 'days to go'}</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function TripRow({ trip, index, onOpen, onDeleteClick, deleting, onDelete }) {
  const stats = useTripStats(trip)
  const phase = tripPhase(trip)
  const start = trip.startDate ? new Date(trip.startDate + 'T12:00:00') : null
  const past = phase.phase === 'past'

  return (
    <motion.div custom={index} variants={listItem} initial="hidden" animate="show" className="relative group">
      {deleting && <DeleteConfirm trip={trip} onCancel={() => onDeleteClick(null)} onConfirm={onDelete} />}
      <motion.div
        whileTap={{ scale: 0.985 }}
        onClick={() => onOpen(trip)}
        className={`card rounded-3xl p-4 flex items-center gap-4 cursor-pointer hover:bg-raised/70 transition-colors ${past ? 'opacity-70' : ''}`}
      >
        <div className="w-14 h-14 rounded-2xl bg-raised border border-white/[0.06] flex flex-col items-center justify-center flex-shrink-0">
          {start ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{start.toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-xl font-bold text-ink leading-none mt-0.5 tabular-nums">{start.getDate()}</span>
            </>
          ) : (
            <Globe className="w-6 h-6 text-ink-3" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink text-[15px] truncate">{trip.name}</h3>
          </div>
          <p className="text-xs text-ink-3 mt-0.5 truncate">
            {(trip.cities || []).map(c => c.name).join(' → ') || 'No cities yet'}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-ink-3 whitespace-nowrap overflow-hidden">
            <span className={`font-semibold ${phase.phase === 'upcoming' ? 'text-accent-soft' : phase.phase === 'now' ? 'text-emerald-300' : 'text-ink-3'}`}>{phase.label}</span>
            <span className="text-ink-4">·</span>
            <span>{stats.places} places</span>
            <span className="text-ink-4 hidden min-[400px]:inline">·</span>
            <span className="hidden min-[400px]:inline">{stats.flights} flights</span>
          </div>
        </div>
        <DeleteButton onClick={() => onDeleteClick(trip.id)} />
        <ChevronRight className="w-4 h-4 text-ink-4 flex-shrink-0 -ml-2" />
      </motion.div>
    </motion.div>
  )
}

function JoinTripModal({ onClose }) {
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
    onClose()
  }

  if (!isConfigured) return null

  return (
    <Modal title="Join a shared trip" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-3">Enter the 6-character code from the trip owner.</p>
        <input
          className="input font-mono uppercase text-center text-3xl tracking-[0.4em] py-4"
          placeholder="ABC123"
          value={code}
          maxLength={6}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          autoFocus
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleJoin} disabled={loading || code.length < 4} className="btn-primary flex-1 justify-center disabled:opacity-40">
            {loading ? 'Joining…' : 'Join Trip'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function SectionTitle({ children, count }) {
  return (
    <h2 className="eyebrow mb-3 mt-8 flex items-center gap-2">
      {children}
      {count != null && <span className="text-ink-4">{count}</span>}
    </h2>
  )
}

function EmptyState({ onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden text-center py-20 px-6 rounded-3xl border border-white/[0.06] bg-[radial-gradient(80%_70%_at_50%_0%,rgba(79,140,255,0.18),transparent)]"
    >
      <div className="relative mx-auto w-40 h-24 mb-6">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 96" fill="none">
          <path d="M12 84 Q80 -10 148 84" stroke="url(#g)" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
          <circle cx="12" cy="84" r="5" fill="#4F8CFF" />
          <circle cx="148" cy="84" r="5" fill="#8DB4FF" />
          <defs>
            <linearGradient id="g" x1="0" x2="1"><stop stopColor="#4F8CFF" /><stop offset="1" stopColor="#8DB4FF" /></linearGradient>
          </defs>
        </svg>
        <Plane className="absolute left-1/2 top-[14px] -translate-x-1/2 w-6 h-6 text-white rotate-90" />
      </div>
      <p className="text-ink text-xl font-bold tracking-tight font-display">Where to next?</p>
      <p className="text-sm text-ink-3 mt-2 mb-7 max-w-xs mx-auto">Add your cities and dates, then drop in places, hotels, and flights as you plan.</p>
      <button onClick={onCreate} className="btn-primary px-5">
        <Plus className="w-4 h-4" strokeWidth={2.6} />
        Plan a trip
      </button>
    </motion.div>
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
    if (id) setTimeout(() => setDeleteConfirm(d => d === id ? null : d), 4000)
  }

  // Group trips the way a travel app would: live, upcoming (soonest first), undated, past (latest first)
  const withPhase = state.trips.map(t => ({ trip: t, phase: tripPhase(t).phase }))
  const byStart = (a, b) => (a.trip.startDate || '').localeCompare(b.trip.startDate || '')
  const now = withPhase.filter(t => t.phase === 'now').sort(byStart)
  const upcoming = withPhase.filter(t => t.phase === 'upcoming').sort(byStart)
  const drafts = withPhase.filter(t => t.phase === 'draft')
  const past = withPhase.filter(t => t.phase === 'past').sort((a, b) => byStart(b, a))
  const [hero, ...restUpcoming] = [...now, ...upcoming].map(t => t.trip)

  const rowProps = trip => ({
    trip,
    onOpen: onOpenTrip,
    onDelete: handleDelete,
    deleting: deleteConfirm === trip.id,
    onDeleteClick: handleDeleteClick,
  })

  let index = 1
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-32">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[34px] leading-none font-bold tracking-tight text-ink font-display">Trips</h1>
          <p className="text-sm text-ink-3 mt-2">
            {state.trips.length === 0
              ? 'Plan your multi-city adventures'
              : `${now.length + upcoming.length} upcoming · ${past.length} past`}
          </p>
        </div>
        <div className="flex gap-2">
          {isConfigured && (
            <button onClick={() => setShowJoin(true)} className="btn-secondary px-3 sm:px-4" aria-label="Join a shared trip">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Join</span>
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary hidden sm:inline-flex">
            <Plus className="w-4 h-4" strokeWidth={2.6} />
            New Trip
          </button>
        </div>
      </div>

      {state.trips.length === 0 ? (
        <EmptyState onCreate={() => setShowForm(true)} />
      ) : (
        <>
          {hero && <HeroTrip {...rowProps(hero)} />}

          {restUpcoming.length > 0 && (
            <>
              <SectionTitle count={restUpcoming.length}>Upcoming</SectionTitle>
              <div className="space-y-3">
                {restUpcoming.map(t => <TripRow key={t.id} index={index++} {...rowProps(t)} />)}
              </div>
            </>
          )}

          {drafts.length > 0 && (
            <>
              <SectionTitle count={drafts.length}>No dates yet</SectionTitle>
              <div className="space-y-3">
                {drafts.map(({ trip }) => <TripRow key={trip.id} index={index++} {...rowProps(trip)} />)}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <SectionTitle count={past.length}>Past</SectionTitle>
              <div className="space-y-3">
                {past.map(({ trip }) => <TripRow key={trip.id} index={index++} {...rowProps(trip)} />)}
              </div>
            </>
          )}
        </>
      )}

      {/* Floating add button on phones */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowForm(true)}
        className="sm:hidden fixed right-5 z-[1050] w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_12px_30px_-6px_rgba(79,140,255,0.8)]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
        aria-label="New trip"
      >
        <Plus className="w-6 h-6" strokeWidth={2.6} />
      </motion.button>

      {showForm && <TripForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
      {showJoin && <JoinTripModal onClose={() => setShowJoin(false)} />}
    </div>
  )
}
