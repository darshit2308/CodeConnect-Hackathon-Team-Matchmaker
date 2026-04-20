import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [terms, setTerms] = useState(false);
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, sendOtp, verifyOtpAndSignup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  // Password strength logic
  const getStrength = (pw) => {
    if (pw.length === 0) return { width: '0%', bg: 'var(--border2)' };
    if (pw.length < 5) return { width: '33%', bg: 'var(--danger)' };
    if (pw.length < 8) return { width: '66%', bg: 'var(--warning)' };
    return { width: '100%', bg: 'var(--success)' };
  };

  const handleSignupStage1 = async (e) => {
    e.preventDefault();
    if (!terms) return;
    setIsLoading(true);
    try {
      const res = await sendOtp(email);
      if (res.testOtp) {
        setOtp(res.testOtp);
        showToast('TEST MODE: Automatically filled OTP for you!', 'success');
      } else {
        showToast('OTP sent to your email!');
      }
      setStep(1);
    } catch {
      showToast('Error sending OTP. Email may be taken.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verifyOtpAndSignup(firstName, lastName, email, password, otp);
      showToast('Account created!');
      navigate('/profile-setup');
    } catch {
      showToast('Invalid OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.isNewUser) {
        navigate('/profile-setup');
      } else {
        showToast('Welcome back!');
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
        <div className="auth-left auth-left-signup hide-mobile">
          <div className="auth-left-content">
            <h2 className="auth-logo"><span style={{ color: 'white' }}>Code</span><span style={{ color: 'var(--accent)' }}>Connect</span></h2>
            <div>
              <h3 className="auth-quote">"Find the missing puzzle piece for your hackathon."</h3>
              <div className="auth-float-icons">
                <div className="auth-float-icon">Pitch</div>
                <div className="auth-float-icon">Build</div>
                <div className="auth-float-icon">Match</div>
                <div className="auth-float-icon">Ship</div>
                <div className="auth-float-icon">Win</div>
              </div>
            </div>
            <div>
              <div className="auth-stats">
                <div className="auth-stat">
                  <div className="auth-stat-num">234</div>
                  <div className="auth-stat-label">Matches</div>
                </div>
                <div className="auth-stat">
                  <div className="auth-stat-num">0</div>
                  <div className="auth-stat-label">Awkward DMs</div>
                </div>
                <div className="auth-stat">
                  <div className="auth-stat-num">128</div>
                  <div className="auth-stat-label">Projects</div>
                </div>
              </div>
              <div className="auth-avatars">
                <div className="avatar-stack">SG</div>
                <div className="avatar-stack">AM</div>
                <div className="avatar-stack">NK</div>
                <div className="avatar-stack" style={{background:'rgba(255,255,255,0.3)',color:'white'}}>+8</div>
                <div style={{marginLeft:'12px', fontSize:'13px', opacity:0.8}}>Just joined today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <div className="auth-form-card" style={{ maxWidth: '480px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Join CodeConnect</h2>
            <p style={{ color: 'var(--ink2)', marginBottom: '32px' }}>Create an account to get started.</p>

            {step === 0 ? (
              <form onSubmit={handleSignupStage1}>
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  </div>
                  <div className="form-group flex-1">
                    <label>Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                </div>


                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                  <div className="strength-bar-bg">
                    <div className="strength-bar-fill" style={{ width: getStrength(password).width, background: getStrength(password).bg }}></div>
                  </div>
                </div>

                <div className="terms-row">
                  <input type="checkbox" id="terms" checked={terms} onChange={e => setTerms(e.target.checked)} />
                  <label htmlFor="terms">I agree to the Terms of Service and Privacy Policy</label>
                </div>

                <button type="submit" className="btn btn-primary submit-btn" disabled={!terms || isLoading} style={{ opacity: (!terms || isLoading) ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {isLoading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Sending OTP...
                    </>
                  ) : (
                    'Get OTP via Email'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label>Enter 6-digit OTP sent to {email}</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '24px' }} />
                </div>

                <button type="submit" className="btn btn-primary submit-btn" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {isLoading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
                <button type="button" className="btn btn-ghost w-100" style={{ marginTop: '8px' }} onClick={() => setStep(0)}>
                  &larr; Back
                </button>
              </form>
            )}

            <p className="auth-bottom">
              Already have an account? <span onClick={() => navigate('/login')}>Log in</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
