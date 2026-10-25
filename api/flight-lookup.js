// Server-side proxy for AeroDataBox so the RapidAPI key never ships to the browser.
// Runs as a Vercel function in production and as Vite dev middleware locally (see vite.config.js).

const RAPIDAPI_HOST = 'aerodatabox.p.rapidapi.com'

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

export default async function handler(req, res) {
  const params = new URL(req.url, 'http://localhost').searchParams
  const number = (params.get('number') || '').replace(/\s+/g, '').toUpperCase()
  const date = params.get('date') || ''

  if (!/^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(number) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return send(res, 400, { message: 'Enter a valid flight number and date.' })
  }

  const key = process.env.RAPIDAPI_KEY
  if (!key) return send(res, 500, { message: 'Flight lookup is not configured.' })

  try {
    const upstream = await fetch(
      `https://${RAPIDAPI_HOST}/flights/number/${encodeURIComponent(number)}/${date}`,
      { headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': RAPIDAPI_HOST } }
    )
    const text = await upstream.text()
    // AeroDataBox answers 204 with an empty body when nothing matches
    if (upstream.status === 204 || !text) {
      return send(res, 404, { message: 'No flight found for that number and date.' })
    }
    return send(res, upstream.status, text)
  } catch {
    return send(res, 502, { message: 'Could not reach the flight data service.' })
  }
}
