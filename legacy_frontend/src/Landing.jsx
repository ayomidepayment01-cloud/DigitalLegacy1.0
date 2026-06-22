import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext'; 
import { 
  Shield, Lock, Heart, Users, Mail, ChevronRight, 
  Activity, CheckCircle, Key, EyeOff, LayoutDashboard
} from './icons';

function Landing() {
  const navigate = useNavigate();
  const T = useTheme(); 
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (!T) return;
    
    document.body.style.backgroundColor = T.bg;
    document.body.style.transition = "background-color 0.4s ease";
    setTimeout(() => setVisible(true), 100);
    
    const interval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, [T]);

  if (!T) return null; 

  return (
    <div style={{ ...rootStyle, background: T.bg, color: T.text }}>
      
      {/* 1. THEME-DRIVEN INTERACTIVE CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif !important; box-sizing: border-box; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }

        .glass-card { 
          background: ${T.isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)'};
          backdrop-filter: blur(12px); 
          border: 1px solid ${T.border};
          border-radius: 28px; 
          padding: 40px; 
          transition: all 0.3s ease;
        }
        .glass-card:hover { transform: translateY(-8px); border-color: ${T.primary}; box-shadow: 0 20px 40px -15px ${T.primary}22; }

        .nav-btn {
          background: none; border: 1px solid ${T.border}; color: ${T.text};
          padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer;
          transition: all 0.3s ease;
        }
        .nav-btn:hover { border-color: ${T.primary}; color: ${T.primary}; background: ${T.primary}05; }

        .primary-btn { 
          border: none; color: #fff; padding: 14px 32px; border-radius: 12px; 
          font-weight: 800; cursor: pointer; transition: all 0.3s ease; 
          display: flex; align-items: center; gap: 8px; 
        }
        .primary-btn:hover { transform: scale(1.03); box-shadow: 0 10px 20px ${T.primary}44; }

        .outline-btn {
          background: none; border: 1px solid ${T.border}; color: ${T.text};
          padding: 14px 32px; border-radius: 12px; font-weight: 700; cursor: pointer;
          transition: all 0.3s ease; display: flex; align-items: center; gap: 8px;
        }
        .outline-btn:hover { border-color: ${T.primary}; background: ${T.primary}05; transform: scale(1.03); }

        .status-dot { 
          width: 8px; height: 8px; border-radius: 50%; background: #10b981; 
          display: inline-block; margin-right: 8px; 
          box-shadow: 0 0 10px #10b981; 
          opacity: ${pulse ? 1 : 0.4}; transition: opacity 1s ease; 
        }
      `}</style>

      {/* NAVIGATION */}
      <nav style={{ ...navStyle, background: T.nav, borderBottom: `1px solid ${T.border}` }}>
        <div className="content-container" style={navInner}>
          <div style={logoStyle}>
            <Shield size={24} color={T.primary} />
            <span style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '-0.03em' }}>Digital Legacy</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button onClick={() => navigate('/login')} className="nav-btn">
              Sign in
            </button>
            {!T.isMobile && (
              <button onClick={() => navigate('/register')} className="primary-btn" style={{ background: T.primary }}>
                Get Started
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header style={heroSection}>
        <div className="content-container animate-in" style={{ animationDelay: '0.2s' }}>
          <div style={{ ...tagStyle, color: T.primary, background: `${T.primary}10`, borderColor: `${T.primary}20` }}>
            <span className="status-dot" /> System Active · 256-bit AES Protection
          </div>
          <h1 style={h1Style}>
            Because your digital life <br />
            <span style={{ color: T.primary }}>is meant to last.</span>
          </h1>
          <p style={{ ...heroSub, color: T.subText }}>
            Digital Legacy 1.0 is an autonomous safety net. We protect your credentials and 
            private messages, ensuring they reach the people you love—only when 
            you can no longer deliver them yourself.
          </p>
          
          {/* THE BUTTONS */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} className="primary-btn" style={{ background: T.primary, padding: '18px 40px', fontSize: '16px' }}>
              Create Your Vault <ChevronRight size={20} />
            </button>
            <button onClick={() => navigate('/dashboard')} className="outline-btn" style={{ padding: '18px 40px', fontSize: '16px' }}>
              <LayoutDashboard size={20} /> Access Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* STORY SECTION */}
      <section style={{ padding: '100px 0' }}>
        <div className="content-container">
          <div style={storyGrid}>
            <div className="animate-in" style={{ animationDelay: '0.4s' }}>
              <p style={sectionLabel}>The Reality</p>
              <h2 style={sectionTitle}>Closing the Inheritance Gap</h2>
              <p style={naturalBodyText}>
                We live our lives online, yet we rarely plan for the "what if." 
                When a person passes away, their digital assets—years of photos, 
                financial accounts, or crypto wallets—often vanish because nobody has the keys.
              </p>
              <p style={naturalBodyText}>
                DL1.0 acts as a <strong>Dead Man’s Switch</strong>. It's a silent 
                guardian that waits for your signal. If that signal stops, it 
                autonomously bridges the gap between you and your heirs.
              </p>
            </div>
            <div className="animate-in" style={{ ...visualContainer, animationDelay: '0.6s' }}>
              <div className="glass-card" style={{ textAlign: 'center', width: '100%' }}>
                <Key size={48} color={T.primary} style={{ marginBottom: '20px' }} />
                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Privacy is the Default</h4>
                <p style={{ fontSize: '14px', color: T.subText, lineHeight: '1.6' }}>
                  Encryption happens on your device. We can't see your data, and neither 
                  can our servers. Your legacy remains truly yours until the moment it's released.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS SECTION */}
      <section style={{ padding: '100px 0', background: T.card }}>
        <div className="content-container">
          <p style={{ ...sectionLabel, textAlign: 'center' }}>Technical Pillars</p>
          <h2 style={{ ...sectionTitle, textAlign: 'center', marginBottom: '60px' }}>Security Without Compromise</h2>
          <div style={featureGrid}>
            {[
              { icon: <Lock size={24} />, title: 'Advanced Vault', desc: 'Securely store credentials and notes in an isolated, encrypted environment.' },
              { icon: <Activity size={24} />, title: 'Pulse Monitor', desc: 'A 97-day check-in system that ensures you are still in control of your legacy.' },
              { icon: <Users size={24} />, title: 'Trustee Handover', desc: 'Define exactly who gets access to what. You maintain total granular control.' },
              { icon: <EyeOff size={24} />, title: 'No Tracking', desc: 'Zero trackers, zero ads. A final year project built with a focus on pure user security.' }
            ].map((f, i) => (
              <div key={i} className="glass-card">
                <div style={{ color: T.primary, marginBottom: '20px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: T.subText, lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '80px 0', borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
        <div className="content-container">
          <p style={{ fontSize: '12px', color: T.subText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Adewusi Ayomide Oluwasegun · Computer Science · LASU · 2026
          </p>
          <p style={{ fontSize: '12px', color: T.subText, marginTop: '10px' }}>
            Project Supervisor: Mrs. Omoyemi Olabisi Orioke
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── STYLE CONSTANTS (PROPERLY DEFINED) ──
const rootStyle = { width: '100%', minHeight: '100vh', display: 'block', overflowX: 'hidden' };
const navStyle = { padding: '12px 0', position: 'sticky', top: 0, zIndex: 1000, backdropFilter: 'blur(12px)' };
const navInner = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' };
const logoStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
const heroSection = { padding: '120px 0 80px', textAlign: 'center' };
const tagStyle = { display: 'inline-flex', alignItems: 'center', padding: '8px 20px', borderRadius: '30px', fontSize: '12px', fontWeight: '800', marginBottom: '32px', border: '1px solid' };
const h1Style = { fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: '900', lineHeight: '1.05', letterSpacing: '-0.04em', marginBottom: '24px' };
const heroSub = { fontSize: '18px', maxWidth: '750px', margin: '0 auto 48px', lineHeight: '1.7' };
const storyGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center' };
const sectionLabel = { fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.15em', marginBottom: '16px' };
const sectionTitle = { fontSize: '36px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.02em' };
const naturalBodyText = { fontSize: '17px', lineHeight: '1.8', color: '#64748b', marginBottom: '24px' };
const visualContainer = { display: 'flex', justifyContent: 'center' };
const featureGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '30px' };

export default Landing;