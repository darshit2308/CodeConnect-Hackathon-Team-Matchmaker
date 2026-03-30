const db = require('../models/mockData');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const otpStorage = {};

const generateToken = (id) => {
  return jwt.sign({ id }, 'supersecretkey', { expiresIn: '30d' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        token: generateToken(user._id),
        user: { name: `${user.firstName} ${user.lastName}`, email: user.email }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login err:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    // Check if we have credentials set up, if not, print to console and send success
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = otp;

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
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('OTP err:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { firstName, lastName, email, password, otp } = req.body;
  if (!otpStorage[email] || otpStorage[email] !== otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  try {
    const user = await User.create({ firstName, lastName, email, password });
    delete otpStorage[email];

    res.status(201).json({
      token: generateToken(user._id),
      user: { name: `${user.firstName} ${user.lastName}`, email: user.email }
    });
  } catch (err) {
    console.error('Verify OTP err:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.googleAuth = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstName: given_name,
        lastName: family_name || 'Hacker',
        email,
        password: Math.random().toString(36).slice(-10) + 'X1!', // Generate random securely strong password
      });
    }

    res.json({
      token: generateToken(user._id),
      user: { name: `${user.firstName} ${user.lastName}`, email: user.email, picture }
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};

exports.profileSetup = (req, res) => {
  res.json({ success: true, message: 'Profile completed' });
};

exports.getProfiles = (req, res) => {
  res.json(db.profiles);
};

exports.swipeRight = (req, res) => {
  const isMatch = Math.random() > 0.7; // 30% chance match
  res.json({ success: true, match: isMatch });
};

exports.swipeLeft = (req, res) => {
  res.json({ success: true });
};

exports.getTeam = (req, res) => {
  res.json(db.team);
};

exports.inviteTeamMember = (req, res) => {
  res.json({ success: true, message: 'Invite sent' });
};

exports.getIdeas = (req, res) => {
  res.json(db.ideas);
};

exports.postIdea = (req, res) => {
  const newIdea = { ...req.body, id: Date.now(), poster: { name: 'Anika Kapoor', avatar: 'AK', daysAgo: 0 }, closesIn: 14, likes: 0 };
  db.ideas.unshift(newIdea);
  res.json({ success: true, idea: newIdea });
};

exports.getConversations = (req, res) => {
  res.json(db.conversations);
};

exports.getChatHistory = (req, res) => {
  const chatId = req.params.userId;
  res.json(db.messages[chatId] || []);
};

exports.sendMessage = async (req, res) => {
  const chatId = req.params.userId;
  const { text } = req.body;
  if (!db.messages[chatId]) db.messages[chatId] = [];
  const newMsg = { id: Date.now(), sender: 'me', text, timestamp: 'Just now' };
  db.messages[chatId].push(newMsg);

  // Send the user's message immediately
  res.json({ success: true, message: newMsg });

  // Fake auto reply via Gemini AI in the background
  try {
    const prompt = `You are chatting with a potential hackathon teammate. Reply naturally, casually, and concisely in 1-2 sentences to this message: "${text}"`;
    const result = await model.generateContent(prompt);
    let replyText = result.response.text().trim();
    // Simulate typing delay
    setTimeout(() => {
      db.messages[chatId].push({ id: Date.now() + 1, sender: 'them', text: replyText, timestamp: 'Just now' });
    }, 1500);
  } catch (err) {
    console.error('Gemini error:', err);
    setTimeout(() => {
      db.messages[chatId].push({ id: Date.now() + 1, sender: 'them', text: 'Sounds great! 😊', timestamp: 'Just now' });
    }, 1500);
  }
};

exports.getNotifications = (req, res) => {
  res.json(db.notifications);
};

exports.markRead = (req, res) => {
  db.notifications.forEach(n => n.read = true);
  res.json({ success: true });
};

exports.getAdminStats = (req, res) => {
  res.json(db.adminStats);
};

exports.getAdminUsers = (req, res) => {
  res.json(db.adminUsers);
};
