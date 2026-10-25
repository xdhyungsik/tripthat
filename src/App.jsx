import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import TripList from './components/trips/TripList'
import TripDetail from './components/trips/TripDetail'

function AppContent() {
  const { state } = useApp()
  const [selectedTripId, setSelectedTripId] = useState(null)

  const selectedTrip = state.trips.find(t => t.id === selectedTripId)
    || (selectedTripId ? null : null)

  // If the selected trip was deleted, reset
  if (selectedTripId && !selectedTrip) {
    setSelectedTripId(null)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        onHome={() => setSelectedTripId(null)}
        currentTrip={selectedTrip || null}
      />
      <main>
        {selectedTrip ? (
          <TripDetail trip={selectedTrip} />
        ) : (
          <TripList onOpenTrip={trip => setSelectedTripId(trip.id)} />
        )}
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
