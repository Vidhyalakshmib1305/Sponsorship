// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import loginImg from '../assets/landing/login.png';

/* Bounce-in title letters */
function BounceTitle({ text }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', lineHeight: 1.05 }}>
      {text.split('\n').map((line, li) => (
        <div key={li} style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
          {line.split('').map((ch, ci) => (
            <span key={ci} style={{
              display:   'inline-block',
              fontFamily: "'Playfair Display', serif",
              fontSize:   'clamp(2.8rem, 5vw, 4rem)',
              fontWeight: 900,
              color:      '#fff',
              animation:  `letterBounceIn 0.7s cubic-bezier(.68,-0.55,.27,1.55) ${(li * 8 + ci) * 0.06}s both`,
            }}>{ch === ' ' ? ' ' : ch}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate           = useNavigate();
  const [mode,  setMode]   = useState('login');
  const [email, setEmail]  = useState('');
  const [pass,  setPass]   = useState('');
  const [err,   setErr]    = useState('');
  const [busy,  setBusy]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, pass);
        if (error) throw error;
        navigate('/app');
      } else {
        const { error } = await signUp(email, pass);
        if (error) throw error;
        navigate('/onboarding');
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0a0005' }}>

      {/* ── Left: image panel ── */}
      <div style={{
        flex: '1 1 55%', position: 'relative', background: '#0a0005',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <img
          src={loginImg}
          alt="Login visual"
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', position: 'absolute', inset: 0 }}
        />
        {/* Gradient taper on the right edge to blend into form panel */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,0,5,0) 60%, rgba(10,0,5,0.95) 100%)' }} />

        {/* Floating brand sparkles */}
        {['✦','◆','✧','◈','✦'].map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            top:  `${15 + i * 16}%`,
            left: `${8 + i * 14}%`,
            color: i % 2 === 0 ? 'rgba(255,215,0,0.5)' : 'rgba(255,69,0,0.4)',
            fontSize: '0.9rem',
            animation: `starFloat ${3 + i * 0.6}s ease-in-out ${i * 0.4}s infinite`,
            pointerEvents: 'none',
          }}>{s}</div>
        ))}

        {/* Tagline at bottom of image panel */}
        <div style={{ position: 'absolute', bottom: '2.5rem', left: '2.5rem', zIndex: 2 }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '0.5rem' }}>
            ✦ Sponsorship Prospector
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em', lineHeight: 1.7 }}>
            AI finds brands.<br />You close deals.
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div style={{
        flex: '0 0 420px', maxWidth: '100%',
        background: '#0a0005',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem 2.5rem',
        position: 'relative',
      }}>
        {/* Subtle top glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '300px', height: '200px', background: 'radial-gradient(ellipse, rgba(255,69,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: '320px' }}>
          {/* Logo mark */}
          <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '1.5rem', animation: 'letterBounceIn 0.6s cubic-bezier(.68,-0.55,.27,1.55) 0s both' }}>
            Sponsorship Prospector
          </div>

          {/* Bouncing title */}
          <div style={{ marginBottom: '2.5rem' }}>
            <BounceTitle text={mode === 'login' ? 'WELCOME\nBACK' : 'GET\nSTARTED'} />
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginTop: '0.75rem' }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="email" required placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '1rem', fontSize: '13px', color: '#f5f0e8', fontFamily: "'Space Mono', monospace", outline: 'none', transition: 'border-color 0.15s', letterSpacing: '0.05em' }}
              onFocus={e  => e.target.style.borderColor = '#FF4500'}
              onBlur={e   => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <input
              type="password" required placeholder="Password"
              value={pass} onChange={e => setPass(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '1rem', fontSize: '13px', color: '#f5f0e8', fontFamily: "'Space Mono', monospace", outline: 'none', transition: 'border-color 0.15s', letterSpacing: '0.05em' }}
              onFocus={e  => e.target.style.borderColor = '#FF4500'}
              onBlur={e   => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />

            {err && <p style={{ color: '#FF4500', fontSize: '11px', letterSpacing: '0.08em', fontFamily: "'Space Mono', monospace", margin: 0 }}>{err}</p>}

            <button
              type="submit" disabled={busy}
              style={{
                background: '#FF4500', color: '#0a0005', border: 'none',
                padding: '1rem', fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.28em', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer',
                fontFamily: "'Space Mono', monospace", opacity: busy ? 0.5 : 1,
                transition: 'all 0.15s',
                marginTop: '0.25rem',
              }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.animation = 'squashStretch 0.45s cubic-bezier(.68,-0.55,.27,1.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.animation = 'none'; }}
            >
              {busy ? '...' : mode === 'login' ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); }}
              style={{ background: 'none', border: 'none', fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Space Mono', monospace", transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#FF4500'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
            >
              {mode === 'login' ? 'New here? Create account →' : 'Already have an account? Sign in →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
