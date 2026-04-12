import { Navigate } from 'react-router-dom'

/** Simple guest auth check — Phase 4 will use Supabase session. */
export default function ProtectedRoute({ children }) {
  const isGuest = localStorage.getItem('mediguide_guest') === 'true'
  if (!isGuest) return <Navigate to="/login" replace />
  return children
}
