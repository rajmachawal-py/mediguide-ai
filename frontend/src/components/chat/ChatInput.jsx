/**
 * MediGuide AI — ChatInput
 * Text input with send button, auto-disables during loading.
 */

import { useState, useRef, useEffect } from 'react'
import { FiSend } from 'react-icons/fi'

export default function ChatInput({ onSend, isLoading, language, placeholder }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  const defaultPlaceholder = {
    hi: 'अपने लक्षण बताएं...',
    mr: 'तुमची लक्षणे सांगा...',
    en: 'Describe your symptoms...',
  }

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || isLoading) return
    onSend(text.trim())
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder={placeholder || defaultPlaceholder[language] || defaultPlaceholder.en}
          disabled={isLoading}
          rows={1}
          className="w-full bg-surface-800/80 text-white placeholder-surface-400 rounded-2xl px-4 py-3 pr-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 border border-surface-700/50 transition-all disabled:opacity-50"
          style={{ maxHeight: '120px' }}
        />
      </div>

      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
      >
        <FiSend className="w-4 h-4" />
      </button>
    </form>
  )
}

/** Allows external components to set the input text (e.g., from voice transcription). */
ChatInput.setText = null
