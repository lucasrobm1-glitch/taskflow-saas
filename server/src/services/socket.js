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

    socket.on('disconnect', () => {
      console.log(`Usuário desconectado: ${socket.user.name}`);
    });
  });
};

module.exports = { setupSocket };
