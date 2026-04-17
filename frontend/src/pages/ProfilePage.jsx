/**
 * MediGuide AI — ProfilePage
 * User profile management + professional dashboard with chat history.
 * Fully translated in Hindi, Marathi, and English.
 *
 * Tabs:
 *   1. Profile — editable user information
 *   2. Dashboard — chat history, health stats, quick actions
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUser, FiMapPin, FiGlobe, FiLogOut, FiSave, FiLoader, FiEdit2, FiCheck,
  FiShield, FiTrash2, FiFileText, FiAlertTriangle, FiMessageCircle,
  FiActivity, FiClock, FiDownload, FiPlus, FiChevronRight, FiCalendar,
  FiBarChart2, FiHeart, FiTrendingUp,
} from 'react-icons/fi'
import { supabase, signOut, getSession } from '../services/supabase'
import { getProfile, updateProfile } from '../services/api'
import { revokeConsent, getConsentInfo } from '../components/shared/ConsentModal'
import { useLanguage } from '../contexts/LanguageContext'
import { getAllSessions, deleteSession } from '../hooks/useChat'
import { generateHealthCard } from '../services/healthCardGenerator'
import { downloadFHIRBundle } from '../services/fhirExport'
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
  { value: 0,       label: { hi: 'चुनें',    mr: 'निवडा',   en: 'Select' }},
  { value: 100000,  label: { hi: '₹1 लाख तक',    mr: '₹1 लाख पर्यंत',   en: 'Up to ₹1 Lakh' }},
  { value: 250000,  label: { hi: '₹2.5 लाख तक',  mr: '₹2.5 लाख पर्यंत', en: 'Up to ₹2.5 Lakh' }},
  { value: 500000,  label: { hi: '₹5 लाख तक',    mr: '₹5 लाख पर्यंत',   en: 'Up to ₹5 Lakh' }},
  { value: 1000000, label: { hi: '₹10 लाख तक',   mr: '₹10 लाख पर्यंत',  en: 'Up to ₹10 Lakh' }},
  { value: 1000001, label: { hi: '₹10 लाख से ज़्यादा', mr: '₹10 लाख पेक्षा जास्त', en: 'Above ₹10 Lakh' }},
]

/* ─── Translation Object ───────────────────────────────────── */

const translations = {
  hi: {
    // Tabs
    profileTab: 'प्रोफ़ाइल',
    dashboardTab: 'डैशबोर्ड',
    // Profile
    profile: 'प्रोफ़ाइल',
    guest: 'अतिथि मोड',
    authenticated: 'लॉग इन',
    edit: 'संपादन',
    save: 'सेव करें',
    name: 'पूरा नाम',
    namePlaceholder: 'आपका नाम',
    age: 'उम्र',
    gender: 'लिंग',
    genderMale: 'पुरुष',
    genderFemale: 'महिला',
    genderOther: 'अन्य',
    genderPreferNot: 'नहीं बताना',
    state: 'राज्य',
    statePlaceholder: 'चुनें',
    district: 'जिला',
    districtPlaceholder: 'जिला',
    language: 'भाषा',
    income: 'वार्षिक आय',
    email: 'ईमेल',
    logout: 'बाहर निकलें',
    loginFirst: 'प्रोफ़ाइल संपादित करने के लिए लॉगिन करें',
    signInBtn: 'लॉगिन करें',
    schemeNote: 'आय और राज्य की जानकारी सरकारी योजनाओं की पात्रता के लिए उपयोग होती है',
    dataPrivacy: 'डेटा और गोपनीयता',
    consentGiven: 'सहमति दी गई',
    consentOn: 'सहमति दिनांक',
    withdrawConsent: 'सहमति वापस लें',
    viewPrivacy: 'गोपनीयता नीति देखें',
    deleteData: 'मेरा डेटा हटाएं',
    dpdpaNote: 'DPDPA 2023 के तहत आपको अपना डेटा हटाने और सहमति वापस लेने का अधिकार है',
    withdrawConfirm: 'क्या आप वाकई अपनी सहमति वापस लेना चाहते हैं? सभी स्थानीय डेटा हटा दिया जाएगा।',
    withdrawDone: 'सहमति वापस ली गई। डेटा हटाया गया।',
    profileSaved: 'प्रोफ़ाइल सेव हो गई ✅',
    profileSaveFailed: 'सेव करने में विफल',
    // Dashboard
    chatHistory: 'चैट इतिहास',
    healthStats: 'स्वास्थ्य सांख्यिकी',
    quickActions: 'त्वरित कार्य',
    totalSessions: 'कुल सत्र',
    totalMessages: 'कुल संदेश',
    lastSession: 'अंतिम सत्र',
    mildSessions: 'सामान्य',
    moderateSessions: 'मध्यम',
    emergencySessions: 'आपातकाल',
    noSessions: 'अभी तक कोई चैट इतिहास नहीं। अपनी पहली बातचीत शुरू करें!',
    newChat: 'नई चैट शुरू करें',
    continueChat: 'जारी रखें',
    viewChat: 'पढ़ें',
    downloadReport: 'रिपोर्ट डाउनलोड करें',
    downloaded: 'डाउनलोड हो चुकी',
    deleteChat: 'हटाएं',
    messages: 'संदेश',
    today: 'आज',
    yesterday: 'कल',
    daysAgo: 'दिन पहले',
    clearAllHistory: 'सारा इतिहास हटाएं',
    clearAllConfirm: 'क्या आप सभी चैट इतिहास हटाना चाहते हैं?',
    sessionDeleted: 'चैट हटा दी गई',
    allCleared: 'सारा इतिहास हटा दिया गया',
  },
  mr: {
    // Tabs
    profileTab: 'प्रोफाइल',
    dashboardTab: 'डॅशबोर्ड',
    // Profile
    profile: 'प्रोफाइल',
    guest: 'अतिथी मोड',
    authenticated: 'लॉग इन',
    edit: 'संपादन',
    save: 'सेव्ह करा',
    name: 'पूर्ण नाव',
    namePlaceholder: 'तुमचे नाव',
    age: 'वय',
    gender: 'लिंग',
    genderMale: 'पुरुष',
    genderFemale: 'स्त्री',
    genderOther: 'इतर',
    genderPreferNot: 'सांगायचे नाही',
    state: 'राज्य',
    statePlaceholder: 'निवडा',
    district: 'जिल्हा',
    districtPlaceholder: 'जिल्हा',
    language: 'भाषा',
    income: 'वार्षिक उत्पन्न',
    email: 'ईमेल',
    logout: 'बाहेर पडा',
    loginFirst: 'प्रोफाइल संपादित करण्यासाठी साइन इन करा',
    signInBtn: 'साइन इन करा',
    schemeNote: 'उत्पन्न आणि राज्य माहिती सरकारी योजनांच्या पात्रतेसाठी वापरली जाते',
    dataPrivacy: 'डेटा आणि गोपनीयता',
    consentGiven: 'संमती दिली',
    consentOn: 'संमती दिनांक',
    withdrawConsent: 'संमती मागे घ्या',
    viewPrivacy: 'गोपनीयता धोरण पहा',
    deleteData: 'माझा डेटा हटवा',
    dpdpaNote: 'DPDPA 2023 अंतर्गत तुम्हाला तुमचा डेटा हटवण्याचा आणि संमती मागे घेण्याचा अधिकार आहे',
    withdrawConfirm: 'तुम्हाला खरोखर तुमची संमती मागे घ्यायची आहे का? सर्व स्थानिक डेटा हटवला जाईल.',
    withdrawDone: 'संमती मागे घेतली. डेटा हटवला.',
    profileSaved: 'प्रोफाइल सेव्ह झाले ✅',
    profileSaveFailed: 'सेव्ह करण्यात अयशस्वी',
    // Dashboard
    chatHistory: 'चॅट इतिहास',
    healthStats: 'आरोग्य आकडेवारी',
    quickActions: 'जलद कार्ये',
    totalSessions: 'एकूण सत्रे',
    totalMessages: 'एकूण संदेश',
    lastSession: 'शेवटचे सत्र',
    mildSessions: 'सौम्य',
    moderateSessions: 'मध्यम',
    emergencySessions: 'आणीबाणी',
    noSessions: 'अद्याप कोणताही चॅट इतिहास नाही. तुमचे पहिले संभाषण सुरू करा!',
    newChat: 'नवीन चॅट सुरू करा',
    continueChat: 'सुरू ठेवा',
    viewChat: 'वाचा',
    downloadReport: 'अहवाल डाउनलोड करा',
    downloaded: 'डाउनलोड झाले',
    deleteChat: 'हटवा',
    messages: 'संदेश',
    today: 'आज',
    yesterday: 'काल',
    daysAgo: 'दिवसांपूर्वी',
    clearAllHistory: 'सर्व इतिहास हटवा',
    clearAllConfirm: 'तुम्हाला सर्व चॅट इतिहास हटवायचा आहे का?',
    sessionDeleted: 'चॅट हटवली',
    allCleared: 'सर्व इतिहास हटवला',
  },
  en: {
    // Tabs
    profileTab: 'Profile',
    dashboardTab: 'Dashboard',
    // Profile
    profile: 'Profile',
    guest: 'Guest Mode',
    authenticated: 'Logged In',
    edit: 'Edit',
    save: 'Save',
    name: 'Full Name',
    namePlaceholder: 'Your name',
    age: 'Age',
    gender: 'Gender',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    genderPreferNot: 'Prefer not to say',
    state: 'State',
    statePlaceholder: 'Select',
    district: 'District',
    districtPlaceholder: 'District',
    language: 'Language',
    income: 'Annual Income',
    email: 'Email',
    logout: 'Sign Out',
    loginFirst: 'Sign in to edit your profile',
    signInBtn: 'Sign In',
    schemeNote: 'Income and state info is used for government scheme eligibility matching',
    dataPrivacy: 'Data & Privacy',
    consentGiven: 'Consent Given',
    consentOn: 'Consent Date',
    withdrawConsent: 'Withdraw Consent',
    viewPrivacy: 'View Privacy Policy',
    deleteData: 'Delete My Data',
    dpdpaNote: 'Under DPDPA 2023, you have the right to delete your data and withdraw consent at any time',
    withdrawConfirm: 'Are you sure you want to withdraw consent? All local data will be deleted.',
    withdrawDone: 'Consent withdrawn. Local data cleared.',
    profileSaved: 'Profile saved ✅',
    profileSaveFailed: 'Failed to save profile',
    // Dashboard
    chatHistory: 'Chat History',
    healthStats: 'Health Statistics',
    quickActions: 'Quick Actions',
    totalSessions: 'Total Sessions',
    totalMessages: 'Total Messages',
    lastSession: 'Last Session',
    mildSessions: 'Mild',
    moderateSessions: 'Moderate',
    emergencySessions: 'Emergency',
    noSessions: 'No chat history yet. Start your first conversation!',
    newChat: 'Start New Chat',
    continueChat: 'Continue',
    viewChat: 'Read',
    downloadReport: 'Download Report',
    downloaded: 'Downloaded',
    deleteChat: 'Delete',
    messages: 'messages',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    clearAllHistory: 'Clear All History',
    clearAllConfirm: 'Are you sure you want to clear all chat history?',
    sessionDeleted: 'Chat deleted',
    allCleared: 'All history cleared',
  },
}


export default function ProfilePage() {
  const navigate = useNavigate()
  const { language, changeLanguage: setAppLanguage } = useLanguage()
  const text = translations[language] || translations.en

  const [activeTab, setActiveTab] = useState('profile')
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

      // Sync language preference to context (updates entire app)
      setAppLanguage(profile.preferred_lang)

      // Also save patient details to localStorage for health card
      if (profile.full_name) localStorage.setItem('mediguide_patient_name', profile.full_name)
      if (profile.age) localStorage.setItem('mediguide_patient_age', String(profile.age))
      if (profile.gender) localStorage.setItem('mediguide_patient_gender', profile.gender)
      if (profile.state) localStorage.setItem('mediguide_patient_state', profile.state)
      localStorage.setItem('mediguide_language', profile.preferred_lang)

      toast.success(text.profileSaved)
      setIsEditing(false)
    } catch (err) {
      toast.error(text.profileSaveFailed)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    if (isAuthenticated) {
      await signOut()
    }
    // Clear ALL user data so consent + onboarding re-appear on next login
    localStorage.removeItem('mediguide_guest')
    localStorage.removeItem('mediguide_location')
    localStorage.removeItem('mediguide_patient_name')
    localStorage.removeItem('mediguide_patient_age')
    localStorage.removeItem('mediguide_patient_gender')
    localStorage.removeItem('mediguide_patient_state')
    localStorage.removeItem('mediguide_profile_complete')
    // Force full page reload to reset React state
    window.location.href = '/login'
  }

  /** DPDPA: Withdraw consent and redirect to login */
  const handleWithdrawConsent = () => {
    if (!window.confirm(text.withdrawConfirm)) return

    revokeConsent()
    if (isAuthenticated) {
      signOut()
    }
    toast.success(text.withdrawDone)
    // Full page reload to reset ALL React state (consent, profile, etc.)
    setTimeout(() => { window.location.href = '/login' }, 800)
  }

  const consentInfo = getConsentInfo()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <FiLoader className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20 space-y-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary-fixed/40 flex items-center justify-center">
          <FiUser className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold font-display text-on-surface">{text.profile}</h1>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isAuthenticated
            ? 'bg-tertiary/10 text-tertiary'
            : 'bg-moderate/10 text-moderate-dark'
        }`}>
          <FiShield className="w-3 h-3" />
          {isAuthenticated ? text.authenticated : text.guest}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-clinical overflow-hidden bg-surface-container">
        {['profile', 'dashboard'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab
                ? 'bg-primary-container text-white shadow-clinical'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {tab === 'profile' ? <FiUser className="w-3.5 h-3.5" /> : <FiBarChart2 className="w-3.5 h-3.5" />}
            {tab === 'profile' ? text.profileTab : text.dashboardTab}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ─────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-3 animate-fade-in">
          {/* Not authenticated message */}
          {!isAuthenticated && (
            <div className="clinical-card p-4 text-center text-sm text-on-surface-variant space-y-2">
              <p>{text.loginFirst}</p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary text-xs px-4 py-2"
              >
                {text.signInBtn}
              </button>
            </div>
          )}

          {/* Email (read-only) */}
          {profile.email && (
            <div className="clinical-card p-4 flex items-center gap-3">
              <FiUser className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-clinical-meta">{text.email}</p>
                <p className="text-sm text-on-surface font-medium">{profile.email}</p>
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
                    className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary-container transition-colors"
                  >
                    <FiEdit2 className="w-3 h-3" /> {text.edit}
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-xs text-tertiary font-medium hover:text-tertiary-container transition-colors"
                  >
                    {saving ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiCheck className="w-3 h-3" />}
                    {text.save}
                  </button>
                )}
              </div>

              {/* Name */}
              <ProfileField label={text.name}>
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  disabled={!isEditing}
                  placeholder={text.namePlaceholder}
                  className="profile-input"
                />
              </ProfileField>

              {/* Age + Gender Row */}
              <div className="grid grid-cols-2 gap-3">
                <ProfileField label={text.age}>
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

                <ProfileField label={text.gender}>
                  <select
                    value={profile.gender || 'prefer_not_to_say'}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    disabled={!isEditing}
                    className="profile-input"
                  >
                    <option value="male">{text.genderMale}</option>
                    <option value="female">{text.genderFemale}</option>
                    <option value="other">{text.genderOther}</option>
                    <option value="prefer_not_to_say">{text.genderPreferNot}</option>
                  </select>
                </ProfileField>
              </div>

              {/* State + District Row */}
              <div className="grid grid-cols-2 gap-3">
                <ProfileField label={text.state}>
                  <select
                    value={profile.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    disabled={!isEditing}
                    className="profile-input"
                  >
                    <option value="">{text.statePlaceholder}</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </ProfileField>

                <ProfileField label={text.district}>
                  <input
                    type="text"
                    value={profile.district || ''}
                    onChange={(e) => handleChange('district', e.target.value)}
                    disabled={!isEditing}
                    placeholder={text.districtPlaceholder}
                    className="profile-input"
                  />
                </ProfileField>
              </div>

              {/* Language */}
              <ProfileField label={text.language}>
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
                      className={`flex-1 py-2 rounded-clinical text-xs font-medium transition-all ${
                        profile.preferred_lang === lang.code
                          ? 'bg-primary-container text-white'
                          : 'bg-surface-container text-on-surface-variant'
                      } ${isEditing ? 'hover:bg-surface-container-high cursor-pointer' : 'cursor-default'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </ProfileField>

              {/* Annual Income */}
              <ProfileField label={text.income}>
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
              <p className="text-[10px] text-outline text-center px-4 leading-relaxed">
                💡 {text.schemeNote}
              </p>
            </>
          )}

          {/* Language (guest mode — interactive selector) */}
          {!isAuthenticated && (
            <div className="clinical-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FiGlobe className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-xs text-on-surface-variant">{text.language}</p>
              </div>
              <div className="flex gap-2">
                {[
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'mr', label: 'मराठी' },
                  { code: 'en', label: 'English' },
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setAppLanguage(lang.code)
                      localStorage.setItem('mediguide_language', lang.code)
                      toast.success(lang.label)
                    }}
                    className={`flex-1 py-2 rounded-clinical text-xs font-medium transition-all ${
                      language === lang.code
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── DPDPA Data Rights Section ─────────────────────── */}
          <div className="clinical-card rounded-clinical p-4 space-y-4">
            <div className="flex items-center gap-2">
              <FiShield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold font-display text-on-surface">{text.dataPrivacy}</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/8 text-[9px] font-semibold text-primary">
                DPDPA 2023
              </span>
            </div>

            {/* Consent Status */}
            {consentInfo.given && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-clinical bg-tertiary/8">
                <FiCheck className="w-3.5 h-3.5 text-tertiary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-tertiary font-semibold">{text.consentGiven}</p>
                  {consentInfo.timestamp && (
                    <p className="text-[9px] text-tertiary/60">
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
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-clinical bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all text-xs"
            >
              <FiFileText className="w-3.5 h-3.5 text-primary" />
              {text.viewPrivacy}
            </button>

            {/* Withdraw Consent */}
            <button
              onClick={handleWithdrawConsent}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-clinical bg-error/5 hover:bg-error/10 text-error/70 hover:text-error transition-all text-xs"
            >
              <FiAlertTriangle className="w-3.5 h-3.5" />
              {text.withdrawConsent}
            </button>

            <p className="text-[9px] text-outline text-center leading-relaxed px-2">
              🔒 {text.dpdpaNote}
            </p>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-clinical bg-surface-container text-on-surface-variant hover:text-error hover:bg-error/8 transition-all text-sm"
          >
            <FiLogOut className="w-4 h-4" />
            {text.logout}
          </button>
        </div>
      )}

      {/* ── DASHBOARD TAB ───────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <DashboardPanel language={language} text={text} navigate={navigate} />
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   Dashboard Panel Component
   ═══════════════════════════════════════════════════════════════ */

function DashboardPanel({ language, text, navigate }) {
  const [sessions, setSessions] = useState([])
  const [downloadingId, setDownloadingId] = useState(null)

  // Load sessions on mount
  useEffect(() => {
    setSessions(getAllSessions())
  }, [])

  // Compute health statistics
  const stats = useMemo(() => {
    const totalMessages = sessions.reduce((sum, s) => sum + (s.messageCount || s.messages?.length || 0), 0)
    const mild = sessions.filter(s => s.urgency === 'mild').length
    const moderate = sessions.filter(s => s.urgency === 'moderate').length
    const emergency = sessions.filter(s => s.urgency === 'emergency').length
    const lastDate = sessions.length > 0 ? sessions[0].timestamp : null

    return { totalMessages, mild, moderate, emergency, lastDate }
  }, [sessions])

  /** Format relative date */
  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const now = new Date()
    const date = new Date(timestamp)
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return text.today
    if (diffDays === 1) return text.yesterday
    if (diffDays < 30) return `${diffDays} ${text.daysAgo}`
    return date.toLocaleDateString(
      language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN',
      { year: 'numeric', month: 'short', day: 'numeric' }
    )
  }

  /** Get urgency badge config */
  const getUrgencyBadge = (urgency) => {
    if (urgency === 'emergency') return { bg: 'bg-error/10', text: 'text-error', label: text.emergencySessions, icon: '🚨' }
    if (urgency === 'moderate') return { bg: 'bg-moderate/10', text: 'text-moderate-dark', label: text.moderateSessions, icon: '⚠️' }
    if (urgency === 'mild') return { bg: 'bg-tertiary/10', text: 'text-tertiary', label: text.mildSessions, icon: '✅' }
    return { bg: 'bg-surface-container', text: 'text-on-surface-variant', label: '—', icon: '💬' }
  }

  /** Delete a single session */
  const handleDelete = (sessionId) => {
    deleteSession(sessionId)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    toast.success(text.sessionDeleted)
  }

  /** Clear all history */
  const handleClearAll = () => {
    if (!window.confirm(text.clearAllConfirm)) return
    localStorage.removeItem('mediguide_chat_sessions')
    setSessions([])
    toast.success(text.allCleared)
  }

  /** Download report for a session */
  const handleDownloadReport = async (session) => {
    if (downloadingId) return
    setDownloadingId(session.id)
    try {
      await generateHealthCard({
        patientName: localStorage.getItem('mediguide_patient_name') || 'Patient',
        age: localStorage.getItem('mediguide_patient_age') || '',
        gender: localStorage.getItem('mediguide_patient_gender') || '',
        language,
        urgency: session.urgency,
        urgencyData: session.urgencyData,
        messages: session.messages,
        summary: session.summary,
      })
      // Mark as downloaded in storage
      const updated = sessions.map(s =>
        s.id === session.id ? { ...s, downloaded: true } : s
      )
      setSessions(updated)
      localStorage.setItem('mediguide_chat_sessions', JSON.stringify(updated))
      toast.success(text.downloaded + ' ✅')
    } catch (err) {
      console.error('Report download failed:', err)
      toast.error('Failed to download report')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Health Statistics ─────────────────────────────── */}
      <div className="clinical-card rounded-clinical p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold font-display text-on-surface">{text.healthStats}</h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={<FiMessageCircle className="w-4 h-4" />}
            value={sessions.length}
            label={text.totalSessions}
            color="text-primary"
            bg="bg-primary-fixed/30"
          />
          <StatCard
            icon={<FiActivity className="w-4 h-4" />}
            value={stats.totalMessages}
            label={text.totalMessages}
            color="text-tertiary"
            bg="bg-tertiary/8"
          />
          <StatCard
            icon={<FiClock className="w-4 h-4" />}
            value={stats.lastDate ? formatDate(stats.lastDate) : '—'}
            label={text.lastSession}
            color="text-on-surface-variant"
            bg="bg-surface-container-low"
            isText
          />
        </div>

        {/* Urgency Distribution */}
        {sessions.length > 0 && (
          <div className="flex gap-2 pt-1">
            {[
              { count: stats.mild, label: text.mildSessions, color: 'bg-tertiary/15 text-tertiary' },
              { count: stats.moderate, label: text.moderateSessions, color: 'bg-moderate/15 text-moderate-dark' },
              { count: stats.emergency, label: text.emergencySessions, color: 'bg-error/10 text-error' },
            ].map(item => (
              <div key={item.label} className={`flex-1 rounded-clinical py-1.5 text-center ${item.color}`}>
                <p className="text-sm font-bold">{item.count}</p>
                <p className="text-[9px] font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <div className="clinical-card rounded-clinical p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FiHeart className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold font-display text-on-surface">{text.quickActions}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-3 py-2.5 rounded-clinical bg-primary-fixed/30 hover:bg-primary-fixed/50 text-primary text-xs font-medium transition-all"
          >
            <FiPlus className="w-3.5 h-3.5" />
            {text.newChat}
          </button>
          <button
            onClick={() => navigate('/privacy')}
            className="flex items-center gap-2 px-3 py-2.5 rounded-clinical bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-medium transition-all"
          >
            <FiShield className="w-3.5 h-3.5" />
            {text.viewPrivacy}
          </button>
        </div>
      </div>

      {/* ── Chat History ─────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold font-display text-on-surface">{text.chatHistory}</h2>
            {sessions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary-fixed/30 text-[9px] font-bold text-primary">
                {sessions.length}
              </span>
            )}
          </div>
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] text-error/50 hover:text-error transition-colors font-medium"
            >
              {text.clearAllHistory}
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="clinical-card p-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-clinical-xl bg-primary-fixed/20 flex items-center justify-center">
              <FiMessageCircle className="w-6 h-6 text-primary/40" />
            </div>
            <p className="text-xs text-on-surface-variant">{text.noSessions}</p>
            <button
              onClick={() => navigate('/chat')}
              className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
            >
              <FiPlus className="w-3 h-3" />
              {text.newChat}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const badge = getUrgencyBadge(session.urgency)
              const msgCount = session.messageCount || session.messages?.length || 0

              return (
                <div
                  key={session.id}
                  className="clinical-card rounded-clinical p-3 space-y-2 hover:shadow-clinical transition-shadow"
                >
                  {/* Session Header */}
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-clinical flex-shrink-0 flex items-center justify-center text-sm ${badge.bg}`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">
                        {session.preview || 'Chat session'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="text-[9px] text-outline">
                          {msgCount} {text.messages}
                        </span>
                        <span className="text-[9px] text-outline">
                          {formatDate(session.timestamp)}
                        </span>
                      </div>
                    </div>
                    {session.downloaded && (
                      <FiCheck className="w-3.5 h-3.5 text-tertiary flex-shrink-0 mt-1" title={text.downloaded} />
                    )}
                  </div>

                  {/* Session Actions */}
                  <div className="flex gap-1.5 pt-1 border-t border-outline-variant/15">
                    <button
                      onClick={() => navigate(`/chat?session=${session.id}`)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-clinical text-[10px] font-semibold bg-primary-fixed/25 text-primary hover:bg-primary-fixed/40 transition-all"
                    >
                      <FiChevronRight className="w-3 h-3" />
                      {session.isFinal ? text.viewChat : text.continueChat}
                    </button>

                    {session.isFinal && (
                      <button
                        onClick={() => handleDownloadReport(session)}
                        disabled={downloadingId === session.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-clinical text-[10px] font-semibold bg-tertiary/8 text-tertiary hover:bg-tertiary/15 transition-all disabled:opacity-50"
                      >
                        {downloadingId === session.id ? (
                          <FiLoader className="w-3 h-3 animate-spin" />
                        ) : (
                          <FiDownload className="w-3 h-3" />
                        )}
                        {session.downloaded ? text.downloaded : text.downloadReport}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(session.id)}
                      className="w-8 flex items-center justify-center py-1.5 rounded-clinical text-[10px] text-error/50 hover:text-error hover:bg-error/8 transition-all"
                      title={text.deleteChat}
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   Reusable Components
   ═══════════════════════════════════════════════════════════════ */

/** Stats card for the dashboard grid */
function StatCard({ icon, value, label, color, bg, isText }) {
  return (
    <div className={`rounded-clinical p-3 text-center ${bg}`}>
      <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
      <p className={`${isText ? 'text-[10px]' : 'text-lg'} font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-on-surface-variant mt-0.5">{label}</p>
    </div>
  )
}

/** Reusable profile field wrapper — Clinical Intelligence style. */
function ProfileField({ label, children }) {
  return (
    <div className="clinical-card p-3 space-y-1.5">
      <label className="text-clinical-meta">
        {label}
      </label>
      {children}
    </div>
  )
}
