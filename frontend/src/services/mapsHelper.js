/**
 * MediGuide AI — mapsHelper
 * Utility functions for Google Maps URLs and distance formatting.
 */

export const getDirectionsUrl = (lat, lng) => 
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

export const getEmbedUrl = (lat, lng) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}`
}

export const getAmbulanceLink = () => 'tel:108'

export const formatDistance = (km) => {
  if (km == null) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
