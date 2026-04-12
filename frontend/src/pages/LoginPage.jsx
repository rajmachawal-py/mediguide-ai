/**
 * MediGuide AI — LoginPage
 * Full OTP-based phone login using Supabase Auth.
 *
 * Flow: Language Select → Phone Input → OTP Verification → Redirect to /chat
 * Also supports "Continue as Guest" for demo/testing.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, signInWithOtp, verifyOtp } from '../services/supabase'
import { FiPhone, FiShield, FiArrowRight, FiLoader, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

const RESEND_COOLDOWN = 60 // seconds

export default function LoginPage() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState(localStorage.getItem('mediguide_lang') || 'hi')
  const [step, setStep] = useState('phone')   // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef([])

  // Check if already logged in
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) navigate('/chat', { replace: true })
    }
    check()
  }, [navigate])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleLanguageSelect = (lang) => {
    setLanguage(lang)
    localStorage.setItem('mediguide_lang', lang)
  }

  const handleSkipLogin = () => {
    localStorage.setItem('mediguide_guest', 'true')
    navigate('/chat')
  }

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\s/g, '')
    if (cleanPhone.length < 10) {
      setError(language === 'hi' ? 'कृपया सही फ़ोन नंबर दर्ज करें' : 'Please enter a valid phone number')
      return
    }

    setLoading(true)
    setError('')

    const fullPhone = cleanPhone.startsWith('+91') ? cleanPhone : `+91${cleanPhone}`

    try {
      const { data, error: otpError } = await signInWithOtp(fullPhone)

      if (otpError) {
        setError(otpError.message || 'Failed to send OTP')
        return
      }

      setStep('otp')
      setCountdown(RESEND_COOLDOWN)
      toast.success(
        language === 'hi' ? `OTP भेजा गया: ${fullPhone}` : `OTP sent to ${fullPhone}`,
        { icon: '📱' }
      )
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setError(language === 'hi' ? 'कृपया 6 अंकों का OTP दर्ज करें' : 'Please enter the 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    const fullPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\s/g, '')}`

    try {
      const { data, error: verifyError } = await verifyOtp(fullPhone, code)

      if (verifyError) {
        setError(verifyError.message || 'Invalid OTP')
        return
      }

      toast.success(
        language === 'hi' ? 'लॉगिन सफल! 🎉' : 'Login successful! 🎉',
        { icon: '✅' }
      )

      // Remove guest flag if it was set
      localStorage.removeItem('mediguide_guest')

      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  // OTP input handler — auto-advance focus
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // digits only
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto submit when all 6 digits entered
    if (index === 5 && value) {
      const code = newOtp.join('')
      if (code.length === 6) {
        setTimeout(() => handleVerifyOtp(), 200)
      }
    }
  }

  // Handle backspace in OTP inputs
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return
    setOtp(['', '', '', '', '', ''])
    await handleSendOtp()
  }

  const t = {
    hi: {
      title: 'MediGuide AI',
      subtitle: 'आपका AI स्वास्थ्य सहायक — हिंदी, मराठी और अंग्रेज़ी में',
      chooseLang: 'अपनी भाषा चुनें',
      phoneLabel: 'फ़ोन नंबर दर्ज करें',
      phonePlaceholder: '98765 43210',
      sendOtp: 'OTP भेजें',
      verifyOtp: 'OTP सत्यापित करें',
      otpSentTo: 'OTP भेजा गया:',
      resend: 'फिर से भेजें',
      resendIn: 'फिर से भेजें:',
      guestMode: 'बिना लॉगिन जारी रखें →',
      guestNote: 'अतिथि मोड — चैट इतिहास सेव नहीं होगा',
      changePhone: '← नंबर बदलें',
    },
    mr: {
      title: 'MediGuide AI',
      subtitle: 'तुमचा AI आरोग्य सहाय्यक — हिंदी, मराठी आणि इंग्रजी मध्ये',
      chooseLang: 'तुमची भाषा निवडा',
      phoneLabel: 'फोन नंबर प्रविष्ट करा',
      phonePlaceholder: '98765 43210',
      sendOtp: 'OTP पाठवा',
      verifyOtp: 'OTP सत्यापित करा',
      otpSentTo: 'OTP पाठवला:',
      resend: 'पुन्हा पाठवा',
      resendIn: 'पुन्हा पाठवा:',
      guestMode: 'लॉगिन शिवाय सुरू करा →',
      guestNote: 'अतिथी मोड — चॅट इतिहास जतन होणार नाही',
      changePhone: '← नंबर बदला',
    },
    en: {
      title: 'MediGuide AI',
      subtitle: 'Your AI Health Assistant — in Hindi, Marathi & English',
      chooseLang: 'Choose your language',
      phoneLabel: 'Enter your phone number',
      phonePlaceholder: '98765 43210',
      sendOtp: 'Send OTP',
      verifyOtp: 'Verify OTP',
      otpSentTo: 'OTP sent to',
      resend: 'Resend',
      resendIn: 'Resend in',
      guestMode: 'Continue without login →',
      guestNote: 'Guest mode — chat history won\'t be saved',
      changePhone: '← Change number',
    },
  }

  const text = t[language] || t.en

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="text-center space-y-4 mb-10 animate-fade-in">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center text-5xl shadow-2xl shadow-primary-600/10">
          🏥
        </div>
        <h1 className="text-3xl font-extrabold gradient-text">{text.title}</h1>
        <p className="text-surface-400 text-sm max-w-xs mx-auto leading-relaxed">
          {text.subtitle}
        </p>
      </div>

      {/* Language Selection */}
      <div className="w-full max-w-xs space-y-3 mb-8 animate-slide-up">
        <p className="text-xs text-surface-400 text-center uppercase tracking-wider">
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
              className={`py-3 rounded-xl text-center transition-all ${
                language === lang.code
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 scale-105'
                  : 'glass-card text-surface-300 hover:text-white'
              }`}
            >
              <span className="block text-lg font-bold">{lang.label}</span>
              <span className="block text-[10px] opacity-60">{lang.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Phone Input Step */}
      {step === 'phone' && (
        <div className="w-full max-w-xs space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <label className="block text-xs text-surface-300 font-medium">
            <FiPhone className="inline w-3 h-3 mr-1.5" />
            {text.phoneLabel}
          </label>

          <div className="flex items-center gap-2">
            {/* +91 prefix */}
            <div className="flex-shrink-0 px-3 py-3 rounded-xl bg-surface-800/80 border border-surface-700/50 text-surface-300 text-sm font-semibold">
              🇮🇳 +91
            </div>
            {/* Phone input */}
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/[^\d\s]/g, ''))
                setError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              placeholder={text.phonePlaceholder}
              maxLength={12}
              autoFocus
              className="flex-1 bg-surface-800/80 text-white placeholder-surface-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 border border-surface-700/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 animate-fade-in">{error}</p>
          )}

          <button
            onClick={handleSendOtp}
            disabled={loading || phone.replace(/\s/g, '').length < 10}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FiShield className="w-4 h-4" />
                {text.sendOtp}
              </>
            )}
          </button>
        </div>
      )}

      {/* OTP Verification Step */}
      {step === 'otp' && (
        <div className="w-full max-w-xs space-y-4 animate-slide-up">
          <div className="text-center space-y-1">
            <p className="text-xs text-surface-400">
              {text.otpSentTo}
            </p>
            <p className="text-sm font-bold text-white">
              +91 {phone.replace(/\s/g, '')}
            </p>
          </div>

          {/* OTP Input Boxes */}
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => otpRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                maxLength={1}
                autoFocus={i === 0}
                className={`w-11 h-13 text-center text-lg font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                  digit
                    ? 'bg-primary-600/10 border-primary-500/30 text-white'
                    : 'bg-surface-800/80 border-surface-700/50 text-surface-300'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center animate-fade-in">{error}</p>
          )}

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.join('').length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                {text.verifyOtp}
              </>
            )}
          </button>

          {/* Resend + Change Number */}
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError('') }}
              className="text-surface-400 hover:text-white transition-colors"
            >
              {text.changePhone}
            </button>
            <button
              onClick={handleResend}
              disabled={countdown > 0}
              className={`transition-colors ${
                countdown > 0
                  ? 'text-surface-500 cursor-not-allowed'
                  : 'text-primary-400 hover:text-primary-300'
              }`}
            >
              {countdown > 0
                ? `${text.resendIn} ${countdown}s`
                : text.resend
              }
            </button>
          </div>
        </div>
      )}

      {/* Guest Mode Separator */}
      <div className="w-full max-w-xs mt-8 space-y-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-700/50" />
          <span className="text-[10px] text-surface-500 uppercase tracking-wider">
            {language === 'hi' ? 'या' : 'or'}
          </span>
          <div className="flex-1 h-px bg-surface-700/50" />
        </div>

        <button
          onClick={handleSkipLogin}
          className="w-full px-4 py-3 rounded-xl bg-surface-800/40 text-surface-300 hover:text-white hover:bg-surface-800/70 transition-all text-sm border border-surface-700/30 text-center"
        >
          {text.guestMode}
        </button>
        <p className="text-[10px] text-surface-500 text-center">
          {text.guestNote}
        </p>
      </div>
    </div>
  )
}
