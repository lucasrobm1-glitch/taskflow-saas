import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      setTenant(data.tenant)
    } catch {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setTenant(data.tenant)
    return data
  }

  const register = async (name, email, password, companyName) => {
    const { data } = await api.post('/auth/register', { name, email, password, companyName })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setTenant(data.tenant)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setTenant(null)
  }

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }))
  const updateTenant = (updates) => setTenant(prev => ({ ...prev, ...updates }))

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, register, logout, updateUser, updateTenant, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
