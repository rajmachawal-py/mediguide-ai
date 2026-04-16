/**
 * MediGuide AI — SchemeRecommendation
 * Shows eligible government healthcare schemes after triage.
 * Appears when urgency is moderate/emergency and the user may need hospitalisation.
 *
 * Features:
 * - Auto-fetches eligible schemes from backend using patient profile
 * - Expandable cards with scheme details
 * - AI-powered plain-language explanation in user's language
 * - Direct links to scheme websites and helplines
 */

import { useState, useEffect, useCallback } from 'react'
import { getEligibleSchemes, explainScheme } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'
import {
  FiShield, FiChevronDown, FiChevronUp, FiExternalLink,
  FiPhone, FiInfo, FiLoader, FiAlertCircle, FiHeart,
} from 'react-icons/fi'

const TEXTS = {
  hi: {
    title: 'सरकारी स्वास्थ्य योजनाएं',
    subtitle: 'आपके लिए उपलब्ध योजनाएं',
    loading: 'योजनाएं खोज रहे हैं...',
    noSchemes: 'कोई पात्र योजना नहीं मिली।',
    benefit: 'लाभ',
    eligibility: 'पात्रता',
    howToApply: 'कैसे आवेदन करें',
    helpline: 'हेल्पलाइन',
    visitWebsite: 'वेबसाइट देखें',
    callHelpline: 'हेल्पलाइन पर कॉल करें',
    explain: 'सरल भाषा में समझें',
    explaining: 'समझा रहे हैं...',
    coverageUpTo: 'कवरेज: ₹',
    incomeLimit: 'आय सीमा: ₹',
    ageRange: 'आयु: ',
    icuNote: 'ICU में भर्ती होने पर ये योजनाएं मदद कर सकती हैं',
    error: 'योजनाएं लोड करने में त्रुटि',
  },
  mr: {
    title: 'सरकारी आरोग्य योजना',
    subtitle: 'तुमच्यासाठी उपलब्ध योजना',
    loading: 'योजना शोधत आहोत...',
    noSchemes: 'कोणतीही पात्र योजना सापडली नाही.',
    benefit: 'लाभ',
    eligibility: 'पात्रता',
    howToApply: 'अर्ज कसा करावा',
    helpline: 'हेल्पलाइन',
    visitWebsite: 'वेबसाइट पहा',
    callHelpline: 'हेल्पलाइनवर कॉल करा',
    explain: 'सोप्या भाषेत समजून घ्या',
    explaining: 'समजावत आहोत...',
    coverageUpTo: 'संरक्षण: ₹',
    incomeLimit: 'उत्पन्न मर्यादा: ₹',
    ageRange: 'वय: ',
    icuNote: 'ICU मध्ये दाखल झाल्यास या योजना मदत करू शकतात',
    error: 'योजना लोड करण्यात त्रुटी',
  },
  en: {
    title: 'Government Health Schemes',
    subtitle: 'Schemes you may be eligible for',
    loading: 'Finding eligible schemes...',
    noSchemes: 'No eligible schemes found.',
    benefit: 'Benefit',
    eligibility: 'Eligibility',
    howToApply: 'How to Apply',
    helpline: 'Helpline',
    visitWebsite: 'Visit Website',
    callHelpline: 'Call Helpline',
    explain: 'Explain in simple terms',
    explaining: 'Generating explanation...',
    coverageUpTo: 'Coverage: ₹',
    incomeLimit: 'Income limit: ₹',
    ageRange: 'Age: ',
    icuNote: 'These schemes can help cover costs if ICU admission is needed',
    error: 'Error loading schemes',
  },
}

export default function SchemeRecommendation({ urgency, specialty }) {
  const { language } = useLanguage()
  const t = TEXTS[language] || TEXTS.en

  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [explanations, setExplanations] = useState({}) // { schemeId: string }
  const [explaining, setExplaining] = useState(null)   // schemeId being explained

  // Fetch eligible schemes on mount
  useEffect(() => {
    fetchSchemes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSchemes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const age = localStorage.getItem('mediguide_patient_age')
      const gender = localStorage.getItem('mediguide_patient_gender')
      const state = localStorage.getItem('mediguide_patient_state')

      const result = await getEligibleSchemes({
        state: state || undefined,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
        condition: specialty || undefined,
      })

      setSchemes(result.schemes || [])
    } catch (err) {
      console.error('Scheme fetch error:', err)
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }, [specialty, t.error])

  const handleExplain = async (schemeId) => {
    if (explanations[schemeId]) return // already explained
    setExplaining(schemeId)
    try {
      const age = localStorage.getItem('mediguide_patient_age')
      const gender = localStorage.getItem('mediguide_patient_gender')
      const state = localStorage.getItem('mediguide_patient_state')

      const result = await explainScheme(schemeId, language, {
        state: state || 'Maharashtra',
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
      })

      const explanationText = result.explanations?.[0]?.explanation
        || result.general_advice
        || ''

      setExplanations(prev => ({ ...prev, [schemeId]: explanationText }))
    } catch (err) {
      console.error('Scheme explain error:', err)
    } finally {
      setExplaining(null)
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const formatAmount = (amount) => {
    if (!amount) return null
    return amount >= 100000
      ? `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)} लाख`
      : amount.toLocaleString('en-IN')
  }

  const getLocalizedName = (scheme) => {
    if (language === 'hi' && scheme.name_hi) return scheme.name_hi
    if (language === 'mr' && scheme.name_mr) return scheme.name_mr
    return scheme.name
  }

  const getLocalizedDesc = (scheme) => {
    if (language === 'hi' && scheme.description_hi) return scheme.description_hi
    if (language === 'mr' && scheme.description_mr) return scheme.description_mr
    return scheme.description
  }

  if (loading) {
    return (
      <div className="mx-4 my-2 p-4 rounded-xl bg-surface-800/50 border border-surface-700/30 animate-pulse">
        <div className="flex items-center gap-2 text-surface-400 text-xs">
          <FiLoader className="w-3.5 h-3.5 animate-spin" />
          {t.loading}
        </div>
      </div>
    )
  }

  if (error) return null // silently fail — schemes are supplementary
  if (schemes.length === 0) return null // no eligible schemes

  return (
    <div className="mx-0 my-3 animate-slide-up">
      {/* Section Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-t-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.08) 100%)',
          borderBottom: '1px solid rgba(16,185,129,0.15)',
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <FiShield className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{t.title}</h3>
          <p className="text-[10px] text-surface-400">{t.icuNote}</p>
        </div>
      </div>

      {/* Scheme Cards */}
      <div className="space-y-0 rounded-b-xl overflow-hidden border border-surface-700/20 border-t-0">
        {schemes.map((scheme, index) => {
          const isExpanded = expandedId === scheme.id
          const localName = getLocalizedName(scheme)
          const localDesc = getLocalizedDesc(scheme)

          return (
            <div
              key={scheme.id}
              className={`${index < schemes.length - 1 ? 'border-b border-surface-700/20' : ''}`}
              style={{ background: 'rgba(15,23,42,0.6)' }}
            >
              {/* Card Header — always visible */}
              <button
                onClick={() => toggleExpand(scheme.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-800/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <FiHeart className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{localName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {scheme.benefit_amount && (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {t.coverageUpTo}{formatAmount(scheme.benefit_amount)}
                      </span>
                    )}
                    {scheme.eligibility_states && (
                      <span className="text-[10px] text-surface-500">
                        {scheme.eligibility_states.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded
                  ? <FiChevronUp className="w-4 h-4 text-surface-400 flex-shrink-0" />
                  : <FiChevronDown className="w-4 h-4 text-surface-400 flex-shrink-0" />
                }
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in">
                  {/* Description */}
                  <p className="text-xs text-surface-300 leading-relaxed pl-12">
                    {localDesc}
                  </p>

                  {/* Quick Info Pills */}
                  <div className="flex flex-wrap gap-1.5 pl-12">
                    {scheme.benefit_amount && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                        💰 {t.coverageUpTo}{formatAmount(scheme.benefit_amount)}
                      </span>
                    )}
                    {scheme.max_annual_income && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium border border-blue-500/20">
                        {t.incomeLimit}{formatAmount(scheme.max_annual_income)}
                      </span>
                    )}
                    {(scheme.min_age != null || scheme.max_age != null) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-medium border border-purple-500/20">
                        {t.ageRange}{scheme.min_age || 0}–{scheme.max_age || 120}
                      </span>
                    )}
                  </div>

                  {/* AI Explanation */}
                  {explanations[scheme.id] && (
                    <div className="ml-12 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                      <p className="text-xs text-surface-200 leading-relaxed">
                        {explanations[scheme.id]}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pl-12">
                    {/* AI Explain Button */}
                    {!explanations[scheme.id] && (
                      <button
                        onClick={() => handleExplain(scheme.id)}
                        disabled={explaining === scheme.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {explaining === scheme.id ? (
                          <>
                            <FiLoader className="w-3 h-3 animate-spin" />
                            {t.explaining}
                          </>
                        ) : (
                          <>
                            <FiInfo className="w-3 h-3" />
                            {t.explain}
                          </>
                        )}
                      </button>
                    )}

                    {/* Visit Website */}
                    {scheme.scheme_url && (
                      <a
                        href={scheme.scheme_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 transition-all"
                      >
                        <FiExternalLink className="w-3 h-3" />
                        {t.visitWebsite}
                      </a>
                    )}

                    {/* Call Helpline */}
                    {scheme.helpline && (
                      <a
                        href={`tel:${scheme.helpline.replace(/[^0-9+]/g, '')}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                      >
                        <FiPhone className="w-3 h-3" />
                        {t.callHelpline} ({scheme.helpline})
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
