import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import usePageTitle from '../hooks/usePageTitle.js'

const API = import.meta.env.VITE_API_URL || ''

const api = (path, opts = {}) => {
  const token = localStorage.getItem('token')
  return fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } }).then(r => r.json())
}

const ICONS = ['📋', '🚀', '💡', '🎯', '🔧', '📱', '🌐', '⚡', '🎨', '📊']
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6']

export default function Dashboard() {
  const { user, tenant } = useAuth()
  usePageTitle('Dashboard')
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // project a deletar
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: '📋' })
  const [members, setMembers] = useState(0)
  const [msg, setMsg] = useState('')
  const [editProject, setEditProject] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '#6366f1', icon: '📋' })

  useEffect(() => {
    api('/api/projects').then(d => Array.isArray(d) && setProjects(d))
    api('/api/teams').then(d => Array.isArray(d) && setMembers(d.length)).catch(() => {})
  }, [])

  const deleteProject = async (id) => {
    try {
      await api(`/api/projects/${id}`, { method: 'DELETE' })
      setProjects(prev => prev.filter(p => p._id !== id))
    } catch { setMsg('Erro ao deletar projeto') }
  }

  const saveEditProject = async (e) => {
    e.preventDefault()
    try {
      const data = await api(`/api/projects/${editProject._id}`, { method: 'PUT', body: JSON.stringify(editForm) })
      if (data._id) {
        setProjects(prev => prev.map(p => p._id === data._id ? data : p))
        setEditProject(null)
      }
    } catch { setMsg('Erro ao editar projeto') }
  }

  const createProject = async (e) => {
    e.preventDefault()
    try {
      const data = await api('/api/projects', { method: 'POST', body: JSON.stringify(form) })
      if (data._id) {
        setProjects([...projects, data])
        setShowModal(false)
        setForm({ name: '', description: '', color: '#6366f1', icon: '📋' })
        navigate(`/projects/${data._id}/board`)
      } else {
        setMsg(data.message || 'Erro ao criar projeto')
      }
    } catch { setMsg('Erro ao criar projeto') }
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: '#94a3b8', marginTop: 4 }}>Bem-vindo ao {tenant?.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Projetos', value: projects.length, icon: '📁', color: '#6366f1' },
          { label: 'Membros', value: members, icon: '👥', color: '#8b5cf6' },
          { label: 'Plano', value: tenant?.plan?.toUpperCase(), icon: '✅', color: '#10b981' },
          { label: 'Status', value: tenant?.subscriptionStatus === 'trialing' ? 'Trial' : tenant?.subscriptionStatus, icon: '⏱️', color: '#f59e0b' }
        ].map((s, i) => (
          <div key={i} style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>Projetos</h2>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          ＋ Novo Projeto
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {projects.map(p => {
          const isOwner = ['admin', 'owner'].includes(user?.role)
          return (
          <div key={p._id} style={{ position: 'relative', background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = p.color || '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a4a'}>
            <div onClick={() => navigate(`/projects/${p._id}/board`)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${p.color || '#6366f1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{p.icon || '📋'}</div>
              <div>
                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.members?.length || 0} membros</div>
              </div>
            </div>
            {p.description && <p onClick={() => navigate(`/projects/${p._id}/board`)} style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>{p.description}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span onClick={() => navigate(`/projects/${p._id}/board`)} style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: 999 }}>{p.status}</span>
              {isOwner && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditProject(p); setEditForm({ name: p.name, description: p.description || '', color: p.color || '#6366f1', icon: p.icon || '📋' }) }}
                    title="Editar projeto"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 15, padding: '2px 6px', borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                    onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                  >✏️</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(p) }}
                    title="Deletar projeto"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 16, padding: '2px 6px', borderRadius: 6, lineHeight: 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                  >🗑️</button>
                </div>
              )}
            </div>
          </div>
          )
        })}
        <div onClick={() => setShowModal(true)}
          style={{ background: 'transparent', border: '2px dashed #2a2a4a', borderRadius: 12, padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8', minHeight: 100 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a4a'; e.currentTarget.style.color = '#94a3b8' }}>
          ＋ Novo Projeto
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>Novo Projeto</h3>
            {msg && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: '#f87171', fontSize: 13 }}>{msg}</div>}
            <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input placeholder="Nome do projeto" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                style={{ padding: '10px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
              <textarea placeholder="Descrição opcional" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                style={{ padding: '10px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' }} />
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Ícone</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                      style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${form.icon === icon ? '#6366f1' : '#2a2a4a'}`, background: 'transparent', cursor: 'pointer', fontSize: 18 }}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Cor</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: `3px solid ${form.color === color ? 'white' : 'transparent'}`, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>Criar Projeto</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>Editar Projeto</h3>
            <form onSubmit={saveEditProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input placeholder="Nome do projeto" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required
                style={{ padding: '10px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
              <textarea placeholder="Descrição opcional" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2}
                style={{ padding: '10px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' }} />
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Ícone</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setEditForm({ ...editForm, icon })}
                      style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${editForm.icon === icon ? '#6366f1' : '#2a2a4a'}`, background: 'transparent', cursor: 'pointer', fontSize: 18 }}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Cor</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setEditForm({ ...editForm, color })}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: `3px solid ${editForm.color === color ? 'white' : 'transparent'}`, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setEditProject(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: '#1e1e3a', border: '1px solid #ef444444', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Deletar "{confirmDelete.name}"?</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Isso vai apagar o projeto e todas as tarefas permanentemente. Essa ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding: '9px 20px', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
                Cancelar
              </button>
              <button onClick={() => { deleteProject(confirmDelete._id); setConfirmDelete(null) }}
                style={{ padding: '9px 20px', background: '#ef4444', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Sim, deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
