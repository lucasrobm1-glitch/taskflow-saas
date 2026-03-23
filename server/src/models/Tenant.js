const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  subscriptionStatus: { type: String, enum: ['active', 'inactive', 'trialing', 'past_due', 'canceled'], default: 'trialing' },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  limits: {
    members: { type: Number, default: 5 },
    projects: { type: Number, default: 3 },
    storage: { type: Number, default: 1024 } // MB
  },
  integrations: {
    slack: { webhookUrl: String, channel: String, enabled: { type: Boolean, default: false } },
    github: { accessToken: String, repos: [String], enabled: { type: Boolean, default: false } }
  },
  logo: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
