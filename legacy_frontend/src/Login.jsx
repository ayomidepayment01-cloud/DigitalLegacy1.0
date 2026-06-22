import React, { useState } from 'react';
import api from './api'; // FIXED: Changed ../ to ./
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext'; // FIXED: Changed ../ to ./
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
    <div style={{...rootStyle, background: T.bg, color: T.text}}>
      {/* Dynamic transition for smooth theme swapping */}
      <style>{`
        * { transition: background 0.4s ease, color 0.4s ease, border 0.4s ease; }
        input::placeholder { color: ${T.subText}; opacity: 0.6; }
      `}</style>

      <div style={{
        ...cardStyle, 
        background: T.card, 
        border: `1px solid ${T.border}`, 
        boxShadow: T.shadow
      }}>
        {show2FA ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Shield size={40} color={T.primary} style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Two-Factor Security</h2>
              <p style={{ color: T.subText, fontSize: '14px' }}>Enter the verification code from your authenticator app</p>
            </div>

            <form onSubmit={handleVerify2FA}>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: T.subText}}>Verification Code</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{...iconStyle, color: T.subText}} />
                  <input 
                    type="text" 
                    maxLength={6}
                    style={{
                        ...inputStyle, 
                        background: T.bg, 
                        border: `1px solid ${T.border}`, 
                        color: T.text,
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
                style={{...btnStyle, background: T.primary}}
                className="btn-hover"
              >
                {codeLoading ? 'Verifying...' : 'Unlock Vault'} <ChevronRight size={18} />
              </button>
            </form>

            <button 
              onClick={() => { setShow2FA(false); setCode(''); }} 
              style={{ marginTop: '20px', width: '100%', background: 'none', border: 'none', color: T.subText, cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Shield size={40} color={T.primary} style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Identity Verification</h2>
              <p style={{ color: T.subText, fontSize: '14px' }}>Access your secure digital legacy</p>
            </div>

            <form onSubmit={handleLogin}>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: T.subText}}>Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{...iconStyle, color: T.subText}} />
                  <input 
                    type="text" 
                    style={{
                        ...inputStyle, 
                        background: T.bg, 
                        border: `1px solid ${T.border}`, 
                        color: T.text
                    }} 
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={inputGroup}>
                <label style={{...labelStyle, color: T.subText}}>Master Key (Password)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{...iconStyle, color: T.subText}} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    style={{
                        ...inputStyle, 
                        background: T.bg, 
                        border: `1px solid ${T.border}`, 
                        color: T.text,
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
                      <EyeOff size={18} color={T.subText} /> : 
                      <Eye size={18} color={T.subText} />
                    }
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                style={{...btnStyle, background: T.primary}}
                className="btn-hover"
              >
                Unlock Vault <ChevronRight size={18} />
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: T.subText }}>
              New Guardian? <span onClick={() => navigate('/register')} style={{ color: T.primary, cursor: 'pointer', fontWeight: '700' }}>Register here</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── STYLES ──
const rootStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cardStyle = { width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '24px', transition: '0.4s' };
const inputGroup = { marginBottom: '20px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box', fontSize: '14px' };
const iconStyle = { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' };
const btnStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px', fontSize: '15px' };

export default Login;