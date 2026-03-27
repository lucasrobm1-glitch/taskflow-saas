const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({ windowMs, max, message: { message }, standardHeaders: true, legacyHeaders: false });

module.exports = {
  // Login: 10 tentativas por 15 min
  loginLimiter: createLimiter(15 * 60 * 1000, 10, 'Muitas tentativas de login. Tente novamente em 15 minutos.'),

  // API geral: 200 req por minuto por IP
  apiLimiter: createLimiter(60 * 1000, 200, 'Muitas requisições. Tente novamente em breve.'),

  // Criação de recursos: 30 por minuto
  createLimiter: createLimiter(60 * 1000, 30, 'Muitas criações em pouco tempo. Aguarde um momento.'),

  // Password reset: 5 por hora
  passwordResetLimiter: createLimiter(60 * 60 * 1000, 5, 'Muitas tentativas de reset. Tente novamente em 1 hora.')
};
