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
    setTimeout(() => setVisible(true), 100);
    const interval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, [T]);

  if (!T) return null; 

  return (
    <div style={{ ...rootStyle, background: 'var(--bg)', color: 'var(--text)' }}>
      
      {/* 1. THEME-DRIVEN INTERACTIVE CSS */}
      <style>{`
        .glass-card { 
          background: var(--glass-bg);
          backdrop-filter: blur(16px); 
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-premium);
          border-radius: 28px; 
          padding: 40px; 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover { 
          transform: translateY(-8px); 
          border-color: var(--primary); 
          box-shadow: 0 20px 40px -15px var(--primary-bg); 
        }

        .nav-btn {
          background: none; border: 1px solid var(--border); color: var(--text);
          padding: 10px 24px; border-radius: 12px; font-weight: 700; cursor: pointer;
          transition: all 0.3s ease;
        }
        .nav-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-bg); }

        .primary-btn { 
          border: none; color: #fff; padding: 14px 32px; border-radius: 12px; 
          font-weight: 800; cursor: pointer; transition: all 0.3s ease; 
          display: flex; align-items: center; gap: 8px; background: var(--primary);
        }
        .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -10px var(--primary); }

        .outline-btn {
          background: var(--glass-bg); border: 1px solid var(--border); color: var(--text);
          padding: 14px 32px; border-radius: 12px; font-weight: 700; cursor: pointer;
          transition: all 0.3s ease; display: flex; align-items: center; gap: 8px;
          backdrop-filter: blur(10px);
        }
        .outline-btn:hover { border-color: var(--primary); background: var(--primary-bg); transform: translateY(-2px); }

        .status-dot { 
          width: 8px; height: 8px; border-radius: 50%; background: #10b981; 
          display: inline-block; margin-right: 8px; 
          box-shadow: 0 0 10px #10b981; 
          opacity: ${pulse ? 1 : 0.4}; transition: opacity 1s ease; 
        }

        /* Ambient Glow Effect for Hero */
        .ambient-glow {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--primary-bg) 0%, transparent 70%);
          z-index: -1;
          pointer-events: none;
        }
      `}</style>

      {/* NAVIGATION */}
      <nav style={{ ...navStyle, background: 'var(--nav)', borderBottom: `1px solid var(--border)` }}>
        <div className="content-container" style={navInner}>
          <div style={logoStyle}>
            <Shield size={26} color="var(--primary)" />
            <span style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '-0.03em', color: 'var(--primary)' }}>Digital Legacy</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button onClick={() => navigate('/login')} className="nav-btn">
              Sign in
            </button>
            {!T.isMobile && (
              <button onClick={() => navigate('/register')} className="primary-btn">
                Get Started
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header style={heroSection}>
        <div className="ambient-glow"></div>
        <div className="content-container animate-in" style={{ animationDelay: '0.2s', position: 'relative' }}>
          <div style={{ ...tagStyle, color: 'var(--primary)', background: 'var(--primary-bg)', borderColor: 'var(--primary-bg)' }}>
            <span className="status-dot" /> System Active · 256-bit AES Protection
          </div>
          <h1 style={h1Style}>
            Because your digital life <br />
            <span style={{ color: 'var(--primary)' }}>is meant to last.</span>
          </h1>
          <p style={{ ...heroSub, color: 'var(--sub-text)' }}>
            Digital Legacy 1.0 is an autonomous safety net. We protect your credentials and 
            private messages, ensuring they reach the people you love—only when 
            you can no longer deliver them yourself.
          </p>
          
          {/* THE BUTTONS */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} className="primary-btn" style={{ padding: '18px 40px', fontSize: '16px' }}>
              Create Your Vault <ChevronRight size={20} />
            </button>
            <button onClick={() => navigate('/dashboard')} className="outline-btn" style={{ padding: '18px 40px', fontSize: '16px' }}>
              <LayoutDashboard size={20} /> Access Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* STORY SECTION */}
      <section style={{ padding: '100px 0', position: 'relative' }}>
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
              <div className="glass-card" style={{ textAlign: 'center', width: '100%', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary-bg)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
                <Key size={48} color="var(--primary)" style={{ marginBottom: '24px', position: 'relative' }} />
                <h4 style={{ margin: '0 0 12px 0', fontSize: '20px', position: 'relative' }}>Privacy is the Default</h4>
                <p style={{ fontSize: '15px', color: 'var(--sub-text)', lineHeight: '1.6', position: 'relative' }}>
                  Encryption happens on your device. We can't see your data, and neither 
                  can our servers. Your legacy remains truly yours until the moment it's released.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS SECTION */}
      <section style={{ padding: '120px 0', background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
        <div className="content-container">
          <p style={{ ...sectionLabel, textAlign: 'center' }}>Technical Pillars</p>
          <h2 style={{ ...sectionTitle, textAlign: 'center', marginBottom: '60px' }}>Security Without Compromise</h2>
          <div style={featureGrid}>
            {[
              { icon: <Lock size={28} />, title: 'Advanced Vault', desc: 'Securely store credentials and notes in an isolated, encrypted environment.' },
              { icon: <Activity size={28} />, title: 'Pulse Monitor', desc: 'A 97-day check-in system that ensures you are still in control of your legacy.' },
              { icon: <Users size={28} />, title: 'Trustee Handover', desc: 'Define exactly who gets access to what. You maintain total granular control.' },
              { icon: <EyeOff size={28} />, title: 'No Tracking', desc: 'Zero trackers, zero ads. A final year project built with a focus on pure user security.' }
            ].map((f, i) => (
              <div key={i} className="glass-card" style={{ padding: '32px' }}>
                <div style={{ color: 'var(--primary)', marginBottom: '24px', background: 'var(--primary-bg)', display: 'inline-flex', padding: '12px', borderRadius: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--sub-text)', lineHeight: '1.7' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '80px 0', borderTop: `1px solid var(--border)`, textAlign: 'center', background: 'var(--bg)' }}>
        <div className="content-container">
          <p style={{ fontSize: '12px', color: 'var(--sub-text)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Adewusi Ayomide Oluwasegun · Computer Science · LASU · 2026
          </p>
          <p style={{ fontSize: '12px', color: 'var(--sub-text)', marginTop: '10px' }}>
            Project Supervisor: Mrs. Omoyemi Olabisi Orioke
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── STYLE CONSTANTS (PROPERLY DEFINED) ──
const rootStyle = { width: '100%', minHeight: '100vh', display: 'block', overflowX: 'hidden', position: 'relative' };
const navStyle = { padding: '16px 0', position: 'sticky', top: 0, zIndex: 1000, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' };
const navInner = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' };
const logoStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
const heroSection = { padding: 'clamp(80px, 10vw, 140px) 0 clamp(60px, 8vw, 100px)', textAlign: 'center', position: 'relative' };
const tagStyle = { display: 'inline-flex', alignItems: 'center', padding: '8px 24px', borderRadius: '30px', fontSize: '13px', fontWeight: '800', marginBottom: '32px', border: '1px solid' };
const h1Style = { fontSize: 'clamp(2rem, 8vw, 5rem)', fontWeight: '900', lineHeight: '1.05', letterSpacing: '-0.04em', marginBottom: '24px' };
const heroSub = { fontSize: 'clamp(16px, 4vw, 19px)', maxWidth: '700px', margin: '0 auto 48px', lineHeight: '1.7' };
const storyGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(40px, 5vw, 80px)', alignItems: 'center' };
const sectionLabel = { fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '16px' };
const sectionTitle = { fontSize: '40px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.02em' };
const naturalBodyText = { fontSize: '17px', lineHeight: '1.8', color: 'var(--sub-text)', marginBottom: '24px' };
const visualContainer = { display: 'flex', justifyContent: 'center' };
const featureGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' };

export default Landing;