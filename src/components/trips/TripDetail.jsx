import { useState, lazy, Suspense, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useTripSync } from '../../hooks/useTripSync'
import PlaceList from '../places/PlaceList'
import FlightTimeline from '../flights/FlightTimeline'
import HotelList from '../hotels/HotelList'
import ItineraryBuilder from '../itinerary/ItineraryBuilder'
import TripItinerary from '../itinerary/TripItinerary'
import TakeoutImport from '../places/TakeoutImport'
import TripForm from './TripForm'
import { formatDate } from '../../utils/helpers'

const TripMap = lazy(() => import('../map/TripMap'))

function MapPanel({ trip, places, flights, activeCityId, onCityClick }) {
  return (
    <div className="map-panel flex-1 relative bg-slate-100">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center bg-slate-100">
          <div className="text-sm text-slate-400">Loading map...</div>
        </div>
      }>
        <TripMap
          cities={trip.cities || []}
          places={places}
          flights={flights}
          activeCityId={activeCityId}
          onCityClick={onCityClick}
          height="100%"
        />
      </Suspense>
    </div>
  )
}

function OverviewPanel({ trip, places, flights, onCityClick, onImport }) {
  return (
    <div className="p-5 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: trip.cities?.length || 0, label: 'Cities' },
          { value: places.length, label: 'Places' },
          { value: flights.length, label: 'Flights' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {trip.cities?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cities</h3>
            <button onClick={onImport} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import from Google Maps
            </button>
          </div>
          <div className="space-y-2">
            {trip.cities.map((city, i) => {
              const cityPlaces = places.filter(p => p.cityId === city.id)
              return (
                <button
                  key={city.id}
                  onClick={() => onCityClick(city.id)}
                  className="w-full card p-3 hover:border-blue-300 hover:shadow-md transition-all text-left flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm">{city.name}</div>
                    {city.country && <div className="text-xs text-slate-400">{city.country}</div>}
                    {city.startDate && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDate(city.startDate)}{city.endDate ? ` — ${formatDate(city.endDate)}` : ''}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0">{cityPlaces.length} places</div>
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {flights.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Flights</h3>
          <div className="space-y-2">
            {[...flights].sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime)).map(f => (
              <div key={f.id} className="card px-4 py-3 flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-slate-900">{f.origin}</span>
                  <span className="text-slate-400 mx-1.5">→</span>
                  <span className="font-medium text-sm text-slate-900">{f.destination}</span>
                  {f.departureTime && (
                    <span className="text-xs text-slate-400 ml-2">{f.departureTime.slice(0, 10)}</span>
                  )}
                </div>
                {f.confirmationCode && (
                  <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{f.confirmationCode}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function exportTrip(trip, state) {
  const tripId = trip.id
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    trip,
    places:    state.places.filter(p => p.tripId === tripId),
    flights:   state.flights.filter(f => f.tripId === tripId),
    hotels:    (state.hotels || []).filter(h => h.tripId === tripId),
    itinerary: state.itinerary.filter(d => d.tripId === tripId),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${trip.name.replace(/[^a-z0-9]/gi, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TripDetail({ trip }) {
  const { dispatch, state } = useApp()
  const [activeTab, setActiveTab] = useState('overview')
  const [cityView, setCityView] = useState('places')
  const [editing, setEditing] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [copied, setCopied] = useState(false)

  const { shareCode, enableSync, isConfigured } = useTripSync(trip.id, state, dispatch)

  async function handleEnableSync() {
    setEnabling(true)
    await enableSync()
    setEnabling(false)
    setShowShare(true)
  }

  function copyCode() {
    navigator.clipboard.writeText(shareCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const places = state.places.filter(p => p.tripId === trip.id)
  const flights = state.flights.filter(f => f.tripId === trip.id)

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

  const cities = trip.cities || []
  const activeCity = cities.find(c => c.id === activeTab)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary' },
    ...cities.map(c => ({ id: c.id, label: c.name, isCity: true })),
    { id: 'flights', label: 'Flights' },
  ]

  const showFullWidth = activeTab === 'flights' || activeTab === 'itinerary'
  const showMap = !showFullWidth

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Trip header + tabs */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="px-5 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 text-lg leading-tight">{trip.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDate(trip.startDate)}{trip.endDate ? ` — ${formatDate(trip.endDate)}` : ''}
              {cities.length > 0 && (
                <span className="ml-2">{cities.map(c => c.name).join(' → ')}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isConfigured && (
              shareCode ? (
                <button
                  onClick={() => setShowShare(s => !s)}
                  className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  {shareCode}
                </button>
              ) : (
                <button
                  onClick={handleEnableSync}
                  disabled={enabling}
                  className="btn-secondary text-xs py-1.5 px-3 gap-1.5 disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {enabling ? 'Sharing…' : 'Share'}
                </button>
              )
            )}
            <button onClick={() => setEditing(true)} className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        {showShare && shareCode && (
          <div className="mx-5 mb-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-800 mb-0.5">Share code</p>
              <p className="text-xs text-green-700">Your GF/brother opens the app → "Join Trip" → enters this code. Changes sync in real-time.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono font-bold text-lg text-green-900 tracking-widest">{shareCode}</span>
              <button
                onClick={copyCode}
                className="btn-secondary text-xs py-1 px-2"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-0 px-5 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCityView('places') }}
              className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      {showFullWidth ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-5 py-6">
            {activeTab === 'flights' && <FlightTimeline tripId={trip.id} />}
            {activeTab === 'itinerary' && <TripItinerary trip={trip} />}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="panel-left overflow-y-auto">
            {activeTab === 'overview' && (
              <OverviewPanel
                trip={trip}
                places={places}
                flights={flights}
                onCityClick={id => setActiveTab(id)}
                onImport={() => setShowImport(true)}
              />
            )}

            {activeCity && (
              <div className="flex flex-col h-full">
                <div className="flex border-b border-slate-100 bg-slate-50 flex-shrink-0">
                  {['places', 'hotels', 'itinerary'].map(v => (
                    <button
                      key={v}
                      onClick={() => setCityView(v)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-colors capitalize ${cityView === v ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {cityView === 'places' && (
                    <PlaceList tripId={trip.id} cityId={activeCity.id} cityName={activeCity.name} />
                  )}
                  {cityView === 'hotels' && (
                    <HotelList tripId={trip.id} cityId={activeCity.id} cityName={activeCity.name} />
                  )}
                  {cityView === 'itinerary' && (
                    <ItineraryBuilder tripId={trip.id} cityId={activeCity.id} city={activeCity} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right map panel */}
          <MapPanel
            trip={trip}
            places={places}
            flights={flights}
            activeCityId={activeCity?.id || null}
            onCityClick={id => setActiveTab(id)}
          />
        </div>
      )}

      {editing && (
        <TripForm initial={trip} onSave={handleUpdate} onClose={() => setEditing(false)} />
      )}

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
