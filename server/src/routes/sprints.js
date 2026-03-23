const router = require('express').Router();
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { tenant: req.tenant._id };
    if (projectId) filter.project = projectId;
    const sprints = await Sprint.find(filter).sort({ startDate: -1 });
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const sprint = new Sprint({ ...req.body, tenant: req.tenant._id });
    await sprint.save();
    res.status(201).json(sprint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      req.body,
      { new: true }
    );
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Iniciar sprint
router.patch('/:id/start', auth, async (req, res) => {
  try {
    // Desativar sprint ativo do projeto
    const sprint = await Sprint.findOne({ _id: req.params.id, tenant: req.tenant._id });
    await Sprint.updateMany({ project: sprint.project, status: 'active' }, { status: 'completed', completedAt: new Date() });
    sprint.status = 'active';
    await sprint.save();
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Completar sprint
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );
    // Mover tarefas não concluídas para backlog
    await Task.updateMany({ sprint: sprint._id, column: { $ne: 'done' } }, { sprint: null });
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Stats do sprint
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ sprint: req.params.id, tenant: req.tenant._id });
    const total = tasks.length;
    const done = tasks.filter(t => t.column === 'done').length;
    const inProgress = tasks.filter(t => t.column === 'in_progress').length;
    const todo = tasks.filter(t => t.column === 'todo').length;
    const totalTime = tasks.reduce((acc, t) => acc + t.timeEntries.reduce((a, e) => a + (e.duration || 0), 0), 0);
    res.json({ total, done, inProgress, todo, totalTime, completion: total ? Math.round((done / total) * 100) : 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
