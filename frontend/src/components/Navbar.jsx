import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, unreadCount, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const isSetupPage = location.pathname === '/profile-setup';

  return (
    <nav className="navbar">
      <div className="nav-left" onClick={() => navigate('/')}>
        <span className="logo-code">Code</span>
        <span className="logo-connect">Connect</span>
      </div>

      {!isAuthPage && !isSetupPage && (
        <div className="nav-center">
          <NavLink to="/discover" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Discover</NavLink>
          <NavLink to="/friends" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Friends</NavLink>
          <NavLink to="/team-dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>My Team</NavLink>
          <NavLink to="/idea-board" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Projects</NavLink>
          <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Messages</NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Profile</NavLink>
        </div>
      )}

      <div className="nav-right">
        {(!user || isAuthPage) ? (
          <>
            <button className="btn btn-ghost hide-mobile" onClick={() => navigate('/login')}>Log In</button>
            <button className="btn btn-primary nav-btn" onClick={() => navigate('/signup')}>Sign Up &rarr;</button>
          </>
        ) : (
          <>
            <div className="nav-bell" onClick={() => navigate('/notifications')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="bell-icon">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && <span className="bell-badge"></span>}
            </div>
            <div className="nav-avatar" onClick={() => navigate('/profile')} title="Go to Profile">
              {user.initials || user.name.charAt(0)}
            </div>
            <button className="btn btn-ghost nav-btn hide-mobile" onClick={() => { logout(); navigate('/'); }} style={{ border: 'none', color: 'var(--danger)' }}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
