const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    initials: { type: String, required: true },
    college: { type: String, default: '' },
    year: { type: String, default: '' },
    role: { type: String, default: '' },
    idea: { type: String, default: '' },
    skills: { type: [String], default: [] },
    lookingFor: { type: [String], default: [] },
    teamSize: { type: String, default: '' },
    previousProjects: { type: [String], default: [] },
    hackathonsCount: { type: Number, default: 0 },
    matchPct: { type: Number, default: 75 },
    avatarBg: { type: String, default: '#EAE7FE' },
    avatarColor: { type: String, default: '#4F35F3' },
    isSeed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
