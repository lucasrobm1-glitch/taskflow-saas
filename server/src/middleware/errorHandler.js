const logger = require('../utils/logger');

// Centraliza todos os erros da aplicação
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  logger.error(message, {
    status,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?._id,
    tenantId: req.tenant?._id,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// Wrapper para async route handlers — elimina try/catch repetitivo
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
