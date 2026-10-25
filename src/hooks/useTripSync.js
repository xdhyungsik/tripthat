import { useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'

function buildSnapshot(tripId, state) {
  return {
    trip:      state.trips.find(t => t.id === tripId),
    places:    state.places.filter(p => p.tripId === tripId),
    flights:   state.flights.filter(f => f.tripId === tripId),
    hotels:    (state.hotels || []).filter(h => h.tripId === tripId),
    itinerary: state.itinerary.filter(d => d.tripId === tripId),
  }
}

// Stable random ID per browser tab to prevent echo
function getClientId() {
  let id = sessionStorage.getItem('tripthat_client')
  if (!id) { id = Math.random().toString(36).slice(2); sessionStorage.setItem('tripthat_client', id) }
  return id
}

export function useTripSync(tripId, state, dispatch) {
  const clientId = useMemo(getClientId, [])
  const trip = state.trips.find(t => t.id === tripId)
  const shareCode = trip?.shareCode || null
  const lastPushedRef = useRef(null)
  const debounceRef   = useRef(null)

  // Push local changes → Supabase (debounced 2s, skip if unchanged)
  useEffect(() => {
    if (!supabase || !shareCode) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const snapshot = buildSnapshot(tripId, state)
      const str = JSON.stringify(snapshot)
      if (str === lastPushedRef.current) return
      try {
        await supabase.from('shared_trips').upsert({
          share_code: shareCode,
          trip_data:  snapshot,
          updated_by: clientId,
          updated_at: new Date().toISOString(),
        })
        lastPushedRef.current = str
      } catch {}
    }, 2000)
    return () => clearTimeout(debounceRef.current)
  })  // run on every render so any state change is caught

  // Listen for remote changes
  useEffect(() => {
    if (!supabase || !shareCode) return
    const channel = supabase
      .channel(`trip-sync-${shareCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'shared_trips', filter: `share_code=eq.${shareCode}` },
        payload => {
          if (payload.new.updated_by === clientId) return
          const data = payload.new.trip_data
          lastPushedRef.current = JSON.stringify(data)
          dispatch({ type: 'LOAD_SHARED_TRIP', payload: data })
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [shareCode])

  async function enableSync() {
    if (!supabase) return null
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const snapshot = buildSnapshot(tripId, state)
    const str = JSON.stringify(snapshot)
    try {
      // supabase-js reports failures in `error` instead of throwing
      const { error } = await supabase.from('shared_trips').insert({
        share_code: code,
        trip_data:  snapshot,
        updated_by: clientId,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      lastPushedRef.current = str
      dispatch({ type: 'UPDATE_TRIP', id: tripId, payload: { shareCode: code } })
      return code
    } catch (e) {
      console.error('Supabase enableSync error:', e)
      return null
    }
  }

  async function joinTrip(code) {
    if (!supabase) return { error: 'Supabase not configured.' }
    try {
      const { data, error } = await supabase
        .from('shared_trips')
        .select('trip_data')
        .eq('share_code', code.trim().toUpperCase())
        .single()
      if (error || !data) return { error: 'Trip not found. Check the code and try again.' }
      lastPushedRef.current = JSON.stringify(data.trip_data)
      dispatch({ type: 'LOAD_SHARED_TRIP', payload: data.trip_data })
      return { ok: true }
    } catch {
      return { error: 'Could not connect to sync server.' }
    }
  }

  return { shareCode, enableSync, joinTrip, isConfigured: !!supabase }
}
