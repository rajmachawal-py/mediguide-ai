/**
 * MediGuide AI — Firebase Client
 * Initializes Firebase JS SDK for push notifications (FCM).
 *
 * Required env vars (fill in from Firebase Console → Project Settings → General → Web App):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_FIREBASE_VAPID_KEY  (Cloud Messaging → Web Push certificates → Key pair)
 */

import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import toast from 'react-hot-toast'

// ── Firebase Config ──────────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// Only initialize if config is provided
let app = null
let messaging = null

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
    console.log('Firebase initialized')
  } catch (err) {
    console.warn('Firebase init failed:', err.message)
  }
} else {
  console.warn(
    'Firebase not configured — push notifications disabled. ' +
    'Set VITE_FIREBASE_* env vars in frontend/.env.local'
  )
}


// ── Request Notification Permission + Get FCM Token ──────────

export async function requestNotificationPermission() {
  if (!messaging) {
    console.warn('Firebase Messaging not available')
    return null
  }

  try {
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    })

    if (token) {
      console.log('FCM token obtained')
      return token
    }

    console.warn('No FCM token available')
    return null
  } catch (err) {
    console.error('FCM token error:', err)
    return null
  }
}


// ── Save FCM Token to Backend ────────────────────────────────

export async function saveFCMToken(token) {
  try {
    const { saveFCMTokenAPI } = await import('../services/api')
    await saveFCMTokenAPI(token)
    console.log('FCM token saved to backend')
  } catch (err) {
    console.error('Failed to save FCM token:', err)
  }
}


// ── Listen for Foreground Push Messages ──────────────────────

export function onMessageListener() {
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    console.log('Foreground push received:', payload)

    const title = payload.notification?.title || 'MediGuide Alert'
    const body = payload.notification?.body || ''
    const urgency = payload.data?.urgency || 'info'

    // Show as toast notification
    const urgencyEmoji = {
      emergency: '🔴',
      moderate: '🟡',
      mild: '🟢',
    }

    toast(
      `${urgencyEmoji[urgency] || 'ℹ️'} ${title}\n${body}`,
      {
        duration: 8000,
        icon: '🏥',
        style: {
          background: urgency === 'emergency' ? '#1c1917' : '#1e293b',
          color: '#e2e8f0',
          border: urgency === 'emergency'
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid #334155',
        },
      }
    )
  })
}


// ── Initialize Push Notifications (call once after login) ────

export async function initPushNotifications() {
  const token = await requestNotificationPermission()
  if (token) {
    await saveFCMToken(token)
  }

  // Start foreground listener
  onMessageListener()

  return token
}
