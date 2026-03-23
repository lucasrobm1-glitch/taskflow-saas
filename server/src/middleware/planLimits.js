const PLAN_LIMITS = {
  free:       { projects: 3,         members: 5,   sprints: false, reports: false, integrations: false },
  basic:      { projects: 10,        members: 10,  sprints: true,  reports: true,  integrations: false },
  pro:        { projects: 50,        members: 50,  sprints: true,  reports: true,  integrations: true  },
  enterprise: { projects: Infinity,  members: Infinity, sprints: true, reports: true, integrations: true }
}

// Atualiza os limites do tenant conforme o plano
const syncTenantLimits = async (tenant) => {
  const limits = PLAN_LIMITS[tenant.plan] || PLAN_LIMITS.free
  tenant.limits.projects = limits.projects === Infinity ? 999999 : limits.projects
  tenant.limits.members  = limits.members  === Infinity ? 999999 : limits.members
  await tenant.save()
}

// Verifica limite de projetos
const checkProjectLimit = async (req, res, next) => {
  try {
    const Project = require('../models/Project')
    const limits = PLAN_LIMITS[req.tenant.plan] || PLAN_LIMITS.free
    const count = await Project.countDocuments({ tenant: req.tenant._id })
    if (count >= limits.projects) {
      return res.status(403).json({
        message: `Limite de projetos atingido para o plano ${req.tenant.plan}. Faça upgrade para criar mais projetos.`,
        limit: limits.projects,
        current: count
      })
    }
    next()
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Verifica limite de membros
const checkMemberLimit = async (req, res, next) => {
  try {
    const User = require('../models/User')
    const limits = PLAN_LIMITS[req.tenant.plan] || PLAN_LIMITS.free
    const count = await User.countDocuments({ tenant: req.tenant._id, isActive: true })
    if (count >= limits.members) {
      return res.status(403).json({
        message: `Limite de membros atingido para o plano ${req.tenant.plan}. Faça upgrade para convidar mais membros.`,
        limit: limits.members,
        current: count
      })
    }
    next()
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Verifica se o plano tem acesso a sprints
const checkSprintAccess = (req, res, next) => {
  const limits = PLAN_LIMITS[req.tenant.plan] || PLAN_LIMITS.free
  if (!limits.sprints) {
    return res.status(403).json({ message: 'Sprints disponíveis a partir do plano Basic. Faça upgrade.' })
  }
  next()
}

// Verifica se o plano tem acesso a relatórios
const checkReportsAccess = (req, res, next) => {
  const limits = PLAN_LIMITS[req.tenant.plan] || PLAN_LIMITS.free
  if (!limits.reports) {
    return res.status(403).json({ message: 'Relatórios disponíveis a partir do plano Basic. Faça upgrade.' })
  }
  next()
}

// Verifica se o plano tem acesso a integrações
const checkIntegrationsAccess = (req, res, next) => {
  const limits = PLAN_LIMITS[req.tenant.plan] || PLAN_LIMITS.free
  if (!limits.integrations) {
    return res.status(403).json({ message: 'Integrações disponíveis a partir do plano Pro. Faça upgrade.' })
  }
  next()
}

module.exports = { PLAN_LIMITS, syncTenantLimits, checkProjectLimit, checkMemberLimit, checkSprintAccess, checkReportsAccess, checkIntegrationsAccess }
