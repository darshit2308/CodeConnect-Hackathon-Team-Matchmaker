import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from './ToastContext';

import { useNavigate } from 'react-router-dom';

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
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [globalMatch, setGlobalMatch] = useState(null);
  const showToast = useToast();

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const [res, chatRes] = await Promise.all([
        API.get('/notifications'),
        API.get('/chat/conversations')
      ]);
      const newNotifs = res.data;
      
      setNotifications(prev => {
        // Find if there are new unread match notifications
        // that weren't in the previous state.
        if (prev.length > 0) {
          const prevIds = new Set(prev.map(n => n.id));
          const freshlyAdded = newNotifs.filter(n => !prevIds.has(n.id) && !n.read && n.type === 'match');
          
          if (freshlyAdded.length > 0) {
            // Show toast for all, but trigger popup for first
            freshlyAdded.forEach(n => {
              showToast(`🎉 ${n.message}`, 'success');
            });
            // Show popup matching UI
            const nameMatch = freshlyAdded[0].message.replace(' matched with you.', '');
            setGlobalMatch(nameMatch !== freshlyAdded[0].message ? nameMatch : freshlyAdded[0].message);
          }
        }
        return newNotifs;
      });
      
      setUnreadCount(newNotifs.filter((n) => !n.read).length);

      // Sum unread messages from all conversations
      const totalUnreadMsgs = chatRes.data.reduce((acc, conv) => acc + (conv.unread || 0), 0);
      setUnreadMessages(totalUnreadMsgs);
      
    } catch (err) {
      console.error('Error refreshing notifications/chat:', err);
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
    let intervalId;
    if (user) {
      refreshNotifications();
      intervalId = setInterval(refreshNotifications, 10000); // Check every 10s for new matches
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
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
    setUnreadMessages(0);
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    localStorage.removeItem('cc_liked');
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, login, sendOtp, verifyOtpAndSignup, googleLogin, logout,
      notifications, unreadCount, setUnreadCount, 
      unreadMessages, setUnreadMessages,
      refreshNotifications,
      likedProfiles, addLikedProfile
    }}>
      {children}
      
      {globalMatch && (
        <div className="match-overlay" onClick={(event) => { if (event.target === event.currentTarget) setGlobalMatch(null); }}>
          <div className="match-card">
            <div className="match-avatars">
              <div className="m-av my-av" style={{ background: 'var(--primary)', color: 'white' }}>YOU</div>
              <div className="m-sparkle">+</div>
              <div className="m-av their-av" style={{ background: 'var(--accent)', color: 'white' }}>{globalMatch.substring(0, 2).toUpperCase()}</div>
            </div>
            <h2 className="match-h2">It's a Match!</h2>
            <p className="match-sub">{globalMatch} matched with you. Check your messages to say hello!</p>
            <button className="btn btn-primary w-100 mb-2" onClick={() => {
              setGlobalMatch(null);
            }}>Awesome!</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
