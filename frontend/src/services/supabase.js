/**
 * MediGuide AI — Supabase Client
 * Singleton client for auth and database operations.
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

/** Sign in with OTP (phone-based login). */
export async function signInWithOtp(phone) {
  const { data, error } = await supabase.auth.signInWithOtp({ phone })
  return { data, error }
}

/** Verify OTP code. */
export async function verifyOtp(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  return { data, error }
}

/** Sign out. */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}
