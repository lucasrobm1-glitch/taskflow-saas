const axios = require('axios');
const Tenant = require('../models/Tenant');

const COLUMN_LABELS = {
  todo: 'A Fazer', in_progress: 'Em Progresso', review: 'Em Revisão', done: 'Concluído'
}

const PRIORITY_EMOJI = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' }

async function notifySlack(tenantId, message) {
  try {
    const tenant = await Tenant.findById(tenantId)
    if (!tenant?.integrations?.slack?.enabled) return
    const { webhookUrl } = tenant.integrations.slack
    if (!webhookUrl) return
    await axios.post(webhookUrl, message)
  } catch (err) {
    // Silencioso — não quebra o fluxo principal
  }
}

async function notifyTaskCreated(tenantId, task, reporter) {
  await notifySlack(tenantId, {
    text: `${PRIORITY_EMOJI[task.priority] || '📋'} *Nova tarefa criada*`,
    attachments: [{
      color: '#6366f1',
      fields: [
        { title: 'Tarefa', value: task.title, short: false },
        { title: 'Prioridade', value: task.priority, short: true },
        { title: 'Criado por', value: reporter || 'Sistema', short: true }
      ]
    }]
  })
}

async function notifyTaskMoved(tenantId, task, newColumn) {
  if (newColumn === 'done') {
    await notifySlack(tenantId, {
      text: `✅ *Tarefa concluída!*`,
      attachments: [{
        color: '#10b981',
        fields: [{ title: 'Tarefa', value: task.title, short: false }]
      }]
    })
  } else {
    await notifySlack(tenantId, {
      text: `🔄 *Tarefa movida para ${COLUMN_LABELS[newColumn] || newColumn}*`,
      attachments: [{
        color: '#f59e0b',
        fields: [{ title: 'Tarefa', value: task.title, short: false }]
      }]
    })
  }
}

module.exports = { notifyTaskCreated, notifyTaskMoved }
