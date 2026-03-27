const router = require('express').Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { auth } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const sanitize = (str) => typeof str === 'string' ? str.replace(/[<>]/g, '') : str;

// Registro
router.post('/register', async (req, res) => {
  try {
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

    const token = signToken(user._id);
    res.status(201).json({ token, user, tenant, message: 'Conta criada com sucesso!' });
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

    const user = new User({ name, email, password, role: role || 'member', tenant: tenant._id, emailVerified: true });
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({ token, user, tenant });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    const user = await User.findOne({ email: sanitize(email).toLowerCase() }).populate('tenant');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
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
