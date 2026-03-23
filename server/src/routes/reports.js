const router = require('express').Router();
const Task = require('../models/Task');
const Sprint = require('../models/Sprint');
const User = require('../models/User');
const { auth, requirePlan } = require('../middleware/auth');
const { checkReportsAccess } = require('../middleware/planLimits');

// Relatório geral do projeto
router.get('/project/:projectId', auth, checkReportsAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const filter = { project: projectId, tenant: req.tenant._id };
    if (from || to) filter.createdAt = dateFilter;

    const tasks = await Task.find(filter).populate('assignees', 'name');

    const byStatus = tasks.reduce((acc, t) => {
      acc[t.column] = (acc[t.column] || 0) + 1;
      return acc;
    }, {});

    const byPriority = tasks.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});

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

    res.json({ total: tasks.length, byStatus, byPriority, byAssignee, totalTime });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Burndown chart do sprint
router.get('/sprint/:sprintId/burndown', auth, requirePlan('basic', 'pro', 'enterprise'), async (req, res) => {
  try {
    const sprint = await Sprint.findOne({ _id: req.params.sprintId, tenant: req.tenant._id });
    if (!sprint) return res.status(404).json({ message: 'Sprint não encontrado' });

    const tasks = await Task.find({ sprint: sprint._id });
    const totalTasks = tasks.length;

    // Gerar dados de burndown por dia
    const days = [];
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    let current = new Date(start);

    while (current <= end) {
      const completedByDay = tasks.filter(t =>
        t.completedAt && new Date(t.completedAt) <= current
      ).length;
      days.push({
        date: current.toISOString().split('T')[0],
        remaining: totalTasks - completedByDay,
        ideal: Math.round(totalTasks * (1 - (current - start) / (end - start)))
      });
      current.setDate(current.getDate() + 1);
    }

    res.json({ sprint, totalTasks, burndown: days });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Relatório de time tracking
router.get('/time', auth, requirePlan('pro', 'enterprise'), async (req, res) => {
  try {
    const { from, to, userId } = req.query;
    const tasks = await Task.find({ tenant: req.tenant._id })
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
          user: entry.user?.name,
          duration: entry.duration,
          date: entry.startTime,
          description: entry.description
        });
      });
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
