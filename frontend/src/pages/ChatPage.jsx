/**
 * MediGuide AI — ChatPage
 * Main chat interface for symptom assessment and triage.
 *
 * Voice I/O Architecture:
 * - Text Input: User types → text response (no audio)
 * - Mic Button (🎤): Voice → STT → sends as text → text-only response (no TTS)
 * - Voice Mode (🗣️): Full duplex overlay → voice in → AI → TTS out → loop
 *
 * TTS is ONLY used inside useVoiceAutoMode (Voice Mode).
 * The mic button and text chat never trigger audio output.
 */

import { useRef, useEffect, useState } from 'react'
import useChat from '../hooks/useChat'
import useGeolocation from '../hooks/useGeolocation'
import useVoiceAutoMode from '../hooks/useVoiceAutoMode'
import ChatBubble from '../components/chat/ChatBubble'
import ChatInput from '../components/chat/ChatInput'
import VoiceButton from '../components/chat/VoiceButton'
import ImageUploadButton from '../components/chat/ImageUploadButton'
import VoiceAutoModeOverlay from '../components/chat/VoiceAutoModeOverlay'
import UrgencyBanner from '../components/chat/UrgencyBanner'
import DisclaimerBanner from '../components/shared/DisclaimerBanner'
import EmergencyAlert from '../components/shared/EmergencyAlert'
import Spinner from '../components/shared/Spinner'
import { getNearbyHospitals, getEligibleSchemes } from '../services/api'
import { generateHealthCard } from '../services/healthCardGenerator'
import { downloadFHIRBundle } from '../services/fhirExport'
import { FiRefreshCw, FiFileText, FiDownload, FiCode, FiVolume2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

const welcomeMessage = {
  hi: 'नमस्ते! मैं MediGuide AI हूँ। आप अपने लक्षण बताइए, मैं आपकी मदद करूँगा। 🏥',
  mr: 'नमस्कार! मी MediGuide AI आहे. तुमची लक्षणे सांगा, मी तुम्हाला मदत करेन. 🏥',
  en: 'Hello! I\'m MediGuide AI. Describe your symptoms and I\'ll help you understand what to do next. 🏥',
}

export default function ChatPage() {
  const {
    messages, urgency, urgencyData, isLoading, isFinal, summary,
    language, changeLanguage, sendMessage, getSummary, resetChat,
  } = useChat()

  const { lat, lng } = useGeolocation()
  const messagesEndRef = useRef(null)
  const [showEmergency, setShowEmergency] = useState(false)
  const [nearestHospital, setNearestHospital] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [schemes, setSchemes] = useState(null) // null = not fetched, [] = fetched empty

  // Voice Auto-Mode (full duplex: voice in → AI → TTS out → loop)
  // Mic button input does NOT trigger TTS — only Voice Mode does
  const { isAutoMode, phase, liveTranscript, startAutoMode, stopAutoMode } =
    useVoiceAutoMode({ language, sendMessage, messages, isFinal, lat, lng })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // NOTE: No auto-TTS here — mic button input gets text-only responses.
  // TTS output only happens in Voice Mode (useVoiceAutoMode).

  // Trigger emergency alert when urgency is emergency
  useEffect(() => {
    if (urgency === 'emergency' && !showEmergency) {
      setShowEmergency(true)
      // Find nearest emergency hospital
      if (lat && lng) {
        getNearbyHospitals(lat, lng, 15, 'emergency')
          .then(data => {
            if (data.hospitals?.length > 0) {
              setNearestHospital(data.hospitals[0])
            }
          })
          .catch(console.error)
      }
    }
  }, [urgency]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = (text) => {
    sendMessage(text, lat, lng)
  }

  /** Handle voice transcript — sends as text, NO TTS output */
  const handleVoiceTranscript = (transcript) => {
    if (transcript) {
      sendMessage(transcript, lat, lng)
    }
  }

  /** Handle image capture from ImageUploadButton. */
  const handleImageCapture = (base64DataUrl) => {
    const defaultText = language === 'hi'
      ? 'कृपया इस चित्र का विश्लेषण करें'
      : language === 'mr'
        ? 'कृपया या चित्राचे विश्लेषण करा'
        : 'Please analyze this image of my symptom'
    sendMessage(defaultText, lat, lng, base64DataUrl)
  }

  /** Download Health Card as PDF. */
  const handleDownloadHealthCard = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      await generateHealthCard({
        patientName: localStorage.getItem('mediguide_patient_name') || 'Patient',
        age: localStorage.getItem('mediguide_patient_age') || '',
        gender: localStorage.getItem('mediguide_patient_gender') || '',
        language,
        urgency,
        urgencyData,
        messages,
        summary,
      })
      toast.success(
        language === 'hi' ? 'हेल्थ कार्ड डाउनलोड हो गया!' :
        language === 'mr' ? 'आरोग्य कार्ड डाउनलोड झाले!' :
        'Health Card downloaded!'
      )
    } catch (err) {
      console.error('Health Card generation failed:', err)
      toast.error('Failed to generate Health Card')
    } finally {
      setIsDownloading(false)
    }
  }

  // Show welcome message area if no messages yet
  const showWelcome = messages.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 glass-light rounded-b-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm">
            🏥
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">MediGuide AI</h1>
            <p className="text-[10px] text-surface-400">
              {language === 'hi' ? 'स्वास्थ्य सहायक' : language === 'mr' ? 'आरोग्य सहाय्यक' : 'Health Assistant'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFinal && (
            <button
              onClick={isAutoMode ? stopAutoMode : startAutoMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isAutoMode
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-primary-500/15 text-primary-400 border border-primary-500/30 hover:bg-primary-500/25'
              }`}
              title={isAutoMode
                ? (language === 'hi' ? 'वॉइस मोड बंद करें' : language === 'mr' ? 'व्हॉइस मोड बंद करा' : 'Stop Voice Mode')
                : (language === 'hi' ? 'वॉइस मोड — बोलें और सुनें' : language === 'mr' ? 'व्हॉइस मोड — बोला आणि ऐका' : 'Voice Mode — Speak & Listen')
              }
            >
              <FiVolume2 className="w-3.5 h-3.5" />
              {isAutoMode ? '🔴 Stop' : '🗣️ Voice'}
            </button>
          )}
          {messages.length > 0 && (
            <button onClick={resetChat} className="btn-ghost p-2" title="New chat">
              <FiRefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Medical Disclaimer */}
      <DisclaimerBanner language={language} />

      {/* Urgency Banner */}
      {urgency && (
        <div className="px-4 py-1">
          <UrgencyBanner urgency={urgency} language={language} />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {/* Welcome */}
        {showWelcome && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-4xl">
              🏥
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold gradient-text">MediGuide AI</h2>
              <p className="text-sm text-surface-300 max-w-xs leading-relaxed">
                {welcomeMessage[language] || welcomeMessage.en}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {(language === 'hi'
                ? ['सिरदर्द हो रहा है', 'पेट में दर्द है', 'बुखार आ रहा है']
                : language === 'mr'
                  ? ['डोकेदुखी होतेय', 'पोटदुखी आहे', 'ताप आलाय']
                  : ['I have a headache', 'Stomach pain', 'I have fever']
              ).map((hint) => (
                <button
                  key={hint}
                  onClick={() => handleSend(hint)}
                  className="px-3 py-1.5 rounded-full text-xs bg-surface-800/60 text-surface-300 hover:bg-primary-600/20 hover:text-primary-300 border border-surface-700/30 transition-all"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="chat-bubble-ai px-4 py-3">
              <div className="flex gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        {/* Generate & Download Health Card Button */}
        {isFinal && !summary && (
          <div className="flex justify-center py-2 animate-bounce-in">
            <button
              onClick={getSummary}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <FiFileText className="w-4 h-4" />
              {language === 'hi' ? 'डॉक्टर के लिए रिपोर्ट बनाएं' :
               language === 'mr' ? 'डॉक्टरांसाठी अहवाल तयार करा' :
               'Generate Doctor Report'}
            </button>
          </div>
        )}

        {/* Download Health Card + FHIR Export (shown after summary generated) */}
        {summary && (
          <div className="flex flex-col items-center gap-2 py-2 animate-slide-up">
            <button
              onClick={handleDownloadHealthCard}
              disabled={isDownloading}
              className="w-full max-w-xs flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              }}
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {language === 'hi' ? 'बना रहे हैं...' : language === 'mr' ? 'तयार करत आहे...' : 'Generating...'}
                </>
              ) : (
                <>
                  <FiDownload className="w-5 h-5" />
                  {language === 'hi' ? '📄 हेल्थ कार्ड डाउनलोड करें' :
                   language === 'mr' ? '📄 आरोग्य कार्ड डाउनलोड करा' :
                   '📄 Download Health Card'}
                </>
              )}
            </button>
            {/* FHIR Export Button */}
            <button
              onClick={() => {
                downloadFHIRBundle({
                  patientName: localStorage.getItem('mediguide_patient_name') || 'Patient',
                  age: localStorage.getItem('mediguide_patient_age') || '',
                  gender: localStorage.getItem('mediguide_patient_gender') || '',
                  language,
                  urgency,
                  urgencyData,
                  messages,
                  summary,
                })
                toast.success(
                  language === 'hi' ? 'FHIR रिपोर्ट डाउनलोड हो गई!' :
                  language === 'mr' ? 'FHIR अहवाल डाउनलोड झाला!' :
                  'FHIR report downloaded!'
                )
              }}
              className="w-full max-w-xs flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-surface-300 bg-surface-800/60 hover:bg-surface-800/90 border border-surface-700/40 hover:border-surface-600/60 transition-all active:scale-95"
            >
              <FiCode className="w-3.5 h-3.5" />
              {language === 'hi' ? '🏥 HL7 FHIR फॉर्मेट में डाउनलोड करें' :
               language === 'mr' ? '🏥 HL7 FHIR फॉर्मॅटमध्ये डाउनलोड करा' :
               '🏥 Download in HL7 FHIR Format'}
            </button>
          </div>
        )}

        {/* Government Scheme Recommendations — inline version */}
        {isFinal && (
          <InlineSchemes language={language} schemes={schemes} setSchemes={setSchemes} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 glass-light rounded-t-2xl border-t border-surface-700/30">
        <div className="flex items-end gap-2">
          <VoiceButton
            language={language}
            onTranscript={handleVoiceTranscript}
            disabled={isLoading || isFinal}
          />
          <ImageUploadButton
            onImageCapture={handleImageCapture}
            disabled={isLoading || isFinal}
          />
          <div className="flex-1">
            <ChatInput
              onSend={handleSend}
              isLoading={isLoading}
              language={language}
            />
          </div>
        </div>
      </div>

      {/* Voice Auto-Mode Overlay */}
      {isAutoMode && (
        <VoiceAutoModeOverlay
          phase={phase}
          liveTranscript={liveTranscript}
          language={language}
          onStop={stopAutoMode}
        />
      )}

      {/* Emergency Alert Overlay */}
      {showEmergency && (
        <EmergencyAlert
          hospital={nearestHospital}
          onDismiss={() => setShowEmergency(false)}
        />
      )}
    </div>
  )
}

/** Inline Government Schemes — self-contained, no external component */
function InlineSchemes({ language, schemes, setSchemes }) {
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const age = localStorage.getItem('mediguide_patient_age')
        const gender = localStorage.getItem('mediguide_patient_gender')
        const state = localStorage.getItem('mediguide_patient_state')
        const res = await getEligibleSchemes({
          state: state || undefined,
          age: age ? parseInt(age) : undefined,
          gender: gender || undefined,
        })
        setSchemes(res.schemes || [])
      } catch (err) {
        console.error('Scheme fetch error:', err)
        setSchemes([])
      } finally {
        setLoading(false)
      }
    }
    if (schemes === null) load()
    else setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const t = {
    hi: { title: 'सरकारी स्वास्थ्य योजनाएं', sub: 'आपके लिए उपलब्ध योजनाएं', loading: 'खोज रहे हैं...', none: 'कोई योजना नहीं मिली' },
    mr: { title: 'सरकारी आरोग्य योजना', sub: 'तुमच्यासाठी उपलब्ध योजना', loading: 'शोधत आहोत...', none: 'कोणतीही योजना सापडली नाही' },
    en: { title: 'Government Health Schemes', sub: 'Schemes you may be eligible for', loading: 'Searching...', none: 'No eligible schemes found' },
  }[language] || { title: 'Government Health Schemes', sub: 'Schemes you may be eligible for', loading: 'Searching...', none: 'No eligible schemes found' }

  if (loading) return (
    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 14, margin: '8px 0' }}>
      <p style={{ color: '#10b981', fontSize: 13, fontWeight: 600, margin: 0 }}>🛡️ {t.title}</p>
      <p style={{ color: '#94a3b8', fontSize: 11, margin: '4px 0 0' }}>{t.loading}</p>
    </div>
  )

  if (!schemes || schemes.length === 0) return null

  return (
    <div style={{ margin: '8px 0', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(16,185,129,0.2)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))', padding: '12px 14px', borderBottom: '1px solid rgba(16,185,129,0.15)' }}>
        <p style={{ color: '#10b981', fontSize: 13, fontWeight: 700, margin: 0 }}>🛡️ {t.title}</p>
        <p style={{ color: '#64748b', fontSize: 10, margin: '2px 0 0' }}>{t.sub}</p>
      </div>
      {/* Scheme Cards */}
      {schemes.map((s, i) => (
        <div key={s.id} style={{ background: 'rgba(15,23,42,0.6)', borderBottom: i < schemes.length - 1 ? '1px solid rgba(100,116,139,0.15)' : 'none' }}>
          <button
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>💚</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {language === 'hi' && s.name_hi ? s.name_hi : language === 'mr' && s.name_mr ? s.name_mr : s.name}
              </p>
              {s.benefit_amount && (
                <p style={{ color: '#10b981', fontSize: 10, margin: '2px 0 0' }}>
                  💰 ₹{Number(s.benefit_amount).toLocaleString('en-IN')}
                </p>
              )}
            </div>
            <span style={{ color: '#64748b', fontSize: 14 }}>{expanded === s.id ? '▲' : '▼'}</span>
          </button>
          {expanded === s.id && (
            <div style={{ padding: '0 14px 12px 56px' }}>
              <p style={{ color: '#cbd5e1', fontSize: 11, lineHeight: '1.5', margin: '0 0 8px' }}>
                {language === 'hi' && s.description_hi ? s.description_hi : language === 'mr' && s.description_mr ? s.description_mr : s.description}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.helpline && (
                  <a href={`tel:${s.helpline.replace(/[^0-9+]/g, '')}`} style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '3px 8px', textDecoration: 'none' }}>
                    📞 {s.helpline}
                  </a>
                )}
                {s.scheme_url && (
                  <a href={s.scheme_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '3px 8px', textDecoration: 'none' }}>
                    🔗 Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
