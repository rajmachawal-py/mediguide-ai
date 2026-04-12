/**
 * MediGuide AI — ProfilePage
 * User profile placeholder (full implementation in Phase 4).
 */

import { FiUser, FiMapPin, FiGlobe, FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const navigate = useNavigate()
  const language = localStorage.getItem('mediguide_lang') || 'en'

  const handleLogout = () => {
    localStorage.removeItem('mediguide_guest')
    navigate('/login')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center">
          <FiUser className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-xl font-bold text-white">
          {language === 'hi' ? 'प्रोफ़ाइल' : language === 'mr' ? 'प्रोफाइल' : 'Profile'}
        </h1>
        <p className="text-xs text-surface-400">
          {language === 'hi' ? 'अतिथि मोड' : 'Guest Mode'}
        </p>
      </div>

      {/* Info Cards */}
      <div className="space-y-3">
        <div className="glass-card p-4 flex items-center gap-3">
          <FiGlobe className="w-5 h-5 text-primary-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-surface-400">Language</p>
            <p className="text-sm text-white font-medium">
              {language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'English'}
            </p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <FiMapPin className="w-5 h-5 text-primary-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-surface-400">Location</p>
            <p className="text-sm text-white font-medium">Auto-detected</p>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="glass-card p-6 text-center space-y-2">
        <p className="text-sm text-surface-300">
          {language === 'hi'
            ? '🔐 फ़ोन OTP से लॉगिन और प्रोफ़ाइल जल्द आ रही है'
            : '🔐 Phone OTP login & full profile coming soon'}
        </p>
        <p className="text-xs text-surface-500">
          Save your chat history, get personalized scheme recommendations, and more.
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-800/60 text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
      >
        <FiLogOut className="w-4 h-4" />
        {language === 'hi' ? 'बाहर निकलें' : 'Exit to Login'}
      </button>
    </div>
  )
}
