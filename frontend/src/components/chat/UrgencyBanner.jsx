/**
 * MediGuide AI — UrgencyBanner
 * Clinical Intelligence triage status banner.
 * Uses 10% opacity backgrounds per the design system spec.
 */

import { FiAlertTriangle, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

const labels = {
  emergency: {
    hi: '🔴 आपातकालीन — तुरंत अस्पताल जाएं या 108 कॉल करें',
    mr: '🔴 आपत्कालीन — ताबडतोब रुग्णालयात जा किंवा 108 वर कॉल करा',
    en: '🔴 EMERGENCY — Go to hospital immediately or call 108',
  },
  moderate: {
    hi: '🟡 मध्यम — 24 घंटे के भीतर डॉक्टर से मिलें',
    mr: '🟡 मध्यम — 24 तासांत डॉक्टरांना भेटा',
    en: '🟡 MODERATE — See a doctor within 24 hours',
  },
  mild: {
    hi: '🟢 सामान्य — घरेलू उपचार और आराम से मैनेज करें',
    mr: '🟢 सौम्य — घरगुती उपचार आणि विश्रांती घ्या',
    en: '🟢 MILD — Manageable with home care and rest',
  },
}

export default function UrgencyBanner({ urgency, language = 'en' }) {
  if (!urgency) return null

  const text = labels[urgency]?.[language] || labels[urgency]?.en || ''
  const Icon = urgency === 'emergency' ? FiAlertTriangle
    : urgency === 'moderate' ? FiAlertCircle
    : FiCheckCircle

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-clinical animate-scale-in ${
        urgency === 'emergency'
          ? 'urgency-emergency'
          : urgency === 'moderate'
            ? 'urgency-moderate'
            : 'urgency-mild'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-xs font-semibold leading-snug">{text}</p>
    </div>
  )
}
