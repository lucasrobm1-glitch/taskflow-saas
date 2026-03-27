require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const passport = require('passport');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const sprintRoutes = require('./routes/sprints');
const teamRoutes = require('./routes/teams');
const subscriptionRoutes = require('./routes/subscriptions');
const reportRoutes = require('./routes/reports');
const integrationRoutes = require('./routes/integrations');
const webhookRoutes = require('./routes/webhooks');
const ssoRoutes = require('./routes/sso');
const messageRoutes = require('./routes/messages');

const { setupSocket } = require('./services/socket');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(s => s.trim());

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true
};

const io = new Server(server, { cors: corsOptions });
app.use(cors(corsOptions));

// Stripe webhook precisa do raw body
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());
app.use(passport.initialize());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/sso', ssoRoutes);
app.use('/api/messages', messageRoutes);

let dbConnected = false;
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: dbConnected }));

setupSocket(io);

// Sobe o servidor imediatamente para o health check do Railway passar
server.listen(process.env.PORT || 5000, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT || 5000}`);
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    dbConnected = true;
    console.log('MongoDB conectado');
  })
  .catch(err => console.error('Erro MongoDB:', err));

module.exports = { app, io };
