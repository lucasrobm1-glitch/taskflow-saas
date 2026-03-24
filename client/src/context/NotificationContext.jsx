import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSocket } from './SocketContext.jsx'
import { useAuth } from './AuthContext.jsx'

const NotificationContext = createContext(null)

const COLUMN_LABELS = {
  todo: 'A Fazer',
  inprogress: 'Em Progresso',
  review: 'Em Revisão',
  done: 'Concluído'
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const socket = useSocket()
  const { user } = useAuth()

  const add = useCallback((notif) => {
    setNotifications(prev => [
      { ...notif, id: Date.now() + Math.random(), read: false, at: new Date() },
      ...prev.slice(0, 49) // máximo 50
    ])
  }, [])

  useEffect(() => {
    if (!socket || !user) return

    const onCreated = (task) => {
      if (task.reporter?._id === user._id) return // ignora próprias ações
      add({
        type: 'created',
        icon: '✅',
        text: `Nova tarefa criada: "${task.title}"`,
        taskId: task._id,
        projectId: task.project
      })
    }

    const onMoved = ({ taskId, column, taskTitle }) => {
      add({
        type: 'moved',
        icon: '🔀',
        text: `Tarefa movida para "${COLUMN_LABELS[column] || column}"${taskTitle ? `: "${taskTitle}"` : ''}`,
        taskId,
      })
    }

    const onUpdated = (task) => {
      if (task.reporter?._id === user._id) return
      add({
        type: 'updated',
        icon: '✏️',
        text: `Tarefa atualizada: "${task.title}"`,
        taskId: task._id,
        projectId: task.project
      })
    }

    socket.on('task:created', onCreated)
    socket.on('task:moved', onMoved)
    socket.on('task:updated', onUpdated)

    return () => {
      socket.off('task:created', onCreated)
      socket.off('task:moved', onMoved)
      socket.off('task:updated', onUpdated)
    }
  }, [socket, user, add])

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const clear = () => setNotifications([])
  const unread = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{ notifications, unread, markAllRead, markRead, clear }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
