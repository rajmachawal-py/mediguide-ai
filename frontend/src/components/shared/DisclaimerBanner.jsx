/**
 * MediGuide AI — DisclaimerBanner
 * Persistent "not medical advice" disclaimer shown in the chat interface.
 * Required by Telemedicine Practice Guidelines (India).
 */

import { useState } from 'react'
import { FiInfo, FiX } from 'react-icons/fi'

const DISCLAIMER = {
  hi: '⚕️ यह चिकित्सा सलाह नहीं है। कृपया किसी योग्य डॉक्टर से परामर्श करें।',
  mr: '⚕️ हा वैद्यकीय सल्ला नाही. कृपया पात्र डॉक्टरांचा सल्ला घ्या.',
  en: '⚕️ This is not medical advice. Please consult a qualified doctor.',
}

export default function DisclaimerBanner({ language = 'en' }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const text = DISCLAIMER[language] || DISCLAIMER.en

  return (
    <div className="mx-4 mt-1 mb-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-fade-in">
      <FiInfo className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      <p className="flex-1 text-[10px] text-amber-300/90 leading-relaxed font-medium">
        {text}
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400/50 hover:text-amber-300 transition-colors flex-shrink-0"
        aria-label="Dismiss disclaimer"
      >
        <FiX className="w-3 h-3" />
      </button>
    </div>
  )
}
