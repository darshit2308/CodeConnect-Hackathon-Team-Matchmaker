import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const shownMatchNames = useRef(new Set());
  const showToast = useToast();

  const triggerMatchPopup = (name) => {
    setGlobalMatch(name);
    showToast(`🎉 You matched with ${name}!`, 'success');
    shownMatchNames.current.add(name);
  };

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const [res, chatRes] = await Promise.all([
        API.get('/notifications'),
        API.get('/chat/conversations')
      ]);
      const newNotifs = res.data;
      
      setNotifications(prev => {
        // Compare with previous notifications to find new matches
        const prevIds = new Set(prev.map(n => n.id));
        const freshlyAdded = newNotifs.filter(n => !prevIds.has(n.id) && !n.read && n.type === 'match');
        
        if (freshlyAdded.length > 0) {
          freshlyAdded.forEach(n => {
            // Support both: "X matched with you." and "You matched with X."
            const nameMatch = n.message
              .replace(' matched with you.', '')
              .replace('You matched with ', '');
            
            if (!shownMatchNames.current.has(nameMatch)) {
              setGlobalMatch(nameMatch);
              showToast(`🎉 ${n.message}`, 'success');
              shownMatchNames.current.add(nameMatch);
            }
          });
        }
        return newNotifs;
      });
      
      setUnreadCount(newNotifs.filter((n) => !n.read).length);
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
      intervalId = setInterval(refreshNotifications, 5000); // Check every 5s for new matches
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
      likedProfiles, addLikedProfile,
      triggerMatchPopup
    }}>
      {children}
      
      {globalMatch && (
        <div className="match-overlay" onClick={(event) => { if (event.target === event.currentTarget) setGlobalMatch(null); }}>
          <div className="match-card">
            <div className="match-avatars">
              <div className="m-av my-av" style={{ background: user?.avatarBg || 'var(--primary-soft)', color: user?.avatarColor || 'var(--primary)' }}>{user?.initials || 'YOU'}</div>
              <div className="m-sparkle">✨</div>
              <div className="m-av their-av" style={{ background: 'var(--accent-soft, #e6fffb)', color: 'var(--accent)' }}>{globalMatch.substring(0, 2).toUpperCase()}</div>
            </div>
            <h2 className="match-h2">Heeyyy! Got matched!</h2>
            <p className="match-sub"><strong>{globalMatch}</strong> matched with you. Start a chat and build something amazing together!</p>
            <div className="match-actions">
              <button className="btn btn-primary w-100 mb-3" onClick={() => {
                setGlobalMatch(null);
                // Optionally navigate to chat
                window.location.href = '/chat';
              }}>Start Chat Now</button>
              <button className="btn btn-ghost w-100" onClick={() => setGlobalMatch(null)} style={{ border: 'none' }}>Awesome!</button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
