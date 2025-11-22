const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);