import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, AlertTriangle, CheckCircle2, Info, Eye, Zap } from 'lucide-react'
import Navbar from '../components/shared/Navbar'
import api from '../utils/api'

export default function Screen2Results() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [result, setResult] = useState(location.state?.result || null)
  const [loading, setLoading] = useState(!location.state?.result)

  useEffect(() => {
    if (!result) {
      api.get(`/api/diagnoses/${id}`)
        .then(({ data }) => setResult({
          id: data.id,
          label: data.prediction,
          confidence: data.confidence,
          gradcam_b64: null,
          image_url: data.image_url,
          gradcam_url: data.gradcam_url,
          created_at: data.created_at,
        }))
        .catch(() => navigate('/upload'))
        .finally(() => setLoading(false))
    }
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full spinner" />
    </div>
  )

  if (!result) return null

  const isPositive = result.label === 'GON+'
  const confidencePct = Math.round(result.confidence * 100)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <button onClick={() => navigate('/upload')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition">
          <ArrowLeft size={16} /> New analysis
        </button>

        {/* Verdict banner */}
        <div className={`rounded-2xl p-6 border-2 ${isPositive
          ? 'bg-red-50 border-red-200'
          : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
              ${isPositive ? 'bg-red-100' : 'bg-green-100'}`}>
              {isPositive
                ? <AlertTriangle className="text-red-500" size={28} />
                : <CheckCircle2 className="text-green-500" size={28} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-2xl font-bold text-slate-800">
                  {isPositive ? 'GON+ Detected' : 'GON− Not Detected'}
                </h2>
                <span className={isPositive ? 'badge-positive' : 'badge-negative'}>
                  {isPositive ? 'Glaucomatous' : 'Non-Glaucomatous'}
                </span>
              </div>
              <p className={`mt-2 text-sm ${isPositive ? 'text-red-700' : 'text-green-700'}`}>
                {isPositive
                  ? 'Signs consistent with Glaucoma Optic Neuropathy were detected. Please consult your ophthalmologist promptly.'
                  : 'No significant signs of GON were detected in this image. Continue regular screening.'}
              </p>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-600">Model confidence</span>
              <span className={isPositive ? 'text-red-700' : 'text-green-700'}>{confidencePct}%</span>
            </div>
            <div className="h-2.5 bg-white rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full bar-fill ${isPositive ? 'bg-red-400' : 'bg-green-400'}`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Original */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-slate-400" />
              <h3 className="font-semibold text-slate-700 text-sm">Original Fundus Image</h3>
            </div>
            {result.image_url ? (
              <img src={result.image_url} alt="Fundus" className="w-full rounded-xl object-contain max-h-64" />
            ) : (
              <div className="h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                Image not available
              </div>
            )}
          </div>

          {/* Grad-CAM */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-amber-500" />
              <h3 className="font-semibold text-slate-700 text-sm">Grad-CAM Explanation</h3>
            </div>
            {(result.gradcam_b64 || result.gradcam_url) ? (
              <img
                src={result.gradcam_b64 ? `data:image/png;base64,${result.gradcam_b64}` : result.gradcam_url}
                alt="Grad-CAM heatmap"
                className="w-full rounded-xl object-contain max-h-64"
              />
            ) : (
              <div className="h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                Heatmap not available
              </div>
            )}
          </div>
        </div>

        {/* Explanation */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-primary-500" />
            <h3 className="font-semibold text-slate-800">How the Decision Was Made</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-primary-400 rounded-full mt-1.5 flex-shrink-0" />
              <p>
                <strong className="text-slate-700">Deep Learning Model:</strong> The AI analyzed your fundus image using a convolutional neural network trained on the Hillel Yaffe Glaucoma Dataset (747 annotated images with gold-standard clinical labels).
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
              <p>
                <strong className="text-slate-700">Grad-CAM Heatmap:</strong> The heatmap above shows which parts of your image most influenced the decision. <span className="text-red-600 font-medium">Red/warm areas</span> indicate high attention — typically around the optic disc, the primary site of glaucomatous changes.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
              <p>
                <strong className="text-slate-700">Confidence Score ({confidencePct}%):</strong> Represents how certain the model is in its classification. Higher scores indicate stronger evidence either for or against GON in the image features.
              </p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 font-medium text-xs mb-1">⚠️ Important Disclaimer</p>
              <p className="text-amber-700 text-xs">
                This AI screening result is for informational purposes only. It does not constitute a medical diagnosis. Please share this result with your ophthalmologist, who will conduct a comprehensive examination including IOP measurement, visual field testing, and OCT before any clinical decision is made.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/upload')} className="btn-outline">
            Analyze Another Image
          </button>
          <button onClick={() => window.print()} className="btn-outline">
            Print / Save Report
          </button>
        </div>
      </main>
    </div>
  )
}
