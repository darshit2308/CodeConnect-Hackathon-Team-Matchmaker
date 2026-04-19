import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SkillChip from '../../components/SkillChip';
import './Discover.css';

function fallbackText(value, fallback) {
  return value && String(value).trim() ? value : fallback;
}

function normalizeProfile(profile) {
  const initials = profile.initials || profile.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  return {
    ...profile,
    initials,
    avatarBg: profile.avatarBg || 'var(--primary-soft)',
    avatarColor: profile.avatarColor || 'var(--primary)',
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    lookingFor: Array.isArray(profile.lookingFor) ? profile.lookingFor : [],
    matchPct: profile.matchPct ?? 0,
    hackathonsCount: profile.hackathonsCount ?? 0,
    daysAgo: profile.daysAgo ?? 0,
  };
}

// Threshold in pixels to trigger a swipe
const SWIPE_THRESHOLD = 100;

export default function Discover() {
  const [allProfiles, setAllProfiles] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [swipeStatusList, setSwipeStatusList] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [discoverSubsection, setDiscoverSubsection] = useState('general');
  const [viewMode, setViewMode] = useState('swipe');
  const [searchTerm, setSearchTerm] = useState('');
  const [role, setRole] = useState('All');
  const [matchPct, setMatchPct] = useState(50);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [showStatus, setShowStatus] = useState(false);
  const [swipeAnimation, setSwipeAnimation] = useState(null); // 'left' | 'right' | 'super' | null
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // ---- Drag/Swipe gesture state ----
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const isSwiping = useRef(false); // lock to prevent double-swipe

  const activeContext = useMemo(() => {
    return discoverSubsection === 'myproject' && selectedProjectId ? `project_${selectedProjectId}` : 'general';
  }, [discoverSubsection, selectedProjectId]);

  const loadProfiles = async (ctx) => {
    try {
      const res = await API.getProfiles(ctx || activeContext);
      const normalized = res.data.map(normalizeProfile);
      setAllProfiles(normalized);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  const loadSwipeStatuses = async () => {
    try {
      const res = await API.getLikedProfiles();
      setSwipeStatusList((res.data || []).map(normalizeProfile));
    } catch (err) {
      console.error('Error fetching swipe statuses:', err);
    }
  };

  const loadMyProjects = async () => {
    try {
      const res = await API.getMyProjects();
      const projects = res.data || [];
      setMyProjects(projects);
      if (projects.length > 0) setSelectedProjectId(projects[0].id);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    loadProfiles(activeContext);
  }, [activeContext]);

  useEffect(() => {
    loadSwipeStatuses();
    loadMyProjects();
  }, []);

  const projectSkills = useMemo(() => {
    if (discoverSubsection === 'myproject' && selectedProjectId) {
      const proj = myProjects.find(p => p.id === selectedProjectId);
      return proj ? (proj.skillsNeeded || []) : [];
    }
    return [];
  }, [myProjects, discoverSubsection, selectedProjectId]);

  // Filter profiles based on current subsection and filters
  const filteredProfiles = useMemo(() => {
    let next = [...allProfiles];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      next = next.filter((profile) =>
        profile.name?.toLowerCase().includes(term) ||
        profile.role?.toLowerCase().includes(term) ||
        (profile.skills || []).some((skill) => skill.toLowerCase().includes(term))
      );
    }

    if (role !== 'All') {
      next = next.filter((profile) => profile.role?.includes(role));
    }

    next = next.filter((profile) => (profile.matchPct ?? 0) >= Number(matchPct));

    // For My Project subsection, filter by project skills
    if (discoverSubsection === 'myproject') {
      if (projectSkills.length === 0) {
        return []; // No projects = no profiles to show
      }
      next = next.filter((profile) =>
        (profile.skills || []).some((skill) =>
          projectSkills.some((ps) => ps.toLowerCase() === skill.toLowerCase())
        )
      );
    }

    return next;
  }, [allProfiles, searchTerm, role, matchPct, discoverSubsection, projectSkills]);

  // Update profiles state whenever filters change
  useEffect(() => {
    setProfiles(filteredProfiles);
    setCurrentIndex(0);
    setShowStatus(false);
  }, [filteredProfiles]);

  const resetFilters = () => {
    setSearchTerm('');
    setRole('All');
    setMatchPct(50);
    setDiscoverSubsection('general');
    setViewMode('swipe');
    setShowStatus(false);
    loadProfiles();
  };

  // ---- Core swipe action (called by both drag gesture and button clicks) ----
  const executeSwipe = async (direction, profile) => {
    if (isSwiping.current) return;
    isSwiping.current = true;

    // Trigger exit animation
    setSwipeAnimation(direction);
    setDragOffset({ x: 0, y: 0 });

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      if (direction === 'right' || direction === 'super') {
        if (discoverSubsection === 'myproject' && selectedProjectId) {
          // Send join request from project owner to the profile
          await API.inviteTeamMember(profile.id, selectedProjectId);
          console.log(`Invite sent to ${profile.name}`);
        } else {
          // Regular match swipe
          const swipeRes = await API.swipeRight(profile.id, activeContext);

          if (swipeRes.data?.match) {
            setMatchedProfile(profile);
            setShowMatch(true);
          }
        }
      } else {
        await API.swipeLeft(profile.id, activeContext);
      }
    } catch (err) {
      console.error('Error swiping:', err);
    }

    // Remove profile from all lists
    const pid = profile.id;
    setAllProfiles((prev) => prev.filter((p) => p.id !== pid));
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== pid);
      setCurrentIndex((idx) => Math.min(idx, Math.max(0, next.length - 1)));
      return next;
    });
    setSwipeStatusList((prev) => prev.filter((p) => p.id !== pid));
    setSwipeAnimation(null);
    isSwiping.current = false;

    // Refresh statuses in background
    loadSwipeStatuses();
  };

  // ---- Drag gesture handlers (pointer events for mouse + touch) ----
  const handlePointerDown = (e) => {
    if (isSwiping.current || swipeAnimation) return;
    // Don't start drag on buttons
    if (e.target.closest('button')) return;

    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = (e.clientY - dragStart.current.y) * 0.3; // dampen vertical movement
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);

    const currentP = profiles[currentIndex];
    if (!currentP) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    if (dragOffset.x > SWIPE_THRESHOLD) {
      // Swiped right: like
      executeSwipe('right', currentP);
    } else if (dragOffset.x < -SWIPE_THRESHOLD) {
      // Swiped left: pass
      executeSwipe('left', currentP);
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Calculate card transform and rotation based on drag
  const dragRotation = isDragging ? dragOffset.x * 0.08 : 0; // degrees
  const dragOpacityLike = Math.min(1, Math.max(0, dragOffset.x / SWIPE_THRESHOLD));
  const dragOpacityPass = Math.min(1, Math.max(0, -dragOffset.x / SWIPE_THRESHOLD));

  // NEW: Calculate progress for the background cards to grow
  const swipeProgress = swipeAnimation 
    ? 1 // If it's animating out, force background cards to their final full size
    : Math.min(1, Math.abs(dragOffset.x) / SWIPE_THRESHOLD);

  const cardStyle = (isDragging || dragOffset.x !== 0) && !swipeAnimation
    ? {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragRotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        zIndex: 10, // Ensure top card stays on top
      }
    : { zIndex: 10 };

  const currentProfile = profiles[currentIndex];
  const visibleProfiles = showStatus ? swipeStatusList : profiles;
  const hasNoProjectsForMyProject = discoverSubsection === 'myproject' && myProjects.length === 0;

  return (
    <div className="discover-page hide-scrollbars">
      <div className="d-sidebar hide-mobile">
        <h4 style={{ marginBottom: '24px' }}>Filter Teammates</h4>
        <input
          className="mb-4"
          type="search"
          placeholder="Search by name, skill..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flt-group">
          <label>Role</label>
          <div className="chip-row">
            {['All', 'Frontend', 'Backend', 'UI/UX', 'ML'].map((item) => (
              <div key={item} onClick={() => setRole(item)} style={{ cursor: 'pointer' }}>
                <SkillChip label={item} selected={item === role} readonly size="small" />
              </div>
            ))}
          </div>
        </div>

        <div className="flt-group">
          <label>Match % Above ({matchPct}%)</label>
          <input type="range" min="50" max="100" value={matchPct} onChange={(e) => setMatchPct(e.target.value)} />
        </div>

        <button className="btn btn-ghost w-100" style={{ marginTop: '8px' }} onClick={resetFilters}>
          Reset Filters
        </button>
        <button className="btn btn-ghost w-100" style={{ marginTop: '8px' }} onClick={() => setShowStatus((value) => !value)}>
          {showStatus ? 'Back to Discover' : `Swipe Status (${swipeStatusList.length})`}
        </button>

        <div className="my-stats-card mt-auto">
          <div>Your Profile Strength: 85%</div>
          <div className="p-bar"><div className="p-fill" style={{ width: '85%' }} /></div>
          <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '8px' }}>{myProjects.length} Projects · {swipeStatusList.length} Requests</div>
        </div>
      </div>

      <div className="d-main">
        {/* Prominent Discover Section Tabs */}
        <div className="discover-tabs">
          <button
            className={`discover-tab ${discoverSubsection === 'general' ? 'active' : ''}`}
            onClick={() => {
              setDiscoverSubsection('general');
              setCurrentIndex(0);
              setShowStatus(false);
            }}
          >
            <span className="tab-icon">All</span>
            <span className="tab-label">General</span>
            <span className="tab-desc">Find friends & teammates</span>
          </button>
          <button
            className={`discover-tab ${discoverSubsection === 'myproject' ? 'active' : ''}`}
            onClick={() => {
              setDiscoverSubsection('myproject');
              setCurrentIndex(0);
              setShowStatus(false);
            }}
          >
            <span className="tab-icon">Project</span>
            <span className="tab-label">My Project</span>
            <span className="tab-desc">
              {myProjects.length > 0
                ? `${myProjects.length} project${myProjects.length !== 1 ? 's' : ''} · skill matches`
                : 'Post a project first'}
            </span>
          </button>
        </div>

        <div className="d-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {showStatus
              ? `${swipeStatusList.length} sent request${swipeStatusList.length !== 1 ? 's' : ''}`
              : `${visibleProfiles.length} teammate${visibleProfiles.length !== 1 ? 's' : ''} found`
            }
            {discoverSubsection === 'myproject' && !showStatus && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="subsection-badge">Project Match</span>
                {myProjects.length > 0 && (
                  <select 
                    value={selectedProjectId || ''} 
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '13px', fontFamily: 'var(--font-body)' }}
                  >
                    {myProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
          <div className="view-toggles">
            <button className={`vt-btn ${viewMode === 'swipe' ? 'active' : ''}`} onClick={() => setViewMode('swipe')} title="Swipe view">Swipe</button>
            <button className={`vt-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>⊞</button>
          </div>
        </div>

        {showStatus ? (
          <div className="grid-view">
            {swipeStatusList.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: '48px' }}>0</div>
                <h3>No requests sent</h3>
                <p>Swipe right on profiles to connect!</p>
              </div>
            ) : (
              swipeStatusList.map((profile) => (
                <div key={profile.id} className="grid-card">
                  <div className="gc-match-badge" style={{
                    background: profile.swipeStatus === 'Accepted' ? 'var(--primary)' : profile.swipeStatus === 'Rejected' ? 'var(--error)' : 'var(--ink3)'
                  }}>
                    {profile.swipeStatus === 'Accepted' ? 'Accepted' : profile.swipeStatus === 'Rejected' ? 'Rejected' : 'Pending'}
                  </div>
                  <div className="gc-avatar" style={{ background: profile.avatarBg, color: profile.avatarColor }}>{profile.initials}</div>
                  <h4>{profile.name}</h4>
                  <div className="gc-role">{profile.role}</div>
                  <div className="chip-row" style={{ justifyContent: 'center' }}>
                    {profile.skills.slice(0, 3).map((skill) => <SkillChip key={skill} label={skill} readonly size="small" />)}
                  </div>
                  <div className="gc-actions">
                    <button className="btn btn-ghost small-btn" onClick={() => navigate(`/profile/${profile.id}`)}>View</button>
                    {profile.swipeStatus === 'Accepted' && (
                      <button className="btn btn-primary small-btn" onClick={() => navigate(`/chat?user=${profile.id}`)}>Message</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : hasNoProjectsForMyProject ? (
          <div className="empty-state my-project-empty">
              <div className="empty-illustration">+</div>
            <h3>No projects posted yet</h3>
            <p>Post a project on the Project Board first, then come here to find teammates whose skills match your project needs.</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/idea-board')}>
              Go to Project Board
            </button>
          </div>
        ) : viewMode === 'swipe' ? (
          <div className="swipe-container">
            {currentProfile ? (
              <>
                <div className="swipe-deck" style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto', height: '500px', perspective: '1000px' }}>
                  {[profiles[currentIndex + 2], profiles[currentIndex + 1], currentProfile].filter(Boolean).map((p, i, arr) => {
                    const isCurrent = p.id === currentProfile?.id;
                    const depth = (arr.length - 1) - i; 

                    // --- THE SHARED CARD CONTENT ---
                    // This ensures the background cards are exactly as fully-detailed as the front card!
                    const renderCardDetails = (profileData) => (
                      <>
                        <div className="sc-match-badge">{profileData.matchPct}% Match</div>
                        <div className="sc-header">
                          <div className="sc-avatar" style={{ background: profileData.avatarBg, color: profileData.avatarColor }}>{profileData.initials}</div>
                          <div>
                            <h3 className="sc-name">{profileData.name}</h3>
                            <div className="sc-role">{profileData.role} · {fallbackText(profileData.college, 'CodeConnect')}</div>
                          </div>
                        </div>

                        {profileData.idea && (
                          <div className="sc-idea">
                            <strong>Idea:</strong> {profileData.idea}
                          </div>
                        )}

                        <div className="sc-section">
                          <h5>Skills</h5>
                          <div className="chip-row">
                            {profileData.skills.map((skill) => <SkillChip key={skill} label={skill} readonly size="small" />)}
                          </div>
                        </div>

                        <div className="sc-section">
                          <h5>Looking For</h5>
                          <div className="chip-row">
                            {profileData.lookingFor.map((skill) => <span key={skill} className="lf-tag">{skill}</span>)}
                          </div>
                        </div>

                        <div className="sc-footer">
                          <span>{profileData.hackathonsCount} hackathons</span>
                          <span>Joined {profileData.daysAgo}d ago</span>
                        </div>
                      </>
                    );

                    // --- BACKGROUND CARD RENDERING ---

                    // --- BACKGROUND CARD RENDERING ---
                    if (!isCurrent) {
                      // 1. Scale & Position (Still follows your finger slightly for that 3D feel)
                      const baseScale = 1 - (depth * 0.05); 
                      const nextScale = 1 - ((depth - 1) * 0.05); 
                      const currentScale = baseScale + ((nextScale - baseScale) * swipeProgress);

                      const baseY = depth * 20; 
                      const nextY = (depth - 1) * 20;
                      const currentY = baseY - ((baseY - nextY) * swipeProgress);

                      // 2. THE STRICT BLUR LOCK
                      // We ignore swipeProgress entirely for the blur. 
                      // If the top card is animating away (swipe is confirmed), drop the blur to the next level.
                      // Otherwise, keep it locked at max blur.
                      const isSwipingAway = !!swipeAnimation;
                      const currentBlur = isSwipingAway ? ((depth - 1) * 20) : (depth * 20);

                      return (
                        <div 
                          key={p.id} 
                          className="swipe-card deck-card"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            transform: `translateY(${currentY}px) scale(${currentScale})`,
                            // Apply the locked blur
                            filter: `blur(${currentBlur}px)`,
                            WebkitFilter: `blur(${currentBlur}px)`, 
                            opacity: 1, 
                            // When you let go, this CSS transition handles the smooth 0.4s un-blur!
                            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), filter 0.4s ease, -webkit-filter 0.4s ease',
                            zIndex: 10 - depth,
                            pointerEvents: 'none' 
                          }}
                        >
                          {/* Render the full HTML inside the background card */}
                          {renderCardDetails(p)}
                        </div>
                      );
                    }

                    // --- FOREGROUND (TOP) CARD RENDERING ---
                    return (
                      <div
                        key={p.id}
                        ref={cardRef}
                        className={`swipe-card ${swipeAnimation === 'left' ? 'swipe-exit-left' : ''} ${swipeAnimation === 'right' || swipeAnimation === 'super' ? 'swipe-exit-right' : ''}`}
                        style={{ ...cardStyle, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                      >
                        {(dragOpacityLike > 0.1 || swipeAnimation === 'right' || swipeAnimation === 'super') && (
                          <div className="swipe-label sl-like" style={{ opacity: swipeAnimation ? 0.9 : dragOpacityLike }}>
                            {swipeAnimation === 'super' ? 'SUPER' : 'LIKE'}
                          </div>
                        )}
                        {(dragOpacityPass > 0.1 || swipeAnimation === 'left') && (
                          <div className="swipe-label sl-pass" style={{ opacity: swipeAnimation ? 0.9 : dragOpacityPass }}>
                            PASS
                          </div>
                        )}

                        <button className="view-profile-btn" onClick={() => navigate(`/profile/${p.id}`)}>
                          View Profile
                        </button>
                        
                        {/* Render the full HTML inside the top card */}
                        {renderCardDetails(p)}
                      </div>
                    );
                  })}
                </div>

                {/* Swipe Action Buttons */}
                <div className="swipe-actions">
                  <button
                    className="sa-btn pass"
                    title="Pass"
                    onClick={() => executeSwipe('left', currentProfile)}
                    disabled={!!swipeAnimation || isSwiping.current}
                  >
                    ✕
                  </button>
                  <button
                    className="sa-btn like"
                    title="Like"
                    onClick={() => executeSwipe('right', currentProfile)}
                    disabled={!!swipeAnimation || isSwiping.current}
                  >
                    ♥
                  </button>
                </div>
                <div className="progress-ind">Card {currentIndex + 1} of {profiles.length}</div>
              </>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '48px' }}>No</div>
                <h3>No more profiles</h3>
                <p>You have seen all profiles in {discoverSubsection === 'general' ? 'General' : 'My Project'}.</p>
                {discoverSubsection === 'general' && (
                  <button className="btn btn-ghost" style={{ marginTop: '12px' }} onClick={() => loadProfiles()}>Refresh</button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid-view">
            {profiles.map((profile) => (
              <div key={profile.id} className="grid-card">
                <div className="gc-match-badge">{profile.matchPct}% Match</div>
                <div className="gc-avatar" style={{ background: profile.avatarBg, color: profile.avatarColor }}>{profile.initials}</div>
                <h4>{profile.name}</h4>
                <div className="gc-role">{profile.role}</div>
                <div className="chip-row" style={{ justifyContent: 'center' }}>
                  {profile.skills.slice(0, 3).map((skill) => <SkillChip key={skill} label={skill} readonly size="small" />)}
                </div>
                <div className="gc-actions">
                  <button className="btn btn-ghost small-btn" onClick={() => navigate(`/profile/${profile.id}`)}>View</button>
                  <button className="sa-btn pass" onClick={() => executeSwipe('left', profile)} disabled={!!swipeAnimation}>✕</button>
                  <button className="sa-btn like" onClick={() => executeSwipe('right', profile)} disabled={!!swipeAnimation}>♥</button>
                </div>
              </div>
            ))}
            {profiles.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: '48px' }}>No</div>
                <h3>No profiles found</h3>
                <p>Try adjusting your filters!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showMatch && matchedProfile && (
        <div className="match-overlay" onClick={(event) => { if (event.target === event.currentTarget) setShowMatch(false); }}>
          <div className="match-card">
            <div className="match-avatars">
              <div className="m-av my-av" style={{ background: user?.avatarBg, color: user?.avatarColor }}>{user?.initials}</div>
              <div className="m-sparkle">+</div>
              <div className="m-av their-av" style={{ background: matchedProfile.avatarBg, color: matchedProfile.avatarColor }}>{matchedProfile.initials}</div>
            </div>
            <h2 className="match-h2">It's a Match!</h2>
            <p className="match-sub">You and {matchedProfile.name} both swiped right. Say hello!</p>
            <button className="btn btn-primary w-100 mb-2" onClick={() => navigate(`/chat?user=${matchedProfile.id}`)}>Start Conversation</button>
            <button className="btn btn-ghost w-100" onClick={() => setShowMatch(false)} style={{ border: 'none' }}>Keep Browsing</button>
          </div>
        </div>
      )}

    </div>
  );
}
