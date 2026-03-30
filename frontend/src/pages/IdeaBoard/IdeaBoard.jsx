import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import Card from '../../components/Card';
import SkillChip from '../../components/SkillChip';
import { useToast } from '../../context/ToastContext';
import './IdeaBoard.css';

const DOMAINS = ['All', 'EdTech', 'HealthTech', 'FinTech', 'GreenTech', 'Social Good', 'AR/VR', 'Gaming', 'Open Domain'];

export default function IdeaBoard() {
  const [ideas, setIdeas] = useState([]);
  const [activeDomain, setActiveDomain] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    API.get('/ideas').then(res => setIdeas(res.data)).catch(console.error);
  }, []);

  const handleToggleLike = (id) => {
    setIdeas(ideas.map(idea => {
      if(idea.id === id) {
        return { ...idea, liked: !idea.liked, likes: idea.liked ? idea.likes - 1 : idea.likes + 1 };
      }
      return idea;
    }));
  };

  const filteredIdeas = ideas.filter(idea => 
    (activeDomain === 'All' || idea.domain === activeDomain) &&
    idea.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ib-page hide-scrollbars">
      <div className="ib-container">
        <div className="ib-header">
          <div>
            <h2>💡 Idea Board</h2>
            <p className="ib-sub">Browse hackathon concepts, find one you love, or share your own</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Your Idea</button>
        </div>

        <div className="ib-filter-bar">
          <div className="chip-scroll-row">
            {DOMAINS.map(d => (
              <div 
                key={d} 
                className={`domain-chip ${activeDomain === d ? 'active' : ''}`}
                onClick={() => setActiveDomain(d)}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="ib-filter-right">
            <select className="ib-sort"><option>Newest</option><option>Most Liked</option></select>
            <input type="search" placeholder="Search ideas..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        <div className="ib-grid">
          {filteredIdeas.map(idea => (
            <Card key={idea.id} hoverEffect noPadding className="idea-card">
              <div className="ic-top-strip" data-domain={idea.domain}></div>
              <div className="ic-body">
                <div className="ic-meta-row">
                  <span className="ic-domain">{idea.domain}</span>
                  <span className={`ic-timer ${idea.closesIn < 3 ? 'danger' : idea.closesIn < 7 ? 'amber' : 'green'}`}>
                    ⏱ Closes in {idea.closesIn} days
                  </span>
                </div>
                <h3 className="ic-title">{idea.title}</h3>
                <p className="ic-desc">{idea.problem} {idea.solution}</p>
                <div className="ic-skills">
                  <span className="ic-s-label">Needs:</span>
                  <div className="chip-row">
                    {idea.skillsNeeded.slice(0,3).map(s => <SkillChip key={s} label={s} readonly size="small" />)}
                    {idea.skillsNeeded.length > 3 && <span className="ic-more">+{idea.skillsNeeded.length - 3}</span>}
                  </div>
                </div>
                <div className="ic-divider"></div>
                <div className="ic-footer">
                  <div className="ic-poster">
                    <div className="ic-av">{idea.poster.avatar}</div>
                    <div className="ic-p-info">
                      <div className="ic-p-name">{idea.poster.name}</div>
                      <div className="ic-p-time">{idea.poster.daysAgo === 0 ? 'Today' : `${idea.poster.daysAgo}d ago`}</div>
                    </div>
                  </div>
                  <div className="ic-actions">
                    <button className={`icon-btn like-btn ${idea.liked ? 'liked' : ''}`} onClick={() => handleToggleLike(idea.id)}>
                      {idea.liked ? '♥' : '♡'} {idea.likes}
                    </button>
                    <button className="btn btn-primary small-btn" onClick={() => navigate('/chat')}>Join Team &rarr;</button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {filteredIdeas.length === 0 && <div style={{padding:'40px', textAlign:'center', color:'var(--ink3)'}}>No ideas found matching your filter.</div>}
        </div>
      </div>

      {showModal && <PostIdeaModal onClose={() => setShowModal(false)} onPost={(newIdea) => {
        setIdeas([newIdea, ...ideas]);
        setShowModal(false);
        showToast("Idea posted! Others can now join you 🎉", 'success');
      }} />}
    </div>
  );
}

function PostIdeaModal({ onClose, onPost }) {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('EdTech');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [skills, setSkills] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { title, domain, problem, solution, skillsNeeded: skills.split(',').map(s=>s.trim()).filter(Boolean) };
    const res = await API.post('/ideas', payload);
    onPost(res.data.idea);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h2 style={{fontSize:'28px', marginBottom:'24px'}}>Share Your Idea 💡</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Idea Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Domain</label>
            <select value={domain} onChange={e=>setDomain(e.target.value)}>
              {DOMAINS.filter(d=>d!=='All').map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Problem Statement</label>
            <textarea rows="2" value={problem} onChange={e=>setProblem(e.target.value)} required></textarea>
            <div className="char-count">{problem.length} / 300</div>
          </div>
          <div className="form-group">
            <label>Solution</label>
            <textarea rows="2" value={solution} onChange={e=>setSolution(e.target.value)} required></textarea>
          </div>
          <div className="form-group">
            <label>Skills Needed (comma separated)</label>
            <input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="e.g. Frontend Dev, UI/UX" required />
          </div>
          <div style={{display:'flex', gap:'12px', marginTop:'32px'}}>
            <button type="button" className="btn btn-ghost" style={{flex:1}} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{flex:1}}>Post Idea &rarr;</button>
          </div>
        </form>
      </div>
    </div>
  );
}
