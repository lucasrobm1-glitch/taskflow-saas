const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  isActive: { type: Boolean, default: true, index: true },
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String },
  // Password reset
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  lastLogin: { type: Date },
  notifications: {
    email: { type: Boolean, default: true },
    slack: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Índices compostos para queries frequentes
userSchema.index({ tenant: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerifyToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
