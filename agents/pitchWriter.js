// ============================================================
// agents/pitchWriter.js
// Writes personalized sponsorship pitch emails
// Based on creator profile + brand + score data
// ============================================================

require('dotenv').config({ path: '../.env' });

const { callLLM }          = require('./llmRouter');
const { buildPitchPrompt } = require('./prompts/pitchPrompt');

// ============================================================
// MAIN FUNCTION — write pitches for all pitchable brands
// ============================================================
async function writePitches(pitchableBrands, creator) {
  console.log(`\n[PitchWriter] ✍️  Writing ${pitchableBrands.length} pitches for @${creator.instagram_handle || 'creator'}`);

  const pitches = [];

  for (let i = 0; i < pitchableBrands.length; i++) {
    const brand = pitchableBrands[i];
    console.log(`[PitchWriter] Writing ${i + 1}/${pitchableBrands.length}: ${brand.name}`);

    try {
      const pitch = await writeSinglePitch(brand, creator);
      pitches.push({
        brand_name:    brand.name,
        brand_email:   brand.marketing_email,
        subject:       pitch.subject,
        body:          pitch.body,
        tone:          pitch.tone,
        word_count:    pitch.body?.split(' ').length || 0,
        generated_at:  new Date().toISOString(),
        fit_score:     brand.fit_score,
        brand_data:    brand,
      });
      console.log(`[PitchWriter] ✅ Written: "${pitch.subject}" (${pitch.body?.split(' ').length} words)`);
    } catch (err) {
      console.warn(`[PitchWriter] ⚠️ Failed for ${brand.name}:`, err.message);
    }

    if (i < pitchableBrands.length - 1) await sleep(500);
  }

  console.log(`\n[PitchWriter] ✅ Done — ${pitches.length} pitches written`);
  return pitches;
}

// ============================================================
// WRITE A SINGLE PITCH
// ============================================================
async function writeSinglePitch(brand, creator) {
  const { systemPrompt, userPrompt } = buildPitchPrompt(creator, brand, {
    reasoning:      brand.score_reasoning || '',
    fit_score:      brand.fit_score || 70,
    audience_match: brand.audience_match || 70,
  });

  const result = await callLLM({
    systemPrompt,
    userPrompt,
    maxTokens:   600,
    temperature: 0.75, // slightly higher for natural-sounding writing
    jsonMode:    true,
  });

  // Validate result
  if (!result.subject || !result.body) {
    throw new Error('LLM returned incomplete pitch');
  }

  return {
    subject:    result.subject,
    body:       result.body,
    tone:       result.tone || 'professional',
  };
}

// ============================================================
// HELPER
// ============================================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// TEST — node agents/pitchWriter.js
// ============================================================
async function test() {
  console.log('[PitchWriter] Running test...\n');

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

  // Simulated scored brands (as if they came from brandScorer)
  const pitchableBrands = [
    {
      name:                'Cult.fit',
      industry:            'Fitness platform',
      description:         'India\'s leading fitness and wellness platform',
      marketing_email:     'partnerships@cult.fit',
      contact_name:        'Influencer Marketing Manager',
      niches_they_target:  ['fitness', 'wellness'],
      market:              'india',
      fit_score:           92,
      niche_match:         100,
      audience_match:      95,
      avg_deal_size_usd:   250,
      score_reasoning:     'Perfect niche and audience match — Indian fitness platform for Indian fitness creator',
      reply_likelihood:    'high',
    },
    {
      name:                'Myprotein',
      industry:            'Sports nutrition',
      description:         'Global sports nutrition brand with strong micro-influencer programme',
      marketing_email:     'influencer.marketing@myprotein.com',
      contact_name:        'Influencer Partnerships Team',
      niches_they_target:  ['fitness', 'nutrition', 'sports'],
      market:              'global',
      fit_score:           85,
      niche_match:         90,
      audience_match:      80,
      avg_deal_size_usd:   300,
      score_reasoning:     'Strong niche alignment in sports nutrition, active micro-influencer programme globally',
      reply_likelihood:    'high',
    },
  ];

  const pitches = await writePitches(pitchableBrands, testCreator);

  console.log('\n' + '='.repeat(60));
  console.log('GENERATED PITCHES');
  console.log('='.repeat(60));

  pitches.forEach((p, i) => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PITCH ${i + 1}: ${p.brand_name}`);
    console.log(`To:      ${p.brand_email}`);
    console.log(`Subject: ${p.subject}`);
    console.log(`Words:   ${p.word_count} | Tone: ${p.tone} | Fit: ${p.fit_score}/100`);
    console.log(`${'─'.repeat(60)}`);
    console.log(p.body);
  });

  console.log(`\n✅ ${pitches.length} pitches ready to send.`);
}

if (require.main === module) {
  test().catch(console.error);
}

module.exports = { writePitches, writeSinglePitch };