// ============================================================
// testDeploy.js — end-to-end test: build page + deploy to Render
// Run: node agents/testDeploy.js
// ============================================================

require('dotenv').config({ path: '../.env' });

const { buildPitchPage } = require('./pitchPageBuilder');
const { deployPitchPage } = require('./deployer');

async function test() {
  console.log('='.repeat(55));
  console.log('FULL PIPELINE TEST — Build + Deploy');
  console.log('='.repeat(55));

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

    // ── PROFILE PHOTO ──
    // Replace with a real photo URL once the creator uploads via dashboard
    // For now using a placeholder so the page renders with a real image
    profile_photo_url: 'https://i.pravatar.cc/300?img=47',

    // ── POST IMAGES (film roll) ──
    // Replace these with the creator's actual Instagram post URLs
    // They upload these during onboarding via the dashboard
    // Using picsum.photos as placeholder — seeded so they stay consistent
    post_images: [
      'https://picsum.photos/seed/snova1/400/500',
      'https://picsum.photos/seed/snova2/400/500',
      'https://picsum.photos/seed/snova3/400/500',
      'https://picsum.photos/seed/snova4/400/500',
      'https://picsum.photos/seed/snova5/400/500',
      'https://picsum.photos/seed/snova6/400/500',
      'https://picsum.photos/seed/snova7/400/500',
      'https://picsum.photos/seed/snova8/400/500',
      'https://picsum.photos/seed/snova9/400/500',
    ],
  };

  const testBrand = {
    name:           'Nykaa',
    industry:       'Beauty & Lifestyle',
    contact_name:   'Influencer Partnerships Team',
    marketing_email:'influencer@nykaa.com',
  };

  const testPitch = {
    subject: 'My audience already shops here',
    body: `Nykaa's curation is exactly what my followers save on their wishlists every weekend — I figured it was time to make it official.\n\nWith 28,000 followers at a 5.8% engagement rate — nearly four times the industry average — my audience isn't just watching, they're buying. 72% are women aged 18–32 who already spend on curated beauty and fashion. They trust me because I'm one of them.\n\nOne post. $120. And it looks like it was always meant to be yours.`,
  };

  const testScore = {
    fit_score:       88,
    niche_match:     90,
    audience_match:  95,
    budget_estimate: 120,
    score_reasoning: "Perfect niche and demographic match — vintage aesthetic creator for India's leading beauty platform targeting young women.",
    reply_likelihood:'high',
  };

  // Step 1 — Build the HTML
  console.log('\n[Step 1] Building pitch page HTML...');
  const html = buildPitchPage(testCreator, testBrand, testPitch, testScore);
  console.log(`[Step 1] ✅ HTML built — ${html.length.toLocaleString('en-US')} characters`);

  // Step 2 — Deploy to Render via GitHub
  console.log('\n[Step 2] Deploying to Render...');
  const result = await deployPitchPage(html, testCreator, testBrand);

  if (result.success) {
    console.log('\n' + '='.repeat(55));
    console.log('✅ DEPLOYED SUCCESSFULLY');
    console.log('='.repeat(55));
    console.log(`🌐 Live URL: ${result.url}`);
    console.log(`📁 File:     ${result.filename}`);
    console.log(`⏰ At:       ${result.deployed_at}`);
    console.log('\n💡 To use real creator images:');
    console.log('   profile_photo_url → Supabase Storage URL of their uploaded photo');
    console.log('   post_images[]     → Supabase Storage URLs of their uploaded posts');
  } else {
    console.log('\n❌ Deploy failed:', result.error);
  }
}

test().catch(console.error);