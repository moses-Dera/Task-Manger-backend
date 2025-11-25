const mongoose = require('mongoose');

const taskTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    estimated_hours: { type: Number },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

// Add indexes
taskTemplateSchema.index({ company: 1, is_active: 1 });
taskTemplateSchema.index({ created_by: 1 });

module.exports = mongoose.model('TaskTemplate', taskTemplateSchema);
