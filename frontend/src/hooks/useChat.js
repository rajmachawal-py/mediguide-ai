import { useState, useCallback, useRef, useEffect } from 'react'
import { sendTriage, generateSummary } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

const MAX_HISTORY = 50
const SESSIONS_KEY = 'mediguide_chat_sessions'
const MAX_SESSIONS = 50

/* ─── Session persistence helpers ─────────────────────────── */

/** Generate a unique session ID */
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** Get all stored sessions from localStorage */
export function getAllSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    const sessions = JSON.parse(raw)
    // Sort newest first
    return sessions.sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

/** Get a single session by ID */
export function getSession(sessionId) {
  const sessions = getAllSessions()
  return sessions.find(s => s.id === sessionId) || null
}

/** Save a session to localStorage */
function saveSessionToStorage(session) {
  try {
    let sessions = getAllSessions()
    const existingIndex = sessions.findIndex(s => s.id === session.id)
    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.unshift(session)
    }
    // Keep only the latest N sessions
    sessions = sessions.slice(0, MAX_SESSIONS)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch (err) {
    console.warn('[useChat] Failed to save session:', err)
  }
}

/** Delete a session from localStorage */
export function deleteSession(sessionId) {
  try {
    let sessions = getAllSessions()
    sessions = sessions.filter(s => s.id !== sessionId)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch (err) {
    console.warn('[useChat] Failed to delete session:', err)
  }
}

/** Mark a session as report downloaded */
export function markSessionDownloaded(sessionId) {
  try {
    let sessions = getAllSessions()
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      session.downloaded = true
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
    }
  } catch {
    // ignore
  }
}

/* ─── Main hook ───────────────────────────────────────────── */

export default function useChat(initialSessionId = null) {
  const [messages, setMessages] = useState([])
  const [urgency, setUrgency] = useState(null)       // null | 'mild' | 'moderate' | 'emergency'
  const [urgencyData, setUrgencyData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFinal, setIsFinal] = useState(false)
  const [summary, setSummary] = useState(null)
  const [sessionId, setSessionId] = useState(() => initialSessionId || generateSessionId())

  // Language from centralized context — changes here update the entire app
  const { language, changeLanguage } = useLanguage()

  const abortRef = useRef(null)
  const loadingRef = useRef(false) // ref to avoid stale closure

  /** Load a previous session by ID */
  const loadSession = useCallback((id) => {
    const session = getSession(id)
    if (session) {
      setMessages(session.messages || [])
      setUrgency(session.urgency || null)
      setUrgencyData(session.urgencyData || null)
      setIsFinal(session.isFinal || false)
      setSummary(session.summary || null)
      setSessionId(session.id)
      return true
    }
    return false
  }, [])

  /** Auto-save session whenever messages change (debounced) */
  useEffect(() => {
    if (messages.length === 0) return

    const timer = setTimeout(() => {
      const firstUserMsg = messages.find(m => m.role === 'user')
      const preview = firstUserMsg
        ? firstUserMsg.content.slice(0, 80)
        : 'Chat session'

      saveSessionToStorage({
        id: sessionId,
        timestamp: messages[0]?.timestamp || Date.now(),
        lastUpdated: Date.now(),
        preview,
        messageCount: messages.length,
        messages,
        urgency,
        urgencyData,
        isFinal,
        summary,
        downloaded: false,
        language,
      })
    }, 500) // debounce 500ms

    return () => clearTimeout(timer)
  }, [messages, urgency, urgencyData, isFinal, summary, sessionId, language])

  /** Build conversation history for the API from messages state. */
  const buildHistory = useCallback((msgs) => {
    return msgs
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_HISTORY)
      .map(m => ({ role: m.role, content: m.content }))
  }, [])

  /** Send a user message and get AI triage response. */
  const sendMessage = useCallback(async (text, lat = null, lng = null, imageBase64 = null) => {
    console.log('[useChat] sendMessage called:', { text, isLoading: loadingRef.current })
    if (!text.trim() || loadingRef.current) {
      console.log('[useChat] Blocked — empty text or already loading')
      return
    }

    const userMsg = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
      image: imageBase64 || null,
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    loadingRef.current = true

    try {
      const history = buildHistory([...messages, userMsg])

      // Build patient context from localStorage so Gemini doesn't re-ask
      const patientContext = {
        name: localStorage.getItem('mediguide_patient_name') || null,
        age: localStorage.getItem('mediguide_patient_age') || null,
        gender: localStorage.getItem('mediguide_patient_gender') || null,
        state: localStorage.getItem('mediguide_patient_state') || null,
      }
      // Only send if at least one field is filled
      const hasContext = patientContext.name || patientContext.age || patientContext.gender
      
      const response = await sendTriage(
        text.trim(), language, history, lat, lng, imageBase64,
        hasContext ? patientContext : null
      )

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

      // Extract demographics from AI response for guest mode
      extractDemographics(response.message || response.response, text.trim())

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
      loadingRef.current = false
    }
  }, [messages, language, buildHistory])

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
    // Generate new session ID for the next chat
    setSessionId(generateSessionId())
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
    sessionId,
    loadSession,
  }
}


/**
 * Extract patient demographics from chat messages for guest mode.
 * Scans user input and AI responses for age, gender, and name mentions.
 * Stores in localStorage for health card and FHIR export.
 */
function extractDemographics(aiResponse, userText) {
  const combined = `${userText} ${aiResponse}`.toLowerCase()

  // Extract age — patterns like "30 years", "age 45", "I am 25", "मेरी उम्र 30"
  if (!localStorage.getItem('mediguide_patient_age')) {
    const ageMatch = combined.match(
      /(?:i am|i'm|age is|age:|my age is|मेरी उम्र|वय)\s*(\d{1,3})/i
    ) || userText.match(/^(\d{1,3})$/i)  // plain number reply

    if (ageMatch && parseInt(ageMatch[1]) > 0 && parseInt(ageMatch[1]) <= 120) {
      localStorage.setItem('mediguide_patient_age', ageMatch[1])
    }
  }

  // Extract gender
  if (!localStorage.getItem('mediguide_patient_gender')) {
    const genderPatterns = {
      male: /\b(male|man|पुरुष|लड़का|मर्द|पुरुष)\b/i,
      female: /\b(female|woman|महिला|लड़की|स्त्री|महिला|बाई)\b/i,
    }
    for (const [gender, pattern] of Object.entries(genderPatterns)) {
      if (pattern.test(combined)) {
        localStorage.setItem('mediguide_patient_gender', gender)
        break
      }
    }
  }

  // Extract name — patterns like "my name is", "I am [Name]", "मेरा नाम"
  if (!localStorage.getItem('mediguide_patient_name')) {
    const nameMatch = userText.match(
      /(?:my name is|i am|i'm|मेरा नाम|माझे नाव)\s+([A-Za-z\u0900-\u097F\u0980-\u09FF]+(?:\s+[A-Za-z\u0900-\u097F\u0980-\u09FF]+)?)/i
    )
    if (nameMatch && nameMatch[1].length > 1) {
      localStorage.setItem('mediguide_patient_name', nameMatch[1].trim())
    }
  }
}
