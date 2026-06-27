// ============================================================
// agents/prompts/scoringPrompt.js
// Scores multiple brands at once — saves LLM calls
// Includes full demographics-aware scoring
// ============================================================

function buildScoringPrompt(creator, brands) {
  // Handle both single brand (legacy) and array of brands
  const brandList = Array.isArray(brands) ? brands : [brands];

  return {
    systemPrompt: `You are a brand-creator sponsorship analyst. Score how well each brand matches
this creator for a sponsorship deal. You consider niche fit, audience demographics, deal likelihood,
and market alignment. Always respond with valid JSON only — no extra text, no markdown.`,

    userPrompt: `Score these ${brandList.length} brands for this creator. Return one score per brand.

CREATOR PROFILE:
- Handle: @${creator.instagram_handle || 'creator'}
- Primary niche: ${creator.primary_niche}
- Secondary niches: ${(creator.secondary_niches || []).join(', ') || 'none'}
- Content style: ${creator.content_style || 'not specified'}
- Followers: ${creator.instagram_followers?.toLocaleString('en-US') || 'unknown'}
- Engagement rate: ${creator.instagram_engagement_rate || 0}%
- Audience gender: ${creator.audience_gender || 'mixed'}
- Audience age: ${creator.audience_age_range || '18-34'}
- Audience location: ${creator.audience_location || 'global'}
- Audience income: ${creator.audience_income || 'middle class'}
- Base rate per post: $${creator.base_rate_per_post || 0}

BRANDS TO SCORE:
${brandList.map((b, i) => `
Brand ${i+1}: ${b.name}
- Industry: ${b.industry}
- Description: ${b.description || 'not available'}
- Niches they target: ${(b.niches_they_target || []).join(', ')}
- Audience they target: ${(b.audience_they_target || []).join(', ')}
- Known to sponsor: ${b.known_to_sponsor ? 'Yes' : 'Unknown'}
- Average deal size: $${b.avg_deal_size_usd || 'unknown'}
- Market: ${b.market || 'global'}
`).join('\n')}

SCORING RULES:
- fit_score: overall compatibility (0-100)
- niche_match: how well brand's category matches creator's content (0-100)
- audience_match: how well brand's target audience matches creator's audience demographics (0-100)
- budget_estimate: realistic deal value in USD based on creator's follower count and brand size
- reasoning: 1-2 sentences explaining the score specifically
- reply_likelihood: "high" (>70 fit), "medium" (50-70 fit), "low" (<50 fit)
- should_pitch: true if fit_score >= 55 AND the brand realistically sponsors creators at this follower level

Respond with ONLY this JSON — one entry per brand in the same order:
{
  "scores": [
    {
      "fit_score": <0-100>,
      "niche_match": <0-100>,
      "audience_match": <0-100>,
      "budget_estimate": <number in USD>,
      "reasoning": "<1-2 sentences>",
      "reply_likelihood": "<high|medium|low>",
      "should_pitch": <true|false>
    }
  ]
}`,
  };
}

module.exports = { buildScoringPrompt };