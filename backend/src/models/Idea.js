const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    domain: { type: String, default: 'Open Domain' },
    problem: { type: String, required: true },
    solution: { type: String, required: true },
    hackathon: { type: String, default: '' },
    skillsNeeded: { type: [String], default: [] },
    closesIn: { type: Number, default: 14 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    posterUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    posterName: { type: String, required: true },
    posterAvatar: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Idea', ideaSchema);
