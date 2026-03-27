const router = require('express').Router();
const Task = require('../models/Task');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validate');
const { createLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLog');
const { notifyTaskCreated, notifyTaskMoved } = require('../services/slack');

// Listar tarefas com paginação
router.get('/', auth, asyncHandler(async (req, res) => {
  const { projectId, sprintId, column, assignee, search, page = 1, limit = 50 } = req.query;
  const filter = { tenant: req.tenant._id };
  if (projectId) filter.project = projectId;
  if (sprintId) filter.sprint = sprintId;
  if (column) filter.column = column;
  if (assignee) filter.assignees = assignee;
  if (search) filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignees', 'name avatar')
      .populate('reporter', 'name avatar')
      .sort({ order: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Task.countDocuments(filter)
  ]);

  res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}));

// Criar tarefa
router.post('/', auth, createLimiter, schemas.createTask, validate, asyncHandler(async (req, res) => {
  const task = new Task({ ...req.body, tenant: req.tenant._id, reporter: req.user._id });
  await task.save();
  await task.populate('assignees', 'name avatar');
  await task.populate('reporter', 'name avatar');

  req.app.get('io')?.to(`project:${task.project}`).emit('task:created', task);
  notifyTaskCreated(req.tenant._id, task, req.user.name).catch(() => {});
  res.status(201).json(task);
}));

// Buscar tarefa
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, tenant: req.tenant._id })
    .populate('assignees', 'name avatar email')
    .populate('reporter', 'name avatar')
    .populate('sprint', 'name')
    .populate('comments.user', 'name avatar');
  if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });
  res.json(task);
}));

// Atualizar tarefa
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const isAdminOrOwner = ['admin', 'owner'].includes(req.user.role);
  const filter = { _id: req.params.id, tenant: req.tenant._id };
  if (!isAdminOrOwner) {
    filter.$or = [{ reporter: req.user._id }, { assignees: req.user._id }];
  }

  // Sanitiza campos permitidos
  const allowed = ['title', 'description', 'priority', 'type', 'tags', 'dueDate', 'estimatedHours', 'assignees', 'sprint', 'progress', 'column', 'order'];
  const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  const task = await Task.findOneAndUpdate(filter, update, { new: true, runValidators: true })
    .populate('assignees', 'name avatar')
    .populate('reporter', 'name avatar');
  if (!task) return res.status(404).json({ message: 'Tarefa não encontrada ou sem permissão' });

  req.app.get('io')?.to(`project:${task.project}`).emit('task:updated', task);
  res.json(task);
}));

// Mover tarefa entre colunas
router.patch('/:id/move', auth, asyncHandler(async (req, res) => {
  const { column, order } = req.body;
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant._id },
    { column, order, ...(column === 'done' ? { completedAt: new Date() } : { completedAt: null }) },
    { new: true }
  ).populate('assignees', 'name avatar');

  if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });

  req.app.get('io')?.to(`project:${task.project}`).emit('task:moved', { taskId: task._id, column, order });
  notifyTaskMoved(req.tenant._id, task, column).catch(() => {});
  res.json(task);
}));

// Adicionar comentário
router.post('/:id/comments', auth, schemas.addComment, validate, asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant._id },
    { $push: { comments: { user: req.user._id, text: req.body.text } } },
    { new: true }
  ).populate('comments.user', 'name avatar');
  if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });

  req.app.get('io')?.to(`project:${task.project}`).emit('task:commented', { taskId: task._id, comment: task.comments[task.comments.length - 1] });
  res.json(task.comments);
}));

// Iniciar time tracking
router.post('/:id/time/start', auth, asyncHandler(async (req, res) => {
  const entry = { user: req.user._id, startTime: new Date(), description: req.body.description || '' };
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant._id },
    { $push: { timeEntries: entry } },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });
  res.json(task.timeEntries[task.timeEntries.length - 1]);
}));

// Parar time tracking
router.patch('/:id/time/:entryId/stop', auth, asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, tenant: req.tenant._id });
  if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });

  const entry = task.timeEntries.id(req.params.entryId);
  if (!entry) return res.status(404).json({ message: 'Entrada não encontrada' });
  if (entry.endTime) return res.status(400).json({ message: 'Timer já foi parado' });

  entry.endTime = new Date();
  entry.duration = Math.round((entry.endTime - entry.startTime) / 60000);
  await task.save();
  res.json(entry);
}));

// Deletar tarefa
router.delete('/:id', auth, requireRole('admin', 'owner'), auditLog, asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, tenant: req.tenant._id });
  if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });

  req.app.get('io')?.to(`project:${task.project}`).emit('task:deleted', { taskId: task._id });
  res.json({ message: 'Tarefa deletada' });
}));

module.exports = router;
