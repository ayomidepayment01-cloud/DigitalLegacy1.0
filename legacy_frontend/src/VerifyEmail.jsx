import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import { Shield, ArrowRight, Mail } from './icons';
import { useTheme } from './ThemeContext';

function VerifyEmail() {
  const T = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Get the email from the registration redirect state or fall back to localStorage
  const email = location.state?.email || localStorage.getItem('pendingEmail') || "";

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return toast.error("Please enter the 6-digit code.");

    setLoading(true);
    try {
      await api.post('verify-email/', { email, code });
      toast.success("Account activated! You can now log in.");
      localStorage.removeItem('pendingEmail');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...containerStyle, background: T.bg, color: T.text }}>
      <div style={{ ...cardStyle, background: T.card, border: `1px solid ${T.border}` }}>
        <div style={iconCircle}>
          <Mail size={32} color={T.primary} />
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Verify your email</h2>
        <p style={{ fontSize: '14px', color: T.subText, marginBottom: '24px', textAlign: 'center' }}>
          We sent a 6-digit code to <br /><strong>{email}</strong>
        </p>

        <form onSubmit={handleVerify} style={{ width: '100%' }}>
          <input
            type="text"
            maxLength="6"
            placeholder="0 0 0 0 0 0"
            style={{ ...otpInput, background: T.bg, color: T.text, border: `2px solid ${T.border}` }}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ ...btnStyle, background: T.primary }}
          >
            {loading ? "Verifying..." : "Activate Vault"}
            <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </form>

        <button 
          onClick={() => navigate('/register')}
          style={{ background: 'none', border: 'none', color: T.subText, fontSize: '12px', marginTop: '20px', cursor: 'pointer' }}
        >
          Entered wrong email? Go back
        </button>

        <button
          onClick={async () => {
            if (!email) return toast.error('No email to resend to.');
            try {
              setLoading(true);
              await api.post('resend-verification/', { email });
              toast.success('Verification code resent. Check your email.');
            } catch (err) {
              toast.error(err.response?.data?.error || 'Failed to resend code.');
            } finally { setLoading(false); }
          }}
          style={{ background: 'none', border: 'none', color: T.primary, fontSize: '13px', marginTop: '12px', cursor: 'pointer' }}
        >
          Resend code
        </button>
      </div>
    </div>
  );
}

// STYLES
const containerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' };
const cardStyle = { width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' };
const iconCircle = { width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', marginBottom: '20px' };
const otpInput = { width: '100%', padding: '16px', fontSize: '24px', textAlign: 'center', letterSpacing: '8px', borderRadius: '16px', outline: 'none', marginBottom: '24px', fontWeight: '700' };
const btnStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default VerifyEmail;