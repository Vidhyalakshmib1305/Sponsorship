// ============================================================
// agents/emailBuilder.js
// Builds stunning HTML pitch emails with AI-generated mockup
// images via Pollinations.ai (free, no API key needed)
// ============================================================

require('dotenv').config({ path: '../.env' });

// ============================================================
// MAIN FUNCTION — build HTML email from pitch data
// ============================================================
async function buildHTMLEmail(pitch, creator) {
  const mockupImageUrl = generateMockupImageUrl(creator, pitch.brand_name);
  const html           = buildEmailHTML(pitch, creator, mockupImageUrl);

  return {
    subject:        pitch.subject,
    html_body:      html,
    text_body:      pitch.body, // plain text fallback
    to_email:       pitch.brand_email,
    mockup_url:     mockupImageUrl,
    brand_name:     pitch.brand_name,
    generated_at:   new Date().toISOString(),
  };
}

// ============================================================
// POLLINATIONS.AI — free image generation, no API key
// Generates a realistic mockup of creator + brand product
// ============================================================
function generateMockupImageUrl(creator, brandName) {
  const prompt = [
    `professional instagram influencer holding ${brandName} product`,
    `${creator.primary_niche} creator`,
    `${creator.audience_location || 'urban'} aesthetic`,
    'clean studio background',
    'soft natural lighting',
    'instagram style photo',
    'high quality realistic',
    'no text no watermark',
  ].join(', ');

  const encoded = encodeURIComponent(prompt);
  // Pollinations.ai — completely free, no key, no signup
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=600&nologo=true&seed=${Date.now()}`;
}

// ============================================================
// HTML EMAIL BUILDER
// Professional, beautiful, responsive email template
// ============================================================
function buildEmailHTML(pitch, creator, mockupImageUrl) {
  const brandColor  = getBrandColor(pitch.brand_name);
  const engagementMultiple = ((creator.instagram_engagement_rate || 4.2) / 1.5).toFixed(1);
  const audienceHighlight  = getAudienceHighlight(creator);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${pitch.subject}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #1a1a1a; }
  .wrapper { max-width: 620px; margin: 0 auto; background: #ffffff; }
  .hero { background: linear-gradient(135deg, ${brandColor}15, ${brandColor}30); padding: 48px 40px 32px; text-align: center; border-bottom: 3px solid ${brandColor}; }
  .hero-tag { display: inline-block; background: ${brandColor}; color: white; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 20px; }
  .hero-handle { font-size: 28px; font-weight: 700; color: #0a0a0a; margin-bottom: 6px; }
  .hero-niche { font-size: 14px; color: #666; letter-spacing: 0.06em; text-transform: uppercase; }
  .stats-row { display: flex; gap: 0; border-bottom: 1px solid #f0f0f0; }
  .stat-box { flex: 1; padding: 28px 20px; text-align: center; border-right: 1px solid #f0f0f0; }
  .stat-box:last-child { border-right: none; }
  .stat-val { font-size: 26px; font-weight: 800; color: ${brandColor}; line-height: 1; margin-bottom: 6px; }
  .stat-label { font-size: 11px; color: #888; letter-spacing: 0.08em; text-transform: uppercase; }
  .stat-sub { font-size: 10px; color: #aaa; margin-top: 3px; }
  .body-section { padding: 40px; }
  .greeting { font-size: 16px; color: #444; margin-bottom: 24px; line-height: 1.7; }
  .greeting strong { color: #0a0a0a; }
  .pitch-text { font-size: 15px; line-height: 1.85; color: #333; white-space: pre-line; }
  .audience-card { background: linear-gradient(135deg, ${brandColor}08, ${brandColor}15); border: 1px solid ${brandColor}30; border-radius: 12px; padding: 24px; margin: 28px 0; }
  .audience-card-title { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${brandColor}; margin-bottom: 16px; }
  .audience-grid { display: flex; gap: 16px; flex-wrap: wrap; }
  .audience-item { flex: 1; min-width: 100px; }
  .audience-item-val { font-size: 18px; font-weight: 700; color: #0a0a0a; }
  .audience-item-label { font-size: 11px; color: #888; margin-top: 2px; }
  .mockup-section { padding: 0 40px 32px; }
  .mockup-title { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #888; margin-bottom: 16px; }
  .mockup-img { width: 100%; border-radius: 12px; border: 1px solid #eee; display: block; }
  .mockup-caption { font-size: 11px; color: #aaa; margin-top: 8px; text-align: center; font-style: italic; }
  .cta-section { padding: 0 40px 40px; }
  .cta-box { background: #0a0a0a; border-radius: 12px; padding: 32px; text-align: center; }
  .cta-rate { font-size: 13px; color: #888; margin-bottom: 8px; letter-spacing: 0.06em; text-transform: uppercase; }
  .cta-price { font-size: 36px; font-weight: 800; color: white; margin-bottom: 4px; }
  .cta-per { font-size: 13px; color: #888; margin-bottom: 24px; }
  .cta-btn { display: inline-block; background: ${brandColor}; color: white; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; padding: 14px 36px; border-radius: 8px; text-decoration: none; text-transform: uppercase; }
  .cta-note { font-size: 11px; color: #666; margin-top: 12px; }
  .footer { padding: 24px 40px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
  .footer-handle { font-size: 13px; color: #888; }
  .footer-platform { font-size: 11px; color: #bbb; }
  .divider { height: 1px; background: #f0f0f0; margin: 0 40px; }
  @media (max-width: 480px) {
    .hero { padding: 32px 24px 24px; }
    .body-section { padding: 28px 24px; }
    .mockup-section, .cta-section { padding-left: 24px; padding-right: 24px; }
    .footer { padding: 20px 24px; flex-direction: column; gap: 8px; text-align: center; }
    .stats-row { flex-wrap: wrap; }
    .stat-box { min-width: 50%; border-bottom: 1px solid #f0f0f0; }
  }
</style>
</head>
<body>
<div class="wrapper">

  <!-- HERO -->
  <div class="hero">
    <span class="hero-tag">Sponsorship Pitch</span>
    <div class="hero-handle">@${creator.instagram_handle || 'creator'}</div>
    <div class="hero-niche">${creator.primary_niche} Creator · ${creator.audience_location || 'Global'}</div>
  </div>

  <!-- STATS -->
  <div class="stats-row">
    <div class="stat-box">
      <div class="stat-val">${formatNumber(creator.instagram_followers)}</div>
      <div class="stat-label">Followers</div>
      <div class="stat-sub">Instagram</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${creator.instagram_engagement_rate || 4.2}%</div>
      <div class="stat-label">Engagement</div>
      <div class="stat-sub">${engagementMultiple}× industry avg</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${audienceHighlight.primary}%</div>
      <div class="stat-label">${audienceHighlight.label}</div>
      <div class="stat-sub">${audienceHighlight.sub}</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${pitch.fit_score || 85}</div>
      <div class="stat-label">Fit Score</div>
      <div class="stat-sub">out of 100</div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body-section">
    <p class="greeting">Hi <strong>${pitch.brand_data?.contact_name || 'there'}</strong>,</p>
    <p class="pitch-text">${pitch.body?.replace(/\n/g, '<br>') || ''}</p>
  </div>

  <!-- AUDIENCE CARD -->
  <div style="padding: 0 40px;">
    <div class="audience-card">
      <div class="audience-card-title">Who's watching</div>
      <div class="audience-grid">
        <div class="audience-item">
          <div class="audience-item-val">${creator.audience_gender?.split(',')[0] || '55% Male'}</div>
          <div class="audience-item-label">Primary gender</div>
        </div>
        <div class="audience-item">
          <div class="audience-item-val">${creator.audience_age_range || '20-35'}</div>
          <div class="audience-item-label">Age range</div>
        </div>
        <div class="audience-item">
          <div class="audience-item-val">${creator.audience_location || 'India'}</div>
          <div class="audience-item-label">Top location</div>
        </div>
        <div class="audience-item">
          <div class="audience-item-val">${creator.audience_income || 'Middle'}</div>
          <div class="audience-item-label">Income level</div>
        </div>
      </div>
    </div>
  </div>

  <!-- AI MOCKUP IMAGE -->
  <div class="mockup-section" style="padding-top: 28px;">
    <div class="mockup-title">What a sponsored post could look like</div>
    <img class="mockup-img" src="${mockupImageUrl}" alt="Sponsored post mockup for ${pitch.brand_name}" loading="lazy">
    <div class="mockup-caption">AI-generated mockup — actual content will be creator-produced and brand-approved</div>
  </div>

  <div class="divider"></div>

  <!-- CTA -->
  <div class="cta-section" style="padding-top: 32px;">
    <div class="cta-box">
      <div class="cta-rate">Rate per post</div>
      <div class="cta-price">$${creator.base_rate_per_post || 150}</div>
      <div class="cta-per">per sponsored post</div>
      <a href="mailto:${creator.contact_email || 'creator@email.com'}?subject=Re: ${pitch.subject}" class="cta-btn">Reply to discuss →</a>
      <div class="cta-note">No long contracts · Approval before posting · Simple process</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-handle">@${creator.instagram_handle || 'creator'} · Instagram</div>
    <div class="footer-platform">Sent via Sponsorship Prospector</div>
  </div>

</div>
</body>
</html>`;
}

// ============================================================
// HELPERS
// ============================================================
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000)    return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getAudienceHighlight(creator) {
  const gender = creator.audience_gender?.toLowerCase() || '';
  if (gender.includes('female') || gender.includes('women')) {
    const pct = parseInt(gender.match(/(\d+)/)?.[1] || '60');
    return { primary: pct, label: 'Female', sub: creator.audience_age_range || '18-34' };
  }
  if (gender.includes('male') || gender.includes('men')) {
    const pct = parseInt(gender.match(/(\d+)/)?.[1] || '55');
    return { primary: pct, label: 'Male', sub: creator.audience_age_range || '20-35' };
  }
  return { primary: 74, label: 'Active users', sub: 'weekly' };
}

// Brand color map — fallback to a professional dark color
function getBrandColor(brandName) {
  const colors = {
    'cult.fit':   '#ff5a36', cultfit: '#ff5a36',
    'myprotein':  '#003087',
    'decathlon':  '#0082c3',
    'nike':       '#000000',
    'adidas':     '#000000',
    'puma':       '#e31837',
    'nykaa':      '#fc2779',
    'myntra':     '#ff3f6c',
    'mamaearth':  '#2e7d32',
    'boat':       '#1a1a1a',
    'healthkart': '#ef5350',
    'gymshark':   '#1a1a1a',
    'lululemon':  '#000000',
    'glossier':   '#f8c0c8',
    'sephora':    '#000000',
  };
  const key = brandName?.toLowerCase().replace(/\s/g, '');
  return colors[key] || '#6366f1'; // indigo as default
}

// ============================================================
// TEST — node agents/emailBuilder.js
// ============================================================
async function test() {
  console.log('[EmailBuilder] Building HTML email...\n');

  const testCreator = {
    instagram_handle:          'testcreator',
    instagram_followers:       45000,
    instagram_engagement_rate: 4.2,
    primary_niche:             'fitness',
    secondary_niches:          ['health', 'lifestyle'],
    content_style:             'motivational, educational',
    audience_gender:           '55% male, 45% female',
    audience_age_range:        '20-35',
    audience_location:         'India',
    audience_income:           'Middle class',
    base_rate_per_post:        150,
    contact_email:             'testcreator@gmail.com',
  };

  const testPitch = {
    brand_name:  'Cult.fit',
    brand_email: 'partnerships@cult.fit',
    subject:     'Cult.fit in my DMs',
    body:        `Cult.fit's home workout programs have been the reason my followers actually show up on days they don't feel like it — that kind of impact deserves a proper conversation.\n\nMy Instagram has 45,000 followers with a 4.2% engagement rate — roughly double what most accounts pull — and 55% of them are 20-35 Indian men who already spend ₹3,000+ monthly on fitness. They don't need convincing about fitness. They just need someone they trust pointing them to the right platform.\n\nHappy to send a media kit. $150 a post, and I make it count.`,
    fit_score:   92,
    brand_data:  { contact_name: 'Partnerships Team' },
  };

  const email = await buildHTMLEmail(testPitch, testCreator);

  // Save to file so you can open it in browser
  const fs   = require('fs');
  const path = require('path');
  const out  = path.join(__dirname, '..', 'docs', 'sample_pitch_email.html');
  fs.writeFileSync(out, email.html_body);

  console.log(`✅ HTML email built`);
  console.log(`📄 Saved to: docs/sample_pitch_email.html`);
  console.log(`🖼️  Mockup URL: ${email.mockup_url}`);
  console.log(`\nOpen docs/sample_pitch_email.html in your browser to preview!`);
}

if (require.main === module) {
  test().catch(console.error);
}

module.exports = { buildHTMLEmail, generateMockupImageUrl };