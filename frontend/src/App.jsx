/**
 * MediGuide AI — App Root
 * React Router setup with route guards.
 */

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/shared/Navbar'
import ProtectedRoute from './components/shared/ProtectedRoute'
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
  const language = localStorage.getItem('mediguide_lang') || 'en'
  return (
    <div className="min-h-screen pb-16">
      {children}
      <Navbar language={language} />
    </div>
  )
}

export default function App() {
  const [consentGiven, setConsentGiven] = useState(hasConsent())
  const language = localStorage.getItem('mediguide_lang') || 'en'

  // Re-check consent when localStorage changes (e.g. consent withdrawn from ProfilePage)
  useEffect(() => {
    const handleStorage = () => setConsentGiven(hasConsent())
    window.addEventListener('storage', handleStorage)
    // Also poll on focus (same-tab localStorage changes don't fire 'storage')
    const handleFocus = () => setConsentGiven(hasConsent())
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
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

      {/* DPDPA Consent Modal — shown on first use */}
      {!consentGiven && (
        <ConsentModal
          language={language}
          onAccept={() => setConsentGiven(true)}
        />
      )}
    </BrowserRouter>
  )
}
