/**
 * MediGuide AI — ChecklistCard
 * Pre-consultation checklist displayed after triage.
 * Shows documents to bring, fasting instructions, etc.
 */

import { useState } from 'react'
import { FiCheckSquare, FiSquare, FiClipboard } from 'react-icons/fi'

const CHECKLISTS = {
  mild: {
    hi: [
      'पिछली जाँच रिपोर्ट लेकर जाएं',
      'मौजूदा दवाइयों की सूची बनाएं',
      'लक्षण कब शुरू हुए — नोट करें',
    ],
    en: [
      'Bring previous test reports',
      'List current medications',
      'Note when symptoms started',
    ],
  },
  moderate: {
    hi: [
      'पहचान पत्र (आधार/PAN) ले जाएं',
      'स्वास्थ्य बीमा कार्ड या पॉलिसी',
      'पिछली सारी जाँच रिपोर्ट',
      'मौजूदा दवाइयों की सूची',
      'एलर्जी की जानकारी लिख लें',
      'खाली पेट रहें (अगर खून की जाँच हो)',
    ],
    en: [
      'Bring ID proof (Aadhaar/PAN)',
      'Health insurance card or policy',
      'All previous test reports',
      'List of current medications',
      'Note any allergies',
      'Fast if blood tests are likely',
    ],
  },
  emergency: {
    hi: [
      '🚨 तुरंत अस्पताल जाएं',
      'पहचान पत्र साथ रखें',
      'फ़ोन चार्ज रखें',
      'एक साथी को बुलाएं',
      'मौजूदा दवाइयाँ साथ लें',
    ],
    en: [
      '🚨 Go to hospital immediately',
      'Keep ID proof ready',
      'Keep phone charged',
      'Call a companion',
      'Bring current medications',
    ],
  },
}

export default function ChecklistCard({ urgency = 'moderate', language = 'en' }) {
  const items = CHECKLISTS[urgency]?.[language] || CHECKLISTS[urgency]?.en || CHECKLISTS.moderate.en
  const [checked, setChecked] = useState(new Set())

  const toggle = (index) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="glass-card p-4 space-y-3 animate-slide-up">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <FiClipboard className="w-4 h-4 text-primary-400" />
        {language === 'hi' ? 'डॉक्टर के पास जाने से पहले' : 'Before Your Visit'}
      </h3>

      <div className="space-y-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-start gap-2.5 text-left px-3 py-2 rounded-lg transition-all ${
              checked.has(i)
                ? 'bg-green-500/10 text-green-300'
                : 'bg-surface-800/40 text-surface-300 hover:bg-surface-800/70'
            }`}
          >
            {checked.has(i)
              ? <FiCheckSquare className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              : <FiSquare className="w-4 h-4 text-surface-500 flex-shrink-0 mt-0.5" />
            }
            <span className={`text-xs leading-relaxed ${checked.has(i) ? 'line-through opacity-60' : ''}`}>
              {item}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-surface-500 text-center">
        {checked.size}/{items.length} {language === 'hi' ? 'पूरा हुआ' : 'completed'}
      </p>
    </div>
  )
}
