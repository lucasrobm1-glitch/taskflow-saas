const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null }, // null = chat geral do tenant
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

messageSchema.index({ tenant: 1, project: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
