/**
 * MediGuide AI — Privacy Policy Page
 * Comprehensive privacy policy covering DPDPA, HIPAA, GDPR awareness.
 * Route: /privacy
 */

import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiShield } from 'react-icons/fi'

const SECTIONS = [
  {
    title: '1. Introduction',
    content: `MediGuide AI ("we", "our", "the app") is an AI-powered healthcare triage assistant designed for use in Indian hospitals. This Privacy Policy describes how we collect, use, store, and protect your personal and health-related data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA) of India.`,
  },
  {
    title: '2. Data We Collect',
    content: `We collect only the minimum data necessary to provide our services:
    
• **Health Symptoms** — Text or voice descriptions of your symptoms, shared voluntarily during triage conversations.
• **Images** — Optional photos of visible symptoms (e.g., skin conditions) that you choose to upload.
• **Location Data** — GPS coordinates (with your permission) to locate nearby hospitals.
• **Profile Information** — Name, age, gender, and language preference — used to personalize triage and generate Health Cards.
• **Authentication Data** — Email address and hashed password managed by Supabase Auth, or Google OAuth tokens.

We do NOT collect Aadhaar numbers, financial information, or any data beyond what is listed above.`,
  },
  {
    title: '3. How We Use Your Data',
    content: `Your data is used exclusively for:

• **AI Triage Assessment** — Your symptom text is sent to Google Gemini AI for urgency classification. The AI does NOT diagnose conditions or prescribe medications.
• **Voice Processing** — Voice recordings are sent to Sarvam AI for speech-to-text transcription only. Audio is not stored after transcription.
• **Health Card Generation** — Triage results are compiled into a downloadable PDF for sharing with your doctor.
• **Hospital Discovery** — Your location is used to find nearby hospitals via Google Maps API.
• **Caregiver Alerts** — If you link a caregiver, they receive push notifications about emergency triage results only.`,
  },
  {
    title: '4. Data Storage & Security',
    content: `• **Storage Location** — All user data is stored on Supabase servers. Database servers are configured with Row Level Security (RLS) policies ensuring users can only access their own data.
• **Encryption** — Data in transit is encrypted via TLS/HTTPS. Supabase provides encryption at rest for stored data.
• **Access Control** — API endpoints require JWT authentication. Service role keys are never exposed to the client.
• **Data Retention** — Chat history is retained for 90 days for continuity of care, after which it is automatically purged. You may request deletion at any time.
• **No Third-Party Sharing** — We do not sell, rent, or share your personal health data with third parties for marketing or any non-service purpose.`,
  },
  {
    title: '5. DPDPA Compliance (India)',
    content: `In compliance with the Digital Personal Data Protection Act, 2023:

• **Consent** — We obtain explicit consent before processing any personal health data via our consent modal.
• **Purpose Limitation** — Data is processed only for the purposes stated in this policy.
• **Data Minimization** — We collect only the minimum data necessary for service delivery.
• **Right to Access** — You may request a copy of all personal data we hold about you.
• **Right to Erasure** — You may request deletion of your data at any time by contacting us or through your profile settings.
• **Right to Correction** — You may update your profile information at any time.
• **Data Principal Rights** — As a Data Principal under DPDPA, you have the right to nominate another person to exercise your rights in case of incapacity.
• **Grievance Redressal** — For any privacy concerns, contact our Data Protection Officer (details below).`,
  },
  {
    title: '6. International Standards Awareness',
    content: `While MediGuide AI primarily operates under Indian law, we are aware of and align with international best practices:

• **HIPAA (USA)** — We follow HIPAA-aligned practices for health data security, including access controls, audit trails, and minimum necessary standards.
• **GDPR (EU)** — Our consent and data minimization practices are aligned with GDPR principles.
• **HL7 FHIR** — Health Card exports support HL7 FHIR (Fast Healthcare Interoperability Resources) format for interoperability with hospital systems.`,
  },
  {
    title: '7. Telemedicine Practice Guidelines',
    content: `MediGuide AI operates in compliance with the Telemedicine Practice Guidelines, 2020 (India):

• **No Diagnosis** — The AI assistant never provides medical diagnoses. It performs symptom triage only.
• **No Prescriptions** — The AI never prescribes medications or treatments.
• **Mandatory Disclaimer** — Every interaction displays: "This is not medical advice. Please consult a qualified doctor."
• **Doctor Referral** — The app always recommends consulting a qualified healthcare professional.`,
  },
  {
    title: '8. AI & Automated Decision-Making',
    content: `• The triage assessment is generated by Google Gemini AI and supplemented by rule-based safety checks.
• AI responses are NOT clinical decisions — they are guidance to help you understand urgency.
• Emergency keyword detection operates independently of AI to ensure critical cases are never missed.
• You have the right to not be subject to decisions based solely on automated processing that significantly affect you (DPDPA Section 11).`,
  },
  {
    title: '9. Children\'s Data',
    content: `• MediGuide AI may be used by parents/guardians to assess children's symptoms.
• We do not knowingly collect data from children under 18 without parental consent (DPDPA Section 9).
• A parent or guardian must provide consent and supervise usage for minors.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. Material changes will be communicated via in-app notification. Continued use of the app after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '11. Contact & Grievance Officer',
    content: `For privacy concerns, data access/deletion requests, or grievances:

• **Data Protection Officer**: MediGuide AI Team
• **Email**: privacy@mediguide-ai.in
• **Response Time**: Within 72 hours as required by DPDPA

Last Updated: April 15, 2026`,
  },
]

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-950 pb-12">
      {/* Header */}
      <div
        className="relative px-6 py-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(26,111,245,0.1), rgba(124,58,237,0.08))',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-6 w-9 h-9 rounded-xl bg-surface-800/80 flex items-center justify-center text-surface-300 hover:text-white hover:bg-surface-700 transition-all border border-surface-700/30"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
          <FiShield className="w-7 h-7 text-primary-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
        <p className="text-xs text-surface-400 mt-1">गोपनीयता नीति · गोपनीयता धोरण</p>
        <p className="text-[10px] text-surface-500 mt-2">
          MediGuide AI — Digital Personal Data Protection Act, 2023 Compliant
        </p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {SECTIONS.map((section, i) => (
          <div key={i} className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary-500/15 flex items-center justify-center text-[10px] font-bold text-primary-400">
                {i + 1}
              </div>
              {section.title.replace(/^\d+\.\s*/, '')}
            </h2>
            <div className="text-xs text-surface-300 leading-relaxed whitespace-pre-line">
              {section.content.split('**').map((part, j) =>
                j % 2 === 1
                  ? <strong key={j} className="text-surface-200">{part}</strong>
                  : <span key={j}>{part}</span>
              )}
            </div>
          </div>
        ))}

        {/* Compliance Badges */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {['DPDPA 2023', 'HIPAA Aligned', 'GDPR Aware', 'HL7 FHIR'].map(badge => (
            <div
              key={badge}
              className="px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-semibold text-primary-400"
            >
              ✓ {badge}
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-surface-500 pt-2">
          © 2026 MediGuide AI. All rights reserved.
        </p>
      </div>
    </div>
  )
}
