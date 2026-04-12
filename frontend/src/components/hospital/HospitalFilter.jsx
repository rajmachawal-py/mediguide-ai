/**
 * MediGuide AI — HospitalFilter
 * Advanced filter panel for hospital search.
 * Filters: specialty, budget tier, 24/7, emergency, distance range.
 */

import { useState } from 'react'
import { FiFilter, FiX, FiCheck } from 'react-icons/fi'

const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Gynecology',
  'ENT', 'Ophthalmology', 'Dermatology', 'Neurology', 'Oncology',
  'Psychiatry', 'Dental', 'Emergency', 'Physiotherapy',
]

const DISTANCE_OPTIONS = [
  { value: 5,   label: '< 5 km' },
  { value: 10,  label: '< 10 km' },
  { value: 25,  label: '< 25 km' },
  { value: 50,  label: '< 50 km' },
  { value: 100, label: '< 100 km' },
]

export default function HospitalFilter({
  filters = {},
  onChange,
  onReset,
  language = 'en',
}) {
  const [isOpen, setIsOpen] = useState(false)

  const activeCount = Object.values(filters).filter(v => v && v !== 'all').length

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value })
  }

  const t = {
    hi: {
      filters: 'फ़िल्टर',
      specialty: 'विशेषता',
      distance: 'दूरी',
      type: 'प्रकार',
      emergency: 'आपातकालीन',
      open24: '24/7 खुला',
      reset: 'रीसेट',
      apply: 'लागू करें',
      all: 'सभी',
    },
    en: {
      filters: 'Filters',
      specialty: 'Specialty',
      distance: 'Distance',
      type: 'Type',
      emergency: 'Emergency',
      open24: '24/7 Open',
      reset: 'Reset',
      apply: 'Apply',
      all: 'All',
    },
  }

  const text = t[language] || t.en

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          activeCount > 0
            ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
            : 'bg-surface-800/60 text-surface-400 border border-surface-700/30 hover:text-white'
        }`}
      >
        <FiFilter className="w-3 h-3" />
        {text.filters}
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-primary-600 text-white text-[9px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute z-40 mt-2 right-0 w-72 glass-card p-4 space-y-4 animate-slide-down shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">{text.filters}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-surface-400 hover:text-white"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Specialty */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-surface-400 uppercase tracking-wider font-medium">
              {text.specialty}
            </label>
            <select
              value={filters.specialty || ''}
              onChange={(e) => handleChange('specialty', e.target.value)}
              className="w-full bg-surface-900/60 text-white rounded-lg px-3 py-2 text-xs border border-surface-700/30 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
            >
              <option value="">{text.all}</option>
              {SPECIALTIES.map(s => (
                <option key={s} value={s.toLowerCase()}>{s}</option>
              ))}
            </select>
          </div>

          {/* Distance */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-surface-400 uppercase tracking-wider font-medium">
              {text.distance}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DISTANCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleChange('radius_km', opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    filters.radius_km === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-800/60 text-surface-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hospital Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-surface-400 uppercase tracking-wider font-medium">
              {text.type}
            </label>
            <div className="flex gap-1.5">
              {['all', 'government', 'private', 'trust'].map(type => (
                <button
                  key={type}
                  onClick={() => handleChange('hospital_type', type === 'all' ? '' : type)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    (filters.hospital_type || '') === (type === 'all' ? '' : type)
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-800/60 text-surface-400 hover:text-white'
                  }`}
                >
                  {type === 'all' ? text.all : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="space-y-2">
            <ToggleRow
              label={text.emergency}
              emoji="🚨"
              checked={!!filters.has_emergency}
              onChange={(v) => handleChange('has_emergency', v)}
            />
            <ToggleRow
              label={text.open24}
              emoji="🕐"
              checked={!!filters.is_24x7}
              onChange={(v) => handleChange('is_24x7', v)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { onReset?.(); }}
              className="flex-1 btn-ghost text-xs py-2"
            >
              {text.reset}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 btn-primary text-xs py-2"
            >
              <FiCheck className="w-3 h-3 inline mr-1" />
              {text.apply}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleRow({ label, emoji, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
        checked ? 'bg-primary-600/15 text-white' : 'bg-surface-800/40 text-surface-400'
      }`}
    >
      <span className="text-xs font-medium">{emoji} {label}</span>
      <div className={`w-8 h-4.5 rounded-full transition-all ${checked ? 'bg-primary-600' : 'bg-surface-700'}`}>
        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'} mt-[1px]`} />
      </div>
    </button>
  )
}
