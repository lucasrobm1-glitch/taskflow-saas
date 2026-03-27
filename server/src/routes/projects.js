const router = require('express').Router();
const Project = require('../models/Project');
const { auth, requireRole } = require('../middleware/auth');
const { checkProjectLimit } = require('../middleware/planLimits');

// Listar projetos do tenant
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      tenant: req.tenant._id,
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).populate('owner', 'name avatar').populate('members.user', 'name avatar');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Criar projeto
router.post('/', auth, checkProjectLimit, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const project = new Project({
      name, description, color, icon,
      tenant: req.tenant._id,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await project.save();
    await project.populate('owner', 'name avatar');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Buscar projeto por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, tenant: req.tenant._id })
      .populate('owner', 'name avatar email')
      .populate('members.user', 'name avatar email');
    if (!project) return res.status(404).json({ message: 'Projeto não encontrado' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Atualizar projeto
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      req.body,
      { new: true }
    ).populate('owner', 'name avatar').populate('members.user', 'name avatar');
    if (!project) return res.status(404).json({ message: 'Projeto não encontrado' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Adicionar membro
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      { $addToSet: { members: { user: userId, role: role || 'member' } } },
      { new: true }
    ).populate('members.user', 'name avatar email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Deletar projeto
router.delete('/:id', auth, async (req, res) => {
  try {
    const Task = require('../models/Task');
    await Task.deleteMany({ project: req.params.id, tenant: req.tenant._id });
    await Project.findOneAndDelete({ _id: req.params.id, tenant: req.tenant._id, owner: req.user._id });
    res.json({ message: 'Projeto deletado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
