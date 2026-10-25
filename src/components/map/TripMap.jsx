import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

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

function createCityIcon(label, active = false) {
  return L.divIcon({
    html: `<div style="
      background: ${active ? '#2563eb' : '#1e40af'};
      border: 2.5px solid ${active ? '#93c5fd' : '#60a5fa'};
      border-radius: 50%;
      width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: white;
      box-shadow: 0 2px 8px rgba(37,99,235,0.4);
      font-family: Inter, system-ui, sans-serif;
    ">${label}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  })
}

function createPlaceIcon(color) {
  return L.divIcon({
    html: `<div style="
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      width: 14px; height: 14px;
      box-shadow: 0 1px 5px rgba(0,0,0,0.35);
    "></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

const CATEGORY_COLOR = {
  Food: '#f97316',
  Sightseeing: '#3b82f6',
  Accommodation: '#8b5cf6',
  'Night Market': '#ec4899',
  Shopping: '#10b981',
  Other: '#94a3b8',
}

function createAirportIcon(iata) {
  return L.divIcon({
    html: `<div style="
      background: #0f766e;
      border: 2px solid white;
      border-radius: 4px;
      padding: 2px 5px;
      font-size: 10px; font-weight: 700; color: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      font-family: Inter, system-ui, sans-serif;
      white-space: nowrap;
    ">${iata}</div>`,
    className: '',
    iconSize: [null, 20],
    iconAnchor: [20, 10],
    popupAnchor: [0, -12],
  })
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
      map.setView(pts[0], hasActivePlaces ? 13 : 11)
    } else {
      // For city+places view use tighter zoom; for full-trip overview cap lower
      const maxZoom = hasActivePlaces ? 14 : 6
      map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom })
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

  const placePts = useMemo(() =>
    activePlaces.map(p => [p.lat, p.lng]),
    [activePlaces]
  )

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
      origin: f.origin,
      destination: f.destination,
      airline: f.airline,
      arc: greatCircleArc(
        [f.originCoords.lat, f.originCoords.lng],
        [f.destinationCoords.lat, f.destinationCoords.lng]
      ),
      originCoords: f.originCoords,
      destinationCoords: f.destinationCoords,
    }))
  , [flights])

  // Natural airport coordinates for FitBounds (not shifted)
  const flightCoords = useMemo(() =>
    flights.flatMap(f => {
      const pts = []
      if (f.originCoords) pts.push([f.originCoords.lat, f.originCoords.lng])
      if (f.destinationCoords) pts.push([f.destinationCoords.lat, f.destinationCoords.lng])
      return pts
    })
  , [flights])

  return (
    <MapContainer
      center={center}
      zoom={validCities.length > 0 ? 6 : 2}
      style={{ height, width: '100%' }}
      zoomControl={true}
      minZoom={3}
      maxBounds={MAX_BOUNDS}
      maxBoundsViscosity={1}
    >
      {/* OSM standard tiles: free, no key — CARTO basemaps started requiring an API key */}
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
          pathOptions={{ color: '#2563eb', weight: 2, dashArray: '6 5', opacity: 0.5 }}
        />
      ))}

      {/* Flight great-circle arcs — two world copies */}
      {flightArcs.map(f =>
        [0, 360].map(offset => (
          <Polyline
            key={`${f.id}-${offset}`}
            positions={shiftLng(f.arc, offset)}
            pathOptions={{ color: '#0d9488', weight: 2.5, dashArray: '8 5', opacity: 0.85 }}
          >
            {offset === 360 && (
              <Popup>
                <div className="py-1 min-w-[120px]">
                  <div className="font-semibold text-slate-900 text-sm">{f.origin} → {f.destination}</div>
                  {f.airline && <div className="text-xs text-slate-500 mt-0.5">{f.airline}</div>}
                </div>
              </Popup>
            )}
          </Polyline>
        ))
      )}

      {/* Airport markers at natural coords */}
      {flightArcs.map(f => (
        <>
          <Marker key={`${f.id}-orig`} position={[f.originCoords.lat, f.originCoords.lng]} icon={createAirportIcon(f.origin)}>
            <Popup><div className="text-sm font-semibold">{f.origin}</div></Popup>
          </Marker>
          <Marker key={`${f.id}-dest`} position={[f.destinationCoords.lat, f.destinationCoords.lng]} icon={createAirportIcon(f.destination)}>
            <Popup><div className="text-sm font-semibold">{f.destination}</div></Popup>
          </Marker>
        </>
      ))}

      {/* Place markers for active city */}
      {activePlaces.map(place => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={createPlaceIcon(CATEGORY_COLOR[place.category] || CATEGORY_COLOR.Other)}
        >
          <Popup>
            <div className="py-1 min-w-[130px]">
              <div className="font-semibold text-slate-900 text-sm">{place.name}</div>
              {place.category && <div className="text-xs text-slate-500 mt-0.5">{place.category}</div>}
              {place.notes && <div className="text-xs text-slate-400 mt-1">{place.notes}</div>}
              {place.link && (
                <a href={place.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">
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
        >
          <Popup>
            <div className="py-1 min-w-[120px]">
              <div className="font-semibold text-slate-900 text-sm">{city.name}</div>
              {city.country && <div className="text-xs text-slate-500 mt-0.5">{city.country}</div>}
              {city.startDate && (
                <div className="text-xs text-slate-400 mt-1">
                  {city.startDate}{city.endDate && city.startDate !== city.endDate ? ` — ${city.endDate}` : ''}
                </div>
              )}
              {places.filter(p => p.cityId === city.id).length > 0 && (
                <div className="text-xs text-blue-600 mt-1">
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
