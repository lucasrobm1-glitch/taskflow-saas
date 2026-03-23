import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || ''

const api = (path, opts = {}) => {
  const token = localStorage.getItem('token')
  return fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } }).then(r => r.json())
}

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' }
const PRIORITY_LABELS = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' }
const TYPE_ICONS = { task: '✅', bug: '🐛', feature: '✨', improvement: '⚡' }

export default function KanbanBoard() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [newTaskColumn, setNewTaskColumn] = useState('todo')
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', type: 'task', dueDate: '', estimatedHours: '' })
  const [msg, setMsg] = useState('')
  const dragTask = useRef(null)
  const dragOverCol = useRef(null)

  useEffect(() => {
    api(`/api/projects/${projectId}`).then(d => d._id && setProject(d))
    api(`/api/tasks?projectId=${projectId}`).then(d => Array.isArray(d) && setTasks(d))
  }, [projectId])

  const getColumnTasks = (colId) => tasks.filter(t => t.column === colId).sort((a, b) => a.order - b.order)

  const handleDrop = async (colId) => {
    const taskId = dragTask.current
    if (!taskId) return
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, column: colId } : t))
    await api(`/api/tasks/${taskId}/move`, { method: 'PATCH', body: JSON.stringify({ column: colId, order: 0 }) }).catch(() => {})
    dragTask.current = null
  }

  const createTask = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const data = await api('/api/tasks', { method: 'POST', body: JSON.stringify({ ...taskForm, project: projectId, column: newTaskColumn }) })
      if (data._id) {
        setTasks(prev => [...prev, data])
        setShowTaskModal(false)
        setTaskForm({ title: '', description: '', priority: 'medium', type: 'task', dueDate: '', estimatedHours: '' })
      } else { setMsg(data.message || 'Erro ao criar tarefa') }
    } catch { setMsg('Erro ao criar tarefa') }
  }

  if (!project) return <div style={{ padding: 32, color: '#94a3b8' }}>Carregando...</div>

  const inputStyle = { padding: '8px 12px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{project.icon}</span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{project.name}</h1>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Quadro Kanban</p>
          </div>
        </div>
        <button onClick={() => { setNewTaskColumn('todo'); setShowTaskModal(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          ＋ Nova Tarefa
        </button>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, minWidth: 'max-content', height: '100%' }}>
          {(project.columns || []).map(col => (
            <div key={col.id} style={{ width: 280, display: 'flex', flexDirection: 'column' }}
              onDragOver={e => { e.preventDefault(); dragOverCol.current = col.id }}
              onDrop={() => handleDrop(col.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{col.name}</span>
                  <span style={{ background: '#2a2a4a', color: '#94a3b8', borderRadius: 999, padding: '1px 7px', fontSize: 12 }}>{getColumnTasks(col.id).length}</span>
                </div>
                <button onClick={() => { setNewTaskColumn(col.id); setShowTaskModal(true) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1 }}>＋</button>
              </div>

              <div style={{ flex: 1, minHeight: 100, borderRadius: 8, padding: 4 }}>
                {getColumnTasks(col.id).map(task => (
                  <div key={task._id} draggable
                    onDragStart={() => { dragTask.current = task._id }}
                    onClick={() => setSelectedTask(task)}
                    style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 8, padding: 12, marginBottom: 8, cursor: 'grab' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13 }}>{TYPE_ICONS[task.type] || '✅'}</span>
                      <span style={{ fontSize: 11, color: PRIORITY_COLORS[task.priority], fontWeight: 600 }}>{PRIORITY_LABELS[task.priority]}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</p>
                    {task.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                        {task.tags.map(tag => <span key={tag} style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '1px 6px', borderRadius: 999 }}>#{tag}</span>)}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <div style={{ display: 'flex' }}>
                        {task.assignees?.slice(0, 3).map(a => (
                          <div key={a._id} title={a.name} style={{ width: 22, height: 22, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, marginLeft: -4, border: '2px solid #1e1e3a' }}>
                            {a.name?.[0]?.toUpperCase()}
                          </div>
                        ))}
                      </div>
                      {task.dueDate && (
                        <span style={{ fontSize: 11, color: new Date(task.dueDate) < new Date() ? '#ef4444' : '#94a3b8' }}>
                          📅 {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>Nova Tarefa</h3>
              <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20 }}>✕</button>
            </div>
            {msg && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: '#f87171', fontSize: 13 }}>{msg}</div>}
            <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input style={inputStyle} placeholder="Título da tarefa" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} placeholder="Descrição (opcional)" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={3} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Prioridade</label>
                  <select style={selectStyle} value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Tipo</label>
                  <select style={selectStyle} value={taskForm.type} onChange={e => setTaskForm({ ...taskForm, type: e.target.value })}>
                    <option value="task">Tarefa</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="improvement">Melhoria</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Prazo</label>
                  <input style={inputStyle} type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Horas estimadas</label>
                  <input style={inputStyle} type="number" placeholder="0" value={taskForm.estimatedHours} onChange={e => setTaskForm({ ...taskForm, estimatedHours: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>Criar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 16, padding: 24, width: '100%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{TYPE_ICONS[selectedTask.type] || '✅'}</span>
                <span style={{ fontSize: 12, background: '#2a2a4a', color: '#94a3b8', padding: '2px 8px', borderRadius: 999 }}>{selectedTask.type}</span>
                <span style={{ color: PRIORITY_COLORS[selectedTask.priority], fontSize: 13, fontWeight: 600 }}>{PRIORITY_LABELS[selectedTask.priority]}</span>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20 }}>✕</button>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>{selectedTask.title}</h2>
            {selectedTask.description && <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{selectedTask.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {selectedTask.dueDate && <div style={{ fontSize: 13, color: '#e2e8f0' }}>📅 Prazo: {new Date(selectedTask.dueDate).toLocaleDateString('pt-BR')}</div>}
              {selectedTask.estimatedHours > 0 && <div style={{ fontSize: 13, color: '#e2e8f0' }}>⏱️ Estimativa: {selectedTask.estimatedHours}h</div>}
            </div>
            {selectedTask.assignees?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Responsáveis</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {selectedTask.assignees.map(a => (
                    <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 700 }}>{a.name?.[0]?.toUpperCase()}</div>
                      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
