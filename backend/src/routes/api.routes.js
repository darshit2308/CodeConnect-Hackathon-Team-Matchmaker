const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller');
const auth = require('../middleware/auth');

// AUTH ROUTES (PUBLIC)
router.post('/auth/login', apiController.login);
router.post('/auth/send-otp', apiController.sendOtp);
router.post('/auth/verify-otp', apiController.verifyOtp);
router.post('/auth/google', apiController.googleAuth);

// ALL ROUTES BELOW REQUIRE AUTHENTICATION
router.use(auth);

router.post('/auth/profile-setup', apiController.profileSetup);
router.get('/profile/me', apiController.getMyProfile);
router.get('/profiles/search', apiController.searchProfiles);

// LIKES (must come before /profiles/:id)
router.post('/profiles/like', apiController.likeProfile);
router.post('/profiles/unlike', apiController.unlikeProfile);
router.get('/profiles/liked', apiController.getLikedProfiles);

// PROFILES & MATCHING (parameterized route must come after specific routes)
router.get('/profiles', apiController.getProfiles);
router.get('/profiles/:id', apiController.getProfileById);
router.post('/swipe/right', apiController.swipeRight);
router.post('/swipe/left', apiController.swipeLeft);

// MUTUAL MATCHES (FRIENDS)
router.get('/matches/mutual', apiController.getMutualMatches);

// TEAMS
router.get('/team', apiController.getTeam);
router.post('/team/invite', apiController.inviteTeamMember);

// IDEAS (specific routes before parameterized)
router.get('/ideas/my-projects', apiController.getMyProjects);
router.get('/ideas/pending-requests', apiController.getPendingJoinRequests);
router.get('/ideas/:ideaId/join-requests', apiController.getProjectJoinRequests);
router.get('/ideas', apiController.getIdeas);
router.post('/ideas', apiController.postIdea);
router.post('/ideas/join', apiController.joinIdea);
router.post('/ideas/join/revoke', apiController.revokeJoinRequest);

// CHAT
router.get('/chat/conversations', apiController.getConversations);
router.post('/chat/start', apiController.startConversation);
router.get('/chat/:userId', apiController.getChatHistory);
router.post('/chat/:userId', apiController.sendMessage);

// NOTIFICATIONS
router.get('/notifications', apiController.getNotifications);
router.post('/notifications/:id/action', apiController.notificationAction);
router.post('/notifications/read-all', apiController.markRead);
router.post('/notifications/mark-read', apiController.markRead);

// ADMIN
router.get('/admin/stats', apiController.getAdminStats);
router.get('/admin/users', apiController.getAdminUsers);

module.exports = router;
