import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const showToast = useToast();

  useEffect(() => {
    if (!user) {
      showToast('Please sign up or log in to access this page.', 'error');
    }
  }, [user, showToast]);

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  return children;
}
