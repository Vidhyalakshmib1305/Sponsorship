// ============================================================
// agents/brandScorer.js
// Scores each brand against a creator profile (0-100)
// ============================================================

require('dotenv').config({ path: '../.env' });

const { callLLM } = require('./llmRouter');

const MIN_FIT_SCORE = 55;

// ============================================================
// MAIN FUNCTION
// ============================================================
async function scoreBrands(brands, creator) {
  console.log(`\n[BrandScorer] 📊 Scoring ${brands.length} brands for @${creator.instagram_handle || 'creator'}`);

  const scored = [];

  // Score one brand at a time — more reliable than batching
  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    console.log(`[BrandScorer] Scoring ${i + 1}/${brands.length}: ${brand.name}`);

    try {
      const score = await scoreSingleBrand(brand, creator);
      scored.push({ ...brand, ...score });
    } catch (err) {
      console.warn(`[BrandScorer] ⚠️ Failed to score ${brand.name}:`, err.message);
      scored.push({
        ...brand,
        fit_score:       40,
        niche_match:     40,
        audience_match:  40,
        budget_estimate: brand.avg_deal_size_usd || 200,
        score_reasoning: 'Could not score automatically — review manually.',
        reply_likelihood: 'low',
        should_pitch:    false,
      });
    }

    if (i < brands.length - 1) await sleep(400);
  }

  // Sort by fit score descending
  scored.sort((a, b) => b.fit_score - a.fit_score);

  const pitchable = scored.filter(b => b.should_pitch && b.fit_score >= MIN_FIT_SCORE);
  const skipped   = scored.filter(b => !b.should_pitch || b.fit_score < MIN_FIT_SCORE);

  console.log(`\n[BrandScorer] ✅ Done`);
  console.log(`[BrandScorer] 🎯 ${pitchable.length} brands worth pitching`);
  console.log(`[BrandScorer] ⏭️  ${skipped.length} brands skipped`);

  return { scored, pitchable, skipped };
}

// ============================================================
// SCORE A SINGLE BRAND
// ============================================================
async function scoreSingleBrand(brand, creator) {
  const systemPrompt = `You are a sponsorship compatibility analyst. Score how well a brand matches
a creator for a sponsorship deal. Consider niche fit, audience demographics, market alignment,
and realistic sponsorship likelihood. Always respond with valid JSON only.`;

  const userPrompt = `Score this brand-creator sponsorship match.

CREATOR:
- Niche: ${creator.primary_niche}
- Secondary niches: ${(creator.secondary_niches || []).join(', ') || 'none'}
- Content style: ${creator.content_style || 'not specified'}
- Followers: ${creator.instagram_followers?.toLocaleString('en-US') || 'unknown'}
- Engagement rate: ${creator.instagram_engagement_rate || 0}%
- Audience gender: ${creator.audience_gender || 'mixed'}
- Audience age: ${creator.audience_age_range || '18-34'}
- Audience location: ${creator.audience_location || 'global'}
- Audience income: ${creator.audience_income || 'middle class'}
- Rate per post: $${creator.base_rate_per_post || 0}

BRAND:
- Name: ${brand.name}
- Industry: ${brand.industry || 'unknown'}
- Description: ${brand.description || 'not available'}
- Niches they target: ${(brand.niches_they_target || []).join(', ') || 'unknown'}
- Audience they target: ${(brand.audience_they_target || []).join(', ') || 'unknown'}
- Known to sponsor creators: ${brand.known_to_sponsor ? 'Yes' : 'Unknown'}
- Average deal size: $${brand.avg_deal_size_usd || 'unknown'}
- Market: ${brand.market || 'global'}

SCORING RULES:
- fit_score: overall brand-creator compatibility (0-100)
- niche_match: does brand's category match creator's content? (0-100)
- audience_match: does brand's target audience match creator's demographics? (0-100)
- budget_estimate: realistic deal value in USD for this creator's follower count
- reasoning: 1-2 specific sentences explaining the score
- reply_likelihood: "high" if fit>70, "medium" if 50-70, "low" if <50
- should_pitch: true if fit_score >= 55 AND brand realistically works with ${creator.instagram_followers?.toLocaleString('en-US')} follower creators

Respond with ONLY this JSON:
{
  "fit_score": <0-100>,
  "niche_match": <0-100>,
  "audience_match": <0-100>,
  "budget_estimate": <number>,
  "reasoning": "<1-2 sentences>",
  "reply_likelihood": "<high|medium|low>",
  "should_pitch": <true|false>
}`;

  const result = await callLLM({
    systemPrompt,
    userPrompt,
    maxTokens:   400,
    temperature: 0.2,
    jsonMode:    true,
  });

  return {
    fit_score:        clamp(result.fit_score       ?? 50, 0, 100),
    niche_match:      clamp(result.niche_match     ?? 50, 0, 100),
    audience_match:   clamp(result.audience_match  ?? 50, 0, 100),
    budget_estimate:  result.budget_estimate        || brand.avg_deal_size_usd || 200,
    score_reasoning:  result.reasoning              || '',
    reply_likelihood: result.reply_likelihood       || 'medium',
    should_pitch:     result.should_pitch           ?? (result.fit_score >= MIN_FIT_SCORE),
  };
}

// ============================================================
// HELPERS
// ============================================================
function clamp(val, min, max) {
  return Math.min(Math.max(Number(val) || 0, min), max);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// TEST — node agents/brandScorer.js
// ============================================================
async function test() {
  console.log('[BrandScorer] Running test...\n');

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
    audience_income:           'middle class',
    base_rate_per_post:        150,
  };

  const testBrands = [
    {
      name:                 'Myprotein',
      industry:             'Nutrition and Supplements',
      description:          'Global sports nutrition brand with strong micro-influencer programme',
      niches_they_target:   ['fitness', 'nutrition', 'sports'],
      audience_they_target: ['18-35 fitness enthusiasts', 'male athletes'],
      known_to_sponsor:     true,
      avg_deal_size_usd:    300,
      market:               'global',
    },
    {
      name:                 'Grubhub',
      industry:             'Food delivery app',
      description:          'US-based food delivery platform',
      niches_they_target:   ['food', 'lifestyle', 'comedy'],
      audience_they_target: ['18-35 urban US audience'],
      known_to_sponsor:     true,
      avg_deal_size_usd:    200,
      market:               'USA',
    },
    {
      name:                 'Cult.fit',
      industry:             'Fitness platform',
      description:          'India\'s leading fitness and wellness platform',
      niches_they_target:   ['fitness', 'wellness', 'health'],
      audience_they_target: ['18-40 health conscious Indians'],
      known_to_sponsor:     true,
      avg_deal_size_usd:    250,
      market:               'india',
    },
    {
      name:                 'Decathlon',
      industry:             'Sports equipment and activewear',
      description:          'Global sports retailer with affordable quality gear',
      niches_they_target:   ['fitness', 'sports', 'outdoor'],
      audience_they_target: ['18-45 sports enthusiasts', 'budget-conscious athletes'],
      known_to_sponsor:     true,
      avg_deal_size_usd:    400,
      market:               'global',
    },
  ];

  const { scored, pitchable, skipped } = await scoreBrands(testBrands, testCreator);

  console.log('\n[BrandScorer] 📋 Scores:\n');
  scored.forEach(b => {
    const icon = b.should_pitch ? '✅' : '❌';
    const filled = Math.floor(b.fit_score / 10);
    const bar    = '█'.repeat(filled) + '░'.repeat(10 - filled);
    console.log(`${icon} ${b.name}`);
    console.log(`   Overall:   [${bar}] ${b.fit_score}/100`);
    console.log(`   Niche:     ${b.niche_match}/100  |  Audience: ${b.audience_match}/100`);
    console.log(`   Budget:    $${b.budget_estimate}  |  Reply: ${b.reply_likelihood}`);
    console.log(`   Reasoning: ${b.score_reasoning}`);
    console.log('');
  });

  console.log('─'.repeat(50));
  console.log(`✅ Pitchable: ${pitchable.length}/${scored.length}`);
  if (pitchable.length > 0) {
    console.log('Top picks:');
    pitchable.forEach(b => console.log(`  → ${b.name} (${b.fit_score}/100)`));
  }
}

if (require.main === module) {
  test().catch(console.error);
}

module.exports = { scoreBrands };