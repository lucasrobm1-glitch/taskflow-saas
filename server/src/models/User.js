const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String },
  lastLogin: { type: Date },
  notifications: {
    email: { type: Boolean, default: true },
    slack: { type: Boolean, default: false }
  }
}, { timestamps: true });

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
  return obj;
};

module.exports = mongoose.model('User', userSchema);
