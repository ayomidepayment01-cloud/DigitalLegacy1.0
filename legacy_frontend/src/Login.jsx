import React, { useState } from 'react';
import api from './api'; 
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext'; 
import { Shield, Lock, User, ChevronRight, Eye, EyeOff } from './icons';
import toast from 'react-hot-toast';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const navigate = useNavigate();
  const T = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('login/', { username, password });
      if (res.data.require_2fa) {
        setShow2FA(true);
      } else {
        toast.success('Successfully unlocked vault');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials. Please try again.');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (code.length < 6) return toast.error('Enter the 6-digit code');
    setCodeLoading(true);
    try {
      await api.post('verify-2fa-login/', { username, code });
      toast.success('Successfully verified 2FA');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid 2FA code. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div style={{...rootStyle}}>
      <div className="ambient-glow" style={{ top: '10%', left: '30%', width: '800px', height: '800px' }}></div>
      <style>{`
        input::placeholder { color: var(--sub-text); opacity: 0.6; }
        .ambient-glow {
          position: absolute;
          background: radial-gradient(circle, var(--primary-bg) 0%, transparent 60%);
          z-index: -1;
          pointer-events: none;
        }
      `}</style>

      <div className="glass-panel animate-in" style={{ ...cardStyle }}>
        {show2FA ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Shield size={40} color="var(--primary)" style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-h)' }}>Two-Factor Security</h2>
              <p style={{ color: 'var(--sub-text)', fontSize: '14px' }}>Enter the verification code from your authenticator app</p>
            </div>

            <form onSubmit={handleVerify2FA}>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: 'var(--sub-text)'}}>Verification Code</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{...iconStyle, color: 'var(--sub-text)'}} />
                  <input 
                    type="text" 
                    maxLength={6}
                    className="input-premium"
                    style={{
                        ...inputStyle, 
                        textAlign: 'center',
                        fontSize: '20px',
                        letterSpacing: '6px',
                        paddingLeft: '12px'
                    }} 
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={codeLoading}
                className="btn-primary"
                style={btnStyle}
              >
                {codeLoading ? 'Verifying...' : 'Unlock Vault'} <ChevronRight size={18} />
              </button>
            </form>

            <button 
              onClick={() => { setShow2FA(false); setCode(''); }} 
              style={{ marginTop: '20px', width: '100%', background: 'none', border: 'none', color: 'var(--sub-text)', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'color 0.3s ease' }}
              onMouseOver={(e) => e.target.style.color = 'var(--text)'}
              onMouseOut={(e) => e.target.style.color = 'var(--sub-text)'}
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Shield size={40} color="var(--primary)" style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-h)' }}>Identity Verification</h2>
              <p style={{ color: 'var(--sub-text)', fontSize: '14px' }}>Access your secure digital legacy</p>
            </div>

            <form onSubmit={handleLogin}>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: 'var(--sub-text)'}}>Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{...iconStyle, color: 'var(--sub-text)'}} />
                  <input 
                    type="text" 
                    className="input-premium"
                    style={{...inputStyle}} 
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={inputGroup}>
                <label style={{...labelStyle, color: 'var(--sub-text)'}}>Master Key (Password)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{...iconStyle, color: 'var(--sub-text)'}} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-premium"
                    style={{
                        ...inputStyle, 
                        paddingRight: '40px'
                    }} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? 
                      <EyeOff size={18} color="var(--sub-text)" /> : 
                      <Eye size={18} color="var(--sub-text)" />
                    }
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary"
                style={{...btnStyle, marginTop: '24px'}}
              >
                Unlock Vault <ChevronRight size={18} />
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--sub-text)' }}>
              New Guardian? <span onClick={() => navigate('/register')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '700' }}>Register here</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── STYLES ──
const rootStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' };
const cardStyle = { width: '100%', maxWidth: '420px', padding: 'clamp(32px, 6vw, 48px)', margin: '20px', borderRadius: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)', boxSizing: 'border-box' };
const inputGroup = { marginBottom: '20px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box', fontSize: '15px' };
const iconStyle = { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' };
const btnStyle = { width: '100%', padding: '16px', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px' };

export default Login;