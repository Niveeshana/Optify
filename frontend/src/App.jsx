import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Pages
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import Screen1Upload    from './pages/Screen1Upload'
import Screen2Results   from './pages/Screen2Results'
import Screen3Doctor    from './pages/Screen3Doctor'
import NotFound         from './pages/NotFound'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full spinner" />
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'patient') return <Navigate to="/upload" replace />
  return <Navigate to="/doctor" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<RootRedirect />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Patient screens */}
          <Route path="/upload" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Screen1Upload />
            </ProtectedRoute>
          } />
          <Route path="/results/:id" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Screen2Results />
            </ProtectedRoute>
          } />

          {/* Doctor / Admin */}
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <Screen3Doctor />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
