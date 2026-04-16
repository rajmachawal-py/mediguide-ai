/**
 * MediGuide AI — VoiceAutoModeOverlay
 * Full-screen overlay for hands-free voice triage mode.
 * Shows animated mic/speaker indicators and live transcript.
 */

import { createPortal } from 'react-dom'
import { FiMic, FiVolume2, FiLoader, FiX } from 'react-icons/fi'

const PHASE_CONFIG = {
  speaking: {
    icon: FiVolume2,
    color: '#005EB8',
    pulseColor: 'rgba(0, 94, 184, 0.25)',
    bgClass: 'bg-primary-container',
    label: { hi: 'AI बोल रहा है...', mr: 'AI बोलत आहे...', en: 'AI is speaking...' },
  },
  listening: {
    icon: FiMic,
    color: '#006F25',
    pulseColor: 'rgba(0, 111, 37, 0.25)',
    bgClass: 'bg-tertiary-container',
    label: { hi: 'सुन रहा हूँ... बोलिए', mr: 'ऐकतोय... बोला', en: 'Listening... Speak now' },
  },
  processing: {
    icon: FiLoader,
    color: '#7043C2',
    pulseColor: 'rgba(112, 67, 194, 0.25)',
    bgClass: 'ai-pulse',
    label: { hi: 'प्रोसेसिंग...', mr: 'प्रक्रिया सुरू...', en: 'Processing...' },
  },
  idle: {
    icon: FiMic,
    color: '#727783',
    pulseColor: 'rgba(114, 119, 131, 0.2)',
    bgClass: 'bg-outline',
    label: { hi: 'शुरू हो रहा है...', mr: 'सुरू होत आहे...', en: 'Starting...' },
  },
}

export default function VoiceAutoModeOverlay({ phase, liveTranscript, language, onStop }) {
  const config = PHASE_CONFIG[phase] || PHASE_CONFIG.idle
  const Icon = config.icon
  const label = config.label[language] || config.label.en

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(25, 28, 29, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', 'Noto Sans Devanagari', system-ui, sans-serif",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={onStop}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          color: '#424752',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 71, 141, 0.1)',
        }}
      >
        <FiX size={20} />
      </button>

      {/* Title */}
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
        color: 'rgba(255, 255, 255, 0.7)',
        textTransform: 'uppercase',
        letterSpacing: '3px',
        marginBottom: '48px',
      }}>
        🗣️ {language === 'hi' ? 'वॉइस मोड' : language === 'mr' ? 'व्हॉइस मोड' : 'Voice Mode'}
      </div>

      {/* Animated icon circle */}
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        {/* Pulse rings */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          backgroundColor: config.pulseColor,
          animation: phase === 'listening' || phase === 'speaking'
            ? 'voicePulse 2s ease-in-out infinite'
            : 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          backgroundColor: config.pulseColor,
          animation: phase === 'listening' || phase === 'speaking'
            ? 'voicePulse 2s ease-in-out infinite 0.5s'
            : 'none',
        }} />

        {/* Main circle */}
        <div style={{
          position: 'relative',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 32px ${config.pulseColor}`,
        }}>
          <Icon
            size={40}
            color="white"
            style={{
              animation: phase === 'processing' ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </div>
      </div>

      {/* Phase label */}
      <div style={{
        fontSize: '18px',
        fontWeight: 700,
        fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
        color: '#FFFFFF',
        marginBottom: '16px',
      }}>
        {label}
      </div>

      {/* Live transcript */}
      {liveTranscript && (
        <div style={{
          maxWidth: '320px',
          padding: '14px 24px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          color: '#191C1D',
          fontSize: '15px',
          textAlign: 'center',
          lineHeight: 1.5,
          marginBottom: '24px',
          minHeight: '48px',
          boxShadow: '0 8px 24px rgba(0, 71, 141, 0.1)',
        }}>
          "{liveTranscript}"
        </div>
      )}

      {/* Stop button */}
      <button
        onClick={onStop}
        style={{
          position: 'absolute',
          bottom: '48px',
          padding: '14px 40px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          border: 'none',
          color: '#BA1A1A',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(186, 26, 26, 0.12)',
        }}
      >
        <FiX size={18} />
        {language === 'hi' ? 'रोकें' : language === 'mr' ? 'थांबा' : 'Stop Voice Mode'}
      </button>

      {/* CSS Animations */}
      <style>{`
        @keyframes voicePulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.2; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  )
}
