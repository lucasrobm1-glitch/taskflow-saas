const router = require('express').Router();
const Task = require('../models/Task');
const { auth, requireRole } = require('../middleware/auth');
const { notifyTaskCreated, notifyTaskMoved } = require('../services/slack');

// Listar tarefas de um projeto
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, sprintId, column, assignee } = req.query;
    const filter = { tenant: req.tenant._id };
    if (projectId) filter.project = projectId;
    if (sprintId) filter.sprint = sprintId;
    if (column) filter.column = column;
    if (assignee) filter.assignees = assignee;

    const tasks = await Task.find(filter)
      .populate('assignees', 'name avatar')
      .populate('reporter', 'name avatar')
      .sort({ order: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Criar tarefa
router.post('/', auth, async (req, res) => {
  try {
    const task = new Task({ ...req.body, tenant: req.tenant._id, reporter: req.user._id });
    await task.save();
    await task.populate('assignees', 'name avatar');
    await task.populate('reporter', 'name avatar');

    // Emitir evento socket
    req.app.get('io')?.to(`project:${task.project}`).emit('task:created', task);
    notifyTaskCreated(req.tenant._id, task, req.user.name);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Buscar tarefa
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, tenant: req.tenant._id })
      .populate('assignees', 'name avatar email')
      .populate('reporter', 'name avatar')
      .populate('sprint', 'name')
      .populate('comments.user', 'name avatar');
    if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Atualizar tarefa (inclui mover coluna) - admin/owner podem editar qualquer tarefa
router.put('/:id', auth, async (req, res) => {
  const isAdminOrOwner = ['admin', 'owner'].includes(req.user.role);
  const filter = { _id: req.params.id, tenant: req.tenant._id };
  // membros só editam tarefas onde são reporter ou assignee
  if (!isAdminOrOwner) {
    filter.$or = [{ reporter: req.user._id }, { assignees: req.user._id }];
  }
  try {
    const task = await Task.findOneAndUpdate(
      filter,
      req.body,
      { new: true }
    ).populate('assignees', 'name avatar').populate('reporter', 'name avatar');
    if (!task) return res.status(404).json({ message: 'Tarefa não encontrada ou sem permissão' });

    req.app.get('io')?.to(`project:${task.project}`).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mover tarefa entre colunas (drag & drop)
router.patch('/:id/move', auth, async (req, res) => {
  try {
    const { column, order } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      { column, order, ...(column === 'done' ? { completedAt: new Date() } : { completedAt: null }) },
      { new: true }
    ).populate('assignees', 'name avatar');

    req.app.get('io')?.to(`project:${task.project}`).emit('task:moved', { taskId: task._id, column, order });
    notifyTaskMoved(req.tenant._id, task, column);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Adicionar comentário
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      { $push: { comments: { user: req.user._id, text: req.body.text } } },
      { new: true }
    ).populate('comments.user', 'name avatar');
    res.json(task.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Iniciar time tracking
router.post('/:id/time/start', auth, async (req, res) => {
  try {
    const entry = { user: req.user._id, startTime: new Date(), description: req.body.description || '' };
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      { $push: { timeEntries: entry } },
      { new: true }
    );
    res.json(task.timeEntries[task.timeEntries.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Parar time tracking
router.patch('/:id/time/:entryId/stop', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, tenant: req.tenant._id });
    const entry = task.timeEntries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ message: 'Entrada não encontrada' });

    entry.endTime = new Date();
    entry.duration = Math.round((entry.endTime - entry.startTime) / 60000);
    await task.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Deletar tarefa - somente admin ou owner
router.delete('/:id', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, tenant: req.tenant._id });
    res.json({ message: 'Tarefa deletada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
