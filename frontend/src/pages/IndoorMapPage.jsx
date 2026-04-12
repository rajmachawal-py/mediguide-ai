/**
 * MediGuide AI — IndoorMapPage
 * Interactive indoor hospital navigation page.
 *
 * Features:
 * - Loads map graph (nodes + edges) from /api/navigation/{hospital_id}/map
 * - Department search → triggers BFS route from entrance
 * - SVG floor plan with animated route overlay
 * - Floor switcher for multi-floor hospitals
 * - Step-by-step directions panel
 * - Accessibility toggle (wheelchair-only paths)
 * - Voice-guided navigation instructions (via TTS)
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIndoorMap, getIndoorRoute, getHospital } from '../services/api'
import SVGFloorPlan from '../components/map/SVGFloorPlan'
import FloorSelector from '../components/map/FloorSelector'
import DepartmentSearch from '../components/map/DepartmentSearch'
import RouteOverlay from '../components/map/RouteOverlay'
import Spinner from '../components/shared/Spinner'
import { FiArrowLeft, FiMap, FiNavigation, FiVolume2 } from 'react-icons/fi'
import { textToSpeech } from '../services/api'

export default function IndoorMapPage() {
  const { hospitalId } = useParams()
  const navigate = useNavigate()
  const language = localStorage.getItem('mediguide_lang') || 'en'

  // Map data
  const [hospitalName, setHospitalName] = useState('')
  const [mapData, setMapData] = useState(null)  // { nodes, edges, floors, ... }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Navigation state
  const [activeFloor, setActiveFloor] = useState(0)
  const [selectedDept, setSelectedDept] = useState(null)
  const [route, setRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [accessibleOnly, setAccessibleOnly] = useState(false)
  const [speakingStep, setSpeakingStep] = useState(false)

  // Load map graph on mount
  useEffect(() => {
    if (!hospitalId) return

    const fetchMap = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getIndoorMap(hospitalId)
        setMapData(data)
        setHospitalName(data.hospital_name || '')
        // Default to first available floor
        if (data.floors?.length > 0) {
          setActiveFloor(data.floors[0])
        }
      } catch (err) {
        console.error('Failed to load indoor map:', err)
        setError(
          language === 'hi'
            ? 'अंदरूनी नक्शा लोड नहीं हो पाया'
            : 'Failed to load indoor map'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchMap()
  }, [hospitalId, language])

  // Fetch route when department is selected
  const fetchRoute = useCallback(async (deptId) => {
    if (!deptId || !hospitalId) return

    setRouteLoading(true)
    setRoute(null)
    try {
      const routeData = await getIndoorRoute(hospitalId, 'entrance', deptId, accessibleOnly)
      setRoute(routeData)

      // Auto-switch to destination floor
      if (routeData.steps?.length > 0) {
        const lastStep = routeData.steps[routeData.steps.length - 1]
        if (lastStep.floor != null) {
          setActiveFloor(lastStep.floor)
        }
      }
    } catch (err) {
      console.error('Route calculation failed:', err)
      setRoute(null)
    } finally {
      setRouteLoading(false)
    }
  }, [hospitalId, accessibleOnly])

  // Handle department selection
  const handleDeptSelect = useCallback((dept) => {
    setSelectedDept(dept)
    fetchRoute(dept.id)
  }, [fetchRoute])

  // Handle tapping a node on the SVG map
  const handleNodeTap = useCallback((node) => {
    if (node.department_id) {
      setSelectedDept({ id: node.department_id, name: node.label })
      fetchRoute(node.department_id)
    }
  }, [fetchRoute])

  // Toggle accessible route
  const handleToggleAccessible = useCallback(() => {
    setAccessibleOnly(prev => {
      const newVal = !prev
      // Re-fetch route with new accessibility setting
      if (selectedDept) {
        setTimeout(() => fetchRoute(selectedDept.id), 0)
      }
      return newVal
    })
  }, [selectedDept, fetchRoute])

  // Voice navigation: read out directions
  const handleVoiceNavigation = useCallback(async () => {
    if (!route?.steps?.length || speakingStep) return
    setSpeakingStep(true)

    const directions = route.steps.map(s => s.direction).join('. ')
    try {
      const audioBlob = await textToSpeech(directions, language)
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      audio.onended = () => {
        URL.revokeObjectURL(url)
        setSpeakingStep(false)
      }
      audio.play()
    } catch (err) {
      console.error('Voice navigation error:', err)
      setSpeakingStep(false)
    }
  }, [route, language, speakingStep])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner
          size="lg"
          text={language === 'hi' ? 'नक्शा लोड हो रहा है...' : 'Loading indoor map...'}
        />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="glass-card p-8 space-y-4">
          <FiMap className="w-12 h-12 text-surface-500 mx-auto" />
          <p className="text-sm text-surface-300">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-primary text-sm">
            {language === 'hi' ? '← वापस जाएं' : '← Go Back'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-20 space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-surface-800/80 flex items-center justify-center text-surface-300 hover:text-white hover:bg-surface-700 transition-all border border-surface-700/30"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white truncate flex items-center gap-2">
            <FiMap className="w-4 h-4 text-primary-400 flex-shrink-0" />
            {language === 'hi' ? 'अंदरूनी नक्शा' : language === 'mr' ? 'अंतर्गत नकाशा' : 'Indoor Map'}
          </h1>
          <p className="text-[10px] text-surface-400 truncate">{hospitalName}</p>
        </div>

        {/* Voice Navigation Button */}
        {route && (
          <button
            onClick={handleVoiceNavigation}
            disabled={speakingStep}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
              speakingStep
                ? 'bg-primary-600/20 text-primary-400 border-primary-500/30 animate-pulse'
                : 'bg-surface-800/80 text-surface-300 hover:text-white hover:bg-surface-700 border-surface-700/30'
            }`}
            title={language === 'hi' ? 'आवाज़ निर्देश' : 'Voice directions'}
          >
            <FiVolume2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Department Search */}
      <DepartmentSearch
        hospitalId={hospitalId}
        language={language}
        onSelect={handleDeptSelect}
        selectedDeptId={selectedDept?.id}
      />

      {/* Floor Selector */}
      {mapData?.floors && (
        <FloorSelector
          floors={mapData.floors}
          activeFloor={activeFloor}
          onChange={setActiveFloor}
          language={language}
        />
      )}

      {/* SVG Floor Plan */}
      {mapData && (
        <SVGFloorPlan
          nodes={mapData.nodes || []}
          edges={mapData.edges || []}
          routeSteps={route?.steps || []}
          activeFloor={activeFloor}
          onNodeTap={handleNodeTap}
          selectedNodeId={
            selectedDept
              ? (mapData.nodes || []).find(n => n.department_id === selectedDept.id)?.id
              : null
          }
        />
      )}

      {/* Route Directions Panel */}
      <RouteOverlay
        route={route}
        loading={routeLoading}
        accessibleOnly={accessibleOnly}
        onToggleAccessible={handleToggleAccessible}
        language={language}
      />

      {/* No Map Data */}
      {mapData && (!mapData.nodes || mapData.nodes.length === 0) && (
        <div className="glass-card p-8 text-center space-y-3">
          <FiMap className="w-10 h-10 text-surface-500 mx-auto" />
          <p className="text-sm text-surface-300">
            {language === 'hi'
              ? 'इस अस्पताल का अंदरूनी नक्शा अभी उपलब्ध नहीं है'
              : 'Indoor map data is not yet available for this hospital'}
          </p>
        </div>
      )}
    </div>
  )
}
