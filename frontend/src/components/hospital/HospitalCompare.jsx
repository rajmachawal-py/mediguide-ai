/**
 * MediGuide AI — HospitalCompare
 * Side-by-side hospital comparison table.
 * Accepts 2-3 hospitals and displays key attributes in a comparison grid.
 */

import { FiX, FiNavigation, FiStar, FiClock, FiPhone, FiMapPin } from 'react-icons/fi'
import { getDirectionsUrl, formatDistance } from '../../services/mapsHelper'

export default function HospitalCompare({ hospitals = [], onRemove, language = 'en' }) {
  if (hospitals.length < 2) return null

  const rows = [
    {
      label: language === 'hi' ? 'प्रकार' : 'Type',
      key: 'hospital_type',
      render: (h) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          h.hospital_type === 'government' ? 'bg-green-500/20 text-green-400' :
          h.hospital_type === 'trust'      ? 'bg-blue-500/20 text-blue-400' :
          'bg-purple-500/20 text-purple-400'
        }`}>
          {h.hospital_type}
        </span>
      ),
    },
    {
      label: language === 'hi' ? 'दूरी' : 'Distance',
      key: 'distance_km',
      render: (h) => (
        <span className="flex items-center gap-1 text-xs text-surface-300">
          <FiNavigation className="w-3 h-3 text-primary-400" />
          {h.distance_km ? formatDistance(h.distance_km) : '—'}
        </span>
      ),
    },
    {
      label: language === 'hi' ? 'रेटिंग' : 'Rating',
      key: 'rating',
      render: (h) => (
        <span className="flex items-center gap-1 text-xs text-surface-300">
          <FiStar className="w-3 h-3 text-yellow-400" />
          {h.rating || '—'}
        </span>
      ),
    },
    {
      label: '24/7',
      key: 'is_24x7',
      render: (h) => (
        <span className={`text-xs ${h.is_24x7 ? 'text-green-400' : 'text-surface-500'}`}>
          {h.is_24x7 ? '✓ Yes' : '✗ No'}
        </span>
      ),
    },
    {
      label: language === 'hi' ? 'आपातकालीन' : 'Emergency',
      key: 'has_emergency',
      render: (h) => (
        <span className={`text-xs ${h.has_emergency ? 'text-red-400' : 'text-surface-500'}`}>
          {h.has_emergency ? '🚨 Yes' : '✗ No'}
        </span>
      ),
    },
    {
      label: language === 'hi' ? 'बेड' : 'Beds',
      key: 'bed_count',
      render: (h) => (
        <span className="text-xs text-surface-300">{h.bed_count || '—'}</span>
      ),
    },
    {
      label: language === 'hi' ? 'विशेषताएं' : 'Specialties',
      key: 'specialties',
      render: (h) => (
        <div className="flex flex-wrap gap-1">
          {(h.specialties || []).slice(0, 3).map(s => (
            <span key={s} className="px-1.5 py-0.5 rounded bg-surface-800/60 text-[9px] text-surface-400">
              {s}
            </span>
          ))}
          {(h.specialties || []).length > 3 && (
            <span className="text-[9px] text-surface-500">+{h.specialties.length - 3}</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      {/* Header row with hospital names */}
      <div className="grid border-b border-surface-700/30" style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, 1fr)` }}>
        <div className="p-3 bg-surface-800/40">
          <span className="text-[10px] text-surface-400 uppercase tracking-wider">
            {language === 'hi' ? 'तुलना' : 'Compare'}
          </span>
        </div>
        {hospitals.map((h, i) => (
          <div key={h.id || i} className="p-3 bg-surface-800/20 border-l border-surface-700/30 relative">
            <p className="text-xs font-semibold text-white truncate pr-5">{h.name}</p>
            {onRemove && (
              <button
                onClick={() => onRemove(i)}
                className="absolute top-2 right-2 p-1 rounded text-surface-500 hover:text-red-400 transition-colors"
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
          className="grid border-b border-surface-800/30 last:border-0"
          style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, 1fr)` }}
        >
          <div className="p-3 flex items-center">
            <span className="text-[10px] text-surface-400 font-medium">{row.label}</span>
          </div>
          {hospitals.map((h, i) => (
            <div key={h.id || i} className="p-3 flex items-center border-l border-surface-800/30">
              {row.render(h)}
            </div>
          ))}
        </div>
      ))}

      {/* Direction buttons */}
      <div className="grid border-t border-surface-700/30" style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, 1fr)` }}>
        <div className="p-3" />
        {hospitals.map((h, i) => (
          <div key={h.id || i} className="p-2 border-l border-surface-700/30">
            <a
              href={getDirectionsUrl(h.lat, h.lng, h.name, h.city)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-primary-600/20 text-primary-400 text-[10px] font-medium hover:bg-primary-600/30 transition-all"
            >
              <FiNavigation className="w-3 h-3" />
              {language === 'hi' ? 'दिशा' : 'Directions'}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
