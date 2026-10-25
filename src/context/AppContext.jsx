import { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)

const STORAGE_KEY = 'tripthat_data'

const initialState = {
  trips: [],
  places: [],
  flights: [],
  itinerary: [],
  hotels: [],
}

function migrateData(raw) {
  if (!raw) return null
  const slotTimes = { morning: '09:00', afternoon: '13:00', evening: '18:00', night: '21:00' }
  return {
    ...raw,
    hotels: raw.hotels || [],
    itinerary: (raw.itinerary || []).map(day => {
      if (Array.isArray(day.blocks)) return day
      const blocks = []
      for (const [slot, items] of Object.entries(day.blocks || {})) {
        for (const block of (items || [])) {
          blocks.push({ ...block, time: block.time || slotTimes[slot] || '09:00' })
        }
      }
      return { ...day, blocks }
    }),
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const migrated = migrateData(parsed)
      return { ...initialState, ...migrated }
    }
  } catch {}
  return initialState
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function reducer(state, action) {
  let next
  switch (action.type) {
    case 'ADD_TRIP': {
      const trip = { id: uid(), createdAt: new Date().toISOString(), ...action.payload }
      next = { ...state, trips: [...state.trips, trip] }
      break
    }
    case 'UPDATE_TRIP': {
      next = {
        ...state,
        trips: state.trips.map(t => t.id === action.id ? { ...t, ...action.payload } : t),
      }
      break
    }
    case 'DELETE_TRIP': {
      next = {
        trips: state.trips.filter(t => t.id !== action.id),
        places: state.places.filter(p => p.tripId !== action.id),
        flights: state.flights.filter(f => f.tripId !== action.id),
        itinerary: state.itinerary.filter(d => d.tripId !== action.id),
        hotels: (state.hotels || []).filter(h => h.tripId !== action.id),
      }
      break
    }
    case 'ADD_PLACE': {
      const place = { id: uid(), createdAt: new Date().toISOString(), ...action.payload }
      next = { ...state, places: [...state.places, place] }
      break
    }
    case 'UPDATE_PLACE': {
      next = {
        ...state,
        places: state.places.map(p => p.id === action.id ? { ...p, ...action.payload } : p),
      }
      break
    }
    case 'DELETE_PLACE': {
      const placeId = action.id
      next = {
        ...state,
        places: state.places.filter(p => p.id !== placeId),
        itinerary: state.itinerary.map(day => ({
          ...day,
          blocks: day.blocks.filter(b => b.placeId !== placeId),
        })),
      }
      break
    }
    case 'ADD_FLIGHT': {
      const flight = { id: uid(), createdAt: new Date().toISOString(), ...action.payload }
      next = { ...state, flights: [...state.flights, flight] }
      break
    }
    case 'UPDATE_FLIGHT': {
      next = {
        ...state,
        flights: state.flights.map(f => f.id === action.id ? { ...f, ...action.payload } : f),
      }
      break
    }
    case 'DELETE_FLIGHT': {
      next = { ...state, flights: state.flights.filter(f => f.id !== action.id) }
      break
    }
    case 'UPSERT_DAY': {
      const { tripId, cityId, date } = action.payload
      const exists = state.itinerary.find(d => d.tripId === tripId && d.cityId === cityId && d.date === date)
      if (exists) {
        next = state
      } else {
        const day = { id: uid(), tripId, cityId, date, blocks: [] }
        next = { ...state, itinerary: [...state.itinerary, day] }
      }
      break
    }
    case 'ADD_BLOCK': {
      const { dayId, block } = action.payload
      const newBlock = { id: uid(), ...block }
      next = {
        ...state,
        itinerary: state.itinerary.map(day =>
          day.id === dayId
            ? { ...day, blocks: [...day.blocks, newBlock] }
            : day
        ),
      }
      break
    }
    case 'UPDATE_BLOCK': {
      const { dayId, blockId, data } = action.payload
      next = {
        ...state,
        itinerary: state.itinerary.map(day =>
          day.id === dayId
            ? { ...day, blocks: day.blocks.map(b => b.id === blockId ? { ...b, ...data } : b) }
            : day
        ),
      }
      break
    }
    case 'DELETE_BLOCK': {
      const { dayId, blockId } = action.payload
      next = {
        ...state,
        itinerary: state.itinerary.map(day =>
          day.id === dayId
            ? { ...day, blocks: day.blocks.filter(b => b.id !== blockId) }
            : day
        ),
      }
      break
    }
    case 'REORDER_BLOCKS': {
      const { dayId, blocks } = action.payload
      next = {
        ...state,
        itinerary: state.itinerary.map(day =>
          day.id === dayId ? { ...day, blocks } : day
        ),
      }
      break
    }
    case 'LOAD_SHARED_TRIP': {
      const { trip: st, places: sp, flights: sf, hotels: sh, itinerary: si } = action.payload
      if (!st) { next = state; break }
      next = {
        ...state,
        trips:     state.trips.find(t => t.id === st.id)
          ? state.trips.map(t => t.id === st.id ? { ...t, ...st } : t)
          : [...state.trips, st],
        places:    [...state.places.filter(p => p.tripId !== st.id),    ...(sp || [])],
        flights:   [...state.flights.filter(f => f.tripId !== st.id),   ...(sf || [])],
        hotels:    [...(state.hotels || []).filter(h => h.tripId !== st.id), ...(sh || [])],
        itinerary: [...state.itinerary.filter(d => d.tripId !== st.id), ...(si || [])],
      }
      break
    }
    case 'ADD_HOTEL': {
      const hotel = { id: uid(), createdAt: new Date().toISOString(), ...action.payload }
      next = { ...state, hotels: [...(state.hotels || []), hotel] }
      break
    }
    case 'UPDATE_HOTEL': {
      next = {
        ...state,
        hotels: (state.hotels || []).map(h => h.id === action.id ? { ...h, ...action.payload } : h),
      }
      break
    }
    case 'DELETE_HOTEL': {
      next = { ...state, hotels: (state.hotels || []).filter(h => h.id !== action.id) }
      break
    }
    default:
      next = state
  }
  saveToStorage(next)
  return next
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
