import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as API from '../../services/api';
import Card from '../../components/Card';
import SkillChip from '../../components/SkillChip';
import { useToast } from '../../context/ToastContext';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [mutualFriends, setMutualFriends] = useState([]);

  const isSelf = !id;

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = isSelf ? await API.getMyProfile() : await API.getProfile(id);
        setProfile(res.data);
        
        if (isSelf) {
          try {
            const friendsRes = await API.getMutualMatches();
            setMutualFriends(friendsRes.data);
          } catch (err) {
            console.error('Error loading mutual matches:', err);
          }
        }
      } catch (err) {
        console.error(err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, isSelf]);

  useEffect(() => {
    const loadSearch = async () => {
      try {
        const res = await API.searchProfiles(query);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (query.trim()) {
      loadSearch();
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const handleLikeProfile = async () => {
    try {
      await API.likeProfile(id);
      setIsLiked(true);
      showToast('Profile liked!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not like profile', 'error');
    }
  };

  const handleUnlikeProfile = async () => {
    try {
      await API.unlikeProfile(id);
      setIsLiked(false);
      showToast('Profile unliked', 'info');
    } catch (err) {
      console.error(err);
      showToast('Could not unlike profile', 'error');
    }
  };

  if (loading) {
    return <div className="profile-page"><div className="profile-shell">Loading profile...</div></div>;
  }

  if (!profile) {
    return <div className="profile-page"><div className="profile-shell">Profile not found.</div></div>;
  }

  return (
    <div className="profile-page hide-scrollbars">
      <div className="profile-shell">
        <div className="profile-left">
          <Card className="profile-main-card">
            <div className="profile-banner"></div>
            <div className="profile-head">
              <div className="profile-avatar-container">
                <div className="profile-avatar" style={{ background: profile.avatarBg, color: profile.avatarColor }}>
                  {profile.initials}
                </div>
              </div>
              <div className="profile-title-area">
                <h2>{profile.name}</h2>
                <div className="profile-role-badge">{profile.role}</div>
                <div className="profile-college">
                  <i className="fas fa-university"></i>
                  {profile.college || 'College Enthusiast'}
                </div>
              </div>
            </div>

            <div className="profile-meta-grid">
              <div className="meta-item">
                <i className="fas fa-bolt"></i>
                <div className="meta-info">
                  <span>Match Score</span>
                  <strong>{profile.matchPct}%</strong>
                </div>
              </div>
              <div className="meta-item">
                <i className="fas fa-trophy"></i>
                <div className="meta-info">
                  <span>Hackathons</span>
                  <strong>{profile.hackathonsCount}</strong>
                </div>
              </div>
              <div className="meta-item">
                <i className="fas fa-users"></i>
                <div className="meta-info">
                  <span>Team Size</span>
                  <strong>{profile.teamSize || 'Not set'}</strong>
                </div>
              </div>
              <div className="meta-item">
                <i className="fas fa-envelope"></i>
                <div className="meta-info">
                  <span>Email</span>
                  <strong>{profile.email || 'Hidden'}</strong>
                </div>
              </div>
            </div>

            <section className="profile-section">
              <h4><i className="fas fa-star"></i> Skills</h4>
              <div className="chip-row">
                {(profile.skills || []).length > 0
                  ? profile.skills.map((skill) => <SkillChip key={skill} label={skill} readonly size="small" />)
                  : <span className="empty-hint">No skills added yet</span>}
              </div>
            </section>

            <section className="profile-section">
              <h4><i className="fas fa-search"></i> Looking For</h4>
              <div className="chip-row">
                {(profile.lookingFor || []).length > 0
                  ? profile.lookingFor.map((item) => <SkillChip key={item} label={item} readonly size="small" />)
                  : <span className="empty-hint">No preferences added yet</span>}
              </div>
            </section>

            <section className="profile-section">
              <h4><i className="fas fa-lightbulb"></i> Current Idea</h4>
              <p className="idea-text">{profile.idea || 'No idea description yet.'}</p>
            </section>

            <section className="profile-section">
              <h4><i className="fas fa-history"></i> Previous Projects</h4>
              {(profile.previousProjects || []).length > 0 ? (
                <ul className="project-list">
                  {profile.previousProjects.map((project, idx) => <li key={idx}>{project}</li>)}
                </ul>
              ) : (
                <p className="empty-hint">No previous projects listed.</p>
              )}
            </section>

            {!isSelf && (
              <div className="profile-actions">
                <button 
                  className={`btn ${isLiked ? 'btn-ghost liked' : 'btn-primary'}`}
                  onClick={isLiked ? handleUnlikeProfile : handleLikeProfile}
                >
                  <i className={isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
                  {isLiked ? 'Liked' : 'Like'}
                </button>
                <button className="btn btn-primary" onClick={() => navigate(`/chat?user=${profile.id}`)}>
                  <i className="fas fa-comment"></i> Message
                </button>
              </div>
            )}

            {isSelf && (
              <div className="profile-actions-self">
                 <Link className="btn btn-primary" to="/profile-setup">Edit Profile</Link>
              </div>
            )}

            {isSelf && mutualFriends.length > 0 && (
              <section className="profile-section">
                <h4>Your Mutual Friends ({mutualFriends.length})</h4>
                <div className="friends-mini-list">
                  {mutualFriends.slice(0, 5).map(friend => (
                    <Link 
                      key={friend.id} 
                      to={`/profile/${friend.id}`}
                      className="friend-mini-card"
                    >
                      <div 
                        className="friend-mini-avatar"
                        style={{ background: friend.avatarBg, color: friend.avatarColor }}
                      >
                        {friend.initials}
                      </div>
                      <div className="friend-mini-info">
                        <div className="friend-mini-name">{friend.name}</div>
                        <div className="friend-mini-role">{friend.role}</div>
                      </div>
                    </Link>
                  ))}
                  {mutualFriends.length > 5 && (
                    <Link to="/friends" className="friend-see-more">
                      See all {mutualFriends.length} friends
                    </Link>
                  )}
                </div>
              </section>
            )}
          </Card>
        </div>

        <div className="profile-right">
          <Card>
            <h3>Find People</h3>
            <input
              type="search"
              className="profile-search"
              placeholder="Search by name, skill, or role"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="search-list">
              {searchResults.map((item) => (
                <Link key={item.id} to={`/profile/${item.id}`} className="search-row">
                  <div className="search-avatar" style={{ background: item.avatarBg, color: item.avatarColor }}>{item.initials}</div>
                  <div>
                    <div className="search-name">{item.name}</div>
                    <div className="search-sub">{item.role} · {item.college}</div>
                  </div>
                  <div className="search-match">{item.matchPct}%</div>
                </Link>
              ))}
              {searchResults.length === 0 && query && <div className="empty-hint">No people found</div>}
              {!query && <div className="empty-hint">Start typing to search...</div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
