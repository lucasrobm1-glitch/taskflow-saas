import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const API = import.meta.env.VITE_API_URL || ''

const api = (path, opts = {}) => {
  const token = localStorage.getItem('token')
  return fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } }).then(r => r.json())
}

const PLANS = [
  { id: 'free', name: 'Free', price: 0, color: '#94a3b8', features: ['3 projetos', '5 membros', 'Kanban basico', 'Sem sprints'] },
  { id: 'basic', name: 'Basic', price: 29, color: '#6366f1', features: ['10 projetos', '10 membros', 'Sprints', 'Time tracking', 'Relatorios basicos'] },
  { id: 'pro', name: 'Pro', price: 79, color: '#8b5cf6', popular: true, features: ['50 projetos', '50 membros', 'Relatorios avancados', 'Slack & GitHub', 'Burndown chart', 'Time tracking'] },
  { id: 'enterprise', name: 'Enterprise', price: 199, color: '#f59e0b', features: ['Ilimitado', 'SSO', 'Suporte dedicado', 'SLA garantido', 'Onboarding personalizado'] }
]

export default function BillingPage() {
  const { tenant } = useAuth()
  const [loading, setLoading] = useState('')
  const [status, setStatus] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api('/api/subscriptions/status').then(d => d && setStatus(d)).catch(() => {})
    const params = new URLSearchParams(window.location.search)
    if (params.get('success')) setMsg('Assinatura ativada com sucesso!')
    if (params.get('canceled')) setMsg('Pagamento cancelado')
  }, [])

  const subscribe = async (planId) => {
    if (planId === 'free') return
    setLoading(planId)
    try {
      const data = await api('/api/subscriptions/checkout', { method: 'POST', body: JSON.stringify({ plan: planId }) })
      if (data.url) window.location.href = data.url
      else { setMsg(data.message || 'Erro ao processar pagamento'); setLoading('') }
    } catch { setMsg('Erro ao processar pagamento'); setLoading('') }
  }

  const openPortal = async () => {
    const data = await api('/api/subscriptions/portal', { method: 'POST' }).catch(() => null)
    if (data?.url) window.location.href = data.url
    else setMsg('Erro ao abrir portal')
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Plano & Billing</h1>
        {msg && <div style={{ marginTop: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid #6366f1', borderRadius: 8, padding: '10px 14px', color: '#818cf8', fontSize: 14 }}>{msg}</div>}
        {status && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>Plano atual:</span>
            <span style={{ fontWeight: 700, color: '#6366f1', textTransform: 'capitalize' }}>{status.plan}</span>
            <span style={{ fontSize: 13, color: status.status === 'active' ? '#10b981' : '#f59e0b' }}>● {status.status}</span>
            {status.status === 'trialing' && status.trialEndsAt && (
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Trial ate {new Date(status.trialEndsAt).toLocaleDateString('pt-BR')}</span>
            )}
            {tenant?.stripeSubscriptionId && (
              <button onClick={openPortal} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                Gerenciar assinatura
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {PLANS.map(plan => {
          const isCurrent = status?.plan === plan.id
          return (
            <div key={plan.id} style={{ position: 'relative', background: '#1e1e3a', border: `1px solid ${plan.popular ? plan.color : '#2a2a4a'}`, borderRadius: 16, padding: 24, transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  MAIS POPULAR
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0' }}>{plan.name}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: plan.color }}>
                  {plan.price === 0 ? 'Gratis' : `R$ ${plan.price}`}
                  {plan.price > 0 && <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 400 }}>/mes</span>}
                </div>
              </div>

              <ul style={{ listStyle: 'none', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8, padding: 0 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8' }}>
                    <span style={{ color: plan.color }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              <button
                style={{ width: '100%', padding: '10px', background: isCurrent ? 'transparent' : plan.color, border: `1px solid ${plan.color}`, borderRadius: 8, color: isCurrent ? plan.color : 'white', fontWeight: 600, cursor: isCurrent || plan.id === 'free' ? 'default' : 'pointer', fontSize: 14 }}
                onClick={() => subscribe(plan.id)}
                disabled={isCurrent || loading === plan.id || plan.id === 'free'}>
                {loading === plan.id ? 'Redirecionando...' : isCurrent ? 'Plano atual' : plan.id === 'free' ? 'Gratis' : 'Assinar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
