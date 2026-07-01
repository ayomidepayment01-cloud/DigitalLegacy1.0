import React, { useState, useEffect } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext'; 
import CryptoJS from 'crypto-js'; 
import toast from 'react-hot-toast'; 
import _QRCode from 'react-qr-code';
const QRCode = (_QRCode && _QRCode.default) ? _QRCode.default : _QRCode;
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

// Normalize icon exports: some bundlers may wrap exports as { default: Component }
const _normIcon = (i) => (i && i.default) ? i.default : i;
const Heart = _normIcon(Icons.Heart);
const Shield = _normIcon(Icons.Shield);
const Users = _normIcon(Icons.Users);
const Lock = _normIcon(Icons.Lock);
const Activity = _normIcon(Icons.Activity);
const LogOut = _normIcon(Icons.LogOut);
const Plus = _normIcon(Icons.Plus);
const Trash2 = _normIcon(Icons.Trash2);
const AlertTriangle = _normIcon(Icons.AlertTriangle);
const CheckCircle = _normIcon(Icons.CheckCircle);
const Clock = _normIcon(Icons.Clock);
const LinkIcon = _normIcon(Icons.Link);
const Key = _normIcon(Icons.Key);
const Info = _normIcon(Icons.Info);
const Pencil = _normIcon(Icons.Pencil);
const X = _normIcon(Icons.X);
const Settings = _normIcon(Icons.Settings);
const Search = _normIcon(Icons.Search);
const TrendingUp = _normIcon(Icons.TrendingUp);
const Zap = _normIcon(Icons.Zap);
const Eye = _normIcon(Icons.Eye);
const EyeOff = _normIcon(Icons.EyeOff);

function Dashboard() {
  const navigate = useNavigate();
  const T = useTheme();

  // Debugging aid: log types of imported components that may render as objects
  try {
    // eslint-disable-next-line no-console
    const _isRenderable = (x) => {
      if (!x) return false;
      const t = typeof x;
      if (t === 'function') return true;
      if (t === 'object') {
        // React forwards or objects with default export
        if (x.$$typeof) return true;
        if (x.render || x.type) return true;
      }
      return false;
    };

    console.debug('Dashboard debug imports:', {
      Shield: { type: typeof Shield, renderable: _isRenderable(Shield) },
      Heart: { type: typeof Heart, renderable: _isRenderable(Heart) },
      motion: { type: typeof motion, renderable: _isRenderable(motion) },
      QRCode: { type: typeof QRCode, renderable: _isRenderable(QRCode) },
      AnimatePresence: { type: typeof AnimatePresence, renderable: _isRenderable(AnimatePresence) },
    });
  } catch (e) {
    // ignore in production
  }

  const [user, setUser] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('heartbeat');
  const [heartbeatMsg, setHeartbeatMsg] = useState('');
  const [newBen, setNewBen] = useState({ name: '', email: '', phone: '', relationship: 'other' });
  
  const [masterKey, setMasterKey] = useState(''); 
  const [newNote, setNewNote] = useState({ title: '', content: '', category: 'other', beneficiary_ids: [], hint: '' });
  
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, type: null });
  const [settings, setSettings] = useState({ phone_number: '', threshold_days: 180 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = T.bg;
  }, [T.bg]);

  const fetchMe = async () => {
    try {
      const res = await api.get('me/');
      console.log('[DEBUG] /api/me/ response:', res.data);
      setUser(res.data);
      setSettings({
        phone_number: res.data.phone_number || '',
        threshold_days: res.data.threshold_days || 180
      });
    } catch (err) { 
      console.error('[DEBUG] fetchMe error:', err);
      if (err.response?.status === 401) navigate('/login'); 
    }
  };

  const fetchBeneficiaries = async () => {
    try {
      const res = await api.get('beneficiaries/');
      setBeneficiaries(res.data);
    } catch (err) { if (err.response?.status === 401) navigate('/login'); }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get('notes/');
      setNotes(res.data);
    } catch (err) { if (err.response?.status === 401) navigate('/login'); }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchMe(), fetchBeneficiaries(), fetchNotes()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const triggerHeartbeat = async () => {
    try {
      await api.post('heartbeat/');
      setHeartbeatMsg('success');
      toast.success('Heartbeat updated successfully!'); 
      await fetchMe();
      setTimeout(() => setHeartbeatMsg(''), 3000);
    } catch (err) { if (err.response?.status === 401) navigate('/login'); }
  };

  const executeDemo = async () => {
    setIsDemoModalOpen(false);
    const loadToast = toast.loading('Simulating inactivity...');
    try {
      await api.post('test-trigger/');
      await fetchMe();
      toast.success('Vault released! Beneficiaries notified.', { id: loadToast }); 
    } catch (err) { 
      toast.error('Error triggering demo.', { id: loadToast }); 
    }
  };

  const updateSettings = async () => {
    const loadToast = toast.loading('Updating settings...');
    try {
      await api.patch('me/', settings);
      await fetchMe();
      toast.success('Settings saved successfully!', { id: loadToast });
    } catch (err) {
      toast.error('Failed to update settings.', { id: loadToast });
    }
  };

  const initiate2FA = async () => {
    const loadToast = toast.loading('Connecting to Security Gateway...');
    try {
      const res = await api.post('enable-2fa/');
      setTwoFactorData(res.data);
      setIs2FAModalOpen(true);
      toast.dismiss(loadToast);
    } catch (err) {
      toast.error("Failed to start 2FA setup.", { id: loadToast });
    }
  };

  const confirm2FA = async () => {
    const loadToast = toast.loading('Verifying code...');
    try {
      await api.post('confirm-2fa/', { code: twoFactorCode });
      toast.success("Two-Factor Protection Enabled!", { id: loadToast });
      setIs2FAModalOpen(false);
      fetchMe();
    } catch (err) {
      toast.error("Invalid code. Please try again.", { id: loadToast });
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) return;
    try {
      await api.post('disable-2fa/');
      toast.success('2FA disabled successfully');
      fetchMe();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to disable 2FA');
    }
  };

  const addBeneficiary = async () => {
    if (!newBen.name || !newBen.email) return toast.error('Name and email are required.'); 
    if (beneficiaries.length >= 6) return toast.error('Maximum 6 beneficiaries allowed.'); 
    try {
      await api.post('beneficiaries/', newBen);
      setNewBen({ name: '', email: '', phone: '', relationship: 'other' });
      toast.success('Trustee added successfully!');
      fetchBeneficiaries();
    } catch (err) { toast.error('Failed to add beneficiary.'); }
  };

  const openDeleteModal = (id, type) => {
    setDeleteTarget({ id, type });
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    const { id, type } = deleteTarget;
    const loadToast = toast.loading(`Removing ${type}...`);
    try {
      if (type === 'note') {
        await api.delete(`notes/${id}/`);
        fetchNotes();
      } else {
        await api.delete(`beneficiaries/${id}/`);
        fetchBeneficiaries();
      }
      toast.success(`${type === 'note' ? 'Secret' : 'Trustee'} deleted.`, { id: loadToast });
    } catch (err) {
      toast.error('Failed to delete.', { id: loadToast });
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const startEdit = (note) => {
    setEditingNoteId(note.id);
    setNewNote({
      title: note.title,
      content: '', 
      category: note.category,
      beneficiary_ids: note.beneficiaries || [],
      hint: note.decryption_hint || ''
    });
    setIsVaultModalOpen(true); 
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setNewNote({ title: '', content: '', category: 'other', beneficiary_ids: [], hint: '' });
    setMasterKey('');
    setIsVaultModalOpen(false); 
  };

  const addNote = async () => {
    if (!newNote.title) return toast.error('Title is required.'); 
    if (newNote.beneficiary_ids.length === 0) return toast.error('Assign at least one trustee.'); 
    
    const payload = { 
      title: newNote.title, 
      category: newNote.category, 
      beneficiary_ids: newNote.beneficiary_ids,
      decryption_hint: newNote.hint 
    };

    if (newNote.content.trim() !== "") {
      if (!masterKey) return toast.error('Master Key required for encryption.'); 
      const encrypted = CryptoJS.AES.encrypt(newNote.content, masterKey).toString();
      payload.encrypted_content = encrypted;
    } else {
      if (!editingNoteId) return toast.error('Content is required.'); 
    }

    const loadToast = toast.loading('Securing vault...');
    try {
      if (editingNoteId) {
        await api.patch(`notes/${editingNoteId}/`, payload);
        toast.success('Secret updated!', { id: loadToast });
      } else {
        await api.post('notes/', payload);
        toast.success('New secret encrypted and saved!', { id: loadToast });
      }
      cancelEdit();
      fetchNotes();
    } catch (err) { toast.error('Failed to save note.', { id: loadToast }); }
  };

  const handleLogout = async () => {
    try { await api.post('logout/'); } catch (_) {}
    navigate('/login');
  };

  const categoryLabel = { social: 'Social Media', finance: 'Finance / Banking', crypto: 'Crypto / NFTs', email: 'Email Accounts', devices: 'Devices / Passwords', message: 'Personal Message', other: 'Other' };
  const daysRemaining = user?.days_remaining ?? 0;
  const threshold = user?.threshold_days ?? 180;
  const progressPct = threshold > 0 ? Math.min(100, Math.round((daysRemaining / threshold) * 100)) : 0;
  const isDeceased = user?.is_deceased;
  const progressColor = progressPct > 50 ? '#10b981' : progressPct > 20 ? '#f59e0b' : '#ef4444';

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div style={{...loadingStyle, background: T.bg}}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Shield size={48} color={T.primary} />
        </motion.div>
        <motion.p 
          style={{ color: T.subText, marginTop: '16px', fontWeight: '600' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          DECRYPTING VAULT...
        </motion.p>
      </div>
    );
  }

  return (
    <div style={{...rootStyle, background: T.bg, color: T.text, flexDirection: T.isMobile ? 'column' : 'row'}}>
      
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        .pulse-dot { animation: pulse 1.5s infinite; }
      `}</style>

      <motion.aside 
        initial={{ x: T.isMobile ? 0 : -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          ...sidebarStyle, 
          background: T.card, 
          borderRight: T.isMobile ? 'none' : `1px solid ${T.border}`,
          borderBottom: T.isMobile ? `1px solid ${T.border}` : 'none',
          width: T.isMobile ? '100%' : '260px',
          height: T.isMobile ? 'auto' : '100vh',
          position: T.isMobile ? 'relative' : 'fixed'
        }}>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{...logoStyle, borderBottom: `1px solid ${T.border}`}}
        >
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
            <Shield size={24} color={T.primary} fill="var(--primary-bg)" />
          </motion.div>
          <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--primary)' }}>Digital Legacy</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{...userCardStyle, borderBottom: `1px solid ${T.border}`}}
        >
          <motion.div 
            whileHover={{ scale: 1.1 }}
            style={{...avatarStyle, background: user?.profile_picture_url ? 'transparent' : T.primary, color: '#fff', overflow: 'hidden'}}
          >
            {user?.profile_picture_url ? (
              <img 
                src={user.profile_picture_url} 
                alt="avatar" 
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  console.error('[DEBUG] Avatar image failed to load:', user.profile_picture_url);
                  console.error('[DEBUG] Image element src:', e.target.src);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('[DEBUG] Avatar image loaded successfully:', user.profile_picture_url);
                }}
              />
            ) : (
              user?.username?.[0]?.toUpperCase()
            )}
        </motion.div>
        {!T.isMobile && (
          <div 
            onClick={() => navigate('/profile')} 
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            <div style={{ fontWeight: '700', fontSize: '14px', color: T.text }}>{user?.username}</div>
            <div style={{ fontSize: '11px', color: T.subText }}>Vault Owner</div>
          </div>
        )}
      </motion.div>

        <nav style={{ padding: '16px 0', display: 'flex', flexDirection: T.isMobile ? 'row' : 'column', overflowX: T.isMobile ? 'auto' : 'visible' }}>
          {[
            { id: 'heartbeat', label: 'Pulse', icon: <Heart size={16} /> },
            { id: 'vault', label: 'Vault', icon: <Lock size={16} /> },
            { id: 'beneficiaries', label: 'Trustees', icon: <Users size={16} /> },
            { id: 'activity', label: 'System', icon: <Activity size={16} /> },
          ].map((tab, idx) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                ...navItemStyle,
                color: activeTab === tab.id ? T.primary : T.subText,
                borderLeft: !T.isMobile && activeTab === tab.id ? `3px solid ${T.primary}` : '3px solid transparent',
                minWidth: T.isMobile ? '100px' : 'auto',
                background: activeTab === tab.id ? `${T.primary}08` : 'transparent'
              }}
            >
              {tab.icon}
              <span style={{ marginLeft: '10px' }}>{tab.label}</span>
            </motion.button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout} 
            style={logoutBtnStyle}
          >
            <LogOut size={14} />
            <span style={{ marginLeft: '8px' }}>Sign out</span>
          </motion.button>
        </div>
      </motion.aside>

      <main style={{
        ...mainStyle, 
        marginLeft: T.isMobile ? '0' : '260px',
        padding: T.isMobile ? '20px' : '40px 60px'
      }}>
        
        {notes.some(n => n.is_unlinked) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{...warningBannerStyle, background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b'}}
          >
            <AlertTriangle size={20} />
            <span>You have <strong>{notes.filter(n => n.is_unlinked).length}</strong> unassigned notes. These will not be delivered unless linked to a trustee.</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* --- HEARTBEAT TAB --- */}
          {activeTab === 'heartbeat' && (
            <motion.div 
              key="heartbeat"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 style={{...pageTitleStyle, color: T.text}}>Heartbeat Monitor</h2>
              
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
               style={{...statusCardStyle, background: T.card, border: `1px solid ${isDeceased ? '#ef4444' : '#10b981'}`, position: 'relative', overflow: 'hidden'}}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(135deg, ${T.primary}08 0%, transparent 100%)`, pointerEvents: 'none' }} />
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}
                >
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: '10px', height: '10px', borderRadius: '50%', background: isDeceased ? '#ef4444' : '#10b981' }} 
                  />
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: isDeceased ? '#ef4444' : '#10b981' }}>
                    {isDeceased ? 'Vault Released' : 'Active — Vault Sealed'}
                  </span>
                </motion.div>
                
                <motion.h3 
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontSize: '28px', fontWeight: '800', color: T.text, margin: '0 0 10px' }}
                >
                  {isDeceased ? 'Your vault is open.' : 'System Secure.'}
                </motion.h3>
                
                <p style={{ fontSize: '14px', color: T.subText, marginBottom: '24px' }}>{isDeceased ? 'Beneficiaries notified.' : 'Check in to keep your secrets private.'}</p>

                <div style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: T.subText, marginBottom: '10px' }}>
                    <span>Time until release</span>
                    <span style={{ color: progressColor, fontWeight: '700' }}>{daysRemaining} / {threshold} days</span>
                  </div>
                  <div style={{ height: '8px', background: T.bg, borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div 
                      layoutId="progress"
                      style={{ height: '100%', width: `${progressPct}%`, background: progressColor }} 
                      transition={{ type: "spring", stiffness: 50 }}
                    />
                  </div>
                </div>

                {heartbeatMsg === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    style={{...successAlertStyle, color: '#10b981'}}
                  >
                    <CheckCircle size={16} /> 
                    <span style={{marginLeft: '8px'}}>Pulse Recorded.</span>
                  </motion.div>
                )}
                
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: `0 10px 30px ${T.primary}40` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={triggerHeartbeat} 
                  style={{...heartbeatBtnStyle, background: T.primary, color: '#fff', border: 'none'}}
                >
                  <motion.div animate={{ x: [0, 2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Heart size={16} style={{ marginRight: '8px', display: 'inline' }} />
                  </motion.div>
                  Confirm — I Am Alive
                </motion.button>
              </motion.div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{...statsRowStyle, gridTemplateColumns: T.isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '15px', background: 'none'}}
              >
                {[
                  { label: 'Vault Items', value: notes.length },
                  { label: 'Trustees', value: beneficiaries.length },
                  { label: 'Threshold', value: `${threshold}d` },
                  { label: 'Days Left', value: daysRemaining },
                ].map((s, i) => (
                  <motion.div 
                    key={i}
                    variants={itemVariants}
                    whileHover={{ y: -5, boxShadow: `0 10px 25px ${T.primary}20` }}
                    style={{...statCardStyle, background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px'}}
                  >
                    <div style={{ fontSize: '11px', color: T.subText, textTransform: 'uppercase', fontWeight: '700' }}>{s.label}</div>
                    <motion.div 
                      key={s.value}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ fontSize: '32px', fontWeight: '800', color: T.primary, marginTop: '5px' }}
                    >
                      {s.value}
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{...demoBoxStyle, background: `${T.primary}05`, border: `1px dashed ${T.primary}33`}}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle size={16} color="var(--danger)" />
                  <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '800' }}>EMERGENCY OVERRIDE</span>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsDemoModalOpen(true)} 
                  style={{ background: 'var(--danger)', border: 'none', color: '#fff', padding: '6px 12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '6px', boxShadow: '0 5px 15px -5px var(--danger)' }}
                >
                  Critical Dispersal
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* --- VAULT TAB --- */}
          {activeTab === 'vault' && (
            <motion.div 
              key="vault"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
                <h2 style={{...pageTitleStyle, color: T.text, margin: 0}}>Encrypted Vault</h2>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsVaultModalOpen(true)} 
                  style={{...addBtnStyle, background: T.primary, color: '#fff', margin: 0, gap: '8px'}}
                >
                  <Plus size={18} /> Add New Secret
                </motion.button>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ position: 'relative', marginBottom: '24px' }}
              >
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px' }} color={T.subText} />
                <input 
                  placeholder="Filter vault items (title or category)..." 
                  style={{ ...inputStyle, paddingLeft: '48px', background: T.card, border: `1px solid ${T.border}` }} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </motion.div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{display: 'grid', gridTemplateColumns: T.isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px'}}
              >
                <AnimatePresence>
                  {notes
                    .filter(n => (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || (n.category || "").toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((note, idx) => (
                    <motion.div 
                      key={note.id}
                      variants={itemVariants}
                      whileHover={{ y: -8, boxShadow: `0 15px 35px ${T.primary}30` }}
                      whileTap={{ scale: 0.98 }}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      style={{...noteItemStyle, background: T.card, border: note.is_unlinked ? '1px solid #ef4444' : `1px solid ${T.border}`, borderRadius: '12px'}}
                    >
                      <div style={{ flex: 1 }}>
                        <motion.div 
                          whileHover={{ color: T.primary }}
                          style={{ fontWeight: '700', color: T.text }}
                        >
                          {note.title}
                        </motion.div>
                        <div style={{ fontSize: '11px', color: T.primary, marginTop: '4px' }}>
                          Hint: {note.decryption_hint || "None"}
                        </div>
                      </div>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <motion.button 
                          whileHover={{ scale: 1.2, color: T.primary }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => startEdit(note)} 
                          style={{background: 'none', border: 'none', color: T.subText, cursor: 'pointer'}}
                        >
                          <Pencil size={14}/>
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openDeleteModal(note.id, 'note')} 
                          style={{...deleteBtnStyle}}
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* --- TRUSTEES TAB --- */}
          {activeTab === 'beneficiaries' && (
            <motion.div 
              key="beneficiaries"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 style={{...pageTitleStyle, color: T.text}}>Trustees ({beneficiaries.length}/6)</h2>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{...formCardStyle, background: T.card, border: `1px solid ${T.border}`}}
              >
                <div style={{...formGridStyle, gridTemplateColumns: T.isMobile ? '1fr' : '1fr 1fr'}}>
                  <input placeholder="Legal Name" style={{...inputStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}`}} value={newBen.name} onChange={e => setNewBen({ ...newBen, name: e.target.value })} />
                  <input placeholder="Trustee Email" style={{...inputStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}`}} value={newBen.email} onChange={e => setNewBen({ ...newBen, email: e.target.value })} />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addBeneficiary} 
                  style={{...addBtnStyle, background: T.text, color: T.card}}
                >
                  Register Trustee
                </motion.button>
              </motion.div>

              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <AnimatePresence>
                  {beneficiaries.map((b, idx) => (
                    <motion.div 
                      key={b.id}
                      variants={itemVariants}
                      whileHover={{ x: 5, boxShadow: `0 10px 25px ${T.primary}20` }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      style={{...noteItemStyle, background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', marginBottom: '10px'}}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        style={{...avatarSmallStyle, background: T.primary, color: '#fff'}}
                      >
                        {(b.name?.[0] || "?").toUpperCase()}
                      </motion.div>
                      <div style={{ flex: 1, marginLeft: '12px' }}>
                        <div style={{ fontWeight: '700', color: T.text }}>{b.name}</div>
                        <div style={{ fontSize: '12px', color: T.subText }}>{b.email}</div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openDeleteModal(b.id, 'beneficiary')} 
                        style={deleteBtnStyle}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* --- ACTIVITY TAB --- */}
          {activeTab === 'activity' && (
            <motion.div 
              key="activity"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 style={{...pageTitleStyle, color: T.text}}>System Settings</h2>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{...formCardStyle, background: T.card, border: `1px solid ${T.border}`}}
              >
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: '32px', padding: '24px', borderRadius: '16px', background: `${T.primary}08`, border: `1px solid ${T.primary}22` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Shield size={20} color={T.primary} />
                    <span style={{ fontWeight: '800', fontSize: '14px' }}>Two-Factor Authentication</span>
                  </div>
                  <p style={{ fontSize: '12px', color: T.subText, marginBottom: '16px' }}>
                    Lock your vault with an extra layer of security. Use an Authenticator app (Google, Authy) to generate login codes.
                  </p>
                  {!user?.two_factor_enabled ? (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={initiate2FA} 
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
                      Enable Authenticator
                    </motion.button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '800', fontSize: '12px' }}
                      >
                        <CheckCircle size={14} /> 2FA PROTECTION ACTIVE
                      </motion.div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDisable2FA} 
                        style={{ 
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          border: '1px solid var(--danger)', 
                          color: 'var(--danger)', 
                          background: 'transparent', 
                          cursor: 'pointer', 
                          fontWeight: '700',
                          fontSize: '12px',
                          transition: '0.2s'
                        }}
                      >
                        Disable 2FA
                      </motion.button>
                    </div>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{marginBottom: '20px'}}>
                  <label style={{fontSize: '11px', fontWeight: '700', color: T.subText, textTransform: 'uppercase', display: 'block', marginBottom: '8px'}}>
                    Inactivity Threshold (Days)
                  </label>
                  <input 
                    type="number" 
                    style={{...inputStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}`}} 
                    value={settings.threshold_days} 
                    onChange={e => setSettings({...settings, threshold_days: e.target.value === '' ? '' : parseInt(e.target.value) || 0})}
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{marginBottom: '20px'}}>
                  <label style={{fontSize: '11px', fontWeight: '700', color: T.subText, textTransform: 'uppercase', display: 'block', marginBottom: '8px'}}>
                    Recovery Phone Number
                  </label>
                  <input 
                    placeholder="+234..." 
                    style={{...inputStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}`}} 
                    value={settings.phone_number} 
                    onChange={e => setSettings({...settings, phone_number: e.target.value})}
                  />
                </motion.div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={updateSettings} 
                  style={{...addBtnStyle, background: T.primary, color: '#fff', width: '100%', justifyContent: 'center'}}
                >
                  Save System Configuration
                </motion.button>

                <hr style={{margin: '32px 0', borderColor: T.border, opacity: 0.3}} />

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{...infoRowStyle}}>
                  <span style={{ fontSize: '11px', color: T.subText, fontWeight: '700' }}>Last Signal Detected</span>
                  <span style={{ fontSize: '13px', color: T.text, fontWeight: '600' }}>{user?.last_heartbeat ? new Date(user.last_heartbeat).toLocaleString() : 'Never'}</span>
                </motion.div>
                
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{...infoRowStyle}}>
                  <span style={{ fontSize: '11px', color: T.subText, fontWeight: '700' }}>Vault Status</span>
                  <span style={{ fontSize: '13px', color: isDeceased ? '#ef4444' : '#10b981', fontWeight: '800' }}>{isDeceased ? 'RELEASED' : 'SECURED'}</span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- VAULT MODAL --- */}
      <AnimatePresence>
        {isVaultModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalOverlayStyle}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{ ...vaultModalContentStyle, background: T.card, border: `1px solid ${T.border}` }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%'}}>
                <h3 style={{ color: T.text, margin: 0, fontWeight: '800' }}>{editingNoteId ? 'Update Secret' : 'Secure New Secret'}</h3>
                <motion.button 
                  whileHover={{ rotate: 90 }}
                  onClick={cancelEdit} 
                  style={{background: 'none', border: 'none', color: T.subText, cursor: 'pointer'}}
                >
                  <X size={20}/>
                </motion.button>
              </div>
              
              <div style={{ width: '100%' }}>
                <div style={{...formGridStyle, gridTemplateColumns: T.isMobile ? '1fr' : '1fr 1fr'}}>
                  <input placeholder="Title (e.g. Gmail Password)" style={{...inputStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}`}} value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} />
                  <select style={{...inputStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}`}} value={newNote.category} onChange={e => setNewNote({ ...newNote, category: e.target.value })}>
                    {Object.entries(categoryLabel).map(([val, label]) => (<option key={val} value={val}>{label}</option>))}
                  </select>
                </div>

                <div style={{marginTop: '15px'}}>
                  <label style={{fontSize: '11px', fontWeight: '700', color: T.subText, textTransform: 'uppercase', display: 'block', marginBottom: '8px'}}>Assign Trustees</label>
                  <select 
                    multiple 
                    style={{...inputStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}`, height: '100px'}} 
                    value={(newNote.beneficiary_ids || []).map(String)} 
                    onChange={e => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setNewNote({ ...newNote, beneficiary_ids: values });
                    }}
                  >
                    {beneficiaries.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.email})</option>
                    ))}
                  </select>
                </div>

                <div style={{...formGridStyle, gridTemplateColumns: T.isMobile ? '1fr' : '1fr 1fr', marginTop: '15px'}}>
                  <div style={{position: 'relative'}}>
                    <motion.div 
                      style={{position: 'absolute', left: '12px', top: '15px'}}
                      animate={{ rotate: showMasterKey ? 180 : 0 }}
                    >
                      {showMasterKey ? <EyeOff size={14} color={T.primary} /> : <Eye size={14} color={T.primary} />}
                    </motion.div>
                    <input 
                      type={showMasterKey ? "text" : "password"}
                      placeholder="Master Encryption Key" 
                      style={{...inputStyle, background: T.bg, color: T.text, border: `2px solid ${T.primary}44`, paddingLeft: '35px', paddingRight: '35px'}} 
                      value={masterKey} 
                      onChange={e => setMasterKey(e.target.value)} 
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setShowMasterKey(!showMasterKey)}
                      style={{position: 'absolute', right: '12px', top: '15px', background: 'none', border: 'none', cursor: 'pointer', color: T.primary}}
                    />
                  </div>
                  <div style={{position: 'relative'}}>
                    <Info size={14} style={{position: 'absolute', left: '12px', top: '15px'}} color={T.subText} />
                    <input 
                      placeholder="Decryption Hint (Breadcrumb)" 
                      style={{...inputStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}`, paddingLeft: '35px'}} 
                      value={newNote.hint} 
                      onChange={e => setNewNote({ ...newNote, hint: e.target.value })} 
                    />
                  </div>
                </div>

                <textarea placeholder={editingNoteId ? "Enter NEW content to re-encrypt (Blank to keep old)" : "Secret content..."} style={{ ...inputStyle, width: '100%', height: '120px', marginTop: '15px', background: T.bg, color: T.text, border: `1px solid ${T.border}` }} value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })} />
                
                <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelEdit} 
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', background: T.bg, color: T.text, border: `1px solid ${T.border}`, fontWeight: '700', cursor: 'pointer' }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addNote} 
                    style={{ flex: 2, padding: '14px', borderRadius: '12px', background: T.primary, color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer' }}
                  >
                    {editingNoteId ? 'Update Secret' : 'Secure & Save'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA MODAL */}
      <AnimatePresence>
        {is2FAModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalOverlayStyle}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ ...modalContentStyle, background: T.card, border: `1px solid ${T.border}`, maxWidth: '400px' }}
            >
              <h3 style={{ color: T.text, marginBottom: '8px' }}>Setup Authenticator</h3>
              <p style={{ color: T.subText, fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
                Scan this QR code with Google Authenticator or Authy to start protecting your vault.
              </p>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ background: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '24px' }}
              >
                <QRCode value={twoFactorData?.uri || ""} size={160} />
              </motion.div>

              <div style={{ width: '100%', marginBottom: '24px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.subText, display: 'block', marginBottom: '8px', textAlign: 'center' }}>
                  ENTER THE 6-DIGIT CODE FROM YOUR APP
                </label>
                <input 
                  placeholder="000 000" 
                  maxLength="6"
                  style={{ ...inputStyle, textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }} 
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIs2FAModalOpen(false)} 
                  style={{ ...modalBtnStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}` }}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirm2FA} 
                  style={{ ...modalBtnStyle, background: '#10b981', color: '#fff', border: 'none' }}
                >
                  Activate 2FA
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalOverlayStyle}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ ...modalContentStyle, background: T.card, border: `1px solid ${T.border}` }}
            >
              <motion.div animate={{ rotate: [0, -5, 5, -5, 0] }} transition={{ duration: 0.5 }}>
                <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
              </motion.div>
              <h3 style={{ color: T.text, marginBottom: '8px' }}>Confirm Deletion</h3>
              <p style={{ color: T.subText, fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
                Are you sure? This action is permanent and cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsDeleteModalOpen(false)} 
                  style={{ ...modalBtnStyle, background: T.bg, color: T.text, border: `1px solid ${T.border}` }}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={executeDelete} 
                  style={{ ...modalBtnStyle, background: '#ef4444', color: '#fff', border: 'none' }}
                >
                  Delete Forever
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEMO CONFIRMATION MODAL */}
      <AnimatePresence>
        {isDemoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalOverlayStyle}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{ ...modalContentStyle, background: 'var(--glass-bg)' }}
            >
              <AlertTriangle size={48} color="var(--danger)" />
              <h3 style={{ color: T.text, marginTop: '16px' }}>Are You Sure?</h3>
              <p style={{ color: T.subText, fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
                This simulates 97 days of inactivity and will immediately release your vault to your trustees. This action is irreversible.
              </p>
              
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button 
                  onClick={() => setIsDemoModalOpen(false)}
                  style={{ ...modalBtnStyle, background: 'transparent', border: `1px solid ${T.border}`, color: T.text }}
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDemo}
                  style={{ ...modalBtnStyle, background: 'var(--danger)', color: '#fff', border: 'none' }}
                >
                  Yes, Disperse Vault
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

const rootStyle = { display: 'flex', minHeight: '100vh', width: '100%' };
const sidebarStyle = { flexShrink: 0, display: 'flex', flexDirection: 'column', zIndex: 100 };
const logoStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '30px 24px' };
const userCardStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '20px' };
const avatarStyle = { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', flexShrink: 0 };
const avatarSmallStyle = { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 };
const navItemStyle = { display: 'flex', alignItems: 'center', width: '100%', padding: '14px 24px', fontSize: '13px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: '600' };
const logoutBtnStyle = { display: 'flex', alignItems: 'center', width: '100%', padding: '12px', background: 'var(--danger-bg)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', textTransform: 'uppercase', color: 'var(--danger)', border: '1px solid var(--danger)' };
const mainStyle = { flex: 1, overflowY: 'auto', boxSizing: 'border-box' };
const pageTitleStyle = { fontSize: '32px', fontWeight: '800', marginBottom: '32px', letterSpacing: '-0.02em' };
const statusCardStyle = { borderRadius: '24px', padding: '40px', marginBottom: '32px', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' };
const statsRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' };
const statCardStyle = { padding: '24px', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-lg)' };
const heartbeatBtnStyle = { padding: '16px 32px', borderRadius: '16px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', background: 'var(--primary)', color: '#fff', border: 'none', boxShadow: '0 10px 20px -10px var(--primary)' };
const demoBoxStyle = { padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--primary-bg)' };
const demoBtnStyle = { background: 'var(--primary)', border: 'none', color: '#fff', padding: '10px 20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '8px', boxShadow: '0 5px 15px -5px var(--primary)' };
const formCardStyle = { padding: '32px', marginBottom: '32px', borderRadius: '24px', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' };
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' };
const inputStyle = { padding: '14px', outline: 'none', borderRadius: '12px', fontSize: '14px', width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', transition: 'border-color 0.3s ease' };
const addBtnStyle = { display: 'flex', alignItems: 'center', marginTop: '20px', padding: '14px 28px', border: 'none', fontSize: '13px', fontWeight: '800', cursor: 'pointer', borderRadius: '12px', background: 'var(--primary)', color: '#fff', boxShadow: '0 10px 20px -10px var(--primary)' };
const noteItemStyle = { display: 'flex', alignItems: 'center', padding: '20px', gap: '12px', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow)' };
const deleteBtnStyle = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' };
const infoRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '16px 0' };
const successAlertStyle = { display: 'flex', alignItems: 'center', fontSize: '13px', marginBottom: '20px' };
const loadingStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' };
const warningBannerStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderRadius: '12px', marginBottom: '30px', fontSize: '13px', fontWeight: '600' };

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 1000, padding: '20px',
  backdropFilter: 'blur(4px)'
};

const modalContentStyle = {
  width: '100%', maxWidth: '400px', padding: '32px',
  borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
  background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-premium)'
};

const vaultModalContentStyle = {
  width: '100%', maxWidth: '650px', padding: '40px',
  borderRadius: '28px', display: 'flex', flexDirection: 'column',
  background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-premium)'
};

const modalBtnStyle = {
  flex: 1, padding: '12px', borderRadius: '12px',
  fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
};

export default Dashboard;
