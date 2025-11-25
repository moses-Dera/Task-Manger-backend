const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true }
}, { _id: false });

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = group message
  message: { type: String, required: true },
  company: { type: String, required: true },

  // Read status tracking
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],

  // File attachments
  attachments: [attachmentSchema],

  // Emoji reactions
  reactions: [reactionSchema],

  // Edit tracking
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  originalMessage: { type: String }, // Store original for edit history

  // Reply/threading
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },

  // Pinned messages
  isPinned: { type: Boolean, default: false },
  pinnedAt: { type: Date },
  pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Add indexes for frequently queried fields
messageSchema.index({ company: 1 });
messageSchema.index({ sender_id: 1 });
messageSchema.index({ recipient_id: 1 });
messageSchema.index({ createdAt: -1 }); // For sorting by timestamp
messageSchema.index({ company: 1, createdAt: -1 }); // Compound index for pagination
messageSchema.index({ sender_id: 1, recipient_id: 1 }); // For direct message queries
messageSchema.index({ recipient_id: 1, sender_id: 1 }); // For reverse direct message queries
messageSchema.index({ isPinned: 1, company: 1 }); // For pinned messages
messageSchema.index({ isDeleted: 1 }); // For filtering deleted messages
messageSchema.index({ 'readBy.user': 1 }); // For read status queries
messageSchema.index({ message: 'text' }); // Text index for search

// Virtual for unread status
messageSchema.virtual('isUnread').get(function () {
  return this.readBy.length === 0;
});

// Method to check if user has read the message
messageSchema.methods.isReadBy = function (userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Method to mark as read by user
messageSchema.methods.markAsReadBy = async function (userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({ user: userId, readAt: new Date() });
    await this.save();
  }
  return this;
};

// Method to add reaction
messageSchema.methods.addReaction = async function (emoji, userId) {
  const existingReaction = this.reactions.find(r => r.emoji === emoji);

  if (existingReaction) {
    if (!existingReaction.users.includes(userId)) {
      existingReaction.users.push(userId);
    }
  } else {
    this.reactions.push({ emoji, users: [userId] });
  }

  await this.save();
  return this;
};

// Method to remove reaction
messageSchema.methods.removeReaction = async function (emoji, userId) {
  const reactionIndex = this.reactions.findIndex(r => r.emoji === emoji);

  if (reactionIndex !== -1) {
    const reaction = this.reactions[reactionIndex];
    reaction.users = reaction.users.filter(id => id.toString() !== userId.toString());

    if (reaction.users.length === 0) {
      this.reactions.splice(reactionIndex, 1);
    }
  }

  await this.save();
  return this;
};

module.exports = mongoose.model('Message', messageSchema);