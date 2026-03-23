const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { auth } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// Registro
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email já cadastrado' });

    const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = new User({ name, email, password, role: 'owner', emailVerified: false, emailVerifyToken: verifyToken });
    await user.save();

    const tenant = new Tenant({ name: companyName, slug, owner: user._id });
    await tenant.save();

    user.tenant = tenant._id;
    await user.save();

    const verifyLink = `${process.env.CLIENT_URL?.split(',')[1] || process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    await mailer.sendMail({
      from: `"TaskFlow" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Confirme seu email - TaskFlow',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1e1e3a;border-radius:12px;color:#e2e8f0">
          <div style="text-align:center;margin-bottom:24px">
            <div style="font-size:32px">⚡</div>
            <h2 style="color:#e2e8f0;margin:8px 0">Confirme seu email</h2>
          </div>
          <p style="color:#94a3b8">Olá <strong style="color:#e2e8f0">${name}</strong>, clique no botão abaixo para ativar sua conta no TaskFlow.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyLink}" style="background:#6366f1;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Confirmar email</a>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center">Se você não criou uma conta, ignore este email.</p>
        </div>
      `
    });

    res.status(201).json({ message: 'Conta criada! Verifique seu email para ativar.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Confirmar email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ emailVerifyToken: token }).populate('tenant');
    if (!user) return res.status(400).json({ message: 'Token inválido ou expirado' });

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();

    const jwtToken = signToken(user._id);
    // Redireciona pro frontend com o token
    const clientUrl = process.env.CLIENT_URL?.split(',')[1]?.trim() || process.env.CLIENT_URL;
    res.redirect(`${clientUrl}/verify-success?token=${jwtToken}`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Registro por convite
router.post('/register-invite', async (req, res) => {
  try {
    const { name, email, password, tenantId, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email já cadastrado' });

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Workspace não encontrado' });

    const user = new User({ name, email, password, role: role || 'member', tenant: tenant._id });
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({ token, user, tenant });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('tenant');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user, tenant: user.tenant });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Perfil atual
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user, tenant: req.tenant });
});

module.exports = router;
