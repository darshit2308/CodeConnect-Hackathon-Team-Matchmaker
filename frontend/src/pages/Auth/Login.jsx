import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorField, setErrorField] = useState(null);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) { setErrorField('email'); return; }
    if (!password) { setErrorField('password'); return; }

    try {
      await login(email, password);
      showToast('Welcome back!');
      navigate('/discover');
    } catch {
      showToast('Invalid credentials', 'error');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await googleLogin(credentialResponse.credential);
        showToast('Signed in with Google!');
      if (result.isNewUser) {
        navigate('/profile-setup');
      } else {
        navigate('/discover');
      }
    } catch {
      showToast('Error signing in with Google', 'error');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        {/* Left Panel */}
        <div className="auth-left hide-mobile">
          <div className="auth-left-content">
            <h2 className="auth-logo"><span style={{color:'white'}}>Code</span><span style={{color:'var(--accent)'}}>Connect</span></h2>
            <div>
              <h3 className="auth-quote">"The right teammate can turn a good idea into a winning project."</h3>
              <div className="auth-float-icons">
                <div className="auth-float-icon">React</div>
                <div className="auth-float-icon">Python</div>
                <div className="auth-float-icon">Figma</div>
                <div className="auth-float-icon">Cloud</div>
                <div className="auth-float-icon">AI</div>
              </div>
            </div>
            <div>
              <div className="auth-stats">
                <div className="auth-stat">
                  <div className="auth-stat-num">420+</div>
                  <div className="auth-stat-label">Students</div>
                </div>
                <div className="auth-stat">
                  <div className="auth-stat-num">12</div>
                  <div className="auth-stat-label">Colleges</div>
                </div>
                <div className="auth-stat">
                  <div className="auth-stat-num">67</div>
                  <div className="auth-stat-label">Teams</div>
                </div>
              </div>
              <div className="auth-avatars">
                <div className="avatar-stack">AK</div>
                <div className="avatar-stack">RS</div>
                <div className="avatar-stack">PV</div>
                <div className="avatar-stack" style={{background:'rgba(255,255,255,0.3)',color:'white'}}>+12</div>
                <div style={{marginLeft:'12px', fontSize:'13px', opacity:0.8}}>Recent sign-ups</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <div className="auth-form-card">
            <h2 style={{fontSize:'28px', marginBottom:'8px'}}>Welcome back</h2>
            <p style={{color:'var(--ink2)', marginBottom:'32px'}}>Sign in to find your hackathon team.</p>

            <div style={{display:'flex', justifyContent:'center', marginBottom: '12px'}}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => showToast('Login Failed', 'error')}
                theme="outline"
                size="large"
                shape="rectangular"
              />
            </div>

            <div className="auth-divider">
              <span className="line"></span>
              <span className="text">or</span>
              <span className="line"></span>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  className={errorField === 'email' ? 'error-input shake' : ''}
                  value={email} onChange={e => {setEmail(e.target.value); setErrorField(null);}} 
                />
                {errorField === 'email' && <span className="error-msg">Email is required</span>}
              </div>

              <div className="form-group">
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <label>Password</label>
                  <span className="forgot-link">Forgot password?</span>
                </div>
                <div className="pw-input-wrap">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={errorField === 'password' ? 'error-input shake' : ''}
                    value={password} onChange={e => {setPassword(e.target.value); setErrorField(null);}} 
                  />
                  <span className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </div>
                {errorField === 'password' && <span className="error-msg">Password is required</span>}
              </div>

              <button type="submit" className="btn btn-primary submit-btn">Sign In</button>
            </form>

            <p className="auth-bottom">
              Don't have an account? <span onClick={() => navigate('/signup')}>Sign up</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
