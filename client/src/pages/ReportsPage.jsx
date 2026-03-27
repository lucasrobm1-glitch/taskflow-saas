import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle.js'

const API = import.meta.env.VITE_API_URL || ''

const api = (path, opts = {}) => {
  const token = localStorage.getItem('token')
  return fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) } }).then(r => r.json())
}

const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4']

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#94a3b8' }}>
        <span>{label}</span><span style={{ color: '#e2e8f0', fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: '#2a2a4a', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { projectId } = useParams()
  usePageTitle('Relatórios')
  const [report, setReport] = useState(null)
  const [sprints, setSprints] = useState([])
  const [selectedSprint, setSelectedSprint] = useState('')
  const [burndown, setBurndown] = useState(null)

  useEffect(() => {
    api(`/api/reports/project/${projectId}`).then(d => d && setReport(d)).catch(() => {})
    api(`/api/sprints?projectId=${projectId}`).then(d => Array.isArray(d) && setSprints(d)).catch(() => {})
  }, [projectId])

  useEffect(() => {
    if (selectedSprint) {
      api(`/api/reports/sprint/${selectedSprint}/burndown`).then(d => setBurndown(d)).catch(() => setBurndown(null))
    }
  }, [selectedSprint])

  if (!report) return <div style={{ padding: 32, color: '#94a3b8' }}>Carregando relatórios...</div>

  const exportCSV = () => {
    const rows = [
      ['Status', 'Quantidade'],
      ...Object.entries(report.byStatus || {}).map(([k, v]) => [k, v]),
      [],
      ['Prioridade', 'Quantidade'],
      ...Object.entries(report.byPriority || {}).map(([k, v]) => [k, v]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const statusEntries = Object.entries(report.byStatus || {})
  const priorityEntries = Object.entries(report.byPriority || {})
  const assigneeEntries = Object.entries(report.byAssignee || {})
  const maxStatus = Math.max(...statusEntries.map(([, v]) => v), 1)
  const maxPriority = Math.max(...priorityEntries.map(([, v]) => v), 1)

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Relatórios</h1>
        <button onClick={exportCSV}
          style={{ padding: '7px 14px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
          ⬇️ Exportar CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total de Tarefas', value: report.total, color: COLORS[0] },
          { label: 'Concluídas', value: report.byStatus?.done || 0, color: COLORS[3] },
          { label: 'Em Progresso', value: report.byStatus?.in_progress || 0, color: COLORS[1] },
          { label: 'Tempo Total', value: `${Math.round((report.totalTime || 0) / 60)}h`, color: COLORS[2] }
        ].map((s, i) => (
          <div key={i} style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>Por Status</h3>
          {statusEntries.map(([name, value], i) => (
            <Bar key={name} label={name} value={value} max={maxStatus} color={COLORS[i % COLORS.length]} />
          ))}
          {statusEntries.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13 }}>Sem dados</p>}
        </div>

        <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>Por Prioridade</h3>
          {priorityEntries.map(([name, value], i) => (
            <Bar key={name} label={name} value={value} max={maxPriority} color={COLORS[i % COLORS.length]} />
          ))}
          {priorityEntries.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13 }}>Sem dados</p>}
        </div>
      </div>

      {assigneeEntries.length > 0 && (
        <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>Por Membro</h3>
          {assigneeEntries.map(([name, data], i) => (
            <div key={name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: '#e2e8f0' }}>{name}</span>
                <span style={{ color: '#94a3b8' }}>{data.done}/{data.total} concluídas</span>
              </div>
              <div style={{ height: 8, background: '#2a2a4a', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${data.total > 0 ? (data.done / data.total) * 100 : 0}%`, background: COLORS[i % COLORS.length], borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#1e1e3a', border: '1px solid #2a2a4a', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Burndown Chart</h3>
          <select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)}
            style={{ padding: '6px 10px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none' }}>
            <option value="">Selecionar sprint</option>
            {sprints.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        {burndown?.burndown ? (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 200, minWidth: 400 }}>
              {burndown.burndown.map((d, i) => {
                const maxVal = Math.max(...burndown.burndown.map(x => x.remaining), 1)
                const h = (d.remaining / maxVal) * 180
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div title={`${d.remaining} restantes`} style={{ width: '100%', height: h, background: '#6366f1', borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                    <span style={{ fontSize: 9, color: '#94a3b8', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{d.date}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Selecione um sprint para ver o burndown</div>
        )}
      </div>
    </div>
  )
}
