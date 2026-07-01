import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import api from './api';
import toast from 'react-hot-toast';
import { User, Mail, Calendar, MapPin, Phone, FileText, Save, X, Upload, Shield } from './icons';

function Profile() {
  const T = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    full_legal_name: '',
    date_of_birth: '',
    phone_number: '',
    country: '',
    state_province: '',
    address: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('profile/');
      setProfile(res.data);
      setFormData({
        full_legal_name: res.data.full_legal_name || '',
        date_of_birth: res.data.date_of_birth || '',
        phone_number: res.data.phone_number || '',
        country: res.data.country || '',
        state_province: res.data.state_province || '',
        address: res.data.address || '',
        bio: res.data.bio || '',
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.patch('profile/', formData);
      setProfile(res.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const fd = new FormData();
    fd.append('profile_picture', file);

    try {
      // DO NOT set Content-Type header manually - let axios handle it
      // and axios interceptor will add CSRF token
      const res = await api.post('profile/picture/', fd);
      console.log('[DEBUG] Profile picture upload response:', res.data);
      setProfile(res.data);
      toast.success('Profile picture updated');
    } catch (err) {
      console.error('[DEBUG] Upload error:', err.response?.data || err.message);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    try {
      const res = await api.delete('profile/picture/');
      setProfile(res.data);
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error('Failed to delete image');
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) return;
    try {
      await api.post('disable-2fa/');
      setProfile(prev => prev ? { ...prev, two_factor_enabled: false } : null);
      toast.success('2FA disabled successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to disable 2FA');
    }
  };

  if (loading) {
    return (
      <div style={{ ...rootStyle, background: T.bg, color: T.text }}>
        <div style={{ textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ ...rootStyle, background: T.bg, color: T.text }}>
      <div style={{ ...containerStyle, background: T.card, borderColor: T.border }}>
        {/* Header */}
        <div style={headerStyle}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ ...backBtnStyle, color: T.primary }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>My Profile</h1>
        </div>

        {/* Profile Picture Section */}
        <div style={pictureSectionStyle}>
          <div style={pictureContainerStyle}>
            {profile?.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt="Profile"
                style={pictureStyle}
              />
            ) : (
              <div style={{ ...pictureStyle, ...placeholderStyle, background: T.primary }}>
                <User size={64} color={T.card} />
              </div>
            )}
          </div>
          
          <div style={pictureBtnsStyle}>
            <label style={{ ...uploadBtnStyle, background: T.primary }}>
              {uploadingImage ? 'Uploading...' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                style={{ display: 'none' }}
              />
            </label>
            
            {profile?.profile_picture_url && (
              <button
                onClick={handleImageDelete}
                style={{ ...deleteBtnStyle, borderColor: '#ef4444', color: '#ef4444' }}
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div style={infoGridStyle}>
          {/* Username (Read-only) */}
          <div style={fieldStyle}>
            <label style={{ ...labelStyle, color: T.subText }}>Username</label>
            <div style={{ ...inputStyle, background: T.bg, opacity: 0.6 }}>
              {profile?.username}
            </div>
          </div>

          {/* Email (Read-only) */}
          <div style={fieldStyle}>
            <label style={{ ...labelStyle, color: T.subText }}>Email</label>
            <div style={{ ...inputStyle, background: T.bg, opacity: 0.6 }}>
              {profile?.email}
            </div>
          </div>

          {/* Editable Fields */}
          {editing ? (
            <>
              <input
                type="text"
                placeholder="Full Legal Name"
                value={formData.full_legal_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_legal_name: e.target.value })
                }
                style={inputStyle}
              />
              
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
                style={inputStyle}
              />
              
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                style={inputStyle}
              />
              
              <input
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                style={inputStyle}
              />
              
              <input
                type="text"
                placeholder="State/Province"
                value={formData.state_province}
                onChange={(e) =>
                  setFormData({ ...formData, state_province: e.target.value })
                }
                style={inputStyle}
              />
              
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={inputStyle}
              />
              
              <textarea
                placeholder="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                style={{ ...inputStyle, minHeight: '100px', gridColumn: '1 / -1' }}
              />
            </>
          ) : (
            <>
              <div style={fieldStyle}>
                <label style={{ ...labelStyle, color: T.subText }}>Full Legal Name</label>
                <div style={{ ...inputStyle, background: T.bg }}>
                  {profile?.full_legal_name || 'Not provided'}
                </div>
              </div>
              
              <div style={fieldStyle}>
                <label style={{ ...labelStyle, color: T.subText }}>Date of Birth</label>
                <div style={{ ...inputStyle, background: T.bg }}>
                  {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}
                </div>
              </div>
              
              <div style={fieldStyle}>
                <label style={{ ...labelStyle, color: T.subText }}>Phone Number</label>
                <div style={{ ...inputStyle, background: T.bg }}>
                  {profile?.phone_number || 'Not provided'}
                </div>
              </div>
              
              <div style={fieldStyle}>
                <label style={{ ...labelStyle, color: T.subText }}>Country</label>
                <div style={{ ...inputStyle, background: T.bg }}>
                  {profile?.country || 'Not provided'}
                </div>
              </div>
              
              <div style={fieldStyle}>
                <label style={{ ...labelStyle, color: T.subText }}>State/Province</label>
                <div style={{ ...inputStyle, background: T.bg }}>
                  {profile?.state_province || 'Not provided'}
                </div>
              </div>
              
              <div style={fieldStyle}>
                <label style={{ ...labelStyle, color: T.subText }}>Address</label>
                <div style={{ ...inputStyle, background: T.bg }}>
                  {profile?.address || 'Not provided'}
                </div>
              </div>
              
              <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <label style={{ ...labelStyle, color: T.subText }}>Bio</label>
                <div style={{ ...inputStyle, background: T.bg, minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                  {profile?.bio || 'Not provided'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security Settings Section */}
        <div style={{
          marginTop: '32px',
          paddingTop: '32px',
          borderTop: `1px solid ${T.border}`,
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color={T.primary} /> Security Settings
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: T.bg,
            padding: '20px',
            borderRadius: '16px',
            border: `1px solid ${T.border}`,
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>Two-Factor Authentication (2FA)</div>
              <div style={{ color: T.subText, fontSize: '13px', marginTop: '4px' }}>
                {profile?.two_factor_enabled 
                  ? 'Two-factor authentication is active. Your account is secured.' 
                  : 'Add an extra layer of security by requiring a verification code when logging in.'}
              </div>
            </div>
            {profile?.two_factor_enabled ? (
              <button 
                onClick={handleDisable2FA}
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '10px', 
                  border: `1px solid ${T.danger}`, 
                  color: T.danger, 
                  background: 'transparent', 
                  cursor: 'pointer', 
                  fontWeight: '700',
                  fontSize: '14px',
                  transition: '0.2s'
                }}
              >
                Disable 2FA
              </button>
            ) : (
                <button 
                  onClick={() => navigate('/enable-2fa')}
                  style={{ 
                    padding: '10px 20px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    color: '#fff', 
                    background: '#10b981', 
                    cursor: 'pointer', 
                    fontWeight: '700',
                    fontSize: '14px',
                    transition: '0.2s'
                  }}
                >
                  Enable 2FA
                </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={actionsStyle}>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                style={{ ...btnStyle, background: T.primary, color: '#fff' }}
              >
                <Save size={18} /> Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    full_legal_name: profile.full_legal_name || '',
                    date_of_birth: profile.date_of_birth || '',
                    phone_number: profile.phone_number || '',
                    country: profile.country || '',
                    state_province: profile.state_province || '',
                    address: profile.address || '',
                    bio: profile.bio || '',
                  });
                }}
                style={{ ...btnStyle, background: 'transparent', border: `2px solid ${T.border}`, color: T.text }}
              >
                <X size={18} /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{ ...btnStyle, background: T.primary, color: '#fff' }}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// STYLES
const rootStyle = {
  minHeight: '100vh',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const containerStyle = {
  width: '100%',
  maxWidth: '800px',
  borderRadius: '24px',
  padding: 'clamp(24px, 5vw, 40px)',
  border: '1px solid var(--border)',
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: 'var(--shadow-premium)',
};

const headerStyle = {
  marginBottom: '32px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const backBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: '16px',
  fontWeight: '700',
  cursor: 'pointer',
  padding: '4px 8px',
};

const pictureSectionStyle = {
  marginBottom: '40px',
  paddingBottom: '40px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '24px',
};

const pictureContainerStyle = {
  position: 'relative',
  flexShrink: 0,
};

const pictureStyle = {
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid var(--border)',
};

const placeholderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const pictureBtnsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const uploadBtnStyle = {
  padding: '10px 16px',
  borderRadius: '8px',
  border: 'none',
  color: '#fff',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const deleteBtnStyle = {
  padding: '10px 16px',
  borderRadius: '8px',
  border: '2px solid',
  background: 'transparent',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '20px',
  marginBottom: '32px',
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.3s ease',
};

const actionsStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
};

const btnStyle = {
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  fontWeight: '700',
  cursor: 'pointer',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

export default Profile;
