import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || ''

export default function InvitePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const tenantId = params.get('tenant')
  const email = params.get('email')
  const role = params.get('role') || 'member'

  const [form, setForm] = useState({ name: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', member: 'Membro', viewer: 'Visualizador' }

  if (!tenantId || !email) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontSize: 16 }}>Link de convite inválido ou expirado.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/auth/register-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email, password: form.password, tenantId, role })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      localStorage.setItem('token', data.token)
      window.location.href = '/'
    } catch (err) {
      setError(err.message || 'Erro ao aceitar convite')
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: '100%', padding: '10px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: '#6366f1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>⚡</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Você foi convidado</h1>
          <p style={{ color: '#94a3b8', marginTop: 6, fontSize: 14 }}>
            Entrando como <span style={{ color: '#a5b4fc' }}>{email}</span>
          </p>
          <span style={{ display: 'inline-block', marginTop: 8, fontSize: 12, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '3px 10px', borderRadius: 999 }}>
            {ROLE_LABELS[role] || role}
          </span>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#94a3b8' }}>Seu nome</label>
            <input style={inp} placeholder="João Silva" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#94a3b8' }}>Email</label>
            <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} value={email} readOnly />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#94a3b8' }}>Crie uma senha</label>
            <input style={inp} type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}
          >
            {loading ? 'Entrando...' : 'Aceitar convite'}
          </button>
        </form>
      </div>
    </div>
  )
}
