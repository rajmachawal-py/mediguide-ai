/**
 * MediGuide AI — ChatPage
 * Main chat interface for symptom assessment and triage.
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
import LanguageBadge from '../components/chat/LanguageBadge'
import DisclaimerBanner from '../components/shared/DisclaimerBanner'
import EmergencyAlert from '../components/shared/EmergencyAlert'
import Spinner from '../components/shared/Spinner'
import { getNearbyHospitals, textToSpeech } from '../services/api'
import { generateHealthCard } from '../services/healthCardGenerator'
import { downloadFHIRBundle } from '../services/fhirExport'
import { playAudioBlob } from '../services/sarvam'
import { FiRefreshCw, FiFileText, FiDownload, FiVolume2, FiCode } from 'react-icons/fi'
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

  // Voice Auto-Mode
  const { isAutoMode, phase, liveTranscript, startAutoMode, stopAutoMode } =
    useVoiceAutoMode({ language, sendMessage, messages, isFinal, lat, lng })
  const usedVoiceRef = useRef(false) // track if last input was voice

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-play TTS when AI responds after voice input
  useEffect(() => {
    if (!usedVoiceRef.current) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'assistant' && lastMsg.content && !lastMsg.isError) {
      usedVoiceRef.current = false // reset
      // Play the AI response as audio
      textToSpeech(lastMsg.content, language)
        .then(audioBlob => playAudioBlob(audioBlob))
        .catch(err => console.warn('TTS playback failed:', err))
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

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
    usedVoiceRef.current = false
    sendMessage(text, lat, lng)
  }

  const handleVoiceTranscript = (transcript) => {
    if (transcript) {
      usedVoiceRef.current = true // mark that voice was used
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
              title={isAutoMode ? 'Stop Voice Mode' : 'Start Voice Mode'}
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

      {/* Language Selector */}
      <div className="px-4 py-2 flex justify-center">
        <LanguageBadge selected={language} onChange={changeLanguage} />
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
