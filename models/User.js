const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String },
  area: { type: String },
  role: { type: String, enum: ['citizen', 'monitor'], default: 'citizen' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
