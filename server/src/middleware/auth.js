const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('tenant');
    if (!user || !user.isActive) return res.status(401).json({ message: 'Usuário não autorizado' });

    req.user = user;
    req.tenant = user.tenant;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

const requirePlan = (...plans) => (req, res, next) => {
  if (!plans.includes(req.tenant?.plan)) {
    return res.status(403).json({ message: 'Plano insuficiente para esta funcionalidade' });
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Permissão insuficiente' });
  }
  next();
};

module.exports = { auth, requirePlan, requireRole };
