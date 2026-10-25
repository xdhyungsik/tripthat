import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import TripList from './components/trips/TripList'
import TripDetail from './components/trips/TripDetail'

// The open trip lives in the URL hash (#/trip/<id>) so the phone's back gesture works
function readTripId() {
  const m = window.location.hash.match(/^#\/trip\/(.+)$/)
  return m ? decodeURIComponent(m[1]) : null
}

function useHashTrip() {
  const [tripId, setTripId] = useState(readTripId)
  useEffect(() => {
    const onHash = () => setTripId(readTripId())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const open = id => { window.location.hash = id ? `/trip/${encodeURIComponent(id)}` : '/' }
  return [tripId, open]
}

const page = {
  initial: dir => ({ opacity: 0, x: dir * 24 }),
  animate: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit: dir => ({ opacity: 0, x: dir * -16, transition: { duration: 0.18, ease: 'easeIn' } }),
}

function AppContent() {
  const { state } = useApp()
  const [selectedTripId, openTrip] = useHashTrip()
  const selectedTrip = selectedTripId ? state.trips.find(t => t.id === selectedTripId) : null

  // Trip was deleted or the link is stale — fall back to the list
  useEffect(() => {
    if (selectedTripId && !selectedTrip) openTrip(null)
  }, [selectedTripId, selectedTrip])

  const dir = selectedTrip ? 1 : -1

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Header onHome={() => openTrip(null)} currentTrip={selectedTrip || null} />
      <main>
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={selectedTrip ? selectedTrip.id : 'home'}
            custom={dir}
            variants={page}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {selectedTrip ? (
              <TripDetail trip={selectedTrip} />
            ) : (
              <TripList onOpenTrip={trip => openTrip(trip.id)} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
