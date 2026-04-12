/**
 * MediGuide AI — App Root
 * React Router setup with route guards.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/shared/Navbar'
import ProtectedRoute from './components/shared/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import HospitalPage from './pages/HospitalPage'
import ProfilePage from './pages/ProfilePage'

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

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
