import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import InvitePage from './pages/InvitePage.jsx'
import VerifySuccess from './pages/VerifySuccess.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

const API = import.meta.env.VITE_API_URL || ''

export { useAuth }

function Layout() {
  const { user, tenant, logout } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API}/api/projects`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => Array.isArray(d) && setProjects(d)).catch(() => {})
  }, [])

  const nav = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
    borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
    color: isActive ? '#e2e8f0' : '#94a3b8',
    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent'
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 240, background: '#1a1a2e', borderRight: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{tenant?.name || 'TaskFlow'}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{tenant?.plan} plan</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <NavLink to="/" end style={nav}>🏠 Dashboard</NavLink>
          <NavLink to="/team" style={nav}>👥 Equipe</NavLink>
          <div style={{ marginTop: 16, padding: '6px 12px', fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Projetos</div>
          {projects.map(p => (
            <NavLink key={String(p._id)} to={'/projects/' + String(p._id) + '/board'} style={nav}>
              <span>{p.icon || '📋'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid #2a2a4a' }}>
          <NavLink to="/settings/billing" style={nav}>💳 Plano & Billing</NavLink>
          <NavLink to="/settings" style={nav}>⚙️ Configuracoes</NavLink>
          <button onClick={() => { logout(); navigate('/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, width: '100%' }}>
            🚪 Sair
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginTop: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', background: '#0f0f1a' }}>
        <Outlet />
      </main>
    </div>
  )
}

const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'))
const KanbanBoard = React.lazy(() => import('./pages/KanbanBoard.jsx'))
const SprintPage = React.lazy(() => import('./pages/SprintPage.jsx'))
const ReportsPage = React.lazy(() => import('./pages/ReportsPage.jsx'))
const TeamPage = React.lazy(() => import('./pages/TeamPage.jsx'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage.jsx'))
const BillingPage = React.lazy(() => import('./pages/BillingPage.jsx'))

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6366f1', background: '#0f0f1a', fontSize: 16 }}>Carregando...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <React.Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6366f1', background: '#0f0f1a' }}>Carregando...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route path="/verify-success" element={<VerifySuccess />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="projects/:projectId/board" element={<KanbanBoard />} />
              <Route path="projects/:projectId/sprints" element={<SprintPage />} />
              <Route path="projects/:projectId/reports" element={<ReportsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/billing" element={<BillingPage />} />
            </Route>
          </Routes>
        </React.Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
