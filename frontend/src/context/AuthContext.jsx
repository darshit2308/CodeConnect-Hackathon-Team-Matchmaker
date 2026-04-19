import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('cc_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cc_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [likedProfiles, setLikedProfiles] = useState(() => {
    const stored = localStorage.getItem('cc_liked');
    return stored ? JSON.parse(stored) : [];
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (err) {
      console.error(err);
    }
  };

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('cc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cc_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('cc_token', token);
    } else {
      localStorage.removeItem('cc_token');
    }
  }, [token]);

  // Persist liked profiles
  useEffect(() => {
    localStorage.setItem('cc_liked', JSON.stringify(likedProfiles));
  }, [likedProfiles]);

  useEffect(() => {
    if (user) {
      refreshNotifications();
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const sendOtp = async (email) => {
    const res = await API.post('/auth/send-otp', { email });
    return res.data;
  };

  const verifyOtpAndSignup = async (firstName, lastName, email, password, otp) => {
    const res = await API.post('/auth/verify-otp', { firstName, lastName, email, password, otp });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const googleLogin = async (credential) => {
    const res = await API.post('/auth/google', { credential });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const addLikedProfile = (profile) => {
    setLikedProfiles(prev => {
      if (prev.find(p => p.id === profile.id)) return prev;
      return [...prev, profile];
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setLikedProfiles([]);
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    localStorage.removeItem('cc_liked');
  };

  return (
    <AuthContext.Provider value={{ 
      user, setUser, login, sendOtp, verifyOtpAndSignup, googleLogin, logout, 
      notifications, unreadCount, setUnreadCount, refreshNotifications,
      likedProfiles, addLikedProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
