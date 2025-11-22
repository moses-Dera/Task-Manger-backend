const mongoose = require('mongoose');

const taskFileSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  filename: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('TaskFile', taskFileSchema);