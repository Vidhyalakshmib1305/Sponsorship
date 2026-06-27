// frontend/src/pages/Settings.jsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import settingsImg from '../assets/landing/settings.png';

const NICHES = [
  'vintage','fashion','beauty','skincare','haircare','fitness','food',
  'travel','tech','comedy','motivation','finance','lifestyle','yoga',
  'gaming','photography','music','dance','education','parenting',
];

export default function Settings() {
  const [creator,      setCreator]      = useState(null);
  const [form,         setForm]         = useState({});
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [igLoading,    setIgLoading]    = useState(false);
  const [igData,       setIgData]       = useState(null);
  const [igMsg,        setIgMsg]        = useState('');
  const lastFetched = useRef('');
  const [photoSource,  setPhotoSource]  = useState('manual');
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [postSource,   setPostSource]   = useState('manual');
  const [postFiles,    setPostFiles]    = useState([]);
  const [postPreviews, setPostPreviews] = useState([]);

  useEffect(() => {
    api.getCreator().then(c => { setCreator(c); setForm(c); });
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function fetchInstagramData() {
    const handle = form.instagram_handle?.trim().replace('@', '');
    if (!handle || handle === lastFetched.current) return;
    lastFetched.current = handle;
    setIgLoading(true); setIgMsg('');
    try {
      const data = await api.fetchInstagram(handle);
      if (data.manual) {
        setIgMsg(data.error || 'Instagram auto-fetch unavailable — enter data manually');
      } else {
        setIgData(data); setIgMsg('');
        if (data.followers)        set('instagram_followers',       String(data.followers));
        if (data.engagement_rate)  set('instagram_engagement_rate', String(data.engagement_rate));
        if (data.profile_pic_url)  setPhotoSource('instagram');
        if (data.recent_posts?.length >= 6) setPostSource('instagram');
      }
    } catch { setIgMsg('Could not fetch Instagram data'); }
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
    setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); setPhotoSource('manual');
  }

  function handlePostsChange(e) {
    const files = Array.from(e.target.files).slice(0, 9);
    setPostFiles(files); setPostPreviews(files.map(f => URL.createObjectURL(f))); setPostSource('manual');
  }

  async function handleSave() {
    setSaving(true); setSaved(false);
    try {
      const updates = {
        ...form,
        instagram_followers:       parseInt(form.instagram_followers) || 0,
        instagram_engagement_rate: parseFloat(form.instagram_engagement_rate) || 0,
        base_rate_per_post:        parseFloat(form.base_rate_per_post) || 0,
      };
      if (photoSource === 'instagram' && igData?.profile_pic_url) updates.profile_photo_url = igData.profile_pic_url;
      if (postSource === 'instagram' && igData?.recent_posts?.length) {
        updates.post_images = igData.recent_posts.filter(p => p.thumbnail_url).slice(0, 9).map(p => p.thumbnail_url);
      }
      await api.updateCreator(updates);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert(e.message); }
    finally     { setSaving(false); }
  }

  async function handleUploadPhoto() {
    if (!photoFile) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(photoFile);
      const res    = await api.uploadPhoto({ base64, filename: photoFile.name, contentType: photoFile.type });
      setForm(f => ({ ...f, profile_photo_url: res.url }));
      setPhotoFile(null);
      alert('Profile photo updated!');
    } catch (e) { alert(e.message); }
    finally     { setUploading(false); }
  }

  async function handleUploadPosts() {
    if (!postFiles.length) return;
    setUploading(true);
    try {
      const images = await Promise.all(postFiles.map(async f => ({ base64: await fileToBase64(f), filename: f.name, contentType: f.type })));
      await api.uploadPosts({ images });
      setPostFiles([]); setPostPreviews([]);
      alert(`${images.length} post images uploaded!`);
    } catch (e) { alert(e.message); }
    finally     { setUploading(false); }
  }

  if (!creator) return (
    <div style={{ minHeight: '100vh', background: '#0a0005', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>Loading...</div>
    </div>
  );

  const currentPhotoUrl = photoSource === 'instagram' && igData?.profile_pic_url
    ? igData.profile_pic_url
    : (photoPreview || form.profile_photo_url);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0005' }}>

      {/* ── Header Banner ── */}
      <div style={{ position: 'relative', height: '240px', background: '#0a0005', overflow: 'hidden' }}>
        <img src={settingsImg} alt="Settings banner" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,0,5,0.05) 0%, rgba(10,0,5,0.5) 50%, rgba(10,0,5,0.97) 100%)' }} />

        {['◎','✦','◆'].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: `${18 + i * 24}%`, right: `${10 + i * 7}%`, color: i === 0 ? 'rgba(255,215,0,0.35)' : 'rgba(255,69,0,0.3)', fontSize: '0.85rem', animation: `starFloat ${3 + i * 0.7}s ease-in-out ${i * 0.4}s infinite`, pointerEvents: 'none' }}>{s}</div>
        ))}

        <div style={{ position: 'absolute', bottom: '1.5rem', left: '2rem', right: '2rem' }}>
          <div style={{ position: 'absolute', bottom: '-0.5rem', left: '-1rem', right: '-1rem', height: '5rem', background: 'radial-gradient(ellipse 70% 100%, rgba(10,0,5,0.65) 30%, transparent 80%)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#FF4500', fontFamily: "'Space Mono', monospace", marginBottom: '0.4rem', animation: 'letterBounceIn 0.6s cubic-bezier(.68,-0.55,.27,1.55) 0s both' }}>Your account</div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', lineHeight: 1, display: 'flex', flexWrap: 'wrap' }}>
              {'SETTINGS'.split('').map((ch, i) => (
                <span key={i} style={{ display: 'inline-block', animation: `letterBounceIn 0.7s cubic-bezier(.68,-0.55,.27,1.55) ${0.1 + i * 0.07}s both`, textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>{ch}</span>
              ))}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-8 max-w-2xl" style={{ animation: 'springUp 0.8s cubic-bezier(.68,-0.55,.27,1.55) 0.15s both' }}>

        {/* Profile Photo */}
        <Section title="Profile Photo">
          <div className="flex gap-2 mb-4">
            {['instagram','manual'].map(src => (
              <button key={src} onClick={() => setPhotoSource(src)}
                className={`px-4 py-1.5 text-[9px] tracking-[.2em] uppercase border transition-colors ${photoSource === src ? 'border-brand bg-brand/10 text-brand' : 'border-white/10 text-white/30 hover:border-white/30'}`}>
                {src === 'instagram' ? 'From Instagram' : 'Upload my own'}
              </button>
            ))}
          </div>
          {photoSource === 'instagram' ? (
            <div className="flex items-center gap-5 mb-4">
              {currentPhotoUrl
                ? <img src={currentPhotoUrl} className="w-20 h-20 rounded-full object-cover border-2 border-brand" alt="profile"/>
                : <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 text-3xl">IG</div>}
              <div>
                <button onClick={fetchInstagramData} disabled={igLoading}
                  className="block border border-brand/50 text-brand text-[9px] tracking-[.2em] uppercase px-4 py-2 hover:bg-brand/10 transition-colors disabled:opacity-40 mb-1">
                  {igLoading ? 'Fetching...' : 'Refresh from Instagram ↺'}
                </button>
                {igMsg && <div className="text-[9px] text-white/30 tracking-wider">{igMsg}</div>}
                {igData && <div className="text-[9px] text-brand/60 tracking-wider">{Number(igData.followers).toLocaleString()} followers · {igData.engagement_rate}% eng.</div>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5 mb-4">
              {currentPhotoUrl
                ? <img src={currentPhotoUrl} className="w-20 h-20 rounded-full object-cover border-2 border-brand" alt="profile"/>
                : <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 text-3xl">+</div>}
              <div>
                <label className="block cursor-pointer border border-white/20 px-4 py-2 text-[9px] tracking-[.2em] uppercase text-white/50 hover:border-white/40 hover:text-white/80 transition-colors mb-2">
                  Choose photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden"/>
                </label>
                {photoFile && (
                  <button onClick={handleUploadPhoto} disabled={uploading}
                    className="block border border-brand/50 text-brand text-[9px] tracking-[.2em] uppercase px-4 py-2 hover:bg-brand/10 transition-colors disabled:opacity-40">
                    {uploading ? 'Uploading...' : 'Upload →'}
                  </button>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* Post Images */}
        <Section title="Post Images (Film Roll)">
          <p className="text-[10px] text-white/30 tracking-wider mb-3 leading-relaxed">
            These appear in your pitch pages as a cinematic film roll.
            {form.post_images?.length > 0 && <span className="text-brand"> · {form.post_images.length} currently saved</span>}
          </p>
          <div className="flex gap-2 mb-4">
            {['instagram','manual'].map(src => (
              <button key={src} onClick={() => setPostSource(src)}
                className={`px-4 py-1.5 text-[9px] tracking-[.2em] uppercase border transition-colors ${postSource === src ? 'border-brand bg-brand/10 text-brand' : 'border-white/10 text-white/30 hover:border-white/30'}`}>
                {src === 'instagram' ? `From Instagram${igData?.recent_posts?.length ? ` (${igData.recent_posts.length})` : ''}` : 'Upload my own'}
              </button>
            ))}
          </div>
          {postSource === 'instagram' ? (
            <div>
              {!igData ? (
                <div className="border border-dashed border-white/10 p-4 text-center">
                  <div className="text-[10px] text-white/30 tracking-wider mb-2">No Instagram data fetched yet</div>
                  <button onClick={fetchInstagramData} disabled={igLoading}
                    className="border border-white/20 text-white/40 text-[9px] tracking-[.2em] uppercase px-4 py-2 hover:border-white/40 transition-colors disabled:opacity-40">
                    {igLoading ? 'Fetching...' : 'Fetch from Instagram'}
                  </button>
                </div>
              ) : igData.recent_posts?.length > 0 ? (
                <div>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {igData.recent_posts.slice(0,9).map((p,i) => (
                      <div key={i} className="aspect-square overflow-hidden">
                        {p.thumbnail_url ? <img src={p.thumbnail_url} className="w-full h-full object-cover" alt={`post ${i+1}`}/> : <div className="w-full h-full bg-white/[.04] flex items-center justify-center text-white/20 text-[10px]">{p.type}</div>}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-brand/60 tracking-wider">✓ {igData.recent_posts.length} posts from Instagram</div>
                </div>
              ) : (
                <div className="text-[10px] text-white/30 tracking-wider">No recent posts found</div>
              )}
            </div>
          ) : (
            <>
              <label className="block cursor-pointer border border-dashed border-white/20 p-4 text-center hover:border-white/40 transition-colors mb-3">
                <div className="text-2xl mb-1">🎞</div>
                <div className="text-[10px] text-white/40 tracking-wider">Select up to 9 post images</div>
                <input type="file" accept="image/*" multiple onChange={handlePostsChange} className="hidden"/>
              </label>
              {postPreviews.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-1 mb-3">
                    {postPreviews.map((p,i) => <div key={i} className="aspect-square overflow-hidden"><img src={p} className="w-full h-full object-cover" alt={`post ${i+1}`}/></div>)}
                  </div>
                  <button onClick={handleUploadPosts} disabled={uploading}
                    className="border border-brand/50 text-brand text-[9px] tracking-[.2em] uppercase px-6 py-2 hover:bg-brand/10 transition-colors disabled:opacity-40">
                    {uploading ? 'Uploading...' : `Upload ${postFiles.length} images →`}
                  </button>
                </>
              )}
            </>
          )}
        </Section>

        {/* Creator Profile */}
        <Section title="Creator Profile">
          <div className="space-y-3">
            <Field label="Instagram handle">
              <div className="flex gap-2">
                <input value={form.instagram_handle||''} onChange={e => set('instagram_handle', e.target.value.replace('@',''))}
                  className="field flex-1"/>
                <button onClick={fetchInstagramData} disabled={igLoading}
                  className="border border-white/20 text-white/40 text-[9px] tracking-[.2em] uppercase px-3 py-2 hover:border-brand/50 hover:text-brand transition-colors disabled:opacity-40 whitespace-nowrap">
                  {igLoading ? '...' : '↺ Refresh'}
                </button>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Followers">
                <input type="number" value={form.instagram_followers||''} onChange={e => set('instagram_followers', e.target.value)} className="field"/>
              </Field>
              <Field label="Engagement rate %">
                <input type="number" step="0.1" value={form.instagram_engagement_rate||''} onChange={e => set('instagram_engagement_rate', e.target.value)} className="field"/>
              </Field>
            </div>
            <Field label="Content style">
              <input value={form.content_style||''} onChange={e => set('content_style', e.target.value)} className="field" placeholder="e.g. aesthetic, curated, editorial"/>
            </Field>
            <Field label="Rate per post ($)">
              <input type="number" value={form.base_rate_per_post||''} onChange={e => set('base_rate_per_post', e.target.value)} className="field"/>
            </Field>
            <Field label="Primary niche">
              <div className="flex flex-wrap gap-2 mt-1">
                {NICHES.map(n => (
                  <button key={n} onClick={() => set('primary_niche', n)}
                    className={`px-3 py-1 text-[9px] tracking-widest uppercase border transition-colors ${form.primary_niche === n ? 'border-brand bg-brand/20 text-brand' : 'border-white/10 text-white/30 hover:border-white/30'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* Audience */}
        <Section title="Audience Data">
          <div className="space-y-3">
            <Field label="Audience gender">
              <input value={form.audience_gender||''} onChange={e => set('audience_gender', e.target.value)} className="field" placeholder="e.g. 72% female, 28% male"/>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age range">
                <input value={form.audience_age_range||''} onChange={e => set('audience_age_range', e.target.value)} className="field" placeholder="e.g. 18-32"/>
              </Field>
              <Field label="Top location">
                <input value={form.audience_location||''} onChange={e => set('audience_location', e.target.value)} className="field" placeholder="e.g. India"/>
              </Field>
            </div>
          </div>
        </Section>

        {/* Plan */}
        {creator.plan && (
          <Section title="Current Plan">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] px-3 py-1 border tracking-wider uppercase ${creator.plan === 'pro' ? 'border-brand/50 text-brand bg-brand/10' : creator.plan === 'starter' ? 'border-yellow-500/40 text-yellow-400' : 'border-white/20 text-white/40'}`}>
                {creator.plan}
              </span>
              <div className="text-[10px] text-white/30 tracking-wider">
                {creator.plan === 'free'    && '1 pipeline run/month · 3 pitch pages'}
                {creator.plan === 'starter' && '$19/month · 10 runs · 25 pitch pages'}
                {creator.plan === 'pro'     && '$49/month · Unlimited runs & pages'}
              </div>
            </div>
          </Section>
        )}

        <button onClick={handleSave} disabled={saving}
          className="bg-brand text-[#0a0005] px-10 py-4 text-xs font-bold tracking-[.28em] uppercase hover:bg-brand-light transition-colors disabled:opacity-50"
          onMouseEnter={e => { if (!saving) e.currentTarget.style.animation = 'squashStretch 0.45s cubic-bezier(.68,-0.55,.27,1.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.animation = 'none'; }}
        >
          {saving ? 'SAVING...' : saved ? '✓ SAVED' : 'SAVE CHANGES →'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8 pb-8 border-b border-white/[.06]">
      <div className="text-[9px] tracking-[.32em] uppercase text-white/30 mb-4">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[9px] tracking-[.22em] uppercase text-white/30 mb-1">{label}</label>
      {children}
    </div>
  );
}
