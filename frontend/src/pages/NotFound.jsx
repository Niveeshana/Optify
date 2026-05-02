import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Activity className="text-primary-500" size={28} />
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-800 mb-2">404</h1>
        <p className="text-slate-500 mb-6">Page not found.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
      </div>
    </div>
  )
}
