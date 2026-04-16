/**
 * MediGuide AI — App Root
 * React Router setup with route guards.
 * 
 * Flow: Login → Consent → Profile Onboarding → App
 * - Consent is ALWAYS required first (DPDPA)
 * - Profile onboarding is required for ALL users (logged-in + guest) until filled
 * - Only after both are complete, user can access the app
 */

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import Navbar from './components/shared/Navbar'
import ProtectedRoute from './components/shared/ProtectedRoute'
import ProfileOnboarding from './components/shared/ProfileOnboarding'
import ConsentModal, { hasConsent } from './components/shared/ConsentModal'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import HospitalPage from './pages/HospitalPage'
import ProfilePage from './pages/ProfilePage'
import IndoorMapPage from './pages/IndoorMapPage'
import CaregiverDashboard from './pages/CaregiverDashboard'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'

/** Layout wrapper with Navbar for authenticated routes. */
function AppLayout({ children }) {
  const { language } = useLanguage()
  return (
    <div className="min-h-screen pb-16">
      {children}
      <Navbar language={language} />
    </div>
  )
}

/**
 * Check if the user has completed their profile.
 * Requires: name, age, gender all filled in localStorage.
 */
function isProfileComplete() {
  const name = localStorage.getItem('mediguide_patient_name')
  const age = localStorage.getItem('mediguide_patient_age')
  const gender = localStorage.getItem('mediguide_patient_gender')
  return !!(name && age && gender)
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: '12px',
              border: '1px solid #334155',
              fontSize: '13px',
            },
          }}
        />
        <AppContent />
      </BrowserRouter>
    </LanguageProvider>
  )
}

/**
 * Inner component that can use useLocation() to decide
 * when to show consent and profile onboarding modals.
 */
function AppContent() {
  const location = useLocation()
  const [consentGiven, setConsentGiven] = useState(hasConsent())
  const [profileComplete, setProfileComplete] = useState(isProfileComplete())

  // Re-check consent and profile when localStorage changes
  useEffect(() => {
    const recheck = () => {
      setConsentGiven(hasConsent())
      setProfileComplete(isProfileComplete())
    }
    window.addEventListener('storage', recheck)
    window.addEventListener('focus', recheck)
    return () => {
      window.removeEventListener('storage', recheck)
      window.removeEventListener('focus', recheck)
    }
  }, [])

  // Re-check profile completeness on route changes
  // (e.g., after guest login navigates from /login to /chat)
  useEffect(() => {
    setProfileComplete(isProfileComplete())
  }, [location.pathname])

  // Only show modals on protected pages, NOT on /login or /privacy
  const isProtectedPage = location.pathname !== '/login' && location.pathname !== '/privacy'

  return (
    <>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />

        {/* Protected Routes with Navbar */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppLayout><ChatPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospitals"
          element={
            <ProtectedRoute>
              <AppLayout><HospitalPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout><ProfilePage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/map/:hospitalId"
          element={
            <ProtectedRoute>
              <AppLayout><IndoorMapPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/caregiver"
          element={
            <ProtectedRoute>
              <AppLayout><CaregiverDashboard /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Step 1: DPDPA Consent Modal — shown on protected pages for new users */}
      {isProtectedPage && !consentGiven && (
        <ConsentModalWrapper onAccept={() => setConsentGiven(true)} />
      )}

      {/* Step 2: Profile Onboarding — shown AFTER consent, on protected pages */}
      {isProtectedPage && consentGiven && !profileComplete && (
        <ProfileOnboarding onComplete={() => setProfileComplete(true)} />
      )}
    </>
  )
}

/** Wrapper so ConsentModal can access LanguageContext */
function ConsentModalWrapper({ onAccept }) {
  const { language } = useLanguage()
  return <ConsentModal language={language} onAccept={onAccept} />
}
