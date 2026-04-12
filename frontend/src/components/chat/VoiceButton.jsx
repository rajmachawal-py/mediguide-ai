/**
 * MediGuide AI — VoiceButton
 * Push-to-talk button that records audio and sends to STT API.
 */

import { FiMic, FiMicOff, FiLoader } from 'react-icons/fi'
import useVoiceRecorder from '../../hooks/useVoiceRecorder'
import { speechToText } from '../../services/api'
import { useState, useEffect } from 'react'

export default function VoiceButton({ language, onTranscript, disabled }) {
  const { isRecording, audioBlob, error, startRecording, stopRecording, resetRecording } = useVoiceRecorder()
  const [isProcessing, setIsProcessing] = useState(false)

  // When recording stops, send audio for transcription
  useEffect(() => {
    if (!audioBlob || isProcessing) return

    const transcribe = async () => {
      setIsProcessing(true)
      try {
        const langMap = { hi: 'hi-IN', mr: 'mr-IN', en: 'en-IN' }
        const result = await speechToText(audioBlob, langMap[language] || 'hi-IN')
        if (result?.transcript) {
          onTranscript(result.transcript)
        }
      } catch (err) {
        console.error('STT error:', err)
      } finally {
        setIsProcessing(false)
        resetRecording()
      }
    }

    transcribe()
  }, [audioBlob]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePress = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (isProcessing) {
    return (
      <button
        disabled
        className="w-11 h-11 rounded-xl bg-surface-700 flex items-center justify-center"
      >
        <FiLoader className="w-4 h-4 text-surface-400 animate-spin" />
      </button>
    )
  }

  return (
    <button
      onClick={handlePress}
      disabled={disabled}
      title={isRecording ? 'Stop recording' : 'Start voice input'}
      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
        isRecording
          ? 'bg-red-500 hover:bg-red-600 text-white animate-recording shadow-lg shadow-red-500/30'
          : 'bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white border border-surface-700/50'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {isRecording ? <FiMicOff className="w-4 h-4" /> : <FiMic className="w-4 h-4" />}
    </button>
  )
}
