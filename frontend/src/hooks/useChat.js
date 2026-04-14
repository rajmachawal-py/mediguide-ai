/**
 * MediGuide AI — useChat Hook
 * Manages chat state, triage flow, and conversation history.
 */

import { useState, useCallback, useRef } from 'react'
import { sendTriage, generateSummary } from '../services/api'

const MAX_HISTORY = 50

export default function useChat() {
  const [messages, setMessages] = useState([])
  const [urgency, setUrgency] = useState(null)       // null | 'mild' | 'moderate' | 'emergency'
  const [urgencyData, setUrgencyData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFinal, setIsFinal] = useState(false)
  const [summary, setSummary] = useState(null)
  const [language, setLanguage] = useState(() => localStorage.getItem('mediguide_lang') || 'hi')
  const abortRef = useRef(null)

  /** Update and persist language preference. */
  const changeLanguage = useCallback((lang) => {
    setLanguage(lang)
    localStorage.setItem('mediguide_lang', lang)
  }, [])

  /** Build conversation history for the API from messages state. */
  const buildHistory = useCallback((msgs) => {
    return msgs
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_HISTORY)
      .map(m => ({ role: m.role, content: m.content }))
  }, [])

  /** Send a user message and get AI triage response. */
  const sendMessage = useCallback(async (text, lat = null, lng = null, imageBase64 = null) => {
    if (!text.trim() || isLoading) return

    const userMsg = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
      image: imageBase64 || null, // store image for ChatBubble display
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const history = buildHistory([...messages, userMsg])
      const response = await sendTriage(text.trim(), language, history, lat, lng, imageBase64)

      const aiMsg = {
        role: 'assistant',
        content: response.message || response.response,
        timestamp: Date.now(),
        urgency: response.urgency,
        is_final: response.is_final,
      }

      setMessages(prev => [...prev, aiMsg])

      // Update urgency if returned
      if (response.urgency) {
        setUrgency(response.urgency)
        setUrgencyData(response)
      }

      // Check if triage is complete
      if (response.is_final) {
        setIsFinal(true)
      }

      return response
    } catch (error) {
      const errorMsg = {
        role: 'assistant',
        content: language === 'hi'
          ? 'माफ़ कीजिए, कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।'
          : language === 'mr'
            ? 'क्षमा करा, काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.'
            : 'Sorry, something went wrong. Please try again.',
        timestamp: Date.now(),
        isError: true,
      }
      setMessages(prev => [...prev, errorMsg])
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [messages, language, isLoading, buildHistory])

  /** Generate doctor-ready summary from conversation. */
  const getSummary = useCallback(async () => {
    if (messages.length < 2) return null

    try {
      setIsLoading(true)
      const history = buildHistory(messages)
      const result = await generateSummary(history)
      setSummary(result)
      return result
    } catch (error) {
      console.error('Summary generation error:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [messages, buildHistory])

  /** Reset the entire chat. */
  const resetChat = useCallback(() => {
    setMessages([])
    setUrgency(null)
    setUrgencyData(null)
    setIsLoading(false)
    setIsFinal(false)
    setSummary(null)
  }, [])

  return {
    messages,
    urgency,
    urgencyData,
    isLoading,
    isFinal,
    summary,
    language,
    changeLanguage,
    sendMessage,
    getSummary,
    resetChat,
  }
}
