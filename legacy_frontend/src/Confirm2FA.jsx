import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import { useTheme } from './ThemeContext';

function Confirm2FA() {
  const T = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const secret = location.state?.secret || localStorage.getItem('pending2faSecret');

  // If there's no secret, show friendly guidance instead of a blank page
  if (!secret) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background: T.bg, color: T.text }}>
        <div style={{ width:360, padding:28, borderRadius:16, background: T.card, border: `1px solid ${T.border}`, textAlign:'center' }}>
          <h2 style={{ marginBottom:8 }}>No 2FA setup found</h2>
          <p style={{ color: T.subText }}>We couldn't find a pending 2FA secret. Please visit the enable 2FA page to generate a new secret.</p>
          <div style={{ display:'flex', gap:10, marginTop:18, justifyContent:'center' }}>
            <button onClick={() => navigate('/enable-2fa')} style={{ padding:'10px 14px', borderRadius:10, border:'none', background:T.primary, color:'#fff', cursor:'pointer' }}>Go to Enable 2FA</button>
            <button onClick={() => navigate('/dashboard')} style={{ padding:'10px 14px', borderRadius:10, border:`1px solid ${T.border}`, background:'transparent', color:T.text, cursor:'pointer' }}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (code.length < 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    try {
      await api.post('confirm-2fa/', { code });
      toast.success('2FA enabled on your account');
      localStorage.removeItem('pending2faSecret');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm 2FA');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background: T.bg, color: T.text }}>
      <div style={{ width:360, padding:28, borderRadius:16, background: T.card, border: `1px solid ${T.border}`, textAlign:'center' }}>
        <h2 style={{ marginBottom:8 }}>Confirm Two-Factor</h2>
        <p style={{ color: T.subText }}>Enter the 6-digit code from your authenticator app for <strong>{secret || 'your account'}</strong></p>

        <form onSubmit={handleConfirm}>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            style={{ width:'100%', padding:12, borderRadius:8, border:`1px solid ${T.border}`, marginTop:12, textAlign:'center', fontSize:20, letterSpacing:6, background:T.bg, color:T.text }}
          />

          <button disabled={loading} style={{ marginTop:18, width:'100%', padding:12, borderRadius:10, border:'none', background:T.primary, color:'#fff', cursor:'pointer' }}>
            {loading ? 'Confirming...' : 'Confirm and Enable 2FA'}
          </button>
        </form>

        <button onClick={() => navigate('/dashboard')} style={{ marginTop:12, background:'none', border:'none', color:T.subText, cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

export default Confirm2FA;
