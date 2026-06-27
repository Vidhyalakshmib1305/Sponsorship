// ============================================================
// agents/prompts/scoringPrompt.js
// Used by brandScorer.js to score each brand for a creator
// ============================================================

function buildScoringPrompt(creator, brand) {
  return {
    systemPrompt: `You are a brand-creator compatibility analyst. You score how well a brand matches a creator for a sponsorship deal. Always respond with valid JSON only — no extra text, no markdown.`,

    userPrompt: `Score this brand-creator match on a scale of 0-100.

CREATOR PROFILE:
- Niche: ${creator.primary_niche}
- Secondary niches: ${(creator.secondary_niches || []).join(', ') || 'none'}
- Instagram followers: ${creator.instagram_followers?.toLocaleString() || 'unknown'}
- Engagement rate: ${creator.instagram_engagement_rate || 0}%
- Audience location: ${creator.audience_location || 'India'}
- Audience age: ${creator.audience_age_range || '18-34'}
- Base rate per post: $${creator.base_rate_per_post || 0}

BRAND PROFILE:
- Name: ${brand.name}
- Industry: ${brand.industry}
- Niches they target: ${(brand.niches_they_target || []).join(', ')}
- Known to sponsor creators: ${brand.known_to_sponsor ? 'Yes' : 'Unknown'}
- Average deal size: $${brand.avg_deal_size_usd || 'unknown'}
- Description: ${brand.description || 'Not available'}

Respond with ONLY this JSON:
{
  "fit_score": <overall score 0-100>,
  "niche_match": <niche overlap score 0-100>,
  "audience_match": <audience alignment score 0-100>,
  "budget_estimate": <estimated deal value in USD as number>,
  "reasoning": "<2 sentences explaining the score>",
  "should_pitch": <true or false>
}`,
  };
}

module.exports = { buildScoringPrompt };