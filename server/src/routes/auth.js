const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validate');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { sendPasswordReset, sendWelcome } = require('../services/email');
const logger = require('../utils/logger');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Registro
router.post('/register', schemas.register, validate, asyncHandler(async (req, res) => {
  const { name, email, password, companyName } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email já cadastrado' });

  const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

  const user = new User({ name, email, password, role: 'owner', emailVerified: true });
  await user.save();

  const tenant = new Tenant({ name: companyName, slug, owner: user._id });
  await tenant.save();

  user.tenant = tenant._id;
  await user.save();

  sendWelcome(email, name, companyName).catch(() => {});

  logger.info('Novo registro', { userId: user._id, tenantId: tenant._id, email });
  const token = signToken(user._id);
  res.status(201).json({ token, user, tenant, message: 'Conta criada com sucesso!' });
}));

// Registro por convite
router.post('/register-invite', asyncHandler(async (req, res) => {
  const { name, email, password, tenantId, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email já cadastrado' });

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) return res.status(404).json({ message: 'Workspace não encontrado' });

  const user = new User({ name, email, password, role: role || 'member', tenant: tenant._id, emailVerified: true });
  await user.save();

  const token = signToken(user._id);
  res.status(201).json({ token, user, tenant });
}));

// Login
router.post('/login', loginLimiter, schemas.login, validate, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).populate('tenant');
  if (!user || !(await user.comparePassword(password))) {
    logger.warn('Tentativa de login falhou', { email, ip: req.ip });
    return res.status(401).json({ message: 'Email ou senha inválidos' });
  }

  if (!user.isActive) return res.status(401).json({ message: 'Conta desativada' });

  user.lastLogin = new Date();
  await user.save();

  logger.info('Login realizado', { userId: user._id, email });
  const token = signToken(user._id);
  res.json({ token, user, tenant: user.tenant });
}));

// Perfil atual
router.get('/me', auth, asyncHandler(async (req, res) => {
  res.json({ user: req.user, tenant: req.tenant });
}));

// Solicitar reset de senha
router.post('/forgot-password', passwordResetLimiter, schemas.forgotPassword, validate, asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Sempre retorna 200 para não revelar se email existe
  if (!user) return res.json({ message: 'Se o email existir, você receberá as instruções.' });

  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hora
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendPasswordReset(email, user.name, resetUrl);

  logger.info('Password reset solicitado', { userId: user._id, email });
  res.json({ message: 'Se o email existir, você receberá as instruções.' });
}));

// Redefinir senha
router.post('/reset-password', schemas.resetPassword, validate, asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ message: 'Token inválido ou expirado' });

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info('Senha redefinida', { userId: user._id });
  res.json({ message: 'Senha redefinida com sucesso' });
}));

module.exports = router;
