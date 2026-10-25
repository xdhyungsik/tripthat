import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

function buildTripContext(trip, places, flights) {
  if (!trip) return ''
  const cityList = trip.cities?.map(c =>
    `${c.name}${c.country ? ', ' + c.country : ''}${c.startDate ? ` (${c.startDate} to ${c.endDate})` : ''}`
  ).join(' → ') || ''

  const placesByCityStr = trip.cities?.map(city => {
    const cp = places.filter(p => p.tripId === trip.id && p.cityId === city.id)
    if (!cp.length) return null
    return `${city.name}:\n${cp.map(p => `  - ${p.name} (${p.category}${p.status !== 'Want to Go' ? ', ' + p.status : ''}${p.notes ? ': ' + p.notes.slice(0, 80) : ''})`).join('\n')}`
  }).filter(Boolean).join('\n\n') || 'None yet'

  const flightList = flights.filter(f => f.tripId === trip.id)
    .map(f => `  ${f.origin} → ${f.destination}${f.departureTime ? ' on ' + f.departureTime.slice(0, 10) : ''}`)
    .join('\n') || 'None yet'

  return `<trip_context>\nTrip: ${trip.name}\nDates: ${trip.startDate || '?'} to ${trip.endDate || '?'}\nCities: ${cityList}\n\nSaved places:\n${placesByCityStr}\n\nFlights:\n${flightList}\n</trip_context>`
}

export default function AIAssistant({ trip }) {
  const { state } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const context = buildTripContext(trip, state.places, state.flights)

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    if (!API_KEY) { setError('Add VITE_ANTHROPIC_API_KEY to your .env file to use the AI assistant.'); return }
    setError('')
    const userMsg = { role: 'user', content: text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: `You are a helpful travel planning assistant. The user is organizing a personal trip.\n\n${context}\n\nAnswer concisely. Don't recommend specific places unless asked — the user does their own research. Help with logistics, timing, and organization.`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `API error ${res.status}`)
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.content?.[0]?.text || 'No response.' }])
    } catch (e) {
      setError(e.message || 'Failed to get a response.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const suggestions = [
    'How should I split my time across cities?',
    'What order should I visit these cities?',
    'Help me balance my itinerary — am I over-packing one city?',
    'Suggest a rainy day backup plan',
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="font-bold text-slate-900 text-lg">AI Assistant</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your saved places and flights are included as context</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-2">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus() }}
                className="w-full text-left text-sm text-slate-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 px-4 py-3 rounded-xl transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="pt-3 border-t border-slate-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="input flex-1 resize-none py-2.5 text-sm"
            rows={2}
            placeholder="Ask about your trip…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()} className="btn-primary px-4 self-end disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
