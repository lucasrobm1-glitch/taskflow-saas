import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || ''

const apiFetch = (path) => {
  const token = localStorage.getItem('token')
  return fetch(API + path, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ tasks: [], projects: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setResults({ tasks: [], projects: [] }) }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults({ tasks: [], projects: [] }); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const [tasksRes, projects] = await Promise.all([
          apiFetch(`/api/tasks?search=${encodeURIComponent(query)}&limit=10`),
          apiFetch('/api/projects')
        ])
        const tasksArr = Array.isArray(tasksRes) ? tasksRes : (tasksRes?.tasks || [])
        const filteredProjects = Array.isArray(projects) ? projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase())) : []
        setResults({ tasks: tasksArr.slice(0, 5), projects: filteredProjects.slice(0, 3) })
      } catch { setResults({ tasks: [], projects: [] }) }
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const go = (path) => { navigate(path); setOpen(false) }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80, zIndex: 900 }}
      onClick={() => setOpen(false)}>
      <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #2a2a4a' }}>
          <span style={{ fontSize: 18, color: '#94a3b8' }}>🔍</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar tarefas, projetos..."
            style={{ flex: 1, background: 'none', border: 'none', color: '#e2e8f0', fontSize: 16, outline: 'none' }} />
          <span style={{ fontSize: 11, color: '#475569', background: '#16213e', padding: '2px 6px', borderRadius: 4 }}>ESC</span>
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Buscando...</div>}

          {!loading && query && results.projects.length === 0 && results.tasks.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Nenhum resultado para "{query}"</div>
          )}

          {results.projects.length > 0 && (
            <div>
              <div style={{ padding: '10px 16px 6px', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Projetos</div>
              {results.projects.map(p => (
                <div key={p._id} onClick={() => go(`/projects/${p._id}/board`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderRadius: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#16213e'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 18 }}>{p.icon || '📋'}</span>
                  <span style={{ fontSize: 14, color: '#e2e8f0' }}>{p.name}</span>
                </div>
              ))}
            </div>
          )}

          {results.tasks.length > 0 && (
            <div>
              <div style={{ padding: '10px 16px 6px', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Tarefas</div>
              {results.tasks.map(t => (
                <div key={t._id} onClick={() => go(`/projects/${t.project}/board`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#16213e'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 14, color: '#e2e8f0' }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{t.column}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!query && (
            <div style={{ padding: 20, textAlign: 'center', color: '#475569', fontSize: 13 }}>
              Digite para buscar tarefas e projetos
            </div>
          )}
        </div>

        <div style={{ padding: '10px 16px', borderTop: '1px solid #2a2a4a', display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#475569' }}>↵ abrir</span>
          <span style={{ fontSize: 12, color: '#475569' }}>ESC fechar</span>
          <span style={{ fontSize: 12, color: '#475569' }}>Ctrl+K alternar</span>
        </div>
      </div>
    </div>
  )
}
