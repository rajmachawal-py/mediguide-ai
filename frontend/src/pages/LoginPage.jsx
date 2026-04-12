/**
 * MediGuide AI — LoginPage
 * Placeholder login page (full OTP auth in Phase 4).
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState(localStorage.getItem('mediguide_lang') || 'hi')

  const handleSkipLogin = () => {
    localStorage.setItem('mediguide_guest', 'true')
    navigate('/chat')
  }

  const handleLanguageSelect = (lang) => {
    setLanguage(lang)
    localStorage.setItem('mediguide_lang', lang)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="text-center space-y-4 mb-10 animate-fade-in">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center text-5xl shadow-2xl shadow-primary-600/10">
          🏥
        </div>
        <h1 className="text-3xl font-extrabold gradient-text">MediGuide AI</h1>
        <p className="text-surface-400 text-sm max-w-xs mx-auto leading-relaxed">
          {language === 'hi'
            ? 'आपका AI स्वास्थ्य सहायक — हिंदी, मराठी और अंग्रेज़ी में'
            : language === 'mr'
              ? 'तुमचा AI आरोग्य सहाय्यक — हिंदी, मराठी आणि इंग्रजी मध्ये'
              : 'Your AI Health Assistant — in Hindi, Marathi & English'}
        </p>
      </div>

      {/* Language Selection */}
      <div className="w-full max-w-xs space-y-3 mb-8 animate-slide-up">
        <p className="text-xs text-surface-400 text-center uppercase tracking-wider">
          {language === 'hi' ? 'अपनी भाषा चुनें' : language === 'mr' ? 'तुमची भाषा निवडा' : 'Choose your language'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'hi', label: 'हिंदी', sub: 'Hindi' },
            { code: 'mr', label: 'मराठी', sub: 'Marathi' },
            { code: 'en', label: 'English', sub: 'English' },
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`py-3 rounded-xl text-center transition-all ${
                language === lang.code
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 scale-105'
                  : 'glass-card text-surface-300 hover:text-white'
              }`}
            >
              <span className="block text-lg font-bold">{lang.label}</span>
              <span className="block text-[10px] opacity-60">{lang.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <div className="w-full max-w-xs space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button
          onClick={handleSkipLogin}
          className="btn-primary w-full text-center text-sm"
        >
          {language === 'hi' ? 'शुरू करें →' : language === 'mr' ? 'सुरू करा →' : 'Get Started →'}
        </button>
        <p className="text-[10px] text-surface-500 text-center">
          {language === 'hi' ? 'फ़ोन OTP लॉगिन जल्द आ रहा है' : 'Phone OTP login coming soon'}
        </p>
      </div>
    </div>
  )
}
