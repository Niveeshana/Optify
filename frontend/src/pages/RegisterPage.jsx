import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Activity, User, Stethoscope } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'patient' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.fullName, form.role)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="text-primary-600" size={28} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-slate-500 text-sm mb-6">We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.</p>
        <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">GlaucomaAI</h1>
            <p className="text-xs text-slate-400">Clinical Decision Support</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Create account</h2>
          <p className="text-sm text-slate-500 mb-6">Join GlaucomaAI</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { value: 'patient', label: 'Patient', Icon: User },
              { value: 'doctor',  label: 'Doctor',  Icon: Stethoscope },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, role: value }))}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition text-sm font-medium
                  ${form.role === value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input className="input" placeholder="Dr. Sarah Lee" value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" className="input" placeholder="min. 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
