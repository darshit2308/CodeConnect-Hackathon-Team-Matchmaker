import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWhoLikedMe, swipeRight, swipeLeft } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './WhoLikedMe.css';

const WhoLikedMe = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWhoLikedMe();
  }, []);

  const fetchWhoLikedMe = async () => {
    try {
      const { data } = await getWhoLikedMe();
      setProfiles(data);
    } catch (err) {
      console.error('Error fetching who liked me:', err);
    } finally {
      setLoading(false);
    }
  };

  const { triggerMatchPopup } = useAuth();

  const handleSwipe = async (profileId, direction) => {
    try {
      if (direction === 'right') {
        const profile = profiles.find(p => p.id === profileId);
        const { data } = await swipeRight(profileId, 'general');
        if (data.match) {
          triggerMatchPopup(profile?.name || 'Someone');
        }
      } else {
        await swipeLeft(profileId, 'general');
      }
      // Remove from list
      setProfiles(profiles.filter(p => p.id !== profileId));
    } catch (err) {
      console.error('Error swiping:', err);
    }
  };

  if (loading) return <div className="who-liked-me-loading">Loading users who liked you...</div>;

  return (
    <div className="who-liked-me-container">
      <div className="who-liked-me-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-text">
          <h1>Who Right Swiped You</h1>
          <p>{profiles.length} people swiped right on you</p>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="no-likes-empty">
          <div className="empty-icon">✨</div>
          <h3>No right swipes yet</h3>
          <p>Keep swiping to get more eyes on your profile!</p>
          <button className="swipe-now-btn" onClick={() => navigate('/discover')}>
            Go to Discover
          </button>
        </div>
      ) : (
        <div className="likes-list">
          {profiles.map((profile) => (
            <div key={profile.id} className="like-card-horizontal">
              <div 
                className="like-avatar-circle"
                style={{ backgroundColor: profile.avatarBg, color: profile.avatarColor }}
              >
                {profile.initials}
              </div>
              
              <div className="like-content">
                <div className="like-info-top">
                  <h3>{profile.name}</h3>
                  <span className="like-match-badge">
                    <i className="fas fa-bolt"></i> {profile.matchPct}% Match
                  </span>
                </div>
                
                <p className="like-role">{profile.role}</p>
                
                <div className="like-meta-row">
                  <span><i className="fas fa-university"></i> {profile.college || 'College Enthusiast'}</span>
                  <button className="view-profile-btn-simple" onClick={() => navigate(`/profile/${profile.id}`)}>
                    View Profile
                  </button>
                </div>
              </div>

              <div className="like-actions-vertical">
                <button 
                  className="simple-action-btn accept" 
                  onClick={() => handleSwipe(profile.id, 'right')}
                  title="Accept Match"
                >
                  <i className="fas fa-check"></i>
                </button>
                <button 
                  className="simple-action-btn reject" 
                  onClick={() => handleSwipe(profile.id, 'left')}
                  title="Decline"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhoLikedMe;
