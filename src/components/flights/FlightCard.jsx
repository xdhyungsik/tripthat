import { motion } from 'framer-motion'
import { useNow } from '../../hooks/useNow'
import { Plane, Pencil, Trash } from '../icons'
import { flightInstant, flightPhase, formatCountdown, formatDuration } from '../../utils/helpers'

// Stable accent per airline code so each carrier gets its own badge color
const BADGE_COLORS = ['#4F8CFF', '#34D399', '#F59E0B', '#F472B6', '#A78BFA', '#22D3EE', '#FB7185', '#A3E635']
function badgeColor(code) {
  let h = 0
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return BADGE_COLORS[h % BADGE_COLORS.length]
}

function splitTime(local) {
  if (!local) return { time: '--:--', ampm: '' }
  const [h, m] = local.slice(11, 16).split(':').map(Number)
  return { time: `${h % 12 || 12}:${String(m).padStart(2, '0')}`, ampm: h >= 12 ? 'PM' : 'AM' }
}

function dayLabel(local) {
  if (!local) return ''
  return new Date(local.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function dayOffset(depLocal, arrLocal) {
  if (!depLocal || !arrLocal) return 0
  return Math.round((new Date(arrLocal.slice(0, 10)) - new Date(depLocal.slice(0, 10))) / 86400000)
}

function StatusPill({ phase }) {
  if (phase.phase === 'inair') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
        In the air · {formatCountdown(phase.msLeft)} left
      </span>
    )
  }
  if (phase.phase === 'upcoming') {
    return (
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent-soft border border-accent/20">
        Departs in {formatCountdown(phase.msUntil)}
      </span>
    )
  }
  if (phase.phase === 'landed') {
    return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-ink-3 border border-white/10">Landed</span>
  }
  return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-ink-3 border border-white/10">No time set</span>
}

function Endpoint({ code, local, align, offset }) {
  const { time, ampm } = splitTime(local)
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <div className="text-[34px] sm:text-[40px] leading-none font-bold tracking-tight text-ink font-display truncate">{code || '—'}</div>
      <div className="mt-2 text-[17px] font-semibold text-ink tabular-nums">
        {time}<span className="text-[11px] text-ink-3 font-semibold ml-0.5">{ampm}</span>
        {offset !== 0 && offset != null && (
          <sup className="ml-0.5 text-[10px] text-amber-300 font-bold">{offset > 0 ? `+${offset}` : `−${-offset}`}</sup>
        )}
      </div>
      <div className="text-xs text-ink-3 mt-0.5">{dayLabel(local)}</div>
    </div>
  )
}

function Track({ phase, duration }) {
  const pct = Math.min(1, Math.max(0, phase.progress)) * 100
  const live = phase.phase === 'inair'
  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-3 px-1 min-w-[72px]">
      <span className="text-[11px] font-semibold text-ink-3 tabular-nums mb-2">{formatDuration(duration) || '—'}</span>
      <div className="relative w-full h-4">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dotted border-white/15" />
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full ${live ? 'bg-gradient-to-r from-emerald-400/30 to-emerald-400' : 'bg-gradient-to-r from-accent/20 to-accent'}`}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-ink-3" />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-ink-3" />
        <motion.div
          className="absolute top-1/2"
          initial={false}
          animate={{ left: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          style={{ x: '-50%', y: '-50%' }}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${live ? 'bg-emerald-400 text-bg shadow-[0_0_16px_rgba(52,211,153,0.6)]' : phase.phase === 'landed' ? 'bg-raised text-ink-3' : 'bg-accent text-white shadow-[0_0_14px_rgba(79,140,255,0.55)]'}`}>
            <Plane className="w-3.5 h-3.5 rotate-90" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function FlightCard({ flight, onEdit, onDelete, compact = false }) {
  const now = useNow(30000)
  const phase = flightPhase(flight, now)
  const dep = flightInstant(flight, 'departure')
  const arr = flightInstant(flight, 'arrival')
  const duration = dep && arr ? Math.round((arr - dep) / 60000) : null
  const code = (flight.flightNumber || flight.airline || '✈').replace(/\s+/g, '').slice(0, 2).toUpperCase()
  const color = badgeColor(code)
  const offset = dayOffset(flight.departureTime, flight.arrivalTime)
  const done = phase.phase === 'landed'

  return (
    <div className={`group relative overflow-hidden rounded-3xl border bg-surface shadow-card ${phase.phase === 'inair' ? 'border-emerald-400/25' : 'border-white/[0.06]'} ${done ? 'opacity-75' : ''}`}>
      {phase.phase === 'inair' && (
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-400/[0.07] to-transparent pointer-events-none" />
      )}
      <div className="relative p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[11px] font-black tracking-tight flex-shrink-0"
              style={{ background: `${color}22`, color, boxShadow: `inset 0 0 0 1px ${color}40` }}
            >
              {code}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink truncate">{flight.airline || 'Flight'}</div>
              {flight.flightNumber && <div className="text-[11px] text-ink-3 font-mono tracking-wide">{flight.flightNumber}</div>}
            </div>
          </div>
          <StatusPill phase={phase} />
        </div>

        <div className="mt-5 flex items-start gap-2">
          <Endpoint code={flight.origin} local={flight.departureTime} />
          <Track phase={phase} duration={duration} />
          <Endpoint code={flight.destination} local={flight.arrivalTime} align="right" offset={offset} />
        </div>
      </div>

      {!compact && (flight.confirmationCode || flight.notes || onEdit) && (
        <div className="relative border-t border-dashed border-white/10 px-4 sm:px-5 py-3 flex items-center gap-4">
          {/* boarding-pass notches */}
          <span className="absolute -left-2.5 -top-2.5 w-5 h-5 rounded-full bg-bg" />
          <span className="absolute -right-2.5 -top-2.5 w-5 h-5 rounded-full bg-bg" />
          {flight.confirmationCode && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-4 font-semibold">Confirmation</div>
              <div className="text-sm font-mono font-semibold text-ink tracking-wider">{flight.confirmationCode}</div>
            </div>
          )}
          {flight.notes && (
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-4 font-semibold">Notes</div>
              <div className="text-sm text-ink-2 truncate">{flight.notes}</div>
            </div>
          )}
          {onEdit && (
            <div className="ml-auto flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(flight)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-raised transition-colors" aria-label="Edit flight">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(flight.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Delete flight">
                <Trash className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
