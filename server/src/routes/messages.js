const router = require('express').Router();
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

// Buscar histórico (últimas 50 mensagens)
router.get('/', auth, async (req, res) => {
  try {
    const projectId = req.query.projectId || null;
    const messages = await Message.find({ tenant: req.tenant._id, project: projectId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 })
      .limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
