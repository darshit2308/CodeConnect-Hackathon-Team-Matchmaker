import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// PROFILES
export const getProfiles = (context) => API.get('/profiles', { params: { context } });
export const getProfile = (id) => API.get(`/profiles/${id}`);
export const getMyProfile = () => API.get('/profile/me');
export const searchProfiles = (q) => API.get('/profiles/search', { params: { q } });
export const setupProfile = (data) => API.post('/auth/profile-setup', data);

// LIKES
export const likeProfile = (profileId) => API.post('/profiles/like', { profileId });
export const unlikeProfile = (profileId) => API.post('/profiles/unlike', { profileId });
export const getLikedProfiles = () => API.get('/profiles/liked');

// MATCHING
export const getMutualMatches = () => API.get('/matches/mutual');
export const swipeRight = (profileId, context) => API.post('/swipe/right', { profileId, context });
export const swipeLeft = (profileId, context) => API.post('/swipe/left', { profileId, context });
export const inviteTeamMember = (profileId, projectId) => API.post('/team/invite', { profileId, projectId });

// IDEAS / PROJECTS
export const getIdeas = () => API.get('/ideas');
export const postIdea = (data) => API.post('/ideas', data);
export const getMyProjects = () => API.get('/ideas/my-projects');
export const joinIdea = (ideaId) => API.post('/ideas/join', { ideaId });
export const revokeJoinRequest = (ideaId) => API.post('/ideas/join/revoke', { ideaId });
export const getPendingJoinRequests = () => API.get('/ideas/pending-requests');
export const getProjectJoinRequests = (ideaId) => API.get(`/ideas/${ideaId}/join-requests`);
export const acceptJoinRequest = (requestId) => API.post(`/ideas/join/${requestId}/accept`);
export const rejectJoinRequest = (requestId) => API.post(`/ideas/join/${requestId}/reject`);

// CHAT
export const getConversations = () => API.get('/chat/conversations');
export const startConversation = (profileId) => API.post('/chat/start', { profileId });
export const getChatHistory = (userId) => API.get(`/chat/${userId}`);
export const sendMessage = (userId, text) => API.post(`/chat/${userId}`, { text });

// NOTIFICATIONS
export const getNotifications = () => API.get('/notifications');
export const markRead = () => API.post('/notifications/read-all');
export const notificationAction = (notificationId, action) =>
  API.post(`/notifications/${notificationId}/action`, { action });

// AUTH
export const login = (email, password) => API.post('/auth/login', { email, password });
export const sendOtp = (email) => API.post('/auth/send-otp', { email });
export const verifyOtp = (email, otp, firstName, lastName) =>
  API.post('/auth/verify-otp', { email, otp, firstName, lastName });
export const googleAuth = (token, firstName, lastName) =>
  API.post('/auth/google', { token, firstName, lastName });

export default API;
