const router = require('express').Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { Resend } = require('resend');
const { checkMemberLimit } = require('../middleware/planLimits');

const resend = new Resend(process.env.RESEND_API_KEY);

// Listar membros do tenant
router.get('/', auth, async (req, res) => {
  try {
    const members = await User.find({ tenant: req.tenant._id, isActive: true }).select('-password');
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Adicionar membro diretamente (email + senha + função)
router.post('/invite', auth, requireRole('owner', 'admin'), checkMemberLimit, async (req, res) => {
  try {
    const { email, role, password, name } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios' });

    const existing = await User.findOne({ email });
    if (existing) {
      // Se já existe mas é de outro tenant, associa ao tenant atual
      if (existing.tenant && existing.tenant.toString() !== req.tenant._id.toString()) {
        return res.status(400).json({ message: 'Este email já está em uso em outro workspace' });
      }
      if (existing.tenant && existing.tenant.toString() === req.tenant._id.toString()) {
        return res.status(400).json({ message: 'Este usuário já é membro da equipe' });
      }
    }

    const memberName = name || email.split('@')[0];
    const newUser = new User({
      name: memberName,
      email,
      password,
      role: role || 'member',
      tenant: req.tenant._id,
      emailVerified: true,
      isActive: true
    });
    await newUser.save();

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({ message: 'Membro adicionado com sucesso', user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Atualizar role do membro
router.patch('/:userId/role', auth, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, tenant: req.tenant._id },
      { role: req.body.role },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remover membro
router.delete('/:userId', auth, requireRole('owner', 'admin'), async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.params.userId, tenant: req.tenant._id },
      { isActive: false }
    );
    res.json({ message: 'Membro removido' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
