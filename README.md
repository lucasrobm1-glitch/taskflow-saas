# TaskFlow - Gerenciador de Tarefas SaaS

Sistema completo de gerenciamento de projetos com Kanban, Sprints, Time Tracking, Relatórios e integrações com Slack e GitHub.

## Stack
- **Frontend**: React 18, Socket.io-client, Recharts, @hello-pangea/dnd
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Pagamentos**: Stripe
- **Integrações**: Slack Webhooks, GitHub API

## Como rodar

### Pré-requisitos
- Node.js 18+
- MongoDB rodando localmente ou MongoDB Atlas

### Backend
```bash
cd server
cp .env.example .env
# Edite o .env com suas chaves
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm start
```

### Com Docker
```bash
docker-compose up
```

## Funcionalidades

- **Multi-tenant**: cada empresa tem seu workspace isolado
- **Kanban**: drag & drop em tempo real via Socket.io
- **Sprints**: planejamento, início, conclusão e burndown chart
- **Time Tracking**: iniciar/parar timer por tarefa
- **Relatórios**: por status, prioridade, membro e burndown
- **Equipe**: convite por email, roles (owner/admin/member/viewer)
- **Planos**: Free, Basic (R$29), Pro (R$79), Enterprise (R$199)
- **Slack**: notificações via webhook
- **GitHub**: integração com repositórios

## Variáveis de ambiente (server/.env)

| Variável | Descrição |
|---|---|
| MONGODB_URI | String de conexão MongoDB |
| JWT_SECRET | Chave secreta JWT |
| STRIPE_SECRET_KEY | Chave secreta Stripe |
| STRIPE_WEBHOOK_SECRET | Secret do webhook Stripe |
| STRIPE_PRICE_BASIC/PRO/ENTERPRISE | IDs dos preços no Stripe |
| SLACK_BOT_TOKEN | Token do bot Slack |
| GITHUB_CLIENT_ID/SECRET | Credenciais OAuth GitHub |
| SMTP_* | Configurações de email |
