import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard, FolderKanban, Users, Settings,
  CreditCard, LogOut, ChevronDown, Plus, Zap
} from 'lucide-react';

export default function Layout() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showProjects, setShowProjects] = useState(true);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderRadius: 8, textDecoration: 'none',
    fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
    color: isActive ? '#e2e8f0' : '#94a3b8',
    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#1a1a2e', borderRight: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #2a2a4a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{tenant?.name || 'TaskFlow'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{tenant?.plan} plan</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <NavLink to="/" end style={navStyle}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/team" style={navStyle}>
            <Users size={16} /> Equipe
          </NavLink>

          {/* Projetos */}
          <div style={{ marginTop: 16 }}>
            <div
              onClick={() => setShowProjects(!showProjects)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', cursor: 'pointer', color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              <span>Projetos</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={(e) => { e.stopPropagation(); navigate('/'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                  <Plus size={14} />
                </button>
                <ChevronDown size={14} style={{ transform: showProjects ? 'rotate(0)' : 'rotate(-90deg)', transition: '0.2s' }} />
              </div>
            </div>
            {showProjects && projects.map(p => (
              <NavLink key={p._id} to={`/projects/${p._id}/board`} style={navStyle}>
                <span style={{ fontSize: 16 }}>{p.icon || '📋'}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #2a2a4a' }}>
          <NavLink to="/settings" style={navStyle}><Settings size={16} /> Configurações</NavLink>
          <NavLink to="/settings/billing" style={navStyle}><CreditCard size={16} /> Plano & Billing</NavLink>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, fontWeight: 500, width: '100%' }}>
            <LogOut size={16} /> Sair
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginTop: 4 }}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', background: '#0f0f1a' }}>
        <Outlet />
      </main>
    </div>
  );
}
