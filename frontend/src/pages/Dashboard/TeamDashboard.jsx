import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as API from '../../services/api';
import Card from '../../components/Card';
import SkillChip from '../../components/SkillChip';
import { useAuth } from '../../context/AuthContext';
import './TeamDashboard.css';

export default function TeamDashboard() {
  const [myProjects, setMyProjects] = useState([]);
  const [projectJoinRequests, setProjectJoinRequests] = useState({});
  const [mutualMatches, setMutualMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsRes, matchesRes] = await Promise.all([
        API.getMyProjects(),
        API.getMutualMatches()
      ]);
      const projects = projectsRes.data || [];
      setMyProjects(projects);
      setMutualMatches(matchesRes.data || []);

      // Fetch join requests for each project
      const requestMap = {};
      for (const project of projects) {
        try {
          const reqRes = await API.getProjectJoinRequests(project.id);
          requestMap[project.id] = reqRes.data || [];
        } catch {
          requestMap[project.id] = [];
        }
      }
      setProjectJoinRequests(requestMap);
    } catch (err) {
      console.error('Error loading team data:', err);
    }
    setLoading(false);
  };

  // Calculate team skill coverage from mutual matches
  const handleAcceptRequest = async (projectId, reqId) => {
    try {
      await API.acceptJoinRequest(reqId);
      setProjectJoinRequests(prev => ({
        ...prev,
        [projectId]: prev[projectId].map(r => r.id === reqId ? { ...r, status: 'accepted' } : r)
      }));
      // Refresh mutual matches to add the new teammate instantly
      const matchesRes = await API.getMutualMatches();
      setMutualMatches(matchesRes.data || []);
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const handleRejectRequest = async (projectId, reqId) => {
    try {
      await API.rejectJoinRequest(reqId);
      setProjectJoinRequests(prev => ({
        ...prev,
        [projectId]: prev[projectId].map(r => r.id === reqId ? { ...r, status: 'rejected' } : r)
      }));
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const skillCoverage = useMemo(() => {
    const categories = [
      { label: 'Frontend', keywords: ['react', 'vue', 'angular', 'html', 'css', 'tailwind', 'next.js', 'javascript', 'frontend'] },
      { label: 'Backend', keywords: ['node.js', 'express', 'django', 'flask', 'spring', 'backend', 'mongodb', 'sql'] },
      { label: 'ML/AI', keywords: ['python', 'tensorflow', 'pytorch', 'ml', 'ai', 'pandas', 'scikit'] },
      { label: 'DevOps', keywords: ['docker', 'kubernetes', 'aws', 'gcp', 'ci/cd', 'linux', 'devops'] },
      { label: 'UI/UX', keywords: ['figma', 'sketch', 'adobe', 'ui', 'ux', 'design'] },
      { label: 'Mobile', keywords: ['flutter', 'react native', 'swift', 'kotlin', 'android', 'ios'] }
    ];

    const allSkills = mutualMatches.flatMap(m => (m.skills || []).map(s => s.toLowerCase()));

    return categories.map(cat => {
      const count = allSkills.filter(s => cat.keywords.some(k => s.includes(k))).length;
      const pct = Math.min(100, Math.round((count / Math.max(allSkills.length, 1)) * 300));
      return { ...cat, pct: Math.max(pct, mutualMatches.length > 0 ? 15 : 0) };
    });
  }, [mutualMatches]);

  // Radar logic
  const getPoint = (angle, dist, maxDist = 100) => {
    const rad = (angle - 90) * (Math.PI / 180);
    const r = (dist / maxDist) * 80;
    return `${100 + r * Math.cos(rad)},${100 + r * Math.sin(rad)}`;
  };

  const idealPoints = skillCoverage.map((_, i) => getPoint(i * 60, 100)).join(' ');
  const teamPoints = skillCoverage.map((c, i) => getPoint(i * 60, c.pct)).join(' ');

  if (loading) return <div className="page-container p-6">Loading team data...</div>;

  return (
    <div className="team-dash hide-scrollbars">
      <div className="td-header">
        <div>
          <h2>My Team</h2>
          <div className="alert-pill amber mt-2">
            {mutualMatches.length} mutual match{mutualMatches.length !== 1 ? 'es' : ''} · {myProjects.length} project{myProjects.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/discover')}>
          Find Teammates
        </button>
      </div>

      {/* Skill Radar Card */}
      <Card className="td-radar-card">
        <div className="rc-header">
          <h3>Team Skill Coverage</h3>
          <span className="rc-badge">{mutualMatches.length} friend{mutualMatches.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="radar-layout">
          <svg viewBox="0 0 200 200" className="radar-svg">
            <polygon points={idealPoints} fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" />
            <polygon points={teamPoints} fill="rgba(79,53,243,0.15)" stroke="var(--primary)" strokeWidth="2" />
            {skillCoverage.map((c, i) => {
              const pt = getPoint(i * 60, 100);
              const labelPt = getPoint(i * 60, 115);
              return (
                <g key={c.label}>
                  <line x1="100" y1="100" x2={pt.split(',')[0]} y2={pt.split(',')[1]} stroke="var(--border2)" />
                  <text x={labelPt.split(',')[0]} y={labelPt.split(',')[1]} textAnchor="middle" alignmentBaseline="middle" className="radar-label">
                    {c.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="radar-bars">
            {skillCoverage.map(c => (
              <div key={c.label} className="bar-row">
                <div className="bar-label">{c.label}</div>
                <div className="bar-wrap">
                  <div className="bar-fill" style={{ width: `${c.pct}%` }}></div>
                </div>
                <div className="bar-pct">{c.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Project-wise Teams */}
      {myProjects.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 className="mb-4">My Projects & Teams</h3>
          {myProjects.map(project => {
            const requests = projectJoinRequests[project.id] || [];
            return (
              <Card key={project.id} className="project-team-card" style={{ marginBottom: '20px' }}>
                <div className="ptc-header">
                  <div>
                    <h4 className="ptc-title">{project.title}</h4>
                    <div className="ptc-meta">
                      <span className="ic-domain">{project.domain}</span>
                      <span className="ptc-skills">
                        {(project.skillsNeeded || []).slice(0, 3).map(s => (
                          <SkillChip key={s} label={s} readonly size="small" />
                        ))}
                      </span>
                    </div>
                  </div>
                  <span className="rc-badge">{requests.length} request{requests.length !== 1 ? 's' : ''}</span>
                </div>

                {requests.length === 0 ? (
                  <div className="ptc-empty">
                    <p>No join requests yet. Share your project or wait for matches!</p>
                  </div>
                ) : (
                  <div className="ptc-members">
                    {requests.map(req => (
                      <div key={req.id} className="ptc-member">
                        <div className="mc-avatar bg-primary-soft text-primary">
                          {(req.requesterName || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="ptc-member-info">
                          <div className="mc-name">{req.requesterName || 'Requester'}</div>
                          <div className="mc-role">{req.requesterEmail || ''}</div>
                        </div>
                        {req.status === 'accepted' ? (
                          <span className="mc-status green">Accepted</span>
                        ) : req.status === 'rejected' ? (
                          <span className="mc-status red">Rejected</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-ghost small-btn" onClick={() => handleRejectRequest(project.id, req.id)}>Reject</button>
                            <button className="btn btn-primary small-btn" onClick={() => handleAcceptRequest(project.id, req.id)}>Accept</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {/* Project Teammates (Matched via Projects) */}
      <div className="td-grid">
        <div className="td-main">
          <h3 className="mb-4">My Teammates</h3>
          <div className="members-grid">
            {mutualMatches.filter(m => m.isTeammate).map(m => (
              <Card key={m.id} className="member-card">
                <div className="mc-avatar" style={{ background: m.avatarBg || 'var(--primary-soft)', color: m.avatarColor || 'var(--primary)' }}>
                  {m.initials || 'U'}
                </div>
                <h4 className="mc-name">{m.name}</h4>
                <div className="mc-role">{m.role} · {m.college || 'CodeConnect'}</div>
                <div className="chip-row center mb-3">
                  {(m.skills || []).slice(0, 3).map(s => <SkillChip key={s} label={s} readonly size="small" />)}
                </div>
                <div className="mc-status green">Teammate</div>
                <div className="gc-actions" style={{ marginTop: '12px' }}>
                  <button className="btn btn-ghost small-btn" onClick={() => navigate(`/profile/${m.id}`)}>View</button>
                  <button className="btn btn-primary small-btn" onClick={() => navigate(`/chat?user=${m.id}`)}>Chat</button>
                </div>
              </Card>
            ))}
            <Card className="add-member-card" onClick={() => navigate('/discover')}>
              <div className="add-icon">+</div>
              <div>Find More</div>
            </Card>
          </div>
          {mutualMatches.filter(m => m.isTeammate).length === 0 && (
            <div className="empty-state" style={{ marginTop: '20px' }}>
              <p>No project teammates yet. Accept join requests or join other projects to see teammates here!</p>
            </div>
          )}
        </div>

        <div className="td-side">
          <Card>
            <h3 className="mb-4">Quick Actions</h3>
            <button className="btn btn-primary w-100 mb-3" onClick={() => navigate('/discover')}>Find Teammates</button>
            <button className="btn btn-ghost w-100 mb-3" onClick={() => navigate('/idea-board')}>Post a Project</button>
            <button className="btn btn-ghost w-100" onClick={() => navigate('/friends')}>View Friends</button>
          </Card>
        </div>
      </div>
    </div>
  );
}
