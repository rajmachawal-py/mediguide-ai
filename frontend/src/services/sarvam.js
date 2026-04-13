/**
 * MediGuide AI — Sarvam AI Frontend Service
 * Handles voice playback of TTS audio responses.
 *
 * Note: The actual STT/TTS API calls go through the backend (api.js).
 * This module provides client-side audio playback utilities.
 */

/**
 * Play audio from a Blob (returned by TTS API).
 * @param {Blob} audioBlob - Audio blob from the TTS endpoint
 * @returns {Promise<void>} Resolves when audio finishes playing
 */
export function playAudioBlob(audioBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(audioBlob)
    const audio = new Audio(url)

    audio.onended = () => {
      URL.revokeObjectURL(url)
      resolve()
    }

    audio.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(new Error(`Audio playback failed: ${e.message || 'Unknown error'}`))
    }

    audio.play().catch(reject)
  })
}

/**
 * Stop all currently playing audio on the page.
 */
export function stopAllAudio() {
  document.querySelectorAll('audio').forEach(audio => {
    audio.pause()
    audio.currentTime = 0
  })
}

/**
 * Check if the browser supports audio recording (MediaRecorder API).
 * @returns {boolean}
 */
export function isVoiceSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
}
