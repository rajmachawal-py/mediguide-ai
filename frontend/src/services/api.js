/**
 * MediGuide AI — API Service
 * Axios instance configured for FastAPI backend.
 * In dev, Vite proxy forwards /api/* to localhost:8000.
 */

import axios from 'axios'
import { getSession } from './supabase'
// In production (Vercel), call Render backend directly to bypass Vercel's
// 10-second proxy timeout limit on Hobby plan.
// In dev, /api is proxied by Vite to localhost:8000.
const API_BASE = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.PROD ? 'https://mediguide-ai-i3yv.onrender.com/api' : '/api')

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,  // 60s — Render free tier has cold-start delays + Gemini latency
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
  // Tag for retry tracking
  config._retryCount = config._retryCount || 0
  return config
})

// ── Response interceptor: handle errors + auto-retry ─────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    // Auto-retry on 5xx or network errors (up to 2 retries)
    const is5xx = error.response?.status >= 500
    const isNetwork = !error.response && error.code !== 'ECONNABORTED'
    const isTimeout = error.code === 'ECONNABORTED'
    const maxRetries = 2

    if ((is5xx || isNetwork || isTimeout) && config && config._retryCount < maxRetries) {
      config._retryCount += 1
      console.warn(`[API] Retry ${config._retryCount}/${maxRetries} for ${config.url}`)
      // Exponential backoff: 1s, 3s
      const delay = config._retryCount === 1 ? 1000 : 3000
      await new Promise(r => setTimeout(r, delay))
      return api(config)
    }

    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    return Promise.reject(error)
  }
)

// ═══════════════════════════════════════════════════════════════
// TRIAGE & CHAT
// ═══════════════════════════════════════════════════════════════

/** Send symptom text for triage assessment. */
export async function sendTriage(symptomText, language, history, lat, lng, imageBase64 = null, patientContext = null) {
  const payload = {
    symptom: symptomText,
    language,
    history,
    lat,
    lng,
  }
  if (imageBase64) {
    payload.image_base64 = imageBase64
  }
  if (patientContext) {
    payload.patient_context = patientContext
  }
  const { data } = await api.post('/triage', payload)
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
    history: conversationHistory,
  })
  return data
}

// ═══════════════════════════════════════════════════════════════
// VOICE
// ═══════════════════════════════════════════════════════════════

/** Send audio for speech-to-text transcription. */
export async function speechToText(audioBlob, language) {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  if (language) formData.append('language', language)

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

// ═══════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════

/** Get current user's profile. */
export async function getProfile() {
  const { data } = await api.get('/profile')
  return data
}

/** Update user profile fields. */
export async function updateProfile(profileData) {
  const { data } = await api.put('/profile', profileData)
  return data
}

/** Save FCM push notification token. */
export async function saveFCMTokenAPI(fcmToken) {
  const { data } = await api.post('/profile/fcm', { fcm_token: fcmToken })
  return data
}

// ═══════════════════════════════════════════════════════════════
// CAREGIVER
// ═══════════════════════════════════════════════════════════════

/** Link a caregiver by phone number. */
export async function linkCaregiver(caregiverPhone, caregiverName, relationship = 'family') {
  const { data } = await api.post('/caregiver/link', {
    caregiver_phone: caregiverPhone,
    caregiver_name: caregiverName,
    relationship,
  })
  return data
}

/** Get all caregiver links for current user. */
export async function getCaregiverLinks() {
  const { data } = await api.get('/caregiver/links')
  return data
}

/** Revoke a caregiver link. */
export async function revokeCaregiver(linkId) {
  const { data } = await api.delete(`/caregiver/link/${linkId}`)
  return data
}

/** Send notification to caregivers. */
export async function notifyCaregivers(urgency, summary) {
  const { data } = await api.post('/caregiver/notify', { urgency, summary })
  return data
}

/** Get caregiver alert history. */
export async function getCaregiverAlerts(limit = 50) {
  const { data } = await api.get('/caregiver/alerts', { params: { limit } })
  return data
}


export default api
