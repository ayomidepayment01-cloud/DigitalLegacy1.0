
import React, { useState, useEffect } from 'react';
import api from './api';
import { useSearchParams } from 'react-router-dom';
import { Shield, Unlock, Lock, Mail, Key, Eye, EyeOff, Info, User, CheckCircle, Copy } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import CryptoJS from 'crypto-js';

function Claim() {
  const T = useTheme();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [notes, setNotes] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [noteKeys, setNoteKeys] = useState({});
  const [visibleKeys, setVisibleKeys] = useState({});
  const [decryptStatus, setDecryptStatus] = useState({});

  useEffect(() => { document.body.style.backgroundColor = T.bg; }, [T.bg]);

  const fetchNotesFor = async (email) => {
    setLoading(true);
    try {
      const res = await api.get(`claim/?email=${email}`);
      setNotes(res.data.notes || []);
      setStep(2);
    } catch (err) {
      if (err?.response?.status === 403) {
        alert('Security Alert: Access denied. One or more vaults are locked until inactivity is confirmed.');
      } else {
        alert('No released assets found for this address.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!email) return alert('Please enter your registered email.');
    fetchNotesFor(email);
  };

  const handleKeyChange = (id, val) => setNoteKeys(prev => ({ ...prev, [id]: val }));
  const toggleVisibility = (id) => setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));

  const decryptContent = (ciphertext, key) => {
    if (!key) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalText && ciphertext) return 'INVALID KEY';
      return originalText;
    } catch (e) {
      return 'DECRYPTION FAILED';
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // simple visual feedback could be added
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  // Animation variants
  const pageVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
  const listVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28 } } };
  const unlockVariants = { hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1, rotate: [0, -10, 10, 0], transition: { duration: 0.6 } } };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" style={{ ...containerStyle, color: T.text }}>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
          <Shield size={48} color={T.primary} fill="var(--primary-bg)" style={{ marginBottom: '12px' }} />
        </motion.div>
        <h1 style={{ fontWeight: 900, fontSize: '28px', margin: 0 }}>{step === 1 ? 'Legacy Access' : 'Trustee Portal'}</h1>
        <p style={{ color: T.subText, marginTop: '6px' }}>Authorized Digital Recovery</p>
      </div>

      {step === 1 ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ ...cardStyle, background: T.card, border: `1px solid ${T.border}` }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Verify Trustee Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={iconStyle} color={T.subText} />
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, background: T.bg, color: T.text, borderColor: T.border }}
                placeholder="name@example.com"
                whileFocus={{ scale: 1.01, boxShadow: `0 8px 30px ${T.primary}22` }}
              />
            </div>
          </div>

          <motion.button
            onClick={handleSearch}
            style={{ ...btnStyle, background: T.primary }}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Verifying Credentials...' : 'Search Released Vaults'}
          </motion.button>
        </motion.div>
      ) : (
        <div>
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <motion.div style={{ display: 'grid', gap: '18px' }}>
                {notes.map(note => {
                  const currentKey = noteKeys[note.id] || '';
                  const isVisible = visibleKeys[note.id] || false;
                  const decrypted = decryptContent(note.encrypted_content, currentKey);
                  const isSuccess = decrypted && decrypted !== 'INVALID KEY' && decrypted !== 'DECRYPTION FAILED';

                  return (
                    <motion.article
                      key={note.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.98 }}
                      whileHover={{ y: -6, boxShadow: `0 12px 30px ${T.primary}22` }}
                      style={{ ...noteCard, background: T.card, border: `1px solid ${isSuccess ? '#10b981' : T.border}` }}
                    >

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${T.border}44` }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${T.primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} color={T.primary} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Legacy of</div>
                          <div style={{ fontWeight: 700, color: T.primary }}>{note.owner_name}</div>
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <motion.div initial={{ scale: 0.9 }} animate={{ scale: isSuccess ? 1.05 : 1 }} transition={{ type: 'spring', stiffness: 220 }}>
                            {isSuccess ? <Unlock size={18} color="#10b981" /> : <Lock size={18} color={T.subText} />}
                          </motion.div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: T.subText }}>{note.category}</div>
                          <h4 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800 }}>{note.title}</h4>
                        </div>
                      </div>

                      {!isSuccess && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: 0.9 }}>
                            <Info size={14} color={T.primary} />
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Hint: {note.decryption_hint || 'No hint provided.'}</div>
                          </div>

                          <div style={{ position: 'relative', marginTop: 6 }}>
                            <Key size={14} style={{ position: 'absolute', left: 12, top: 12 }} color={T.subText} />
                            <input
                              type={isVisible ? 'text' : 'password'}
                              placeholder="Enter decryption key"
                              value={currentKey}
                              onChange={(e) => handleKeyChange(note.id, e.target.value)}
                              style={{ ...miniInputStyle, background: T.bg, color: T.text, borderColor: T.border }}
                            />
                            <button onClick={() => toggleVisibility(note.id)} style={{ position: 'absolute', right: 10, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: T.subText }}>
                              {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      )}

                      <motion.div layout style={{ ...decryptedBox, background: T.bg, borderColor: isSuccess ? '#10b98144' : T.border, color: decrypted === 'INVALID KEY' ? '#ef4444' : T.text, marginTop: 12 }}>
                        {currentKey ? (
                          <AnimatePresence>
                            <motion.div key={note.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>{String(decrypted)}</pre>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <button onClick={() => copyToClipboard(String(decrypted))} style={{ ...copyBtnStyle }}>
                                    <Copy size={14} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        ) : (
                          <div style={{ textAlign: 'center', padding: 10, color: T.subText }}>
                            <p style={{ fontSize: 12, margin: 0 }}>Content Locked</p>
                          </div>
                        )}
                      </motion.div>

                    </motion.article>
                  );
                })}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <footer style={{ marginTop: 32, textAlign: 'center', fontSize: 11, color: T.subText, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        End-to-End Encrypted · LASU CS Project 2026
      </footer>

    </motion.div>
  );
}

// Styles
const copyBtnStyle = { background: 'none', border: '1px solid', padding: 8, borderRadius: 8, cursor: 'pointer' };
const miniInputStyle = { width: '100%', padding: '10px 35px 10px 35px', borderRadius: '8px', border: '1px solid', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const containerStyle = { maxWidth: '760px', margin: '0 auto', padding: '40px 20px' };
const cardStyle = { padding: 'clamp(24px, 5vw, 32px)', borderRadius: '24px', background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' };
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', opacity: 0.6 };
const inputStyle = { width: '100%', padding: '14px 14px 14px 42px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.3s ease' };
const iconStyle = { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' };
const btnStyle = { width: '100%', padding: '14px', border: 'none', borderRadius: '12px', background: 'var(--primary)', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '16px', boxShadow: '0 10px 20px -10px var(--primary)', transition: 'transform 0.2s' };
const noteCard = { padding: 'clamp(16px, 4vw, 24px)', borderRadius: '20px', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' };
const decryptedBox = { padding: '16px', borderRadius: '12px', border: '1px solid', marginTop: '12px', minHeight: '54px' };

export default Claim;
