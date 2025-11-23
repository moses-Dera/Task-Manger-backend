const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  company: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);