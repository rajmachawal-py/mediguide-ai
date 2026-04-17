/**
 * MediGuide AI — IndoorMapPage
 * Interactive indoor hospital navigation page with offline support.
 *
 * Features:
 * - Loads map graph from API → caches in IndexedDB for offline use
 * - QR code scanner for room-level navigation
 * - Department search → triggers BFS route from entrance
 * - SVG floor plan with animated route overlay
 * - Floor switcher for multi-floor hospitals
 * - Step-by-step directions panel
 * - Accessibility toggle (wheelchair-only paths)
 * - Voice-guided navigation instructions (via TTS)
 * - Fully functional offline (cached map + client-side BFS)
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIndoorMap, getIndoorRoute } from '../services/api'
import { saveMapToCache, getMapFromCache, findRouteOffline } from '../services/offlineMapCache'
import SVGFloorPlan from '../components/map/SVGFloorPlan'
import FloorSelector from '../components/map/FloorSelector'
import DepartmentSearch from '../components/map/DepartmentSearch'
import RouteOverlay from '../components/map/RouteOverlay'
import QRScanner from '../components/map/QRScanner'
import Spinner from '../components/shared/Spinner'
import { FiArrowLeft, FiMap, FiVolume2, FiWifi, FiWifiOff, FiMaximize } from 'react-icons/fi'
import { textToSpeech } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import toast from 'react-hot-toast'

export default function IndoorMapPage() {
  const { hospitalId } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()

  // Map data
  const [hospitalName, setHospitalName] = useState('')
  const [mapData, setMapData] = useState(null)  // { nodes, edges, floors, ... }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(false) // true = using cached data

  // Navigation state
  const [activeFloor, setActiveFloor] = useState(0)
  const [selectedDept, setSelectedDept] = useState(null)
  const [route, setRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [accessibleOnly, setAccessibleOnly] = useState(false)
  const [speakingStep, setSpeakingStep] = useState(false)

  // QR Scanner
  const [showQR, setShowQR] = useState(false)

  // Load map graph on mount: try API first → fallback to cache
  useEffect(() => {
    if (!hospitalId) return

    const fetchMap = async () => {
      setLoading(true)
      setError(null)
      setIsOffline(false)

      try {
        // Try API first
        const data = await getIndoorMap(hospitalId)
        setMapData(data)
        setHospitalName(data.hospital_name || '')
        if (data.floors?.length > 0) {
          setActiveFloor(data.floors[0])
        }

        // Cache for offline use
        await saveMapToCache(hospitalId, data)
      } catch (err) {
        console.warn('[IndoorMap] API failed, trying offline cache:', err.message)

        // Fallback to IndexedDB cache
        const cached = await getMapFromCache(hospitalId)
        if (cached) {
          setMapData(cached)
          setHospitalName(cached.hospital_name || '')
          setIsOffline(true)
          if (cached.floors?.length > 0) {
            setActiveFloor(cached.floors[0])
          }
          toast(
            language === 'hi' ? '📡 ऑफ़लाइन मोड — कैश्ड नक्शा' :
            language === 'mr' ? '📡 ऑफलाइन मोड — कॅश केलेला नकाशा' :
            '📡 Offline mode — using cached map',
            { icon: '📡', duration: 3000 }
          )
        } else {
          setError(
            language === 'hi' ? 'अंदरूनी नक्शा लोड नहीं हो पाया' :
            language === 'mr' ? 'अंतर्गत नकाशा लोड होऊ शकला नाही' :
            'Failed to load indoor map'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMap()
  }, [hospitalId, language])

  // Fetch route: try API → fallback to offline BFS
  const fetchRoute = useCallback(async (targetNodeId) => {
    if (!targetNodeId || !hospitalId || !mapData) return

    setRouteLoading(true)
    setRoute(null)

    // Find entrance node
    const entranceNode = mapData.nodes?.find(n => n.node_type === 'entrance')
    if (!entranceNode) {
      setRouteLoading(false)
      return
    }

    try {
      if (!isOffline) {
        // Online: use API
        const routeData = await getIndoorRoute(hospitalId, entranceNode.id, targetNodeId, accessibleOnly)
        setRoute(routeData)

        // Auto-switch to destination floor
        if (routeData.steps?.length > 0) {
          const lastStep = routeData.steps[routeData.steps.length - 1]
          if (lastStep.floor != null) setActiveFloor(lastStep.floor)
        }
      } else {
        throw new Error('offline')
      }
    } catch {
      // Offline: client-side BFS
      const offlineRoute = findRouteOffline(mapData, entranceNode.id, targetNodeId, accessibleOnly)
      if (offlineRoute) {
        setRoute(offlineRoute)
        if (offlineRoute.steps?.length > 0) {
          const lastStep = offlineRoute.steps[offlineRoute.steps.length - 1]
          if (lastStep.floor != null) setActiveFloor(lastStep.floor)
        }
      }
    } finally {
      setRouteLoading(false)
    }
  }, [hospitalId, mapData, accessibleOnly, isOffline])

  // Handle department selection
  const handleDeptSelect = useCallback((dept) => {
    setSelectedDept(dept)
    // Find the node for this department
    const node = mapData?.nodes?.find(n => n.department_id === dept.id)
    if (node) {
      fetchRoute(node.id)
    }
  }, [fetchRoute, mapData])

  // Handle tapping a node on the SVG map
  const handleNodeTap = useCallback((node) => {
    if (node.department_id) {
      setSelectedDept({ id: node.department_id, name: node.label })
    }
    fetchRoute(node.id)
  }, [fetchRoute])

  // Toggle accessible route
  const handleToggleAccessible = useCallback(() => {
    setAccessibleOnly(prev => {
      const newVal = !prev
      if (selectedDept) {
        const node = mapData?.nodes?.find(n => n.department_id === selectedDept.id)
        if (node) {
          setTimeout(() => fetchRoute(node.id), 0)
        }
      }
      return newVal
    })
  }, [selectedDept, fetchRoute, mapData])

  // QR scan result handler
  const handleQRScan = useCallback((result) => {
    setShowQR(false)
    if (result.departmentId) {
      setSelectedDept({ id: result.departmentId, name: result.label })
    }
    fetchRoute(result.nodeId)
    toast.success(
      language === 'hi' ? `📍 ${result.label} पर नेविगेट कर रहे हैं` :
      language === 'mr' ? `📍 ${result.label} कडे नेव्हिगेट करत आहे` :
      `📍 Navigating to ${result.label}`
    )
  }, [fetchRoute, language])

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
      // Fallback to browser TTS
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(directions)
        utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN'
        utterance.onend = () => setSpeakingStep(false)
        window.speechSynthesis.speak(utterance)
      } else {
        setSpeakingStep(false)
      }
    }
  }, [route, language, speakingStep])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner
          size="lg"
          text={language === 'hi' ? 'नक्शा लोड हो रहा है...' : language === 'mr' ? 'नकाशा लोड होत आहे...' : 'Loading indoor map...'}
        />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="clinical-card p-8 space-y-4">
          <FiMap className="w-12 h-12 text-outline mx-auto" />
          <p className="text-sm text-on-surface-variant">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-primary text-sm">
            {language === 'hi' ? '← वापस जाएं' : language === 'mr' ? '← मागे जा' : '← Go Back'}
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
          className="w-9 h-9 rounded-clinical bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30 transition-all"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold font-display text-on-surface truncate flex items-center gap-2">
            <FiMap className="w-4 h-4 text-primary flex-shrink-0" />
            {language === 'hi' ? 'अंदरूनी नक्शा' : language === 'mr' ? 'अंतर्गत नकाशा' : 'Indoor Map'}
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-on-surface-variant truncate">{hospitalName}</p>
            {/* Offline badge */}
            {isOffline && (
              <span className="triage-badge triage-badge-moderate">
                <FiWifiOff className="w-2.5 h-2.5" />
                {language === 'hi' ? 'ऑफ़लाइन' : language === 'mr' ? 'ऑफलाइन' : 'Offline'}
              </span>
            )}
            {!isOffline && mapData && (
              <span className="triage-badge triage-badge-mild">
                <FiWifi className="w-2.5 h-2.5" />
                {language === 'hi' ? 'लाइव' : language === 'mr' ? 'लाइव्ह' : 'Live'}
              </span>
            )}
          </div>
        </div>

        {/* QR Scanner Button */}
        <button
          onClick={() => setShowQR(true)}
          className="w-9 h-9 rounded-clinical bg-secondary/10 hover:bg-secondary/18 flex items-center justify-center text-secondary transition-all"
          title={language === 'hi' ? 'QR कोड स्कैन करें' : language === 'mr' ? 'QR कोड स्कॅन करा' : 'Scan QR Code'}
        >
          <FiMaximize className="w-4 h-4" />
        </button>

        {/* Voice Navigation Button */}
        {route && (
          <button
            onClick={handleVoiceNavigation}
            disabled={speakingStep}
            className={`w-9 h-9 rounded-clinical flex items-center justify-center transition-all ${
              speakingStep
                ? 'bg-primary/15 text-primary animate-pulse'
                : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30'
            }`}
            title={language === 'hi' ? 'आवाज़ निर्देश' : language === 'mr' ? 'आवाज मार्गदर्शन' : 'Voice directions'}
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
        <div className="clinical-card overflow-hidden">
          <SVGFloorPlan
            hospitalId={hospitalId}
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
        </div>
      )}

      {/* Route Directions Panel */}
      <RouteOverlay
        route={route}
        loading={routeLoading}
        accessibleOnly={accessibleOnly}
        onToggleAccessible={handleToggleAccessible}
        language={language}
      />

      {/* Offline route indicator */}
      {route?.is_offline && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-clinical urgency-moderate">
          <FiWifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <p className="text-[10px] font-medium">
            {language === 'hi' ? 'यह रूट ऑफ़लाइन (कैश्ड) डेटा से बनाया गया है' :
             language === 'mr' ? 'हा मार्ग ऑफलाइन (कॅश) डेटावरून तयार केला आहे' :
             'This route was calculated offline using cached map data'}
          </p>
        </div>
      )}

      {/* No Map Data */}
      {mapData && (!mapData.nodes || mapData.nodes.length === 0) && (
        <div className="clinical-card p-8 text-center space-y-3">
          <FiMap className="w-10 h-10 text-outline mx-auto" />
          <p className="text-sm text-on-surface-variant">
            {language === 'hi'
              ? 'इस अस्पताल का अंदरूनी नक्शा अभी उपलब्ध नहीं है'
              : language === 'mr'
              ? 'या हॉस्पिटलचा अंतर्गत नकाशा अद्याप उपलब्ध नाही'
              : 'Indoor map data is not yet available for this hospital'}
          </p>
        </div>
      )}

      {/* QR Scanner Overlay */}
      {showQR && (
        <QRScanner
          hospitalId={hospitalId}
          nodes={mapData?.nodes || []}
          language={language}
          onScanResult={handleQRScan}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  )
}
