/**
 * MediGuide AI — DisclaimerBanner
 * Persistent "not medical advice" disclaimer shown in the chat interface.
 * Required by Telemedicine Practice Guidelines (India).
 * NOTE: This banner is intentionally NOT dismissible — Telemedicine Guidelines
 *       mandate a visible disclaimer throughout every interaction.
 */

import { FiInfo } from 'react-icons/fi'

const DISCLAIMER = {
  hi: '⚕️ यह चिकित्सा सलाह नहीं है। कृपया किसी योग्य डॉक्टर से परामर्श करें।',
  mr: '⚕️ हा वैद्यकीय सल्ला नाही. कृपया पात्र डॉक्टरांचा सल्ला घ्या.',
  en: '⚕️ This is not medical advice. Please consult a qualified doctor.',
}

export default function DisclaimerBanner({ language = 'en' }) {
  const text = DISCLAIMER[language] || DISCLAIMER.en

  return (
    <div className="mx-4 mt-1 mb-0 flex items-center gap-2 px-3 py-2 rounded-clinical bg-surface-container-low">
      <FiInfo className="w-3.5 h-3.5 text-outline flex-shrink-0" />
      <p className="flex-1 text-[10px] text-on-surface-variant leading-relaxed font-medium">
        {text}
      </p>
    </div>
  )
}
