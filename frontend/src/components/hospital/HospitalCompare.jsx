/**
 * MediGuide AI — HospitalCompare
 * Side-by-side hospital comparison table.
 * Accepts 2-3 hospitals and displays key attributes in a comparison grid.
 * Uses Clinical Intelligence Design System (light theme).
 */

import { FiX, FiNavigation, FiStar, FiClock, FiPhone, FiMapPin } from 'react-icons/fi'
import { getDirectionsUrl, formatDistance } from '../../services/mapsHelper'

export default function HospitalCompare({ hospitals = [], onRemove, language = 'en' }) {
  if (hospitals.length < 2) return null

  const rows = [
    {
      label: language === 'hi' ? 'प्रकार' : language === 'mr' ? 'प्रकार' : 'Type',
      key: 'hospital_type',
      render: (h) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          h.hospital_type === 'government' ? 'bg-mild-light text-mild' :
          h.hospital_type === 'trust'      ? 'bg-primary-fixed text-primary' :
          'bg-secondary-fixed text-secondary'
        }`}>
          {h.hospital_type}
        </span>
      ),
    },
    {
      label: language === 'hi' ? 'दूरी' : language === 'mr' ? 'अंतर' : 'Distance',
      key: 'distance_km',
      render: (h) => (
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          <FiNavigation className="w-3 h-3 text-primary" />
          {h.distance_km ? formatDistance(h.distance_km) : '—'}
        </span>
      ),
    },
    {
      label: language === 'hi' ? 'रेटिंग' : language === 'mr' ? 'रेटिंग' : 'Rating',
      key: 'rating',
      render: (h) => (
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          <FiStar className="w-3 h-3 text-yellow-400" />
          {h.rating || '—'}
        </span>
      ),
    },
    {
      label: '24/7',
      key: 'is_24x7',
      render: (h) => (
        <span className={`text-xs ${h.is_24x7 ? 'text-mild' : 'text-outline'}`}>
          {h.is_24x7
            ? (language === 'hi' ? '✓ हाँ' : language === 'mr' ? '✓ होय' : '✓ Yes')
            : (language === 'hi' ? '✗ नहीं' : language === 'mr' ? '✗ नाही' : '✗ No')}
        </span>
      ),
    },
    {
      label: language === 'hi' ? 'आपातकालीन' : language === 'mr' ? 'आणीबाणी' : 'Emergency',
      key: 'has_emergency',
      render: (h) => (
        <span className={`text-xs ${h.has_emergency ? 'text-error' : 'text-outline'}`}>
          {h.has_emergency
            ? (language === 'hi' ? '🚨 हाँ' : language === 'mr' ? '🚨 होय' : '🚨 Yes')
            : (language === 'hi' ? '✗ नहीं' : language === 'mr' ? '✗ नाही' : '✗ No')}
        </span>
      ),
    },
    {
      label: language === 'hi' ? 'बेड' : language === 'mr' ? 'बेड' : 'Beds',
      key: 'bed_count',
      render: (h) => (
        <span className="text-xs text-on-surface-variant">{h.bed_count || '—'}</span>
      ),
    },
    {
      label: language === 'hi' ? 'विशेषताएं' : language === 'mr' ? 'विशेषता' : 'Specialties',
      key: 'specialties',
      render: (h) => (
        <div className="flex flex-wrap gap-1">
          {(h.specialties || []).slice(0, 3).map(s => (
            <span key={s} className="px-1.5 py-0.5 rounded bg-surface-container text-[9px] text-on-surface-variant">
              {s}
            </span>
          ))}
          {(h.specialties || []).length > 3 && (
            <span className="text-[9px] text-outline">+{h.specialties.length - 3}</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="clinical-card overflow-hidden animate-slide-up ghost-border">
      {/* Header row with hospital names */}
      <div className="grid border-b border-outline-variant/20" style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, 1fr)` }}>
        <div className="p-3 bg-surface-container-low">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
            {language === 'hi' ? 'तुलना' : language === 'mr' ? 'तुलना' : 'Compare'}
          </span>
        </div>
        {hospitals.map((h, i) => (
          <div key={h.id || i} className="p-3 bg-primary-fixed/20 border-l border-outline-variant/20 relative">
            <p className="text-xs font-semibold text-on-surface truncate pr-5">{h.name}</p>
            {onRemove && (
              <button
                onClick={() => onRemove(i)}
                className="absolute top-2 right-2 p-1 rounded text-outline hover:text-error transition-colors"
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid border-b border-outline-variant/15 last:border-0"
          style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, 1fr)` }}
        >
          <div className="p-3 flex items-center">
            <span className="text-[10px] text-on-surface-variant font-medium">{row.label}</span>
          </div>
          {hospitals.map((h, i) => (
            <div key={h.id || i} className="p-3 flex items-center border-l border-outline-variant/15">
              {row.render(h)}
            </div>
          ))}
        </div>
      ))}

      {/* Direction buttons */}
      <div className="grid border-t border-outline-variant/20" style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, 1fr)` }}>
        <div className="p-3" />
        {hospitals.map((h, i) => (
          <div key={h.id || i} className="p-2 border-l border-outline-variant/20">
            <a
              href={getDirectionsUrl(h.lat, h.lng, h.name, h.city)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-clinical bg-primary-fixed/40 text-primary text-[10px] font-medium hover:bg-primary-fixed/60 transition-all"
            >
              <FiNavigation className="w-3 h-3" />
              {language === 'hi' ? 'दिशा' : language === 'mr' ? 'दिशा' : 'Directions'}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
