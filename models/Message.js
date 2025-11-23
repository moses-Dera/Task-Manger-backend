const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  company: { type: String, required: true }
}, { timestamps: true });

// Add indexes for frequently queried fields
messageSchema.index({ company: 1 });
messageSchema.index({ sender_id: 1 });
messageSchema.index({ createdAt: -1 }); // For sorting by timestamp
messageSchema.index({ company: 1, createdAt: -1 }); // Compound index for pagination

module.exports = mongoose.model('Message', messageSchema);