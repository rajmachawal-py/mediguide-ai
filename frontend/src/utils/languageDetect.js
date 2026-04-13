/**
 * MediGuide AI — Language Detection Utility
 * Detects language from user text based on Unicode script analysis.
 *
 * Used as a fallback when Sarvam AI language detection is unavailable.
 */

/**
 * Detect language from text based on Unicode script.
 * @param {string} text - Input text to analyze
 * @returns {'hi' | 'mr' | 'en'} Detected language code
 */
export function detectLanguage(text) {
  if (!text || text.trim().length === 0) return 'en'

  let devanagariCount = 0
  let latinCount = 0
  let totalAlpha = 0

  for (const ch of text) {
    // Devanagari Unicode block: U+0900 to U+097F
    if (ch >= '\u0900' && ch <= '\u097F') {
      devanagariCount++
      totalAlpha++
    } else if (/[a-zA-Z]/.test(ch)) {
      latinCount++
      totalAlpha++
    }
  }

  if (totalAlpha === 0) return 'en'

  const devanagariRatio = devanagariCount / totalAlpha

  // If more than 30% Devanagari, return Hindi (we can't distinguish Marathi by script alone)
  if (devanagariRatio > 0.3) return 'hi'

  return 'en'
}

/**
 * Get the saved language preference from localStorage.
 * @returns {'hi' | 'mr' | 'en'} Language code
 */
export function getSavedLanguage() {
  return localStorage.getItem('mediguide_lang') || 'en'
}

/**
 * Save language preference to localStorage.
 * @param {'hi' | 'mr' | 'en'} lang - Language code
 */
export function saveLanguage(lang) {
  localStorage.setItem('mediguide_lang', lang)
}
