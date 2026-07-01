import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import { useTheme } from './ThemeContext';

function Enable2FA() {
  const T = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchSecret() {
      try {
        const res = await api.post('enable-2fa/');
        if (!mounted) return;
        setSecret(res.data.secret || '');
        setUri(res.data.uri || '');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to generate 2FA secret. Make sure you are logged in.');
        navigate('/login');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSecret();
    return () => { mounted = false; };
  }, [navigate]);

  const handleProceed = () => {
    if (!secret) return toast.error('No secret available');
    localStorage.setItem('pending2faSecret', secret);
    navigate('/confirm-2fa', { state: { secret } });
  };

  const qrSrc = uri ? `https://chart.googleapis.com/chart?cht=qr&chs=260x260&chl=${encodeURIComponent(uri)}` : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: T.bg, color: T.text }}>
      <div className="glass-panel" style={{ width: 360, padding: 32, textAlign: 'center', margin: 'auto' }}>
        <h2 style={{ marginBottom: 8 }}>Enable Two-Factor Authentication</h2>
        <p style={{ color: T.subText }}>Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)</p>

        {loading ? (
          <div style={{ padding: 40 }}>Loading...</div>
        ) : (
          <>
            {qrSrc ? <img src={qrSrc} alt="2FA QR" style={{ margin: '18px 0', borderRadius: 8 }} /> : <div style={{ padding: 24, color: T.subText }}>QR not available</div>}

            <div style={{ marginTop: 8, fontSize: 13, color: T.subText }}>Secret</div>
            <div style={{ marginTop: 6, fontWeight: 700, letterSpacing: 3 }}>{secret || '—'}</div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'center' }}>
              <button onClick={() => { navigator.clipboard?.writeText(secret); toast.success('Secret copied') }} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: T.primary, color: '#fff', cursor: 'pointer' }}>Copy</button>
              <button onClick={handleProceed} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text, cursor: 'pointer' }}>Proceed</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Enable2FA;
