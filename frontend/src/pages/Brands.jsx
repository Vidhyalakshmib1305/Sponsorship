// frontend/src/pages/Brands.jsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import brandsImg from '../assets/landing/brands.png';

const LIKELIHOOD_STYLE = {
  high:   'border-green-500/40 text-green-400 bg-green-500/5',
  medium: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/5',
  low:    'border-white/20 text-white/30',
};
const LIKELIHOOD_LABEL = { high: 'High chance', medium: 'Medium', low: 'Low' };

function ReplyBadge({ likelihood }) {
  if (!likelihood) return null;
  const key = likelihood.toLowerCase().includes('high') ? 'high' : likelihood.toLowerCase().includes('medium') ? 'medium' : 'low';
  return <span className={`text-[9px] px-2 py-0.5 border tracking-wider ${LIKELIHOOD_STYLE[key]}`}>{LIKELIHOOD_LABEL[key]}</span>;
}

/* Spring-up card */
function SpringCard({ children, delay = 0 }) {
  const ref     = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      animation: vis ? `springUp 0.8s cubic-bezier(.68,-0.55,.27,1.55) ${delay}s both` : 'none',
      opacity:   vis ? undefined : 0,
    }}>
      {children}
    </div>
  );
}

export default function Brands() {
  const [brands,  setBrands]  = useState([]);
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBrands().then(d => setBrands(d.brands || [])).finally(() => setLoading(false));
  }, []);

  const filtered = brands.filter(b => {
    if (filter === 'pitchable') return b.should_pitch;
    if (filter === 'high')      return b.fit_score >= 80;
    return true;
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0005', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>Loading brands...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0005' }}>

      {/* ── Header Banner ── */}
      <div style={{ position: 'relative', height: '240px', background: '#0a0005', overflow: 'hidden' }}>
        <img src={brandsImg} alt="Brands banner" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,0,5,0.05) 0%, rgba(10,0,5,0.5) 50%, rgba(10,0,5,0.97) 100%)' }} />

        {/* Sparkle accents */}
        {['◆','✦','✧'].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: `${18 + i * 24}%`, right: `${10 + i * 7}%`, color: i === 0 ? 'rgba(255,69,0,0.35)' : 'rgba(255,215,0,0.3)', fontSize: '0.85rem', animation: `starFloat ${3.2 + i * 0.6}s ease-in-out ${i * 0.45}s infinite`, pointerEvents: 'none' }}>{s}</div>
        ))}

        {/* Text */}
        <div style={{ position: 'absolute', bottom: '1.5rem', left: '2rem', right: '2rem' }}>
          <div style={{ position: 'absolute', bottom: '-0.5rem', left: '-1rem', right: '-1rem', height: '5rem', background: 'radial-gradient(ellipse 70% 100%, rgba(10,0,5,0.65) 30%, transparent 80%)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '0.4rem', animation: 'letterBounceIn 0.6s cubic-bezier(.68,-0.55,.27,1.55) 0s both' }}>Brand discovery</div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', lineHeight: 1, display: 'flex', flexWrap: 'wrap' }}>
              {'BRAND LEADS'.split('').map((ch, i) => (
                <span key={i} style={{ display: 'inline-block', animation: `letterBounceIn 0.7s cubic-bezier(.68,-0.55,.27,1.55) ${0.05 + i * 0.055}s both`, textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>{ch === ' ' ? ' ' : ch}</span>
              ))}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-8 max-w-5xl">
        <p className="text-white/30 text-xs tracking-wider mb-6" style={{ animation: 'springUp 0.7s cubic-bezier(.68,-0.55,.27,1.55) 0.2s both' }}>
          {brands.length} brands discovered
        </p>

        {/* Filter */}
        <div className="flex gap-2 mb-6" style={{ animation: 'springUp 0.7s cubic-bezier(.68,-0.55,.27,1.55) 0.25s both' }}>
          {[['all','All'], ['pitchable','Worth Pitching'], ['high','Score 80+']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-2 text-[9px] tracking-[.2em] uppercase border transition-colors ${filter === v ? 'border-brand bg-brand/10 text-brand' : 'border-white/10 text-white/30 hover:border-white/30'}`}
              onMouseEnter={e => { if (filter !== v) e.currentTarget.style.animation = 'squashStretch 0.4s cubic-bezier(.68,-0.55,.27,1.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.animation = 'none'; }}
            >{l}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/[.08]">
            <div className="text-5xl mb-4">◆</div>
            <div className="text-sm text-white/40 tracking-wider">No brands yet — run the pipeline</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {filtered.map((b, bi) => (
              <SpringCard key={b.id} delay={bi * 0.04}>
                <div
                  className="bg-[#0a0005] p-5 h-full transition-colors"
                  style={{ transition: 'background 0.2s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,69,0,0.04)';
                    e.currentTarget.style.animation = 'wobble 0.5s ease-in-out';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#0a0005';
                    e.currentTarget.style.animation = 'none';
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="font-medium text-white mb-0.5">{b.name}</div>
                      <div className="text-[10px] text-white/30 tracking-wider uppercase">{b.industry}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-serif text-2xl font-black text-brand leading-none">
                        {b.fit_score}<span className="text-xs text-white/20">/100</span>
                      </div>
                    </div>
                  </div>
                  {b.score_reasoning && (
                    <div className="text-[10px] text-white/40 leading-relaxed mb-3 border-l-2 border-brand/20 pl-2">{b.score_reasoning}</div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] px-2 py-0.5 border tracking-wider ${b.should_pitch ? 'border-green-500/30 text-green-400' : 'border-white/10 text-white/20'}`}>
                      {b.should_pitch ? '✓ Pitchable' : '✕ Skip'}
                    </span>
                    <ReplyBadge likelihood={b.reply_likelihood} />
                    <span className="text-[9px] text-white/20">{b.market}</span>
                    {b.marketing_email && <span className="text-[9px] text-brand/60 truncate max-w-[180px]">{b.marketing_email}</span>}
                  </div>
                </div>
              </SpringCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
