import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const api = (path, opts = {}) => {
  const token = localStorage.getItem('token')
  return fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } }).then(r => r.json())
}

const STATUS_COLORS = { planning: '#94a3b8', active: '#10b981', completed: '#6366f1' }
const STATUS_LABELS = { planning: 'Planejamento', active: 'Ativo', completed: 'Concluído' }

export default function SprintPage() {
  const { projectId } = useParams()
  const [sprints, setSprints] = useState([])
  const [stats, setStats] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api(`/api/sprints?projectId=${projectId}`).then(d => Array.isArray(d) && setSprints(d))
  }, [projectId])

  useEffect(() => {
    sprints.forEach(s => {
      api(`/api/sprints/${s._id}/stats`).then(d => setStats(prev => ({ ...prev, [s._id]: d }))).catch(() => {})
    })
  }, [sprints])

  const createSprint = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const data = await api('/api/sprints', { method: 'POST', body: JSON.stringify({ ...form, project: projectId }) })
      if (data._id) {
        setSprints([...sprints, data])
        setShowModal(false)
        setForm({ name: '', goal: '', startDate: '', endDate: '' })
      } else { setMsg(data.message || 'Erro ao criar sprint') }
    } catch { setMsg('Erro ao criar sprint') }
  }

  const startSprint = async (id) => {
    const data = await api(`/api/sprints/${id}/start`, { method: 'PATCH' }).catch(() => null)
    if (data?._id) setSprints(sprints.map(s => s._id === id ? data : s))
  }

  const completeSprint = async (id) => {
    const data = await api(`/api/sprints/${id}/complete`, { method: 'PATCH' }).catch(() => null)
    if (data?._id) setSprints(sprints.map(s => s._id === id ? data : s))
  }

  const inputStyle = { padding: '8px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Sprints</h1>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          ＋ Novo Sprint
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sprints.map(sprint => {
          const s = stats[sprint._id] || {}
          return (
            <div key={sprint._id} style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{sprint.name}</h3>
                    <span style={{ fontSize: 12, color: STATUS_COLORS[sprint.status], fontWeight: 600 }}>● {STATUS_LABELS[sprint.status]}</span>
                  </div>
                  {sprint.goal && <p style={{ fontSize: 13, color: '#94a3b8' }}>{sprint.goal}</p>}
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    {new Date(sprint.startDate).toLocaleDateString('pt-BR')} → {new Date(sprint.endDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {sprint.status === 'planning' && (
                    <button onClick={() => startSprint(sprint._id)} style={{ padding: '6px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>▶ Iniciar</button>
                  )}
                  {sprint.status === 'active' && (
                    <button onClick={() => completeSprint(sprint._id)} style={{ padding: '6px 12px', background: 'transparent', color: '#94a3b8', border: '1px solid #2a2a4a', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>✓ Concluir</button>
                  )}
                </div>
              </div>
              {s.total > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
                    {[
                      { label: 'Total', value: s.total, color: '#94a3b8' },
                      { label: 'Concluídas', value: s.done, color: '#10b981' },
                      { label: 'Em progresso', value: s.inProgress, color: '#f59e0b' },
                      { label: 'A fazer', value: s.todo, color: '#6366f1' },
                      { label: 'Tempo', value: `${Math.round((s.totalTime || 0) / 60)}h`, color: '#8b5cf6' }
                    ].map((item, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 6, background: '#2a2a4a', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${s.completion || 0}%`, background: '#10b981', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.completion || 0}% concluído</div>
                </div>
              )}
            </div>
          )
        })}

        {sprints.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            <p>Nenhum sprint criado ainda.</p>
            <button onClick={() => setShowModal(true)} style={{ marginTop: 16, padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              ＋ Criar primeiro sprint
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 24, width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>Novo Sprint</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20 }}>✕</button>
            </div>
            {msg && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: '#f87171', fontSize: 13 }}>{msg}</div>}
            <form onSubmit={createSprint} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input style={inputStyle} placeholder="Sprint 1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} placeholder="Meta do sprint..." value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} rows={2} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Início</label>
                  <input style={inputStyle} type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Fim</label>
                  <input style={inputStyle} type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>Criar Sprint</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
