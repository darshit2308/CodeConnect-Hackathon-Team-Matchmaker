const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, default: 'system' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    actionRequired: { type: Boolean, default: false },
    relatedId: { type: String } // To store conversationId or other IDs for grouping
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
