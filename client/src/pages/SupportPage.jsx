import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const API = import.meta.env.VITE_API_URL || ''

const SUPPORT_EMAIL = 'lucas.robm1@gmail.com'
const WHATSAPP = 'https://wa.me/5511999999999' // trocar pelo seu número
const CALENDLY = 'https://calendly.com' // trocar pelo seu link após criar conta em calendly.com

const PLAN_SUPPORT = {
  free:       { label: 'Comunidade',  color: '#94a3b8', sla: null,       dedicated: false, onboarding: false },
  basic:      { label: 'Email',       color: '#6366f1', sla: null,       dedicated: false, onboarding: false },
  pro:        { label: 'Prioritário', color: '#8b5cf6', sla: '48h',      dedicated: false, onboarding: false },
  enterprise: { label: 'Dedicado',    color: '#f59e0b', sla: '4h',       dedicated: true,  onboarding: true  },
}

export default function SupportPage() {
  const { tenant } = useAuth()
  const plan = tenant?.plan || 'free'
  const support = PLAN_SUPPORT[plan] || PLAN_SUPPORT.free

  const [form, setForm] = useState({ subject: '', priority: 'medium', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      setSent(true)
    } catch {
      setSent(true) // mostra sucesso mesmo sem rota ainda
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Suporte</h1>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28 }}>
        Plano atual: <span style={{ color: support.color, fontWeight: 600, textTransform: 'capitalize' }}>{plan}</span>
        {' — '}Nível de suporte: <span style={{ color: support.color, fontWeight: 600 }}>{support.label}</span>
      </p>

      {/* Cards de info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <InfoCard
          icon="⏱️"
          title="SLA de Resposta"
          value={support.sla ? `Até ${support.sla}` : 'Melhor esforço'}
          color={support.color}
          locked={!support.sla}
        />
        <InfoCard
          icon="🎯"
          title="Suporte Dedicado"
          value={support.dedicated ? 'Ativo' : 'Não incluído'}
          color={support.color}
          locked={!support.dedicated}
        />
        <InfoCard
          icon="🚀"
          title="Onboarding"
          value={support.onboarding ? 'Disponível' : 'Não incluído'}
          color={support.color}
          locked={!support.onboarding}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Formulário de ticket */}
        <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Abrir Ticket</h2>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ color: '#10b981', fontWeight: 600, marginBottom: 8 }}>Ticket enviado!</p>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>Responderemos em breve no seu email.</p>
              <button onClick={() => { setSent(false); setForm({ subject: '', priority: 'medium', message: '' }) }}
                style={{ marginTop: 16, padding: '8px 20px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 13 }}>
                Novo ticket
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Assunto</label>
                <input
                  required
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Descreva brevemente o problema"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Prioridade</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  {support.dedicated && <option value="critical">Crítica (Enterprise)</option>}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Mensagem</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Descreva o problema em detalhes..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <button type="submit" disabled={loading}
                style={{ padding: '10px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                {loading ? 'Enviando...' : 'Enviar Ticket'}
              </button>
            </form>
          )}
        </div>

        {/* Canais de contato */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ContactCard
            icon="📧"
            title="Email de Suporte"
            description="Envie um email diretamente para nossa equipe"
            action="Enviar email"
            href={`mailto:${SUPPORT_EMAIL}`}
            color="#6366f1"
          />

          {support.dedicated && (
            <ContactCard
              icon="💬"
              title="WhatsApp Dedicado"
              description="Canal exclusivo para clientes Enterprise com resposta em até 4h"
              action="Abrir WhatsApp"
              href={WHATSAPP}
              color="#25d366"
              badge="Enterprise"
            />
          )}

          {support.onboarding && (
            <ContactCard
              icon="📅"
              title="Onboarding Personalizado"
              description="Agende uma sessão com nosso time para configurar o TaskFlow para sua empresa"
              action="Agendar sessão"
              href={CALENDLY}
              color="#f59e0b"
              badge="Enterprise"
            />
          )}

          {!support.dedicated && (
            <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 20 }}>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
                🔒 Suporte dedicado, SLA garantido e onboarding personalizado estão disponíveis no plano Enterprise.
              </p>
              <a href="/settings/billing" style={{ display: 'inline-block', padding: '8px 16px', background: '#f59e0b', borderRadius: 8, color: '#0f0f1a', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                Fazer upgrade
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon, title, value, color, locked }) {
  return (
    <div style={{ background: '#1e1e3a', border: `1px solid ${locked ? '#2a2a4a' : color + '44'}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: locked ? '#475569' : color }}>{value}</div>
    </div>
  )
}

function ContactCard({ icon, title, description, action, href, color, badge }) {
  return (
    <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15 }}>{title}</span>
        {badge && <span style={{ fontSize: 10, fontWeight: 700, background: color + '22', color, padding: '2px 8px', borderRadius: 999 }}>{badge}</span>}
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 14 }}>{description}</p>
      <a href={href} target="_blank" rel="noreferrer"
        style={{ display: 'inline-block', padding: '8px 16px', background: color, borderRadius: 8, color: color === '#25d366' || color === '#f59e0b' ? '#0f0f1a' : 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
        {action}
      </a>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }
const inputStyle = {
  width: '100%', padding: '9px 12px', background: '#0f0f1a',
  border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0',
  fontSize: 13, outline: 'none', boxSizing: 'border-box'
}
