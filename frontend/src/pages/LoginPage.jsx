/**
 * MediGuide AI — LoginPage
 * Email/Password + Google OAuth authentication using Supabase Auth.
 *
 * Flow: Language Select → Login / Sign-Up → Redirect to /chat
 * Also supports "Continue as Guest" for demo/testing.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, signInWithEmail, signUpWithEmail, signInWithGoogle } from '../services/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import { FiMail, FiLock, FiArrowRight, FiLoader, FiCheck, FiEye, FiEyeOff, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { language, changeLanguage } = useLanguage()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if already logged in + handle OAuth callback + handle email verification errors
  useEffect(() => {
    const handleAuth = async () => {
      // Handle email verification errors (e.g. expired link)
      if (window.location.hash && window.location.hash.includes('error=')) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const errorCode = hashParams.get('error_code')
        const errorDesc = hashParams.get('error_description')?.replace(/\+/g, ' ')

        if (errorCode === 'otp_expired') {
          setError(
            language === 'hi'
              ? 'ईमेल लिंक की समय सीमा समाप्त हो गई है। कृपया फिर से लॉगिन करें।'
              : language === 'mr'
                ? 'ईमेल लिंकची मुदत संपली आहे. कृपया पुन्हा लॉगिन करा.'
                : 'Email verification link has expired. Please log in again with your email and password.'
          )
        } else {
          setError(errorDesc || 'Authentication error. Please try again.')
        }

        // Clean the URL
        window.history.replaceState({}, '', '/login')
        return
      }

      // Handle OAuth PKCE code exchange (code is in URL after Google redirect)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error && data?.session) {
            window.history.replaceState({}, '', '/login')
            localStorage.removeItem('mediguide_guest')
            navigate('/chat', { replace: true })
            return
          }
        } catch (err) {
          console.error('OAuth code exchange failed:', err)
        }
      }

      // Check existing session (normal flow)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate('/chat', { replace: true })
        return
      }

      // Also check for hash-based tokens (older Supabase flow)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        setTimeout(async () => {
          const { data: { session: hashSession } } = await supabase.auth.getSession()
          if (hashSession) {
            localStorage.removeItem('mediguide_guest')
            navigate('/chat', { replace: true })
          }
        }, 500)
      }
    }

    handleAuth()

    // Listen for auth state changes as a safety net
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          localStorage.removeItem('mediguide_guest')
          navigate('/chat', { replace: true })
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [navigate])

  const handleLanguageSelect = (lang) => {
    changeLanguage(lang)
  }

  const handleSkipLogin = () => {
    localStorage.setItem('mediguide_guest', 'true')
    navigate('/chat')
  }

  // Validate email format
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Handle Email/Password Login
  const handleEmailLogin = async () => {
    if (!isValidEmail(email)) {
      setError(text.invalidEmail)
      return
    }
    if (password.length < 6) {
      setError(text.passwordTooShort)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await signInWithEmail(email, password)

      if (authError) {
        setError(authError.message || text.loginFailed)
        return
      }

      toast.success(text.loginSuccess, { icon: '✅' })
      localStorage.removeItem('mediguide_guest')
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err.message || text.somethingWrong)
    } finally {
      setLoading(false)
    }
  }

  // Handle Email/Password Sign-Up
  const handleEmailSignUp = async () => {
    if (!isValidEmail(email)) {
      setError(text.invalidEmail)
      return
    }
    if (password.length < 6) {
      setError(text.passwordTooShort)
      return
    }
    if (password !== confirmPassword) {
      setError(text.passwordMismatch)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await signUpWithEmail(email, password)

      if (authError) {
        setError(authError.message || text.signupFailed)
        return
      }

      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        setError(text.emailAlreadyExists)
        return
      }

      toast.success(text.signupSuccess, { icon: '🎉', duration: 5000 })

      // If Supabase returns a session, user is auto-confirmed → navigate
      if (data?.session) {
        localStorage.removeItem('mediguide_guest')
        navigate('/chat', { replace: true })
      }
    } catch (err) {
      setError(err.message || text.somethingWrong)
    } finally {
      setLoading(false)
    }
  }

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')

    try {
      const { data, error: authError } = await signInWithGoogle()

      if (authError) {
        setError(authError.message || text.googleFailed)
        setGoogleLoading(false)
      }
      // If successful, Supabase will redirect the user to Google 
      // and then back to our app. No need to navigate manually.
    } catch (err) {
      setError(err.message || text.somethingWrong)
      setGoogleLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'login') {
      handleEmailLogin()
    } else {
      handleEmailSignUp()
    }
  }

  const t = {
    hi: {
      title: 'MediGuide AI',
      subtitle: 'आपका AI स्वास्थ्य सहायक — हिंदी, मराठी और अंग्रेज़ी में',
      chooseLang: 'अपनी भाषा चुनें',
      loginTab: 'लॉगिन',
      signupTab: 'साइन अप',
      emailLabel: 'ईमेल',
      emailPlaceholder: 'your@email.com',
      passwordLabel: 'पासवर्ड',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'पासवर्ड पुष्टि करें',
      confirmPasswordPlaceholder: '••••••••',
      loginBtn: 'लॉगिन करें',
      signupBtn: 'खाता बनाएं',
      googleBtn: 'Google से जारी रखें',
      invalidEmail: 'कृपया सही ईमेल पता दर्ज करें',
      passwordTooShort: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए',
      passwordMismatch: 'पासवर्ड मेल नहीं खाते',
      loginFailed: 'लॉगिन विफल हुआ',
      signupFailed: 'साइन अप विफल हुआ',
      googleFailed: 'Google साइन इन विफल',
      somethingWrong: 'कुछ गलत हो गया',
      loginSuccess: 'लॉगिन सफल! 🎉',
      signupSuccess: 'खाता बनाया गया! कृपया अपना ईमेल सत्यापित करें।',
      emailAlreadyExists: 'यह ईमेल पहले से पंजीकृत है',
      guestMode: 'बिना लॉगिन जारी रखें →',
      guestNote: 'अतिथि मोड — चैट इतिहास सेव नहीं होगा',
      orDivider: 'या',
    },
    mr: {
      title: 'MediGuide AI',
      subtitle: 'तुमचा AI आरोग्य सहाय्यक — हिंदी, मराठी आणि इंग्रजी मध्ये',
      chooseLang: 'तुमची भाषा निवडा',
      loginTab: 'लॉगिन',
      signupTab: 'साइन अप',
      emailLabel: 'ईमेल',
      emailPlaceholder: 'your@email.com',
      passwordLabel: 'पासवर्ड',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'पासवर्ड पुष्टी करा',
      confirmPasswordPlaceholder: '••••••••',
      loginBtn: 'लॉगिन करा',
      signupBtn: 'खाते तयार करा',
      googleBtn: 'Google ने सुरू करा',
      invalidEmail: 'कृपया योग्य ईमेल पत्ता प्रविष्ट करा',
      passwordTooShort: 'पासवर्ड किमान 6 अक्षरांचा असावा',
      passwordMismatch: 'पासवर्ड जुळत नाहीत',
      loginFailed: 'लॉगिन अयशस्वी',
      signupFailed: 'साइन अप अयशस्वी',
      googleFailed: 'Google साइन इन अयशस्वी',
      somethingWrong: 'काहीतरी चूक झाली',
      loginSuccess: 'लॉगिन यशस्वी! 🎉',
      signupSuccess: 'खाते तयार केले! कृपया ईमेल सत्यापित करा।',
      emailAlreadyExists: 'हा ईमेल आधीच नोंदणीकृत आहे',
      guestMode: 'लॉगिन शिवाय सुरू करा →',
      guestNote: 'अतिथी मोड — चॅट इतिहास जतन होणार नाही',
      orDivider: 'किंवा',
    },
    en: {
      title: 'MediGuide AI',
      subtitle: 'Your AI Health Assistant — in Hindi, Marathi & English',
      chooseLang: 'Choose your language',
      loginTab: 'Login',
      signupTab: 'Sign Up',
      emailLabel: 'Email',
      emailPlaceholder: 'your@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: '••••••••',
      loginBtn: 'Log In',
      signupBtn: 'Create Account',
      googleBtn: 'Continue with Google',
      invalidEmail: 'Please enter a valid email address',
      passwordTooShort: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      loginFailed: 'Login failed',
      signupFailed: 'Sign up failed',
      googleFailed: 'Google sign in failed',
      somethingWrong: 'Something went wrong',
      loginSuccess: 'Login successful! 🎉',
      signupSuccess: 'Account created! Please check your email to verify.',
      emailAlreadyExists: 'This email is already registered',
      guestMode: 'Continue without login →',
      guestNote: 'Guest mode — chat history won\'t be saved',
      orDivider: 'or',
    },
  }

  const text = t[language] || t.en

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-surface">
      {/* Logo — Editorial */}
      <div className="text-center space-y-4 mb-10 animate-fade-in">
        <div className="w-24 h-24 mx-auto rounded-clinical-xl bg-primary-fixed/40 flex items-center justify-center text-5xl shadow-clinical-lg">
          🏥
        </div>
        <h1 className="text-3xl font-extrabold font-display gradient-text">{text.title}</h1>
        <p className="text-on-surface-variant text-sm max-w-xs mx-auto leading-relaxed">
          {text.subtitle}
        </p>
      </div>

      {/* Language Selection */}
      <div className="w-full max-w-xs space-y-3 mb-8 animate-slide-up">
        <p className="text-clinical-meta text-center">
          {text.chooseLang}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'hi', label: 'हिंदी', sub: 'Hindi' },
            { code: 'mr', label: 'मराठी', sub: 'Marathi' },
            { code: 'en', label: 'English', sub: 'English' },
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`py-3 rounded-clinical text-center transition-all duration-200 ${
                language === lang.code
                  ? 'bg-primary-container text-white shadow-clinical-md scale-105'
                  : 'clinical-card text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="block text-lg font-bold font-display">{lang.label}</span>
              <span className="block text-[10px] opacity-60">{lang.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Login / Sign-Up Tabs */}
      <div className="w-full max-w-xs animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex rounded-clinical overflow-hidden mb-6 bg-surface-container">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
              mode === 'login'
                ? 'bg-primary-container text-white shadow-clinical'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {text.loginTab}
          </button>
          <button
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-primary-container text-white shadow-clinical'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {text.signupTab}
          </button>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs text-on-surface-variant font-medium">
              <FiMail className="inline w-3 h-3 mr-1.5" />
              {text.emailLabel}
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder={text.emailPlaceholder}
              autoComplete="email"
              autoFocus
              className="clinical-input"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs text-on-surface-variant font-medium">
              <FiLock className="inline w-3 h-3 mr-1.5" />
              {text.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder={text.passwordPlaceholder}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="clinical-input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (sign-up only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-xs text-on-surface-variant font-medium">
                <FiLock className="inline w-3 h-3 mr-1.5" />
                {text.confirmPasswordLabel}
              </label>
              <input
                id="auth-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                placeholder={text.confirmPasswordPlaceholder}
                autoComplete="new-password"
                className="clinical-input"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-error animate-fade-in">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email || password.length < 6}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? <FiArrowRight className="w-4 h-4" /> : <FiUser className="w-4 h-4" />}
                {mode === 'login' ? text.loginBtn : text.signupBtn}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-outline-variant/40" />
          <span className="text-clinical-meta">
            {text.orDivider}
          </span>
          <div className="flex-1 h-px bg-outline-variant/40" />
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-clinical bg-white text-on-surface hover:shadow-clinical-md transition-all text-sm font-medium shadow-clinical disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {text.googleBtn}
        </button>
      </div>

      {/* Guest Mode Separator */}
      <div className="w-full max-w-xs mt-6 space-y-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-outline-variant/40" />
          <span className="text-clinical-meta">
            {text.orDivider}
          </span>
          <div className="flex-1 h-px bg-outline-variant/40" />
        </div>

        <button
          onClick={handleSkipLogin}
          className="w-full px-4 py-3 rounded-clinical bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-primary-fixed/20 transition-all text-sm text-center font-medium"
        >
          {text.guestMode}
        </button>
        <p className="text-[10px] text-outline text-center">
          {text.guestNote}
        </p>
      </div>
    </div>
  )
}
