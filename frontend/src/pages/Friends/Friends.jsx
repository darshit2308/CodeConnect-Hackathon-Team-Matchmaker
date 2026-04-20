import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SkillChip from '../../components/SkillChip';
import './Friends.css';

export default function Friends() {
  const [mutualMatches, setMutualMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMutualMatches();
  }, []);

  const fetchMutualMatches = async () => {
    try {
      setLoading(true);
      const res = await API.getMutualMatches();
      setMutualMatches(res.data);
    } catch (err) {
      console.error('Error fetching mutual matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (profileId) => {
    navigate(`/chat?user=${profileId}`);
  };

  const handleViewProfile = (profileId) => {
    navigate(`/profile/${profileId}`);
  };

  return (
    <div className="friends-page hide-scrollbars">
      <div className="friends-container">
        <div className="friends-header">
          <div>
            <h2>My Friends <span className="friend-count-badge">{mutualMatches.length}</span></h2>
            <p className="friends-sub">People you've matched with. Both of you swiped right.</p>
          </div>
          <div className="friends-search-container">
            <input
              type="text"
              className="friends-search-bar"
              placeholder="Search friends by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink3)' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>...</div>
            <p>Loading your matches...</p>
          </div>
        ) : mutualMatches.length === 0 ? (
          <div className="empty-state-friends">
            <div style={{ fontSize: '64px' }}>0</div>
            <h3>No matches yet</h3>
            <p>Keep swiping in Discover to find teammates who also like you!</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/discover')}
              style={{ marginTop: '16px' }}
            >
              Go to Discover
            </button>
          </div>
        ) : (
          <div className="friends-grid">
            {mutualMatches
              .filter(profile => (profile.name + profile.role).toLowerCase().includes(searchQuery.toLowerCase()))
              .map(profile => (
                <div key={profile.id} className="friend-card">
                  <div className="friend-avatar-container">
                    <div 
                      className="friend-avatar" 
                      style={{
                        background: profile.avatarBg,
                        color: profile.avatarColor
                      }}
                    >
                      {profile.initials}
                    </div>
                    <div className="friend-match-badge">Match</div>
                  </div>
  
                  <h3 className="friend-name">{profile.name}</h3>
                  <div className="friend-role">{profile.role}</div>
                  <div className="friend-college">{profile.college}</div>
  
                  <div className="friend-skills">
                    {profile.skills.slice(0, 3).map(skill => (
                      <SkillChip key={skill} label={skill} readonly size="small" />
                    ))}
                    {profile.skills.length > 3 && (
                      <span className="friend-more-skills">+{profile.skills.length - 3}</span>
                    )}
                  </div>
  
                  <div className="friend-actions">
                    <button 
                      className="btn btn-ghost small-btn"
                      onClick={() => handleViewProfile(profile.id)}
                    >
                      View Profile
                    </button>
                    <button 
                      className="btn btn-primary small-btn"
                      onClick={() => handleMessage(profile.id)}
                    >
                      Message
                    </button>
                  </div>
                </div>
              ))}
            {mutualMatches.length > 0 && mutualMatches.filter(profile => (profile.name + profile.role).toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="empty-state-friends" style={{ gridColumn: '1/-1' }}>
                <p>No friends match your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
