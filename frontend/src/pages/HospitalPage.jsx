/**
 * MediGuide AI — HospitalPage
 * Shows nearby hospitals, filtered by type, with distance and details.
 * Clinical Intelligence design.
 */

import { useState, useEffect } from 'react'
import useGeolocation from '../hooks/useGeolocation'
import { getNearbyHospitals } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import Spinner from '../components/shared/Spinner'
import HospitalCard from '../components/hospital/HospitalCard'
import HospitalMapView from '../components/map/HospitalMapView'
import { FiMapPin, FiList, FiMap } from 'react-icons/fi'

const typeLabels = {
  all:        { hi: 'सभी',       mr: 'सर्व',      en: 'All' },
  government: { hi: 'सरकारी',    mr: 'सरकारी',    en: 'Government' },
  private:    { hi: 'प्राइवेट',  mr: 'खाजगी',     en: 'Private' },
  trust:      { hi: 'ट्रस्ट',    mr: 'विश्वस्त',  en: 'Trust' },
}

export default function HospitalPage() {
  const { lat, lng, loading: geoLoading } = useGeolocation()
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'map'
  const [error, setError] = useState(null)
  const { language } = useLanguage()

  useEffect(() => {
    if (!lat || !lng) return

    const fetchHospitals = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getNearbyHospitals(lat, lng, 30)
        setHospitals(data.hospitals || [])
      } catch (err) {
        setError('Failed to load hospitals')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchHospitals()
  }, [lat, lng])

  const filtered = filter === 'all'
    ? hospitals
    : hospitals.filter(h => h.hospital_type === filter)

  if (geoLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" text={language === 'hi' ? 'अस्पताल खोज रहे हैं...' : 'Finding hospitals...'} />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto lg:max-w-4xl px-4 py-4 pb-20 space-y-4 font-sans">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-xl font-bold font-display text-on-surface flex items-center gap-2">
            <FiMapPin className="text-primary" />
            {language === 'hi' ? 'नजदीकी अस्पताल' : language === 'mr' ? 'जवळची रुग्णालये' : 'Nearby Hospitals'}
          </h1>
          <p className="text-xs text-on-surface-variant">
            {filtered.length} {language === 'en' ? 'hospitals found' : language === 'hi' ? 'अस्पताल मिले' : 'रुग्णालये सापडली'}
          </p>
        </div>
        
        {/* List / Map Toggle */}
        <div className="flex bg-surface-container rounded-clinical p-1">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-[0.5rem] flex items-center justify-center transition-all ${
              viewMode === 'list' ? 'bg-primary-container text-white shadow-clinical' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <FiList className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`p-1.5 rounded-[0.5rem] flex items-center justify-center transition-all ${
              viewMode === 'map' ? 'bg-primary-container text-white shadow-clinical' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <FiMap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(typeLabels).map(([key, labels]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === key
                ? 'bg-primary-container text-white shadow-clinical'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30'
            }`}
          >
            {labels[language] || labels.en}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {error && (
        <div className="clinical-card p-4 text-center text-error text-sm">{error}</div>
      )}

      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filtered.map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} language={language} />
          ))}

          {filtered.length === 0 && !loading && (
            <div className="clinical-card-flat p-8 text-center text-on-surface-variant text-sm">
              {language === 'hi' ? 'कोई अस्पताल नहीं मिला' : 'No hospitals found in this category'}
            </div>
          )}
        </div>
      ) : (
        <HospitalMapView hospitals={filtered} centerLat={lat} centerLng={lng} />
      )}
    </div>
  )
}
