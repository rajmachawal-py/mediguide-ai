/**
 * MediGuide AI — mapsHelper
 * Utility functions for Google Maps URLs, distance formatting, and navigation.
 */

/**
 * Generate a Google Maps Directions URL.
 * Uses hospital name + city as destination for accurate place resolution.
 * Raw lat/lng coordinates often resolve to nearby buildings instead of
 * the actual hospital — using the name ensures Google Maps finds the
 * correct place.
 */
export const getDirectionsUrl = (hospitalLat, hospitalLng, hospitalName, city) => {
  if (hospitalName) {
    const query = city ? `${hospitalName}, ${city}` : hospitalName
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`
  }
  // Fallback to raw coordinates if name not available
  return `https://www.google.com/maps/dir/?api=1&destination=${hospitalLat},${hospitalLng}&travelmode=driving`
}

/**
 * Generate Google Maps embed URL for a hospital location.
 */
export const getEmbedUrl = (lat, lng) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}`
}

/**
 * Ambulance emergency number for India.
 */
export const getAmbulanceLink = () => 'tel:108'

/**
 * Format distance for display.
 * Shows meters for distances under 1km, otherwise km with 1 decimal.
 *
 * NOTE: The distance shown on hospital cards is "straight-line" (Haversine).
 * Actual road distance may be 20-40% longer. Click "Directions" for exact
 * driving/walking distance via Google Maps.
 */
export const formatDistance = (km) => {
  if (km == null) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/**
 * Calculate straight-line (Haversine) distance between two coordinates.
 * Returns distance in km. Used as client-side fallback.
 */
export const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
