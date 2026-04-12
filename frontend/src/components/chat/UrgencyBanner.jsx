/**
 * MediGuide AI — UrgencyBanner
 * Color-coded urgency indicator: Mild / Moderate / Emergency.
 */

import { FiAlertCircle, FiAlertTriangle, FiShield } from 'react-icons/fi'

const urgencyConfig = {
  mild: {
    icon: FiShield,
    emoji: '🟢',
    label: { hi: 'हल्का', mr: 'सौम्य', en: 'Mild' },
    advice: {
      hi: 'घर पर आराम करें और पानी पिएं। यदि लक्षण बिगड़ें तो डॉक्टर को दिखाएं।',
      mr: 'घरी विश्रांती घ्या. लक्षणे वाढल्यास डॉक्टरांना भेटा.',
      en: 'Rest at home and stay hydrated. See a doctor if symptoms worsen.',
    },
    classes: 'urgency-mild',
    textClass: 'text-green-400',
  },
  moderate: {
    icon: FiAlertCircle,
    emoji: '🟡',
    label: { hi: 'मध्यम', mr: 'मध्यम', en: 'Moderate' },
    advice: {
      hi: '24-48 घंटे में डॉक्टर से मिलें।',
      mr: '24-48 तासांत डॉक्टरांना भेटा.',
      en: 'Visit a doctor within 24-48 hours.',
    },
    classes: 'urgency-moderate',
    textClass: 'text-yellow-400',
  },
  emergency: {
    icon: FiAlertTriangle,
    emoji: '🔴',
    label: { hi: 'आपातकालीन', mr: 'आणीबाणी', en: 'Emergency' },
    advice: {
      hi: 'तुरंत अस्पताल जाएं या एम्बुलेंस बुलाएं!',
      mr: 'तात्काळ रुग्णालयात जा किंवा रुग्णवाहिका बोलवा!',
      en: 'Go to the hospital immediately or call an ambulance!',
    },
    classes: 'urgency-emergency',
    textClass: 'text-red-400',
  },
}

export default function UrgencyBanner({ urgency, language = 'en' }) {
  if (!urgency || !urgencyConfig[urgency]) return null

  const config = urgencyConfig[urgency]
  const Icon = config.icon

  return (
    <div className={`${config.classes} rounded-xl p-4 animate-bounce-in`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${config.textClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${config.textClass}`}>
            {config.emoji} {config.label[language] || config.label.en}
          </p>
          <p className="text-xs text-surface-300 mt-1 leading-relaxed">
            {config.advice[language] || config.advice.en}
          </p>
        </div>
      </div>
    </div>
  )
}
