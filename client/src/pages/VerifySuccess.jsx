import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export default function VerifySuccess() {
  const [params] = useSearchParams()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      setDone(true)
      setTimeout(() => { window.location.href = '/' }, 2000)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>{done ? '✅' : '⏳'}</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
          {done ? 'Email confirmado!' : 'Verificando...'}
        </h2>
        {done && <p style={{ color: '#94a3b8', fontSize: 14 }}>Redirecionando para o dashboard...</p>}
        {done && (
          <Link to="/" style={{ display: 'inline-block', marginTop: 16, color: '#6366f1', fontSize: 14 }}>
            Clique aqui se não redirecionar
          </Link>
        )}
      </div>
    </div>
  )
}
