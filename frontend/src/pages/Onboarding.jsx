// frontend/src/pages/Onboarding.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import onboardingImg from '../assets/landing/onboarding.png';

const NICHES = [
  'vintage','fashion','beauty','skincare','haircare','fitness','food',
  'travel','tech','comedy','motivation','finance','lifestyle','yoga',
  'gaming','photography','music','dance','education','parenting',
];

const STEPS = ['Profile', 'Audience', 'Photos', 'Done'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step,  setStep]  = useState(0);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  const [form, setForm] = useState({
    instagram_handle:          '',
    instagram_followers:       '',
    instagram_engagement_rate: '',
    primary_niche:             '',
    content_style:             '',
    audience_gender:           '',
    audience_age_range:        '',
    audience_location:         '',
    audience_income:           'middle class',
    base_rate_per_post:        '',
  });

  const [igLoading,   setIgLoading]   = useState(false);
  const [igData,      setIgData]      = useState(null);
  const [igError,     setIgError]     = useState('');
  const lastFetchedHandle = useRef('');

  const [photoSource,  setPhotoSource]  = useState('manual');
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [postSource,   setPostSource]   = useState('manual');
  const [postFiles,    setPostFiles]    = useState([]);
  const [postPreviews, setPostPreviews] = useState([]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function fetchInstagramData(handle) {
    const h = handle.trim().replace('@', '');
    if (!h || h === lastFetchedHandle.current) return;
    lastFetchedHandle.current = h;
    setIgLoading(true); setIgError('');
    try {
      const data = await api.fetchInstagram(h);
      if (data.manual) {
        setIgError(data.error || 'Instagram auto-fetch not available'); setIgData(null);
      } else {
        setIgData(data);
        if (data.followers)        set('instagram_followers',       String(data.followers));
        if (data.engagement_rate)  set('instagram_engagement_rate', String(data.engagement_rate));
        if (data.profile_pic_url)  setPhotoSource('instagram');
        if (data.recent_posts?.length >= 6) setPostSource('instagram');
      }
    } catch { setIgError('Could not fetch Instagram data'); }
    finally  { setIgLoading(false); }
  }

  function fileToBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file));
  }

  function handlePostsChange(e) {
    const files = Array.from(e.target.files).slice(0, 9);
    setPostFiles(files); setPostPreviews(files.map(f => URL.createObjectURL(f)));
  }

  async function handleNext() {
    setErr('');
    if (step < 2) { setStep(s => s + 1); return; }
    setBusy(true);
    try {
      const profileData = {
        ...form,
        instagram_followers:       parseInt(form.instagram_followers) || 0,
        instagram_engagement_rate: parseFloat(form.instagram_engagement_rate) || 0,
        base_rate_per_post:        parseFloat(form.base_rate_per_post) || 0,
      };
      if (photoSource === 'instagram' && igData?.profile_pic_url) profileData.profile_photo_url = igData.profile_pic_url;
      if (postSource === 'instagram' && igData?.recent_posts?.length) {
        profileData.post_images = igData.recent_posts.filter(p => p.thumbnail_url).slice(0, 9).map(p => p.thumbnail_url);
      }
      await api.updateCreator(profileData);
      if (photoSource === 'manual' && photoFile) {
        const base64 = await fileToBase64(photoFile);
        await api.uploadPhoto({ base64, filename: photoFile.name, contentType: photoFile.type });
      }
      if (postSource === 'manual' && postFiles.length > 0) {
        const images = await Promise.all(postFiles.map(async f => ({ base64: await fileToBase64(f), filename: f.name, contentType: f.type })));
        await api.uploadPosts({ images });
      }
      setStep(3);
    } catch (e) { setErr(e.message); }
    finally     { setBusy(false); }
  }

  /* ── Success screen ── */
  if (step === 3) return (
    <div style={{ minHeight: '100vh', background: '#0a0005', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={onboardingImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', opacity: 0.25 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(10,0,5,0.5) 20%, rgba(10,0,5,0.9) 80%)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'letterBounceIn 0.7s cubic-bezier(.68,-0.55,.27,1.55) both' }}>🎉</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, color: '#fff', margin: '0 0 1rem', animation: 'springUp 0.8s cubic-bezier(.68,-0.55,.27,1.55) 0.15s both' }}>
          YOU'RE IN.
        </h1>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: '2.5rem' }}>
          Profile complete — ready to find brands
        </p>
        <button onClick={() => navigate('/app')} style={{
          background: '#FF4500', color: '#0a0005', border: 'none',
          padding: '1rem 3rem', fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.28em', textTransform: 'uppercase', cursor: 'pointer',
          fontFamily: "'Space Mono', monospace",
          boxShadow: '0 0 40px rgba(255,69,0,0.5)',
          animation: 'springUp 0.8s cubic-bezier(.68,-0.55,.27,1.55) 0.3s both',
        }}
          onMouseEnter={e => e.currentTarget.style.animation = 'squashStretch 0.45s cubic-bezier(.68,-0.55,.27,1.55)'}
          onMouseLeave={e => e.currentTarget.style.animation = 'none'}
        >
          GO TO DASHBOARD →
        </button>
      </div>
    </div>
  );

  /* ── Form screen ── */
  return (
    <div style={{ minHeight: '100vh', background: '#0a0005', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {/* Full-visible backdrop image */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <img src={onboardingImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,0,5,0.82)' }} />
      </div>

      {/* Floating sparkles */}
      {['✦','✧','◆','✦','✧'].map((s, i) => (
        <div key={i} style={{ position: 'fixed', top: `${10 + i * 18}%`, left: `${5 + i * 18}%`, color: i % 2 === 0 ? 'rgba(255,215,0,0.3)' : 'rgba(255,69,0,0.25)', fontSize: '1rem', animation: `starFloat ${3.5 + i * 0.5}s ease-in-out ${i * 0.5}s infinite`, pointerEvents: 'none', zIndex: 1 }}>{s}</div>
      ))}

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '500px', animation: `springUp 0.8s cubic-bezier(.68,-0.55,.27,1.55) ${step * 0.05}s both` }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {STEPS.slice(0,3).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, fontFamily: "'Space Mono', monospace", transition: 'all 0.3s', background: i <= step ? '#FF4500' : 'rgba(255,255,255,0.1)', color: i <= step ? '#0a0005' : 'rgba(255,255,255,0.3)' }}>{i+1}</div>
              <span style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", color: i === step ? '#FF4500' : 'rgba(255,255,255,0.2)' }}>{s}</span>
              {i < 2 && <div style={{ flex: 1, height: '1px', background: i < step ? '#FF4500' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>

        {/* STEP 0 — Profile */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', margin: '0 0 1rem', animation: 'letterBounceIn 0.65s cubic-bezier(.68,-0.55,.27,1.55) both' }}>YOUR PROFILE</h2>
            <div style={{ position: 'relative' }}>
              <input placeholder="Instagram handle (e.g. s.nova.vintage)" value={form.instagram_handle}
                onChange={e => set('instagram_handle', e.target.value.replace('@',''))}
                onBlur={e => fetchInstagramData(e.target.value)}
                className="field" style={{ paddingRight: '2.5rem' }} />
              {igLoading && <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', border: '2px solid #FF4500', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
            </div>
            {igData && (
              <div style={{ background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.2)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {igData.profile_pic_url && <img src={igData.profile_pic_url} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,69,0,0.4)' }} alt="IG"/>}
                <div>
                  <div style={{ fontSize: '10px', color: '#FF4500', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>Instagram connected ✓</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Space Mono', monospace" }}>{Number(igData.followers).toLocaleString()} followers · {igData.engagement_rate}% eng.</div>
                </div>
              </div>
            )}
            {igError && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono', monospace" }}>{igError} — enter manually below</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input placeholder="Followers (e.g. 28000)" type="number" value={form.instagram_followers} onChange={e => set('instagram_followers', e.target.value)} className="field" />
              <input placeholder="Engagement % (e.g. 4.2)" type="number" step="0.1" value={form.instagram_engagement_rate} onChange={e => set('instagram_engagement_rate', e.target.value)} className="field" />
            </div>
            <div>
              <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono', monospace", margin: '0 0 0.5rem' }}>Primary niche</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {NICHES.map(n => (
                  <button key={n} onClick={() => set('primary_niche', n)} style={{ padding: '0.3rem 0.65rem', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", border: `1px solid ${form.primary_niche === n ? '#FF4500' : 'rgba(255,255,255,0.1)'}`, background: form.primary_niche === n ? 'rgba(255,69,0,0.2)' : 'transparent', color: form.primary_niche === n ? '#FF4500' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}>{n}</button>
                ))}
              </div>
            </div>
            <input placeholder="Content style (e.g. aesthetic, curated, editorial)" value={form.content_style} onChange={e => set('content_style', e.target.value)} className="field" />
            <input placeholder="Rate per post in $ (e.g. 150)" type="number" value={form.base_rate_per_post} onChange={e => set('base_rate_per_post', e.target.value)} className="field" />
          </div>
        )}

        {/* STEP 1 — Audience */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', margin: '0 0 1rem', animation: 'letterBounceIn 0.65s cubic-bezier(.68,-0.55,.27,1.55) both' }}>YOUR AUDIENCE</h2>
            <input placeholder="Audience gender (e.g. 72% female, 28% male)" value={form.audience_gender} onChange={e => set('audience_gender', e.target.value)} className="field" />
            <input placeholder="Age range (e.g. 18-32)" value={form.audience_age_range} onChange={e => set('audience_age_range', e.target.value)} className="field" />
            <input placeholder="Top audience location (e.g. India, USA, Global)" value={form.audience_location} onChange={e => set('audience_location', e.target.value)} className="field" />
            <div>
              <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono', monospace", margin: '0 0 0.5rem' }}>Audience income level</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['student','middle class','affluent'].map(inc => (
                  <button key={inc} onClick={() => set('audience_income', inc)} style={{ flex: 1, padding: '0.5rem', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", border: `1px solid ${form.audience_income === inc ? '#FF4500' : 'rgba(255,255,255,0.1)'}`, background: form.audience_income === inc ? 'rgba(255,69,0,0.2)' : 'transparent', color: form.audience_income === inc ? '#FF4500' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}>{inc}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Photos */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', margin: '0 0 0.25rem', animation: 'letterBounceIn 0.65s cubic-bezier(.68,-0.55,.27,1.55) both' }}>YOUR PHOTOS</h2>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em', lineHeight: 1.7, margin: 0 }}>
              These appear on your pitch pages — brands see your real face and content.
            </p>

            {/* Profile photo */}
            <div>
              <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono', monospace", margin: '0 0 0.75rem' }}>Profile photo</p>
              {igData?.profile_pic_url && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {['instagram','manual'].map(src => (
                    <button key={src} onClick={() => setPhotoSource(src)} style={{ flex: 1, padding: '0.5rem', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", border: `1px solid ${photoSource === src ? '#FF4500' : 'rgba(255,255,255,0.1)'}`, background: photoSource === src ? 'rgba(255,69,0,0.1)' : 'transparent', color: photoSource === src ? '#FF4500' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {src === 'instagram' ? 'From Instagram' : 'Upload my own'}
                    </button>
                  ))}
                </div>
              )}
              {photoSource === 'instagram' && igData?.profile_pic_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={igData.profile_pic_url} style={{ width: '4rem', height: '4rem', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF4500' }} alt="IG DP"/>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Space Mono', monospace" }}>✓ Using your Instagram profile photo</div>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                  {photoPreview ? <img src={photoPreview} style={{ width: '4rem', height: '4rem', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF4500' }} alt="preview"/> : <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '1.5rem' }}>+</div>}
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Space Mono', monospace" }}>{photoPreview ? '✓ Photo selected' : 'Upload your profile photo'}</div>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }}/>
                </label>
              )}
            </div>

            {/* Post images */}
            <div>
              <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono', monospace", margin: '0 0 0.75rem' }}>Your best posts — up to 9</p>
              {igData?.recent_posts?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {['instagram','manual'].map(src => (
                    <button key={src} onClick={() => setPostSource(src)} style={{ flex: 1, padding: '0.5rem', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", border: `1px solid ${postSource === src ? '#FF4500' : 'rgba(255,255,255,0.1)'}`, background: postSource === src ? 'rgba(255,69,0,0.1)' : 'transparent', color: postSource === src ? '#FF4500' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {src === 'instagram' ? `From Instagram (${igData.recent_posts.length})` : 'Upload my own'}
                    </button>
                  ))}
                </div>
              )}
              {postSource === 'instagram' && igData?.recent_posts?.length > 0 ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px' }}>
                    {igData.recent_posts.slice(0,9).map((p,i) => (
                      <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                        {p.thumbnail_url ? <img src={p.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`post ${i+1}`}/> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{p.type}</div>}
                        {p.type === 'reel' && <div style={{ position: 'absolute', top: '3px', right: '3px', fontSize: '8px', background: 'rgba(0,0,0,0.6)', padding: '1px 3px', color: 'rgba(255,255,255,0.7)' }}>REEL</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,69,0,0.6)', fontFamily: "'Space Mono', monospace", marginTop: '0.5rem' }}>✓ Using your last {igData.recent_posts.length} Instagram posts</div>
                </div>
              ) : (
                <>
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <div style={{ border: '1px dashed rgba(255,255,255,0.2)', padding: '1.5rem', textAlign: 'center', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎞</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: "'Space Mono', monospace" }}>Click to select your posts</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontFamily: "'Space Mono', monospace", marginTop: '0.25rem', letterSpacing: '0.1em' }}>JPG/PNG · Max 9 images</div>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handlePostsChange} style={{ display: 'none' }}/>
                  </label>
                  {postPreviews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px', marginTop: '0.75rem' }}>
                      {postPreviews.map((p,i) => (
                        <div key={i} style={{ aspectRatio: '1', overflow: 'hidden' }}>
                          <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`post ${i+1}`}/>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {err && <p style={{ color: '#FF4500', fontSize: '11px', fontFamily: "'Space Mono', monospace", marginTop: '0.75rem' }}>{err}</p>}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.5)', padding: '1rem', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Space Mono', monospace", transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            >← BACK</button>
          )}
          <button onClick={handleNext} disabled={busy} style={{ flex: 1, background: '#FF4500', border: 'none', color: '#0a0005', padding: '1rem', fontSize: '10px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: "'Space Mono', monospace", opacity: busy ? 0.5 : 1 }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.animation = 'squashStretch 0.45s cubic-bezier(.68,-0.55,.27,1.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.animation = 'none'; }}
          >
            {busy ? 'SAVING...' : step === 2 ? 'FINISH SETUP →' : 'NEXT →'}
          </button>
        </div>

        {step === 2 && (
          <button onClick={() => setStep(3)} style={{ width: '100%', textAlign: 'center', fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Space Mono', monospace", transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
          >
            Skip for now — add photos later in settings
          </button>
        )}
      </div>
    </div>
  );
}
