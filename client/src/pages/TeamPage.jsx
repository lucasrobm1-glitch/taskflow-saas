import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import usePageTitle from '../hooks/usePageTitle.js'

const ROLE_COLORS = { owner: '#f59e0b', admin: '#6366f1', member: '#10b981', viewer: '#94a3b8' }
const API = import.meta.env.VITE_API_URL || ''

const apiFetch = (path, opts = {}) => {
  const token = localStorage.getItem('token')
  return fetch(API + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: opts.body
  }).then(r => r.json().then(data => { if (!r.ok) throw new Error(data.message || 'Erro'); return data }))
}

const inp = { padding: '8px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

export default function TeamPage() {
  const { user } = useAuth()
  const socket = useSocket()
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  usePageTitle('Equipe')

  useEffect(() => {
    if (!socket) return
    socket.emit('online:request')
    socket.on('online:list', (ids) => setOnlineUsers(new Set(ids)))
    socket.on('user:online', ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId])))
    socket.on('user:offline', ({ userId }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s }))
    return () => { socket.off('online:list'); socket.off('user:online'); socket.off('user:offline') }
  }, [socket])
  const [members, setMembers] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [msg, setMsg] = useState({ text: '', ok: false })
  const isAdmin = user?.role === 'owner' || user?.role === 'admin'

  useEffect(() => {
    apiFetch('/api/teams').then(d => Array.isArray(d) && setMembers(d)).catch(() => {})
  }, [])

  const notify = (text, ok = false) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text: '', ok: false }), 3000) }

  const sendInvite = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { notify('Senha deve ter pelo menos 6 caracteres'); return }
    try {
      const data = await apiFetch('/api/teams/invite', { method: 'POST', body: JSON.stringify(form) })
      notify(data.message, true)
      if (data.user) {
        setMembers(prev => [...prev, data.user])
        setTimeout(() => { setShowInvite(false); setForm({ name: '', email: '', password: '', role: 'member' }) }, 1200)
      }
    } catch (err) { notify(err.message) }
  }

  const updateRole = async (userId, role) => {
    try {
      const data = await apiFetch(`/api/teams/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
      if (data._id) setMembers(prev => prev.map(m => m._id === userId ? data : m))
    } catch {}
  }

  const removeMember = async (userId) => {
    if (!window.confirm('Remover este membro?')) return
    try {
      await apiFetch(`/api/teams/${userId}`, { method: 'DELETE' })
      setMembers(prev => prev.filter(m => m._id !== userId))
    } catch {}
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Equipe</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>{members.length} membros</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)}
            style={{ padding: '7px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + Convidar
          </button>
        )}
      </div>

      <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a4a' }}>
              {['Membro', 'Email', 'Função', 'Último acesso', ''].map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Nenhum membro</td></tr>
            )}
            {members.map(member => (
              <tr key={member._id} style={{ borderBottom: '1px solid #2a2a4a' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700 }}>
                        {member.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: onlineUsers.has(member._id) ? '#10b981' : '#475569', border: '2px solid #1e1e3a' }} />
                    </div>
                    <span style={{ fontSize: 14, color: '#e2e8f0' }}>{member.name}</span>
                    {user?._id === member._id && <span style={{ fontSize: 11, color: '#94a3b8' }}>(você)</span>}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#94a3b8' }}>{member.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  {isAdmin && member._id !== user?._id ? (
                    <select value={member.role} onChange={e => updateRole(member._id, e.target.value)}
                      style={{ padding: '4px 8px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 6, fontSize: 13, color: ROLE_COLORS[member.role] || '#94a3b8', outline: 'none' }}>
                      <option value="admin">Admin</option>
                      <option value="member">Membro</option>
                      <option value="viewer">Visualizador</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 13, color: ROLE_COLORS[member.role] || '#94a3b8', fontWeight: 600 }}>{member.role}</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>
                  {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {isAdmin && member._id !== user?._id && member.role !== 'owner' && (
                    <button onClick={() => removeMember(member._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 16, padding: '2px 6px', borderRadius: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>Adicionar Membro</h3>
            {msg.text && (
              <div style={{ background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.ok ? '#10b981' : '#ef4444'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: msg.ok ? '#34d399' : '#f87171', fontSize: 13 }}>
                {msg.text}
              </div>
            )}
            <form onSubmit={sendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input style={inp} type="text" placeholder="Nome (opcional)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input style={inp} type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              <input style={inp} type="password" placeholder="Senha (mín. 6 caracteres)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <select style={inp} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="member">Membro</option>
                <option value="viewer">Visualizador</option>
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowInvite(false); setForm({ name: '', email: '', password: '', role: 'member' }); setMsg({ text: '', ok: false }) }}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
