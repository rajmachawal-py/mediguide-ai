/**
 * MediGuide AI — ProfilePage
 * User profile management page with editable form.
 * Loads profile from /api/profile and saves via PUT /api/profile.
 * Shows guest mode badge when not authenticated via Supabase.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiMapPin, FiGlobe, FiLogOut, FiSave, FiLoader, FiEdit2, FiCheck, FiShield, FiTrash2, FiFileText, FiAlertTriangle } from 'react-icons/fi'
import { supabase, signOut, getSession } from '../services/supabase'
import { getProfile, updateProfile } from '../services/api'
import { revokeConsent, getConsentInfo } from '../components/shared/ConsentModal'
import toast from 'react-hot-toast'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Ladakh', 'J&K',
]

const INCOME_BRACKETS = [
  { value: 0,       label: { hi: 'चुनें',    en: 'Select' }},
  { value: 100000,  label: { hi: '₹1 लाख तक',    en: 'Up to ₹1 Lakh' }},
  { value: 250000,  label: { hi: '₹2.5 लाख तक',  en: 'Up to ₹2.5 Lakh' }},
  { value: 500000,  label: { hi: '₹5 लाख तक',    en: 'Up to ₹5 Lakh' }},
  { value: 1000000, label: { hi: '₹10 लाख तक',   en: 'Up to ₹10 Lakh' }},
  { value: 1000001, label: { hi: '₹10 लाख से ज़्यादा', en: 'Above ₹10 Lakh' }},
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const language = localStorage.getItem('mediguide_lang') || 'en'

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    age: '',
    gender: 'prefer_not_to_say',
    state: '',
    district: '',
    preferred_lang: language,
    annual_income: 0,
  })

  // Check auth and load profile
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const session = await getSession()

      if (session) {
        setIsAuthenticated(true)

        // Get user metadata from Supabase (Google name, email, avatar)
        const user = session.user
        const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
        const userEmail = user?.email || ''

        try {
          const data = await getProfile()
          if (data?.profile) {
            setProfile(prev => ({
              ...prev,
              ...data.profile,
              age: data.profile.age || '',
              // Use Google metadata as fallback if profile fields are empty
              full_name: data.profile.full_name || googleName,
              email: data.profile.email || userEmail,
            }))
          } else {
            // No profile from API — use Google metadata
            setProfile(prev => ({
              ...prev,
              full_name: googleName,
              email: userEmail,
            }))
          }
        } catch (err) {
          console.error('Profile load error:', err)
          // Fallback to Google metadata on API error
          setProfile(prev => ({
            ...prev,
            full_name: googleName,
            email: userEmail,
          }))
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updateData = {
        full_name: profile.full_name || null,
        age: profile.age ? parseInt(profile.age) : null,
        gender: profile.gender,
        state: profile.state || null,
        district: profile.district || null,
        preferred_lang: profile.preferred_lang,
        annual_income: profile.annual_income || null,
      }

      const result = await updateProfile(updateData)
      if (result?.profile) {
        setProfile(prev => ({ ...prev, ...result.profile }))
      }

      // Sync language preference
      localStorage.setItem('mediguide_lang', profile.preferred_lang)

      toast.success(language === 'hi' ? 'प्रोफ़ाइल सेव हो गई ✅' : 'Profile saved ✅')
      setIsEditing(false)
    } catch (err) {
      toast.error(language === 'hi' ? 'सेव करने में विफल' : 'Failed to save profile')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    if (isAuthenticated) {
      await signOut()
    }
    localStorage.removeItem('mediguide_guest')
    localStorage.removeItem('mediguide_location')
    navigate('/login')
  }

  /** DPDPA: Withdraw consent and redirect to login */
  const handleWithdrawConsent = () => {
    if (!window.confirm(
      language === 'hi'
        ? 'क्या आप वाकई अपनी सहमति वापस लेना चाहते हैं? सभी स्थानीय डेटा हटा दिया जाएगा।'
        : language === 'mr'
          ? 'तुम्हाला खरोखर तुमची संमती मागे घ्यायची आहे का? सर्व स्थानिक डेटा हटवला जाईल.'
          : 'Are you sure you want to withdraw consent? All local data will be deleted.'
    )) return

    revokeConsent()
    if (isAuthenticated) {
      signOut()
    }
    toast.success(
      language === 'hi' ? 'सहमति वापस ली गई। डेटा हटाया गया।' :
      language === 'mr' ? 'संमती मागे घेतली. डेटा हटवला.' :
      'Consent withdrawn. Local data cleared.'
    )
    // Small delay so the toast is visible before redirect
    setTimeout(() => navigate('/login'), 800)
  }

  const consentInfo = getConsentInfo()

  const t = {
    hi: {
      profile: 'प्रोफ़ाइल',
      guest: 'अतिथि मोड',
      authenticated: 'लॉग इन',
      edit: 'संपादन',
      save: 'सेव करें',
      name: 'पूरा नाम',
      age: 'उम्र',
      gender: 'लिंग',
      state: 'राज्य',
      district: 'जिला',
      language: 'भाषा',
      income: 'वार्षिक आय',
      email: 'ईमेल',
      logout: 'बाहर निकलें',
      loginFirst: 'प्रोफ़ाइल संपादित करने के लिए लॉगिन करें',
      schemeNote: 'आय और राज्य की जानकारी सरकारी योजनाओं की पात्रता के लिए उपयोग होती है',
      dataPrivacy: 'डेटा और गोपनीयता',
      consentGiven: 'सहमति दी गई',
      consentOn: 'सहमति दिनांक',
      withdrawConsent: 'सहमति वापस लें',
      viewPrivacy: 'गोपनीयता नीति देखें',
      deleteData: 'मेरा डेटा हटाएं',
      dpdpaNote: 'DPDPA 2023 के तहत आपको अपना डेटा हटाने और सहमति वापस लेने का अधिकार है',
    },
    mr: {
      profile: 'प्रोफाइल',
      guest: 'अतिथी मोड',
      authenticated: 'लॉग इन',
      edit: 'संपादन',
      save: 'सेव्ह करा',
      name: 'पूर्ण नाव',
      age: 'वय',
      gender: 'लिंग',
      state: 'राज्य',
      district: 'जिल्हा',
      language: 'भाषा',
      income: 'वार्षिक उत्पन्न',
      email: 'ईमेल',
      logout: 'बाहेर पडा',
      loginFirst: 'प्रोफाइल संपादित करण्यासाठी साइन इन करा',
      schemeNote: 'उत्पन्न आणि राज्य माहिती सरकारी योजनांच्या पात्रतेसाठी वापरली जाते',
      dataPrivacy: 'डेटा आणि गोपनीयता',
      consentGiven: 'संमती दिली',
      consentOn: 'संमती दिनांक',
      withdrawConsent: 'संमती मागे घ्या',
      viewPrivacy: 'गोपनीयता धोरण पहा',
      deleteData: 'माझा डेटा हटवा',
      dpdpaNote: 'DPDPA 2023 अंतर्गत तुम्हाला तुमचा डेटा हटवण्याचा आणि संमती मागे घेण्याचा अधिकार आहे',
    },
    en: {
      profile: 'Profile',
      guest: 'Guest Mode',
      authenticated: 'Logged In',
      edit: 'Edit',
      save: 'Save',
      name: 'Full Name',
      age: 'Age',
      gender: 'Gender',
      state: 'State',
      district: 'District',
      language: 'Language',
      income: 'Annual Income',
      email: 'Email',
      logout: 'Sign Out',
      loginFirst: 'Sign in to edit your profile',
      schemeNote: 'Income and state info is used for government scheme eligibility matching',
      dataPrivacy: 'Data & Privacy',
      consentGiven: 'Consent Given',
      consentOn: 'Consent Date',
      withdrawConsent: 'Withdraw Consent',
      viewPrivacy: 'View Privacy Policy',
      deleteData: 'Delete My Data',
      dpdpaNote: 'Under DPDPA 2023, you have the right to delete your data and withdraw consent at any time',
    },
  }

  const text = t[language] || t.en

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <FiLoader className="w-6 h-6 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center">
          <FiUser className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-xl font-bold text-white">{text.profile}</h1>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isAuthenticated
            ? 'bg-green-500/20 text-green-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          <FiShield className="w-3 h-3" />
          {isAuthenticated ? text.authenticated : text.guest}
        </div>
      </div>

      {/* Not authenticated message */}
      {!isAuthenticated && (
        <div className="glass-card p-4 text-center text-sm text-surface-300 space-y-2">
          <p>{text.loginFirst}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary text-xs px-4 py-2"
          >
            {language === 'hi' ? 'लॉगिन करें' : 'Sign In'}
          </button>
        </div>
      )}

      {/* Profile Form */}
      <div className="space-y-3">
        {/* Email (read-only) */}
        {profile.email && (
          <div className="glass-card p-4 flex items-center gap-3">
            <FiUser className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-surface-400 uppercase tracking-wider">{text.email}</p>
              <p className="text-sm text-white font-medium">{profile.email}</p>
            </div>
          </div>
        )}

        {/* Editable Fields */}
        {isAuthenticated && (
          <>
            {/* Edit Toggle */}
            <div className="flex justify-end">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <FiEdit2 className="w-3 h-3" /> {text.edit}
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  {saving ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiCheck className="w-3 h-3" />}
                  {text.save}
                </button>
              )}
            </div>

            {/* Name */}
            <ProfileField label={text.name} isEditing={isEditing}>
              <input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => handleChange('full_name', e.target.value)}
                disabled={!isEditing}
                placeholder={language === 'hi' ? 'आपका नाम' : 'Your name'}
                className="profile-input"
              />
            </ProfileField>

            {/* Age + Gender Row */}
            <div className="grid grid-cols-2 gap-3">
              <ProfileField label={text.age} isEditing={isEditing}>
                <input
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => handleChange('age', e.target.value)}
                  disabled={!isEditing}
                  min="0"
                  max="120"
                  placeholder="30"
                  className="profile-input"
                />
              </ProfileField>

              <ProfileField label={text.gender} isEditing={isEditing}>
                <select
                  value={profile.gender || 'prefer_not_to_say'}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  disabled={!isEditing}
                  className="profile-input"
                >
                  <option value="male">{language === 'hi' ? 'पुरुष' : 'Male'}</option>
                  <option value="female">{language === 'hi' ? 'महिला' : 'Female'}</option>
                  <option value="other">{language === 'hi' ? 'अन्य' : 'Other'}</option>
                  <option value="prefer_not_to_say">{language === 'hi' ? 'नहीं बताना' : 'Prefer not to say'}</option>
                </select>
              </ProfileField>
            </div>

            {/* State + District Row */}
            <div className="grid grid-cols-2 gap-3">
              <ProfileField label={text.state} isEditing={isEditing}>
                <select
                  value={profile.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  disabled={!isEditing}
                  className="profile-input"
                >
                  <option value="">{language === 'hi' ? 'चुनें' : 'Select'}</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </ProfileField>

              <ProfileField label={text.district} isEditing={isEditing}>
                <input
                  type="text"
                  value={profile.district || ''}
                  onChange={(e) => handleChange('district', e.target.value)}
                  disabled={!isEditing}
                  placeholder={language === 'hi' ? 'जिला' : 'District'}
                  className="profile-input"
                />
              </ProfileField>
            </div>

            {/* Language */}
            <ProfileField label={text.language} isEditing={isEditing}>
              <div className="flex gap-2">
                {[
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'mr', label: 'मराठी' },
                  { code: 'en', label: 'English' },
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => isEditing && handleChange('preferred_lang', lang.code)}
                    disabled={!isEditing}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      profile.preferred_lang === lang.code
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-800/60 text-surface-400'
                    } ${isEditing ? 'hover:bg-surface-700 cursor-pointer' : 'cursor-default'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </ProfileField>

            {/* Annual Income */}
            <ProfileField label={text.income} isEditing={isEditing}>
              <select
                value={profile.annual_income || 0}
                onChange={(e) => handleChange('annual_income', parseInt(e.target.value))}
                disabled={!isEditing}
                className="profile-input"
              >
                {INCOME_BRACKETS.map(b => (
                  <option key={b.value} value={b.value}>
                    {(b.label[language] || b.label.en)}
                  </option>
                ))}
              </select>
            </ProfileField>

            {/* Scheme note */}
            <p className="text-[10px] text-surface-500 text-center px-4 leading-relaxed">
              💡 {text.schemeNote}
            </p>
          </>
        )}

        {/* Language (guest mode) */}
        {!isAuthenticated && (
          <div className="glass-card p-4 flex items-center gap-3">
            <FiGlobe className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-surface-400">{text.language}</p>
              <p className="text-sm text-white font-medium">
                {language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'English'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── DPDPA Data Rights Section ─────────────────────── */}
      <div className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FiShield className="w-4 h-4 text-primary-400" />
          <h2 className="text-sm font-bold text-white">{text.dataPrivacy}</h2>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-[9px] font-semibold text-primary-400">
            DPDPA 2023
          </span>
        </div>

        {/* Consent Status */}
        {consentInfo.given && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <FiCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-green-400 font-semibold">{text.consentGiven}</p>
              {consentInfo.timestamp && (
                <p className="text-[9px] text-green-400/60">
                  {text.consentOn}: {new Date(consentInfo.timestamp).toLocaleDateString(
                    language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN',
                    { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Privacy Policy Link */}
        <button
          onClick={() => navigate('/privacy')}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-800/60 hover:bg-surface-800/90 text-surface-300 hover:text-white transition-all text-xs"
        >
          <FiFileText className="w-3.5 h-3.5 text-primary-400" />
          {text.viewPrivacy}
        </button>

        {/* Withdraw Consent */}
        <button
          onClick={handleWithdrawConsent}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/5 hover:bg-red-500/15 text-red-400/70 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 transition-all text-xs"
        >
          <FiAlertTriangle className="w-3.5 h-3.5" />
          {text.withdrawConsent}
        </button>

        <p className="text-[9px] text-surface-500 text-center leading-relaxed px-2">
          🔒 {text.dpdpaNote}
        </p>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-800/60 text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
      >
        <FiLogOut className="w-4 h-4" />
        {text.logout}
      </button>
    </div>
  )
}


/** Reusable profile field wrapper. */
function ProfileField({ label, isEditing, children }) {
  return (
    <div className="glass-card p-3 space-y-1.5">
      <label className="text-[10px] text-surface-400 uppercase tracking-wider font-medium">
        {label}
      </label>
      {children}
      <style>{`
        .profile-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.5);
          color: #e2e8f0;
          border: 1px solid rgba(51, 65, 85, 0.3);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          transition: all 0.2s;
          outline: none;
        }
        .profile-input:focus {
          border-color: rgba(47, 143, 255, 0.5);
          box-shadow: 0 0 0 2px rgba(47, 143, 255, 0.15);
        }
        .profile-input:disabled {
          opacity: 0.7;
          cursor: default;
          border-color: transparent;
          background: transparent;
          padding-left: 0;
        }
      `}</style>
    </div>
  )
}
