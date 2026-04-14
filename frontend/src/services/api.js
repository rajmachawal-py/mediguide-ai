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
export async function sendTriage(symptomText, language, history, lat, lng, imageBase64 = null) {
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

