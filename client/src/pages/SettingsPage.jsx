import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const API = import.meta.env.VITE_API_URL || ''

const api = (path, opts = {}) => {
  const token = localStorage.getItem('token')
  return fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } }).then(r => r.json())
}

export default function SettingsPage() {
  const { user, tenant } = useAuth()
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({ name: user?.name || '', avatar: user?.avatar || '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [slack, setSlack] = useState({ webhookUrl: tenant?.integrations?.slack?.webhookUrl || '', channel: tenant?.integrations?.slack?.channel || '' })
  const [github, setGithub] = useState({ accessToken: '' })
  const [msg, setMsg] = useState('')

  const notify = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const saveProfile = async (e) => {
    e.preventDefault()
    const data = await api('/api/users/me', { method: 'PUT', body: JSON.stringify(profile) }).catch(() => null)
    notify(data ? 'Perfil atualizado!' : 'Erro ao salvar perfil')
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirm) { notify('Senhas nao coincidem'); return }
    const data = await api('/api/users/me/password', { method: 'PUT', body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) }).catch(() => null)
    if (data) { notify('Senha alterada!'); setPasswords({ currentPassword: '', newPassword: '', confirm: '' }) }
    else notify('Erro ao alterar senha')
  }

  const saveSlack = async (e) => {
    e.preventDefault()
    const data = await api('/api/integrations/slack', { method: 'POST', body: JSON.stringify(slack) }).catch(() => null)
    notify(data ? 'Slack configurado!' : 'Erro ao configurar Slack')
  }

  const saveGithub = async (e) => {
    e.preventDefault()
    const data = await api('/api/integrations/github', { method: 'POST', body: JSON.stringify(github) }).catch(() => null)
    notify(data?.user ? `GitHub conectado como ${data.user}!` : 'Token invalido')
  }

  const inp = { padding: '8px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const TABS = [{ id: 'profile', label: 'Perfil' }, { id: 'security', label: 'Seguranca' }, { id: 'integrations', label: 'Integracoes' }]

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 24 }}>Configuracoes</h1>

      {msg && <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid #6366f1', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#818cf8', fontSize: 14 }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #2a2a4a' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: tab === t.id ? '#6366f1' : '#94a3b8', borderBottom: `2px solid ${tab === t.id ? '#6366f1' : 'transparent'}`, marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{user?.email}</div>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Nome</label>
            <input style={inp} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>URL do Avatar</label>
            <input style={inp} placeholder="https://..." value={profile.avatar} onChange={e => setProfile({ ...profile, avatar: e.target.value })} />
          </div>
          <button type="submit" style={{ alignSelf: 'flex-start', padding: '8px 20px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
        </form>
      )}

      {tab === 'security' && (
        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Senha atual</label>
            <input style={inp} type="password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Nova senha</label>
            <input style={inp} type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Confirmar nova senha</label>
            <input style={inp} type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} required />
          </div>
          <button type="submit" style={{ alignSelf: 'flex-start', padding: '8px 20px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>Alterar senha</button>
        </form>
      )}

      {tab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>Slack</h3>
              <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: 999 }}>Pro+</span>
            </div>
            <form onSubmit={saveSlack} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Webhook URL</label>
                <input style={inp} placeholder="https://hooks.slack.com/..." value={slack.webhookUrl} onChange={e => setSlack({ ...slack, webhookUrl: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Canal</label>
                <input style={inp} placeholder="#geral" value={slack.channel} onChange={e => setSlack({ ...slack, channel: e.target.value })} />
              </div>
              <button type="submit" style={{ alignSelf: 'flex-start', padding: '7px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Salvar Slack</button>
            </form>
          </div>

          <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🐙</span>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>GitHub</h3>
              <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: 999 }}>Pro+</span>
            </div>
            <form onSubmit={saveGithub} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Personal Access Token</label>
                <input style={inp} type="password" placeholder="ghp_..." value={github.accessToken} onChange={e => setGithub({ ...github, accessToken: e.target.value })} />
              </div>
              <button type="submit" style={{ alignSelf: 'flex-start', padding: '7px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Conectar GitHub</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
