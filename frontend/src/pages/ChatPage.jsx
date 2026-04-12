/**
 * MediGuide AI — ChatPage
 * Main chat interface for symptom assessment and triage.
 */

import { useRef, useEffect, useState } from 'react'
import useChat from '../hooks/useChat'
import useGeolocation from '../hooks/useGeolocation'
import ChatBubble from '../components/chat/ChatBubble'
import ChatInput from '../components/chat/ChatInput'
import VoiceButton from '../components/chat/VoiceButton'
import UrgencyBanner from '../components/chat/UrgencyBanner'
import LanguageBadge from '../components/chat/LanguageBadge'
import EmergencyAlert from '../components/shared/EmergencyAlert'
import Spinner from '../components/shared/Spinner'
import { getNearbyHospitals } from '../services/api'
import { FiRefreshCw, FiFileText } from 'react-icons/fi'

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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

  const handleVoiceTranscript = (transcript) => {
    if (transcript) {
      sendMessage(transcript, lat, lng)
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

        {/* Summary Button */}
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
               'Generate Doctor Summary'}
            </button>
          </div>
        )}

        {/* Doctor Summary */}
        {summary && (
          <div className="glass-card p-4 space-y-2 animate-slide-up">
            <h3 className="text-sm font-bold text-primary-400 flex items-center gap-2">
              <FiFileText className="w-4 h-4" /> Doctor-Ready Summary
            </h3>
            <pre className="text-xs text-surface-300 whitespace-pre-wrap font-sans leading-relaxed">
              {typeof summary === 'string' ? summary : JSON.stringify(summary, null, 2)}
            </pre>
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
            disabled={isLoading}
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
