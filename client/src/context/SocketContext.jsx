import { createContext, useContext, useEffect, useState } from 'react'

const SocketContext = createContext(null)
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    import('socket.io-client').then(({ io }) => {
      const s = io(API, { auth: { token }, transports: ['websocket', 'polling'] })
      s.on('connect', () => console.log('Socket conectado'))
      s.on('connect_error', (e) => console.warn('Socket erro:', e.message))
      setSocket(s)
      return () => s.disconnect()
    }).catch(e => console.warn('Socket.io não disponível:', e))
  }, [])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
