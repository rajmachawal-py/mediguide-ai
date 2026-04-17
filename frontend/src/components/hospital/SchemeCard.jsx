/**
 * MediGuide AI — SchemeCard
 * Government scheme eligibility card with AI explanation button.
 * Uses Clinical Intelligence Design System (light theme).
 */

import { useState } from 'react'
import { FiShield, FiChevronDown, FiChevronUp, FiLoader, FiVolume2 } from 'react-icons/fi'
import { explainScheme, textToSpeech } from '../../services/api'

export default function SchemeCard({ scheme, language = 'en' }) {
  const [expanded, setExpanded] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  if (!scheme) return null

  const handleExplain = async () => {
    if (explanation) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    setExpanded(true)
    try {
      const result = await explainScheme(scheme.id, language)
      setExplanation(result.explanation || result)
    } catch (err) {
      console.error('Scheme explain error:', err)
      setExplanation(language === 'hi' ? 'समझाने में विफल' : 'Failed to load explanation')
    } finally {
      setLoading(false)
    }
  }

  const handleSpeak = async () => {
    if (!explanation || speaking) return
    setSpeaking(true)
    try {
      const text = typeof explanation === 'string' ? explanation : JSON.stringify(explanation)
      const audioBlob = await textToSpeech(text, language)
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      audio.onended = () => {
        URL.revokeObjectURL(url)
        setSpeaking(false)
      }
      audio.play()
    } catch {
      setSpeaking(false)
    }
  }

  // Determine eligibility display
  const isEligible = scheme.is_eligible !== false

  return (
    <div className="clinical-card overflow-hidden animate-slide-up ghost-border">
      <div className="p-4 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isEligible ? 'bg-mild-light' : 'bg-surface-container'
            }`}>
              <FiShield className={`w-4 h-4 ${isEligible ? 'text-mild' : 'text-outline'}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-on-surface truncate">
                {(language === 'hi' && scheme.name_hi) || scheme.name}
              </h3>
              {scheme.type && (
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  {scheme.type === 'central' ? '🇮🇳 Central' : '🏛️ State'}
                </span>
              )}
            </div>
          </div>

          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isEligible
              ? 'bg-mild-light text-mild'
              : 'bg-error-container text-error'
          }`}>
            {isEligible
              ? (language === 'hi' ? 'पात्र' : 'Eligible')
              : (language === 'hi' ? 'अपात्र' : 'Not Eligible')
            }
          </span>
        </div>

        {/* Description */}
        {scheme.description && (
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
            {scheme.description}
          </p>
        )}

        {/* Benefits */}
        {scheme.max_benefit && (
          <p className="text-xs text-primary font-semibold">
            💰 {language === 'hi' ? 'लाभ:' : 'Benefit:'} ₹{Number(scheme.max_benefit).toLocaleString('en-IN')}
          </p>
        )}

        {/* Explain Button */}
        <button
          onClick={handleExplain}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-clinical bg-primary-fixed/40 text-primary text-xs font-medium hover:bg-primary-fixed/60 transition-all"
        >
          {loading ? (
            <FiLoader className="w-3.5 h-3.5 animate-spin" />
          ) : expanded ? (
            <FiChevronUp className="w-3.5 h-3.5" />
          ) : (
            <FiChevronDown className="w-3.5 h-3.5" />
          )}
          {language === 'hi' ? 'मेरी भाषा में समझाएं' : 'Explain in my language'}
        </button>
      </div>

      {/* AI Explanation */}
      {expanded && explanation && (
        <div className="px-4 py-3 bg-primary-fixed/20 border-t border-outline-variant/20 space-y-2 animate-fade-in">
          <pre className="text-xs text-on-surface whitespace-pre-wrap font-sans leading-relaxed">
            {typeof explanation === 'string' ? explanation : JSON.stringify(explanation, null, 2)}
          </pre>
          <button
            onClick={handleSpeak}
            disabled={speaking}
            className={`flex items-center gap-1.5 text-[10px] transition-colors ${
              speaking
                ? 'text-primary animate-pulse'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <FiVolume2 className="w-3 h-3" />
            {speaking
              ? (language === 'hi' ? 'सुना रहे हैं...' : 'Speaking...')
              : (language === 'hi' ? '🔊 सुनें' : '🔊 Listen')
            }
          </button>
        </div>
      )}
    </div>
  )
}
