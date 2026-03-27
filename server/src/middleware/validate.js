const { validationResult, body, param, query } = require('express-validator');

// Middleware que verifica os resultados da validação
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Dados inválidos',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Schemas de validação reutilizáveis
const schemas = {
  register: [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter maiúscula, minúscula e número'),
    body('companyName').trim().notEmpty().withMessage('Nome da empresa é obrigatório').isLength({ max: 100 })
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
  ],

  createProject: [
    body('name').trim().notEmpty().withMessage('Nome do projeto é obrigatório').isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Cor inválida'),
    body('icon').optional().trim().isLength({ max: 10 })
  ],

  createTask: [
    body('title').trim().notEmpty().withMessage('Título é obrigatório').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 5000 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('type').optional().isIn(['task', 'bug', 'feature', 'improvement']),
    body('project').notEmpty().withMessage('Projeto é obrigatório').isMongoId(),
    body('estimatedHours').optional().isFloat({ min: 0, max: 9999 }),
    body('dueDate').optional().isISO8601().withMessage('Data inválida')
  ],

  createSprint: [
    body('name').trim().notEmpty().withMessage('Nome do sprint é obrigatório').isLength({ max: 100 }),
    body('startDate').isISO8601().withMessage('Data de início inválida'),
    body('endDate').isISO8601().withMessage('Data de fim inválida'),
    body('project').notEmpty().isMongoId()
  ],

  inviteMember: [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('name').optional().trim().isLength({ max: 100 }),
    body('role').optional().isIn(['admin', 'member', 'viewer']),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres')
  ],

  addComment: [
    body('text').trim().notEmpty().withMessage('Comentário não pode ser vazio').isLength({ max: 2000 })
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword').isLength({ min: 8 }).withMessage('Nova senha deve ter no mínimo 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter maiúscula, minúscula e número')
  ],

  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido')
  ],

  resetPassword: [
    body('token').notEmpty().withMessage('Token é obrigatório'),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter maiúscula, minúscula e número')
  ],

  mongoId: (field = 'id') => [
    param(field).isMongoId().withMessage('ID inválido')
  ],

  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite inválido (1-100)')
  ]
};

module.exports = { validate, schemas };
