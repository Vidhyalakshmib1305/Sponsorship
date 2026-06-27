// frontend/src/pages/Pitches.jsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import pitchesImg from '../assets/landing/pitches.png';

function buildEmailBody(p) {
  const lines = [];
  lines.push(`Hi ${p.brand_name} team,`);
  lines.push('');
  lines.push(`I'd love to explore a potential partnership. I've put together a personalised pitch page that shows exactly why I think we'd be a great fit — including my audience data, content style, and what a collaboration could look like.`);
  lines.push('');
  if (p.pitch_page_url) { lines.push(`View my full pitch page here: ${p.pitch_page_url}`); lines.push(''); }
  lines.push('Looking forward to hearing from you!');
  lines.push(''); lines.push('Best,');
  return lines.join('\n');
}

export default function Pitches() {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(null);

  useEffect(() => {
    api.getPitches().then(d => setPitches(d.pitches || [])).finally(() => setLoading(false));
  }, []);

  function handleCopy(id, url) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleSendEmail(p) {
    const subject = encodeURIComponent(p.subject || 'Partnership opportunity');
    const body    = encodeURIComponent(buildEmailBody(p));
    const to      = p.brand_email || '';
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0005', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>Loading pitches...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0005' }}>

      {/* ── Header Banner ── */}
      <div style={{ position: 'relative', height: '240px', background: '#0a0005', overflow: 'hidden' }}>
        <img src={pitchesImg} alt="Pitches banner" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,0,5,0.05) 0%, rgba(10,0,5,0.5) 50%, rgba(10,0,5,0.97) 100%)' }} />

        {/* Sparkle accents */}
        {['✉','✦','◆'].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: `${15 + i * 25}%`, right: `${8 + i * 8}%`, color: i === 0 ? 'rgba(255,215,0,0.35)' : 'rgba(255,69,0,0.3)', fontSize: '0.9rem', animation: `starFloat ${3 + i * 0.65}s ease-in-out ${i * 0.5}s infinite`, pointerEvents: 'none' }}>{s}</div>
        ))}

        {/* Title */}
        <div style={{ position: 'absolute', bottom: '1.5rem', left: '2rem', right: '2rem' }}>
          <div style={{ position: 'absolute', bottom: '-0.5rem', left: '-1rem', right: '-1rem', height: '5rem', background: 'radial-gradient(ellipse 70% 100%, rgba(10,0,5,0.65) 30%, transparent 80%)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '0.4rem', animation: 'letterBounceIn 0.6s cubic-bezier(.68,-0.55,.27,1.55) 0s both' }}>Your pitches</div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', lineHeight: 1, display: 'flex', flexWrap: 'wrap', animation: 'springUp 0.8s cubic-bezier(.68,-0.55,.27,1.55) 0.1s both', textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>
              PITCH PAGES
            </h1>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-8 max-w-5xl">
        <p className="text-white/30 text-xs tracking-wider mb-6" style={{ animation: 'springUp 0.7s cubic-bezier(.68,-0.55,.27,1.55) 0.2s both' }}>
          {pitches.length} pitch{pitches.length !== 1 ? 'es' : ''} generated
        </p>

        {pitches.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/[.08]">
            <div className="text-5xl mb-4">✉</div>
            <div className="text-sm text-white/40 tracking-wider mb-1">No pitches yet</div>
            <div className="text-[10px] text-white/20 tracking-widest uppercase">Run the pipeline from the dashboard</div>
          </div>
        ) : (
          <div className="space-y-px" style={{ animation: 'springUp 0.8s cubic-bezier(.68,-0.55,.27,1.55) 0.25s both' }}>
            {pitches.map(p => (
              <div key={p.id} className="bg-white/[.03] border border-white/[.06] p-6 transition-colors"
                style={{ transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-serif text-2xl font-black text-white">{p.brand_name}</div>
                      <div className="font-serif text-lg font-black text-brand">{p.fit_score}<span className="text-xs text-white/20">/100</span></div>
                    </div>
                    <div className="text-xs text-white/50 mb-1 tracking-wider">"{p.subject}"</div>
                    <div className="text-[10px] text-white/20 tracking-widest uppercase">To: {p.brand_email || 'Email not found'}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button onClick={() => handleSendEmail(p)}
                      className="bg-brand text-[#0a0005] text-[9px] tracking-[.2em] uppercase px-4 py-2 hover:bg-brand-light transition-colors font-bold"
                      onMouseEnter={e => e.currentTarget.style.animation = 'squashStretch 0.4s cubic-bezier(.68,-0.55,.27,1.55)'}
                      onMouseLeave={e => e.currentTarget.style.animation = 'none'}
                    >
                      SEND EMAIL ✉
                    </button>
                    {p.pitch_page_url && p.pitch_page_url !== 'deploy-disabled' && (
                      <a href={p.pitch_page_url} target="_blank" rel="noreferrer"
                        className="border border-brand/50 text-brand text-[9px] tracking-[.2em] uppercase px-4 py-2 hover:bg-brand/10 transition-colors">
                        VIEW PAGE →
                      </a>
                    )}
                    {p.pitch_page_url && p.pitch_page_url !== 'deploy-disabled' && (
                      <button onClick={() => handleCopy(p.id, p.pitch_page_url)}
                        className="border border-white/20 text-white/40 text-[9px] tracking-[.2em] uppercase px-4 py-2 hover:border-white/40 hover:text-white/70 transition-colors">
                        {copied === p.id ? '✓ COPIED' : 'COPY URL'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[.05] flex items-center gap-4 flex-wrap">
                  <span className={`text-[9px] tracking-widest uppercase px-2 py-1 border ${p.status === 'sent_ready' ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-white/10 text-white/30'}`}>
                    {p.status?.replace('_',' ')}
                  </span>
                  <span className={`text-[9px] tracking-wider ${p.view_count > 0 ? 'text-brand/70' : 'text-white/20'}`}>
                    {p.view_count > 0 ? `Viewed ${p.view_count} time${p.view_count !== 1 ? 's' : ''}` : 'Not opened yet'}
                  </span>
                  <span className="text-[9px] text-white/20 tracking-wider">
                    {new Date(p.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
