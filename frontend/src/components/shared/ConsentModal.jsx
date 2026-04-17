/**
 * MediGuide AI — ConsentModal
 * DPDPA (Digital Personal Data Protection Act, 2023) compliant consent dialog.
 * Shown on first use before the user can access health features.
 * Stores consent in localStorage after acceptance.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiShield, FiCheck, FiFileText, FiLock, FiDatabase, FiAlertTriangle } from 'react-icons/fi'

const CONSENT_KEY = 'mediguide_consent_given'
const CONSENT_VERSION = '1.0' // bump this when privacy policy changes materially

/** Check if the user has already given consent (and it's for the current version). */
export function hasConsent() {
  return (
    localStorage.getItem(CONSENT_KEY) === 'true' &&
    localStorage.getItem('mediguide_consent_version') === CONSENT_VERSION
  )
}

/** Record that the user has given consent. */
export function giveConsent() {
  localStorage.setItem(CONSENT_KEY, 'true')
  localStorage.setItem('mediguide_consent_timestamp', new Date().toISOString())
  localStorage.setItem('mediguide_consent_version', CONSENT_VERSION)
}

/** Revoke consent and clear all personal data from localStorage (DPDPA right to withdraw). */
export function revokeConsent() {
  localStorage.removeItem(CONSENT_KEY)
  localStorage.removeItem('mediguide_consent_timestamp')
  localStorage.removeItem('mediguide_consent_version')
  localStorage.removeItem('mediguide_patient_name')
  localStorage.removeItem('mediguide_patient_age')
  localStorage.removeItem('mediguide_patient_gender')
  localStorage.removeItem('mediguide_patient_state')
  localStorage.removeItem('mediguide_profile_complete')
  localStorage.removeItem('mediguide_lang')
  localStorage.removeItem('mediguide_location')
  localStorage.removeItem('mediguide_guest')
}

/** Get consent info for display (timestamp, version). */
export function getConsentInfo() {
  return {
    given: hasConsent(),
    timestamp: localStorage.getItem('mediguide_consent_timestamp'),
    version: localStorage.getItem('mediguide_consent_version'),
  }
}

const TEXTS = {
  hi: {
    title: 'डेटा सहमति',
    subtitle: 'कृपया जारी रखने से पहले पढ़ें',
    intro: 'MediGuide AI आपके लक्षणों का आकलन करने के लिए AI का उपयोग करता है। यह भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (DPDPA) के अनुसार कार्य करता है।',
    points: [
      { icon: 'database', text: 'आपका स्वास्थ्य डेटा केवल ट्राइएज के लिए AI द्वारा प्रोसेस किया जाएगा।' },
      { icon: 'lock', text: 'डेटा एन्क्रिप्टेड रूप में सुरक्षित रखा जाता है।' },
      { icon: 'file', text: 'हम केवल न्यूनतम आवश्यक डेटा एकत्र करते हैं।' },
      { icon: 'alert', text: 'यह चिकित्सा निदान नहीं है। कृपया डॉक्टर से परामर्श करें।' },
    ],
    privacyLink: 'गोपनीयता नीति पढ़ें',
    checkboxLabel: 'मैंने गोपनीयता नीति पढ़ ली है और सभी शर्तों से सहमत हूँ',
    acceptBtn: 'मैं सहमत हूँ और जारी रखना चाहता/चाहती हूँ',
    declineBtn: 'अस्वीकार करें',
    declineMsg: 'सहमति के बिना आप MediGuide AI का उपयोग नहीं कर सकते।',
  },
  mr: {
    title: 'डेटा संमती',
    subtitle: 'कृपया पुढे जाण्यापूर्वी वाचा',
    intro: 'MediGuide AI तुमच्या लक्षणांचे मूल्यांकन करण्यासाठी AI वापरतो. हे भारतीय डिजिटल वैयक्तिक डेटा संरक्षण कायदा, 2023 (DPDPA) नुसार कार्य करते.',
    points: [
      { icon: 'database', text: 'तुमचा आरोग्य डेटा फक्त ट्रायएजसाठी AI द्वारे प्रक्रिया केला जाईल.' },
      { icon: 'lock', text: 'डेटा एन्क्रिप्टेड स्वरूपात सुरक्षित ठेवला जातो.' },
      { icon: 'file', text: 'आम्ही फक्त किमान आवश्यक डेटा गोळा करतो.' },
      { icon: 'alert', text: 'हे वैद्यकीय निदान नाही. कृपया डॉक्टरांचा सल्ला घ्या.' },
    ],
    privacyLink: 'गोपनीयता धोरण वाचा',
    checkboxLabel: 'मी गोपनीयता धोरण वाचले आहे आणि सर्व अटींशी सहमत आहे',
    acceptBtn: 'मी सहमत आहे आणि पुढे जाऊ इच्छितो/इच्छिते',
    declineBtn: 'नकार द्या',
    declineMsg: 'संमतीशिवाय तुम्ही MediGuide AI वापरू शकत नाही.',
  },
  en: {
    title: 'Data Consent',
    subtitle: 'Please read before continuing',
    intro: 'MediGuide AI uses artificial intelligence to assess your symptoms. It operates in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA) of India.',
    points: [
      { icon: 'database', text: 'Your health data will be processed by AI solely for triage assessment.' },
      { icon: 'lock', text: 'Data is stored securely with encryption and access controls.' },
      { icon: 'file', text: 'We collect only the minimum data necessary for the service.' },
      { icon: 'alert', text: 'This is NOT a medical diagnosis. Always consult a qualified doctor.' },
    ],
    privacyLink: 'Read Privacy Policy',
    checkboxLabel: 'I have read the Privacy Policy and agree to all terms',
    acceptBtn: 'I Agree & Continue',
    declineBtn: 'Decline',
    declineMsg: 'You cannot use MediGuide AI without providing consent.',
  },
}

const ICONS = {
  database: FiDatabase,
  lock: FiLock,
  file: FiFileText,
  alert: FiAlertTriangle,
}

export default function ConsentModal({ language = 'en', onAccept }) {
  const [declined, setDeclined] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const navigate = useNavigate()
  const lang = language in TEXTS ? language : 'en'
  const t = TEXTS[lang]

  const handleAccept = () => {
    if (!agreed) return
    giveConsent()
    onAccept?.()
  }

  const handleDecline = () => {
    setDeclined(true)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center clinical-glass-overlay p-4">
      <div className="clinical-glass max-w-md w-full overflow-hidden animate-bounce-in">
        {/* Header */}
        <div className="px-6 py-6 text-center bg-primary-fixed/30">
          <div className="w-14 h-14 mx-auto mb-3 rounded-clinical-lg bg-tertiary/10 flex items-center justify-center">
            <FiShield className="w-7 h-7 text-tertiary" />
          </div>
          <h2 className="text-lg font-bold font-display text-on-surface">{t.title}</h2>
          <p className="text-xs text-on-surface-variant mt-1">{t.subtitle}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {t.intro}
          </p>

          {/* Consent Points */}
          <div className="space-y-3">
            {t.points.map((point, i) => {
              const Icon = ICONS[point.icon] || FiCheck
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-clinical bg-primary-fixed/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{point.text}</p>
                </div>
              )
            })}
          </div>

          {/* Privacy Policy Link */}
          <button
            type="button"
            onClick={() => navigate('/privacy')}
            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary-container transition-colors cursor-pointer"
          >
            <FiFileText className="w-3 h-3" />
            {t.privacyLink}
          </button>

          {/* Consent Checkbox */}
          <label
            className="flex items-start gap-3 cursor-pointer group select-none"
            htmlFor="consent-agree-checkbox"
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                id="consent-agree-checkbox"
                type="checkbox"
                checked={agreed}
                onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked) setDeclined(false) }}
                className="sr-only peer"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                agreed
                  ? 'bg-primary border-primary shadow-sm'
                  : 'border-outline/40 bg-white group-hover:border-primary/50'
              }`}>
                {agreed && (
                  <FiCheck className="w-3 h-3 text-white animate-fade-in" />
                )}
              </div>
            </div>
            <span className={`text-xs leading-relaxed transition-colors duration-200 ${
              agreed ? 'text-on-surface font-medium' : 'text-on-surface-variant'
            }`}>
              {t.checkboxLabel}
            </span>
          </label>

          {/* Decline warning */}
          {declined && (
            <div className="bg-error/8 rounded-clinical p-3 animate-fade-in">
              <p className="text-xs text-error">{t.declineMsg}</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={handleAccept}
            disabled={!agreed}
            className={`w-full flex items-center justify-center gap-2 text-sm py-3 rounded-clinical-lg font-semibold transition-all duration-300 ${
              agreed
                ? 'btn-primary cursor-pointer'
                : 'bg-outline/15 text-on-surface-variant/50 cursor-not-allowed'
            }`}
          >
            <FiCheck className="w-4 h-4" />
            {t.acceptBtn}
          </button>
          <button
            onClick={handleDecline}
            className="btn-ghost w-full text-xs text-on-surface-variant"
          >
            {t.declineBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
