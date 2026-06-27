// frontend/src/pages/Landing.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImg from '../assets/landing/hero.png';

/* ── Cursor sparkle trail (canvas) ── */
function CursorTrail() {
  const canvasRef = useRef(null);
  const sparks    = useRef([]);
  const raf       = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e) => {
      for (let i = 0; i < 5; i++) {
        sparks.current.push({
          x:     e.clientX + (Math.random() - 0.5) * 14,
          y:     e.clientY + (Math.random() - 0.5) * 14,
          vx:    (Math.random() - 0.5) * 2.5,
          vy:    -Math.random() * 2.5 - 0.5,
          life:  1,
          size:  Math.random() * 5 + 2,
          gold:  Math.random() > 0.4,
          star:  Math.random() > 0.5,
        });
      }
    };
    window.addEventListener('mousemove', onMove);

    const drawStar = (ctx, x, y, r) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a   = (i * Math.PI) / 5 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.45;
        const fn  = i === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](x + rad * Math.cos(a), y + rad * Math.sin(a));
      }
      ctx.closePath();
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks.current = sparks.current.filter(s => s.life > 0.05);
      for (const s of sparks.current) {
        ctx.globalAlpha = s.life * 0.9;
        ctx.fillStyle   = s.gold ? '#FFD700' : '#FF4500';
        if (s.star) { drawStar(ctx, s.x, s.y, s.size); ctx.fill(); }
        else { ctx.beginPath(); ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2); ctx.fill(); }
        s.x    += s.vx;
        s.y    += s.vy;
        s.vy   += 0.08;
        s.life -= 0.045;
        s.size *= 0.96;
      }
      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 9999,
    }} />
  );
}

/* ── Bounce-in letters ── */
function BounceLetters({ text, baseDelay = 0, gold = false, style = {} }) {
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', ...style }}>
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          display:   'inline-block',
          animation: `letterBounceIn 0.75s cubic-bezier(.68,-0.55,.27,1.55) ${baseDelay + i * 0.055}s both`,
          color:     gold ? '#FFD700' : undefined,
          textShadow: gold ? '0 0 28px rgba(255,215,0,0.55), 0 2px 12px rgba(0,0,0,0.6)' : '0 2px 16px rgba(0,0,0,0.7)',
        }}>{ch === ' ' ? ' ' : ch}</span>
      ))}
    </span>
  );
}

/* ── Wave-on-hover logo ── */
function WaveLogo({ text, size = '1.5rem' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      style={{ fontFamily: "'Playfair Display', serif", fontSize: size, fontWeight: 900, color: '#fff', cursor: 'default', display: 'inline-block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          display:   'inline-block',
          animation: hovered ? `waveChar 0.5s ease-in-out ${i * 0.06}s infinite` : 'none',
        }}>{ch}</span>
      ))}
    </span>
  );
}

/* ── Spring-up on scroll ── */
function SpringSection({ children, delay = 0, style = {} }) {
  const ref     = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      animation: vis ? `springUp 0.85s cubic-bezier(.68,-0.55,.27,1.55) ${delay}s both` : 'none',
      opacity:   vis ? undefined : 0,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Count-up hook ── */
function useCountUp(target, duration = 1300, active = false) {
  const [val,    setVal]    = useState(0);
  const [wobble, setWobble] = useState(false);
  const done = useRef(false);
  useEffect(() => {
    if (!active || done.current || !target) return;
    done.current = true;
    const t0 = Date.now();
    const tick = () => {
      const pct  = Math.min((Date.now() - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(ease * target));
      if (pct < 1) { requestAnimationFrame(tick); }
      else {
        setVal(target);
        setWobble(true);
        setTimeout(() => setWobble(false), 600);
      }
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return [val, wobble];
}

/* ── Data ── */
const FEATURES = [
  { icon: '🔍', title: 'AI Brand Discovery',    desc: 'Scans 10,000+ brands and surfaces the ones most likely to say YES to your niche and audience.' },
  { icon: '🎯', title: 'Fit Scoring',            desc: 'Every brand gets a 0-100 fit score based on your content style, audience, and engagement rate.' },
  { icon: '✍️', title: 'Personalized Pitches',   desc: 'AI writes a unique email for each brand — no templates, no copy-paste, no cringe.' },
  { icon: '🎞', title: 'Cinematic Pitch Pages',  desc: 'Deployed pages that showcase your film-roll content in a layout brands actually stop to look at.' },
  { icon: '📊', title: 'Audience Analytics',     desc: 'Real engagement stats presented beautifully — so brands see the numbers that make them convert.' },
  { icon: '🚀', title: 'One-Click Pipeline',     desc: 'Hit RUN. In under 3 minutes: 20 brand leads, 20 emails, 20 pitch pages. All done.' },
];

const HOW_STEPS = [
  { n: '01', title: 'Connect Your Profile', desc: 'Drop in your Instagram handle. We pull your stats, audience data, and best content automatically.' },
  { n: '02', title: 'Run the Pipeline',     desc: 'One click. AI scouts brands, scores each one, writes pitches, and builds your pages in minutes.' },
  { n: '03', title: 'Pitch & Get Paid',     desc: 'Send the emails, track who views your page, follow up — and close your next brand deal.' },
];

const PLANS = [
  { name: 'Free',    price: 0,  features: ['1 pipeline run/month', '3 pitch pages', 'Basic analytics'],                         cta: 'Start Free',    featured: false },
  { name: 'Starter', price: 19, features: ['10 runs/month', '25 pitch pages', 'Full analytics', 'Email templates'],             cta: 'Get Starter →', featured: true },
  { name: 'Pro',     price: 49, features: ['Unlimited runs', 'Unlimited pages', 'Priority support', 'White-label ready'],       cta: 'Go Pro →',      featured: false },
];

/* ── Main component ── */
export default function Landing() {
  const navigate = useNavigate();

  /* DEAL dart animation */
  const [dartAnim, setDartAnim] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setDartAnim(true);
      setTimeout(() => setDartAnim(false), 1400);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  /* Stats count-up on scroll */
  const statsRef    = useRef(null);
  const [statsVis, setStatsVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsVis(true); obs.disconnect(); }
    }, { threshold: 0.4 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);
  const [s1, w1] = useCountUp(2847, 1200, statsVis);
  const [s2, w2] = useCountUp(94,   900,  statsVis);
  const [s3, w3] = useCountUp(3,    700,  statsVis);

  /* Pricing count-up on scroll */
  const priceRef    = useRef(null);
  const [priceVis, setPriceVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setPriceVis(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (priceRef.current) obs.observe(priceRef.current);
    return () => obs.disconnect();
  }, []);
  const [p0,  wp0]  = useCountUp(0,  300, priceVis);
  const [p19, wp19] = useCountUp(19, 900, priceVis);
  const [p49, wp49] = useCountUp(49, 1100, priceVis);
  const priceVals   = [p0, p19, p49];
  const priceWobs   = [wp0, wp19, wp49];

  const go = useCallback(() => navigate('/login'), [navigate]);

  const squashProps = {
    onMouseEnter: e => { e.currentTarget.style.animation = 'squashStretch 0.45s cubic-bezier(.68,-0.55,.27,1.55)'; },
    onMouseLeave: e => { e.currentTarget.style.animation = 'none'; },
  };

  return (
    <>
      <CursorTrail />
      <div style={{ background: '#0a0005', color: '#f5f0e8', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* ── NAV ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2.5rem',
          background: 'rgba(10,0,5,0.88)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace" }}>✦</span>
            <WaveLogo text="PROSPECTOR" size="1.25rem" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={go} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Space Mono', monospace", transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
              Sign in
            </button>
            <button onClick={go} style={{ background: '#FF4500', color: '#0a0005', border: 'none', padding: '0.65rem 1.4rem', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Space Mono', monospace", transition: 'all 0.15s', boxShadow: '0 0 20px rgba(255,69,0,0.35)' }} {...squashProps}>
              GET STARTED →
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4.5rem' }}>
          {/* Image — fully visible, letterboxed */}
          <div style={{ position: 'absolute', inset: 0, background: '#0a0005', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={heroImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
            {/* Dark halos: top (text zone) + bottom */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,0,5,0.82) 0%, rgba(10,0,5,0.18) 35%, rgba(10,0,5,0.08) 55%, rgba(10,0,5,0.65) 100%)' }} />
          </div>

          {/* Floating sparkle elements */}
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top:  `${8 + i * 9}%`,
              left: `${4 + (i * 13) % 88}%`,
              fontSize: `${0.9 + (i % 3) * 0.3}rem`,
              color:     i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FF4500' : 'rgba(255,255,255,0.5)',
              animation: `starFloat ${2.8 + i * 0.55}s ease-in-out ${i * 0.38}s infinite`,
              zIndex: 2, pointerEvents: 'none',
            }}>
              {['✦', '✧', '◆', '✦', '✧', '◈', '✦', '◆', '✧'][i]}
            </div>
          ))}

          {/* Hero text — top-third safe zone */}
          <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 1.5rem', marginTop: '-8vh', maxWidth: '900px' }}>
            {/* Radial dark halo behind text */}
            <div style={{ position: 'absolute', top: '-4rem', left: '-8rem', right: '-8rem', bottom: '-3rem', background: 'radial-gradient(ellipse 80% 100%, rgba(10,0,5,0.78) 30%, transparent 80%)', zIndex: -1, borderRadius: '50%' }} />

            <div style={{ fontSize: '9px', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '1.2rem', animation: 'letterBounceIn 0.6s cubic-bezier(.68,-0.55,.27,1.55) 0s both' }}>
              Sponsorship Prospector
            </div>

            <h1 style={{ margin: '0 0 0.1em', fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(2.8rem, 8vw, 6rem)', lineHeight: 1.0, userSelect: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 0.25em' }}>
                {['FIND', 'YOUR', 'NEXT'].map((word, wi) => (
                  <BounceLetters key={wi} text={word} baseDelay={wi * 0.22} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 0.25em', marginTop: '0.05em' }}>
                <BounceLetters text="BRAND" baseDelay={0.66} />
                {/* DEAL — darts away every 8s */}
                <span
                  style={{
                    display:   'inline-flex',
                    color:     '#FFD700',
                    textShadow: '0 0 32px rgba(255,215,0,0.65)',
                    animation: dartAnim
                      ? 'dartOut 1.4s cubic-bezier(.68,-0.55,.27,1.55) both'
                      : 'letterBounceIn 0.75s cubic-bezier(.68,-0.55,.27,1.55) 0.88s both',
                  }}
                  title="Click me if you can! 😄"
                >
                  {'DEAL'.split('').map((ch, ci) => (
                    <span key={ci} style={{ display: 'inline-block' }}>{ch}</span>
                  ))}
                </span>
              </div>
            </h1>

            <p style={{ margin: '1.5rem auto 2rem', maxWidth: '440px', fontSize: '0.82rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em' }}>
              AI finds brands, writes pitches, builds pages.<br />You close deals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <button onClick={go} style={{
                background: '#FF4500', color: '#0a0005', border: 'none',
                padding: '1.1rem 3rem', fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.28em', textTransform: 'uppercase', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace",
                boxShadow: '0 0 40px rgba(255,69,0,0.5), 0 4px 24px rgba(0,0,0,0.4)',
                transition: 'box-shadow 0.2s',
              }} {...squashProps}>
                GET STARTED FREE →
              </button>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>
                No credit card · 1 free pipeline run
              </span>
            </div>
          </div>

          {/* Scroll nudge */}
          <div style={{ position: 'absolute', bottom: '1.8rem', left: '50%', transform: 'translateX(-50%)', zIndex: 3, animation: 'pulseFade 2s ease-in-out infinite', color: 'rgba(255,255,255,0.28)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>
            scroll ↓
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section ref={statsRef} style={{ background: 'rgba(255,69,0,0.06)', borderTop: '1px solid rgba(255,69,0,0.18)', borderBottom: '1px solid rgba(255,69,0,0.18)', padding: '2.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', textAlign: 'center', gap: '1rem' }}>
          {[
            { v: s1, w: w1, suffix: '+',    label: 'Brands analyzed' },
            { v: s2, w: w2, suffix: '/100', label: 'Avg fit score' },
            { v: s3, w: w3, suffix: ' min', label: 'Minutes to pitch-ready' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize:   'clamp(2.2rem, 6vw, 3.8rem)',
                fontWeight: 900, color: '#FF4500', lineHeight: 1,
                animation:  s.w ? 'countWobble 0.55s cubic-bezier(.68,-0.55,.27,1.55)' : 'none',
              }}>
                {s.v.toLocaleString()}<span style={{ fontSize: '0.55em', color: 'rgba(255,255,255,0.3)' }}>{s.suffix}</span>
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono', monospace", marginTop: '0.5rem' }}>
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <SpringSection style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '0.75rem' }}>What you get</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', margin: 0 }}>Everything in one pipeline</h2>
          </SpringSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
            {FEATURES.map((f, i) => (
              <SpringSection key={i} delay={i * 0.07}>
                <div
                  style={{ background: '#0a0005', padding: '2rem', height: '100%', borderLeft: '2px solid transparent', transition: 'all 0.2s', cursor: 'default' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderLeftColor = '#FF4500';
                    e.currentTarget.style.background      = 'rgba(255,69,0,0.05)';
                    e.currentTarget.style.animation       = 'wobble 0.55s ease-in-out';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderLeftColor = 'transparent';
                    e.currentTarget.style.background      = '#0a0005';
                    e.currentTarget.style.animation       = 'none';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{f.icon}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{f.title}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.8, fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em' }}>{f.desc}</div>
                </div>
              </SpringSection>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <SpringSection style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '0.75rem' }}>The process</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', margin: 0 }}>How it works</h2>
            </SpringSection>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
              {HOW_STEPS.map((s, i) => (
                <SpringSection key={i} delay={i * 0.14}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize:   'clamp(5rem, 12vw, 8rem)',
                      fontWeight: 900,
                      color:      'rgba(255,69,0,0.14)',
                      lineHeight: 1, flexShrink: 0, width: '8rem', textAlign: 'center',
                      textShadow: '0 0 60px rgba(255,69,0,0.1)',
                    }}>{s.n}</div>
                    <div style={{ paddingTop: '1.8rem' }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.45rem', fontWeight: 700, color: '#fff', margin: '0 0 0.6rem' }}>{s.title}</h3>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.85, fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em', margin: 0 }}>{s.desc}</p>
                    </div>
                  </div>
                </SpringSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section ref={priceRef} style={{ padding: '6rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
          <SpringSection style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '0.75rem' }}>Pricing</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', margin: 0 }}>Simple, honest pricing</h2>
          </SpringSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
            {PLANS.map((p, i) => (
              <SpringSection key={i} delay={i * 0.1}>
                <div style={{
                  background: p.featured ? 'rgba(255,69,0,0.07)' : '#0a0005',
                  padding: '2.5rem 2rem', height: '100%',
                  border:  p.featured ? '1px solid rgba(255,69,0,0.35)' : '1px solid transparent',
                  position: 'relative',
                }}>
                  {p.featured && (
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%) translateY(-50%)', background: '#FF4500', color: '#0a0005', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.25rem 1rem', fontFamily: "'Space Mono', monospace", whiteSpace: 'nowrap' }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Mono', monospace", marginBottom: '1rem' }}>{p.name}</div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                    fontWeight: 900, color: p.featured ? '#FFD700' : '#fff', lineHeight: 1, marginBottom: '0.25rem',
                    animation: priceWobs[i] ? 'countWobble 0.55s cubic-bezier(.68,-0.55,.27,1.55)' : 'none',
                  }}>
                    ${priceVals[i]}<span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.28)', fontFamily: "'Space Mono', monospace" }}>/mo</span>
                  </div>
                  <div style={{ margin: '1.5rem 0 2rem' }}>
                    {p.features.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontFamily: "'Space Mono', monospace" }}>
                        <span style={{ color: '#FF4500', flexShrink: 0 }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <button onClick={go} style={{
                    width: '100%', padding: '0.9rem',
                    background: p.featured ? '#FF4500' : 'transparent',
                    border: p.featured ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    color:  p.featured ? '#0a0005' : 'rgba(255,255,255,0.55)',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: "'Space Mono', monospace", transition: 'all 0.15s',
                  }} {...squashProps}
                    onMouseEnter={e => { e.currentTarget.style.animation = 'squashStretch 0.45s cubic-bezier(.68,-0.55,.27,1.55)'; if (!p.featured) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.animation = 'none'; if (!p.featured) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  >
                    {p.cta}
                  </button>
                </div>
              </SpringSection>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <SpringSection style={{ margin: '0 2rem 6rem', background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.25)', padding: '4rem 3rem', textAlign: 'center', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '1rem' }}>Ready to start?</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', margin: '0 0 1rem' }}>
            Your next brand deal is<br />
            <span style={{ color: '#FFD700' }}>3 minutes away.</span>
          </h2>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em', marginBottom: '2rem' }}>
            Free forever. No credit card. Start right now.
          </p>
          <button onClick={go} style={{
            background: '#FF4500', color: '#0a0005', border: 'none',
            padding: '1.1rem 3.5rem', fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.28em', textTransform: 'uppercase', cursor: 'pointer',
            fontFamily: "'Space Mono', monospace",
            boxShadow: '0 0 40px rgba(255,69,0,0.5)',
          }} {...squashProps}>
            GET STARTED FREE →
          </button>
        </SpringSection>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ color: '#FF4500', fontSize: '9px' }}>✦</span>
            <WaveLogo text="PROSPECTOR" size="1.15rem" />
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>
            © 2024 Sponsorship Prospector
          </div>
          <button onClick={go} style={{ background: 'none', border: '1px solid rgba(255,69,0,0.35)', color: '#FF4500', padding: '0.5rem 1.25rem', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Space Mono', monospace", transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,69,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Sign in →
          </button>
        </footer>

      </div>
    </>
  );
}
