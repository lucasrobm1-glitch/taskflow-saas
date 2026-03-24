import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext.jsx'

export default function NotificationBell() {
  const { notifications, unread, markAllRead, markRead, clear } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = () => {
    setOpen(o => !o)
    if (!open && unread > 0) markAllRead()
  }

  const fmt = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000)
    if (diff < 60) return 'agora'
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={toggle}
        title="Notificações"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8, background: open ? 'rgba(99,102,241,0.15)' : 'transparent',
          border: 'none', cursor: 'pointer', position: 'relative', fontSize: 18
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700,
            borderRadius: 999, minWidth: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px'
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: '110%', left: 0,
          width: 300, background: '#1e1e3a', border: '1px solid #2a2a4a',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #2a2a4a' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>Notificações</span>
            {notifications.length > 0 && (
              <button onClick={clear} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                Limpar
              </button>
            )}
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
                Nenhuma notificação
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 16px',
                    borderBottom: '1px solid #2a2a4a', cursor: 'default',
                    background: n.read ? 'transparent' : 'rgba(99,102,241,0.07)',
                    transition: 'background 0.2s'
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>{n.text}</p>
                    <span style={{ fontSize: 11, color: '#475569' }}>{fmt(n.at)}</span>
                  </div>
                  {!n.read && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
