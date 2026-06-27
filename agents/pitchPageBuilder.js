// ============================================================
// agents/pitchPageBuilder.js — v4
// Fixes:
// - Hero: animated gradient + brand text overlay (not flat orange)
// - All text: white on dark bg, rainbow hover effect
// - Film roll: uses creator.post_images[] (uploaded during onboarding)
//   NO hallucination — never assumes creator's appearance or ethnicity
// - Audience: interesting data viz below cards
// - Mockup: white text, rainbow hover
// ============================================================

require('dotenv').config({ path: '../.env' });

const NICHE_THEMES = {
  vintage:       { grad:'linear-gradient(135deg,#FF4500 0%,#C23200 35%,#FF6A00 65%,#8B1A00 100%)', accent:'#FF4500', font:'Playfair Display', heroBg:'#1a0800' },
  fashion:       { grad:'linear-gradient(135deg,#C41E3A 0%,#8B0000 40%,#FF4466 70%,#4a0010 100%)', accent:'#C41E3A', font:'Cormorant Garamond', heroBg:'#0a0008' },
  beauty:        { grad:'linear-gradient(135deg,#D4538A 0%,#8B2252 40%,#FF7EB3 70%,#4a0025 100%)', accent:'#D4538A', font:'Playfair Display', heroBg:'#0a0008' },
  skincare:      { grad:'linear-gradient(135deg,#8B6F5E 0%,#5C3D2E 40%,#C4A882 70%,#2a1510 100%)', accent:'#8B6F5E', font:'Cormorant Garamond', heroBg:'#0a0805' },
  haircare:      { grad:'linear-gradient(135deg,#C4944A 0%,#8B5E1A 40%,#FFD080 70%,#3a2000 100%)', accent:'#C4944A', font:'Playfair Display', heroBg:'#0a0600' },
  fitness:       { grad:'linear-gradient(135deg,#FF4500 0%,#CC0000 40%,#FF8C00 70%,#1a0000 100%)', accent:'#FF4500', font:'Bebas Neue', heroBg:'#050505' },
  food:          { grad:'linear-gradient(135deg,#D4841A 0%,#8B4513 40%,#FFB347 70%,#2a1000 100%)', accent:'#D4841A', font:'Playfair Display', heroBg:'#0a0500' },
  travel:        { grad:'linear-gradient(135deg,#4A9EBF 0%,#1B5E7A 40%,#7ECEF0 70%,#050E14 100%)', accent:'#4A9EBF', font:'Cormorant Garamond', heroBg:'#030810' },
  tech:          { grad:'linear-gradient(135deg,#6366F1 0%,#312E81 40%,#A5B4FC 70%,#050510 100%)', accent:'#6366F1', font:'Space Mono', heroBg:'#020208' },
  comedy:        { grad:'linear-gradient(135deg,#FF4500 0%,#FFE135 40%,#FF6B35 70%,#1a0a00 100%)', accent:'#FF4500', font:'Playfair Display', heroBg:'#0a0800' },
  motivation:    { grad:'linear-gradient(135deg,#E94560 0%,#7B0028 40%,#FF6B8A 70%,#0a0010 100%)', accent:'#E94560', font:'Playfair Display', heroBg:'#050008' },
  finance:       { grad:'linear-gradient(135deg,#00D26A 0%,#006B35 40%,#5FFFA0 70%,#000a04 100%)', accent:'#00D26A', font:'Space Mono', heroBg:'#020805' },
  lifestyle:     { grad:'linear-gradient(135deg,#C4956A 0%,#7A4F2A 40%,#E8C09A 70%,#1a0e06 100%)', accent:'#C4956A', font:'Cormorant Garamond', heroBg:'#0a0805' },
  yoga:          { grad:'linear-gradient(135deg,#8B7355 0%,#4A3728 40%,#C4A882 70%,#0a0805 100%)', accent:'#8B7355', font:'Cormorant Garamond', heroBg:'#080605' },
  gaming:        { grad:'linear-gradient(135deg,#7C3AED 0%,#3B0764 40%,#C084FC 70%,#030008 100%)', accent:'#7C3AED', font:'Space Mono', heroBg:'#020005' },
  photography:   { grad:'linear-gradient(135deg,#C4A882 0%,#7A5C3A 40%,#E8D5B8 70%,#0a0805 100%)', accent:'#C4A882', font:'Cormorant Garamond', heroBg:'#080605' },
  default:       { grad:'linear-gradient(135deg,#FF4500 0%,#C23200 35%,#FF6A00 65%,#8B1A00 100%)', accent:'#FF4500', font:'Playfair Display', heroBg:'#0a0500' },
};

const NICHE_HERO_TEXT = {
  vintage:'VINTAGE/MEETS/MODERN', fashion:'STYLE/IS A/LANGUAGE',
  beauty:'BEAUTY/IS AN/ART FORM', skincare:'SKIN/TELLS/STORIES',
  haircare:'HAIR/IS YOUR/CROWN', fitness:'SWEAT/BUILD/CONQUER',
  food:'TASTE/THE/MOMENT', travel:'THE WORLD/IS A/CANVAS',
  tech:'BUILD/THE/FUTURE', comedy:'MAKE/THEM/LAUGH',
  motivation:'RISE/ABOVE/ALL', finance:'WEALTH/IS A/MINDSET',
  lifestyle:'LIVE/WITH/INTENTION', yoga:'MOVE/BREATHE/GROW',
  gaming:'PLAY/WIN/REPEAT', photography:'CAPTURE/THE/MOMENT',
  default:'CREATE/WITH/PURPOSE',
};

// Brand-related words to scatter in hero background
const NICHE_BG_WORDS = {
  vintage:  ['THRIFT','TIMELESS','CURATED','PRELOVED','EDITORIAL','ARCHIVE','HERITAGE','AESTHETIC','FILM'],
  fashion:  ['COUTURE','RUNWAY','LOOKBOOK','EDITORIAL','STYLE','DRIP','FIT','VOGUE'],
  beauty:   ['GLOW','SKINCARE','RITUAL','RADIANT','SERUM','BLOOM','SELFCARE'],
  fitness:  ['GAINS','PR','REPS','HUSTLE','GRIND','STRONG','FORM','LIFT'],
  food:     ['TASTE','RECIPE','PLATING','FLAVOUR','FEAST','BITE','SAVOUR'],
  travel:   ['EXPLORE','WANDER','JOURNEY','HORIZON','ATLAS','VOYAGE'],
  tech:     ['DEPLOY','COMMIT','BUILD','LAUNCH','ITERATE','SHIP'],
  comedy:   ['LOL','VIBE','RELATABLE','TRENDING','VIRAL','MOOD'],
  finance:  ['COMPOUND','INVEST','RETURNS','PORTFOLIO','ALPHA','HEDGE'],
  default:  ['CREATE','BUILD','INSPIRE','GROW','CONNECT','DESIGN'],
};

// Audience fun facts — shown below the stat cards
const AUDIENCE_FUN_FACTS = {
  vintage:  ["They vintage-shop 3× more than average consumers","72% have a dedicated 'saved posts' folder just for outfit inspo","They spend 45 min/day on fashion content — before breakfast"],
  fashion:  ["They screenshot 8+ outfits a week","60% have bought something within 24hrs of seeing it on a creator","They return to a brand 3× more after an influencer recommendation"],
  fitness:  ["They check Instagram during rest periods (guilty)","80% research supplements before buying","They're 4× more likely to try a brand their favourite creator uses"],
  beauty:   ["They watch an average of 12 beauty tutorials per week","90% read ingredient labels after seeing creator content","Their wishlist has 47 items. On average."],
  food:     ["They screenshot recipes more than they actually cook them","They'll travel 20+ mins to try a restaurant a creator reviewed","60% follow at least 5 food creators simultaneously"],
  default:  ["They engage 4× more than the platform average","They spend 2+ hours daily on content in this niche","Creator recommendations drive 3× more conversions than ads"],
};

function getProfilePhoto(creator) {
  if (creator.profile_photo_url?.startsWith('http')) {
    return { url: creator.profile_photo_url, isReal: true };
  }
  const handle = (creator.instagram_handle||'creator').replace('@','');
  const style  = ['micah','lorelei','adventurer','pixel-art'][Math.abs(hashString(handle))%4];
  return { url: `https://api.dicebear.com/9.x/${style}/svg?seed=${handle}&backgroundColor=transparent`, isReal: false };
}

// ============================================================
// MAIN
// ============================================================
function buildPitchPage(creator, brand, pitch, scoreData) {
  const niche      = creator.primary_niche?.toLowerCase()||'default';
  const theme      = NICHE_THEMES[niche]||NICHE_THEMES.default;
  const heroLines  = (NICHE_HERO_TEXT[niche]||NICHE_HERO_TEXT.default).split('/');
  const bgWords    = NICHE_BG_WORDS[niche]||NICHE_BG_WORDS.default;
  const mockUrl    = generateMockupUrl(creator, brand);
  const { url: profilePic, isReal: hasRealPhoto } = getProfilePhoto(creator);
  const funFacts   = AUDIENCE_FUN_FACTS[niche]||AUDIENCE_FUN_FACTS.default;

  // POST IMAGES — use creator-uploaded images ONLY
  // Never generate or assume what the creator looks like
  const postImages = creator.post_images || [];
  const hasPostImages = postImages.length > 0;

  console.log(`[PitchPageBuilder] Building @${creator.instagram_handle} × ${brand.name}`);
  console.log(`[PitchPageBuilder] Post images: ${hasPostImages ? postImages.length+' uploaded ✅' : 'none uploaded ⚠️'}`);

  const backendUrl   = process.env.BACKEND_URL || 'http://localhost:3001';
  const trackingPixel = pitch.view_token
    ? `<img src="${backendUrl}/api/pitch/view/${pitch.view_token}" width="1" height="1" style="position:absolute;opacity:0;pointer-events:none" alt=""/>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>@${creator.instagram_handle} × ${brand.name}</title>
<meta property="og:image" content="${profilePic}">
<link href="https://fonts.googleapis.com/css2?family=${theme.font.replace(/ /g,'+')}:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>${buildCSS(theme)}</style>
</head>
<body>
${trackingPixel}
${buildHTML(creator,brand,pitch,scoreData,theme,heroLines,bgWords,mockUrl,profilePic,hasRealPhoto,postImages,hasPostImages,funFacts)}
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>${buildJS(theme)}</script>
</body>
</html>`;
}

// ============================================================
// CSS
// ============================================================
function buildCSS(theme) {
  return `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{--accent:${theme.accent};--grad:${theme.grad};--heroBg:${theme.heroBg};--font:'${theme.font}'}
html{scroll-behavior:smooth}
body{background:#0a0808;color:#f5f0e8;font-family:'Space Mono',monospace;cursor:none;overflow-x:hidden}

/* ── CURSOR ── */
#cur{position:fixed;width:100px;height:100px;border:1.5px solid rgba(255,255,255,.7);border-radius:50%;
  pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:all .12s ease;
  display:flex;align-items:center;justify-content:center;mix-blend-mode:difference}
#cur span{font-size:7px;letter-spacing:.18em;text-align:center;line-height:1.5;text-transform:uppercase;
  opacity:0;transition:opacity .3s;color:#fff}
#cur.drag span{opacity:1}#cur.drag{width:130px;height:130px}#cur.sm{width:10px;height:10px}
#cdot{position:fixed;width:4px;height:4px;background:#fff;border-radius:50%;
  pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:difference}
.prog{position:fixed;top:0;left:0;height:2px;background:var(--accent);z-index:200;width:0%;transition:width .1s}

/* ── RAINBOW TEXT HOVER ── */
.rainbow:hover{
  background:linear-gradient(90deg,#ff0000,#ff8800,#ffff00,#00ff00,#00ffff,#8800ff,#ff0088);
  background-size:200% auto;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  animation:rainbowShift .8s linear infinite
}
@keyframes rainbowShift{to{background-position:200% center}}

/* ── NAV ── */
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:22px 32px;display:flex;
  align-items:center;justify-content:space-between;mix-blend-mode:difference}
.nl,.nc{font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#fff}
.nc{position:absolute;left:50%;transform:translateX(-50%);letter-spacing:.22em}
.nr{display:flex;gap:24px}
.nr span{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:#fff;cursor:none}
.nr span:hover{
  background:linear-gradient(90deg,#ff0000,#ff8800,#ffff00,#00ff00,#00ffff,#8800ff);
  background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;animation:rainbowShift .8s linear infinite
}

/* ── HERO ── */
#hero{position:relative;width:100vw;height:100vh;overflow:hidden;background:var(--heroBg)}

/* Animated gradient background */
#hero-bg{position:absolute;inset:-20%;z-index:0;
  background:var(--grad);
  animation:gradRotate 18s ease-in-out infinite alternate;
  filter:blur(0px)}
@keyframes gradRotate{
  0%{transform:rotate(0deg) scale(1.2);filter:brightness(1)}
  33%{transform:rotate(8deg) scale(1.35);filter:brightness(1.15)}
  66%{transform:rotate(-5deg) scale(1.25);filter:brightness(.9)}
  100%{transform:rotate(12deg) scale(1.3);filter:brightness(1.1)}
}
/* dark vignette */
#hero-vignette{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(ellipse at center,rgba(0,0,0,.15) 0%,rgba(0,0,0,.55) 100%)}
/* grain */
#hero-grain{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:.3;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.07'/%3E%3C/svg%3E")}

/* Scattered background words */
.hero-word{position:absolute;z-index:2;font-family:var(--font),serif;font-weight:900;
  text-transform:uppercase;letter-spacing:-.02em;color:rgba(255,255,255,.06);
  pointer-events:none;user-select:none;animation:wordFloat var(--dur,12s) ease-in-out infinite var(--del,0s)}
@keyframes wordFloat{0%,100%{transform:translateY(0) rotate(var(--rot,0deg))}50%{transform:translateY(var(--dy,-20px)) rotate(var(--rot2,2deg))}}

/* Main hero text */
.ht{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;
  padding:0 48px;z-index:3;pointer-events:none}
.hl{font-family:var(--font),serif;font-size:clamp(62px,12.5vw,168px);font-weight:900;
  letter-spacing:-4px;line-height:.86;color:#fff;user-select:none;will-change:transform;
  transition:transform .4s cubic-bezier(.16,1,.3,1);text-shadow:0 4px 40px rgba(0,0,0,.4)}
.hl.l2{text-indent:6vw}.hl.l3{text-indent:2vw}

/* Brand callout strip in hero */
.hero-brand-strip{position:absolute;bottom:72px;left:0;right:0;z-index:3;
  display:flex;align-items:center;overflow:hidden;border-top:1px solid rgba(255,255,255,.15);
  border-bottom:1px solid rgba(255,255,255,.15);padding:10px 0;pointer-events:none}
.hero-brand-inner{display:flex;gap:48px;animation:stripScroll 20s linear infinite;white-space:nowrap}
.hero-brand-item{font-size:10px;letter-spacing:.32em;text-transform:uppercase;
  color:rgba(255,255,255,.55);flex-shrink:0}
.hero-brand-item span{color:rgba(255,255,255,.9)}

#three-canvas{position:absolute;inset:0;z-index:4;width:100%;height:100%}
#sparkle-canvas{position:absolute;inset:0;z-index:5;pointer-events:none}

.sh{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);z-index:10;
  font-size:8px;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.8);
  display:flex;align-items:center;gap:10px}
.sl{width:36px;height:1px;background:rgba(255,255,255,.6);animation:pls 2s ease-in-out infinite}
.arb{position:absolute;bottom:22px;right:32px;z-index:10;font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.ctb{position:absolute;bottom:22px;left:32px;z-index:10;font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.6)}
@keyframes pls{0%,100%{width:18px;opacity:.5}50%{width:44px;opacity:1}}
@keyframes stripScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* ── S001 CREATOR ── */
.section{min-height:100vh;position:relative;overflow:hidden;display:flex;align-items:center}
.s001{background:#0a0808;padding:80px}
.s001-inner{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start;
  max-width:1240px;margin:0 auto;width:100%}
.sc{position:absolute;top:32px;left:80px;font-size:8px;letter-spacing:.28em;
  text-transform:uppercase;color:rgba(245,240,232,.16)}
.creator-profile{display:flex;flex-direction:column;gap:22px}
.profile-pic-wrap{position:relative;width:fit-content}
.profile-pic{width:130px;height:130px;border-radius:50%;object-fit:cover;
  border:2px solid var(--accent);display:block;background:rgba(255,255,255,.05)}
.profile-pic.svg-av{padding:16px;background:rgba(255,255,255,.06)}
.profile-pic-ring{position:absolute;inset:-8px;border-radius:50%;
  border:1px solid rgba(255,255,255,.1);animation:spin 12s linear infinite}
.profile-pic-dot{position:absolute;top:8px;right:8px;width:11px;height:11px;
  border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px #0a0808}
@keyframes spin{to{transform:rotate(360deg)}}
.upload-hint{padding:8px 14px;background:rgba(255,255,255,.04);
  border:1px dashed rgba(255,255,255,.14);font-size:7px;letter-spacing:.18em;
  text-transform:uppercase;color:rgba(245,240,232,.35)}
.slb{font-size:8px;letter-spacing:.32em;text-transform:uppercase;
  color:rgba(245,240,232,.3);margin-bottom:18px}
.ch{font-family:var(--font),serif;font-size:clamp(36px,6.5vw,78px);font-weight:900;
  letter-spacing:-2px;line-height:.9;color:#f5f0e8}
.cat{color:var(--accent)}
.cn{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin-top:10px}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:20px}
.sb{background:rgba(245,240,232,.04);border:1px solid rgba(245,240,232,.05);
  padding:20px 18px;transition:background .3s}
.sb:hover{background:rgba(245,240,232,.07)}
.sn{font-family:var(--font),serif;font-size:clamp(24px,3.5vw,44px);font-weight:900;
  letter-spacing:-2px;color:#f5f0e8;line-height:1;display:inline-block;transition:color .2s}
.su{color:var(--accent)}
.slbl{font-size:7px;letter-spacing:.28em;text-transform:uppercase;
  color:rgba(245,240,232,.28);margin-top:6px;display:inline-block}
.pr{padding-top:90px}
.ptag{font-size:8px;letter-spacing:.32em;text-transform:uppercase;
  color:var(--accent);margin-bottom:20px;display:flex;align-items:center;gap:12px}
.ptag::before{content:'';width:36px;height:1px;background:var(--accent)}
.pg{font-family:var(--font),serif;font-size:clamp(18px,2.5vw,30px);font-weight:900;
  letter-spacing:-1px;color:#f5f0e8;line-height:1.1;margin-bottom:24px;display:inline-block}
.pb{font-size:12px;line-height:1.9;color:rgba(245,240,232,.65)}
.pb p{margin-bottom:16px;color:#f5f0e8}.pb p:last-child{margin-bottom:0}

/* ── FILM ROLL ── */
.film-roll-section{background:#060504;padding:0 0 60px;overflow:hidden;
  border-top:1px solid rgba(245,240,232,.06);border-bottom:1px solid rgba(245,240,232,.06)}
.film-roll-label{padding:20px 80px;font-size:7px;letter-spacing:.32em;
  text-transform:uppercase;color:rgba(245,240,232,.28)}
.film-roll-track{position:relative;overflow:hidden;height:340px}
.film-roll-track::before,.film-roll-track::after{
  content:'';position:absolute;left:0;right:0;height:20px;z-index:2;pointer-events:none;
  background:repeating-linear-gradient(90deg,#060504 0,#060504 10px,rgba(245,240,232,.1) 10px,rgba(245,240,232,.1) 20px,#060504 20px,#060504 32px)}
.film-roll-track::before{top:0}.film-roll-track::after{bottom:0}
.film-roll-inner{display:flex;gap:4px;animation:filmScroll 32s linear infinite;width:max-content;padding:24px 0}
.film-roll-inner:hover{animation-play-state:paused}
.film-frame{width:220px;height:292px;flex-shrink:0;overflow:hidden;position:relative;
  background:rgba(245,240,232,.04);border:1px solid rgba(245,240,232,.08)}
.film-frame img{width:100%;height:100%;object-fit:cover;
  filter:sepia(18%) contrast(1.08) brightness(.9);transition:filter .4s,transform .4s}
.film-frame:hover img{filter:none;transform:scale(1.05)}
.film-frame-num{position:absolute;bottom:6px;right:8px;font-size:7px;
  letter-spacing:.18em;color:rgba(245,240,232,.4);font-family:'Space Mono',monospace}
/* No images uploaded state */
.film-upload-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;
  width:100%;height:340px;gap:16px;padding:40px}
.film-upload-icon{font-size:48px;opacity:.2}
.film-upload-title{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(245,240,232,.4)}
.film-upload-sub{font-size:10px;color:rgba(245,240,232,.25);text-align:center;line-height:1.7;max-width:400px}
@keyframes filmScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* ── S002 AUDIENCE ── */
.s002{padding:80px;flex-direction:column;justify-content:center;
  background:#0f0e0a;position:relative;overflow:hidden}
.s002-mesh{position:absolute;inset:0;z-index:0;pointer-events:none}
.s002-mesh::before{content:'';position:absolute;width:600px;height:600px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,69,0,.06),transparent 65%);
  top:-100px;left:-100px;animation:meshDrift1 14s ease-in-out infinite}
.s002-mesh::after{content:'';position:absolute;width:500px;height:500px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,150,50,.04),transparent 65%);
  bottom:-80px;right:-80px;animation:meshDrift2 18s ease-in-out infinite}
@keyframes meshDrift1{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,40px)}}
@keyframes meshDrift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-30px)}}
.s002-grid{position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(245,240,232,.02) 1px,transparent 1px),
    linear-gradient(90deg,rgba(245,240,232,.02) 1px,transparent 1px);
  background-size:80px 80px}
.s002-inner{max-width:1200px;margin:0 auto;width:100%;position:relative;z-index:1}
.s002h{margin-bottom:52px;display:flex;justify-content:space-between;align-items:flex-end}
.s002t{font-family:var(--font),serif;font-size:clamp(36px,6vw,68px);font-weight:900;
  letter-spacing:-2px;line-height:.9;color:#f5f0e8;display:inline-block}
.s002s{font-size:8px;letter-spacing:.28em;text-transform:uppercase;color:rgba(245,240,232,.3)}
.ag{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-bottom:2px}
.ab{background:rgba(245,240,232,.03);border:1px solid rgba(245,240,232,.06);
  padding:40px 28px;transition:all .35s;cursor:default;position:relative;overflow:hidden}
.ab::before{content:'';position:absolute;inset:0;background:var(--accent);
  transform:scaleY(0);transform-origin:bottom;transition:transform .35s cubic-bezier(.16,1,.3,1);z-index:0}
.ab:hover::before{transform:scaleY(1)}
.ab:hover{border-color:var(--accent)}
.ai,.av,.ak{position:relative;z-index:1}
.ai{font-size:22px;margin-bottom:18px;display:block}
.av{font-family:var(--font),serif;font-size:clamp(26px,4vw,46px);font-weight:900;
  letter-spacing:-2px;color:#f5f0e8;line-height:1;margin-bottom:7px;transition:color .3s;display:inline-block}
.ak{font-size:7px;letter-spacing:.28em;text-transform:uppercase;
  color:rgba(245,240,232,.35);transition:color .3s;display:inline-block}
.ab:hover .av{color:#0a0808}.ab:hover .ak{color:rgba(10,8,8,.6)}.ab:hover .ai{filter:brightness(0)}

/* FUN FACTS — below audience cards */
.fun-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:2px}
.fun-fact{background:rgba(245,240,232,.02);border:1px solid rgba(245,240,232,.05);
  padding:28px 24px;position:relative;overflow:hidden;transition:background .3s}
.fun-fact::before{content:'"';position:absolute;top:-10px;left:12px;
  font-family:var(--font),serif;font-size:120px;color:rgba(245,240,232,.04);line-height:1;pointer-events:none}
.fun-fact:hover{background:rgba(245,240,232,.04)}
.ff-num{font-family:var(--font),serif;font-size:clamp(32px,4vw,48px);font-weight:900;
  color:var(--accent);letter-spacing:-2px;line-height:1;margin-bottom:10px}
.ff-text{font-size:11px;line-height:1.7;color:#f5f0e8;display:inline-block}

/* ── MOCKUP ── */
.s003{padding:80px;background:#0a0808}
.s003-inner{max-width:1200px;margin:0 auto;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.mf{border:1px solid rgba(245,240,232,.08)}
.mh{background:rgba(245,240,232,.05);border-bottom:1px solid rgba(245,240,232,.08);
  padding:14px 20px;display:flex;justify-content:space-between;align-items:center}
.mt{font-size:7px;letter-spacing:.22em;text-transform:uppercase;color:#f5f0e8}
.mi{width:100%;display:block;min-height:300px;object-fit:cover;filter:brightness(.9) saturate(1.1)}
.mc{padding:12px 20px;font-size:7px;letter-spacing:.14em;text-transform:uppercase;
  color:rgba(245,240,232,.3);font-style:italic}
.ms h3{font-family:var(--font),serif;font-size:clamp(28px,4.5vw,54px);font-weight:900;
  letter-spacing:-2px;color:#f5f0e8;line-height:.9;margin-bottom:24px;display:inline-block}
.vt{display:inline-block;border:1px solid var(--accent);padding:5px 14px;
  font-size:7px;letter-spacing:.22em;text-transform:uppercase;color:#f5f0e8;margin-bottom:18px}
.hrr{width:100%;height:1px;background:rgba(245,240,232,.08);margin:24px 0}
.ms-body{font-size:12px;line-height:1.9;color:rgba(245,240,232,.65)}
.ms-body p{margin-bottom:14px;color:#f5f0e8}.ms-body p:last-child{margin-bottom:0}
.ms-body strong{color:var(--accent)}

/* ── CTA ── */
.s004{min-height:65vh;flex-direction:column;justify-content:center;padding:80px;
  text-align:center;background:var(--accent);position:relative;overflow:hidden}
.s004::before{content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,.25) 100%)}
.cp{font-family:var(--font),serif;font-size:clamp(70px,15vw,190px);font-weight:900;
  letter-spacing:-5px;line-height:.85;color:#0a0808;position:relative;z-index:1;display:inline-block}
.cs{font-size:10px;letter-spacing:.28em;text-transform:uppercase;
  color:#0a0808;margin:24px 0 10px;position:relative;z-index:1;opacity:.7;display:inline-block}
.cn2{font-size:8px;letter-spacing:.22em;text-transform:uppercase;
  color:rgba(10,8,5,.5);position:relative;z-index:1;margin-bottom:32px;display:block}
.cb{position:relative;z-index:1;background:#0a0808;color:var(--accent);
  font-size:9px;letter-spacing:.28em;text-transform:uppercase;padding:16px 48px;
  border:none;font-family:'Space Mono',monospace;cursor:none;transition:opacity .2s}
.cb:hover{opacity:.85}

footer{background:#060504;padding:32px 80px;display:flex;justify-content:space-between;
  align-items:center;border-top:1px solid rgba(245,240,232,.06)}
.fl{font-size:8px;letter-spacing:.28em;text-transform:uppercase;color:rgba(245,240,232,.35)}
.fr{font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent)}

@keyframes sUp{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:none}}
.hl{animation:sUp .9s cubic-bezier(.16,1,.3,1) both}
.l1{animation-delay:.1s}.l2{animation-delay:.22s}.l3{animation-delay:.34s}
nav{animation:sUp .7s cubic-bezier(.16,1,.3,1) .05s both}

@media(max-width:768px){
  .s001-inner,.s003-inner{grid-template-columns:1fr}
  .ag,.fun-facts{grid-template-columns:1fr 1fr}
  .s001,.s002,.s003,.s004{padding:48px 24px}
  .pr{padding-top:36px}
  nav{padding:18px 20px}
  .film-roll-label{padding:16px 24px}
  footer{padding:28px 24px;flex-direction:column;gap:12px;text-align:center}
}
  `;
}

// ============================================================
// HTML
// ============================================================
function buildHTML(creator, brand, pitch, scoreData, theme, heroLines, bgWords, mockUrl, profilePic, hasRealPhoto, postImages, hasPostImages, funFacts) {
  const handle    = (creator.instagram_handle||'creator').replace('@','');
  const followers = formatNumber(creator.instagram_followers);
  const eng       = creator.instagram_engagement_rate||4.2;
  const engMult   = (eng/1.5).toFixed(1);
  const fitScore  = scoreData?.fit_score||85;
  const genderPct = extractGenderPct(creator.audience_gender);
  const niche     = creator.primary_niche||'Content';
  const rate      = creator.base_rate_per_post||150;
  const isSvg     = profilePic.includes('dicebear');

  // Scattered bg words (random positions)
  const wordPositions = [
    {top:'12%',left:'8%',size:'clamp(24px,5vw,72px)',rot:'-8deg',dy:'-15px',rot2:'-6deg',dur:'14s',del:'0s'},
    {top:'22%',left:'62%',size:'clamp(20px,4vw,56px)',rot:'5deg',dy:'-22px',rot2:'7deg',dur:'17s',del:'-3s'},
    {top:'55%',left:'3%',size:'clamp(18px,3.5vw,48px)',rot:'-3deg',dy:'-18px',rot2:'-5deg',dur:'12s',del:'-6s'},
    {top:'70%',left:'55%',size:'clamp(22px,4.5vw,64px)',rot:'9deg',dy:'-25px',rot2:'11deg',dur:'19s',del:'-2s'},
    {top:'38%',left:'78%',size:'clamp(16px,3vw,40px)',rot:'-12deg',dy:'-12px',rot2:'-10deg',dur:'15s',del:'-8s'},
    {top:'82%',left:'22%',size:'clamp(20px,4vw,56px)',rot:'4deg',dy:'-20px',rot2:'6deg',dur:'13s',del:'-4s'},
    {top:'8%',left:'42%',size:'clamp(16px,3vw,40px)',rot:'7deg',dy:'-10px',rot2:'9deg',dur:'16s',del:'-1s'},
    {top:'48%',left:'34%',size:'clamp(28px,6vw,88px)',rot:'-6deg',dy:'-28px',rot2:'-4deg',dur:'20s',del:'-5s'},
  ];

  // Duplicate post images for seamless film loop
  const filmImages = hasPostImages
    ? [...postImages, ...postImages, ...postImages].slice(0, 24)
    : [];

  // Brand strip items
  const stripItems = [
    `CREATOR <span>@${handle}</span>`,
    `BRAND <span>${brand.name.toUpperCase()}</span>`,
    `NICHE <span>${niche.toUpperCase()}</span>`,
    `${followers} <span>FOLLOWERS</span>`,
    `${eng}% <span>ENGAGEMENT</span>`,
    `FIT SCORE <span>${fitScore}/100</span>`,
    `LOCATION <span>${(creator.audience_location||'INDIA').toUpperCase()}</span>`,
    `RATE <span>$${rate}/POST</span>`,
  ];
  const allStrip = [...stripItems, ...stripItems];

  return `
<div class="prog" id="prog"></div>
<div id="cur"><span>HOLD<br>AND<br>DRAG</span></div>
<div id="cdot"></div>

<nav>
  <span class="nl rainbow">${handle.toUpperCase()}</span>
  <span class="nc">SPONSORSHIP.PITCH</span>
  <div class="nr">
    <span>[ BRAND DECK ]</span>
    <span>[ 001 ]</span>
    <span>CONTACT</span>
  </div>
</nav>

<!-- HERO -->
<section id="hero">
  <div id="hero-bg"></div>
  <div id="hero-vignette"></div>
  <div id="hero-grain"></div>

  <!-- Scattered background words -->
  ${bgWords.slice(0,8).map((w,i) => {
    const p = wordPositions[i]||wordPositions[0];
    return `<div class="hero-word" style="top:${p.top};left:${p.left};font-size:${p.size};--rot:${p.rot};--dy:${p.dy};--rot2:${p.rot2};--dur:${p.dur};--del:${p.del}">${w}</div>`;
  }).join('')}

  <div class="ht">
    <div class="hl l1" data-speed="0.03">${heroLines[0]||'CREATE'}</div>
    <div class="hl l2" data-speed="-0.04">${heroLines[1]||'WITH'}</div>
    <div class="hl l3" data-speed="0.025">${heroLines[2]||'PURPOSE'}</div>
  </div>

  <!-- Brand info strip -->
  <div class="hero-brand-strip">
    <div class="hero-brand-inner">
      ${allStrip.map(s => `<div class="hero-brand-item">· ${s}</div>`).join('')}
    </div>
  </div>

  <canvas id="three-canvas"></canvas>
  <canvas id="sparkle-canvas"></canvas>
  <div class="sh"><div class="sl"></div>SCROLL FOR MORE<div class="sl"></div></div>
  <div class="arb">[ AR ]</div>
  <div class="ctb">001</div>
</section>

<!-- S001 — CREATOR -->
<section class="section s001">
  <div class="sc">001 / CREATOR</div>
  <div class="s001-inner">
    <div class="creator-profile">
      <div class="slb">The Creator</div>
      <div class="profile-pic-wrap">
        <img class="profile-pic${isSvg?' svg-av':''}" src="${profilePic}" alt="@${handle}">
        <div class="profile-pic-ring"></div>
        <div class="profile-pic-dot"></div>
      </div>
      ${!hasRealPhoto
        ? `<div class="upload-hint">↑ Add your photo in dashboard settings</div>`
        : `<div style="font-size:8px;letter-spacing:.16em;color:rgba(245,240,232,.3);text-transform:uppercase;display:flex;align-items:center;gap:8px"><span style="color:var(--accent)">✓</span> Public · Instagram</div>`}
      <div>
        <div class="ch"><span class="cat">@</span>${handle}</div>
        <div class="cn">${niche} Creator · ${creator.content_style||'Authentic'}</div>
      </div>
      <div class="sg">
        <div class="sb"><div class="sn rainbow">${followers}</div><div class="slbl">Followers</div></div>
        <div class="sb"><div class="sn rainbow">${eng}<span class="su">%</span></div><div class="slbl">Engagement · ${engMult}× avg</div></div>
        <div class="sb"><div class="sn rainbow">${genderPct}<span class="su">%</span></div><div class="slbl">Primary audience</div></div>
        <div class="sb"><div class="sn rainbow">${fitScore}<span class="su">/100</span></div><div class="slbl">Brand fit score</div></div>
      </div>
    </div>
    <div class="pr">
      <div class="ptag">The Pitch · ${brand.name}</div>
      <div class="pg rainbow">${brand.contact_name||`${brand.name} Partnerships Team`},</div>
      <div class="pb">${formatPitchBody(pitch.body)}</div>
    </div>
  </div>
</section>

<!-- FILM ROLL -->
<div class="film-roll-section">
  <div class="film-roll-label">Content Aesthetic · @${handle} · ${niche.toUpperCase()}</div>
  ${hasPostImages ? `
  <div class="film-roll-track">
    <div class="film-roll-inner">
      ${filmImages.map((url,i) => `
      <div class="film-frame">
        <img src="${url}" alt="post ${(i%postImages.length)+1}" loading="lazy"
          onerror="this.parentElement.style.background='rgba(255,255,255,.04)'">
        <span class="film-frame-num">${String((i%postImages.length)+1).padStart(2,'0')}</span>
      </div>`).join('')}
    </div>
  </div>` : `
  <div class="film-upload-placeholder">
    <div class="film-upload-icon">🎞</div>
    <div class="film-upload-title">Upload Your Best Posts</div>
    <div class="film-upload-sub">
      Add 6–9 of your best Instagram posts in dashboard settings.<br>
      They'll appear here as a cinematic film roll — showing brands exactly what your content looks like.<br>
      <span style="color:var(--accent)">No guessing. No AI generation. Just your real work.</span>
    </div>
  </div>`}
</div>

<!-- S002 — AUDIENCE -->
<section class="section s002">
  <div class="s002-mesh"></div>
  <div class="s002-grid"></div>
  <div class="sc" style="color:rgba(245,240,232,.16)">002 / AUDIENCE</div>
  <div class="s002-inner">
    <div class="s002h">
      <div class="s002t rainbow">WHO IS<br>WATCHING</div>
      <div class="s002s">Audience<br>breakdown</div>
    </div>
    <div class="ag">
      <div class="ab"><span class="ai">◎</span><div class="av">${genderPct}<span style="font-size:.5em;color:var(--accent)">%</span></div><div class="ak">Primary gender</div></div>
      <div class="ab"><span class="ai">◈</span><div class="av">${creator.audience_age_range||'18–34'}</div><div class="ak">Age range</div></div>
      <div class="ab"><span class="ai">◉</span><div class="av">${(creator.audience_location||'India').slice(0,3).toUpperCase()}</div><div class="ak">Top location</div></div>
      <div class="ab"><span class="ai">◆</span><div class="av">${eng}<span style="font-size:.5em;color:var(--accent)">%</span></div><div class="ak">Engagement rate</div></div>
    </div>
    <!-- FUN FACTS below cards -->
    <div class="fun-facts">
      ${funFacts.map((f,i) => `
      <div class="fun-fact">
        <div class="ff-num">0${i+1}</div>
        <div class="ff-text rainbow">${f}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- S003 — MOCKUP -->
<section class="section s003">
  <div class="sc">003 / MOCKUP</div>
  <div class="s003-inner">
    <div class="mf">
      <div class="mh">
        <span class="mt">AI Mockup — Sponsored Post Concept</span>
        <span style="font-size:7px;letter-spacing:.2em;color:rgba(245,240,232,.3)">◉ ◎ ◆</span>
      </div>
      <img class="mi" src="${mockUrl}" alt="Mockup" loading="lazy"
        onerror="this.style.minHeight='260px';this.style.background='rgba(255,69,0,.06)'">
      <div class="mc">Concept — creator-produced and brand-approved before posting</div>
    </div>
    <div class="ms">
      <span class="vt rainbow">[ @${handle} ]</span>
      <h3 class="rainbow">WHAT ${brand.name.toUpperCase()}<br>LOOKS LIKE<br>ON THIS FEED.</h3>
      <div class="hrr"></div>
      <div class="ms-body">
        <p>${scoreData?.score_reasoning||'Strong niche and demographic match.'}</p>
        <p>Approval before publishing. <strong>No long contracts.</strong> Simple and quick.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="section s004" style="min-height:60vh">
  <div class="cp rainbow">$${rate}</div>
  <div class="cs rainbow">Rate per sponsored post</div>
  <div class="cn2">No long contracts · Approval before posting · 48hr turnaround</div>
  <button class="cb" onclick="window.location.href='mailto:?subject=${brand.name} x @${handle}'">
    REPLY TO DISCUSS →
  </button>
</section>

<footer>
  <span class="fl">@${handle} · Instagram · ${niche} Creator</span>
  <span class="fr">Powered by Sponsorship Prospector</span>
</footer>`;
}

// ============================================================
// JS
// ============================================================
function buildJS(theme) {
  return `
// CURSOR
const cur=document.getElementById('cur'),cdot=document.getElementById('cdot');
let mx=0,my=0,cx=0,cy=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cdot.style.left=mx+'px';cdot.style.top=my+'px'});
setInterval(()=>{cx+=(mx-cx)*.12;cy+=(my-cy)*.12;cur.style.left=cx+'px';cur.style.top=cy+'px'},16);
document.querySelectorAll('button,.sb,.ab,.film-frame').forEach(el=>{
  el.addEventListener('mouseenter',()=>cur.classList.add('sm'));
  el.addEventListener('mouseleave',()=>cur.classList.remove('sm'));
});

// PROGRESS
window.addEventListener('scroll',()=>{
  document.getElementById('prog').style.width=(window.scrollY/(document.body.scrollHeight-window.innerHeight)*100)+'%';
});

// PARALLAX TEXT
document.addEventListener('mousemove',e=>{
  const rx=(e.clientX/window.innerWidth-.5)*2,ry=(e.clientY/window.innerHeight-.5)*2;
  document.querySelectorAll('.hl').forEach(el=>{
    const sp=parseFloat(el.dataset.speed||0);
    el.style.transform='translate('+(rx*sp*100)+'px,'+(ry*sp*40)+'px)';
  });
});

// SPARKLE PARTICLES
const spCanvas=document.getElementById('sparkle-canvas');
const spCtx=spCanvas.getContext('2d');
function resizeSp(){spCanvas.width=window.innerWidth;spCanvas.height=window.innerHeight}
resizeSp();
const particles=[];
let isHover=false;
const ACCENT_HEX='${theme.accent}';

class Sparkle{
  constructor(x,y){
    this.x=x;this.y=y;
    this.vx=(Math.random()-.5)*4;this.vy=(Math.random()-1.2)*5;
    this.life=1;this.decay=Math.random()*.025+.018;
    this.size=Math.random()*4+1;
    // Mix of accent, white, and gold
    const cols=[ACCENT_HEX,'#ffffff','#FFD700','#FF8C00','#FF6030'];
    this.color=cols[Math.floor(Math.random()*cols.length)];
    this.shape=Math.random()>.6?'star':'circle';
  }
  update(){this.x+=this.vx;this.y+=this.vy;this.vy+=.15;this.life-=this.decay}
  draw(){
    spCtx.save();spCtx.globalAlpha=this.life;
    spCtx.fillStyle=this.color;
    spCtx.shadowBlur=14;spCtx.shadowColor=this.color;
    if(this.shape==='star'){
      spCtx.translate(this.x,this.y);
      spCtx.rotate(this.life*3);
      spCtx.beginPath();
      for(let i=0;i<5;i++){
        const a=i*Math.PI*2/5-Math.PI/2;
        const x=Math.cos(a)*this.size,y=Math.sin(a)*this.size;
        i===0?spCtx.moveTo(x,y):spCtx.lineTo(x,y);
        const a2=a+Math.PI/5;
        spCtx.lineTo(Math.cos(a2)*this.size*.4,Math.sin(a2)*this.size*.4);
      }
      spCtx.closePath();spCtx.fill();
    }else{
      spCtx.beginPath();spCtx.arc(this.x,this.y,this.size,0,Math.PI*2);spCtx.fill();
    }
    spCtx.restore();
  }
}

const threeC=document.getElementById('three-canvas');
threeC.addEventListener('mousemove',e=>{
  isHover=true;
  if(Math.random()>.35){for(let i=0;i<4;i++)particles.push(new Sparkle(e.clientX,e.clientY))}
});
threeC.addEventListener('mouseleave',()=>{isHover=false});

function animateSparkles(){
  requestAnimationFrame(animateSparkles);
  spCtx.clearRect(0,0,spCanvas.width,spCanvas.height);
  for(let i=particles.length-1;i>=0;i--){
    particles[i].update();particles[i].draw();
    if(particles[i].life<=0)particles.splice(i,1);
  }
}
animateSparkles();

// THREE.JS
const canvas=document.getElementById('three-canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.7;

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,.1,100);
camera.position.z=5;

scene.add(new THREE.AmbientLight(0xffffff,.2));
const dl=new THREE.DirectionalLight(0xffffff,2);dl.position.set(4,5,3);scene.add(dl);
const pl=new THREE.PointLight(${parseInt(theme.accent.replace('#',''),16)},1.4,14);
pl.position.set(-3,2,-2);scene.add(pl);
const pl2=new THREE.PointLight(0xffffff,.5,8);pl2.position.set(3,-2,4);scene.add(pl2);
const hoverLight=new THREE.PointLight(${parseInt(theme.accent.replace('#',''),16)},0,8);
hoverLight.position.set(0,0,3);scene.add(hoverLight);
// Rim light
const rimLight=new THREE.PointLight(0xffffff,.3,10);rimLight.position.set(-4,-3,1);scene.add(rimLight);

const geo=new THREE.TorusKnotGeometry(1.1,.38,200,20,2,3);
const mat=new THREE.MeshStandardMaterial({
  color:0xD4B896,metalness:.98,roughness:.05,envMapIntensity:1.8
});
const obj=new THREE.Mesh(geo,mat);scene.add(obj);

const ring=new THREE.Mesh(
  new THREE.TorusGeometry(1.9,.01,8,120),
  new THREE.MeshBasicMaterial({color:${parseInt(theme.accent.replace('#',''),16)},transparent:true,opacity:.3})
);scene.add(ring);
const ring2=new THREE.Mesh(
  new THREE.TorusGeometry(1.4,.008,8,100),
  new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.1})
);ring2.rotation.x=Math.PI/3;scene.add(ring2);

// Floating particles around the object
const pGeo=new THREE.BufferGeometry();
const pPos=new Float32Array(80*3);
for(let i=0;i<80;i++){
  const r=2.5+Math.random()*.8,theta=Math.random()*Math.PI*2,phi=Math.random()*Math.PI;
  pPos[i*3]=r*Math.sin(phi)*Math.cos(theta);
  pPos[i*3+1]=r*Math.sin(phi)*Math.sin(theta);
  pPos[i*3+2]=r*Math.cos(phi);
}
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const pts=new THREE.Points(pGeo,new THREE.PointsMaterial({
  color:${parseInt(theme.accent.replace('#',''),16)},size:.04,transparent:true,opacity:.5,
  blending:THREE.AdditiveBlending
}));
scene.add(pts);

let isDrag=false,px2=0,py2=0,vx=0,vy=0;
canvas.addEventListener('mousedown',e=>{isDrag=true;px2=e.clientX;py2=e.clientY;vx=vy=0;cur.classList.add('drag')});
window.addEventListener('mouseup',()=>{isDrag=false;cur.classList.remove('drag')});
window.addEventListener('mousemove',e=>{
  if(!isDrag)return;
  vx=(e.clientX-px2)*.006;vy=(e.clientY-py2)*.006;
  obj.rotation.y+=vx;obj.rotation.x+=vy;px2=e.clientX;py2=e.clientY;
});

let t=0,hoverGlow=0;
(function loop(){
  requestAnimationFrame(loop);t+=.008;
  if(!isDrag){vx*=.93;vy*=.93;obj.rotation.y+=.004+vx;obj.rotation.x+=vy*.5}
  obj.position.y=Math.sin(t*.7)*.14;
  ring.rotation.z=t*.14;ring2.rotation.y=t*.18;
  pts.rotation.y=t*.05;
  const sp=window.scrollY/window.innerHeight;const sc=Math.max(.15,1-sp*.88);
  obj.scale.setScalar(sc);ring.scale.setScalar(sc);ring2.scale.setScalar(sc);pts.scale.setScalar(sc);
  obj.position.x=sp*3;
  hoverGlow+=(isHover?.07:-.05);hoverGlow=Math.max(0,Math.min(1,hoverGlow));
  hoverLight.intensity=hoverGlow*3;
  mat.emissive.setHex(isHover?${parseInt(theme.accent.replace('#',''),16)}:0x000000);
  mat.emissiveIntensity=hoverGlow*.3;
  renderer.render(scene,camera);
})();

window.addEventListener('resize',()=>{
  renderer.setSize(window.innerWidth,window.innerHeight);
  resizeSp();
  camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
});

// SCROLL REVEAL
const io=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)'}
}),{threshold:.08});
document.querySelectorAll('.sb,.ab,.pb,.ms-body,.mf,.ms,.cp,.profile-pic-wrap,.fun-fact,.film-roll-section').forEach(el=>{
  el.style.opacity='0';el.style.transform='translateY(36px)';
  el.style.transition='opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)';
  io.observe(el);
});
  `;
}

// ── HELPERS ──
function generateMockupUrl(creator, brand) {
  const p=[`aesthetic ${creator.primary_niche||'lifestyle'} instagram product post`,
    `${brand.name} branded item`,`${creator.audience_location||'global'} editorial`,
    'cinematic lighting','no text','no watermark','high quality'].join(', ');
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=600&height=400&nologo=true&seed=${hashString((creator.instagram_handle||'c')+brand.name)}`;
}
function hashString(s){let h=0;for(const c of s)h=((h<<5)-h+c.charCodeAt(0))|0;return Math.abs(h)%99999}
function formatNumber(n){if(!n)return'0';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return String(n)}
function extractGenderPct(g){if(!g)return'55';const m=g.match(/(\d+)/);return m?m[1]:'55'}
function formatPitchBody(b){if(!b)return'<p>Excited to explore a collaboration.</p>';return b.split('\n').filter(p=>p.trim()).map(p=>`<p>${p.trim()}</p>`).join('')}

// TEST
if(require.main===module){
  const creator={
    instagram_handle:'s.nova.vintage',
    instagram_followers:28000,
    instagram_engagement_rate:5.8,
    primary_niche:'vintage',
    secondary_niches:['fashion','lifestyle'],
    content_style:'aesthetic, curated, editorial',
    audience_gender:'72% female',
    audience_age_range:'18–32',
    audience_location:'India',
    audience_income:'middle class',
    base_rate_per_post:120,
    // profile_photo_url: 'https://your-supabase-url.../photo.jpg',
    // post_images: [
    //   'https://your-supabase-url.../post1.jpg',
    //   'https://your-supabase-url.../post2.jpg',
    //   ... up to 9 images
    // ],
  };
  const brand ={name:'Nykaa',industry:'Beauty',contact_name:'Partnerships Team'};
  const pitch ={body:`Nykaa's curation is exactly what my followers save on their wishlists every weekend — I figured it was time to make it official.\n\nWith 28,000 followers at a 5.8% engagement rate — nearly four times the industry average — my audience isn't just watching, they're buying. 72% are women aged 18–32 who already spend on curated beauty and fashion. They trust me because I'm one of them.\n\nOne post. $120. And it looks like it was always meant to be yours.`};
  const score ={fit_score:88,score_reasoning:"Perfect niche and demographic match — vintage aesthetic creator for India's leading beauty platform targeting young women."};
  const html=buildPitchPage(creator,brand,pitch,score);
  const fs=require('fs'),path=require('path');
  fs.writeFileSync(path.join(__dirname,'..','docs','generated_pitch.html'),html);
  console.log('\n✅ Generated: docs/generated_pitch.html');
  console.log('\n📋 To add real post images, add post_images[] to the creator object:');
  console.log('   post_images: ["https://...", "https://...", ...] (6-9 URLs from Supabase Storage)');
  console.log('\n📸 To add profile photo, add profile_photo_url to the creator object');
  console.log('\nOpen docs/generated_pitch.html in browser!');
}

module.exports={buildPitchPage};