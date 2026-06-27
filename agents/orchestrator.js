// ============================================================
// agents/orchestrator.js
// Master agent — chains all agents into one pipeline
//
// FLOW:
// 1. findBrands      → discover relevant brands
// 2. scoreBrands     → score each brand 0–100
// 3. writePitches    → write personalized emails
// 4. buildPitchPage  → generate cinematic HTML page
// 5. deployPitchPage → push to GitHub → live on Render
// 6. return          → URLs + pitch data back to creator
//
// Usage:
//   const { runPipeline } = require('./orchestrator');
//   const result = await runPipeline(creator, { brandLimit: 20 });
// ============================================================

require('dotenv').config({ path: '../.env' });

const { randomUUID } = require('crypto');
const { findBrands }     = require('./brandFinder');
const { scoreBrands }    = require('./brandScorer');
const { writePitches }   = require('./pitchWriter');
const { buildPitchPage } = require('./pitchPageBuilder');
const { deployPitchPage } = require('./deployer');

// ============================================================
// MAIN PIPELINE
// ============================================================
async function runPipeline(creator, options = {}) {
  const brandLimit  = options.brandLimit  || 10;   // free tier default
  const maxPitches  = options.maxPitches  || 3;   // free tier default
  const deployPages = options.deployPages !== false; // default true

  const startTime = Date.now();

  console.log('\n' + '═'.repeat(60));
  console.log('SPONSORSHIP PROSPECTOR — PIPELINE START');
  console.log('═'.repeat(60));
  console.log(`Creator:  @${creator.instagram_handle}`);
  console.log(`Niche:    ${creator.primary_niche}`);
  console.log(`Tier:     ${creator.instagram_followers?.toLocaleString('en-US')} followers`);
  console.log(`Audience: ${creator.audience_gender || 'mixed'} · ${creator.audience_age_range || '18-34'} · ${creator.audience_location || 'global'}`);
  console.log('═'.repeat(60));

  const result = {
    creator,
    brands:    [],
    pitches:   [],
    pages:     [],
    errors:    [],
    stats:     {},
  };

  // ──────────────────────────────────────────
  // STEP 1 — FIND BRANDS
  // ──────────────────────────────────────────
  console.log('\n[1/5] 🔍 Finding brands...');
  let tier;
  try {
    const found = await findBrands(creator, { limit: brandLimit });
    result.brands = found.brands;
    tier          = found.tier;
    console.log(`[1/5] ✅ Found ${result.brands.length} brands | Tier: ${tier.label}`);
  } catch (err) {
    console.error('[1/5] ❌ brandFinder failed:', err.message);
    result.errors.push({ step: 'findBrands', error: err.message });
    return result; // can't continue without brands
  }

  if (result.brands.length === 0) {
    console.warn('[1/5] ⚠️  No brands found — check creator profile data');
    return result;
  }

  // ──────────────────────────────────────────
  // STEP 2 — SCORE BRANDS
  // ──────────────────────────────────────────
  console.log('\n[2/5] 📊 Scoring brands...');
  let pitchableBrands = [];
  try {
    const { scored, pitchable, skipped } = await scoreBrands(result.brands, creator);
    result.brands     = scored;
    pitchableBrands   = pitchable.slice(0, maxPitches); // top N only
    console.log(`[2/5] ✅ Scored ${scored.length} | Pitchable: ${pitchable.length} | Skipped: ${skipped.length}`);
    console.log(`[2/5] 🎯 Top ${pitchableBrands.length} brands selected for pitching:`);
    pitchableBrands.forEach((b, i) => {
      console.log(`       ${i+1}. ${b.name} — ${b.fit_score}/100 (${b.reply_likelihood} reply chance)`);
    });
  } catch (err) {
    console.error('[2/5] ❌ brandScorer failed:', err.message);
    result.errors.push({ step: 'scoreBrands', error: err.message });
    // Use top brands by avg_deal_size as fallback
    pitchableBrands = result.brands.slice(0, maxPitches);
  }

  if (pitchableBrands.length === 0) {
    console.warn('[2/5] ⚠️  No pitchable brands found — try a different niche or location');
    return result;
  }

  // ──────────────────────────────────────────
  // STEP 3 — WRITE PITCHES
  // ──────────────────────────────────────────
  console.log('\n[3/5] ✍️  Writing pitch emails...');
  let writtenPitches = [];
  try {
    writtenPitches = await writePitches(pitchableBrands, creator);
    result.pitches = writtenPitches;
    console.log(`[3/5] ✅ Written ${writtenPitches.length} pitches`);
  } catch (err) {
    console.error('[3/5] ❌ pitchWriter failed:', err.message);
    result.errors.push({ step: 'writePitches', error: err.message });
    // Fallback — use basic pitch template
    writtenPitches = pitchableBrands.map(brand => ({
      brand_name:   brand.name,
      brand_email:  brand.marketing_email,
      subject:      `Partnership opportunity — @${creator.instagram_handle}`,
      body:         `Hi ${brand.contact_name || brand.name + ' team'},\n\nI'd love to discuss a potential collaboration.\n\nBest,\n@${creator.instagram_handle}`,
      fit_score:    brand.fit_score,
      brand_data:   brand,
    }));
  }

  // ──────────────────────────────────────────
  // STEP 4 + 5 — BUILD & DEPLOY PITCH PAGES
  // ──────────────────────────────────────────
  console.log(`\n[4/5] 🎨 Building pitch pages...`);
  console.log(`[5/5] 🚀 Deploying to Render...\n`);

  for (let i = 0; i < writtenPitches.length; i++) {
    const pitch = writtenPitches[i];
    const brand = pitchableBrands.find(b => b.name === pitch.brand_name) || pitchableBrands[i];
    const score = { fit_score: brand.fit_score, score_reasoning: brand.score_reasoning };

    // Pre-generate view_token for tracking pixel
    pitch.view_token = randomUUID();

    console.log(`[4+5] Processing ${i+1}/${writtenPitches.length}: ${pitch.brand_name}`);

    try {
      // Build HTML
      const html = buildPitchPage(creator, brand, pitch, score);
      console.log(`      ✅ Page built — ${html.length.toLocaleString('en-US')} chars`);

      // Deploy (or skip if disabled)
      if (deployPages) {
        const deployed = await deployPitchPage(html, creator, brand);
        if (deployed.success) {
          result.pages.push({
            brand_name:       pitch.brand_name,
            brand_email:      pitch.brand_email,
            subject:          pitch.subject,
            pitch_url:        deployed.url,
            fit_score:        brand.fit_score,
            reply_likelihood: brand.reply_likelihood,
            deployed_at:      deployed.deployed_at,
            view_token:       pitch.view_token,
          });
          console.log(`      🌐 Live: ${deployed.url}`);
        } else {
          console.warn(`      ⚠️  Deploy failed: ${deployed.error}`);
          result.errors.push({ step: 'deploy', brand: pitch.brand_name, error: deployed.error });
          // Still add page without URL
          result.pages.push({
            brand_name:  pitch.brand_name,
            brand_email: pitch.brand_email,
            subject:     pitch.subject,
            pitch_url:   null,
            fit_score:   brand.fit_score,
            view_token:  pitch.view_token,
          });
        }
      } else {
        // deployPages disabled (e.g. testing)
        result.pages.push({
          brand_name:  pitch.brand_name,
          brand_email: pitch.brand_email,
          subject:     pitch.subject,
          pitch_url:   'deploy-disabled',
          fit_score:   brand.fit_score,
          view_token:  pitch.view_token,
          html,
        });
        console.log(`      📄 Built (deploy disabled)`);
      }

      // Small delay between deploys to avoid GitHub API rate limits
      if (i < writtenPitches.length - 1 && deployPages) await sleep(2000);

    } catch (err) {
      console.error(`      ❌ Failed for ${pitch.brand_name}:`, err.message);
      result.errors.push({ step: 'buildDeploy', brand: pitch.brand_name, error: err.message });
    }
  }

  // ──────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  result.stats = {
    total_brands_found:   result.brands.length,
    pitchable_brands:     pitchableBrands.length,
    pitches_written:      result.pitches.length,
    pages_deployed:       result.pages.filter(p => p.pitch_url && p.pitch_url !== 'deploy-disabled').length,
    errors:               result.errors.length,
    time_seconds:         elapsed,
    tier:                 tier?.name,
    deal_range:           tier?.dealRange,
  };

  console.log('\n' + '═'.repeat(60));
  console.log('PIPELINE COMPLETE');
  console.log('═'.repeat(60));
  console.log(`⏱️  Time:     ${elapsed}s`);
  console.log(`🏷️  Tier:     ${tier?.label}`);
  console.log(`💰  Deal:     ${tier?.dealRange}`);
  console.log(`📦  Brands:   ${result.stats.total_brands_found} found → ${result.stats.pitchable_brands} pitchable`);
  console.log(`✍️  Pitches:  ${result.stats.pitches_written} written`);
  console.log(`🌐  Pages:    ${result.stats.pages_deployed} deployed`);
  if (result.errors.length > 0) {
    console.log(`⚠️  Errors:   ${result.errors.length}`);
    result.errors.forEach(e => console.log(`     • ${e.step} ${e.brand?'('+e.brand+')':''}: ${e.error}`));
  }

  if (result.pages.length > 0) {
    console.log('\n🎯 PITCH PAGES READY TO SEND:');
    console.log('─'.repeat(60));
    result.pages.forEach((p, i) => {
      console.log(`\n${i+1}. ${p.brand_name} — Score: ${p.fit_score}/100`);
      console.log(`   To:      ${p.brand_email || 'no email found'}`);
      console.log(`   Subject: ${p.subject}`);
      if (p.pitch_url && p.pitch_url !== 'deploy-disabled') {
        console.log(`   🌐 URL:  ${p.pitch_url}`);
      }
    });
    console.log('\n' + '─'.repeat(60));
    console.log('Send each brand their pitch URL — that\'s all you need to do.');
  }

  return result;
}

// ============================================================
// HELPER
// ============================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// TEST — node agents/orchestrator.js
// ============================================================
async function test() {
  const testCreator = {
    instagram_handle:          's.nova.vintage',
    instagram_followers:       28000,
    instagram_engagement_rate: 5.8,
    primary_niche:             'vintage',
    secondary_niches:          ['fashion', 'lifestyle'],
    content_style:             'aesthetic, curated, editorial',
    audience_gender:           '72% female, 28% male',
    audience_age_range:        '18–32',
    audience_location:         'India',
    audience_income:           'middle class',
    base_rate_per_post:        120,
    profile_photo_url:         'https://i.pravatar.cc/300?img=47',
    post_images: [
      'https://picsum.photos/seed/snova1/400/500',
      'https://picsum.photos/seed/snova2/400/500',
      'https://picsum.photos/seed/snova3/400/500',
      'https://picsum.photos/seed/snova4/400/500',
      'https://picsum.photos/seed/snova5/400/500',
      'https://picsum.photos/seed/snova6/400/500',
    ],
  };

  const result = await runPipeline(testCreator, {
    brandLimit:  15,  // find 15 brands
    maxPitches:  3,   // pitch top 3
    deployPages: true, // set false to skip deploy and just build locally
  });

  return result;
}

if (require.main === module) {
  test().catch(console.error);
}

module.exports = { runPipeline };