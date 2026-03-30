import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import SkillChip from '../../components/SkillChip';
import './Discover.css';

export default function Discover() {
  const [allProfiles, setAllProfiles] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentView, setCurrentView] = useState('swipe');
  const [showPopup, setShowPopup] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const navigate = useNavigate();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [hackathon, setHackathon] = useState('All Upcoming');
  const [role, setRole] = useState('All');
  const [matchPct, setMatchPct] = useState(50);

  useEffect(() => {
    API.get('/profiles').then(res => {
      setAllProfiles(res.data);
      setProfiles(res.data);
    }).catch(console.error);
  }, []);

  const handleApplyFilters = () => {
    let filtered = [...allProfiles];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (role !== 'All') {
      filtered = filtered.filter(p => p.role.includes(role));
    }
    
    filtered = filtered.filter(p => p.matchPct >= matchPct);
    
    setProfiles(filtered);
    setCurrentIndex(0); // Reset stack when filters change
  };

  const handleSwipe = async (dir, profile) => {
    if (dir === 'right' || dir === 'super') {
      const res = await API.post('/swipe/right', { targetId: profile.id });
      if (res.data.match || dir === 'super') {
        setMatchedProfile(profile);
        setShowPopup(true);
      }
    } else {
      await API.post('/swipe/left', { targetId: profile.id });
    }
    setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
  };

  const TopCard = ({ profile }) => {
    const cardRef = useRef(null);
    const [drag, setDrag] = useState({ active: false, x: 0, y: 0, startX: 0, startY: 0 });

    const handleStart = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setDrag({ active: true, x: 0, y: 0, startX: clientX, startY: clientY });
    };

    const handleMove = (e) => {
      if (!drag.active) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setDrag(prev => ({ ...prev, x: clientX - prev.startX, y: clientY - prev.startY }));
    };

    const handleEnd = () => {
      setDrag(prev => ({ ...prev, active: false }));
      if (drag.x > 100) handleSwipe('right', profile);
      else if (drag.x < -100) handleSwipe('left', profile);
      else if (drag.y < -100) handleSwipe('super', profile);
      else setDrag({ active: false, x: 0, y: 0, startX: 0, startY: 0 }); // snap back
    };

    const style = {
      transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.05}deg)`,
      transition: drag.active ? 'none' : 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)'
    };

    return (
      <div 
        ref={cardRef} className="swipe-card" style={style}
        onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
        onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
      >
        {drag.x > 80 && <div className="swipe-label sl-like">LIKE ♥</div>}
        {drag.x < -80 && <div className="swipe-label sl-pass">PASS ✕</div>}
        
        <div className="sc-match-badge">{profile.matchPct}% Match</div>
        
        <div className="sc-header">
          <div className="sc-avatar" style={{background: profile.avatarBg, color: profile.avatarColor}}>{profile.initials}</div>
          <div>
            <h3 className="sc-name">{profile.name}</h3>
            <div className="sc-role">{profile.role} &middot; {profile.college}</div>
          </div>
        </div>

        {profile.idea && (
          <div className="sc-idea">
            <strong>Idea:</strong> {profile.idea}
          </div>
        )}

        <div className="sc-section">
          <h5>Skills</h5>
          <div className="chip-row">
            {profile.skills.map(s => <SkillChip key={s} label={s} readonly size="small" />)}
          </div>
        </div>

        <div className="sc-section">
          <h5>Looking For</h5>
          <div className="chip-row">
            {profile.lookingFor.map(s => <span key={s} className="lf-tag">{s}</span>)}
          </div>
        </div>

        <div className="sc-footer">
          <span>{profile.hackathonsCount} hackathons</span>
          <span>Joined {profile.daysAgo}d ago</span>
        </div>
      </div>
    );
  };

  const handleStartChat = () => {
    setShowPopup(false);
    navigate(`/chat?user=${matchedProfile.id}`);
  };

  return (
    <div className="discover-page hide-scrollbars">
      {/* Sidebar Filter */}
      <div className="d-sidebar hide-mobile">
        <h4 style={{marginBottom:'24px'}}>🔍 Filter Teammates</h4>
        <input className="mb-4" type="search" placeholder="Search by name or skill..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        
        <div className="flt-group">
          <label>Hackathon</label>
          <select value={hackathon} onChange={(e) => setHackathon(e.target.value)}>
            <option value="All Upcoming">All Upcoming</option>
            <option value="HackFest 2025">HackFest 2025</option>
          </select>
        </div>

        <div className="flt-group">
          <label>Role</label>
          <div className="chip-row">
            {['All', 'Frontend', 'Backend', 'UI/UX', 'ML'].map(r => (
              <div key={r} onClick={() => setRole(r)} style={{cursor: 'pointer'}}>
                <SkillChip label={r} selected={r===role} readonly size="small" />
              </div>
            ))}
          </div>
        </div>

        <div className="flt-group">
          <label>Match % Above ( {matchPct}% )</label>
          <input type="range" min="50" max="100" value={matchPct} onChange={(e) => setMatchPct(e.target.value)} />
        </div>

        <button className="btn btn-primary w-100" style={{marginTop:'24px'}} onClick={handleApplyFilters}>Apply Filters</button>

        <div className="my-stats-card mt-auto">
          <div>Your Profile Strength: 85%</div>
          <div className="p-bar"><div className="p-fill" style={{width:'85%'}}></div></div>
          <div style={{fontSize:'12px', color:'var(--ink3)', marginTop:'8px'}}>12 Likes &middot; 4 Matches</div>
        </div>
      </div>

      {/* Main Area */}
      <div className="d-main">
        <div className="d-header">
          <div>Displaying matches...</div>
          <div className="view-toggles">
            <button className={`vt-btn ${currentView==='swipe'?'active':''}`} onClick={()=>setCurrentView('swipe')}>🃏</button>
            <button className={`vt-btn ${currentView==='grid'?'active':''}`} onClick={()=>setCurrentView('grid')}>⊞</button>
          </div>
        </div>

        {currentView === 'swipe' ? (
          <div className="swipe-container">
            {currentIndex < profiles.length ? (
              <>
                <div style={{position:'relative', width:'100%', maxWidth:'400px', margin:'0 auto', height:'500px'}}>
                  {/* Render next card underneath for stack effect */}
                  {currentIndex + 1 < profiles.length && (
                    <div className="swipe-card background-card" style={{transform:'scale(0.95) translateY(20px)'}}>
                      <div className="sc-header"><div className="sc-avatar" style={{background:'#eee', color:'#ccc'}}></div><div>Loading...</div></div>
                    </div>
                  )}
                  {/* Active Top Card */}
                  <TopCard profile={profiles[currentIndex]} />
                </div>
                
                <div className="swipe-actions">
                  <button className="sa-btn pass" onClick={() => handleSwipe('left', profiles[currentIndex])}>✕</button>
                  <button className="sa-btn super" onClick={() => handleSwipe('super', profiles[currentIndex])}>⭐</button>
                  <button className="sa-btn like" onClick={() => handleSwipe('right', profiles[currentIndex])}>♥</button>
                </div>
                <div className="progress-ind">Card {currentIndex+1} of {profiles.length}</div>
              </>
            ) : (
              <div className="empty-state">
                <div style={{fontSize:'48px'}}>🏜️</div>
                <h3>No more profiles</h3>
                <p>You've seen everyone! Check back later.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid-view">
            {profiles.map(p => (
              <div key={p.id} className="grid-card">
                <div className="gc-avatar" style={{background:p.avatarBg, color:p.avatarColor}}>{p.initials}</div>
                <h4>{p.name}</h4>
                <div className="gc-role">{p.role}</div>
                <div className="chip-row" style={{justifyContent:'center'}}>{p.skills.slice(0,3).map(s=><SkillChip key={s} label={s} readonly size="small"/>)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match Popup Overlay */}
      {showPopup && matchedProfile && (
        <div className="match-overlay" onClick={(e) => { if(e.target===e.currentTarget) setShowPopup(false); }}>
          <div className="match-card">
            <div style={{fontSize:'64px'}}>🎉</div>
            <div className="match-avatars">
              <div className="m-av my-av">AK</div>
              <div className="m-sparkle">✨</div>
              <div className="m-av their-av" style={{background:matchedProfile.avatarBg, color:matchedProfile.avatarColor}}>{matchedProfile.initials}</div>
            </div>
            <h2 className="match-h2">It's a Match!</h2>
            <p className="match-sub">You and {matchedProfile.name} both swiped right. Say hello!</p>
            <button className="btn btn-primary w-100 mb-2" onClick={handleStartChat}>💬 Start Conversation</button>
            <button className="btn btn-ghost w-100" onClick={() => setShowPopup(false)} style={{border:'none'}}>Keep Browsing</button>
          </div>
        </div>
      )}
    </div>
  );
}
