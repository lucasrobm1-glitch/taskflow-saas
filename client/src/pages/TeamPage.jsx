import React, { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext.jsx"

const ROLE_COLORS = { owner: "#f59e0b", admin: "#6366f1", member: "#10b981", viewer: "#94a3b8" }

const API = import.meta.env.VITE_API_URL || ''

function apiFetch(path, opts) {
  const token = localStorage.getItem("token")
  return fetch(API + path, { method: (opts && opts.method) || "GET", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: opts && opts.body }).then(function(r) { return r.json() })
}

export default function TeamPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [msg, setMsg] = useState("")

  useEffect(function() {
    apiFetch("/api/teams").then(function(d) { if (Array.isArray(d)) setMembers(d) }).catch(function() {})
  }, [])

  function sendInvite(e) {
    e.preventDefault(); setMsg("")
    apiFetch("/api/teams/invite", { method: "POST", body: JSON.stringify({ email: email, role: role }) })
      .then(function(data) {
        if (data && data.message) {
          setMsg(data.message)
          if (data.message === 'Convite enviado com sucesso') {
            setTimeout(function() { setShowInvite(false); setEmail(""); setMsg("") }, 1500)
          }
        }
      })
      .catch(function(err) { setMsg("Erro de conexão. Tente novamente.") })
  }

  function updateRole(userId, newRole) {
    apiFetch("/api/teams/" + userId + "/role", { method: "PATCH", body: JSON.stringify({ role: newRole }) })
      .then(function(data) { if (data && data._id) setMembers(members.map(function(m) { return m._id === userId ? data : m })) }).catch(function() {})
  }

  function removeMember(userId) {
    if (!window.confirm("Remover?")) return
    apiFetch("/api/teams/" + userId, { method: "DELETE" }).then(function() { setMembers(members.filter(function(m) { return m._id !== userId })) }).catch(function() {})
  }

  var inp = { padding: "8px 12px", background: "#16213e", border: "1px solid #2a2a4a", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }

  return React.createElement("div", { style: { padding: 32 } },
    React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 } },
      React.createElement("div", null,
        React.createElement("h1", { style: { fontSize: 22, fontWeight: 700, color: "#e2e8f0" } }, "Equipe"),
        React.createElement("p", { style: { color: "#94a3b8", fontSize: 14, marginTop: 4 } }, members.length + " membros")
      ),
      user && (user.role === "owner" || user.role === "admin") && React.createElement("button", { onClick: function() { setShowInvite(true) }, style: { padding: "7px 14px", background: "#6366f1", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 } }, "+ Convidar")
    ),
    React.createElement("div", { style: { background: "#1e1e3a", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden" } },
      React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
        React.createElement("thead", null,
          React.createElement("tr", { style: { borderBottom: "1px solid #2a2a4a" } },
            React.createElement("th", { style: { padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#94a3b8" } }, "Membro"),
            React.createElement("th", { style: { padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#94a3b8" } }, "Email"),
            React.createElement("th", { style: { padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#94a3b8" } }, "Funcao"),
            React.createElement("th", { style: { padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#94a3b8" } }, "Ultimo acesso"),
            React.createElement("th", null)
          )
        ),
        React.createElement("tbody", null,
          members.length === 0 && React.createElement("tr", null, React.createElement("td", { colSpan: 5, style: { padding: 32, textAlign: "center", color: "#94a3b8" } }, "Nenhum membro")),
          members.map(function(member) {
            return React.createElement("tr", { key: member._id, style: { borderBottom: "1px solid #2a2a4a" } },
              React.createElement("td", { style: { padding: "12px 16px" } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                  React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "white", fontWeight: 700 } }, member.name ? member.name[0].toUpperCase() : "?"),
                  React.createElement("span", { style: { fontSize: 14, color: "#e2e8f0" } }, member.name),
                  user && member._id === user._id && React.createElement("span", { style: { fontSize: 11, color: "#94a3b8" } }, "(voce)")
                )
              ),
              React.createElement("td", { style: { padding: "12px 16px", fontSize: 14, color: "#94a3b8" } }, member.email),
              React.createElement("td", { style: { padding: "12px 16px" } },
                user && (user.role === "owner" || user.role === "admin") && member._id !== user._id
                  ? React.createElement("select", { value: member.role, onChange: function(e) { updateRole(member._id, e.target.value) }, style: { padding: "4px 8px", background: "#16213e", border: "1px solid #2a2a4a", borderRadius: 6, fontSize: 13, color: ROLE_COLORS[member.role] || "#94a3b8", outline: "none" } },
                      React.createElement("option", { value: "admin" }, "Admin"),
                      React.createElement("option", { value: "member" }, "Membro"),
                      React.createElement("option", { value: "viewer" }, "Visualizador")
                    )
                  : React.createElement("span", { style: { fontSize: 13, color: ROLE_COLORS[member.role] || "#94a3b8", fontWeight: 600 } }, member.role)
              ),
              React.createElement("td", { style: { padding: "12px 16px", fontSize: 13, color: "#94a3b8" } }, member.lastLogin ? new Date(member.lastLogin).toLocaleDateString("pt-BR") : "Nunca"),
              React.createElement("td", { style: { padding: "12px 16px" } },
                user && (user.role === "owner" || user.role === "admin") && member._id !== user._id && member.role !== "owner" &&
                  React.createElement("button", { onClick: function() { removeMember(member._id) }, style: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8" } }, "x")
              )
            )
          })
        )
      )
    ),
    showInvite && React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } },
      React.createElement("div", { style: { background: "#1e1e3a", border: "1px solid #2a2a4a", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 } },
        React.createElement("h3", { style: { fontSize: 18, fontWeight: 600, color: "#e2e8f0", marginBottom: 20 } }, "Convidar Membro"),
        msg && React.createElement("div", { style: { background: msg === 'Convite enviado com sucesso' ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: "1px solid " + (msg === 'Convite enviado com sucesso' ? "#10b981" : "#ef4444"), borderRadius: 8, padding: "8px 12px", marginBottom: 12, color: msg === 'Convite enviado com sucesso' ? "#34d399" : "#f87171", fontSize: 13 } }, msg),
        React.createElement("form", { onSubmit: sendInvite, style: { display: "flex", flexDirection: "column", gap: 14 } },
          React.createElement("input", { style: inp, type: "email", placeholder: "email@exemplo.com", value: email, onChange: function(e) { setEmail(e.target.value) }, required: true }),
          React.createElement("select", { style: inp, value: role, onChange: function(e) { setRole(e.target.value) } },
            React.createElement("option", { value: "admin" }, "Admin"),
            React.createElement("option", { value: "member" }, "Membro"),
            React.createElement("option", { value: "viewer" }, "Visualizador")
          ),
          React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" } },
            React.createElement("button", { type: "button", onClick: function() { setShowInvite(false) }, style: { padding: "8px 16px", background: "transparent", border: "1px solid #2a2a4a", borderRadius: 8, color: "#94a3b8", cursor: "pointer" } }, "Cancelar"),
            React.createElement("button", { type: "submit", style: { padding: "8px 16px", background: "#6366f1", border: "none", borderRadius: 8, color: "white", fontWeight: 600, cursor: "pointer" } }, "Enviar")
          )
        )
      )
    )
  )
}