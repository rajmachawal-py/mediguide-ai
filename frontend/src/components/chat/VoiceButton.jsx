/**
 * MediGuide AI — VoiceButton
 * Single voice button for manual voice INPUT only.
 * Converts speech to text and sends as a chat message — NO TTS output.
 * For voice output (TTS), users should use Voice Mode (useVoiceAutoMode).
 *
 * Uses Web Speech API for real-time transcription.
 * Falls back to MediaRecorder + Sarvam API if Web Speech isn't available.
 *
 * FIX: Properly accumulates final transcripts without duplication.
 * The old code re-iterated all results from index 0 on every onresult event,
 * causing word duplication when Chrome restarts recognition in continuous mode.
 */

import { FiMic, FiMicOff, FiLoader } from 'react-icons/fi'
import { useState, useRef, useCallback, useEffect } from 'react'
import { speechToText } from '../../services/api'
import toast from 'react-hot-toast'

// Language code mapping for Web Speech API
const SPEECH_LANG_MAP = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN',
}

export default function VoiceButton({ language, onTranscript, disabled }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')
  const finalPartsRef = useRef([])    // Accumulated final transcript segments
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const useWebSpeech = useRef(true)
  // ── Ref mirrors isRecording state so recognition callbacks are never stale ──
  const isRecordingRef = useRef(false)
  useEffect(() => { isRecordingRef.current = isRecording }, [isRecording])

  // Check if Web Speech API is available
  const hasWebSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  /** Start with Web Speech API */
  const startWebSpeech = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    transcriptRef.current = ''
    finalPartsRef.current = []

    const recognition = new SpeechRecognition()
    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      // Only process NEW results starting from event.resultIndex
      // This prevents duplication when Chrome restarts recognition
      let newFinals = ''
      let currentInterim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          newFinals += result[0].transcript
        } else {
          currentInterim += result[0].transcript
        }
      }

      // Append new final segments (don't re-process old ones)
      if (newFinals) {
        finalPartsRef.current.push(newFinals)
      }

      // Full transcript = all accumulated finals + current interim
      const allFinals = finalPartsRef.current.join(' ').trim()
      transcriptRef.current = currentInterim
        ? `${allFinals} ${currentInterim}`.trim()
        : allFinals
    }

    recognition.onerror = (event) => {
      // Use isRecordingRef (not isRecording state) to avoid stale closure
      if (event.error === 'no-speech' && isRecordingRef.current) {
        try { recognition.start() } catch { /* ignore */ }
      } else if (event.error !== 'aborted') {
        console.warn('[VoiceButton] Web Speech error:', event.error)
      }
    }

    recognition.onend = () => {
      // Chrome stops Web Speech after silence even with continuous=true.
      // Restart immediately if the user hasn't tapped Stop yet.
      if (isRecordingRef.current) {
        try { recognition.start() } catch { /* ignore */ }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      return true
    } catch {
      return false
    }
  // isRecording intentionally removed from deps — we use isRecordingRef inside
  // the callbacks instead to avoid recreating the recognition on every state tick.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  /** Start with MediaRecorder (fallback for Sarvam API) */
  const startMediaRecorder = useCallback(async () => {
    try {
      chunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus' : 'audio/webm',
      })
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(250)
      return true
    } catch (err) {
      console.error('[VoiceButton] MediaRecorder failed:', err)
      return false
    }
  }, [])

  /** Start recording */
  const handleStart = useCallback(async () => {
    setIsRecording(true)

    let started = false
    if (hasWebSpeech) {
      started = startWebSpeech()
      useWebSpeech.current = true
    }
    if (!started) {
      started = await startMediaRecorder()
      useWebSpeech.current = false
    }

    if (started) {
      toast('🎤 Recording... Tap again to stop', {
        icon: '🔴',
        duration: 30000,
        id: 'recording-toast',
      })
    } else {
      setIsRecording(false)
      toast.error('Could not access microphone')
    }
  }, [hasWebSpeech, startWebSpeech, startMediaRecorder])

  /** Stop recording and process */
  const handleStop = useCallback(async () => {
    setIsRecording(false)
    toast.dismiss('recording-toast')

    if (useWebSpeech.current && recognitionRef.current) {
      // Web Speech API path
      recognitionRef.current.stop()
      recognitionRef.current = null

      // Build final transcript from accumulated parts
      const transcript = finalPartsRef.current.join(' ').trim() || transcriptRef.current.trim()
      finalPartsRef.current = []
      transcriptRef.current = ''

      if (transcript) {
        toast.success(`🎤 "${transcript}"`, { duration: 2000 })
        onTranscript(transcript)
      } else {
        toast.error(
          language === 'hi' ? 'आवाज़ नहीं आई। फिर से बोलें।' :
          language === 'mr' ? 'आवाज आली नाही. पुन्हा बोला.' :
          'No speech detected. Please try again.',
          { duration: 3000 }
        )
      }
    } else if (mediaRecorderRef.current) {
      // Sarvam API fallback path
      setIsProcessing(true)
      mediaRecorderRef.current.stop()

      // Wait for chunks to finalize
      await new Promise(r => setTimeout(r, 300))

      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
      try {
        const result = await speechToText(audioBlob, language || 'en')
        if (result?.transcript?.trim()) {
          toast.success(`🎤 "${result.transcript}"`, { duration: 2000 })
          onTranscript(result.transcript.trim())
        } else {
          toast.error('Could not understand audio. Try speaking louder.', { duration: 3000 })
        }
      } catch (err) {
        console.error('[VoiceButton] Sarvam STT error:', err)
        toast.error('Voice recognition failed.')
      } finally {
        setIsProcessing(false)
        mediaRecorderRef.current = null
      }
    }
  }, [language, onTranscript])

  const handlePress = () => {
    if (isProcessing) return
    if (isRecording) {
      handleStop()
    } else {
      handleStart()
    }
  }

  if (isProcessing) {
    return (
      <button disabled className="w-11 h-11 rounded-clinical bg-surface-container flex items-center justify-center">
        <FiLoader className="w-4 h-4 text-outline animate-spin" />
      </button>
    )
  }

  return (
    <button
      onClick={handlePress}
      disabled={disabled}
      title={isRecording ? 'Stop & send' : 'Voice input (text reply)'}
      className={`w-11 h-11 rounded-clinical flex items-center justify-center transition-all duration-200 active:scale-90 ${
        isRecording
          ? 'bg-error text-white shadow-triage-emergency'
          : 'bg-surface-container-low hover:bg-primary-fixed/40 text-on-surface-variant hover:text-primary'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      style={isRecording ? { animation: 'pulse 1.5s ease-in-out infinite' } : {}}
    >
      {isRecording ? <FiMicOff className="w-4 h-4" /> : <FiMic className="w-4 h-4" />}
    </button>
  )
}
