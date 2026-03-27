import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const inp = { padding: '10px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: '#6366f1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Esqueceu a senha?</h1>
          <p style={{ color: '#94a3b8', marginTop: 6, fontSize: 14 }}>Enviaremos um link para redefinir sua senha</p>
        </div>

        <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 28 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 8 }}>Email enviado!</p>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>Verifique sua caixa de entrada e siga as instruções.</p>
              <Link to="/login" style={{ display: 'inline-block', marginTop: 20, color: '#6366f1', fontSize: 14 }}>Voltar ao login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 12px', color: '#f87171', fontSize: 13 }}>{error}</div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Email</label>
                <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <button type="submit" disabled={loading}
                style={{ padding: '11px', background: loading ? '#4f46e5' : '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15 }}>
                {loading ? 'Enviando...' : 'Enviar link de reset'}
              </button>
              <Link to="/login" style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}>Voltar ao login</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
