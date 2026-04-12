/**
 * MediGuide AI — LanguageBadge
 * Language selector pills: Hindi / Marathi / English.
 */

const languages = [
  { code: 'hi', label: 'हिंदी',   flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी',   flag: '🏛️' },
  { code: 'en', label: 'English', flag: '🌐' },
]

export default function LanguageBadge({ selected, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            selected === lang.code
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
              : 'bg-surface-800/60 text-surface-400 hover:text-white hover:bg-surface-700'
          }`}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  )
}
