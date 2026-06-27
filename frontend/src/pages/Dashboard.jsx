// frontend/src/pages/Dashboard.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import dashImg from '../assets/landing/dashboard.png';

const STATUS_MESSAGES = [
  'Finding brands matching your profile...',
  'Scoring 20 brands for fit and audience match...',
  'Writing personalized pitch emails...',
  'Building cinematic pitch pages...',
  'Deploying to Render...',
  'Almost done...',
];

const PLANS = {
  free:    { label: 'Free',    price: '$0',   runs: '1 run/mo',    pitches: '3 pages' },
  starter: { label: 'Starter', price: '$19',  runs: '10 runs/mo',  pitches: '25 pages' },
  pro:     { label: 'Pro',     price: '$49',  runs: 'Unlimited',   pitches: 'Unlimited' },
  agency:  { label: 'Agency',  price: '$149', runs: '5 profiles',  pitches: 'White-label' },
};

/* Bounce-in letters */
function BounceLetters({ text, baseDelay = 0, style = {} }) {
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', ...style }}>
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          display:   'inline-block',
          animation: `letterBounceIn 0.7s cubic-bezier(.68,-0.55,.27,1.55) ${baseDelay + i * 0.06}s both`,
          color:     'inherit',
          textShadow: '0 2px 16px rgba(0,0,0,0.8)',
        }}>{ch}</span>
      ))}
    </span>
  );
}

/* Count-up hook */
function useCountUp(target, duration = 1200, active = false) {
  const [val,    setVal]    = useState(0);
  const [wobble, setWobble] = useState(false);
  const done = useRef(false);
  useEffect(() => {
    if (!active || done.current || target == null) return;
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
        setTimeout(() => setWobble(false), 700);
      }
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return [val, wobble];
}

export default function Dashboard() {
  const { user }               = useAuth();
  const [creator, setCreator]  = useState(null);
  const [stats,   setStats]    = useState(null);
  const [pitches, setPitches]  = useState([]);
  const [running, setRunning]  = useState(false);
  const [runMsg,  setRunMsg]   = useState('');
  const [runId,   setRunId]    = useState(null);
  const [success, setSuccess]  = useState('');
  const [runError,setRunError] = useState('');
  const pollRef                = useRef(null);
  const msgIdxRef              = useRef(0);

  /* Stats visibility for count-up */
  const statsRef   = useRef(null);
  const [statsVis, setStatsVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsVis(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    Promise.all([api.getCreator(), api.getStats(), api.getPitches()])
      .then(([c, s, p]) => { setCreator(c); setStats(s); setPitches(p.pitches || []); })
      .catch(() => {});
  }, []);

  const profileComplete = creator?.instagram_handle && creator?.primary_niche && creator?.instagram_followers;

  async function startPipeline() {
    setRunning(true); setRunMsg(STATUS_MESSAGES[0]);
    setSuccess(''); setRunError('');
    msgIdxRef.current = 0;
    try {
      const res = await api.runPipeline({});
      setRunId(res.run_id);
      const msgInterval = setInterval(() => {
        msgIdxRef.current = Math.min(msgIdxRef.current + 1, STATUS_MESSAGES.length - 1);
        setRunMsg(STATUS_MESSAGES[msgIdxRef.current]);
      }, 20000);
      pollRef.current = setInterval(async () => {
        try {
          const status = await api.getPipelineStatus(res.run_id);
          if (status.status === 'completed') {
            clearInterval(pollRef.current); clearInterval(msgInterval);
            setRunning(false); setRunMsg('');
            const count = status.pitches_sent || 0;
            setSuccess(`${count} pitch page${count !== 1 ? 's' : ''} ready to send!`);
            const [s, p] = await Promise.all([api.getStats(), api.getPitches()]);
            setStats(s); setPitches(p.pitches || []);
          } else if (status.status === 'failed') {
            clearInterval(pollRef.current); clearInterval(msgInterval);
            setRunning(false); setRunMsg('');
            setRunError(status.error || 'Pipeline failed — please try again');
          }
        } catch {}
      }, 5000);
    } catch (e) { setRunning(false); setRunMsg(''); setRunError(e.message); }
  }

  useEffect(() => () => clearInterval(pollRef.current), []);

  const recentPitches = pitches.slice(0, 3);
  const plan     = creator?.plan || 'free';
  const planInfo = PLANS[plan] || PLANS.free;

  /* Count-up values */
  const [cBrands, wBrands] = useCountUp(stats?.total_brands,  1100, statsVis && !!stats);
  const [cPitch,  wPitch]  = useCountUp(stats?.pitches_ready, 1000, statsVis && !!stats);
  const [cScore,  wScore]  = useCountUp(stats?.avg_fit_score, 900,  statsVis && !!stats);
  const [cRuns,   wRuns]   = useCountUp(stats?.total_runs,    800,  statsVis && !!stats);

  const statItems = stats ? [
    { label: 'Brands found',  val: cBrands, wobble: wBrands, unit: '' },
    { label: 'Pitches ready', val: cPitch,  wobble: wPitch,  unit: '' },
    { label: 'Avg fit score', val: cScore,  wobble: wScore,  unit: '/100' },
    { label: 'Pipeline runs', val: cRuns,   wobble: wRuns,   unit: '' },
  ] : [];

  const titleText = creator?.instagram_handle ? `@${creator.instagram_handle}` : 'DASHBOARD';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0005' }}>

      {/* ── Header Banner ── */}
      <div style={{ position: 'relative', height: '260px', background: '#0a0005', overflow: 'hidden', flexShrink: 0 }}>
        <img src={dashImg} alt="Dashboard banner" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
        {/* Dark gradient bottom-biased — text safe zone */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,0,5,0.08) 0%, rgba(10,0,5,0.55) 55%, rgba(10,0,5,0.97) 100%)' }} />

        {/* Sparkle accents */}
        {['✦','◆','✧'].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: `${20 + i * 22}%`, right: `${8 + i * 6}%`, color: i === 0 ? 'rgba(255,215,0,0.35)' : 'rgba(255,69,0,0.3)', fontSize: '0.8rem', animation: `starFloat ${3 + i * 0.7}s ease-in-out ${i * 0.5}s infinite`, pointerEvents: 'none' }}>{s}</div>
        ))}

        {/* Title in bottom-third safe zone */}
        <div style={{ position: 'absolute', bottom: '1.5rem', left: '2rem', right: '2rem' }}>
          {/* Halo behind text */}
          <div style={{ position: 'absolute', bottom: '-0.5rem', left: '-1rem', right: '-1rem', height: '5rem', background: 'radial-gradient(ellipse 80% 100%, rgba(10,0,5,0.7) 30%, transparent 80%)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '0.4rem', animation: 'letterBounceIn 0.6s cubic-bezier(.68,-0.55,.27,1.55) 0s both' }}>
              Welcome back
            </div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', lineHeight: 1, display: 'flex', flexWrap: 'wrap' }}>
              <BounceLetters text={titleText} baseDelay={0.1} />
            </h1>
            {creator && (
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginTop: '0.35rem', animation: 'springUp 0.7s cubic-bezier(.68,-0.55,.27,1.55) 0.4s both' }}>
                {creator.primary_niche} creator · {Number(creator.instagram_followers || 0).toLocaleString()} followers · {creator.audience_location}
                <span style={{ marginLeft: '0.75rem', padding: '0.1rem 0.5rem', border: `1px solid ${plan === 'pro' ? 'rgba(255,69,0,0.5)' : plan === 'starter' ? 'rgba(234,179,8,0.4)' : 'rgba(255,255,255,0.2)'}`, color: plan === 'pro' ? '#FF4500' : plan === 'starter' ? '#FBBF24' : 'rgba(255,255,255,0.3)', fontSize: '9px' }}>
                  {planInfo.label}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="p-8 max-w-5xl">

        {creator && <ProfileFreshness updatedAt={creator.updated_at} />}

        {/* Stats */}
        {stats && (
          <div ref={statsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '2rem' }}>
            {statItems.map(s => (
              <div key={s.label} style={{ background: '#0a0005', padding: '1.5rem' }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '2.25rem', fontWeight: 900, color: '#FF4500', lineHeight: 1, marginBottom: '0.5rem',
                  animation: s.wobble ? 'countWobble 0.6s cubic-bezier(.68,-0.55,.27,1.55)' : 'none',
                }}>
                  {s.val || 0}<span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.28)' }}>{s.unit}</span>
                </div>
                <div style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono', monospace" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* MAIN CTA — Run Pipeline */}
        <div className="border border-white/[.08] p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent pointer-events-none"/>
          <div className="relative">
            <div className="text-[9px] tracking-[.32em] uppercase text-brand mb-3">Ready to pitch?</div>
            <h2 className="font-serif text-3xl font-black text-white mb-2">FIND YOUR NEXT BRAND DEAL</h2>
            <p className="text-white/40 text-xs tracking-wider mb-6 leading-relaxed">
              AI finds the best brands for your niche, scores their fit, writes personalized pitch emails,
              and deploys a cinematic pitch page for each brand — all in under 3 minutes.
            </p>

            {!profileComplete ? (
              <a href="/app/settings" className="inline-flex items-center gap-2 border border-white/20 text-white/50 px-8 py-4 text-xs tracking-[.28em] uppercase hover:border-white/40 hover:text-white/80 transition-colors">
                Complete your profile in Settings first →
              </a>
            ) : running ? (
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin flex-shrink-0"/>
                <div>
                  <div className="text-sm text-white mb-1">{runMsg}</div>
                  <div className="text-[10px] text-white/30 tracking-wider">~2-3 minutes · check Pitches tab when done</div>
                </div>
              </div>
            ) : (
              <button onClick={startPipeline}
                className="bg-brand text-[#0a0005] px-10 py-4 text-xs font-bold tracking-[.28em] uppercase hover:bg-brand-light transition-colors"
                onMouseEnter={e => e.currentTarget.style.animation = 'squashStretch 0.45s cubic-bezier(.68,-0.55,.27,1.55)'}
                onMouseLeave={e => e.currentTarget.style.animation = 'none'}
              >
                RUN PIPELINE →
              </button>
            )}

            {success && !running && <p className="text-brand text-sm mt-4 tracking-wider font-medium">✓ {success}</p>}
            {runError && !running && (
              <div className="flex items-center gap-3 mt-4">
                <p className="text-red-400 text-xs tracking-wider">{runError}</p>
                <button onClick={() => { setRunError(''); startPipeline(); }}
                  className="border border-red-400/40 text-red-400 text-[9px] tracking-[.2em] uppercase px-3 py-1 hover:bg-red-400/10 transition-colors">
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Plan info */}
        <div className="border border-white/[.06] p-4 mb-8 flex items-center justify-between">
          <div>
            <span className="text-[9px] tracking-widest uppercase text-white/30">Current plan: </span>
            <span className={`text-[9px] tracking-widest uppercase font-bold ${plan === 'pro' ? 'text-brand' : plan === 'starter' ? 'text-yellow-400' : 'text-white/50'}`}>
              {planInfo.label} — {planInfo.price}/mo
            </span>
            <span className="text-[9px] text-white/20 ml-3 tracking-wider">{planInfo.runs} · {planInfo.pitches}</span>
          </div>
          {plan === 'free' && (
            <a href="/app/settings" className="text-[9px] tracking-[.2em] uppercase text-brand hover:text-brand-light transition-colors">Upgrade →</a>
          )}
        </div>

        {/* Recent pitches */}
        {recentPitches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[9px] tracking-[.32em] uppercase text-white/30">Recent pitches</div>
              <a href="/app/pitches" className="text-[9px] tracking-[.22em] uppercase text-brand hover:text-brand-light transition-colors">View all →</a>
            </div>
            <div className="space-y-px">
              {recentPitches.map(p => (
                <div key={p.id} className="bg-white/[.03] border border-white/[.06] p-5 flex items-center justify-between hover:bg-white/[.05] transition-colors">
                  <div>
                    <div className="text-sm text-white mb-1 font-medium">{p.brand_name}</div>
                    <div className="text-[10px] text-white/30 tracking-wider">{p.subject}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    {p.view_count > 0 && <div className="text-[9px] text-brand/60 tracking-wider">Viewed {p.view_count}×</div>}
                    <div className="text-right">
                      <div className="font-serif text-xl font-black text-brand">{p.fit_score}</div>
                      <div className="text-[9px] text-white/20 tracking-wider">/100</div>
                    </div>
                    {p.pitch_page_url && (
                      <a href={p.pitch_page_url} target="_blank" rel="noreferrer"
                        className="border border-brand/50 text-brand text-[9px] tracking-[.2em] uppercase px-4 py-2 hover:bg-brand/10 transition-colors">
                        VIEW →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {pitches.length === 0 && !running && (
          <div className="text-center py-16 border border-dashed border-white/[.08]">
            <div className="text-4xl mb-4">🎞</div>
            <div className="text-sm text-white/40 tracking-wider mb-1">No pitches yet</div>
            <div className="text-[10px] text-white/20 tracking-widest uppercase">Run the pipeline to find your first brand deals</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileFreshness({ updatedAt }) {
  if (!updatedAt) return null;
  const daysAgo = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86400000);
  const stale   = daysAgo > 60;
  if (stale) return (
    <a href="/app/settings" className="inline-block mb-6 text-[10px] tracking-wider text-yellow-400/80 hover:text-yellow-400 transition-colors">
      ⚠ Stats may be outdated — Update in Settings →
    </a>
  );
  return (
    <p className="mb-6 text-[10px] tracking-wider text-white/20">
      Stats last updated: {daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
    </p>
  );
}
