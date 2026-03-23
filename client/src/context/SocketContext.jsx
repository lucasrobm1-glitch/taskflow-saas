import React, { createContext, useContext, useEffect, useState } from 'react'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Importação dinâmica para não quebrar se socket.io falhar
    import('socket.io-client').then(({ io }) => {
      const s = io('http://localhost:5000', { auth: { token }, transports: ['websocket', 'polling'] })
      s.on('connect', () => console.log('Socket conectado'))
      s.on('connect_error', (e) => console.warn('Socket erro:', e.message))
      setSocket(s)
      return () => s.disconnect()
    }).catch(e => console.warn('Socket.io não disponível:', e))
  }, [])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
