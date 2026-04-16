/**
 * MediGuide AI — CaregiverDashboard
 * Real-time caregiver/patient management page.
 *
 * Two views based on user's links:
 * - As Patient:    manage linked caregivers, add new ones
 * - As Caregiver:  view patients' status, urgency history, alerts
 *
 * Real-time updates via Supabase Realtime on caregiver_alerts table.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiHeart, FiUserPlus, FiUsers, FiTrash2, FiLoader,
  FiBell, FiAlertTriangle, FiShield, FiClock, FiPhone,
} from 'react-icons/fi'
import {
  getCaregiverLinks,
  linkCaregiver,
  revokeCaregiver,
  getCaregiverAlerts,
} from '../services/api'
import { supabase, getSession } from '../services/supabase'
import { initPushNotifications } from '../services/firebase'
import { useLanguage } from '../contexts/LanguageContext'
import toast from 'react-hot-toast'

const RELATIONSHIPS = [
  { value: 'family',  label: { hi: 'परिवार',  en: 'Family' }},
  { value: 'spouse',  label: { hi: 'पत्नी/पति', en: 'Spouse' }},
  { value: 'parent',  label: { hi: 'माता/पिता', en: 'Parent' }},
  { value: 'child',   label: { hi: 'बच्चा',    en: 'Child' }},
  { value: 'friend',  label: { hi: 'मित्र',     en: 'Friend' }},
  { value: 'doctor',  label: { hi: 'डॉक्टर',   en: 'Doctor' }},
]

export default function CaregiverDashboard() {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [links, setLinks] = useState({ as_patient: [], as_caregiver: [] })
  const [alerts, setAlerts] = useState([])
  const [activeTab, setActiveTab] = useState('patient') // 'patient' | 'caregiver'

  // Add caregiver form
  const [showForm, setShowForm] = useState(false)
  const [formPhone, setFormPhone] = useState('')
  const [formName, setFormName] = useState('')
  const [formRelation, setFormRelation] = useState('family')
  const [formLoading, setFormLoading] = useState(false)

  // Load data
  useEffect(() => {
    const init = async () => {
      const session = await getSession()
      if (!session) {
        setLoading(false)
        return
      }
      setIsAuthenticated(true)

      try {
        const [linksData, alertsData] = await Promise.all([
          getCaregiverLinks(),
          getCaregiverAlerts(),
        ])
        setLinks(linksData)
        setAlerts(alertsData.alerts || [])

        // Auto-switch to caregiver tab if user has caregiver links
        if (linksData.as_caregiver?.length > 0 && linksData.as_patient?.length === 0) {
          setActiveTab('caregiver')
        }
      } catch (err) {
        console.error('Caregiver data load error:', err)
      } finally {
        setLoading(false)
      }

      // Initialize push notifications
      initPushNotifications().catch(console.error)
    }

    init()
  }, [])

  // Supabase Realtime subscription for new alerts
  useEffect(() => {
    if (!isAuthenticated) return

    const channel = supabase
      .channel('caregiver-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'caregiver_alerts',
        },
        (payload) => {
          const newAlert = payload.new
          setAlerts(prev => [newAlert, ...prev])

          // Show toast
          const emoji = newAlert.urgency === 'emergency' ? '🔴' :
                        newAlert.urgency === 'moderate' ? '🟡' : '🟢'
          toast(`${emoji} New caregiver alert: ${newAlert.urgency}`, { icon: '🏥' })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated])

  // Add caregiver
  const handleAddCaregiver = useCallback(async () => {
    const phone = formPhone.replace(/\s/g, '')
    if (phone.length < 10 || !formName.trim()) {
      toast.error(language === 'hi' ? 'सभी फ़ील्ड भरें' : 'Fill all fields')
      return
    }

    setFormLoading(true)
    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`
      await linkCaregiver(fullPhone, formName.trim(), formRelation)

      // Refresh links
      const data = await getCaregiverLinks()
      setLinks(data)

      // Reset form
      setShowForm(false)
      setFormPhone('')
      setFormName('')
      setFormRelation('family')

      toast.success(language === 'hi' ? 'केयरगिवर जोड़ा गया ✅' : 'Caregiver linked ✅')
    } catch (err) {
      toast.error(language === 'hi' ? 'जोड़ने में विफल' : 'Failed to link caregiver')
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }, [formPhone, formName, formRelation, language])

  // Revoke link
  const handleRevoke = useCallback(async (linkId) => {
    if (!confirm(language === 'hi' ? 'क्या आप वाकई हटाना चाहते हैं?' : 'Are you sure you want to remove this link?')) return

    try {
      await revokeCaregiver(linkId)
      const data = await getCaregiverLinks()
      setLinks(data)
      toast.success(language === 'hi' ? 'लिंक हटाया गया' : 'Link removed')
    } catch (err) {
      toast.error('Failed to remove link')
    }
  }, [language])

  const t = {
    hi: {
      title: 'केयरगिवर',
      myCaregiver: 'मेरे केयरगिवर',
      myPatients: 'मेरे मरीज़',
      addCaregiver: 'केयरगिवर जोड़ें',
      name: 'नाम',
      phone: 'फ़ोन',
      relation: 'रिश्ता',
      save: 'जोड़ें',
      cancel: 'रद्द करें',
      noLinks: 'कोई केयरगिवर नहीं जोड़ा',
      noAlerts: 'कोई अलर्ट नहीं',
      alerts: 'हाल के अलर्ट',
      loginRequired: 'केयरगिवर मोड के लिए लॉगिन करें',
    },
    mr: {
      title: 'केयरगिव्हर',
      myCaregiver: 'माझे केयरगिव्हर',
      myPatients: 'माझे रुग्ण',
      addCaregiver: 'केयरगिव्हर जोडा',
      name: 'नाव',
      phone: 'फोन',
      relation: 'नाते',
      save: 'जोडा',
      cancel: 'रद्द करा',
      noLinks: 'कोणीही केयरगिव्हर जोडलेला नाही',
      noAlerts: 'कोणतेही अलर्ट नाहीत',
      alerts: 'अलीकडील अलर्ट',
      loginRequired: 'केयरगिव्हर मोडसाठी साइन इन करा',
    },
    en: {
      title: 'Caregiver',
      myCaregiver: 'My Caregivers',
      myPatients: 'My Patients',
      addCaregiver: 'Add Caregiver',
      name: 'Name',
      phone: 'Phone',
      relation: 'Relationship',
      save: 'Link',
      cancel: 'Cancel',
      noLinks: 'No caregivers linked yet',
      noAlerts: 'No alerts yet',
      alerts: 'Recent Alerts',
      loginRequired: 'Sign in to use Caregiver mode',
    },
  }

  const text = t[language] || t.en

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <FiLoader className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="clinical-card p-8 space-y-4">
          <FiHeart className="w-12 h-12 text-error mx-auto" />
          <h2 className="text-lg font-bold font-display text-on-surface">{text.title}</h2>
          <p className="text-sm text-on-surface-variant">{text.loginRequired}</p>
          <button onClick={() => navigate('/login')} className="btn-primary text-sm">
            {language === 'hi' ? 'लॉगिन करें' : 'Sign In'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-20 space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-clinical bg-error/10 flex items-center justify-center">
          <FiHeart className="w-5 h-5 text-error" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-display text-on-surface">{text.title}</h1>
          <p className="text-clinical-meta">
            {links.as_patient.length + links.as_caregiver.length} {language === 'hi' ? 'लिंक' : 'links'}
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-surface-container rounded-clinical p-1">
        <button
          onClick={() => setActiveTab('patient')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-clinical text-xs font-semibold transition-all ${
            activeTab === 'patient'
              ? 'bg-primary-container text-white shadow-clinical'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <FiShield className="w-3.5 h-3.5" /> {text.myCaregiver}
        </button>
        <button
          onClick={() => setActiveTab('caregiver')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-clinical text-xs font-semibold transition-all ${
            activeTab === 'caregiver'
              ? 'bg-primary-container text-white shadow-clinical'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <FiUsers className="w-3.5 h-3.5" /> {text.myPatients}
        </button>
      </div>

      {/* ── Patient Tab: My Caregivers ────────────────────────── */}
      {activeTab === 'patient' && (
        <div className="space-y-3 animate-fade-in">
          {/* Add Caregiver Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full clinical-card p-4 flex items-center justify-center gap-2 text-sm text-primary font-medium hover:bg-primary-fixed/20 transition-all"
            >
              <FiUserPlus className="w-4 h-4" /> {text.addCaregiver}
            </button>
          )}

          {/* Add Caregiver Form */}
          {showForm && (
            <div className="clinical-card p-4 space-y-3 animate-slide-up">
              <h3 className="text-sm font-bold font-display text-on-surface flex items-center gap-2">
                <FiUserPlus className="w-4 h-4 text-primary" />
                {text.addCaregiver}
              </h3>

              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={text.name}
                className="clinical-input"
              />

              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 px-3 py-2.5 rounded-t-clinical bg-surface-container text-on-surface-variant text-sm">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                  placeholder={text.phone}
                  maxLength={12}
                  className="clinical-input flex-1"
                />
              </div>

              <select
                value={formRelation}
                onChange={(e) => setFormRelation(e.target.value)}
                className="clinical-input"
              >
                {RELATIONSHIPS.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label[language] || r.label.en}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 btn-ghost text-xs py-2.5"
                >
                  {text.cancel}
                </button>
                <button
                  onClick={handleAddCaregiver}
                  disabled={formLoading}
                  className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  {formLoading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiUserPlus className="w-3.5 h-3.5" />}
                  {text.save}
                </button>
              </div>
            </div>
          )}

          {/* Caregiver List */}
          {links.as_patient.length === 0 ? (
            <div className="clinical-card p-8 text-center text-sm text-on-surface-variant">
              <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-40" />
              {text.noLinks}
            </div>
          ) : (
            links.as_patient.map(link => (
              <CaregiverLinkCard
                key={link.id}
                link={link}
                language={language}
                onRevoke={() => handleRevoke(link.id)}
                role="patient"
              />
            ))
          )}
        </div>
      )}

      {/* ── Caregiver Tab: My Patients ────────────────────────── */}
      {activeTab === 'caregiver' && (
        <div className="space-y-3 animate-fade-in">
          {links.as_caregiver.length === 0 ? (
            <div className="clinical-card p-8 text-center text-sm text-on-surface-variant">
              <FiHeart className="w-8 h-8 mx-auto mb-2 opacity-40" />
              {language === 'hi'
                ? 'कोई मरीज़ नहीं जुड़ा — जब कोई आपको केयरगिवर के रूप में जोड़ेगा तो यहाँ दिखेगा'
                : 'No patients linked — they\'ll appear here when someone adds you as a caregiver'}
            </div>
          ) : (
            links.as_caregiver.map(link => (
              <CaregiverLinkCard
                key={link.id}
                link={link}
                language={language}
                onRevoke={() => handleRevoke(link.id)}
                role="caregiver"
              />
            ))
          )}
        </div>
      )}

      {/* ── Alert History ─────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold font-display text-on-surface flex items-center gap-2 px-1">
            <FiBell className="w-4 h-4 text-error" /> {text.alerts}
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {alerts.slice(0, 10).map(alert => (
              <AlertCard key={alert.id} alert={alert} language={language} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


/** Caregiver/Patient link card. */
function CaregiverLinkCard({ link, language, onRevoke, role }) {
  const displayName = role === 'patient'
    ? link.caregiver_name || link.caregiver_phone
    : link.patient_name || link.patient_id?.slice(0, 8)

  const relationDisplay = RELATIONSHIPS.find(r => r.value === link.relationship)
  const relationLabel = relationDisplay
    ? (relationDisplay.label[language] || relationDisplay.label.en)
    : link.relationship

  return (
    <div className="clinical-card p-4 space-y-2 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-fixed/40 flex items-center justify-center flex-shrink-0">
            <FiHeart className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{displayName}</p>
            <p className="text-clinical-meta">{relationLabel}</p>
          </div>
        </div>
        <button
          onClick={onRevoke}
          className="p-2 rounded-clinical text-outline hover:text-error hover:bg-error/8 transition-all"
          title={language === 'hi' ? 'हटाएं' : 'Remove'}
        >
          <FiTrash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {link.caregiver_phone && (
        <a
          href={`tel:${link.caregiver_phone}`}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-container font-medium"
        >
          <FiPhone className="w-3 h-3" /> {link.caregiver_phone}
        </a>
      )}
    </div>
  )
}


/** Single alert history card. */
function AlertCard({ alert, language }) {
  const urgencyEmoji = {
    emergency: '🔴',
    moderate: '🟡',
    mild: '🟢',
  }

  const urgencyClass = {
    emergency: 'urgency-emergency',
    moderate: 'urgency-moderate',
    mild: 'urgency-mild',
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return language === 'hi' ? 'अभी' : 'Just now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <div className={`clinical-card p-3 ${urgencyClass[alert.urgency] || ''}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm flex-shrink-0">{urgencyEmoji[alert.urgency] || 'ℹ️'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-on-surface font-medium capitalize">{alert.urgency}</p>
          {alert.summary && (
            <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2">{alert.summary}</p>
          )}
        </div>
        <span className="text-[10px] text-outline flex-shrink-0 flex items-center gap-1">
          <FiClock className="w-2.5 h-2.5" />
          {timeAgo(alert.created_at)}
        </span>
      </div>
    </div>
  )
}
