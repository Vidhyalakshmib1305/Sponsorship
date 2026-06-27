// ============================================================
// backend/server.js
// Local Express API server — bridges frontend ↔ orchestrator
// Run: node backend/server.js
// Runs on: http://localhost:3001
// ============================================================

require('dotenv').config({ path: './.env' });

const express    = require('express');
const cors       = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { runPipeline }  = require('../agents/orchestrator');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Supabase client (service role — server side only) ──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Middleware ──
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Auth middleware — verifies Supabase JWT ──
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
}

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ──────────────────────────────────────────────────────────
// POST /api/pipeline/run
// Runs the full pipeline for a creator
// Body: { brandLimit?, maxPitches?, deployPages? }
// ──────────────────────────────────────────────────────────
app.post('/api/pipeline/run', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch creator profile from Supabase
    const { data: creator, error: creatorErr } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (creatorErr || !creator) {
      return res.status(404).json({ error: 'Creator profile not found. Please complete onboarding.' });
    }

    // 2. Check if creator has basic info
    if (!creator.primary_niche || !creator.instagram_handle) {
      return res.status(400).json({ error: 'Complete your profile before running the pipeline.' });
    }

    // 3. Save agent run record
    const { data: agentRun } = await supabase
      .from('agent_runs')
      .insert({
        user_id:     userId,
        creator_id:  creator.id,
        status:      'running',
        started_at:  new Date().toISOString(),
      })
      .select()
      .single();

    // 4. Send immediate response — pipeline runs async
    res.json({
      success:      true,
      message:      'Pipeline started',
      run_id:       agentRun?.id,
      creator:      creator.instagram_handle,
      estimated_time: '2-3 minutes',
    });

    // 5. Run pipeline in background — limits depend on plan
    const PLAN_LIMITS = {
      free:    { brandLimit: 10, maxPitches: 3  },
      starter: { brandLimit: 20, maxPitches: 10 },
      pro:     { brandLimit: 25, maxPitches: 25 },
      agency:  { brandLimit: 50, maxPitches: 25 },
    };
    const planLimits = PLAN_LIMITS[creator.plan || 'free'] || PLAN_LIMITS.free;

    runPipeline(creator, {
      brandLimit:  req.body.brandLimit  || planLimits.brandLimit,
      maxPitches:  req.body.maxPitches  || planLimits.maxPitches,
      deployPages: req.body.deployPages !== false,
    }).then(async result => {
      // 6. Save results to Supabase
      // Save brands
      if (result.brands?.length > 0) {
        const brandRows = result.brands.map(b => ({
          user_id:          userId,
          creator_id:       creator.id,
          name:             b.name,
          industry:         b.industry,
          website:          b.website,
          marketing_email:  b.marketing_email,
          fit_score:        b.fit_score,
          niche_match:      b.niche_match,
          audience_match:   b.audience_match,
          should_pitch:     b.should_pitch,
          avg_deal_size_usd: b.avg_deal_size_usd || b.budget_estimate,
          score_reasoning:  b.score_reasoning,
          reply_likelihood: b.reply_likelihood,
          market:           b.market,
          source:           b.source,
          discovered_at:    b.discovered_at || new Date().toISOString(),
        }));

        await supabase.from('brand_leads').insert(brandRows);
      }

      // Save pitches
      if (result.pages?.length > 0) {
        const pitchRows = result.pages.map(p => ({
          user_id:          userId,
          creator_id:       creator.id,
          brand_name:       p.brand_name,
          brand_email:      p.brand_email,
          subject:          p.subject,
          pitch_page_url:   p.pitch_url,
          fit_score:        p.fit_score,
          status:           p.pitch_url ? 'sent_ready' : 'built',
          view_token:       p.view_token || null,
          view_count:       0,
          created_at:       new Date().toISOString(),
        }));

        await supabase.from('pitches').insert(pitchRows);
      }

      // Update agent run
      await supabase.from('agent_runs').update({
        status:       'completed',
        completed_at: new Date().toISOString(),
        brands_found: result.stats.total_brands_found,
        pitches_sent: result.stats.pages_deployed,
        result_data:  result.stats,
      }).eq('id', agentRun?.id);

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: userId,
        type:    'pipeline_complete',
        title:   `${result.stats.pages_deployed} pitch pages ready!`,
        body:    `Found ${result.stats.total_brands_found} brands, created ${result.stats.pages_deployed} cinematic pitch pages for @${creator.instagram_handle}.`,
        data:    { pages: result.pages },
      });

      console.log(`[Server] ✅ Pipeline complete for @${creator.instagram_handle}`);

    }).catch(async err => {
      console.error(`[Server] ❌ Pipeline error:`, err.message);
      await supabase.from('agent_runs').update({
        status: 'failed',
        error:  err.message,
        completed_at: new Date().toISOString(),
      }).eq('id', agentRun?.id);
    });

  } catch (err) {
    console.error('[Server] /api/pipeline/run error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/pipeline/status/:runId
// Check status of a pipeline run
// ──────────────────────────────────────────────────────────
app.get('/api/pipeline/status/:runId', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('id', req.params.runId)
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Run not found' });
  res.json(data);
});

// ──────────────────────────────────────────────────────────
// GET /api/pitches
// Get all pitches for the logged-in creator
// ──────────────────────────────────────────────────────────
app.get('/api/pitches', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('pitches')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ pitches: data || [] });
});

// ──────────────────────────────────────────────────────────
// GET /api/brands
// Get all brand leads for the logged-in creator
// ──────────────────────────────────────────────────────────
app.get('/api/brands', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('brand_leads')
    .select('*')
    .eq('user_id', req.user.id)
    .order('fit_score', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ brands: data || [] });
});

// ──────────────────────────────────────────────────────────
// GET /api/creator
// Get creator profile
// ──────────────────────────────────────────────────────────
app.get('/api/creator', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
});

// ──────────────────────────────────────────────────────────
// PUT /api/creator
// Update creator profile
// ──────────────────────────────────────────────────────────
app.put('/api/creator', requireAuth, async (req, res) => {
  const allowed = [
    'instagram_handle', 'instagram_followers', 'instagram_engagement_rate',
    'primary_niche', 'secondary_niches', 'content_style',
    'audience_gender', 'audience_age_range', 'audience_location', 'audience_income',
    'base_rate_per_post', 'profile_photo_url', 'post_images',
    'youtube_handle', 'youtube_subscribers', 'content_language', 'plan',
  ];

  const updates = {};
  allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('creators')
    .update(updates)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ──────────────────────────────────────────────────────────
// POST /api/upload/photo
// Upload profile photo to Supabase Storage
// Body: { base64: '...', filename: 'photo.jpg' }
// ──────────────────────────────────────────────────────────
app.post('/api/upload/photo', requireAuth, async (req, res) => {
  try {
    const { base64, filename, contentType } = req.body;
    if (!base64) return res.status(400).json({ error: 'No image data provided' });

    const buffer   = Buffer.from(base64, 'base64');
    const filePath = `avatars/${req.user.id}/${filename || 'photo.jpg'}`;

    const { error: uploadError } = await supabase.storage
      .from('creator-media')
      .upload(filePath, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert:      true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('creator-media')
      .getPublicUrl(filePath);

    // Save URL to creator profile
    await supabase.from('creators')
      .update({ profile_photo_url: urlData.publicUrl })
      .eq('user_id', req.user.id);

    res.json({ url: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/upload/posts
// Upload post images to Supabase Storage
// Body: { images: [{ base64, filename, contentType }] }
// ──────────────────────────────────────────────────────────
app.post('/api/upload/posts', requireAuth, async (req, res) => {
  try {
    const { images } = req.body;
    if (!images?.length) return res.status(400).json({ error: 'No images provided' });
    if (images.length > 9) return res.status(400).json({ error: 'Maximum 9 images allowed' });

    const urls = [];

    for (let i = 0; i < images.length; i++) {
      const { base64, filename, contentType } = images[i];
      const buffer   = Buffer.from(base64, 'base64');
      const filePath = `posts/${req.user.id}/${filename || `post-${i+1}.jpg`}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-media')
        .upload(filePath, buffer, {
          contentType: contentType || 'image/jpeg',
          upsert:      true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('creator-media')
        .getPublicUrl(filePath);

      urls.push(urlData.publicUrl);
    }

    // Save URLs to creator profile
    await supabase.from('creators')
      .update({ post_images: urls })
      .eq('user_id', req.user.id);

    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/notifications
// Get notifications for logged-in user
// ──────────────────────────────────────────────────────────
app.get('/api/notifications', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notifications: data || [] });
});

// ──────────────────────────────────────────────────────────
// GET /api/stats
// Dashboard stats for logged-in creator
// ──────────────────────────────────────────────────────────
app.get('/api/stats', requireAuth, async (req, res) => {
  const uid = req.user.id;

  const [brands, pitches, runs] = await Promise.all([
    supabase.from('brand_leads').select('fit_score', { count: 'exact' }).eq('user_id', uid),
    supabase.from('pitches').select('status', { count: 'exact' }).eq('user_id', uid),
    supabase.from('agent_runs').select('status', { count: 'exact' }).eq('user_id', uid),
  ]);

  const pitchList    = pitches.data || [];
  const brandList    = brands.data || [];
  const avgFitScore  = brandList.length
    ? Math.round(brandList.reduce((s,b) => s + (b.fit_score||0), 0) / brandList.length)
    : 0;

  res.json({
    total_brands:     brands.count || 0,
    total_pitches:    pitches.count || 0,
    total_runs:       runs.count || 0,
    pitches_ready:    pitchList.filter(p => p.status === 'sent_ready').length,
    avg_fit_score:    avgFitScore,
  });
});

// ──────────────────────────────────────────────────────────
// GET /api/instagram/fetch/:handle
// Fetch Instagram profile data via Apify Instagram Scraper
// ──────────────────────────────────────────────────────────
app.get('/api/instagram/fetch/:handle', requireAuth, async (req, res) => {
  const { handle }    = req.params;
  const APIFY_TOKEN   = process.env.APIFY_API_TOKEN;

  if (!APIFY_TOKEN) {
    return res.json({ error: 'APIFY_API_TOKEN not configured', manual: true });
  }

  try {
    const apifyRes = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directUrls:   [`https://www.instagram.com/${handle}/`],
          resultsType:  'details',
          resultsLimit: 12,
        }),
      }
    );

    if (!apifyRes.ok) {
      const err = await apifyRes.text();
      return res.status(apifyRes.status).json({ error: `Apify error: ${err.slice(0, 200)}`, manual: true });
    }

    const items = await apifyRes.json();
    const user  = Array.isArray(items) ? items[0] : items;

    if (!user || !user.username) {
      return res.status(404).json({ error: 'Instagram profile not found', manual: true });
    }

    const followers    = user.followersCount || 0;
    const latestPosts  = user.latestPosts || [];

    // Engagement rate: avg likes of last 12 posts / followersCount * 100
    let engagementRate = 0;
    if (latestPosts.length > 0 && followers > 0) {
      const avgLikes = latestPosts.reduce((s, p) => s + (p.likesCount || 0), 0) / latestPosts.length;
      engagementRate = parseFloat(((avgLikes / followers) * 100).toFixed(2));
    }

    const recentPosts = latestPosts.slice(0, 9).map(p => ({
      thumbnail_url: p.imageUrl || null,
      type:          p.type === 'Video' ? 'reel' : 'image',
      likes:         p.likesCount || 0,
    })).filter(p => p.thumbnail_url);

    res.json({
      profile_pic_url: user.profilePicUrlHD || user.profilePicUrl || null,
      followers,
      following:       user.followingCount  || 0,
      posts_count:     user.postsCount      || 0,
      engagement_rate: engagementRate,
      bio:             user.biography       || '',
      full_name:       user.fullName        || '',
      recent_posts:    recentPosts,
    });
  } catch (err) {
    console.error('[Server] Instagram fetch error:', err.message);
    res.status(500).json({ error: err.message, manual: true });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/pitch/view/:token
// Tracking pixel — brand opened the pitch page
// Returns 1×1 transparent GIF, increments view_count
// ──────────────────────────────────────────────────────────
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

app.get('/api/pitch/view/:token', async (req, res) => {
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(TRANSPARENT_GIF);

  // Increment view count in background — non-blocking
  const { token } = req.params;
  if (!token) return;

  supabase
    .from('pitches')
    .select('id, view_count')
    .eq('view_token', token)
    .single()
    .then(({ data }) => {
      if (!data) return;
      return supabase
        .from('pitches')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
    })
    .catch(() => {});
});

// ── Start server ──
app.listen(PORT, () => {
  console.log('\n' + '═'.repeat(50));
  console.log('SPONSORSHIP PROSPECTOR — API SERVER');
  console.log('═'.repeat(50));
  console.log(`🚀 Running at: http://localhost:${PORT}`);
  console.log(`📦 Supabase:   ${process.env.SUPABASE_URL}`);
  console.log(`🌐 Frontend:   ${process.env.APP_URL || 'http://localhost:5173'}`);
  console.log('═'.repeat(50));
  console.log('\nEndpoints:');
  console.log('  POST /api/pipeline/run      — Run full pipeline');
  console.log('  GET  /api/pipeline/status/:id — Check run status');
  console.log('  GET  /api/creator           — Get profile');
  console.log('  PUT  /api/creator           — Update profile');
  console.log('  GET  /api/brands            — Get brand leads');
  console.log('  GET  /api/pitches           — Get pitches');
  console.log('  GET  /api/stats             — Dashboard stats');
  console.log('  POST /api/upload/photo      — Upload profile photo');
  console.log('  POST /api/upload/posts      — Upload post images');
  console.log('  GET  /api/notifications     — Get notifications');
  console.log('  GET  /api/instagram/fetch/:h — Fetch Instagram data');
  console.log('  GET  /api/pitch/view/:token  — Tracking pixel');
  console.log('\nPress Ctrl+C to stop.\n');
});

module.exports = app;