const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = group message
  message: { type: String, required: true },
  company: { type: String, required: true }
}, { timestamps: true });

// Add indexes for frequently queried fields
messageSchema.index({ company: 1 });
messageSchema.index({ sender_id: 1 });
messageSchema.index({ recipient_id: 1 });
messageSchema.index({ createdAt: -1 }); // For sorting by timestamp
messageSchema.index({ company: 1, createdAt: -1 }); // Compound index for pagination
messageSchema.index({ sender_id: 1, recipient_id: 1 }); // For direct message queries
messageSchema.index({ recipient_id: 1, sender_id: 1 }); // For reverse direct message queries

module.exports = mongoose.model('Message', messageSchema);