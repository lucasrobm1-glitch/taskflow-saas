const router = require('express').Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validate');
const { checkMemberLimit } = require('../middleware/planLimits');
const { auditLog } = require('../middleware/auditLog');
const { sendMemberInvite } = require('../services/email');

// Listar membros do tenant
router.get('/', auth, asyncHandler(async (req, res) => {
  const members = await User.find({ tenant: req.tenant._id, isActive: true })
    .select('-password -passwordResetToken -passwordResetExpires -emailVerifyToken')
    .sort({ createdAt: 1 });
  res.json(members);
}));

// Adicionar membro
router.post('/invite', auth, requireRole('owner', 'admin'), checkMemberLimit, schemas.inviteMember, validate, auditLog, asyncHandler(async (req, res) => {
  const { email, role, password, name } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.tenant?.toString() !== req.tenant._id.toString()) {
      return res.status(400).json({ message: 'Este email já está em uso em outro workspace' });
    }
    return res.status(400).json({ message: 'Este usuário já é membro da equipe' });
  }

  const memberName = name || email.split('@')[0];
  const newUser = new User({
    name: memberName, email, password,
    role: role || 'member',
    tenant: req.tenant._id,
    emailVerified: true,
    isActive: true
  });
  await newUser.save();

  // Envia email de boas-vindas
  const loginUrl = `${process.env.CLIENT_URL}/login`;
  sendMemberInvite(email, memberName, req.user.name, req.tenant.name, loginUrl).catch(() => {});

  const userObj = newUser.toObject();
  delete userObj.password;
  res.status(201).json({ message: 'Membro adicionado com sucesso', user: userObj });
}));

// Atualizar role do membro
router.patch('/:userId/role', auth, requireRole('owner', 'admin'), auditLog, asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Role inválida' });
  }

  // Não permite alterar o owner
  const target = await User.findOne({ _id: req.params.userId, tenant: req.tenant._id });
  if (!target) return res.status(404).json({ message: 'Usuário não encontrado' });
  if (target.role === 'owner') return res.status(403).json({ message: 'Não é possível alterar o role do owner' });

  const user = await User.findOneAndUpdate(
    { _id: req.params.userId, tenant: req.tenant._id },
    { role },
    { new: true }
  ).select('-password');
  res.json(user);
}));

// Remover membro (soft delete)
router.delete('/:userId', auth, requireRole('owner', 'admin'), auditLog, asyncHandler(async (req, res) => {
  const target = await User.findOne({ _id: req.params.userId, tenant: req.tenant._id });
  if (!target) return res.status(404).json({ message: 'Usuário não encontrado' });
  if (target.role === 'owner') return res.status(403).json({ message: 'Não é possível remover o owner' });

  await User.findByIdAndUpdate(req.params.userId, { isActive: false });
  res.json({ message: 'Membro removido' });
}));

module.exports = router;
