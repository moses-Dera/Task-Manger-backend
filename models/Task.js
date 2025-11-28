const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'overdue'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  due_date: { type: Date },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  submission_url: { type: String },
  submission_date: { type: Date }
}, { timestamps: true });

// Add indexes for frequently queried fields
taskSchema.index({ assigned_to: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ due_date: 1 });
taskSchema.index({ company: 1 });
taskSchema.index({ assigned_to: 1, status: 1 }); // Compound index for common queries
taskSchema.index({ createdAt: -1 }); // For sorting by creation date

module.exports = mongoose.model('Task', taskSchema);