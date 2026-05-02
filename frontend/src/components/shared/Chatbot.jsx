import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Trash2, BookOpen } from 'lucide-react'
import api from '../../utils/api'

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`chat-bubble flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
        ${isUser ? 'bg-primary-100' : 'bg-slate-100'}`}>
        {isUser
          ? <User size={14} className="text-primary-600" />
          : <Bot size={14} className="text-slate-500" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-primary-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
          {msg.content}
        </div>
        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {msg.sources.map((s, i) => (
              <span key={i} title={s.content}
                className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                <BookOpen size={10} /> Source {i + 1}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 chat-bubble">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
        <Bot size={14} className="text-slate-500" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const SUGGESTED = [
  'What is glaucoma?',
  'What does GON+ mean?',
  'How is Grad-CAM used?',
  'What are glaucoma risk factors?',
]

export default function Chatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function loadHistory() {
    try {
      const { data } = await api.get('/api/chat/history')
      if (data.messages.length > 0) {
        setMessages(data.messages.map(m => ({
          role: m.role,
          content: m.content,
          sources: m.sources || [],
        })))
      }
      setHistoryLoaded(true)
    } catch { setHistoryLoaded(true) }
  }

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, sources: [] }])
    setLoading(true)
    try {
      const { data } = await api.post('/api/chat/message', { message: msg })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        sources: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  async function clearHistory() {
    if (!confirm('Clear all chat history?')) return
    await api.delete('/api/chat/history')
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Glaucoma Assistant</h3>
            <p className="text-xs text-primary-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" /> RAG-powered
            </p>
          </div>
        </div>
        <button onClick={clearHistory} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!historyLoaded && (
          <div className="text-center text-slate-400 text-sm py-8">Loading history…</div>
        )}
        {historyLoaded && messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">Ask me anything about glaucoma</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs text-left px-3 py-2 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 rounded-xl border border-slate-200 hover:border-primary-200 transition text-slate-600">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100">
        <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
          <input
            className="input flex-1 text-sm"
            placeholder="Ask about glaucoma, your results, treatment…"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="btn-primary px-3 py-2.5 rounded-xl">
            <Send size={16} />
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2 text-center">
          AI assistant — always consult a qualified ophthalmologist
        </p>
      </div>
    </div>
  )
}
