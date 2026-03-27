const logger = require('../utils/logger');

// Ações que devem ser auditadas
const AUDITABLE_ACTIONS = {
  'DELETE /api/projects': 'project.deleted',
  'DELETE /api/tasks': 'task.deleted',
  'DELETE /api/teams': 'member.removed',
  'PATCH /api/teams': 'member.role_changed',
  'POST /api/teams/invite': 'member.invited',
  'POST /api/subscriptions/checkout': 'subscription.checkout',
  'POST /api/integrations/slack': 'integration.slack_configured',
  'POST /api/integrations/github': 'integration.github_configured',
  'PUT /api/users/me/password': 'user.password_changed'
};

const auditLog = (req, res, next) => {
  const key = `${req.method} ${req.route?.path ? req.baseUrl : req.path}`;
  const action = Object.entries(AUDITABLE_ACTIONS).find(([k]) => req.originalUrl.startsWith(k.split(' ')[1]) && req.method === k.split(' ')[0]);

  if (action && req.user) {
    logger.info('AUDIT', {
      action: action[1],
      userId: req.user._id,
      userName: req.user.name,
      tenantId: req.tenant?._id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      params: req.params,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = { auditLog };
