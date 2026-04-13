/**
 * MediGuide AI — HospitalMapView
 * Interactive map rendering hospitals from search results.
 */

import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'
import { useState, useCallback } from 'react'
import { getDirectionsUrl, formatDistance } from '../../services/mapsHelper'
import Spinner from '../shared/Spinner'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
}

export default function HospitalMapView({ hospitals, centerLat, centerLng }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  const [selectedHospital, setSelectedHospital] = useState(null)
  
  const handleMarkerClick = useCallback((hospital) => {
    setSelectedHospital(hospital)
  }, [])

  if (loadError) return <div className="p-8 text-center text-red-400 bg-surface-900 rounded-2xl">Google Maps API key is invalid or not provided.</div>
  if (!isLoaded) return <div className="h-full flex items-center justify-center py-20"><Spinner text="Loading Map..." /></div>
  
  const center = { lat: centerLat || 18.5204, lng: centerLng || 73.8567 }

  return (
    <div className="w-full h-[60vh] rounded-2xl overflow-hidden glass-card border border-surface-700/50 shadow-xl relative animate-fade-in z-0">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={center}
        options={mapOptions}
        onClick={() => setSelectedHospital(null)}
      >
        {/* User Location Marker */}
        <Marker 
          position={center} 
          icon={{
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' width='24' fill='%231a6ff5'%3E%3Ccircle cx='12' cy='12' r='8'/%3E%3C/svg%3E",
          }}
          title="Your current location"
        />

        {/* Hospital Markers */}
        {hospitals.map((h) => (
          <Marker
            key={h.id}
            position={{ lat: h.lat, lng: h.lng }}
            onClick={() => handleMarkerClick(h)}
            icon={{
              url: h.has_emergency 
                ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" /* Emergency: Red */
                : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" /* Others: Blue */
            }}
          />
        ))}

        {selectedHospital && (
          <InfoWindow
            position={{ lat: selectedHospital.lat, lng: selectedHospital.lng }}
            onCloseClick={() => setSelectedHospital(null)}
          >
            <div className="text-surface-900 p-1 min-w-[200px] font-sans">
              <h3 className="font-bold text-sm mb-1 text-slate-800">{selectedHospital.name}</h3>
              {selectedHospital.hospital_type && (
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                  {selectedHospital.hospital_type}
                </p>
              )}
              {selectedHospital.distance_km && (
                <p className="text-xs mb-3 text-slate-600">
                  {formatDistance(selectedHospital.distance_km)} away
                </p>
              )}
              <div className="mt-2 text-center">
                <a 
                  href={getDirectionsUrl(selectedHospital.lat, selectedHospital.lng, selectedHospital.name, selectedHospital.city)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-600 text-white text-xs font-semibold px-4 py-2 rounded shadow hover:bg-primary-700 transition"
                >
                  Get Directions
                </a>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}
