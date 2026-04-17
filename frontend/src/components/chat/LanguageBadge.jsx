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
              ? 'bg-primary-container text-white shadow-md shadow-primary-container/20'
              : 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30 border border-outline-variant/30'
          }`}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  )
}
