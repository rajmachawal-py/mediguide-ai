/**
 * MediGuide AI — DepartmentSearch
 * Searchable dropdown for selecting a department within a hospital.
 * Fetches departments from /api/hospitals/{id}/departments.
 * Supports Hindi/Marathi/English labels.
 */

import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiChevronDown, FiMapPin } from 'react-icons/fi'
import { getHospitalDepartments } from '../../services/api'

export default function DepartmentSearch({ hospitalId, language = 'en', onSelect, selectedDeptId }) {
  const [departments, setDepartments] = useState([])
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef(null)

  // Fetch departments on mount
  useEffect(() => {
    if (!hospitalId) return
    setLoading(true)
    getHospitalDepartments(hospitalId)
      .then(data => {
        setDepartments(data.departments || [])
      })
      .catch(err => console.error('Failed to load departments:', err))
      .finally(() => setLoading(false))
  }, [hospitalId])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDeptName = (dept) => {
    if (language === 'hi' && dept.name_hi) return dept.name_hi
    if (language === 'mr' && dept.name_mr) return dept.name_mr
    return dept.name
  }

  const filtered = departments.filter(dept => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      dept.name.toLowerCase().includes(q) ||
      (dept.name_hi && dept.name_hi.includes(query)) ||
      (dept.name_mr && dept.name_mr.includes(query))
    )
  })

  const selectedDept = departments.find(d => d.id === selectedDeptId)

  const placeholder = {
    hi: 'विभाग खोजें...',
    mr: 'विभाग शोधा...',
    en: 'Search department...',
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected / Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-700/50 text-sm transition-all hover:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      >
        <div className="flex items-center gap-2 min-w-0">
          <FiMapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
          <span className={`truncate ${selectedDept ? 'text-white' : 'text-surface-400'}`}>
            {selectedDept
              ? getDeptName(selectedDept)
              : language === 'hi' ? 'गंतव्य विभाग चुनें' : language === 'mr' ? 'गंतव्य विभाग निवडा' : 'Select destination department'
            }
          </span>
        </div>
        <FiChevronDown className={`w-4 h-4 text-surface-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-xl bg-surface-900/95 backdrop-blur-xl border border-surface-700/50 shadow-2xl overflow-hidden animate-slide-down">
          {/* Search Input */}
          <div className="p-3 border-b border-surface-700/30">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder[language] || placeholder.en}
                autoFocus
                className="w-full bg-surface-800/80 text-white placeholder-surface-500 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/50 border border-surface-700/30"
              />
            </div>
          </div>

          {/* Department List */}
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="py-6 text-center text-xs text-surface-400">
                {language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-surface-400">
                {language === 'hi' ? 'कोई विभाग नहीं मिला' : 'No departments found'}
              </div>
            ) : (
              filtered.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => {
                    onSelect(dept)
                    setIsOpen(false)
                    setQuery('')
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-600/10 transition-colors border-b border-surface-800/50 last:border-0 ${
                    selectedDeptId === dept.id ? 'bg-primary-600/15 text-primary-300' : 'text-surface-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{getDeptName(dept)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {dept.floor_number != null && (
                        <span className="text-[10px] text-surface-400">
                          {language === 'hi' ? `मंजिल ${dept.floor_number}` : `Floor ${dept.floor_number}`}
                        </span>
                      )}
                      {dept.room_number && (
                        <span className="text-[10px] text-surface-400">• {dept.room_number}</span>
                      )}
                    </div>
                  </div>
                  {!dept.is_available && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                      {language === 'hi' ? 'बंद' : 'Closed'}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
