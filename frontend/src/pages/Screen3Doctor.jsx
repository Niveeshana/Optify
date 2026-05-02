import { useState, useEffect } from 'react'
import { Users, Activity, AlertCircle, CheckCircle2, Clock, MessageSquare, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Navbar from '../components/shared/Navbar'
import Chatbot from '../components/shared/Chatbot'
import api from '../utils/api'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'patients',  label: 'Patients',  icon: Users },
  { id: 'diagnoses', label: 'Diagnoses', icon: Eye },
  { id: 'chatbot',   label: 'Assistant', icon: MessageSquare },
]

function StatCard({ icon: Icon, label, value, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    red:     'bg-red-50 text-red-600',
    green:   'bg-green-50 text-green-600',
    amber:   'bg-amber-50 text-amber-600',
    slate:   'bg-slate-100 text-slate-600',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function DiagnosisRow({ d, onAddNote }) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState(d.notes || '')
  const [saving, setSaving] = useState(false)
  const isPos = d.prediction === 'GON+'

  async function saveNote() {
    setSaving(true)
    try {
      await api.patch(`/api/dashboard/diagnoses/${d.id}/review`, { notes: note })
      alert('Review saved.')
      setExpanded(false)
      onAddNote()
    } catch { alert('Failed to save.') }
    finally { setSaving(false) }
  }

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {d.profiles?.full_name || d.profiles?.email || 'Unknown Patient'}
          </p>
          <p className="text-xs text-slate-400">{new Date(d.created_at).toLocaleString()}</p>
        </div>
        <span className={isPos ? 'badge-positive' : 'badge-negative'}>
          {isPos ? '⚠ GON+' : '✓ GON−'}
        </span>
        <span className="text-xs text-slate-500 w-12 text-right">
          {Math.round(d.confidence * 100)}%
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${d.reviewed_by ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {d.reviewed_by ? 'Reviewed' : 'Pending'}
        </span>
        {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </div>

      {expanded && (
        <div className="px-5 pb-4 bg-slate-50 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {d.image_url && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Fundus Image</p>
                <img src={d.image_url} alt="Fundus" className="rounded-xl max-h-40 object-contain w-full bg-white border border-slate-200" />
              </div>
            )}
            {d.gradcam_url && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Grad-CAM</p>
                <img src={d.gradcam_url} alt="Grad-CAM" className="rounded-xl max-h-40 object-contain w-full bg-white border border-slate-200" />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Doctor Notes</p>
            <textarea
              className="input text-xs h-20 resize-none"
              placeholder="Add clinical notes…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <button onClick={saveNote} disabled={saving} className="btn-primary text-sm py-2">
            {saving ? 'Saving…' : 'Save Review'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Screen3Doctor() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [patients, setPatients] = useState([])
  const [diagnoses, setDiagnoses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [s, p, d] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/dashboard/patients'),
        api.get('/api/dashboard/diagnoses'),
      ])
      setStats(s.data)
      setPatients(p.data.patients)
      setDiagnoses(d.data.diagnoses)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const pieData = stats ? [
    { name: 'GON+', value: stats.gon_positive  },
    { name: 'GON−', value: stats.gon_negative  },
  ] : []

  const PIE_COLORS = ['#ef4444', '#22c55e']

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-800">Overview</h2>
              <p className="text-slate-500 mt-1">Clinical summary — all patients</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card h-24 bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : stats && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users}        label="Total Patients"   value={stats.total_patients}  color="primary" />
                  <StatCard icon={Activity}     label="Total Diagnoses"  value={stats.total_diagnoses} color="slate" />
                  <StatCard icon={AlertCircle}  label="GON+ Cases"       value={stats.gon_positive}    color="red" />
                  <StatCard icon={Clock}        label="Pending Review"   value={stats.pending_review}  color="amber" />
                </div>

                {/* Chart */}
                <div className="grid lg:grid-cols-3 gap-5">
                  <div className="card lg:col-span-2">
                    <h3 className="font-semibold text-slate-700 mb-4 text-sm">Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={pieData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <h3 className="font-semibold text-slate-700 mb-4 text-sm">GON Breakdown</h3>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                          {d.name}: {d.value}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* PATIENTS */}
        {activeTab === 'patients' && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-800">Patients</h2>
              <p className="text-slate-500 mt-1">{patients.length} registered patients</p>
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Name', 'Email', 'Gender', 'DOB', 'Joined'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-medium text-slate-800">{p.full_name || '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{p.email}</td>
                      <td className="px-5 py-3 text-slate-500 capitalize">{p.gender || '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{p.date_of_birth || '—'}</td>
                      <td className="px-5 py-3 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {patients.length === 0 && (
                <div className="text-center py-12 text-slate-400">No patients yet.</div>
              )}
            </div>
          </div>
        )}

        {/* DIAGNOSES */}
        {activeTab === 'diagnoses' && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-800">Diagnoses</h2>
              <p className="text-slate-500 mt-1">{diagnoses.length} total — click to expand and review</p>
            </div>
            <div className="card p-0 overflow-hidden">
              {diagnoses.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No diagnoses yet.</div>
              ) : (
                diagnoses.map(d => (
                  <DiagnosisRow key={d.id} d={d} onAddNote={fetchAll} />
                ))
              )}
            </div>
          </div>
        )}

        {/* CHATBOT */}
        {activeTab === 'chatbot' && (
          <div>
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold text-slate-800">AI Clinical Assistant</h2>
              <p className="text-slate-500 mt-1">RAG-powered glaucoma knowledge base</p>
            </div>
            <div style={{ height: 'calc(100vh - 14rem)' }}>
              <Chatbot />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
