const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // minutos
  description: { type: String, default: '', maxlength: 500 }
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 5000 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', index: true },
  column: { type: String, required: true, default: 'todo' },
  order: { type: Number, default: 0 },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  type: { type: String, enum: ['task', 'bug', 'feature', 'improvement'], default: 'task' },
  tags: [{ type: String, maxlength: 50 }],
  dueDate: { type: Date },
  estimatedHours: { type: Number, default: 0, min: 0, max: 9999 },
  timeEntries: [timeEntrySchema],
  attachments: [{ name: String, url: String, size: Number }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now }
  }],
  githubPR: { url: String, number: Number, status: String },
  completedAt: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });

// Índices para queries frequentes
taskSchema.index({ project: 1, column: 1, order: 1 });
taskSchema.index({ tenant: 1, sprint: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ title: 'text', description: 'text' }); // full-text search

taskSchema.virtual('totalTime').get(function () {
  return this.timeEntries.reduce((acc, e) => acc + (e.duration || 0), 0);
});

module.exports = mongoose.model('Task', taskSchema);
