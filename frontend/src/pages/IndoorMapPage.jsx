/**
 * MediGuide AI — IndoorMapPage
 * Complete interactive indoor navigation for Ruby Hall Clinic.
 *
 * Features:
 * - From/To room dropdowns grouped by floor
 * - Dijkstra shortest-path routing (client-side, no API)
 * - Multi-floor navigation via lift/staircase
 * - Animated route on PNG floor plans
 * - Step-by-step directions with floor pills & distance
 * - Voice navigation (TTS)
 * - Accessibility toggle (lift-only, no stairs)
 * - Critical department warnings (Emergency, ICU)
 * - Sterile zone avoidance (OTs)
 */

import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft, FiNavigation, FiX, FiVolume2, FiVolumeX,
  FiAlertTriangle, FiCheckCircle, FiMapPin, FiCrosshair,
} from 'react-icons/fi'
import { useLanguage } from '../contexts/LanguageContext'
import SVGFloorPlan from '../components/map/SVGFloorPlan'
import { findShortestPath, generateVoiceNarration } from '../services/dijkstra'
import { ROOMS, FLOOR_LABELS, FLOOR_PLAN_IMAGES } from '../data/navigationGraph'
import toast from 'react-hot-toast'

// ── Translations ─────────────────────────────────────────────

const T = {
  en: {
    title: 'Indoor Navigation',
    subtitle: 'Ruby Hall Clinic, Pune',
    from: 'From',
    to: 'To',
    selectRoom: '— Select Room —',
    navigate: 'Navigate',
    clear: 'Clear',
    accessible: 'Accessible route (lift only)',
    directions: 'Step-by-Step Directions',
    totalDist: 'Total distance',
    meters: 'm',
    contFloor: 'Route continues on',
    viewFloor: 'View',
    criticalWarn: '⚠️ This is a critical department. Please inform security at the entrance.',
    sterileWarn: '⚠️ This destination is a sterile zone (OT). Only authorized personnel may enter.',
    noRoute: 'No route found. Try a different path.',
    sameRoom: 'Start and destination cannot be the same.',
    arrived: 'You have arrived!',
    voiceOn: 'Reading directions...',
    voiceOff: 'Voice stopped',
    floor: 'Floor',
  },
  hi: {
    title: 'इनडोर नेविगेशन',
    subtitle: 'रूबी हॉल क्लिनिक, पुणे',
    from: 'कहाँ से',
    to: 'कहाँ जाना है',
    selectRoom: '— कमरा चुनें —',
    navigate: 'रास्ता दिखाएं',
    clear: 'साफ़ करें',
    accessible: 'सुगम्य मार्ग (केवल लिफ्ट)',
    directions: 'चरण-दर-चरण निर्देश',
    totalDist: 'कुल दूरी',
    meters: 'मी',
    contFloor: 'रास्ता जारी है',
    viewFloor: 'देखें',
    criticalWarn: '⚠️ यह एक गंभीर विभाग है। कृपया प्रवेश द्वार पर सुरक्षा को सूचित करें।',
    sterileWarn: '⚠️ यह गंतव्य स्टैराइल ज़ोन (ओटी) है। केवल अधिकृत कर्मचारी प्रवेश कर सकते हैं।',
    noRoute: 'कोई रास्ता नहीं मिला। अलग रास्ता आज़माएं।',
    sameRoom: 'शुरुआत और गंतव्य एक ही नहीं हो सकते।',
    arrived: 'आप पहुँच गए हैं!',
    voiceOn: 'निर्देश पढ़ रहे हैं...',
    voiceOff: 'आवाज़ बंद',
    floor: 'मंज़िल',
  },
  mr: {
    title: 'इनडोअर नेव्हिगेशन',
    subtitle: 'रुबी हॉल क्लिनिक, पुणे',
    from: 'कुठून',
    to: 'कुठे जायचे',
    selectRoom: '— खोली निवडा —',
    navigate: 'मार्ग दाखवा',
    clear: 'साफ करा',
    accessible: 'सुलभ मार्ग (फक्त लिफ्ट)',
    directions: 'चरण-दर-चरण दिशानिर्देश',
    totalDist: 'एकूण अंतर',
    meters: 'मी',
    contFloor: 'मार्ग पुढे चालू आहे',
    viewFloor: 'पहा',
    criticalWarn: '⚠️ हा एक गंभीर विभाग आहे. कृपया प्रवेशद्वारावर सुरक्षा रक्षकांना कळवा.',
    sterileWarn: '⚠️ हे गंतव्य स्टेराइल झोन (ओटी) आहे. फक्त अधिकृत कर्मचारी प्रवेश करू शकतात.',
    noRoute: 'कोणताही मार्ग सापडला नाही. वेगळा मार्ग वापरून पहा.',
    sameRoom: 'सुरुवात आणि गंतव्य एकच असू शकत नाही.',
    arrived: 'तुम्ही पोहोचलात!',
    voiceOn: 'दिशानिर्देश वाचत आहे...',
    voiceOff: 'आवाज बंद',
    floor: 'मजला',
  },
}

// ── Floor tab colors ─────────────────────────────────────────

const FLOOR_COLORS = {
  0: { bg: 'bg-emerald-500', text: 'text-emerald-700', pill: 'bg-emerald-100 text-emerald-800' },
  1: { bg: 'bg-blue-500', text: 'text-blue-700', pill: 'bg-blue-100 text-blue-800' },
  2: { bg: 'bg-purple-500', text: 'text-purple-700', pill: 'bg-purple-100 text-purple-800' },
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function IndoorMapPage() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = T[language] || T.en
  const speechRef = useRef(null)

  // Form state
  const [fromRoom, setFromRoom] = useState('')
  const [toRoom, setToRoom] = useState('')
  const [accessibleOnly, setAccessibleOnly] = useState(false)

  // Route state
  const [route, setRoute] = useState(null)
  const [activeFloor, setActiveFloor] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Group rooms by floor for dropdown
  const roomsByFloor = {}
  ROOMS.forEach(r => {
    if (!roomsByFloor[r.floor]) roomsByFloor[r.floor] = []
    roomsByFloor[r.floor].push(r)
  })

  // ── Navigate handler ─────────────────────────────────────────

  const handleNavigate = useCallback(() => {
    if (!fromRoom || !toRoom) {
      toast.error(t.selectRoom)
      return
    }
    if (fromRoom === toRoom) {
      toast.error(t.sameRoom)
      return
    }

    const result = findShortestPath(fromRoom, toRoom, {
      accessibleOnly,
      avoidSterile: false, // Don't avoid sterile as destination — user specifically chose it
    })

    if (!result) {
      toast.error(t.noRoute)
      return
    }

    setRoute(result)
    // Auto-switch to the floor where the route starts
    setActiveFloor(result.startNode.floor)

    toast.success(
      `${result.totalDistance}${t.meters} • ${result.steps.length} ${language === 'en' ? 'steps' : language === 'hi' ? 'चरण' : 'चरणे'}`,
      { icon: '🧭', duration: 3000 }
    )
  }, [fromRoom, toRoom, accessibleOnly, t, language])

  // ── Clear handler ────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setFromRoom('')
    setToRoom('')
    setRoute(null)
    setActiveFloor(0)
    stopSpeech()
  }, [])

  // ── Voice navigation ─────────────────────────────────────────

  const speakDirections = useCallback(() => {
    if (!route?.steps?.length) return

    // Stop if already speaking
    if (isSpeaking) {
      stopSpeech()
      return
    }

    const narration = generateVoiceNarration(route.steps, language)
    if (!narration) return

    // Use Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(narration)
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN'
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      speechRef.current = utterance
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
      toast.success(t.voiceOn, { icon: '🔊', duration: 2000 })
    }
  }, [route, language, isSpeaking, t])

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  // ── Check if route continues on another floor ────────────────

  const nextFloorForRoute = route?.floorsUsed?.find(f => f !== activeFloor && f > activeFloor)
  const prevFloorForRoute = route?.floorsUsed?.find(f => f !== activeFloor && f < activeFloor)
  const otherFloor = nextFloorForRoute ?? prevFloorForRoute

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-outline-variant/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-clinical hover:bg-surface-container-low transition-all"
          >
            <FiArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold font-display text-on-surface">{t.title}</h1>
            <p className="text-xs text-on-surface-variant">{t.subtitle}</p>
          </div>
          <FiCrosshair className="w-5 h-5 text-primary" />
        </div>
      </header>

      <div className="px-4 py-3 space-y-3">
        {/* ── From / To Selection ── */}
        <div className="bg-white rounded-clinical-lg border border-outline-variant/30 p-4 shadow-clinical-sm space-y-3">
          {/* From dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
              <FiMapPin className="w-3.5 h-3.5 text-green-600" />
              {t.from}
            </label>
            <select
              value={fromRoom}
              onChange={e => setFromRoom(e.target.value)}
              className="clinical-input text-sm"
            >
              <option value="">{t.selectRoom}</option>
              {Object.entries(roomsByFloor).map(([floor, rooms]) => (
                <optgroup key={floor} label={FLOOR_LABELS[floor]}>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.label} {r.isCritical ? '🔴' : ''} {r.isSterile ? '🟢' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* To dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
              <FiMapPin className="w-3.5 h-3.5 text-red-500" />
              {t.to}
            </label>
            <select
              value={toRoom}
              onChange={e => setToRoom(e.target.value)}
              className="clinical-input text-sm"
            >
              <option value="">{t.selectRoom}</option>
              {Object.entries(roomsByFloor).map(([floor, rooms]) => (
                <optgroup key={floor} label={FLOOR_LABELS[floor]}>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.label} {r.isCritical ? '🔴' : ''} {r.isSterile ? '🟢' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNavigate}
              disabled={!fromRoom || !toRoom}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-40"
            >
              <FiNavigation className="w-4 h-4" />
              {t.navigate}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-clinical text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container transition-all"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Accessibility toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accessibleOnly}
              onChange={e => setAccessibleOnly(e.target.checked)}
              className="w-4 h-4 rounded text-primary accent-primary"
            />
            <span className="text-xs text-on-surface-variant">♿ {t.accessible}</span>
          </label>
        </div>

        {/* ── Floor Tabs ── */}
        <div className="flex gap-1.5 bg-surface-container-low rounded-clinical-lg p-1">
          {[0, 1, 2].map(floor => {
            const isActive = activeFloor === floor
            const hasRoute = route?.floorsUsed?.includes(floor)
            return (
              <button
                key={floor}
                onClick={() => setActiveFloor(floor)}
                className={`flex-1 py-2 px-2 rounded-clinical text-xs font-semibold transition-all ${
                  isActive
                    ? `${FLOOR_COLORS[floor].bg} text-white shadow-sm`
                    : hasRoute
                      ? `${FLOOR_COLORS[floor].pill} hover:opacity-80`
                      : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {FLOOR_LABELS[floor]}
                {hasRoute && !isActive && <span className="ml-1">•</span>}
              </button>
            )
          })}
        </div>

        {/* ── Floor Plan Map ── */}
        <SVGFloorPlan
          activeFloor={activeFloor}
          routePath={route?.path || []}
          startNodeId={route?.path?.[0] || null}
          endNodeId={route?.path?.[route?.path?.length - 1] || null}
        />

        {/* ── Cross-floor banner ── */}
        {route && route.isMultiFloor && otherFloor !== undefined && (
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-clinical-lg px-4 py-3">
            <span className="text-lg">🛗</span>
            <p className="text-xs text-purple-800 font-medium flex-1">
              {t.contFloor} {FLOOR_LABELS[otherFloor]}
            </p>
            <button
              onClick={() => setActiveFloor(otherFloor)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-500 rounded-clinical hover:bg-purple-600 transition-all"
            >
              {t.viewFloor} →
            </button>
          </div>
        )}

        {/* ── Critical department warning ── */}
        {route?.isCritical && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-clinical-lg px-4 py-3 animate-slide-up">
            <FiAlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-800 font-medium leading-relaxed">
              {t.criticalWarn}
            </p>
          </div>
        )}

        {/* ── Sterile zone warning ── */}
        {route?.isSterile && (
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-clinical-lg px-4 py-3 animate-slide-up">
            <FiAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800 font-medium leading-relaxed">
              {t.sterileWarn}
            </p>
          </div>
        )}

        {/* ── Step-by-Step Directions ── */}
        {route?.steps?.length > 0 && (
          <div className="bg-white rounded-clinical-lg border border-outline-variant/30 shadow-clinical-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low/50">
              <h3 className="text-sm font-bold text-on-surface">{t.directions}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">
                  {t.totalDist}: <strong>{route.totalDistance}{t.meters}</strong>
                </span>
                <button
                  onClick={speakDirections}
                  className={`p-2 rounded-clinical transition-all ${
                    isSpeaking
                      ? 'bg-primary text-white'
                      : 'hover:bg-surface-container text-on-surface-variant'
                  }`}
                  title={isSpeaking ? t.voiceOff : t.voiceOn}
                >
                  {isSpeaking ? (
                    <FiVolumeX className="w-4 h-4" />
                  ) : (
                    <FiVolume2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="divide-y divide-outline-variant/10">
              {route.steps.map((step, i) => {
                const isLast = i === route.steps.length - 1
                const floorColor = FLOOR_COLORS[step.floor] || FLOOR_COLORS[0]

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-4 py-3 transition-all hover:bg-surface-container-low/30 ${
                      isLast ? 'bg-green-50/50' : ''
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Step number badge */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isLast
                        ? 'bg-green-500 text-white'
                        : step.isCrossFloor
                          ? 'bg-purple-500 text-white'
                          : 'bg-primary/10 text-primary'
                    }`}>
                      {isLast ? <FiCheckCircle className="w-4 h-4" /> : step.stepNumber}
                    </div>

                    {/* Instruction */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isLast ? 'font-bold text-green-700' : 'text-on-surface'}`}>
                        {step.instruction}
                      </p>
                      {step.distance > 0 && !isLast && (
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          ~{step.distance}{t.meters}
                        </p>
                      )}
                    </div>

                    {/* Floor pill */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${floorColor.pill}`}>
                      {step.floorLabel?.split(' ').map(w => w[0]).join('') || `F${step.floor}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
