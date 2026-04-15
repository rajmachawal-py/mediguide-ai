/**
 * MediGuide AI — ConsentModal
 * DPDPA (Digital Personal Data Protection Act, 2023) compliant consent dialog.
 * Shown on first use before the user can access health features.
 * Stores consent in localStorage after acceptance.
 */

import { useState } from 'react'
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
  const lang = language in TEXTS ? language : 'en'
  const t = TEXTS[lang]

  const handleAccept = () => {
    giveConsent()
    onAccept?.()
  }

  const handleDecline = () => {
    setDeclined(true)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-card max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border border-surface-700/50 animate-bounce-in">
        {/* Header */}
        <div
          className="px-6 py-5 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(26,111,245,0.15), rgba(124,58,237,0.15))',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
            <FiShield className="w-7 h-7 text-primary-400" />
          </div>
          <h2 className="text-lg font-bold text-white">{t.title}</h2>
          <p className="text-xs text-surface-400 mt-1">{t.subtitle}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-surface-300 leading-relaxed">
            {t.intro}
          </p>

          {/* Consent Points */}
          <div className="space-y-3">
            {t.points.map((point, i) => {
              const Icon = ICONS[point.icon] || FiCheck
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-800/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary-400" />
                  </div>
                  <p className="text-xs text-surface-300 leading-relaxed">{point.text}</p>
                </div>
              )
            })}
          </div>

          {/* Privacy Policy Link */}
          <button
            type="button"
            onClick={() => window.open('/privacy', '_blank')}
            className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
          >
            <FiFileText className="w-3 h-3" />
            {t.privacyLink}
          </button>

          {/* Decline warning */}
          {declined && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-fade-in">
              <p className="text-xs text-red-400">{t.declineMsg}</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={handleAccept}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3"
          >
            <FiCheck className="w-4 h-4" />
            {t.acceptBtn}
          </button>
          <button
            onClick={handleDecline}
            className="btn-ghost w-full text-xs text-surface-500 hover:text-surface-300"
          >
            {t.declineBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
