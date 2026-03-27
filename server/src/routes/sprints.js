const router = require('express').Router();
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validate');
const { checkSprintAccess } = require('../middleware/planLimits');

router.get('/', auth, checkSprintAccess, asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const filter = { tenant: req.tenant._id };
  if (projectId) filter.project = projectId;
  const sprints = await Sprint.find(filter).sort({ startDate: -1 });
  res.json(sprints);
}));

router.post('/', auth, checkSprintAccess, schemas.createSprint, validate, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;
  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ message: 'Data de fim deve ser após a data de início' });
  }
  const sprint = new Sprint({ ...req.body, tenant: req.tenant._id });
  await sprint.save();
  res.status(201).json(sprint);
}));

router.put('/:id', auth, asyncHandler(async (req, res) => {
  const allowed = ['name', 'goal', 'startDate', 'endDate'];
  const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const sprint = await Sprint.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant._id },
    update,
    { new: true, runValidators: true }
  );
  if (!sprint) return res.status(404).json({ message: 'Sprint não encontrado' });
  res.json(sprint);
}));

// Iniciar sprint
router.patch('/:id/start', auth, asyncHandler(async (req, res) => {
  const sprint = await Sprint.findOne({ _id: req.params.id, tenant: req.tenant._id });
  if (!sprint) return res.status(404).json({ message: 'Sprint não encontrado' });
  if (sprint.status === 'active') return res.status(400).json({ message: 'Sprint já está ativo' });

  await Sprint.updateMany({ project: sprint.project, status: 'active' }, { status: 'completed', completedAt: new Date() });
  sprint.status = 'active';
  await sprint.save();
  res.json(sprint);
}));

// Completar sprint
router.patch('/:id/complete', auth, asyncHandler(async (req, res) => {
  const sprint = await Sprint.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant._id },
    { status: 'completed', completedAt: new Date() },
    { new: true }
  );
  if (!sprint) return res.status(404).json({ message: 'Sprint não encontrado' });

  // Move tarefas não concluídas para backlog
  await Task.updateMany({ sprint: sprint._id, column: { $ne: 'done' } }, { sprint: null });
  res.json(sprint);
}));

// Stats do sprint
router.get('/:id/stats', auth, asyncHandler(async (req, res) => {
  const tasks = await Task.find({ sprint: req.params.id, tenant: req.tenant._id });
  const total = tasks.length;
  const done = tasks.filter(t => t.column === 'done').length;
  const inProgress = tasks.filter(t => t.column === 'in_progress').length;
  const todo = tasks.filter(t => t.column === 'todo').length;
  const totalTime = tasks.reduce((acc, t) => acc + t.timeEntries.reduce((a, e) => a + (e.duration || 0), 0), 0);
  res.json({ total, done, inProgress, todo, totalTime, completion: total ? Math.round((done / total) * 100) : 0 });
}));

module.exports = router;
