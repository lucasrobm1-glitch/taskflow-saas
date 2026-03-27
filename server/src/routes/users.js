const router = require('express').Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validate');
const { auditLog } = require('../middleware/auditLog');
const { body } = require('express-validator');

// Atualizar perfil
router.put('/me', auth, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('avatar').optional().trim().isURL().withMessage('URL de avatar inválida')
], validate, asyncHandler(async (req, res) => {
  const { name, avatar, notifications } = req.body;
  const update = {};
  if (name) update.name = name;
  if (avatar !== undefined) update.avatar = avatar;
  if (notifications) update.notifications = notifications;

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true })
    .select('-password -passwordResetToken -passwordResetExpires');
  res.json(user);
}));

// Alterar senha
router.put('/me/password', auth, schemas.changePassword, validate, auditLog, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ message: 'Senha atual incorreta' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Senha alterada com sucesso' });
}));

// Buscar usuários do tenant
router.get('/search', auth, asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const users = await User.find({
    tenant: req.tenant._id,
    isActive: true,
    $or: [
      { name: { $regex: safeQ, $options: 'i' } },
      { email: { $regex: safeQ, $options: 'i' } }
    ]
  }).select('name email avatar role').limit(10);
  res.json(users);
}));

module.exports = router;
