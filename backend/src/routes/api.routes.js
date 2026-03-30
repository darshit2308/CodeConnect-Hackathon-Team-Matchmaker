const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller');

// MOCK API ROUTES
router.post('/auth/login', apiController.login);
router.post('/auth/send-otp', apiController.sendOtp);
router.post('/auth/verify-otp', apiController.verifyOtp);
router.post('/auth/google', apiController.googleAuth);
router.post('/auth/profile-setup', apiController.profileSetup);

// PROFILES & MATCHING
router.get('/profiles', apiController.getProfiles);
router.post('/swipe/right', apiController.swipeRight);
router.post('/swipe/left', apiController.swipeLeft);

// TEAMS
router.get('/team', apiController.getTeam);
router.post('/team/invite', apiController.inviteTeamMember);

// IDEAS
router.get('/ideas', apiController.getIdeas);
router.post('/ideas', apiController.postIdea);

// CHAT
router.get('/chat/conversations', apiController.getConversations);
router.get('/chat/:userId', apiController.getChatHistory);
router.post('/chat/:userId', apiController.sendMessage);

// NOTIFICATIONS
router.get('/notifications', apiController.getNotifications);
router.post('/notifications/mark-read', apiController.markRead);

// ADMIN
router.get('/admin/stats', apiController.getAdminStats);
router.get('/admin/users', apiController.getAdminUsers);

module.exports = router;
