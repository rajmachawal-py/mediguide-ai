/**
 * MediGuide AI — useGeolocation Hook
 * Browser Geolocation API wrapper with fallback defaults.
 */

import { useState, useEffect, useCallback } from 'react'

// Fallback city-level defaults
const DEFAULTS = {
  pune:   { lat: 18.5204, lng: 73.8567 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
}

export default function useGeolocation() {
  const [location, setLocation] = useState(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem('mediguide_location')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return null
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLocation(DEFAULTS.pune) // fallback
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        setLocation(loc)
        localStorage.setItem('mediguide_location', JSON.stringify(loc))
        setLoading(false)
      },
      (err) => {
        console.warn('Geolocation error:', err.message)
        setError(err.message)
        // Fallback to Pune
        const fallback = DEFAULTS.pune
        setLocation(fallback)
        localStorage.setItem('mediguide_location', JSON.stringify(fallback))
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 min cache
      }
    )
  }, [])

  // Auto-request on mount if no saved location
  useEffect(() => {
    if (!location) {
      requestLocation()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    accuracy: location?.accuracy ?? null,
    error,
    loading,
    requestLocation,
  }
}
