const router = require('express').Router();
const Task = require('../models/Task');
const Sprint = require('../models/Sprint');
const { auth, requirePlan } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkReportsAccess } = require('../middleware/planLimits');

// Relatório geral do projeto
router.get('/project/:projectId', auth, checkReportsAccess, asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { from, to } = req.query;
  const filter = { project: projectId, tenant: req.tenant._id };

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const tasks = await Task.find(filter).populate('assignees', 'name');

  const byStatus = tasks.reduce((acc, t) => { acc[t.column] = (acc[t.column] || 0) + 1; return acc; }, {});
  const byPriority = tasks.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {});
  const byType = tasks.reduce((acc, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc; }, {});

  const byAssignee = {};
  tasks.forEach(t => {
    t.assignees.forEach(a => {
      if (!byAssignee[a.name]) byAssignee[a.name] = { total: 0, done: 0 };
      byAssignee[a.name].total++;
      if (t.column === 'done') byAssignee[a.name].done++;
    });
  });

  const totalTime = tasks.reduce((acc, t) =>
    acc + t.timeEntries.reduce((a, e) => a + (e.duration || 0), 0), 0);

  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.column !== 'done').length;

  res.json({ total: tasks.length, byStatus, byPriority, byType, byAssignee, totalTime, overdue });
}));

// Burndown chart do sprint
router.get('/sprint/:sprintId/burndown', auth, requirePlan('basic', 'pro', 'enterprise'), asyncHandler(async (req, res) => {
  const sprint = await Sprint.findOne({ _id: req.params.sprintId, tenant: req.tenant._id });
  if (!sprint) return res.status(404).json({ message: 'Sprint não encontrado' });

  const tasks = await Task.find({ sprint: sprint._id });
  const totalTasks = tasks.length;

  const days = [];
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  let current = new Date(start);

  while (current <= end) {
    const completedByDay = tasks.filter(t => t.completedAt && new Date(t.completedAt) <= current).length;
    const elapsed = current - start;
    const total = end - start;
    days.push({
      date: current.toISOString().split('T')[0],
      remaining: totalTasks - completedByDay,
      ideal: total > 0 ? Math.round(totalTasks * (1 - elapsed / total)) : 0
    });
    current.setDate(current.getDate() + 1);
  }

  res.json({ sprint, totalTasks, burndown: days });
}));

// Relatório de time tracking
router.get('/time', auth, requirePlan('pro', 'enterprise'), asyncHandler(async (req, res) => {
  const { from, to, userId, projectId } = req.query;
  const filter = { tenant: req.tenant._id };
  if (projectId) filter.project = projectId;

  const tasks = await Task.find(filter)
    .populate('assignees', 'name')
    .populate('timeEntries.user', 'name');

  const report = [];
  tasks.forEach(task => {
    task.timeEntries.forEach(entry => {
      if (userId && entry.user?._id?.toString() !== userId) return;
      if (from && new Date(entry.startTime) < new Date(from)) return;
      if (to && new Date(entry.startTime) > new Date(to)) return;
      report.push({
        task: task.title,
        taskId: task._id,
        user: entry.user?.name,
        duration: entry.duration,
        date: entry.startTime,
        description: entry.description
      });
    });
  });

  const totalMinutes = report.reduce((acc, r) => acc + (r.duration || 0), 0);
  res.json({ entries: report, totalMinutes });
}));

module.exports = router;
