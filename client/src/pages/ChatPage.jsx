import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const API = import.meta.env.VITE_API_URL || ''

const apiFetch = (path) => {
  const token = localStorage.getItem('token')
  return fetch(API + path, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}

export default function ChatPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const socket = useSocket()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [projectName, setProjectName] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    const url = projectId ? `/api/messages?projectId=${projectId}` : '/api/messages'
    apiFetch(url).then(d => Array.isArray(d) && setMessages(d))
    if (projectId) {
      apiFetch(`/api/projects/${projectId}`).then(d => d.name && setProjectName(d.name))
      socket?.emit('join:project', projectId)
    }
  }, [projectId, socket])

  useEffect(() => {
    if (!socket) return
    const handler = (msg) => {
      const msgProject = msg.project || null
      const currentProject = projectId || null
      if (String(msgProject) === String(currentProject)) {
        setMessages(prev => [...prev, msg])
      }
    }
    socket.on('chat:message', handler)
    return () => socket.off('chat:message', handler)
  }, [socket, projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (e) => {
    e.preventDefault()
    if (!text.trim() || !socket) return
    socket.emit('chat:message', { text: text.trim(), projectId: projectId || null })
    setText('')
  }

  const formatTime = (date) => new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1]
    const sameDay = prev && formatDate(prev.createdAt) === formatDate(msg.createdAt)
    if (!sameDay) acc.push({ type: 'date', label: formatDate(msg.createdAt) })
    acc.push({ type: 'msg', ...msg })
    return acc
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f0f1a' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #2a2a4a', background: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
            {projectId ? `Chat — ${projectName}` : 'Chat Geral'}
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>
            {projectId ? 'Canal do projeto' : 'Canal da equipe'}
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {groupedMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 14 }}>
            Nenhuma mensagem ainda. Seja o primeiro a falar! 👋
          </div>
        )}
        {groupedMessages.map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={i} style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', background: '#1e1e3a', padding: '3px 10px', borderRadius: 999 }}>{item.label}</span>
              </div>
            )
          }
          const isMe = item.sender?._id === user?._id || item.sender === user?._id
          return (
            <div key={item._id || i} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
              {!isMe && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                  {item.sender?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div style={{ maxWidth: '65%' }}>
                {!isMe && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, marginLeft: 4 }}>{item.sender?.name}</div>}
                <div style={{ background: isMe ? '#6366f1' : '#1e1e3a', color: '#e2e8f0', padding: '8px 12px', borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {item.text}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, textAlign: isMe ? 'right' : 'left', marginLeft: 4, marginRight: 4 }}>
                  {formatTime(item.createdAt)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ padding: '12px 24px', borderTop: '1px solid #2a2a4a', background: '#1a1a2e', display: 'flex', gap: 10 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          style={{ flex: 1, padding: '10px 14px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none' }}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(e)}
        />
        <button type="submit" disabled={!text.trim()} style={{ padding: '10px 18px', background: '#6366f1', border: 'none', borderRadius: 10, color: 'white', fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed', opacity: text.trim() ? 1 : 0.5, fontSize: 14 }}>
          Enviar
        </button>
      </form>
    </div>
  )
}
