const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tenant = require('../models/Tenant');

const PLAN_LIMITS = {
  basic: { members: 10, projects: 10, storage: 5120 },
  pro: { members: 50, projects: 50, storage: 20480 },
  enterprise: { members: 999, projects: 999, storage: 102400 }
};

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const { tenantId, plan } = session.metadata;
      await Tenant.findByIdAndUpdate(tenantId, {
        plan,
        stripeSubscriptionId: session.subscription,
        subscriptionStatus: 'active',
        limits: PLAN_LIMITS[plan]
      });
      break;
    }
    case 'customer.subscription.updated': {
      const tenant = await Tenant.findOne({ stripeSubscriptionId: session.id });
      if (tenant) {
        await Tenant.findByIdAndUpdate(tenant._id, { subscriptionStatus: session.status });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const tenant = await Tenant.findOne({ stripeSubscriptionId: session.id });
      if (tenant) {
        await Tenant.findByIdAndUpdate(tenant._id, {
          plan: 'free',
          subscriptionStatus: 'canceled',
          limits: { members: 5, projects: 3, storage: 1024 }
        });
      }
      break;
    }
  }

  res.json({ received: true });
});

module.exports = router;
