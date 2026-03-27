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

// Convidar membro (envia email)
router.post('/invite', auth, requireRole('owner', 'admin'), checkMemberLimit, async (req, res) => {
  try {
    const { email, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Usuário já cadastrado' });

    const clientUrl = process.env.CLIENT_URL?.split(',').map(s => s.trim()).find(u => u.startsWith('https')) || process.env.CLIENT_URL;
    const inviteLink = `${clientUrl}/invite?tenant=${req.tenant._id}&email=${encodeURIComponent(email)}&role=${role}`;

    res.json({ message: 'Convite enviado com sucesso' });

    resend.emails.send({
      from: 'TaskFlow <onboarding@resend.dev>',
      to: email,
      subject: `Convite para ${req.tenant.name} - TaskFlow`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1e1e3a;border-radius:12px;color:#e2e8f0"><div style="text-align:center;margin-bottom:24px"><div style="font-size:32px">⚡</div><h2 style="color:#e2e8f0;margin:8px 0">Você foi convidado!</h2></div><p style="color:#94a3b8">Você foi convidado para participar de <strong style="color:#e2e8f0">${req.tenant.name}</strong> no TaskFlow.</p><div style="text-align:center;margin:32px 0"><a href="${inviteLink}" style="background:#6366f1;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Aceitar convite</a></div><p style="color:#64748b;font-size:12px;text-align:center">Se você não esperava este convite, ignore este email.</p></div>`
    }).then(() => console.log('Convite enviado para:', email)).catch(e => console.error('Resend erro convite:', e.message))
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
