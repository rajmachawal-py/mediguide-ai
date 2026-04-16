/**
 * MediGuide AI — Profile Onboarding
 * Full-screen modal shown after signup when user hasn't filled required profile fields.
 * Cannot be dismissed — user MUST fill name, age, gender before using the app.
 */

import { useState } from 'react'
import { FiUser, FiLoader, FiArrowRight } from 'react-icons/fi'
import { useLanguage } from '../../contexts/LanguageContext'
import { updateProfile } from '../../services/api'
import toast from 'react-hot-toast'

const t = {
  hi: {
    title: 'अपनी जानकारी भरें',
    subtitle: 'बेहतर स्वास्थ्य सहायता के लिए ये जानकारी ज़रूरी है',
    name: 'पूरा नाम',
    namePlaceholder: 'आपका नाम',
    age: 'उम्र',
    agePlaceholder: 'जैसे 30',
    gender: 'लिंग',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    state: 'राज्य (वैकल्पिक)',
    continue: 'जारी रखें',
    required: 'कृपया सभी ज़रूरी जानकारी भरें',
  },
  mr: {
    title: 'तुमची माहिती भरा',
    subtitle: 'चांगल्या आरोग्य सहाय्यासाठी ही माहिती आवश्यक आहे',
    name: 'पूर्ण नाव',
    namePlaceholder: 'तुमचे नाव',
    age: 'वय',
    agePlaceholder: 'जसे 30',
    gender: 'लिंग',
    male: 'पुरुष',
    female: 'स्त्री',
    other: 'इतर',
    state: 'राज्य (पर्यायी)',
    continue: 'पुढे चला',
    required: 'कृपया सर्व आवश्यक माहिती भरा',
  },
  en: {
    title: 'Complete Your Profile',
    subtitle: 'This information helps us provide better health assistance',
    name: 'Full Name',
    namePlaceholder: 'Your name',
    age: 'Age',
    agePlaceholder: 'e.g. 30',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    state: 'State (optional)',
    continue: 'Continue',
    required: 'Please fill all required fields',
  },
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Ladakh', 'J&K',
]

export default function ProfileOnboarding({ onComplete }) {
  const { language } = useLanguage()
  const text = t[language] || t.en

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [state, setState] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim() || !age || !gender) {
      setError(text.required)
      return
    }

    setSaving(true)
    setError('')

    try {
      // Save to localStorage first (works for both guest and authenticated)
      localStorage.setItem('mediguide_patient_name', name.trim())
      localStorage.setItem('mediguide_patient_age', age)
      localStorage.setItem('mediguide_patient_gender', gender)
      if (state) localStorage.setItem('mediguide_patient_state', state)

      // If authenticated (not guest), also save to backend profile
      const isGuest = localStorage.getItem('mediguide_guest') === 'true'
      if (!isGuest) {
        try {
          await updateProfile({
            full_name: name.trim(),
            age: parseInt(age),
            gender,
            state: state || null,
            preferred_lang: language,
          })
        } catch (apiErr) {
          // Don't block — data is already in localStorage
          console.warn('Profile API save failed (data saved locally):', apiErr)
        }
      }

      toast.success(
        language === 'hi' ? '\u092a\u094d\u0930\u094b\u092b\u093c\u093e\u0907\u0932 \u0938\u0947\u0935 \u0939\u094b \u0917\u0908! \ud83c\udf89' :
        language === 'mr' ? '\u092a\u094d\u0930\u094b\u092b\u093e\u0907\u0932 \u0938\u0947\u0935\u094d\u0939 \u091d\u093e\u0932\u0947! \ud83c\udf89' :
        'Profile saved! \ud83c\udf89'
      )

      onComplete()
    } catch (err) {
      console.error('Profile save error:', err)
      setError(
        language === 'hi' ? '\u0938\u0947\u0935 \u0915\u0930\u0928\u0947 \u092e\u0947\u0902 \u0924\u094d\u0930\u0941\u091f\u093f\u0964 \u0915\u0943\u092a\u092f\u093e \u092b\u093f\u0930 \u0938\u0947 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902\u0964' :
        language === 'mr' ? '\u0938\u0947\u0935\u094d\u0939 \u0915\u0930\u0923\u094d\u092f\u093e\u0924 \u0924\u094d\u0930\u0941\u091f\u0940. \u0915\u0943\u092a\u092f\u093e \u092a\u0941\u0928\u094d\u0939\u093e \u092a\u094d\u0930\u092f\u0924\u094d\u0928 \u0915\u0930\u093e.' :
        'Failed to save. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-5">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(10,15,30,0.99) 100%)',
          border: '1px solid rgba(51, 65, 85, 0.4)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(26,111,245,0.15) 0%, rgba(124,58,237,0.1) 100%)',
            borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
          }}
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center">
            <FiUser className="w-7 h-7 text-primary-400" />
          </div>
          <h2 className="text-lg font-bold text-white">{text.title}</h2>
          <p className="text-xs text-surface-400 mt-1">{text.subtitle}</p>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold">
              {text.name} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder={text.namePlaceholder}
              autoFocus
              className="w-full bg-surface-800/80 text-white placeholder-surface-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 border border-surface-700/50 transition-all"
            />
          </div>

          {/* Age + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold">
                {text.age} <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => { setAge(e.target.value); setError('') }}
                placeholder={text.agePlaceholder}
                min="0"
                max="120"
                className="w-full bg-surface-800/80 text-white placeholder-surface-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 border border-surface-700/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold">
                {text.gender} <span className="text-red-400">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => { setGender(e.target.value); setError('') }}
                className="w-full bg-surface-800/80 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 border border-surface-700/50 transition-all"
              >
                <option value="">—</option>
                <option value="male">{text.male}</option>
                <option value="female">{text.female}</option>
                <option value="other">{text.other}</option>
              </select>
            </div>
          </div>

          {/* State (optional) */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold">
              {text.state}
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-surface-800/80 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 border border-surface-700/50 transition-all"
            >
              <option value="">—</option>
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 text-center animate-fade-in">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-3 disabled:opacity-50"
          >
            {saving ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FiArrowRight className="w-4 h-4" />
                {text.continue}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
