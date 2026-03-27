const jwt = require('jsonwebtoken');
const User = require('../models/User');

const setupSocket = (io) => {
  // Autenticação via socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Token não fornecido'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).populate('tenant');
      if (!user) return next(new Error('Usuário não encontrado'));
      socket.user = user;
      socket.tenant = user.tenant;
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuário conectado: ${socket.user.name}`);

    // Entrar em sala do tenant (chat geral)
    socket.join(`tenant:${socket.tenant._id}`);

    // Entrar em sala do projeto
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    // Sair de sala do projeto
    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Notificar que usuário está editando uma tarefa
    socket.on('task:editing', ({ taskId, projectId }) => {
      socket.to(`project:${projectId}`).emit('task:editing', {
        taskId,
        user: { id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar }
      });
    });

    // Chat em tempo real
    socket.on('chat:message', async ({ text, projectId }) => {
      try {
        const Message = require('../models/Message');
        const clean = String(text || '').replace(/[<>]/g, '').trim().slice(0, 2000);
        if (!clean) return;
        const msg = await Message.create({
          tenant: socket.tenant._id,
          project: projectId || null,
          sender: socket.user._id,
          text: clean
        });
        const populated = await msg.populate('sender', 'name');
        const room = projectId ? `project:${projectId}` : `tenant:${socket.tenant._id}`;
        io.to(room).emit('chat:message', populated);
      } catch (err) {
        socket.emit('chat:error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Usuário desconectado: ${socket.user.name}`);
    });
  });
};

module.exports = { setupSocket };
