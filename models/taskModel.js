const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorType: { type: String, enum: ['admin', 'sales'], required: true },
}, { timestamps: true });

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedBy: { type: String, required: true },
  assignedTo: { type: String, required: true },
  assignedDate: { type: Date, default: Date.now, required: true },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['completed', 'in-progress', 'pending'], default: 'pending' },
  attachments: [attachmentSchema],
  comments: [commentSchema],
  schoolId: { type: String },
  schoolName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);