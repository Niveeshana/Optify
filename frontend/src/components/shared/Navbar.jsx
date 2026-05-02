import { Activity, LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar({ activeTab, setActiveTab, tabs }) {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-display font-bold text-slate-800 text-sm">GlaucomaAI</span>
        </div>

        {/* Tabs */}
        {tabs && (
          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
                  ${activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
              <User size={13} className="text-primary-600" />
            </div>
            <span className="text-sm text-slate-600 font-medium">
              {user?.full_name || user?.email?.split('@')[0]}
            </span>
          </div>
          <button onClick={signOut} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
