const db = require('../models/mockData');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Swipe = require('../models/Swipe');
const Idea = require('../models/Idea');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Like = require('../models/Like');
const JoinRequest = require('../models/JoinRequest');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL/TLS
  auth: { 
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  }
});

// Verify environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('❌ CRITICAL: EMAIL_USER or EMAIL_PASS is missing from environment variables!');
}

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Nodemailer verification failed:', error.message);
  } else {
    console.log('✅ Mail server is ready to send OTPs');
  }
});

const otpStorage = {};
const palette = [
  { avatarBg: '#EAE7FE', avatarColor: '#4F35F3' },
  { avatarBg: 'rgba(0,212,168,0.12)', avatarColor: '#00D4A8' },
  { avatarBg: 'rgba(255,179,71,0.12)', avatarColor: '#FFB347' },
  { avatarBg: 'rgba(255,107,107,0.10)', avatarColor: '#FF6B6B' }
];

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

const initialsFromName = (name = 'User') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

const formatRelativeTime = (dateLike) => {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const calculateMatchPct = (myProfile, profile) => {
  // If viewing own profile, return a "Profile Strength" score instead of a match percentage
  if (myProfile && profile && (myProfile._id.toString() === (profile.user || profile._id).toString())) {
    let strength = 20; // Base score for having an account
    if (profile.name) strength += 10;
    if (profile.role && profile.role !== 'Hackathon Enthusiast') strength += 15;
    if (profile.college) strength += 10;
    if (profile.skills?.length > 0) strength += Math.min(25, profile.skills.length * 5);
    if (profile.idea && profile.idea.length > 20) strength += 20;
    return Math.min(100, strength);
  }

  // Use a deterministic variety factor based on the profile ID
  const variety = (parseInt(profile._id.toString().slice(-4), 16) % 15);
  
  if (!myProfile) return 70 + (variety % 10);
  
  let score = 65; // Slightly higher baseline

  const mySkills = (myProfile.skills || []).map(s => s.toLowerCase());
  const theirSkills = (profile.skills || []).map(s => s.toLowerCase());
  const myLookingFor = (myProfile.lookingFor || []).map(s => s.toLowerCase());
  
  // 1. Skill Alignment
  if (mySkills.length > 0 && theirSkills.length > 0) {
    const mySkillsSet = new Set(mySkills);
    const overlap = theirSkills.filter(s => mySkillsSet.has(s)).length;
    if (overlap > 0) {
      score += (overlap / Math.max(mySkills.length, 1)) * 20;
    }
  }

  // 2. Requirement Alignment
  if (myLookingFor.length > 0 && theirSkills.length > 0) {
    const theirSkillsSet = new Set(theirSkills);
    const requirementMatches = myLookingFor.filter(s => theirSkillsSet.has(s)).length;
    score += (requirementMatches / myLookingFor.length) * 20;
  }

  // 3. Role Complementarity
  const myRole = (myProfile.role || '').toLowerCase();
  const theirRole = (profile.role || '').toLowerCase();
  if (myRole && theirRole) {
    if (myRole !== theirRole) {
      score += 8; 
    } else {
      score -= 5; // Slight penalty for redundant roles to encourage diversity
    }
    
    if (myLookingFor.includes(theirRole)) {
      score += 12;
    }
  }

  // 4. Common Background
  if (myProfile.college && profile.college && myProfile.college === profile.college) {
    score += 4;
  }

  // 5. Add deterministic variety so it doesn't look static
  score += (variety / 2);

  return Math.max(58, Math.min(99, Math.round(score)));
};

const toProfileCard = (profile, myProfile) => ({
  id: profile._id.toString(),
  initials: profile.initials,
  name: profile.name,
  role: profile.role || 'Hackathon Enthusiast',
  college: profile.college || 'Unknown College',
  year: profile.year || '',
  idea: profile.idea || '',
  skills: profile.skills || [],
  lookingFor: profile.lookingFor || [],
  matchPct: calculateMatchPct(myProfile, profile),
  hackathonsCount: profile.hackathonsCount || 0,
  daysAgo: Math.max(0, Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (24 * 60 * 60 * 1000))),
  avatarBg: profile.avatarBg,
  avatarColor: profile.avatarColor
});

const createDefaultProfileForUser = async (user, patch = {}) => {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const colors = palette[Math.floor(Math.random() * palette.length)];
  const payload = {
    user: user._id,
    name: fullName,
    initials: initialsFromName(fullName),
    role: 'Hackathon Enthusiast',
    ...colors,
    ...patch
  };

  return UserProfile.findOneAndUpdate({ user: user._id }, payload, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });
};

const findOrCreateConversation = async (userA, userB) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [userA, userB] },
    $expr: { $eq: [{ $size: '$participants' }, 2] }
  });
  if (!conversation) {
    conversation = await Conversation.create({ participants: [userA, userB], type: 'match' });
  }
  return conversation;
};

const serializeUser = (user, extra = {}) => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return {
    id: user._id.toString(),
    name,
    email: user.email,
    initials: initialsFromName(name),
    ...extra
  };
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await createDefaultProfileForUser(user);
    return res.json({ token: generateToken(user._id), user: serializeUser(user) });
  } catch (err) {
    console.error('Login err:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Rate limiting: Prevent sending multiple OTPs in short succession
    const lastSent = otpStorage[`lastSent_${email}`];
    if (lastSent && Date.now() - lastSent < 60000) {
      return res.status(429).json({ error: 'Please wait 60 seconds before requesting another OTP.' });
    }

    otpStorage[email] = otp;
    otpStorage[`lastSent_${email}`] = Date.now();

    if (process.env.EMAIL_USER === 'REPLACE_WITH_YOUR_GMAIL@gmail.com') {
      console.log(`[TEST MODE] OTP for ${email} is ${otp}`);
      return res.json({ success: true, message: 'OTP logged to console', testOtp: otp });
    }

    await transporter.sendMail({
      from: `"CodeConnect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'CodeConnect Verification Code',
      text: `Your OTP is: ${otp}`
    });
    return res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('❌ OTP Send Error:', err);
    return res.status(500).json({ 
      error: 'Failed to send OTP', 
      details: err.message,
      code: err.code // Helps identify if it's an auth error or network error
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const { firstName, lastName, email, password, otp } = req.body;
  if (!otpStorage[email] || otpStorage[email] !== otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  try {
    const user = await User.create({ firstName, lastName, email, password });
    await createDefaultProfileForUser(user);
    delete otpStorage[email];

    return res.status(201).json({ token: generateToken(user._id), user: serializeUser(user) });
  } catch (err) {
    console.error('Verify OTP err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.googleAuth = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    let user = await User.findOne({ email });
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await User.create({
        firstName: given_name,
        lastName: family_name || 'Hacker',
        email,
        password: Math.random().toString(36).slice(-10) + 'X1!'
      });
    }

    await createDefaultProfileForUser(user);

    return res.json({
      token: generateToken(user._id),
      user: serializeUser(user, { picture }),
      isNewUser
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(401).json({ error: 'Invalid Google token' });
  }
};

exports.profileSetup = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const {
      name,
      college,
      primaryRole,
      selectedSkills,
      ideaTitle,
      ideaProblem,
      lookingFor,
      teamSize,
      previousProjects
    } = req.body;

    const fullName = (name || `${user.firstName} ${user.lastName}`).trim();
    const ideaCombined = [ideaTitle, ideaProblem].filter(Boolean).join(' - ');

    const profile = await createDefaultProfileForUser(user, {
      name: fullName,
      initials: initialsFromName(fullName),
      college: college || '',
      role: primaryRole || 'Hackathon Enthusiast',
      skills: Array.isArray(selectedSkills) ? selectedSkills : [],
      idea: ideaCombined,
      lookingFor: Array.isArray(lookingFor) ? lookingFor : [],
      teamSize: teamSize || '',
      previousProjects: Array.isArray(previousProjects)
        ? previousProjects.filter(Boolean)
        : typeof previousProjects === 'string' && previousProjects.trim()
          ? previousProjects
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : []
    });

    return res.json({ success: true, message: 'Profile completed', profile: toProfileCard(profile, profile) });
  } catch (err) {
    console.error('Profile setup err:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const profile = await createDefaultProfileForUser(user);
    return res.json({
      ...toProfileCard(profile, profile),
      email: user.email,
      previousProjects: profile.previousProjects || [],
      teamSize: profile.teamSize || ''
    });
  } catch (err) {
    console.error('Get my profile err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.searchProfiles = async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    const myProfile = await UserProfile.findOne({ user: req.userId });
    const excludedIds = [];
    if (myProfile) excludedIds.push(myProfile._id);

    const match = {
      _id: { $nin: excludedIds }
    };

    if (query) {
      match.$or = [
        { name: { $regex: query, $options: 'i' } },
        { skills: { $regex: query, $options: 'i' } },
        { role: { $regex: query, $options: 'i' } }
      ];
    }

    const profiles = await UserProfile.find(match).sort({ createdAt: -1 }).limit(30);
    return res.json(profiles.map((profile) => toProfileCard(profile, myProfile)));
  } catch (err) {
    console.error('Search profiles err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const linkedUser = profile.user ? await User.findById(profile.user) : null;
    return res.json({
      ...toProfileCard(profile),
      previousProjects: profile.previousProjects || [],
      teamSize: profile.teamSize || '',
      email: linkedUser?.email || ''
    });
  } catch (err) {
    console.error('Get profile by id err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getProfiles = async (req, res) => {
  try {
    const context = req.query.context || 'general';
    const myProfile = await UserProfile.findOne({ user: req.userId });
    const swiped = await Swipe.find({ swiper: req.userId, context }).select('targetProfile');
    const excludedIds = swiped.map((entry) => entry.targetProfile);

    const query = { _id: { $nin: excludedIds } };
    if (myProfile) query._id.$nin.push(myProfile._id);

    const profiles = await UserProfile.find(query).sort({ createdAt: -1 });
    return res.json(profiles.map((profile) => toProfileCard(profile, myProfile)));
  } catch (err) {
    console.error('Get profiles err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.swipeRight = async (req, res) => {
  try {
    const targetId = req.body.targetId || req.body.profileId;
    const context = req.body.context || 'general';
    if (!targetId) return res.status(400).json({ error: 'targetId or profileId is required' });

    const targetProfile = await UserProfile.findById(targetId);
    if (!targetProfile) return res.status(404).json({ error: 'Target profile not found' });

    await Swipe.findOneAndUpdate(
      { swiper: req.userId, targetProfile: targetProfile._id, context },
      { direction: 'right' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const myProfile = await UserProfile.findOne({ user: req.userId });
    let match = false;
    let conversationId = null;

    if (targetProfile.user && myProfile) {
      const reciprocalRight = await Swipe.findOne({
        swiper: targetProfile.user,
        targetProfile: myProfile._id,
        direction: 'right'
      });
      
      if (reciprocalRight) {
        match = true;
        // Check if conversation already exists to prevent duplicate notifications/logic
        const existingConv = await Conversation.findOne({
          participants: { $all: [req.userId, targetProfile.user] },
          type: 'match'
        });

        const conversation = await findOrCreateConversation(req.userId, targetProfile.user);
        conversationId = conversation._id.toString();

        if (!existingConv) {
          // Only notify if this is the FIRST time the match is established
          await Notification.create({
            user: req.userId,
            type: 'match',
            title: 'It is a match!',
            message: `You matched with ${targetProfile.name}.`,
            read: false
          });
          await Notification.create({
            user: targetProfile.user,
            type: 'match',
            title: 'It is a match!',
            message: `${myProfile.name} matched with you.`,
            read: false
          });
        }
      }
    } else {
      // Mock matching for cases where target isn't a real user or as fallback
      match = Math.random() > 0.7;
    }

    return res.json({ success: true, match, conversationId });
  } catch (err) {
    console.error('Swipe right err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.swipeLeft = async (req, res) => {
  try {
    const targetId = req.body.targetId || req.body.profileId;
    const context = req.body.context || 'general';
    if (!targetId) return res.status(400).json({ error: 'targetId or profileId is required' });

    const targetProfile = await UserProfile.findById(targetId);
    if (!targetProfile) return res.status(404).json({ error: 'Target profile not found' });

    await Swipe.findOneAndUpdate(
      { swiper: req.userId, targetProfile: targetProfile._id, context },
      { direction: 'left' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Swipe left err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getTeam = (req, res) => {
  res.json(db.team);
};

exports.inviteTeamMember = async (req, res) => {
  try {
    const { profileId, projectId } = req.body;
    if (!profileId || !projectId) return res.status(400).json({ error: 'profileId and projectId required' });

    const targetProfile = await UserProfile.findById(profileId);
    if (!targetProfile || !targetProfile.user) return res.status(404).json({ error: 'Target user not found' });

    const idea = await Idea.findById(projectId);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    if (idea.posterUser.toString() !== req.userId) return res.status(403).json({ error: 'Not your project' });

    await JoinRequest.findOneAndUpdate(
      { idea: projectId, requester: targetProfile.user },
      { status: 'invited' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, message: 'Invite sent' });
  } catch (err) {
    console.error('Invite team member err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getIdeas = async (req, res) => {
  try {
    const myProfile = await UserProfile.findOne({ user: req.userId });
    const mySkills = new Set((myProfile?.skills || []).map(s => s.toLowerCase()));

    const ideas = await Idea.find().sort({ createdAt: -1 });
    return res.json(
      ideas.map((idea) => {
        const skillsNeeded = Array.isArray(idea.skillsNeeded) ? idea.skillsNeeded : [];
        let matchPct = 70; // Default

        if (mySkills.size > 0 && skillsNeeded.length > 0) {
          const matches = skillsNeeded.filter(s => mySkills.has(s.toLowerCase())).length;
          const ratio = matches / skillsNeeded.length;
          matchPct = Math.round(65 + (ratio * 34)); // Scales 65% to 99%
        } else if (mySkills.size > 0) {
          matchPct = 75; // Some skills but project has no specific requirements
        }

        return {
          id: idea._id.toString(),
          title: idea.title,
          domain: idea.domain,
          problem: idea.problem,
          problemStatement: idea.problem,
          solution: idea.solution,
          solutionDescription: idea.solution,
          hackathon: idea.hackathon,
          skillsNeeded,
          matchPct,
          closesIn: idea.closesIn,
          likes: idea.likes,
          liked: idea.likedBy?.some((id) => id.toString() === req.userId) || false,
          posterUser: {
            id: idea.posterUser?.toString() || null,
            name: idea.posterName,
            avatar: idea.posterAvatar
          },
          poster: {
            name: idea.posterName,
            avatar: idea.posterAvatar,
            daysAgo: Math.max(0, Math.floor((Date.now() - new Date(idea.createdAt).getTime()) / (24 * 60 * 60 * 1000)))
          }
        };
      })
    );
  } catch (err) {
    console.error('Get ideas err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.postIdea = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const profile = await UserProfile.findOne({ user: req.userId });
    const posterName = profile?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous';
    const posterAvatar = profile?.initials || initialsFromName(posterName);

    // Map frontend field names to model field names
    const ideaData = {
      title: req.body.title,
      domain: req.body.domain,
      problem: req.body.problemStatement || req.body.problem || '',
      solution: req.body.solutionDescription || req.body.solution || '',
      hackathon: req.body.hackathon || '',
      skillsNeeded: req.body.skillsNeeded || [],
      posterUser: req.userId,
      posterName,
      posterAvatar,
      closesIn: 14,
      likes: 0
    };

    const newIdea = await Idea.create(ideaData);

    return res.json({
      success: true,
      idea: {
        id: newIdea._id.toString(),
        title: newIdea.title,
        domain: newIdea.domain,
        problemStatement: newIdea.problem,
        solutionDescription: newIdea.solution,
        hackathon: newIdea.hackathon,
        skillsNeeded: newIdea.skillsNeeded,
        closesIn: newIdea.closesIn,
        likes: newIdea.likes,
        posterUser: { id: req.userId, name: posterName, avatar: posterAvatar },
        poster: { name: posterName, avatar: posterAvatar, daysAgo: 0 }
      }
    });
  } catch (err) {
    console.error('Post idea err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.userId }).sort({ lastMessageAt: -1, updatedAt: -1 });
    const result = [];

    for (const conversation of conversations) {
      const partnerId = conversation.participants.find((id) => id.toString() !== req.userId);
      if (!partnerId) continue;

      const partnerUser = await User.findById(partnerId);
      const partnerProfile = await UserProfile.findOne({ user: partnerId });
      if (!partnerUser) continue;

      const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        sender: partnerId,
        read: false
      });

      result.push({
        id: conversation._id.toString(),
        partner: {
          id: partnerProfile?._id?.toString() || partnerUser._id.toString(),
          name: partnerProfile?.name || `${partnerUser.firstName} ${partnerUser.lastName}`.trim(),
          initials: partnerProfile?.initials || initialsFromName(`${partnerUser.firstName} ${partnerUser.lastName}`),
          status: '● Online'
        },
        lastMessage: conversation.lastMessage || '',
        timestamp: formatRelativeTime(conversation.lastMessageAt),
        unread: unreadCount,
        type: conversation.type
      });
    }

    return res.json(result);
  } catch (err) {
    console.error('Get conversations err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.startConversation = async (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: 'profileId is required' });

    const profile = await UserProfile.findById(profileId);
    if (!profile || !profile.user) {
      return res.status(400).json({ error: 'This profile cannot be messaged yet' });
    }
    if (profile.user.toString() === req.userId) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself' });
    }

    const conversation = await findOrCreateConversation(req.userId, profile.user);
    return res.json({ success: true, conversationId: conversation._id.toString() });
  } catch (err) {
    console.error('Start conversation err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const conversationId = req.params.userId; // NOTE: parameter is actually conversationId based on logic below
    const conversation = await Conversation.findOne({ _id: conversationId, participants: req.userId });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Mark partner's unread messages as read
    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: req.userId }, read: false },
      { $set: { read: true } }
    );

    // Also mark related notifications as read
    await Notification.updateMany(
      { user: req.userId, type: 'message', relatedId: conversation._id.toString(), read: false },
      { $set: { read: true } }
    );

    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });
    return res.json(
      messages.map((msg) => ({
        id: msg._id.toString(),
        sender: msg.sender.toString() === req.userId ? 'me' : 'them',
        text: msg.text,
        timestamp: formatRelativeTime(msg.createdAt)
      }))
    );
  } catch (err) {
    console.error('Get chat history err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const conversationId = req.params.userId;
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Message text is required' });

    const conversation = await Conversation.findOne({ _id: conversationId, participants: req.userId });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const newMsg = await Message.create({ conversation: conversation._id, sender: req.userId, text });
    conversation.lastMessage = text;
    conversation.lastMessageAt = newMsg.createdAt;
    await conversation.save();

    const partnerId = conversation.participants.find((id) => id.toString() !== req.userId);
    if (partnerId) {
      const myProfile = await UserProfile.findOne({ user: req.userId });
      const senderName = myProfile?.name || 'Someone';

      // Check for an existing unread notification for this conversation
      const existingNotif = await Notification.findOne({
        user: partnerId,
        type: 'message',
        relatedId: conversation._id.toString(),
        read: false
      });

      if (existingNotif) {
        // Update existing notification and bump timestamp
        existingNotif.message = `New message from ${senderName}`;
        existingNotif.title = `New messages from ${senderName}`;
        existingNotif.updatedAt = new Date();
        await existingNotif.save();
      } else {
        // Create new notification
        await Notification.create({
          user: partnerId,
          type: 'message',
          title: `New message from ${senderName}`,
          message: `New message from ${senderName}`,
          read: false,
          relatedId: conversation._id.toString()
        });
      }
    }

    return res.json({
      success: true,
      message: {
        id: newMsg._id.toString(),
        sender: 'me',
        text: newMsg.text,
        timestamp: formatRelativeTime(newMsg.createdAt)
      }
    });
  } catch (err) {
    console.error('Send message err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId }).sort({ createdAt: -1 });
    
    // Group message notifications by conversation (relatedId)
    const grouped = [];
    const seenConversations = new Set();

    for (const item of notifications) {
      if (item.type === 'message' && item.relatedId) {
        if (seenConversations.has(item.relatedId)) {
          continue; // Skip older notifications for the same conversation
        }
        seenConversations.add(item.relatedId);
      }
      
      grouped.push({
        id: item._id.toString(),
        type: item.type,
        title: item.title,
        message: item.message,
        time: formatRelativeTime(item.createdAt),
        read: item.read,
        actionRequired: item.actionRequired
      });
    }

    return res.json(grouped);
  } catch (err) {
    console.error('Get notifications err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.notificationAction = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate({ _id: id, user: req.userId }, { read: true });
    return res.json({ success: true });
  } catch (err) {
    console.error('Notification action err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.userId, read: false }, { read: true });
    return res.json({ success: true });
  } catch (err) {
    console.error('Mark notifications read err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getAdminStats = (req, res) => {
  res.json(db.adminStats);
};

exports.getAdminUsers = (req, res) => {
  res.json(db.adminUsers);
};

exports.likeProfile = async (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: 'profileId is required' });

    const profile = await UserProfile.findById(profileId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await Like.findOneAndUpdate(
      { user: req.userId, likedProfile: profileId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Like profile err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.unlikeProfile = async (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: 'profileId is required' });

    await Like.findOneAndDelete({ user: req.userId, likedProfile: profileId });
    return res.json({ success: true });
  } catch (err) {
    console.error('Unlike profile err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getLikedProfiles = async (req, res) => {
  try {
    const myProfile = await UserProfile.findOne({ user: req.userId });
    if (!myProfile) return res.json([]);

    // Find all right swipes by me
    const myRightSwipes = await Swipe.find({ swiper: req.userId, direction: 'right' }).populate('targetProfile');
    
    // For each, check the other user's swipe
    const statuses = await Promise.all(myRightSwipes.map(async (swipe) => {
      const tp = swipe.targetProfile;
      if (!tp) return null;

      let status = 'Pending';
      if (tp.user) {
        const theirSwipe = await Swipe.findOne({ swiper: tp.user, targetProfile: myProfile._id });
        if (theirSwipe) {
          if (theirSwipe.direction === 'right') status = 'Accepted';
          else if (theirSwipe.direction === 'left') status = 'Rejected';
        }
      }

      return {
        ...toProfileCard(tp, myProfile),
        swipeStatus: status,
        swipeContext: swipe.context
      };
    }));

    return res.json(statuses.filter(Boolean));
  } catch (err) {
    console.error('Get liked profiles err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.joinIdea = async (req, res) => {
  try {
    const { ideaId } = req.body;
    if (!ideaId) return res.status(400).json({ error: 'ideaId is required' });

    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    if (idea.posterUser && idea.posterUser.toString() === req.userId) {
      return res.status(400).json({ error: 'You cannot join your own project' });
    }

    await JoinRequest.findOneAndUpdate(
      { idea: ideaId, requester: req.userId },
      { status: 'pending' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Join idea err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.revokeJoinRequest = async (req, res) => {
  try {
    const { ideaId } = req.body;
    if (!ideaId) return res.status(400).json({ error: 'ideaId is required' });

    await JoinRequest.findOneAndDelete({ idea: ideaId, requester: req.userId });
    return res.json({ success: true });
  } catch (err) {
    console.error('Revoke join request err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.acceptJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await JoinRequest.findById(id).populate('idea');
    if (!request) return res.status(404).json({ error: 'Join request not found' });
    const isOwner = request.idea && request.idea.posterUser && request.idea.posterUser.toString() === req.userId;
    const isInvitedUser = request.requester && request.requester.toString() === req.userId && request.status === 'invited';

    if (!isOwner && !isInvitedUser) {
      return res.status(403).json({ error: 'Unauthorized to modify this request' });
    }
    
    request.status = 'accepted';
    await request.save();
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Accept join request err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.rejectJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await JoinRequest.findById(id).populate('idea');
    if (!request) return res.status(404).json({ error: 'Join request not found' });
    const isOwner = request.idea && request.idea.posterUser && request.idea.posterUser.toString() === req.userId;
    const isInvitedUser = request.requester && request.requester.toString() === req.userId && request.status === 'invited';

    if (!isOwner && !isInvitedUser) {
      return res.status(403).json({ error: 'Unauthorized to modify this request' });
    }
    
    request.status = 'rejected';
    await request.save();
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Reject join request err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getPendingJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ requester: req.userId, status: { $in: ['pending', 'invited'] } }).populate('idea');
    return res.json(
      requests.map((req) => ({
        id: req._id.toString(),
        ideaId: req.idea._id.toString(),
        ideaTitle: req.idea.title,
        posterName: req.idea.posterName,
        status: req.status
      }))
    );
  } catch (err) {
    console.error('Get pending requests err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const ideas = await Idea.find({ posterUser: req.userId }).sort({ createdAt: -1 });
    return res.json(
      ideas.map((idea) => ({
        id: idea._id.toString(),
        title: idea.title,
        domain: idea.domain,
        problem: idea.problem,
        problemStatement: idea.problem,
        solution: idea.solution,
        solutionDescription: idea.solution,
        hackathon: idea.hackathon,
        skillsNeeded: idea.skillsNeeded,
        closesIn: idea.closesIn,
        likes: idea.likes,
        posterUser: {
          id: idea.posterUser?.toString() || null,
          name: idea.posterName,
          avatar: idea.posterAvatar
        },
        poster: {
          name: idea.posterName,
          avatar: idea.posterAvatar,
          daysAgo: Math.max(0, Math.floor((Date.now() - new Date(idea.createdAt).getTime()) / (24 * 60 * 60 * 1000)))
        }
      }))
    );
  } catch (err) {
    console.error('Get my projects err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getParticipatedProjects = async (req, res) => {
  try {
    const requests = await JoinRequest.find({
      requester: req.userId,
      status: { $in: ['accepted'] }
    }).populate('idea');

    const participatedIdeas = requests
      .filter(req => req.idea) // ensure idea exists
      .map(req => {
        const idea = req.idea;
        return {
          id: idea._id.toString(),
          title: idea.title,
          domain: idea.domain,
          problem: idea.problem,
          problemStatement: idea.problem,
          solution: idea.solution,
          solutionDescription: idea.solution,
          hackathon: idea.hackathon,
          skillsNeeded: idea.skillsNeeded,
          closesIn: idea.closesIn,
          likes: idea.likes,
          posterUser: {
            id: idea.posterUser?.toString() || null,
            name: idea.posterName,
            avatar: idea.posterAvatar
          },
          poster: {
            name: idea.posterName,
            avatar: idea.posterAvatar,
            daysAgo: Math.max(0, Math.floor((Date.now() - new Date(idea.createdAt).getTime()) / (24 * 60 * 60 * 1000)))
          }
        };
      });

    return res.json(participatedIdeas);
  } catch (err) {
    console.error('Get participated projects err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getProjectJoinRequests = async (req, res) => {
  try {
    const { ideaId } = req.params;
    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    if (idea.posterUser.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not your project' });
    }

    const requests = await JoinRequest.find({ idea: ideaId, status: { $in: ['pending', 'accepted'] } })
      .populate('requester');

    const result = [];
    for (const reqObj of requests) {
      if (!reqObj.requester) continue;
      
      const profile = await UserProfile.findOne({ user: reqObj.requester._id });
      
      result.push({
        id: reqObj._id.toString(),
        requesterId: reqObj.requester._id.toString(),
        requesterProfileId: profile ? profile._id.toString() : null,
        requesterName: `${reqObj.requester.firstName} ${reqObj.requester.lastName}`,
        requesterEmail: reqObj.requester.email,
        status: reqObj.status
      });
    }

    return res.json(result);
  } catch (err) {
    console.error('Get project join requests err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};



exports.getMutualMatches = async (req, res) => {
  try {
    const myProfile = await UserProfile.findOne({ user: req.userId });
    if (!myProfile) return res.status(404).json({ error: 'Profile not found' });

    // 1. Find Friends (Mutual Right Swipes)
    const myRights = await Swipe.find({ swiper: req.userId, direction: 'right' }).select('targetProfile');
    const friendIds = [];
    for (const swap of myRights) {
      const targetProf = await UserProfile.findById(swap.targetProfile);
      if (targetProf && targetProf.user) {
        const reciprocal = await Swipe.findOne({
          swiper: targetProf.user,
          targetProfile: myProfile._id,
          direction: 'right'
        });
        if (reciprocal) friendIds.push(swap.targetProfile.toString());
      }
    }

    // 2. Find Teammates (Accepted Join Requests)
    const teammateIds = [];
    // As requester
    const acceptedRequestsAsRequester = await JoinRequest.find({ requester: req.userId, status: 'accepted' }).populate('idea');
    for (const request of acceptedRequestsAsRequester) {
      if (request.idea && request.idea.posterUser) {
        const posterProf = await UserProfile.findOne({ user: request.idea.posterUser });
        if (posterProf) teammateIds.push(posterProf._id.toString());
      }
    }
    // As project owner
    const myIdeas = await Idea.find({ posterUser: req.userId });
    const myIdeaIds = myIdeas.map(i => i._id);
    const acceptedRequestsAsPoster = await JoinRequest.find({ idea: { $in: myIdeaIds }, status: 'accepted' });
    for (const request of acceptedRequestsAsPoster) {
      if (request.requester) {
        const requesterProf = await UserProfile.findOne({ user: request.requester });
        if (requesterProf) teammateIds.push(requesterProf._id.toString());
      }
    }

    // 3. Merge and Populate
    const friendSet = new Set(friendIds);
    const teammateSet = new Set(teammateIds);
    const allUniqueIds = Array.from(new Set([...friendIds, ...teammateIds]));
    
    const matchedProfiles = await UserProfile.find({ _id: { $in: allUniqueIds } });
    
    return res.json(matchedProfiles.map((prof) => {
      const card = toProfileCard(prof, myProfile);
      const pid = prof._id.toString();
      return {
        ...card,
        isFriend: friendSet.has(pid),
        isTeammate: teammateSet.has(pid)
      };
    }));
  } catch (err) {
    console.error('Get mutual matches err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
exports.getWhoLikedMe = async (req, res) => {
  try {
    const myProfile = await UserProfile.findOne({ user: req.userId });
    if (!myProfile) return res.status(404).json({ error: 'Profile not found' });

    // Find all right swipes where I am the target
    const likesMeSwipes = await Swipe.find({ targetProfile: myProfile._id, direction: 'right' }).populate('swiper');

    // Find all my swipes (left or right) to filter out people I've already interacted with
    const mySwipes = await Swipe.find({ swiper: req.userId }).select('targetProfile');
    const mySwipedProfileIds = new Set(mySwipes.map((s) => s.targetProfile.toString()));

    const resultProfiles = [];
    for (const swipe of likesMeSwipes) {
      if (!swipe.swiper) continue;
      
      const swiperProfile = await UserProfile.findOne({ user: swipe.swiper._id });
      if (!swiperProfile) continue;

      // 1. Only show if I haven't swiped on them yet (right or left)
      // 2. This naturally excludes people who are already matches
      if (!mySwipedProfileIds.has(swiperProfile._id.toString())) {
        resultProfiles.push(toProfileCard(swiperProfile, myProfile));
      }
    }

    return res.json(resultProfiles);
  } catch (err) {
    console.error('Get who liked me err:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
