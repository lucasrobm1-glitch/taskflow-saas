const router = require('express').Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Atualizar perfil
router.put('/me', auth, async (req, res) => {
  try {
    const { name, avatar, notifications } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar, notifications },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Alterar senha
router.put('/me/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Buscar usuários do tenant (para atribuição de tarefas)
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      tenant: req.tenant._id,
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('name email avatar').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
