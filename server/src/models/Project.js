const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' }
  }],
  columns: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, default: '#6366f1' },
    order: { type: Number, default: 0 }
  }],
  color: { type: String, default: '#6366f1' },
  icon: { type: String, default: '📋' },
  status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
  githubRepo: { type: String, default: '' },
  slackChannel: { type: String, default: '' }
}, { timestamps: true });

// Colunas padrão ao criar projeto
projectSchema.pre('save', function (next) {
  if (this.isNew && this.columns.length === 0) {
    this.columns = [
      { id: 'todo', name: 'A Fazer', color: '#6366f1', order: 0 },
      { id: 'in_progress', name: 'Em Progresso', color: '#f59e0b', order: 1 },
      { id: 'in_review', name: 'Em Revisão', color: '#8b5cf6', order: 2 },
      { id: 'done', name: 'Concluído', color: '#10b981', order: 3 }
    ];
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
