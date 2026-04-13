/**
 * MediGuide AI — Supabase Client
 * Singleton client for auth and database operations.
 * Auth methods: Email/Password + Google OAuth (no phone verification).
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co', 
  supabaseAnonKey || 'dummy_key'
)

/** Get the current authenticated user, or null. */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Get the current session (includes JWT token). */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/** Sign up with email and password. */
export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

/** Sign in with email and password. */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/** Sign in with Google OAuth. */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/login',
    },
  })
  return { data, error }
}

/** Sign out. */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}
