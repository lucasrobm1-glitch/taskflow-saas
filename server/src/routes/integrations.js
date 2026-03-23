const router = require('express').Router();
const axios = require('axios');
const Tenant = require('../models/Tenant');
const { auth, requireRole, requirePlan } = require('../middleware/auth');

// Configurar Slack
router.post('/slack', auth, requireRole('owner', 'admin'), requirePlan('pro', 'enterprise'), async (req, res) => {
  try {
    const { webhookUrl, channel } = req.body;
    await Tenant.findByIdAndUpdate(req.tenant._id, {
      'integrations.slack': { webhookUrl, channel, enabled: true }
    });
    // Testar webhook
    await axios.post(webhookUrl, { text: `✅ Integração com ${req.tenant.name} configurada com sucesso!` });
    res.json({ message: 'Slack configurado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Desativar Slack
router.delete('/slack', auth, requireRole('owner', 'admin'), async (req, res) => {
  try {
    await Tenant.findByIdAndUpdate(req.tenant._id, { 'integrations.slack.enabled': false });
    res.json({ message: 'Slack desativado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Configurar GitHub
router.post('/github', auth, requireRole('owner', 'admin'), requirePlan('pro', 'enterprise'), async (req, res) => {
  try {
    const { accessToken, repos } = req.body;
    // Verificar token
    const { data } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });
    await Tenant.findByIdAndUpdate(req.tenant._id, {
      'integrations.github': { accessToken, repos, enabled: true }
    });
    res.json({ message: 'GitHub configurado', user: data.login });
  } catch (err) {
    res.status(500).json({ message: 'Token GitHub inválido' });
  }
});

// Listar repos do GitHub
router.get('/github/repos', auth, requirePlan('pro', 'enterprise'), async (req, res) => {
  try {
    const token = req.tenant.integrations?.github?.accessToken;
    if (!token) return res.status(400).json({ message: 'GitHub não configurado' });

    const { data } = await axios.get('https://api.github.com/user/repos?per_page=50', {
      headers: { Authorization: `token ${token}` }
    });
    res.json(data.map(r => ({ id: r.id, name: r.full_name, url: r.html_url })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Status das integrações
router.get('/status', auth, async (req, res) => {
  const { slack, github } = req.tenant.integrations || {};
  res.json({
    slack: { enabled: slack?.enabled || false, channel: slack?.channel },
    github: { enabled: github?.enabled || false, repos: github?.repos || [] }
  });
});

module.exports = router;
