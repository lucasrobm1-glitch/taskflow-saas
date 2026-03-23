import React, { createContext, useContext, useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || ''
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    fetch(`${API}/api/auth/me`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { setUser(d.user); setTenant(d.tenant) })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    localStorage.setItem('token', data.token)
    setUser(data.user); setTenant(data.tenant)
    return data
  }

  const register = async (name, email, password, companyName) => {
    const res = await fetch(`${API}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, companyName }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    localStorage.setItem('token', data.token)
    setUser(data.user); setTenant(data.tenant)
    return data
  }

  const logout = () => { localStorage.removeItem('token'); setUser(null); setTenant(null) }

  return <AuthContext.Provider value={{ user, tenant, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
