/**
 * MediGuide AI — API Service
 * Axios instance configured for FastAPI backend.
 * In dev, Vite proxy forwards /api/* to localhost:8000.
 */

import axios from 'axios'
import { getSession } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach Supabase JWT ─────────────────
api.interceptors.request.use(async (config) => {
  try {
    const session = await getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch {
    // No session — continue without auth header
  }
  return config
})

// ── Response interceptor: handle errors ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired — could redirect to login
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    return Promise.reject(error)
  }
)

// ═══════════════════════════════════════════════════════════════
// TRIAGE & CHAT
// ═══════════════════════════════════════════════════════════════

/** Send symptom text for triage assessment. */
export async function sendTriage(symptomText, language, history, lat, lng) {
  const { data } = await api.post('/triage', {
    symptom: symptomText,
    language,
    history,
    lat,
    lng,
  })
  return data
}

/** Send a general chat message. */
export async function sendChat(message, language, history) {
  const { data } = await api.post('/chat', {
    message,
    language,
    history,
  })
  return data
}

/** Generate a doctor-ready symptom summary. */
export async function generateSummary(conversationHistory) {
  const { data } = await api.post('/chat/summary', {
    conversation_history: conversationHistory,
  })
  return data
}

// ═══════════════════════════════════════════════════════════════
// VOICE
// ═══════════════════════════════════════════════════════════════

/** Send audio for speech-to-text transcription. */
export async function speechToText(audioBlob, language) {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  formData.append('language', language)

  const { data } = await api.post('/voice/stt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return data
}

/** Get text-to-speech audio. */
export async function textToSpeech(text, language) {
  const { data } = await api.post('/voice/tts', { text, language }, {
    responseType: 'blob',
    timeout: 30000,
  })
  return data
}

// ═══════════════════════════════════════════════════════════════
// HOSPITALS
// ═══════════════════════════════════════════════════════════════

/** Find nearby hospitals. */
export async function getNearbyHospitals(lat, lng, radiusKm = 10, specialty = null) {
  const params = { lat, lng, radius_km: radiusKm }
  if (specialty) params.specialty = specialty

  const { data } = await api.get('/hospitals/nearby', { params })
  return data
}

/** Get single hospital detail. */
export async function getHospital(hospitalId) {
  const { data } = await api.get(`/hospitals/${hospitalId}`)
  return data
}

/** Get hospital departments. */
export async function getHospitalDepartments(hospitalId) {
  const { data } = await api.get(`/hospitals/${hospitalId}/departments`)
  return data
}

// ═══════════════════════════════════════════════════════════════
// SCHEMES
// ═══════════════════════════════════════════════════════════════

/** Find eligible government schemes. */
export async function getEligibleSchemes(filters = {}) {
  const { data } = await api.get('/schemes/eligible', { params: filters })
  return data
}

/** Get single scheme detail. */
export async function getScheme(schemeId) {
  const { data } = await api.get(`/schemes/${schemeId}`)
  return data
}

/** Get AI explanation of a scheme. */
export async function explainScheme(schemeId, language = 'hi', profile = {}) {
  const params = { language, ...profile }
  const { data } = await api.get(`/schemes/${schemeId}/explain`, { params })
  return data
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

/** Get indoor map graph for a hospital. */
export async function getIndoorMap(hospitalId) {
  const { data } = await api.get(`/navigation/${hospitalId}/map`)
  return data
}

/** Calculate indoor route. */
export async function getIndoorRoute(hospitalId, from, to, accessibleOnly = false) {
  const { data } = await api.get(`/navigation/${hospitalId}/route`, {
    params: { from, to, accessible_only: accessibleOnly },
  })
  return data
}

export default api
