/**
 * MediGuide AI — HospitalCard
 * Presentational component for a hospital card in the hospital list.
 */

import { Link } from 'react-router-dom'
import { FiMapPin, FiPhone, FiClock, FiNavigation, FiStar, FiMap } from 'react-icons/fi'
import { getDirectionsUrl, getAmbulanceLink, formatDistance } from '../../services/mapsHelper'

export default function HospitalCard({ hospital, language = 'en' }) {
  const getHospitalName = (h) => {
    if (language === 'hi' && h.name_hi) return h.name_hi
    if (language === 'mr' && h.name_mr) return h.name_mr
    return h.name
  }

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Name + Type Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">
            {getHospitalName(hospital)}
          </h3>
          <p className="text-xs text-surface-400 mt-0.5 truncate">
            {hospital.address}
          </p>
        </div>
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          hospital.hospital_type === 'government' ? 'bg-green-500/20 text-green-400' :
          hospital.hospital_type === 'trust'      ? 'bg-blue-500/20 text-blue-400' :
          'bg-purple-500/20 text-purple-400'
        }`}>
          {hospital.hospital_type}
        </span>
      </div>

      {/* Info Row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-surface-300">
        {hospital.distance_km != null && (
          <span className="flex items-center gap-1" title="Distance from current location">
            <FiNavigation className="w-3 h-3 text-primary-400" />
            ~{formatDistance(hospital.distance_km)}
          </span>
        )}
        {hospital.rating && (
          <span className="flex items-center gap-1" title="Google rating">
            <FiStar className="w-3 h-3 text-yellow-400" />
            {hospital.rating}
          </span>
        )}
        {hospital.is_24x7 && (
          <span className="flex items-center gap-1" title="Open 24/7">
            <FiClock className="w-3 h-3 text-green-400" />
            24/7
          </span>
        )}
        {hospital.has_emergency && (
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
            🚨 Emergency
          </span>
        )}
      </div>

      {/* Specialties */}
      {hospital.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hospital.specialties.slice(0, 5).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-surface-800/80 text-surface-300 text-[10px]">
              {s}
            </span>
          ))}
          {hospital.specialties.length > 5 && (
            <span className="text-[10px] text-surface-400">+{hospital.specialties.length - 5}</span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <a
          href={getDirectionsUrl(hospital.lat, hospital.lng, hospital.name, hospital.city)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600/20 text-primary-400 text-xs font-medium hover:bg-primary-600/30 transition-all font-sans"
        >
          <FiNavigation className="w-3 h-3" />
          {language === 'hi' ? 'दिशा' : language === 'mr' ? 'दिशा' : 'Directions'}
        </a>
        {hospital.phone && (
          <a
            href={`tel:${hospital.phone}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-600/20 text-green-400 text-xs font-medium hover:bg-green-600/30 transition-all"
          >
            <FiPhone className="w-3 h-3" />
            {language === 'en' ? 'Call' : 'कॉल'}
          </a>
        )}
        {hospital.has_ambulance && (
          <a
            href={getAmbulanceLink()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 transition-all"
          >
            🚑 108
          </a>
        )}
        <Link
          to={`/map/${hospital.id}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-accent-600/20 text-accent-400 text-xs font-medium hover:bg-accent-600/30 transition-all"
        >
          <FiMap className="w-3 h-3" />
          {language === 'hi' ? 'नक्शा' : language === 'mr' ? 'नकाशा' : 'Indoor Map'}
        </Link>
      </div>
    </div>
  )
}
