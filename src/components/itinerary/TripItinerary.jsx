import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatDate, formatTimeLocal, formatDateTimeLocal, categoryDotColor } from '../../utils/helpers'

function FlightItem({ flight }) {
  const dep = flight.departureTimeUTC ? new Date(flight.departureTimeUTC)
    : flight.departureTime ? new Date(flight.departureTime + 'Z') : null
  const arr = flight.arrivalTimeUTC ? new Date(flight.arrivalTimeUTC)
    : flight.arrivalTime ? new Date(flight.arrivalTime + 'Z') : null
  const duration = dep && arr ? Math.round((arr - dep) / 60000) : null

  const depDisplay = flight.departureTime ? formatTimeLocal(flight.departureTime) : '--:--'
  const arrDisplay = flight.arrivalTime ? formatTimeLocal(flight.arrivalTime) : '--:--'

  return (
    <div className="flex items-start gap-0">
      <div className="w-20 text-right pr-3 pt-0.5 flex-shrink-0">
        <span className="text-xs font-medium text-teal-400 tabular-nums">{depDisplay}</span>
      </div>
      {/* Tall teal line for in-flight block */}
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        <div className="w-3 h-3 rounded-full ring-2 ring-surface bg-teal-500 flex-shrink-0 z-10" />
        <div className="w-0.5 bg-teal-400/30 flex-1 min-h-[60px]" />
        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-surface bg-teal-400/60 flex-shrink-0 z-10" />
      </div>
      <div className="flex-1 min-w-0 pl-3 pb-4">
        <div className="bg-teal-400/10 border border-teal-400/25 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="text-sm font-semibold text-teal-100">
              {flight.origin} → {flight.destination}
            </span>
            {flight.confirmationCode && (
              <span className="ml-auto text-xs font-mono font-bold text-teal-300 bg-teal-400/15 border border-teal-400/25 px-1.5 py-0.5 rounded">
                {flight.confirmationCode}
              </span>
            )}
          </div>
          {flight.airline && (
            <div className="text-xs text-teal-300 mb-1.5">
              {flight.airline}{flight.flightNumber ? ` · ${flight.flightNumber}` : ''}
            </div>
          )}
          {/* Departure → in-flight → arrival layout */}
          <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-400/10 rounded-lg px-3 py-2">
            <div className="text-center">
              <div className="font-bold text-teal-200 text-sm">{flight.origin}</div>
              <div className="tabular-nums">{depDisplay}</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 w-full">
                <div className="flex-1 h-px bg-teal-400/60" />
                <svg className="w-3 h-3 text-teal-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
                <div className="flex-1 h-px bg-teal-400/60" />
              </div>
              {duration && (
                <span className="text-[10px] text-teal-400 whitespace-nowrap">
                  {Math.floor(duration / 60)}h {duration % 60}m
                </span>
              )}
            </div>
            <div className="text-center">
              <div className="font-bold text-teal-200 text-sm">{flight.destination}</div>
              <div className="tabular-nums">{arrDisplay}</div>
            </div>
          </div>
          {flight.notes && (
            <div className="text-xs text-teal-400 mt-2 pt-2 border-t border-teal-400/25">{flight.notes}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ArrivalItem({ flight }) {
  const arrDisplay = flight.arrivalTime ? formatTimeLocal(flight.arrivalTime) : '--:--'
  return (
    <div className="flex items-start gap-0">
      <div className="w-20 text-right pr-3 pt-0.5 flex-shrink-0">
        <span className="text-xs font-medium text-teal-400 tabular-nums">{arrDisplay}</span>
      </div>
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        <div className="w-3 h-3 rounded-full ring-2 ring-surface bg-teal-400 flex-shrink-0" />
      </div>
      <div className="flex-1 min-w-0 pl-3 pb-4">
        <div className="text-sm font-semibold text-teal-200">
          ✈ Arrives {flight.destination}
        </div>
        {flight.airline && (
          <div className="text-xs text-teal-400 mt-0.5">
            {flight.airline}{flight.flightNumber ? ` ${flight.flightNumber}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}

function HotelCheckInItem({ hotel }) {
  const timeDisplay = hotel.checkIn ? formatTimeLocal(hotel.checkIn) : '--:--'
  return (
    <div className="flex items-start gap-0">
      <div className="w-20 text-right pr-3 pt-0.5 flex-shrink-0">
        <span className="text-xs font-medium text-violet-300 tabular-nums">{timeDisplay}</span>
      </div>
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        <div className="w-3 h-3 rounded-full ring-2 ring-surface bg-violet-400 flex-shrink-0" />
      </div>
      <div className="flex-1 min-w-0 pl-3 pb-4">
        <div className="text-sm font-semibold text-violet-200">
          Check-in: {hotel.name}
        </div>
        {hotel.address && !hotel.address.startsWith('http') && (
          <button
            onClick={() => {
              const url = hotel.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`
              window.open(url, '_blank', 'noopener')
            }}
            className="text-xs text-accent hover:underline text-left mt-0.5"
          >
            {hotel.address}
          </button>
        )}
      </div>
    </div>
  )
}

function HotelCheckOutItem({ hotel }) {
  const timeDisplay = hotel.checkOut ? formatTimeLocal(hotel.checkOut) : '--:--'
  return (
    <div className="flex items-start gap-0">
      <div className="w-20 text-right pr-3 pt-0.5 flex-shrink-0">
        <span className="text-xs font-medium text-violet-400 tabular-nums">{timeDisplay}</span>
      </div>
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        <div className="w-3 h-3 rounded-full ring-2 ring-surface bg-violet-500/30 flex-shrink-0" />
      </div>
      <div className="flex-1 min-w-0 pl-3 pb-4">
        <div className="text-sm font-semibold text-violet-400">
          Check-out: {hotel.name}
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ block, place, cityName }) {
  const dotColor = place ? categoryDotColor(place.category) : '#94a3b8'

  return (
    <div className="flex items-start gap-0">
      <div className="w-20 text-right pr-3 pt-0.5 flex-shrink-0">
        <span className="text-xs font-medium text-ink-3 tabular-nums">
          {block.time
            ? (() => {
                const [h, m] = block.time.split(':').map(Number)
                const ampm = h >= 12 ? 'PM' : 'AM'
                return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
              })()
            : '--:--'
          }
        </span>
      </div>
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        <div className="w-3 h-3 rounded-full ring-2 ring-surface" style={{ background: dotColor }} />
      </div>
      <div className="flex-1 min-w-0 pl-3 pb-4">
        <div className="text-sm font-semibold text-ink leading-tight">
          {place ? place.name : block.customActivity || 'Activity'}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {place && <span className="text-xs text-ink-3">{place.category}</span>}
          {cityName && <span className="text-xs text-ink-4">· {cityName}</span>}
        </div>
        {block.notes && <div className="text-xs text-ink-3 mt-0.5">{block.notes}</div>}
      </div>
    </div>
  )
}

export default function TripItinerary({ trip }) {
  const { state } = useApp()
  const places = state.places.filter(p => p.tripId === trip.id)
  const flights = state.flights.filter(f => f.tripId === trip.id)
  const hotels = (state.hotels || []).filter(h => h.tripId === trip.id)
  const itinerary = state.itinerary.filter(d => d.tripId === trip.id)
  const cities = trip.cities || []

  const dateMap = useMemo(() => {
    const map = {}

    flights.forEach(f => {
      if (!f.departureTime) return
      const depDate = f.departureTime.slice(0, 10)
      if (!map[depDate]) map[depDate] = []
      map[depDate].push({
        type: 'flight',
        sortTime: f.departureTime,  // local time for within-day ordering
        data: f,
      })

      // If arrival is on a different day, add arrival entry on that day
      if (f.arrivalTime) {
        const arrDate = f.arrivalTime.slice(0, 10)
        if (arrDate !== depDate) {
          if (!map[arrDate]) map[arrDate] = []
          map[arrDate].push({
            type: 'arrival',
            sortTime: f.arrivalTime,  // local time for within-day ordering
            data: f,
          })
        }
      }
    })

    hotels.forEach(h => {
      if (h.checkIn) {
        const checkInDate = h.checkIn.slice(0, 10)
        if (!map[checkInDate]) map[checkInDate] = []
        map[checkInDate].push({
          type: 'hotel-checkin',
          sortTime: h.checkIn,
          data: h,
        })
      }
      if (h.checkOut) {
        const checkOutDate = h.checkOut.slice(0, 10)
        if (!map[checkOutDate]) map[checkOutDate] = []
        map[checkOutDate].push({
          type: 'hotel-checkout',
          sortTime: h.checkOut,
          data: h,
        })
      }
    })

    itinerary.forEach(day => {
      const city = cities.find(c => c.id === day.cityId)
      if (!map[day.date]) map[day.date] = []
      day.blocks.forEach(block => {
        map[day.date].push({
          type: 'activity',
          sortTime: `${day.date}T${block.time || '00:00'}`,
          data: { ...block, cityName: city?.name },
        })
      })
    })

    Object.values(map).forEach(items =>
      items.sort((a, b) => (a.sortTime || '').localeCompare(b.sortTime || ''))
    )

    return map
  }, [flights, hotels, itinerary, cities])

  const sortedDates = useMemo(() => Object.keys(dateMap).sort(), [dateMap])

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-line rounded-2xl bg-surface">
        <svg className="w-10 h-10 text-ink-4 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-ink-3 mb-1">No itinerary yet</p>
        <p className="text-xs text-ink-4">Add flights or plan days in each city tab to build your full itinerary here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map(date => {
        const items = dateMap[date]
        const city = cities.find(c => c.startDate <= date && c.endDate >= date)

        return (
          <div key={date} className="card p-4">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-line">
              <div className="w-10 h-10 rounded-xl bg-accent flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-accent/40 uppercase leading-none">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-base font-bold text-white leading-tight">
                  {new Date(date + 'T00:00:00').getDate()}
                </span>
              </div>
              <div>
                <div className="font-semibold text-ink text-sm">{formatDate(date)}</div>
                {city && <div className="text-xs text-ink-3">{city.name}{city.country ? `, ${city.country}` : ''}</div>}
              </div>
              <div className="ml-auto text-xs text-ink-3">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-2 bottom-0 bg-raised" style={{ left: '5.25rem', width: '1px' }} />
              {items.map((item, idx) => (
                <span key={idx}>
                  {item.type === 'flight' && <FlightItem flight={item.data} />}
                  {item.type === 'arrival' && <ArrivalItem flight={item.data} />}
                  {item.type === 'hotel-checkin' && <HotelCheckInItem hotel={item.data} />}
                  {item.type === 'hotel-checkout' && <HotelCheckOutItem hotel={item.data} />}
                  {item.type === 'activity' && (
                    <ActivityItem
                      block={item.data}
                      place={places.find(p => p.id === item.data.placeId)}
                      cityName={item.data.cityName}
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
