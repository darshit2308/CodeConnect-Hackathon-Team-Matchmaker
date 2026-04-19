const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema(
  {
    idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'invited'], default: 'pending' }
  },
  { timestamps: true }
);

joinRequestSchema.index({ idea: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model('JoinRequest', joinRequestSchema);
