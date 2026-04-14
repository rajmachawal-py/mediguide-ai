/**
 * MediGuide AI — useVoiceAutoMode Hook
 * Manages the fully hands-free triage loop:
 * TTS speaks → auto-record → STT → send to triage → TTS response → repeat
 * 
 * Uses Web Speech API for STT (reliable, instant) and Sarvam TTS for voice output.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { textToSpeech } from '../services/api'
import { playAudioBlob } from '../services/sarvam'

// Language code mapping for Web Speech API
const SPEECH_LANG_MAP = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN',
}

const WELCOME_MSG = {
  hi: 'नमस्ते, मैं मेडिगाइड हूं। आपको क्या तकलीफ है? बोलिए।',
  mr: 'नमस्कार, मी मेडिगाइड आहे. तुम्हाला काय त्रास होतोय? बोला.',
  en: 'Hello, I am MediGuide. What symptoms are you experiencing? Please speak.',
}

const FINAL_MSG = {
  hi: 'ट्राइएज पूरा हुआ। कृपया अपनी रिपोर्ट डाउनलोड करें।',
  mr: 'ट्रायएज पूर्ण झाले. कृपया तुमचा अहवाल डाउनलोड करा.',
  en: 'Triage complete. Please download your health report.',
}

export default function useVoiceAutoMode({ language, sendMessage, messages, isFinal, lat, lng }) {
  const [isAutoMode, setIsAutoMode] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | speaking | listening | processing
  const [liveTranscript, setLiveTranscript] = useState('')
  
  const recognitionRef = useRef(null)
  const isAutoModeRef = useRef(false)
  const phaseRef = useRef('idle')
  const prevMsgCountRef = useRef(0)

  // Keep refs in sync
  useEffect(() => {
    isAutoModeRef.current = isAutoMode
  }, [isAutoMode])
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  /** Play TTS audio and resolve when done */
  const speakText = useCallback(async (text) => {
    if (!isAutoModeRef.current) return
    setPhase('speaking')
    try {
      const audioBlob = await textToSpeech(text, language)
      await playAudioBlob(audioBlob)
    } catch (err) {
      console.warn('[AutoMode] TTS failed:', err)
      // Fall back to browser TTS
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = SPEECH_LANG_MAP[language] || 'en-IN'
        utterance.rate = 0.9
        await new Promise((resolve) => {
          utterance.onend = resolve
          utterance.onerror = resolve
          speechSynthesis.speak(utterance)
        })
      } catch {
        // If both fail, just continue
      }
    }
  }, [language])

  /** Start listening via Web Speech API */
  const startListening = useCallback(() => {
    if (!isAutoModeRef.current) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error('[AutoMode] SpeechRecognition not supported')
      return
    }

    setPhase('listening')
    setLiveTranscript('')

    const recognition = new SpeechRecognition()
    recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    let silenceTimer = null
    let finalTranscript = ''

    recognition.onresult = (event) => {
      let interim = ''
      finalTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setLiveTranscript(finalTranscript || interim)

      // Reset silence timer — user is still speaking
      clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => {
        // 2 seconds of silence after speech → stop and submit
        if (finalTranscript.trim()) {
          recognition.stop()
        }
      }, 2000)
    }

    recognition.onerror = (event) => {
      console.warn('[AutoMode] Recognition error:', event.error)
      clearTimeout(silenceTimer)
      if (event.error === 'no-speech' && isAutoModeRef.current) {
        // Restart if no speech detected
        try { recognition.start() } catch { /* ignore */ }
      }
    }

    recognition.onend = () => {
      clearTimeout(silenceTimer)
      if (finalTranscript.trim() && isAutoModeRef.current) {
        setPhase('processing')
        setLiveTranscript('')
        sendMessage(finalTranscript.trim(), lat, lng)
      } else if (isAutoModeRef.current) {
        // No transcript, restart listening
        try { recognition.start() } catch { /* ignore */ }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (err) {
      console.error('[AutoMode] Failed to start recognition:', err)
    }
  }, [language, sendMessage, lat, lng])

  /** Watch for new AI messages and continue the loop */
  useEffect(() => {
    if (!isAutoMode || messages.length === 0) return
    if (messages.length <= prevMsgCountRef.current) return

    const lastMsg = messages[messages.length - 1]
    prevMsgCountRef.current = messages.length

    if (lastMsg.role === 'assistant' && !lastMsg.isError && phaseRef.current === 'processing') {
      // AI responded — speak it, then listen again
      const continueLoop = async () => {
        await speakText(lastMsg.content)

        if (isFinal) {
          // Triage complete
          await speakText(FINAL_MSG[language] || FINAL_MSG.en)
          stopAutoMode()
        } else if (isAutoModeRef.current) {
          // Continue listening
          startListening()
        }
      }
      continueLoop()
    }
  }, [messages, isAutoMode, isFinal]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Start auto-mode */
  const startAutoMode = useCallback(async () => {
    setIsAutoMode(true)
    isAutoModeRef.current = true
    prevMsgCountRef.current = messages.length

    // Speak welcome message
    await speakText(WELCOME_MSG[language] || WELCOME_MSG.en)

    // Start listening
    if (isAutoModeRef.current) {
      startListening()
    }
  }, [language, messages.length, speakText, startListening])

  /** Stop auto-mode */
  const stopAutoMode = useCallback(() => {
    setIsAutoMode(false)
    isAutoModeRef.current = false
    setPhase('idle')
    setLiveTranscript('')

    // Stop recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    // Stop any TTS
    speechSynthesis.cancel()
  }, [])

  return {
    isAutoMode,
    phase,
    liveTranscript,
    startAutoMode,
    stopAutoMode,
  }
}
