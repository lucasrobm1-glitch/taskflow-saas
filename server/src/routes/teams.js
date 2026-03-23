const router = require('express').Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Listar membros do tenant
router.get('/', auth, async (req, res) => {
  try {
    const members = await User.find({ tenant: req.tenant._id, isActive: true }).select('-password');
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Convidar membro (envia email)
router.post('/invite', auth, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { email, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Usuário já cadastrado' });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const inviteLink = `${process.env.CLIENT_URL}/invite?tenant=${req.tenant._id}&email=${email}&role=${role}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: `Convite para ${req.tenant.name}`,
      html: `<p>Você foi convidado para participar de <strong>${req.tenant.name}</strong>.</p>
             <a href="${inviteLink}">Aceitar convite</a>`
    });

    res.json({ message: 'Convite enviado com sucesso' });
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
