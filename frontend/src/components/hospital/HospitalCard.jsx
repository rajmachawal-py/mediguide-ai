/**
 * MediGuide AI — HospitalCard
 * Clinical Intelligence hospital card component.
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
    <div className="clinical-card p-4 space-y-3">
      {/* Name + Type Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-on-surface text-sm truncate">
            {getHospitalName(hospital)}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            {hospital.address}
          </p>
        </div>
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          hospital.hospital_type === 'government' ? 'bg-tertiary/10 text-tertiary' :
          hospital.hospital_type === 'trust'      ? 'bg-primary/10 text-primary' :
          'bg-secondary/10 text-secondary'
        }`}>
          {hospital.hospital_type}
        </span>
      </div>

      {/* Info Row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">

        {hospital.rating && (
          <span className="flex items-center gap-1" title="Google rating">
            <FiStar className="w-3 h-3 text-moderate" />
            {hospital.rating}
          </span>
        )}
        {hospital.is_24x7 && (
          <span className="flex items-center gap-1" title="Open 24/7">
            <FiClock className="w-3 h-3 text-tertiary" />
            24/7
          </span>
        )}
        {hospital.has_emergency && (
          <span className="triage-badge triage-badge-emergency">
            🚨 Emergency
          </span>
        )}
      </div>

      {/* Specialties */}
      {hospital.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hospital.specialties.slice(0, 5).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-[10px]">
              {s}
            </span>
          ))}
          {hospital.specialties.length > 5 && (
            <span className="text-[10px] text-outline">+{hospital.specialties.length - 5}</span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <a
          href={getDirectionsUrl(hospital.lat, hospital.lng, hospital.name, hospital.city)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-clinical bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-all"
        >
          <FiNavigation className="w-3 h-3" />
          {language === 'hi' ? 'दिशा' : language === 'mr' ? 'दिशा' : 'Directions'}
        </a>
        {hospital.phone && (
          <a
            href={`tel:${hospital.phone.replace(/[^\d+]/g, '')}`}
            onClick={(e) => {
              if (!/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
                e.preventDefault()
                navigator.clipboard.writeText(hospital.phone).then(() => {
                  alert(`Phone number copied: ${hospital.phone}`)
                })
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-clinical bg-tertiary/10 text-tertiary text-xs font-medium hover:bg-tertiary/15 transition-all"
            title={hospital.phone}
          >
            <FiPhone className="w-3 h-3" />
            {language === 'en' ? 'Call' : 'कॉल'}
          </a>
        )}
        {hospital.has_ambulance && (
          <a
            href="tel:108"
            onClick={(e) => {
              if (!/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
                e.preventDefault()
                navigator.clipboard.writeText('108').then(() => {
                  alert('Emergency number copied: 108')
                })
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-clinical bg-error/10 text-error text-xs font-medium hover:bg-error/15 transition-all"
            title="Call Ambulance: 108"
          >
            🚑 108
          </a>
        )}
        {hospital.id === '00000000-0000-0000-0000-000000000003' ? (
          <Link
            to={`/map/${hospital.id}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-clinical bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/15 transition-all"
          >
            <FiMap className="w-3 h-3" />
            {language === 'hi' ? 'नक्शा' : language === 'mr' ? 'नकाशा' : 'Indoor Map'}
          </Link>
        ) : (
          <span
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-clinical bg-surface-container text-outline text-xs font-medium cursor-not-allowed"
            title={language === 'hi' ? 'जल्द आ रहा है' : 'Coming Soon'}
          >
            <FiMap className="w-3 h-3" />
            {language === 'hi' ? 'जल्द ही' : language === 'mr' ? 'लवकरच' : 'Coming Soon'}
          </span>
        )}
      </div>
    </div>
  )
}
