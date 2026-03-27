const router = require('express').Router();
const Project = require('../models/Project');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validate');
const { checkProjectLimit } = require('../middleware/planLimits');
const { auditLog } = require('../middleware/auditLog');

// Listar projetos do tenant
router.get('/', auth, asyncHandler(async (req, res) => {
  const projects = await Project.find({
    tenant: req.tenant._id,
    $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
  })
    .populate('owner', 'name avatar')
    .populate('members.user', 'name avatar')
    .sort({ createdAt: -1 });
  res.json(projects);
}));

// Criar projeto
router.post('/', auth, checkProjectLimit, schemas.createProject, validate, asyncHandler(async (req, res) => {
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
}));

// Buscar projeto por ID
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, tenant: req.tenant._id })
    .populate('owner', 'name avatar email')
    .populate('members.user', 'name avatar email');
  if (!project) return res.status(404).json({ message: 'Projeto não encontrado' });
  res.json(project);
}));

// Atualizar projeto
router.put('/:id', auth, schemas.createProject, validate, asyncHandler(async (req, res) => {
  const allowed = ['name', 'description', 'color', 'icon', 'status', 'columns'];
  const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant._id },
    update,
    { new: true, runValidators: true }
  ).populate('owner', 'name avatar').populate('members.user', 'name avatar');
  if (!project) return res.status(404).json({ message: 'Projeto não encontrado' });
  res.json(project);
}));

// Adicionar membro ao projeto
router.post('/:id/members', auth, asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant._id },
    { $addToSet: { members: { user: userId, role: role || 'member' } } },
    { new: true }
  ).populate('members.user', 'name avatar email');
  if (!project) return res.status(404).json({ message: 'Projeto não encontrado' });
  res.json(project);
}));

// Remover membro do projeto
router.delete('/:id/members/:userId', auth, asyncHandler(async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenant._id },
    { $pull: { members: { user: req.params.userId } } },
    { new: true }
  ).populate('members.user', 'name avatar email');
  if (!project) return res.status(404).json({ message: 'Projeto não encontrado' });
  res.json(project);
}));

// Deletar projeto
router.delete('/:id', auth, requireRole('owner', 'admin'), auditLog, asyncHandler(async (req, res) => {
  const Task = require('../models/Task');
  const Sprint = require('../models/Sprint');

  const project = await Project.findOne({ _id: req.params.id, tenant: req.tenant._id, owner: req.user._id });
  if (!project) return res.status(404).json({ message: 'Projeto não encontrado ou sem permissão' });

  await Promise.all([
    Task.deleteMany({ project: req.params.id, tenant: req.tenant._id }),
    Sprint.deleteMany({ project: req.params.id, tenant: req.tenant._id }),
    project.deleteOne()
  ]);

  res.json({ message: 'Projeto deletado' });
}));

module.exports = router;
