import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const API = import.meta.env.VITE_API_URL || ''

const apiFetch = (path) => {
  const token = localStorage.getItem('token')
  return fetch(API + path, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}

export default function FloatingChat() {
  const { user } = useAuth()
  const socket = useSocket()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('geral') // 'geral' | projectId
  const [projects, setProjects] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => {
    apiFetch('/api/projects').then(d => Array.isArray(d) && setProjects(d)).catch(() => {})
  }, [])

  useEffect(() => {
    const projectId = tab === 'geral' ? null : tab
    const url = projectId ? `/api/messages?projectId=${projectId}` : '/api/messages'
    apiFetch(url).then(d => Array.isArray(d) && setMessages(d)).catch(() => {})
    if (projectId) socket?.emit('join:project', projectId)
  }, [tab, socket])

  useEffect(() => {
    if (!socket) return
    const handler = (msg) => {
      const msgProject = msg.project || null
      const currentProject = tab === 'geral' ? null : tab
      if (String(msgProject) === String(currentProject)) {
        setMessages(prev => [...prev, msg])
        if (!open) setUnread(u => u + 1)
      }
    }
    socket.on('chat:message', handler)
    return () => socket.off('chat:message', handler)
  }, [socket, tab, open])

  useEffect(() => {
    if (open) { setUnread(0); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  }, [open, messages])

  const send = (e) => {
    e.preventDefault()
    if (!text.trim() || !socket) return
    socket.emit('chat:message', { text: text.trim(), projectId: tab === 'geral' ? null : tab })
    setText('')
  }

  const fmt = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500 }}>
      {open && (
        <div style={{ position: 'absolute', bottom: 60, right: 0, width: 340, height: 460, background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>💬 Chat</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 10px', borderBottom: '1px solid #2a2a4a', overflowX: 'auto' }}>
            {[{ id: 'geral', label: '🌐 Geral' }, ...projects.map(p => ({ id: p._id, label: `${p.icon || '📋'} ${p.name}` }))].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', background: tab === t.id ? '#6366f1' : '#16213e', color: tab === t.id ? 'white' : '#94a3b8', fontWeight: tab === t.id ? 600 : 400 }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {messages.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>Nenhuma mensagem ainda 👋</div>}
            {messages.map((msg, i) => {
              const isMe = msg.sender?._id === user?._id || msg.sender === user?._id
              return (
                <div key={msg._id || i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6 }}>
                  {!isMe && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                      {msg.sender?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div style={{ maxWidth: '75%' }}>
                    {!isMe && <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, marginLeft: 2 }}>{msg.sender?.name}</div>}
                    <div style={{ background: isMe ? '#6366f1' : '#16213e', color: '#e2e8f0', padding: '6px 10px', borderRadius: isMe ? '10px 10px 3px 10px' : '10px 10px 10px 3px', fontSize: 13, wordBreak: 'break-word' }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2, textAlign: isMe ? 'right' : 'left' }}>{fmt(msg.createdAt)}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} style={{ padding: '8px 10px', borderTop: '1px solid #2a2a4a', display: 'flex', gap: 8 }}>
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Mensagem..."
              style={{ flex: 1, padding: '7px 10px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
            <button type="submit" disabled={!text.trim()}
              style={{ padding: '7px 12px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', cursor: text.trim() ? 'pointer' : 'not-allowed', opacity: text.trim() ? 1 : 0.5, fontSize: 13 }}>
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: 48, height: 48, borderRadius: '50%', background: '#6366f1', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 16px rgba(99,102,241,0.4)', position: 'relative' }}>
        {open ? '×' : '💬'}
        {!open && unread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}
