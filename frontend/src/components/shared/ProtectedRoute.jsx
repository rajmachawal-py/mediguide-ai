/**
 * MediGuide AI — ProtectedRoute
 * Route guard that checks Supabase auth session OR guest mode.
 * Redirects unauthenticated users to /login.
 */

import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import Spinner from './Spinner'

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Check 1: Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsAuthed(true)
        setLoading(false)
        return
      }

      // Check 2: Guest mode fallback (for demo/testing)
      const isGuest = localStorage.getItem('mediguide_guest') === 'true'
      if (isGuest) {
        setIsAuthed(true)
        setLoading(false)
        return
      }

      setIsAuthed(false)
      setLoading(false)
    }

    checkAuth()

    // Listen for auth state changes (e.g., session expiry, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthed(false)
        } else if (session) {
          setIsAuthed(true)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthed) return <Navigate to="/login" replace />

  return children
}
