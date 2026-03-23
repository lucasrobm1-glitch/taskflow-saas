const router = require('express').Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Configura Google Strategy apenas se as credenciais existirem
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'placeholder') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || ''}/api/sso/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('Email não encontrado no perfil Google'));

      let user = await User.findOne({ email }).populate('tenant');

      if (!user) {
        // Novo usuário via SSO — cria tenant próprio
        const name = profile.displayName || email.split('@')[0];
        const companyName = email.split('@')[1]?.split('.')[0] || 'Minha Empresa';
        const slug = companyName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

        user = new User({ name, email, password: Math.random().toString(36), role: 'owner', emailVerified: true });
        await user.save();

        const tenant = new Tenant({ name: companyName, slug, owner: user._id });
        await tenant.save();

        user.tenant = tenant._id;
        await user.save();
        await user.populate('tenant');
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id).populate('tenant');
  done(null, user);
});

// Iniciar login com Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// Callback do Google
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=sso_failed' }),
  (req, res) => {
    const token = signToken(req.user._id);
    const clientUrl = process.env.CLIENT_URL?.split(',')[1]?.trim() || process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/verify-success?token=${token}`);
  }
);

// Verificar se SSO está disponível
router.get('/status', (req, res) => {
  res.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'placeholder')
  });
});

module.exports = router;
