/**
 * MediGuide AI — EmergencyAlert
 * Full-screen emergency overlay with ambulance call and nearest hospital.
 * Clinical Intelligence design: white card with error accent.
 */

import { FiPhone, FiNavigation, FiAlertTriangle } from 'react-icons/fi'

export default function EmergencyAlert({ hospital, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center clinical-glass-overlay p-4 animate-fade-in">
      <div className="clinical-glass rounded-clinical-xl p-6 max-w-sm w-full text-center space-y-4 shadow-clinical-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center">
          <FiAlertTriangle className="w-8 h-8 text-error" />
        </div>

        <h2 className="text-xl font-bold font-display text-error">
          🚨 Emergency Detected
        </h2>

        <p className="text-sm text-on-surface-variant">
          Based on your symptoms, this appears to be an emergency.
          Please call an ambulance immediately.
        </p>

        {/* Ambulance Call Buttons */}
        <div className="space-y-2">
          <a
            href="tel:108"
            className="btn-emergency w-full flex items-center justify-center gap-2"
          >
            <FiPhone className="w-5 h-5" />
            Call Ambulance — 108
          </a>
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 bg-error/10 hover:bg-error/15 text-error font-semibold px-6 py-3 rounded-clinical transition-all"
          >
            <FiPhone className="w-4 h-4" />
            Emergency — 112
          </a>
        </div>

        {/* Nearest Hospital */}
        {hospital && (
          <div className="clinical-card-flat p-4 text-left space-y-2">
            <p className="text-clinical-meta">Nearest Emergency Hospital</p>
            <p className="font-semibold text-on-surface">{hospital.name}</p>
            {hospital.distance_km && (
              <p className="text-sm text-on-surface-variant">
                📍 {hospital.distance_km.toFixed(1)} km away
              </p>
            )}
            {hospital.google_maps_url && (
              <a
                href={hospital.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
              >
                <FiNavigation className="w-3 h-3" /> Get Directions
              </a>
            )}
          </div>
        )}

        <button
          onClick={onDismiss}
          className="btn-ghost text-sm w-full"
        >
          I understand — continue
        </button>
      </div>
    </div>
  )
}
