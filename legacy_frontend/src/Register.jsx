import React, { useState } from 'react';
import api from './api'; 
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext'; 
import { Shield, Mail, User, Lock, ChevronRight, Eye, EyeOff } from './icons';

function Register() {
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const T = useTheme();

  // Calculate password strength
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (!pwd) return { score: 0, label: '', color: T.danger || '#ef4444' };
    
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    
    const levels = [
      { score: 0, label: '', color: '#d1d5db' },
      { score: 1, label: 'Weak', color: '#ef4444' },
      { score: 2, label: 'Fair', color: '#f97316' },
      { score: 3, label: 'Good', color: '#eab308' },
      { score: 4, label: 'Strong', color: '#10b981' },
      { score: 5, label: 'Very Strong', color: '#0ea5e9' },
      { score: 6, label: 'Excellent', color: '#06b6d4' }
    ];
    
    return levels[Math.min(strength, 6)];
  };

  const passwordStrength = calculatePasswordStrength(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password !== '';
  const passwordsMatchError = formData.confirmPassword && formData.password !== formData.confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }

    try {
      // 1. Send registration request to backend
      const response = await api.post('register/', formData);
      
      // 2. Show success message (e.g., "Check your email for the code")
      alert(response.data.message);
      // 3. Persist pending email and move to the verification page
      localStorage.setItem('pendingEmail', formData.email);
      navigate('/verify', { state: { email: formData.email } });
      
    } catch (err) {
      // 4. Show the specific error (503 Timeout, 400 Duplicate, etc.)
      const status = err.response?.status;
      const errorData = err.response?.data || {};

      // If backend signals a pending registration, route user to verification page
      if (status === 409 && errorData.email) {
        alert("A pending registration exists. Please check your email for the verification code.");
        navigate('/verify', { state: { email: errorData.email } });
        return;
      }

      const errorMessage = errorData.error || "Registration failed. Please check your network.";
      alert(errorMessage);
    }
  };

  return (
    <div style={{...rootStyle, background: T.bg, color: T.text}}>
      <style>{`
        * { transition: background 0.4s ease, color 0.4s ease, border 0.4s ease; }
        input::placeholder { color: ${T.subText}; opacity: 0.5; }
      `}</style>

      <div style={{
        ...cardStyle, 
        background: T.card, 
        border: `1px solid ${T.border}`, 
        boxShadow: T.isDark ? 'none' : '0 10px 25px -5px rgba(0,0,0,0.05)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Shield size={40} color={T.primary} style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Create Vault</h2>
          <p style={{ color: T.subText, fontSize: '14px' }}>Start your digital legacy today</p>
        </div>

        <form onSubmit={handleRegister}>
          <div style={inputGroup}>
            <label style={{...labelStyle, color: T.subText}}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{...iconStyle, color: T.subText}} />
              <input 
                type="text" 
                style={{...inputStyle, background: T.bg, border: `1px solid ${T.border}`, color: T.text}} 
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={inputGroup}>
            <label style={{...labelStyle, color: T.subText}}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{...iconStyle, color: T.subText}} />
              <input 
                type="email" 
                style={{...inputStyle, background: T.bg, border: `1px solid ${T.border}`, color: T.text}} 
                placeholder="yourname@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                style={{...inputStyle, background: T.bg, border: `1px solid ${T.border}`, color: T.text, paddingRight: '40px'}} 
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
            
            {/* Password Strength Gauge */}
            {formData.password && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: T.subText, fontWeight: '600' }}>Password Strength</span>
                  <span style={{ fontSize: '12px', color: passwordStrength.color, fontWeight: '700' }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  height: '4px'
                }}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        borderRadius: '2px',
                        background: i < passwordStrength.score ? passwordStrength.color : '#e5e7eb',
                        transition: 'background 0.3s ease'
                      }}
                    />
                  ))}
                </div>
                <ul style={{
                  fontSize: '11px',
                  color: T.subText,
                  marginTop: '8px',
                  paddingLeft: '16px',
                  margin: '8px 0 0 0'
                }}>
                  <li style={{ opacity: formData.password.length >= 8 ? 1 : 0.4 }}>At least 8 characters</li>
                  <li style={{ opacity: /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? 1 : 0.4 }}>Mix of uppercase and lowercase</li>
                  <li style={{ opacity: /[0-9]/.test(formData.password) ? 1 : 0.4 }}>Includes numbers</li>
                  <li style={{ opacity: /[!@#$%^&*]/.test(formData.password) ? 1 : 0.4 }}>Includes special characters (!@#$%^&*)</li>
                </ul>
              </div>
            )}
          </div>

          <div style={inputGroup}>
            <label style={{...labelStyle, color: T.subText}}>Confirm Master Key</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{...iconStyle, color: T.subText}} />
              <input 
                type={showConfirm ? "text" : "password"} 
                style={{
                  ...inputStyle, 
                  background: T.bg, 
                  border: `2px solid ${
                    passwordsMatch ? '#10b981' : 
                    passwordsMatchError ? '#ef4444' : 
                    T.border
                  }`, 
                  color: T.text,
                  paddingRight: '40px'
                }} 
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
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
                {showConfirm ? 
                  <EyeOff size={18} color={T.subText} /> : 
                  <Eye size={18} color={T.subText} />
                }
              </button>
            </div>
            
            {/* Password Match Status */}
            {formData.confirmPassword && (
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: passwordsMatch ? '#10b981' : '#ef4444',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={!passwordsMatch}
            style={{
              ...btnStyle, 
              background: passwordsMatch ? T.primary : '#d1d5db',
              opacity: passwordsMatch ? 1 : 0.6,
              cursor: passwordsMatch ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
          >
            Initialize Vault <ChevronRight size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: T.subText }}>
          Already have a vault? <span onClick={() => navigate('/login')} style={{ color: T.primary, cursor: 'pointer', fontWeight: '700' }}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

// ── STYLES ──
const rootStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cardStyle = { width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '24px', transition: '0.4s', maxHeight: '90vh', overflowY: 'auto' };
const inputGroup = { marginBottom: '20px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box', fontSize: '14px' };
const iconStyle = { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' };
const btnStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px', fontSize: '15px' };

export default Register;