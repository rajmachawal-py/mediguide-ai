/**
 * MediGuide AI — Language Context
 * Centralized language state management for the entire app.
 * 
 * Usage:
 *   import { useLanguage } from '../contexts/LanguageContext'
 *   const { language, changeLanguage } = useLanguage()
 * 
 * Changing language anywhere (chat, profile, navbar) immediately
 * updates ALL components across the app.
 */

import { createContext, useContext, useState, useCallback } from 'react'

const LanguageContext = createContext({ language: 'en', changeLanguage: () => {} })

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem('mediguide_lang') || 'hi'
  )

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang)
    localStorage.setItem('mediguide_lang', lang)
  }, [])

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export default LanguageContext
