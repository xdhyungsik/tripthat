import { useState, lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../../context/AppContext'
import { useTripSync } from '../../hooks/useTripSync'
import { useNow } from '../../hooks/useNow'
import PlaceList from '../places/PlaceList'
import FlightTimeline from '../flights/FlightTimeline'
import FlightCard from '../flights/FlightCard'
import HotelList from '../hotels/HotelList'
import ItineraryBuilder from '../itinerary/ItineraryBuilder'
import TripItinerary from '../itinerary/TripItinerary'
import TakeoutImport from '../places/TakeoutImport'
import TripForm from './TripForm'
import { Share, Pencil, Copy, Check, Upload, ChevronRight, Calendar, MapPin, Plane, Bed } from '../icons'
import { formatDateRange, tripPhase, tripNights, flightPhase } from '../../utils/helpers'

const TripMap = lazy(() => import('../map/TripMap'))

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
}

function MapPanel({ trip, places, flights, activeCityId, onCityClick }) {
  return (
    <div className="map-panel relative h-[34vh] min-h-[220px] lg:h-auto lg:flex-1 bg-[#0d1117] overflow-hidden">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-sm text-ink-4">Loading map…</div>}>
        <TripMap
          cities={trip.cities || []}
          places={places}
          flights={flights}
          activeCityId={activeCityId}
          onCityClick={onCityClick}
          height="100%"
        />
      </Suspense>
      {/* fade the map into the page on phones */}
      <div className="lg:hidden absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-bg to-transparent pointer-events-none z-[500]" />
    </div>
  )
}

// Horizontal pill tabs with a sliding highlight
function PillTabs({ tabs, active, onChange, layoutId }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
      {tabs.map(tab => {
        const on = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-3.5 py-2 rounded-full text-[13px] whitespace-nowrap transition-colors flex items-center gap-1.5 ${on ? 'text-white font-semibold' : 'text-ink-3 hover:text-ink-2 font-medium'}`}
          >
            {on && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-raised border border-white/[0.08]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {tab.badge != null && (
              <span className={`relative w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${on ? 'bg-accent text-white' : 'bg-white/10 text-ink-3'}`}>{tab.badge}</span>
            )}
            <span className="relative">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// iOS-style segmented control
function Segmented({ options, value, onChange }) {
  return (
    <div className="flex p-1 rounded-2xl bg-surface border border-white/[0.06]">
      {options.map(o => {
        const on = value === o.id
        return (
          <button key={o.id} onClick={() => onChange(o.id)} className={`relative flex-1 py-2 text-[13px] rounded-xl transition-colors flex items-center justify-center gap-1.5 ${on ? 'text-ink font-semibold' : 'text-ink-3 hover:text-ink-2 font-medium'}`}>
            {on && (
              <motion.span layoutId="seg-thumb" className="absolute inset-0 rounded-xl bg-raised shadow-[0_2px_8px_rgba(0,0,0,0.4)]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
            )}
            <span className="relative flex items-center gap-1.5">{o.icon}{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function StatTile({ value, label, accent }) {
  return (
    <div className="card rounded-2xl px-3 py-3.5">
      <div className={`text-2xl font-bold tabular-nums tracking-tight font-display ${accent ? 'text-accent-soft' : 'text-ink'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.08em] text-ink-3 font-semibold mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  )
}

function OverviewPanel({ trip, places, flights, hotels, onCityClick, onImport, onFlights }) {
  const now = useNow(60000)
  const phase = tripPhase(trip, now)
  const nights = tripNights(trip)
  const cities = trip.cities || []
  const sorted = [...flights].sort((a, b) => (a.departureTimeUTC || a.departureTime || '').localeCompare(b.departureTimeUTC || b.departureTime || ''))
  const nextFlight = sorted.find(f => flightPhase(f, now).phase === 'inair') || sorted.find(f => flightPhase(f, now).phase === 'upcoming')

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-4 gap-2">
        {phase.phase === 'upcoming'
          ? <StatTile value={phase.days} label={phase.days === 1 ? 'Day to go' : 'Days out'} accent />
          : <StatTile value={nights ?? '—'} label="Nights" />}
        <StatTile value={cities.length} label="Cities" />
        <StatTile value={places.length} label="Places" />
        <StatTile value={flights.length} label="Flights" />
      </div>

      {nextFlight && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="eyebrow">{flightPhase(nextFlight, now).phase === 'inair' ? 'In the air' : 'Next flight'}</h3>
            <button onClick={onFlights} className="text-xs font-semibold text-accent hover:text-accent-soft flex items-center">
              All flights <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <FlightCard flight={nextFlight} compact />
        </section>
      )}

      {cities.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="eyebrow">Route</h3>
            <button onClick={onImport} className="text-xs font-semibold text-accent hover:text-accent-soft flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Import from Google Maps
            </button>
          </div>
          <div className="relative">
            {cities.length > 1 && (
              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-accent/60 via-accent/25 to-accent/60" />
            )}
            <div className="space-y-2">
              {cities.map((city, i) => {
                const count = places.filter(p => p.cityId === city.id).length
                const hotelCount = hotels.filter(h => h.cityId === city.id).length
                const n = city.startDate && city.endDate ? Math.round((new Date(city.endDate) - new Date(city.startDate)) / 86400000) : null
                return (
                  <motion.button
                    key={city.id}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => onCityClick(city.id)}
                    className="relative w-full flex items-center gap-3 p-2 pr-3 rounded-2xl hover:bg-surface transition-colors text-left group"
                  >
                    <div className="relative z-10 w-6 h-6 m-2 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center ring-4 ring-bg flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-ink text-[15px] truncate">{city.name}</span>
                        {city.country && <span className="text-xs text-ink-3 truncate">{city.country}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-3">
                        {city.startDate && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateRange(city.startDate, city.endDate)}{n != null && ` · ${n}n`}</span>
                        )}
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{count}</span>
                        {hotelCount > 0 && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{hotelCount}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-4 group-hover:text-ink-2 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </motion.button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {flights.length === 0 && (
        <button onClick={onFlights} className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-white/10 hover:border-accent/40 hover:bg-accent/[0.04] transition-colors text-left">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Plane className="w-5 h-5 rotate-45" /></div>
          <div>
            <div className="text-sm font-semibold text-ink">Add a flight</div>
            <div className="text-xs text-ink-3">Track countdowns and see your route on the map</div>
          </div>
        </button>
      )}
    </div>
  )
}

function SharePanel({ shareCode }) {
  const [copied, setCopied] = useState(false)
  function copyCode() {
    navigator.clipboard.writeText(shareCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-4 p-4 rounded-2xl bg-emerald-400/[0.07] border border-emerald-400/20 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-emerald-300">Share code</p>
          <p className="text-xs text-ink-3 mt-1">Others tap <span className="text-ink-2">Join</span> on the Trips screen and enter this code. Changes sync live.</p>
        </div>
        <span className="font-mono font-bold text-xl text-ink tracking-[0.2em]">{shareCode}</span>
        <button onClick={copyCode} className="btn-icon" aria-label="Copy code">
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  )
}

export default function TripDetail({ trip }) {
  const { dispatch, state } = useApp()
  const [activeTab, setActiveTab] = useState('overview')
  const [cityView, setCityView] = useState('places')
  const [editing, setEditing] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [shareError, setShareError] = useState('')

  const { shareCode, enableSync, isConfigured } = useTripSync(trip.id, state, dispatch)

  const cities = trip.cities || []
  const places = state.places.filter(p => p.tripId === trip.id)
  const flights = state.flights.filter(f => f.tripId === trip.id)
  const hotels = (state.hotels || []).filter(h => h.tripId === trip.id)
  const activeCity = cities.find(c => c.id === activeTab)
  const phase = tripPhase(trip)
  const nights = tripNights(trip)

  async function handleEnableSync() {
    setEnabling(true)
    setShareError('')
    const code = await enableSync()
    setEnabling(false)
    if (code) setShowShare(true)
    else setShareError("Couldn't reach the sync server, so sharing isn't on. Try again later.")
  }

  // Background geocoder: resolve lat/lng for places that don't have them yet
  useEffect(() => {
    const queue = places.filter(p => !p.lat && !p.lng && !p.geocodeFailed && p.name)
    if (!queue.length) return
    let cancelled = false
    let i = 0
    async function next() {
      if (cancelled || i >= queue.length) return
      const place = queue[i++]
      const city = cities.find(c => c.id === place.cityId)
      // Always include city name to avoid wrong-city matches
      const q = encodeURIComponent([place.name, city?.name].filter(Boolean).join(', '))
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        if (data[0]) {
          dispatch({
            type: 'UPDATE_PLACE',
            id: place.id,
            payload: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) },
          })
        } else {
          // Mark failed so we don't retry forever
          dispatch({ type: 'UPDATE_PLACE', id: place.id, payload: { geocodeFailed: true } })
        }
      } catch {}
      if (!cancelled) setTimeout(next, 1100)
    }
    next()
    return () => { cancelled = true }
  }, [places.filter(p => !p.lat && !p.geocodeFailed).map(p => p.id).join(',')])

  function handleUpdate(data) {
    dispatch({ type: 'UPDATE_TRIP', id: trip.id, payload: data })
    setEditing(false)
  }

  function selectTab(id) {
    setActiveTab(id)
    setCityView('places')
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary' },
    ...cities.map((c, i) => ({ id: c.id, label: c.name, badge: i + 1 })),
    { id: 'flights', label: 'Flights' },
  ]

  const phaseChip = {
    upcoming: 'bg-accent/10 text-accent-soft border-accent/20',
    now: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    past: 'bg-white/5 text-ink-3 border-white/10',
    draft: 'bg-white/5 text-ink-3 border-white/10',
  }[phase.phase]

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-56px)]">
      {/* Map: banner on phones, right-hand pane on desktop */}
      <div className="order-first lg:order-last lg:flex-1 lg:flex lg:h-full">
        <MapPanel
          trip={trip}
          places={places}
          flights={flights}
          activeCityId={activeCity?.id || null}
          onCityClick={selectTab}
        />
      </div>

      <div className="panel-left lg:overflow-y-auto">
        {/* Trip header */}
        <div className="px-4 sm:px-6 pt-5 lg:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${phaseChip}`}>
                {phase.phase === 'now' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />}
                {phase.label}
              </span>
              <h1 className="mt-3 text-[26px] leading-tight font-bold tracking-tight text-ink font-display">{trip.name}</h1>
              <p className="text-sm text-ink-3 mt-1">
                {formatDateRange(trip.startDate, trip.endDate) || 'No dates yet'}
                {nights != null && <span className="text-ink-4"> · {nights} nights</span>}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 pt-1">
              {isConfigured && (
                shareCode ? (
                  <button onClick={() => setShowShare(s => !s)} className="btn-secondary py-2 px-3 text-xs font-mono tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
                    {shareCode}
                  </button>
                ) : (
                  <button onClick={handleEnableSync} disabled={enabling} className="btn-icon disabled:opacity-50" aria-label="Share trip" title="Share trip">
                    {enabling
                      ? <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      : <Share className="w-4 h-4" />}
                  </button>
                )
              )}
              <button onClick={() => setEditing(true)} className="btn-icon" aria-label="Edit trip" title="Edit trip">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showShare && shareCode && <SharePanel shareCode={shareCode} />}
          </AnimatePresence>
          {shareError && (
            <p className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{shareError}</p>
          )}
        </div>

        {/* Tabs — stick under the app header while scrolling */}
        <div className="sticky top-14 lg:top-0 z-[900] bg-bg/85 backdrop-blur-xl mt-4 px-4 sm:px-6 py-2.5 border-b border-white/[0.06]">
          <PillTabs tabs={tabs} active={activeTab} onChange={selectTab} layoutId="trip-tab" />
        </div>

        <div className="px-4 sm:px-6 py-5 pb-24">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} {...fade}>
              {activeTab === 'overview' && (
                <OverviewPanel
                  trip={trip}
                  places={places}
                  flights={flights}
                  hotels={hotels}
                  onCityClick={selectTab}
                  onImport={() => setShowImport(true)}
                  onFlights={() => selectTab('flights')}
                />
              )}
              {activeTab === 'flights' && <FlightTimeline tripId={trip.id} />}
              {activeTab === 'itinerary' && <TripItinerary trip={trip} />}
              {activeCity && (
                <div className="space-y-4">
                  <Segmented
                    value={cityView}
                    onChange={setCityView}
                    options={[
                      { id: 'places', label: 'Places', icon: <MapPin className="w-3.5 h-3.5" /> },
                      { id: 'hotels', label: 'Hotels', icon: <Bed className="w-3.5 h-3.5" /> },
                      { id: 'itinerary', label: 'Plan', icon: <Calendar className="w-3.5 h-3.5" /> },
                    ]}
                  />
                  <AnimatePresence mode="wait">
                    <motion.div key={cityView} {...fade}>
                      {cityView === 'places' && <PlaceList tripId={trip.id} cityId={activeCity.id} cityName={activeCity.name} />}
                      {cityView === 'hotels' && <HotelList tripId={trip.id} cityId={activeCity.id} cityName={activeCity.name} />}
                      {cityView === 'itinerary' && <ItineraryBuilder tripId={trip.id} cityId={activeCity.id} city={activeCity} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {editing && <TripForm initial={trip} onSave={handleUpdate} onClose={() => setEditing(false)} />}

      {showImport && (
        <TakeoutImport
          cities={cities}
          existingPlaces={places}
          onImport={items => {
            items.forEach(data => dispatch({ type: 'ADD_PLACE', payload: { ...data, tripId: trip.id } }))
            setShowImport(false)
          }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
