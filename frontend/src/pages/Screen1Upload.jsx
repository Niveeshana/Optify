import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Eye, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react'
import Navbar from '../components/shared/Navbar'
import Chatbot from '../components/shared/Chatbot'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

const TABS = [
  { id: 'upload',  label: 'Diagnose', icon: Eye },
  { id: 'chatbot', label: 'AI Assistant', icon: MessageSquare },
]

export default function Screen1Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upload')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFile(f) {
    if (!f) return
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)) {
      setError('Please upload a JPEG or PNG image.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.')
      return
    }
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/api/diagnoses/predict', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate(`/results/${data.id}`, { state: { result: data } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'upload' && (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Upload Panel */}
            <div className="lg:col-span-3 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-800">Glaucoma Screening</h2>
                <p className="text-slate-500 mt-1">Upload a fundus image for AI-powered glaucoma detection</p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer
                  ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'}`}
                onClick={() => document.getElementById('file-input').click()}
              >
                {preview ? (
                  <div className="space-y-3">
                    <img src={preview} alt="Fundus preview"
                      className="w-full max-h-64 object-contain rounded-xl mx-auto" />
                    <p className="text-sm text-slate-500">{file?.name}</p>
                    <p className="text-xs text-primary-600 font-medium">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="text-primary-500" size={28} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">Drop your fundus image here</p>
                      <p className="text-sm text-slate-400 mt-1">or click to browse — JPEG/PNG, max 10 MB</p>
                    </div>
                  </div>
                )}
                <input id="file-input" type="file" accept="image/jpeg,image/png"
                  className="hidden" onChange={e => handleFile(e.target.files[0])} />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner" />
                    Analyzing image…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Eye size={18} /> Analyze Fundus Image
                  </span>
                )}
              </button>
            </div>

            {/* Info Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-3">How it works</h3>
                <div className="space-y-3">
                  {[
                    { n: 1, text: 'Upload a digital fundus image (DFI)' },
                    { n: 2, text: 'AI model analyzes for signs of GON' },
                    { n: 3, text: 'Get prediction + confidence score' },
                    { n: 4, text: 'View Grad-CAM explanation heatmap' },
                  ].map(step => (
                    <div key={step.n} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {step.n}
                      </div>
                      <p className="text-sm text-slate-600">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card bg-amber-50 border-amber-200">
                <div className="flex gap-2">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Screening tool only</p>
                    <p className="text-xs text-amber-700 mt-1">
                      This AI provides screening assistance. All results must be reviewed by a qualified ophthalmologist before any clinical decision is made.
                    </p>
                  </div>
                </div>
              </div>

              {user && (
                <div className="card bg-primary-50 border-primary-200">
                  <div className="flex gap-2">
                    <CheckCircle size={16} className="text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary-800">Signed in as</p>
                      <p className="text-xs text-primary-700 mt-0.5">{user.full_name || user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chatbot' && (
          <div className="h-[calc(100vh-8rem)]">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold text-slate-800">AI Assistant</h2>
              <p className="text-slate-500 mt-1">Ask questions about glaucoma, your diagnosis, or eye health</p>
            </div>
            <div className="h-[calc(100%-4rem)]">
              <Chatbot />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
