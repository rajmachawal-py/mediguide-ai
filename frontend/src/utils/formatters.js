/**
 * MediGuide AI — Formatter Utilities
 * Common formatting functions used across the frontend.
 */

/**
 * Format distance in km to human-readable string.
 * @param {number|null} km - Distance in kilometres
 * @returns {string} Formatted distance
 */
export function formatDistance(km) {
  if (km == null || km === undefined) return ''
  if (km < 0.1) return `${Math.round(km * 1000)} m`
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/**
 * Format a phone number for display.
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export function formatPhone(phone) {
  if (!phone) return ''
  // Remove +91 prefix for display
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length > 10) {
    const num = digits.slice(2)
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`
  }
  return phone
}

/**
 * Format a date/timestamp for display.
 * @param {string|Date} date - ISO date string or Date object
 * @param {'short'|'long'|'relative'} format - Display format
 * @returns {string} Formatted date
 */
export function formatDate(date, format = 'short') {
  if (!date) return ''
  const d = new Date(date)

  if (format === 'relative') {
    const now = new Date()
    const diffMs = now - d
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // short format
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/**
 * Format currency amount in INR.
 * @param {number} amount - Amount in INR
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (amount == null) return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Truncate text to max length with ellipsis.
 * @param {string} text - Input text
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text || ''
  return text.substring(0, maxLength - 3) + '...'
}
