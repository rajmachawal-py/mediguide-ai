/**
 * MediGuide AI — EmergencyAlert
 * Full-screen emergency overlay with ambulance call and nearest hospital.
 */

import { FiPhone, FiNavigation, FiAlertTriangle } from 'react-icons/fi'

export default function EmergencyAlert({ hospital, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="urgency-emergency rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
          <FiAlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <h2 className="text-xl font-bold text-red-400">
          🚨 Emergency Detected
        </h2>

        <p className="text-sm text-surface-300">
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
            className="flex items-center justify-center gap-2 bg-red-900/50 hover:bg-red-900 text-red-300 font-semibold px-6 py-3 rounded-xl transition-all"
          >
            <FiPhone className="w-4 h-4" />
            Emergency — 112
          </a>
        </div>

        {/* Nearest Hospital */}
        {hospital && (
          <div className="glass-card p-4 text-left space-y-2">
            <p className="text-xs text-surface-400 uppercase tracking-wide">Nearest Emergency Hospital</p>
            <p className="font-semibold text-white">{hospital.name}</p>
            {hospital.distance_km && (
              <p className="text-sm text-surface-300">
                📍 {hospital.distance_km.toFixed(1)} km away
              </p>
            )}
            {hospital.google_maps_url && (
              <a
                href={hospital.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-400 text-sm hover:underline"
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
