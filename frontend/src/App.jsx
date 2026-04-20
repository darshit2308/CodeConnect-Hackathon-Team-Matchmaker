import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ProfileSetup from './pages/Wizard/ProfileSetup';
import Discover from './pages/Discover/Discover';
import TeamDashboard from './pages/Dashboard/TeamDashboard';
import Chat from './pages/Chat/Chat';
import IdeaBoard from './pages/IdeaBoard/IdeaBoard';
import Notifications from './pages/Notifications/Notifications';
import Admin from './pages/Admin/Admin';
import Profile from './pages/Profile/Profile';
import Friends from './pages/Friends/Friends';
import WhoLikedMe from './pages/Discover/WhoLikedMe';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="app-layout">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
              <Route path="/team-dashboard" element={<ProtectedRoute><TeamDashboard /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/idea-board" element={<ProtectedRoute><IdeaBoard /></ProtectedRoute>} />
              <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
              <Route path="/who-liked-me" element={<ProtectedRoute><WhoLikedMe /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
