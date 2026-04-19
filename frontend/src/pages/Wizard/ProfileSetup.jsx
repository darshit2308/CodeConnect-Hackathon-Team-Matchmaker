import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';
import SkillChip from '../../components/SkillChip';
import './Wizard.css';

const SKILL_GROUPS = {
  Frontend: ['React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'HTML/CSS', 'Tailwind'],
  Backend: ['Node.js', 'Express', 'Django', 'FastAPI', 'Spring Boot', 'Laravel', 'Go'],
  Mobile: ['Flutter', 'React Native', 'Swift', 'Kotlin'],
  Database: ['MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'Redis'],
  'AI/ML': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'OpenCV'],
  Design: ['Figma', 'Adobe XD', 'Illustrator', 'Canva'],
  DevOps: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'CI/CD', 'Linux']
};

export default function ProfileSetup() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const showToast = useToast();
  const fileInputRef = useRef(null);

  // Step 1: Basic
  const [avatarPreview, setAvatarPreview] = useState(null);
  const userName = user ? user.name : '';
  const userInitials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  const [name, setName] = useState(userName || '');
  const [college, setCollege] = useState('');
  
  // Step 2: Skills
  const [primaryRole, setPrimaryRole] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  
  // Step 3: Idea
  const [hasIdea, setHasIdea] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaProblem, setIdeaProblem] = useState('');
  
  // Step 4: Prefs
  const [lookingFor, setLookingFor] = useState([]);
  const [teamSize, setTeamSize] = useState('');
  const [previousProjects, setPreviousProjects] = useState('');
  
  const toggleSkill = (skill, list, setList) => {
    if(list.includes(skill)) setList(list.filter(s => s !== skill));
    else setList([...list, skill]);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const finishWizard = async () => {
    try {
      await API.post('/auth/profile-setup', {
        name,
        college,
        primaryRole,
        selectedSkills,
        ideaTitle,
        ideaProblem,
        lookingFor,
        teamSize,
        previousProjects
      });
      if (user?.name !== name && name.trim()) {
        setUser({ ...user, name: name.trim() });
      }
      showToast("Profile live! You're now discoverable", 'success');
      navigate('/profile');
    } catch {
      showToast('Could not save profile setup', 'error');
    }
  };

  return (
    <div className="wizard-page">
      <div className="wizard-container">
        {/* Stepper */}
        <div className="stepper">
          {[1,2,3,4].map(num => (
            <div key={num} className="step-wrapper">
              <div className={`step-circle ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                {step > num ? '✓' : num}
              </div>
              <div className="step-label">
                {num === 1 && 'Basic Info'}
                {num === 2 && 'Your Skills'}
                {num === 3 && 'Your Idea'}
                {num === 4 && 'Preferences'}
              </div>
              {num < 4 && <div className={`step-line ${step > num ? 'filled' : ''}`}></div>}
            </div>
          ))}
        </div>

        {/* Form Area */}
        <div className="wizard-form-card">
          {step === 1 && (
            <div className="step-content">
              <h2>Basic Info</h2>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} style={{display:'none'}} />
              <div className="avatar-upload-area" onClick={handleAvatarClick}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="avatar-img-preview" />
                ) : (
                  <div className="avatar-preview">{userInitials}</div>
                )}
                <div style={{color:'var(--ink3)', marginTop:'4px'}}>📸 Upload Photo</div>
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>College / University</label>
                <input value={college} onChange={e=>setCollege(e.target.value)} placeholder="e.g. IIT Delhi" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h2>Your Skills</h2>
              <p className="wiz-sub">What's your primary role?</p>
              <div className="role-grid">
                {['Frontend Dev', 'Backend Dev', 'UI/UX Designer', 'ML / AI Engineer', 'DevOps', 'Full Stack'].map(role => (
                  <div key={role} 
                       className={`role-pill ${primaryRole === role ? 'active' : ''}`}
                       onClick={() => setPrimaryRole(role)}>
                    {role}
                  </div>
                ))}
              </div>

              <p className="wiz-sub" style={{marginTop:'32px'}}>Your tech stack <span style={{fontWeight:'normal',color:'var(--ink3)'}}>(select all that apply)</span></p>
              <input 
                type="text" 
                placeholder="Search skills..." 
                value={skillSearch} 
                onChange={e=>setSkillSearch(e.target.value)}
                style={{marginBottom:'16px'}}
              />
              <div className="skills-selector">
                {Object.entries(SKILL_GROUPS).map(([group, skills]) => {
                  const filtered = skills.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()));
                  if(filtered.length === 0) return null;
                  return (
                    <div key={group} className="skill-group">
                      <div className="skill-group-label">{group}</div>
                      <div className="skill-chips-row">
                        {filtered.map(s => (
                          <SkillChip 
                            key={s} 
                            label={s} 
                            selected={selectedSkills.includes(s)} 
                            onClick={() => toggleSkill(s, selectedSkills, setSelectedSkills)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:'12px', fontSize:'13px', color:'var(--primary)', fontWeight:'600'}}>
                {selectedSkills.length} skills selected
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h2>Your Idea</h2>
              <p className="wiz-sub">Do you have a hackathon idea?</p>
              <div className="idea-toggles">
                <button className={`btn ${hasIdea ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHasIdea(true)} style={{flex:1}}>
                  Yes, I have an idea! 💡
                </button>
                <button className={`btn ${!hasIdea ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setHasIdea(false)} style={{flex:1}}>
                  No, I'm open 🤝
                </button>
              </div>

              <div className={`idea-details-reveal ${hasIdea ? 'open' : ''}`}>
                <div style={{paddingTop:'24px'}}>
                  <div className="form-group">
                    <label>Idea Title</label>
                    <input value={ideaTitle} onChange={e=>setIdeaTitle(e.target.value)} placeholder="e.g. AI Study Planner" />
                  </div>
                  <div className="form-group">
                    <label>Problem Statement</label>
                    <textarea 
                      rows="3" 
                      value={ideaProblem} 
                      onChange={e=>setIdeaProblem(e.target.value)}
                      placeholder="What problem are you solving?"
                    ></textarea>
                    <div className="char-count">{ideaProblem.length} / 300</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-content">
              <h2>Preferences</h2>
              <p className="wiz-sub">I'm looking for teammates who have:</p>
              <div className="skill-chips-row" style={{marginBottom:'24px'}}>
                {['Frontend Dev', 'Backend Dev', 'UI/UX Designer', 'Mobile Dev', 'AI/ML'].map(s => (
                  <SkillChip 
                    key={s} label={s} 
                    selected={lookingFor.includes(s)} 
                    onClick={() => toggleSkill(s, lookingFor, setLookingFor)}
                  />
                ))}
              </div>

              <p className="wiz-sub">Team size preference:</p>
              <div className="role-grid" style={{marginBottom:'24px'}}>
                {['No Preference', 'Solo \u2192 Team', '2 people', '3 people', '4-5 people'].map(s => (
                  <div key={s} className={`role-pill ${teamSize===s ? 'active' : ''}`} onClick={()=>setTeamSize(s)}>{s}</div>
                ))}
              </div>

              <div className="form-group">
                <label>Previous Projects (comma separated)</label>
                <textarea
                  rows="3"
                  value={previousProjects}
                  onChange={(e) => setPreviousProjects(e.target.value)}
                  placeholder="Eg. Smart Canteen App, AR Campus Navigator"
                ></textarea>
              </div>

            </div>
          )}

          {/* Nav Buttons */}
          <div className="wizard-nav-btns mt-8 border-t pt-6" style={{marginTop:'32px', borderTop:'1px solid var(--border2)', paddingTop:'24px', display:'flex', justifyContent:'space-between'}}>
            {step > 1 ? (
              <button className="btn btn-ghost" onClick={() => setStep(step-1)}>&larr; Back</button>
            ) : <div></div>}
            
            {step < 4 ? (
              <button className="btn btn-primary" onClick={() => setStep(step+1)}>Next &rarr;</button>
            ) : (
              <button className="btn btn-primary" onClick={finishWizard}>Finish 🚀</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
