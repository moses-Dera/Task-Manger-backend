const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g., 'login', 'task_created', 'user_invited'
    details: { type: String }, // Additional context
    ip_address: { type: String },
    user_agent: { type: String },
    company: { type: String, required: true }
}, { timestamps: true });

// Add indexes for efficient querying
activityLogSchema.index({ company: 1, createdAt: -1 });
activityLogSchema.index({ user_id: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 }); // For sorting by date

module.exports = mongoose.model('ActivityLog', activityLogSchema);
