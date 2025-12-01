const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['task', 'message', 'reminder', 'system'], required: true },
  related_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'onModel' },
  onModel: { type: String, enum: ['Task', 'Message'] },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// Add indexes for frequently queried fields
notificationSchema.index({ user_id: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ user_id: 1, read: 1 }); // Compound index for unread notifications
notificationSchema.index({ createdAt: -1 }); // For sorting by creation date

module.exports = mongoose.model('Notification', notificationSchema);