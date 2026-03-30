import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // If we have a stored user token (mocked), fetch their contextual data
    if (user) {
      API.get('/notifications').then(res => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.read).length);
      }).catch(err => console.error(err));
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    setUser(res.data.user);
    return res.data;
  };

  const sendOtp = async (email) => {
    const res = await API.post('/auth/send-otp', { email });
    return res.data;
  };

  const verifyOtpAndSignup = async (firstName, lastName, email, password, otp) => {
    const res = await API.post('/auth/verify-otp', { firstName, lastName, email, password, otp });
    setUser(res.data.user);
    return res.data;
  };

  const googleLogin = async (credential) => {
    const res = await API.post('/auth/google', { credential });
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, sendOtp, verifyOtpAndSignup, googleLogin, logout, notifications, unreadCount, setUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
};
