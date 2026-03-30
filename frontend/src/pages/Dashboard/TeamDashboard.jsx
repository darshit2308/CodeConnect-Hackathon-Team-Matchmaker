import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Card from '../../components/Card';
import SkillChip from '../../components/SkillChip';
import './TeamDashboard.css';

export default function TeamDashboard() {
  const [team, setTeam] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/team').then(res => setTeam(res.data)).catch(console.error);
  }, []);

  if (!team) return <div className="page-container p-6">Loading team...</div>;

  const categories = [
    { label: 'Frontend', pct: 90 },
    { label: 'Backend', pct: 75 },
    { label: 'ML/AI', pct: 60 },
    { label: 'DevOps', pct: 40 },
    { label: 'UI/UX', pct: 85 },
    { label: 'Management', pct: 55 }
  ];

  // Radar logic
  const getPoint = (angle, dist, maxDist = 100) => {
    const rad = (angle - 90) * (Math.PI / 180);
    const r = (dist / maxDist) * 80; // max radius 80
    return `${100 + r * Math.cos(rad)},${100 + r * Math.sin(rad)}`;
  };
  
  const idealPoints = categories.map((_, i) => getPoint(i * 60, 100)).join(' ');
  const teamPoints = categories.map((c, i) => getPoint(i * 60, c.pct)).join(' ');

  return (
    <div className="team-dash hide-scrollbars">
      <div className="td-header">
        <div>
          <h2>My Team 🏆</h2>
          <div className="alert-pill amber mt-2">
            {team.hackathon} &middot; Registration closes in {team.daysLeft} days
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Invite Sent!')}>
          Invite Teammate +
        </button>
      </div>

      <Card className="td-radar-card">
        <div className="rc-header">
          <h3>Team Skill Coverage</h3>
          <span className="rc-badge">{team.members.length} / 5 members</span>
        </div>

        <div className="radar-layout">
          <svg viewBox="0 0 200 200" className="radar-svg">
            <polygon points={idealPoints} fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4" />
            <polygon points={teamPoints} fill="rgba(79,53,243,0.15)" stroke="var(--primary)" strokeWidth="2" />
            {categories.map((c, i) => {
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
            {categories.map(c => (
              <div key={c.label} className="bar-row">
                <div className="bar-label">{c.label}</div>
                <div className="bar-wrap">
                  <div className="bar-fill" style={{width: `${c.pct}%`}}></div>
                </div>
                <div className="bar-pct">{c.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="td-grid">
        <div className="td-main">
          <h3 className="mb-4">Team Members</h3>
          <div className="members-grid">
            {team.members.map(m => (
              <Card key={m.id} className="member-card">
                <div className="mc-avatar bg-primary-soft text-primary">{m.initials}</div>
                <h4 className="mc-name">{m.name}</h4>
                <div className="mc-role">{m.role} &middot; {m.college}</div>
                <div className="chip-row center mb-3">
                  {m.skills.slice(0,3).map(s => <SkillChip key={s} label={s} readonly size="small"/>)}
                </div>
                <div className={`mc-status ${m.status.includes('⏳') ? 'amber' : m.status.includes('👑') ? 'primary' : 'green'}`}>
                  {m.status}
                </div>
              </Card>
            ))}
            <Card className="add-member-card" onClick={() => navigate('/discover')}>
              <div className="add-icon">+</div>
              <div>Add Teammate</div>
            </Card>
          </div>
        </div>

        <div className="td-side">
          <Card>
            <h3 className="mb-4">Recent Activity</h3>
            <ul className="activity-feed">
              <li><div className="af-dot bg-primary"></div><div className="af-text">Rahul Singh joined the team <span className="af-time">2h ago</span></div></li>
              <li><div className="af-dot bg-success"></div><div className="af-text">Priya Verma accepted your invite <span className="af-time">5h ago</span></div></li>
              <li><div className="af-dot bg-accent"></div><div className="af-text">You matched with Aryan Modi <span className="af-time">1d ago</span></div></li>
              <li><div className="af-dot bg-ink3"></div><div className="af-text">Team registered for HackFest <span className="af-time">2d ago</span></div></li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
