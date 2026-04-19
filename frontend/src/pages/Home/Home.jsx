import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReveal } from '../../hooks/useReveal';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleScrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="badge-pill">
              <span className="dot pulse-dot"></span>
              Frictionless hackathon team formation
            </div>
            <h1 className="hero-h1">CodeConnect</h1>
            <p className="hero-sub">
              Build a balanced team around real skills, shared project intent, and mutual consent before the hackathon clock starts.
            </p>
            <div className="hero-ctas">
              {user ? (
                <button className="btn btn-primary" onClick={() => navigate('/discover')}>Discover Teammates</button>
              ) : (
                <button className="btn btn-primary" onClick={() => navigate('/signup')}>Create Your Profile</button>
              )}
              <button className="btn btn-ghost" onClick={handleScrollToHowItWorks}>See How It Works</button>
            </div>
            <div className="hero-proof">
              <div><strong>420+</strong><span>builders</span></div>
              <div><strong>67</strong><span>teams formed</span></div>
              <div><strong>0</strong><span>cold DMs</span></div>
            </div>
          </div>

          <div className="hero-product" aria-label="CodeConnect product preview">
            <div className="product-topbar">
              <span></span><span></span><span></span>
              <strong>Live Match Desk</strong>
            </div>
            <div className="match-preview-card">
              <div className="match-score">96% match</div>
              <div className="preview-person">
                <div className="preview-avatar">AR</div>
                <div>
                  <h3>Aarav Rao</h3>
                  <p>Backend engineer · FinTech</p>
                </div>
              </div>
              <div className="preview-tags">
                <span>Node.js</span>
                <span>MongoDB</span>
                <span>APIs</span>
              </div>
              <div className="coverage-panel">
                <div className="coverage-row"><span>Frontend</span><b style={{ width: '78%' }}></b></div>
                <div className="coverage-row"><span>Backend</span><b style={{ width: '96%' }}></b></div>
                <div className="coverage-row"><span>Design</span><b style={{ width: '62%' }}></b></div>
              </div>
            </div>
            <div className="mini-board">
              <div>
                <span className="mini-kicker">Project</span>
                <strong>Campus Carbon Ledger</strong>
              </div>
              <button className="mini-action">Invite</button>
            </div>
          </div>
        </div>

      </section>

      {/* PROBLEM SECTION */}
      <ProblemSection />

      {/* HOW IT WORKS */}
      <HowItWorksSection />

      {/* FEATURES */}
      <FeaturesSection />

      {/* HCI PRINCIPLES */}
      <HciSection />

      {/* TESTIMONIALS & CTA */}
      <TestimonialCtaSection />

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">
          <span style={{ color: 'white' }}>Code</span><span style={{ color: 'var(--accent)' }}>Connect</span>
        </div>
        <p className="tagline">The Frictionless Hackathon Ecosystem</p>
        <div className="footer-links">
          <span>Home</span> &middot; <span>Discover</span> &middot; <span>Projects</span> &middot; <span onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>Admin</span>
        </div>
        <p className="copy">&copy; 2026 CodeConnect HCI Project</p>
      </footer>
    </div>
  );
}

function ProblemSection() {
  const revealRef = useReveal();
  return (
    <section id="problem" className="problem-section" ref={revealRef}>
      <div className="problem-card">
        <div className="section-label" style={{ color: 'var(--accent)' }}>The Problem</div>
        <h2 style={{ color: 'white', margin: '12px 0 40px' }}>Why finding a team is broken</h2>
        <div className="pain-grid">
          <div className="pain-box">
            <div className="pain-icon">01</div>
            <h3>WhatsApp Chaos</h3>
            <p>Endless scrolling to find teammates.</p>
          </div>
          <div className="pain-box">
            <div className="pain-icon">02</div>
            <h3>Cold Outreach</h3>
            <p>Skip the anxiety of DMing strangers.</p>
          </div>
          <div className="pain-box">
            <div className="pain-icon">03</div>
            <h3>Unbalanced Teams</h3>
            <p>Avoid missing crucial roles like backend or design.</p>
          </div>
          <div className="pain-box">
            <div className="pain-icon">04</div>
            <h3>Pure Luck</h3>
            <p>Don't rely on random Discord servers.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const revealRef = useReveal();
  return (
    <section id="how-it-works" className="hiw-section" ref={revealRef}>
      <div className="section-label">Our Process</div>
      <h2 style={{ margin: '12px 0 60px', fontSize: '36px' }}>How CodeConnect Works</h2>

      <div className="steps-container">
        <div className="connector-line"></div>
        <div className="steps-grid">
          <div className="step-col">
            <div className="step-circle">1</div>
            <h4>Profile</h4>
            <p>Tag skills & ideas.</p>
          </div>
          <div className="step-col">
            <div className="step-circle">2</div>
            <h4>Discover</h4>
            <p>Find perfect matches.</p>
          </div>
          <div className="step-col">
            <div className="step-circle">3</div>
            <h4>Connect</h4>
            <p>Guided ice-breakers.</p>
          </div>
          <div className="step-col">
            <div className="step-circle">4</div>
            <h4>Team Up</h4>
            <p>Lock it in.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const revealRef = useReveal();
  const features = [
    { icon: '01', title: 'Swipe Discovery', desc: 'Fast, focused teammate review.' },
    { icon: '02', title: 'Skill Tagging', desc: 'Find the exact role your team lacks.' },
    { icon: '03', title: 'Ice-Breakers', desc: 'Smart prompts remove first-message friction.' },
    { icon: '04', title: 'Balance Meter', desc: 'Visual team coverage before you commit.' },
    { icon: '05', title: 'Project Board', desc: 'Match around shared ideas and needs.' },
    { icon: '06', title: 'Privacy First', desc: 'Chat opens after intentional interest.' },
    { icon: '07', title: 'Open Invites', desc: 'Fill specific roles without chaos.' },
    { icon: '08', title: 'Fast Matches', desc: 'Last-minute team formation without panic.' }
  ];

  return (
    <section className="features-section" ref={revealRef}>
      <div className="section-label">Features</div>
      <h2 style={{ margin: '12px 0 60px', fontSize: '36px' }}>Everything you need</h2>
      <div className="feature-grid">
        {features.map((f, i) => (
          <Card key={i} className="f-card" hoverEffect>
            <div className="f-icon">{f.icon}</div>
            <h4 style={{ margin: '16px 0 8px' }}>{f.title}</h4>
            <p style={{ fontSize: '14px', color: 'var(--ink2)' }}>{f.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HciSection() {
  const revealRef = useReveal();
  return (
    <section className="hci-section" ref={revealRef}>
      <div className="section-label">Research Backed</div>
      <h2 style={{ margin: '12px 0 60px', fontSize: '36px' }}>HCI Principles</h2>
      <div className="hci-grid">
        <div className="hci-card">
          <div className="hci-num" style={{ color: 'var(--primary)' }}>01</div>
          <h4>No Paralysis</h4>
          <p>One card at a time keeps focus.</p>
        </div>
        <div className="hci-card">
          <div className="hci-num" style={{ color: 'var(--accent)' }}>02</div>
          <h4>Mutual Consent</h4>
          <p>No cold DMs. Chat on match.</p>
        </div>
        <div className="hci-card">
          <div className="hci-num" style={{ color: 'var(--warning)' }}>03</div>
          <h4>Simple UI</h4>
          <p>Hide complex stats until needed.</p>
        </div>
        <div className="hci-card">
          <div className="hci-num" style={{ color: 'var(--danger)' }}>04</div>
          <h4>Social Scaffolding</h4>
          <p>Guided chats help introverts connect.</p>
        </div>
      </div>
    </section>
  );
}

function TestimonialCtaSection() {
  const revealRef = useReveal();
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <>
      <section className="test-section" ref={revealRef}>
        <div className="test-grid">
          <Card className="t-card">
            <div className="t-quote-mark">"</div>
            <p className="t-text">CodeConnect found me an amazing group in 10 minutes!</p>
            <div className="t-author">
              <div className="t-avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>NK</div>
              <div className="t-name">Naman K. <br /><span style={{ fontWeight: 'normal', fontSize: '12px', color: 'var(--ink3)' }}>Frontend Dev</span></div>
            </div>
          </Card>
          <Card className="t-card">
            <div className="t-quote-mark">"</div>
            <p className="t-text">Skill tags helped coders realize they needed a designer.</p>
            <div className="t-author">
              <div className="t-avatar" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>SR</div>
              <div className="t-name">Shruti R. <br /><span style={{ fontWeight: 'normal', fontSize: '12px', color: 'var(--ink3)' }}>UI/UX</span></div>
            </div>
          </Card>
          <Card className="t-card">
            <div className="t-quote-mark">"</div>
            <p className="t-text">This app's match system is literally a lifesaver.</p>
            <div className="t-author">
              <div className="t-avatar" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>AM</div>
              <div className="t-name">Aryan M. <br /><span style={{ fontWeight: 'normal', fontSize: '12px', color: 'var(--ink3)' }}>Full Stack</span></div>
            </div>
          </Card>
        </div>
      </section>

      <section className="cta-section" ref={useReveal()}>
        <div className="cta-box">
          <h2 className="cta-h2">Ready to find your squad?</h2>
          <p className="cta-sub">Join 420+ students forming winning teams today.</p>
          <div className="cta-btns">
            {user ? (
              <button className="btn" style={{ background: 'white', color: 'var(--primary)' }} onClick={() => navigate('/discover')}>Discover Teammates</button>
            ) : (
              <button className="btn" style={{ background: 'white', color: 'var(--primary)' }} onClick={() => navigate('/signup')}>Get Started Free</button>
            )}
            <button className="btn btn-ghost" style={{ borderColor: 'white', color: 'white' }} onClick={() => navigate('/discover')}>Browse Profiles</button>
          </div>
          <div className="cta-stats">
            <div className="stat"><span>420+</span> Students</div>
            <div className="stat"><span>12</span> Colleges</div>
            <div className="stat"><span>0</span> Awkward DMs</div>
          </div>
        </div>
      </section>
    </>
  );
}
