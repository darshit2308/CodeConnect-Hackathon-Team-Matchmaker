const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likedProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true }
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, likedProfile: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
