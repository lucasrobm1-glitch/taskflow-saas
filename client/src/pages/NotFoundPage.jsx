import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32 }}>
      <div style={{ fontSize: 64 }}>🔍</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0' }}>Página não encontrada</h1>
      <p style={{ color: '#94a3b8', fontSize: 15 }}>Essa página não existe ou foi movida.</p>
      <button onClick={() => navigate('/')}
        style={{ padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: 8 }}>
        Voltar ao início
      </button>
    </div>
  )
}
