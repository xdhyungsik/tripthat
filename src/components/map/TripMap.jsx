import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNow } from '../../hooks/useNow'
import { flightPhase } from '../../utils/helpers'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function toRad(d) { return d * Math.PI / 180 }
function toDeg(r) { return r * 180 / Math.PI }

// Compute great-circle arc with antimeridian-safe continuous longitudes
function greatCircleArc(from, to, n = 80) {
  const [lat1, lng1] = from
  const [lat2, lng2] = to
  const φ1 = toRad(lat1), λ1 = toRad(lng1)
  const φ2 = toRad(lat2), λ2 = toRad(lng2)

  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
  ))

  if (d < 0.0001) return [from, to]

  const raw = []
  for (let i = 0; i <= n; i++) {
    const f = i / n
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
    const z = A * Math.sin(φ1) + B * Math.sin(φ2)
    raw.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))])
  }

  // Make longitudes continuous across the antimeridian
  const pts = [raw[0]]
  for (let i = 1; i < raw.length; i++) {
    let lng = raw[i][1]
    const prev = pts[i - 1][1]
    while (lng - prev > 180) lng -= 360
    while (lng - prev < -180) lng += 360
    pts.push([raw[i][0], lng])
  }
  return pts
}

// Shift all points by a longitude offset (for world copies)
function shiftLng(pts, offset) {
  return pts.map(([lat, lng]) => [lat, lng + offset])
}

// On-screen heading between two points (Web Mercator), degrees clockwise from north
function screenHeading(a, b) {
  const mercY = lat => Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2))
  return toDeg(Math.atan2(toRad(b[1] - a[1]), mercY(b[0]) - mercY(a[0])))
}

// Point and heading at fraction f along an arc
function alongArc(arc, f) {
  const i = Math.min(arc.length - 2, Math.max(0, Math.round(f * (arc.length - 1))))
  return { pos: arc[i], heading: screenHeading(arc[i], arc[i + 1]) }
}

const PHASE_COLOR = { inair: '#34D399', upcoming: '#4F8CFF', landed: '#7A818D', unscheduled: '#4F8CFF' }

const PLANE_SVG = '<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>'

function createCityIcon(label, active = false) {
  const size = active ? 34 : 28
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${active ? '#4F8CFF' : '#1D2027'};
      border:2px solid ${active ? '#C7DAFF' : '#4F8CFF'};
      display:flex;align-items:center;justify-content:center;
      font:700 ${active ? 13 : 12}px -apple-system,Inter,system-ui,sans-serif;color:#fff;
      box-shadow:0 0 0 ${active ? 6 : 4}px rgba(79,140,255,${active ? 0.25 : 0.15}),0 6px 16px rgba(0,0,0,0.5);
      transition:all .2s;
    ">${label}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

function createPlaceIcon(color) {
  return L.divIcon({
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};border:2.5px solid #0B0C0F;
      box-shadow:0 0 0 1px ${color}80,0 0 12px ${color}aa;
    "></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

function createAirportIcon(iata) {
  return L.divIcon({
    html: `<div style="
      transform:translate(-50%,-50%);display:inline-block;
      background:rgba(21,23,28,0.92);border:1px solid rgba(255,255,255,0.14);
      border-radius:7px;padding:3px 7px;
      font:700 11px 'SF Mono',ui-monospace,Menlo,monospace;letter-spacing:.06em;color:#F4F6FA;
      box-shadow:0 4px 12px rgba(0,0,0,0.5);white-space:nowrap;
    ">${iata}</div>`,
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -14],
  })
}

function createPlaneIcon(heading, color) {
  return L.divIcon({
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${color};display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 0 4px ${color}33,0 0 18px ${color}99;
    "><svg viewBox="0 0 24 24" width="15" height="15" fill="#0B0C0F" style="transform:rotate(${heading}deg)">${PLANE_SVG}</svg></div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

const CATEGORY_COLOR = {
  Food: '#FB923C',
  Sightseeing: '#38BDF8',
  Accommodation: '#A78BFA',
  'Night Market': '#F472B6',
  Shopping: '#34D399',
  Other: '#9CA3AF',
}

function FitBounds({ cities, flightCoords, placePts, hasActivePlaces }) {
  const map = useMap()
  useEffect(() => {
    const pts = [
      ...cities.filter(c => c.lat && c.lng).map(c => [c.lat, c.lng]),
      ...flightCoords,
      ...placePts,
    ]
    if (!pts.length) return
    if (pts.length === 1) {
      map.flyTo(pts[0], hasActivePlaces ? 13 : 11, { duration: 0.8 })
    } else {
      // For city+places view use tighter zoom; for full-trip overview cap lower
      const maxZoom = hasActivePlaces ? 14 : 6
      map.flyToBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom, duration: 0.8 })
    }
  }, [
    cities.map(c => `${c.lat},${c.lng}`).join(),
    flightCoords.map(p => p.join()).join(),
    placePts.map(p => p.join()).join(),
  ])
  return null
}

// One world copy to the right (0→360) for Pacific arcs, standard left edge
const MAX_BOUNDS = [[-85, -180], [85, 380]]

export default function TripMap({ cities, places = [], flights = [], onCityClick, height = '100%', activeCityId }) {
  const now = useNow(60000)
  const validCities = useMemo(() => cities.filter(c => c.lat && c.lng), [cities])
  const center = validCities.length > 0 ? [validCities[0].lat, validCities[0].lng] : [20, 0]
  const activeCityData = activeCityId ? validCities.find(c => c.id === activeCityId) : null

  // Places with coordinates for the active city only
  const activePlaces = useMemo(() =>
    activeCityId
      ? places.filter(p => p.cityId === activeCityId && p.lat && p.lng)
      : [],
    [places, activeCityId]
  )

  const placePts = useMemo(() => activePlaces.map(p => [p.lat, p.lng]), [activePlaces])

  // City-to-city route: connect consecutive city markers
  const cityArc = useMemo(() => {
    if (validCities.length < 2) return []
    const pts = [[validCities[0].lat, validCities[0].lng]]
    for (let i = 1; i < validCities.length; i++) {
      const arc = greatCircleArc(pts[pts.length - 1], [validCities[i].lat, validCities[i].lng])
      pts.splice(pts.length, 0, ...arc.slice(1))
    }
    return pts
  }, [validCities])

  // Per-flight great-circle arcs
  const flightArcs = useMemo(() =>
    flights.filter(f => f.originCoords && f.destinationCoords).map(f => ({
      id: f.id,
      flight: f,
      origin: f.origin,
      destination: f.destination,
      airline: f.airline,
      arc: greatCircleArc(
        [f.originCoords.lat, f.originCoords.lng],
        [f.destinationCoords.lat, f.destinationCoords.lng]
      ),
    }))
  , [flights])

  // Use the arc's own (continuous) endpoints so Pacific crossings fit as one span
  const flightCoords = useMemo(() =>
    flightArcs.flatMap(f => [f.arc[0], f.arc[f.arc.length - 1]])
  , [flightArcs])

  return (
    <MapContainer
      center={center}
      zoom={validCities.length > 0 ? 6 : 2}
      style={{ height, width: '100%' }}
      className="tiles-dark"
      zoomControl={true}
      minZoom={2}
      maxBounds={MAX_BOUNDS}
      maxBoundsViscosity={1}
      worldCopyJump={false}
    >
      {/* OSM standard tiles, recolored dark in CSS (.tiles-dark) — free, no key */}
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {/* City route — two world copies (0 and +360) */}
      {cityArc.length > 1 && [0, 360].map(offset => (
        <Polyline
          key={`city-${offset}`}
          positions={shiftLng(cityArc, offset)}
          pathOptions={{ color: '#8DB4FF', weight: 2, opacity: 0.45, className: 'route-arc' }}
        />
      ))}

      {/* Flight arcs: soft glow underneath, animated dashes on top */}
      {flightArcs.flatMap(f => {
        const phase = flightPhase(f.flight, now)
        const color = PHASE_COLOR[phase.phase]
        const plane = alongArc(f.arc, phase.phase === 'inair' ? phase.progress : phase.phase === 'landed' ? 1 : 0.5)
        return [0, 360].flatMap(offset => [
          <Polyline
            key={`${f.id}-glow-${offset}`}
            positions={shiftLng(f.arc, offset)}
            pathOptions={{ color, weight: 7, opacity: phase.phase === 'landed' ? 0.06 : 0.16, lineCap: 'round' }}
          />,
          <Polyline
            key={`${f.id}-line-${offset}`}
            positions={shiftLng(f.arc, offset)}
            pathOptions={{ color, weight: 2.5, opacity: phase.phase === 'landed' ? 0.5 : 0.95, className: phase.phase === 'landed' ? '' : 'flight-arc' }}
          >
            <Popup>
              <div className="py-0.5 min-w-[140px]">
                <div className="font-bold text-sm tracking-wide">{f.origin} → {f.destination}</div>
                {f.airline && <div className="text-xs opacity-60 mt-0.5">{f.airline}{f.flight.flightNumber ? ` · ${f.flight.flightNumber}` : ''}</div>}
              </div>
            </Popup>
          </Polyline>,
          phase.phase !== 'landed' && (
            <Marker
              key={`${f.id}-plane-${offset}`}
              position={[plane.pos[0], plane.pos[1] + offset]}
              icon={createPlaneIcon(plane.heading, color)}
              interactive={false}
            />
          ),
        ])
      })}

      {/* Airport labels at the arc ends */}
      {flightArcs.flatMap(f => [
        <Marker key={`${f.id}-orig`} position={f.arc[0]} icon={createAirportIcon(f.origin)} interactive={false} />,
        <Marker key={`${f.id}-dest`} position={f.arc[f.arc.length - 1]} icon={createAirportIcon(f.destination)} interactive={false} />,
      ])}

      {/* Place markers for active city */}
      {activePlaces.map(place => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={createPlaceIcon(CATEGORY_COLOR[place.category] || CATEGORY_COLOR.Other)}
        >
          <Popup>
            <div className="py-0.5 min-w-[140px]">
              <div className="font-semibold text-sm">{place.name}</div>
              {place.category && <div className="text-xs mt-0.5" style={{ color: CATEGORY_COLOR[place.category] }}>{place.category}</div>}
              {place.notes && <div className="text-xs opacity-60 mt-1">{place.notes}</div>}
              {place.link && (
                <a href={place.link} target="_blank" rel="noopener noreferrer" className="text-xs mt-1.5 block" style={{ color: '#8DB4FF' }}>
                  Open in Maps ↗
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* City markers */}
      {validCities.map((city, i) => (
        <Marker
          key={city.id}
          position={[city.lat, city.lng]}
          icon={createCityIcon(i + 1, city.id === activeCityId)}
          eventHandlers={{ click: () => onCityClick && onCityClick(city.id) }}
          zIndexOffset={city.id === activeCityId ? 1000 : 500}
        >
          <Popup>
            <div className="py-0.5 min-w-[130px]">
              <div className="font-semibold text-sm">{city.name}</div>
              {city.country && <div className="text-xs opacity-60 mt-0.5">{city.country}</div>}
              {places.filter(p => p.cityId === city.id).length > 0 && (
                <div className="text-xs mt-1" style={{ color: '#8DB4FF' }}>
                  {places.filter(p => p.cityId === city.id).length} saved places
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      <FitBounds
        cities={activeCityData ? [activeCityData] : validCities}
        flightCoords={activeCityData ? [] : flightCoords}
        placePts={placePts}
        hasActivePlaces={activePlaces.length > 0}
      />
    </MapContainer>
  )
}
