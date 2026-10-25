import { useState, useRef } from 'react'
import Modal from '../Modal'
import { CATEGORIES } from '../../utils/helpers'

// ── Parsers ──────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const fields = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (c === ',' && !inQuote) {
      fields.push(cur); cur = ''
    } else {
      cur += c
    }
  }
  fields.push(cur)
  return fields.map(f => f.trim())
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
  const titleIdx = headers.findIndex(h => ['title', 'name', 'place name', 'place'].includes(h))
  const noteIdx  = headers.findIndex(h => ['note', 'notes', 'comment', 'description'].includes(h))
  const urlIdx   = headers.findIndex(h => ['url', 'link', 'google maps url'].includes(h))

  const places = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const f = parseCSVLine(lines[i])
    const name = (titleIdx >= 0 ? f[titleIdx] : f[0]) || ''
    if (!name.trim()) continue
    places.push({
      name: name.trim(),
      notes: noteIdx >= 0 ? (f[noteIdx] || '').trim() : '',
      link:  urlIdx  >= 0 ? (f[urlIdx]  || '').trim() : '',
      address: '',
    })
  }
  return places
}

function parseTakeoutJSON(json) {
  const places = []
  if (json?.features) {
    for (const f of json.features) {
      const p = f.properties || {}
      const loc = p.Location || {}
      const name = p.Title || loc['Business Name'] || ''
      if (!name) continue
      places.push({ name, address: loc.Address || '', link: p['Google Maps URL'] || '', notes: '' })
    }
  }
  return places
}

// ── City matching ─────────────────────────────────────────────────────────────

function guessCity(filename, cities) {
  const base = filename.replace(/\.[^.]+$/, '').toLowerCase().replace(/[_\-]/g, ' ').trim()
  const exact = cities.find(c => c.name.toLowerCase() === base)
  if (exact) return exact.id
  const partial = cities.find(c =>
    base.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(base)
  )
  return partial?.id || cities[0]?.id || ''
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TakeoutImport({ onImport, onClose, cities, existingPlaces }) {
  const [step, setStep] = useState('upload')
  const [fileGroups, setFileGroups] = useState([])  // [{filename, places, cityId, enabled, category}]
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const existingNames = new Set(existingPlaces.map(p => p.name.toLowerCase()))

  async function loadFiles(files) {
    const groups = []
    for (const file of files) {
      const text = await file.text()
      let places = []
      if (file.name.endsWith('.json')) {
        try { places = parseTakeoutJSON(JSON.parse(text)) } catch {}
      } else {
        places = parseCSV(text)
      }
      if (!places.length) continue
      groups.push({
        filename: file.name,
        places,
        cityId: guessCity(file.name, cities),
        enabled: true,
        category: 'Food',
      })
    }
    if (!groups.length) {
      setError('No places found in the selected files.')
      return
    }
    setFileGroups(groups)
    setStep('map')
    setError('')
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    loadFiles(Array.from(e.dataTransfer.files))
  }

  function updateGroup(i, patch) {
    setFileGroups(gs => gs.map((g, idx) => idx === i ? { ...g, ...patch } : g))
  }

  function handleImport() {
    const toImport = []
    for (const g of fileGroups) {
      if (!g.enabled) continue
      for (const p of g.places) {
        toImport.push({
          name: p.name,
          address: p.address,
          link: p.link,
          notes: p.notes,
          category: g.category,
          status: 'Want to Go',
          isBackup: false,
          cuisine: '', priceRange: '', mustTryDish: '',
          cityId: g.cityId,
        })
      }
    }
    onImport(toImport)
  }

  const totalSelected = fileGroups.filter(g => g.enabled).reduce((n, g) => n + g.places.length, 0)
  const totalDupes = fileGroups.filter(g => g.enabled).reduce((n, g) =>
    n + g.places.filter(p => existingNames.has(p.name.toLowerCase())).length, 0
  )

  return (
    <Modal title="Import from Google Maps" onClose={onClose} wide>
      {step === 'upload' ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-2">
            Drop your city CSV files all at once — each file will be auto-matched to the right city.
            Or drop a <span className="font-mono text-xs bg-raised px-1 rounded">Saved Places.json</span> from Google Takeout.
          </p>

          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
              dragging ? 'border-accent bg-accent/10' : 'border-line hover:border-accent/50 hover:bg-raised'
            }`}
          >
            <svg className="w-10 h-10 text-ink-4 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-semibold text-ink-2">Drop all your city files here</p>
            <p className="text-xs text-ink-3 mt-1">Supports multiple .csv files or a single Saved Places.json — click to browse</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              multiple
              className="hidden"
              onChange={e => loadFiles(Array.from(e.target.files))}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                {fileGroups.length} file{fileGroups.length !== 1 ? 's' : ''} loaded
              </p>
              <p className="text-xs text-ink-3 mt-0.5">
                {totalSelected} places to import
                {totalDupes > 0 && <span className="text-amber-500"> · {totalDupes} already saved</span>}
              </p>
            </div>
            <button
              onClick={() => { setStep('upload'); setFileGroups([]) }}
              className="text-xs text-ink-3 hover:text-ink-2"
            >
              ← Load different files
            </button>
          </div>

          {/* File → city mapping table */}
          <div className="space-y-2">
            {fileGroups.map((g, i) => {
              const dupes = g.places.filter(p => existingNames.has(p.name.toLowerCase())).length
              const cityName = cities.find(c => c.id === g.cityId)?.name || '—'
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    g.enabled ? 'bg-surface border-line' : 'bg-raised border-line opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={g.enabled}
                    onChange={e => updateGroup(i, { enabled: e.target.checked })}
                    className="rounded flex-shrink-0"
                  />

                  {/* Filename + count */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-ink-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-ink-2 truncate">{g.filename}</span>
                    </div>
                    <div className="text-xs text-ink-3 mt-0.5 ml-5">
                      {g.places.length} places
                      {dupes > 0 && <span className="text-amber-500"> · {dupes} already saved</span>}
                    </div>
                  </div>

                  <svg className="w-4 h-4 text-ink-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>

                  {/* City selector */}
                  <select
                    className="input w-auto py-1.5 text-xs flex-shrink-0 max-w-[130px]"
                    value={g.cityId}
                    onChange={e => updateGroup(i, { cityId: e.target.value })}
                  >
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>

                  {/* Category selector */}
                  <select
                    className="input w-auto py-1.5 text-xs flex-shrink-0 max-w-[100px]"
                    value={g.category}
                    onChange={e => updateGroup(i, { category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleImport}
              disabled={totalSelected === 0}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              Import {totalSelected} place{totalSelected !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
