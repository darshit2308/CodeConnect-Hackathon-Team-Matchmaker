const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema(
  {
    swiper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true },
    direction: { type: String, enum: ['left', 'right'], required: true },
    context: { type: String, default: 'general' }
  },
  { timestamps: true }
);

swipeSchema.index({ swiper: 1, targetProfile: 1, context: 1 }, { unique: true });

module.exports = mongoose.model('Swipe', swipeSchema);
