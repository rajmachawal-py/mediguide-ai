/**
 * MediGuide AI — Health Card PDF Generator
 * Generates a professional, printable Health Card PDF from triage results.
 *
 * Approach: Renders a styled HTML card off-screen → html2canvas captures it
 * as a high-res image → jsPDF wraps it into a downloadable A5 PDF.
 * This ensures full Hindi/Marathi/Devanagari support since the browser
 * handles all font rendering natively.
 */

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// ── Urgency Config ───────────────────────────────────────────

const URGENCY_STYLES = {
  mild: {
    bg: '#dcfce7', border: '#16a34a', text: '#166534',
    emoji: '🟢', label: { hi: 'हल्का', mr: 'सौम्य', en: 'Mild' },
  },
  moderate: {
    bg: '#fef9c3', border: '#ca8a04', text: '#854d0e',
    emoji: '🟡', label: { hi: 'मध्यम', mr: 'मध्यम', en: 'Moderate' },
  },
  emergency: {
    bg: '#fee2e2', border: '#dc2626', text: '#991b1b',
    emoji: '🔴', label: { hi: 'आपातकालीन', mr: 'आणीबाणी', en: 'Emergency' },
  },
}

const LABELS = {
  title:       { hi: 'स्वास्थ्य कार्ड', mr: 'आरोग्य कार्ड', en: 'Health Card' },
  patient:     { hi: 'रोगी की जानकारी', mr: 'रुग्णाची माहिती', en: 'Patient Information' },
  name:        { hi: 'नाम', mr: 'नाव', en: 'Name' },
  age:         { hi: 'उम्र', mr: 'वय', en: 'Age' },
  gender:      { hi: 'लिंग', mr: 'लिंग', en: 'Gender' },
  date:        { hi: 'दिनांक', mr: 'दिनांक', en: 'Date' },
  urgency:     { hi: 'तात्कालिकता स्तर', mr: 'आपत्कालीन स्तर', en: 'Urgency Level' },
  symptoms:    { hi: 'लक्षण विवरण', mr: 'लक्षणे', en: 'Reported Symptoms' },
  assessment:  { hi: 'AI मूल्यांकन', mr: 'AI मूल्यांकन', en: 'AI Assessment' },
  specialty:   { hi: 'सुझाई गई विशेषता', mr: 'सुचवलेले विशेष', en: 'Suggested Specialty' },
  disclaimer:  {
    hi: '⚠️ यह AI-सहायित ट्राइएज है, चिकित्सा निदान नहीं। कृपया डॉक्टर से परामर्श करें।',
    mr: '⚠️ हे AI-सहाय्यित ट्रायएज आहे, वैद्यकीय निदान नाही. कृपया डॉक्टरांचा सल्ला घ्या.',
    en: '⚠️ This is AI-assisted triage, not a medical diagnosis. Please consult a doctor.',
  },
  download:    { hi: 'डाउनलोड', mr: 'डाउनलोड', en: 'Download' },
}

// ── Helpers ───────────────────────────────────────────────────

function L(key, lang) {
  return LABELS[key]?.[lang] || LABELS[key]?.en || key
}

function extractUserSymptoms(messages) {
  return messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
}

function formatSummary(summary) {
  if (!summary) return ''
  if (typeof summary === 'string') return summary

  const parts = []
  if (summary.chief_complaint) parts.push(`Chief Complaint: ${summary.chief_complaint}`)
  if (summary.duration)        parts.push(`Duration: ${summary.duration}`)
  if (summary.severity)        parts.push(`Severity: ${summary.severity}`)
  if (summary.associated_symptoms?.length) {
    parts.push(`Associated Symptoms: ${summary.associated_symptoms.join(', ')}`)
  }
  if (summary.relevant_history) parts.push(`Relevant History: ${summary.relevant_history}`)
  if (summary.full_summary)     parts.push(`\n${summary.full_summary}`)
  return parts.join('\n')
}

function formatDateTime(lang) {
  const now = new Date()
  try {
    const locale = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN'
    return now.toLocaleString(locale, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return now.toLocaleString('en-IN')
  }
}

// ── Build HTML Card ──────────────────────────────────────────

function buildCardHTML({
  patientName, age, gender, language, urgency, urgencyData, messages, summary,
}) {
  const lang = language || 'en'
  const urg = URGENCY_STYLES[urgency] || URGENCY_STYLES.mild
  const symptoms = extractUserSymptoms(messages)
  const summaryText = formatSummary(summary)
  const specialty = urgencyData?.recommend_specialty || summary?.recommend_specialty || '—'
  const dateStr = formatDateTime(lang)

  return `
    <div id="mediguide-health-card" style="
      width: 560px;
      font-family: 'Inter', 'Noto Sans Devanagari', 'Segoe UI', system-ui, sans-serif;
      background: #ffffff;
      color: #1e293b;
      padding: 0;
      border: 2px solid #1a6ff5;
      border-radius: 16px;
      overflow: hidden;
    ">
      <!-- Header Bar -->
      <div style="
        background: linear-gradient(135deg, #1a6ff5, #1259e1, #a21caf);
        color: white;
        padding: 20px 24px;
        text-align: center;
      ">
        <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
          🏥 MediGuide ${L('title', lang)}
        </div>
        <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">
          AI-Powered Healthcare Guidance
        </div>
      </div>

      <!-- Body -->
      <div style="padding: 20px 24px;">

        <!-- Patient Info -->
        <div style="
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
        ">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            ${L('patient', lang)}
          </div>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px;">
              <span style="font-size: 10px; color: #94a3b8;">${L('name', lang)}</span><br/>
              <span style="font-size: 14px; font-weight: 600;">${patientName || 'Patient'}</span>
            </div>
            <div>
              <span style="font-size: 10px; color: #94a3b8;">${L('age', lang)}</span><br/>
              <span style="font-size: 14px; font-weight: 600;">${age || '—'}</span>
            </div>
            <div>
              <span style="font-size: 10px; color: #94a3b8;">${L('gender', lang)}</span><br/>
              <span style="font-size: 14px; font-weight: 600;">${gender || '—'}</span>
            </div>
            <div>
              <span style="font-size: 10px; color: #94a3b8;">${L('date', lang)}</span><br/>
              <span style="font-size: 12px; font-weight: 600;">${dateStr}</span>
            </div>
          </div>
        </div>

        <!-- Urgency Badge -->
        <div style="
          background: ${urg.bg};
          border: 2px solid ${urg.border};
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <span style="font-size: 28px;">${urg.emoji}</span>
          <div>
            <div style="font-size: 10px; font-weight: 700; color: ${urg.text}; text-transform: uppercase; letter-spacing: 1px;">
              ${L('urgency', lang)}
            </div>
            <div style="font-size: 18px; font-weight: 800; color: ${urg.text};">
              ${urg.label[lang] || urg.label.en}
            </div>
          </div>
        </div>

        <!-- Symptoms -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            ${L('symptoms', lang)}
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; color: #334155;">
            ${symptoms.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        <!-- AI Assessment -->
        ${summaryText ? `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            ${L('assessment', lang)}
          </div>
          <div style="font-size: 12px; line-height: 1.7; color: #334155; white-space: pre-wrap;">
            ${summaryText}
          </div>
        </div>
        ` : ''}

        <!-- Suggested Specialty -->
        <div style="
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <span style="font-size: 18px;">🩺</span>
          <div>
            <div style="font-size: 10px; color: #3b82f6; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
              ${L('specialty', lang)}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #1e40af; text-transform: capitalize;">
              ${specialty}
            </div>
          </div>
        </div>

        <!-- Disclaimer -->
        <div style="
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 10px;
          line-height: 1.5;
          color: #92400e;
        ">
          ${L('disclaimer', lang)}
        </div>
      </div>

      <!-- Footer -->
      <div style="
        background: #f1f5f9;
        border-top: 1px solid #e2e8f0;
        padding: 10px 24px;
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
      ">
        Generated by MediGuide AI • ${dateStr}
      </div>
    </div>
  `
}

// ── Main Export ───────────────────────────────────────────────

/**
 * Generate and download a PDF Health Card.
 *
 * @param {Object} params
 * @param {string} params.patientName
 * @param {string} params.age
 * @param {string} params.gender
 * @param {string} params.language      - "hi" | "mr" | "en"
 * @param {string} params.urgency       - "mild" | "moderate" | "emergency"
 * @param {Object} params.urgencyData   - Full triage response data
 * @param {Array}  params.messages      - Chat messages array
 * @param {Object} params.summary       - Doctor summary object
 */
export async function generateHealthCard(params) {
  // 1. Create off-screen container
  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed; top:-9999px; left:-9999px; z-index:-1; pointer-events:none;'
  container.innerHTML = buildCardHTML(params)
  document.body.appendChild(container)

  const cardEl = container.querySelector('#mediguide-health-card')

  try {
    // 2. Wait for fonts to load
    await document.fonts.ready

    // 3. Render to canvas at 2x resolution for crisp output
    const canvas = await html2canvas(cardEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    // 4. Convert to PDF (A5 portrait: 148 × 210 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // Fit card image to A5 with margins
    const margin = 6
    const imgWidth = pdfWidth - margin * 2
    const imgHeight = (canvas.height / canvas.width) * imgWidth

    // If card is taller than page, scale down to fit
    const usedHeight = Math.min(imgHeight, pdfHeight - margin * 2)
    const usedWidth = (usedHeight / imgHeight) * imgWidth

    const x = (pdfWidth - usedWidth) / 2
    const y = margin

    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', x, y, usedWidth, usedHeight)

    // 5. Download
    const timestamp = new Date().toISOString().slice(0, 10)
    pdf.save(`MediGuide_HealthCard_${timestamp}.pdf`)

    return true
  } finally {
    // Cleanup
    document.body.removeChild(container)
  }
}

export default generateHealthCard
