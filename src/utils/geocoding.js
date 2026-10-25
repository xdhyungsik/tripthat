// Free geocoding via Nominatim (no API key required)
const cache = new Map()

export async function geocodeCity(cityName) {
  const key = cityName.toLowerCase().trim()
  if (cache.has(key)) return cache.get(key)

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&featuretype=city`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'TripThat/1.0' },
    })
    const data = await res.json()
    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      cache.set(key, result)
      return result
    }
  } catch {}
  return null
}
