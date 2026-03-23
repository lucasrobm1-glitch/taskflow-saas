const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tenant = require('../models/Tenant');
const { auth, requireRole } = require('../middleware/auth');

const PLANS = {
  basic: { price: process.env.STRIPE_PRICE_BASIC, limits: { members: 10, projects: 10, storage: 5120 } },
  pro: { price: process.env.STRIPE_PRICE_PRO, limits: { members: 50, projects: 50, storage: 20480 } },
  enterprise: { price: process.env.STRIPE_PRICE_ENTERPRISE, limits: { members: 999, projects: 999, storage: 102400 } }
};

// Planos disponíveis
router.get('/plans', (req, res) => {
  res.json([
    { id: 'free', name: 'Free', price: 0, limits: { members: 5, projects: 3, storage: 1024 }, features: ['3 projetos', '5 membros', 'Kanban básico'] },
    { id: 'basic', name: 'Basic', price: 29, limits: PLANS.basic.limits, features: ['10 projetos', '10 membros', 'Sprints', 'Time tracking'] },
    { id: 'pro', name: 'Pro', price: 79, limits: PLANS.pro.limits, features: ['50 projetos', '50 membros', 'Relatórios', 'Slack & GitHub'] },
    { id: 'enterprise', name: 'Enterprise', price: 199, limits: PLANS.enterprise.limits, features: ['Ilimitado', 'SSO', 'Suporte dedicado'] }
  ]);
});

// Criar checkout session
router.post('/checkout', auth, requireRole('owner'), async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: 'Plano inválido' });

    let customerId = req.tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: req.user.email, name: req.tenant.name });
      customerId = customer.id;
      await Tenant.findByIdAndUpdate(req.tenant._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].price, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/settings/billing?canceled=true`,
      metadata: { tenantId: req.tenant._id.toString(), plan }
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Portal do cliente (gerenciar assinatura)
router.post('/portal', auth, requireRole('owner'), async (req, res) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: req.tenant.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/settings/billing`
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Status da assinatura
router.get('/status', auth, async (req, res) => {
  res.json({
    plan: req.tenant.plan,
    status: req.tenant.subscriptionStatus,
    trialEndsAt: req.tenant.trialEndsAt,
    limits: req.tenant.limits
  });
});

module.exports = router;
