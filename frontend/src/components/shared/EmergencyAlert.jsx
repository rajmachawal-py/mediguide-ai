/**
 * MediGuide AI — EmergencyAlert
 * Full-screen emergency overlay with ambulance call and nearest hospital.
 * Clinical Intelligence design: white card with error accent.
 * Fully translated: Hindi, Marathi, English.
 */

import { FiPhone, FiNavigation, FiAlertTriangle } from 'react-icons/fi'

const T = {
  hi: {
    title: '🚨 आपातकाल पाया गया',
    description: 'आपके लक्षणों के आधार पर, यह एक आपातकालीन स्थिति है। कृपया तुरंत एम्बुलेंस कॉल करें।',
    ambulance: 'एम्बुलेंस कॉल करें — 108',
    emergency: 'आपातकाल — 112',
    nearestHospital: 'निकटतम आपातकालीन अस्पताल',
    directions: 'दिशा-निर्देश प्राप्त करें',
    dismiss: 'मैं समझ गया — आगे बढ़ें',
  },
  mr: {
    title: '🚨 आणीबाणी आढळली',
    description: 'तुमच्या लक्षणांवरून, ही आणीबाणीची परिस्थिती आहे. कृपया ताबडतोब रुग्णवाहिका कॉल करा.',
    ambulance: 'रुग्णवाहिका कॉल करा — 108',
    emergency: 'आणीबाणी — 112',
    nearestHospital: 'जवळचे आणीबाणी रुग्णालय',
    directions: 'दिशा मिळवा',
    dismiss: 'मला समजले — पुढे जा',
  },
  en: {
    title: '🚨 Emergency Detected',
    description: 'Based on your symptoms, this appears to be an emergency. Please call an ambulance immediately.',
    ambulance: 'Call Ambulance — 108',
    emergency: 'Emergency — 112',
    nearestHospital: 'Nearest Emergency Hospital',
    directions: 'Get Directions',
    dismiss: 'I understand — continue',
  },
}

export default function EmergencyAlert({ hospital, onDismiss, language = 'en' }) {
  const text = T[language] || T.en

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center clinical-glass-overlay p-4 animate-fade-in">
      <div className="clinical-glass rounded-clinical-xl p-6 max-w-sm w-full text-center space-y-4 shadow-clinical-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center">
          <FiAlertTriangle className="w-8 h-8 text-error" />
        </div>

        <h2 className="text-xl font-bold font-display text-error">
          {text.title}
        </h2>

        <p className="text-sm text-on-surface-variant">
          {text.description}
        </p>

        {/* Ambulance Call Buttons */}
        <div className="space-y-2">
          <a
            href="tel:108"
            className="btn-emergency w-full flex items-center justify-center gap-2"
          >
            <FiPhone className="w-5 h-5" />
            {text.ambulance}
          </a>
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 bg-error/10 hover:bg-error/15 text-error font-semibold px-6 py-3 rounded-clinical transition-all"
          >
            <FiPhone className="w-4 h-4" />
            {text.emergency}
          </a>
        </div>

        {/* Nearest Hospital — NO distance shown */}
        {hospital && (
          <div className="clinical-card-flat p-4 text-left space-y-2">
            <p className="text-clinical-meta">{text.nearestHospital}</p>
            <p className="font-semibold text-on-surface">{hospital.name}</p>
            {hospital.google_maps_url && (
              <a
                href={hospital.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
              >
                <FiNavigation className="w-3 h-3" /> {text.directions}
              </a>
            )}
          </div>
        )}

        <button
          onClick={onDismiss}
          className="btn-ghost text-sm w-full"
        >
          {text.dismiss}
        </button>
      </div>
    </div>
  )
}
