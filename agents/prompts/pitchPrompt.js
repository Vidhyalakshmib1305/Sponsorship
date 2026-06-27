// ============================================================
// agents/prompts/pitchPrompt.js
// Generates creative, human, professional pitch emails
// ============================================================

function buildPitchPrompt(creator, brand, scoreData) {
  return {
    systemPrompt: `You are a witty, sharp copywriter who writes sponsorship emails for creators.
Your emails are creative, confident, slightly humorous, and professional.
They feel like a real human wrote them — warm, direct, a little cheeky.
They get replies because they stand out from the 50 generic emails brands get daily.
Never use corporate speak. Never sound like AI. Always respond with valid JSON only.`,

    userPrompt: `Write a sponsorship pitch email from this creator to this brand.

CREATOR:
- Instagram: @${creator.instagram_handle || 'creator'}
- Niche: ${creator.primary_niche}
- Content style: ${creator.content_style || 'engaging, authentic'}
- Followers: ${creator.instagram_followers?.toLocaleString('en-US') || 'growing'}
- Engagement rate: ${creator.instagram_engagement_rate || 0}% (industry average is 1-2%)
- Audience: ${creator.audience_gender || 'mixed'}, age ${creator.audience_age_range || '18-34'}
- Location: ${creator.audience_location || 'global'}
- Rate per post: $${creator.base_rate_per_post || 'negotiable'}

BRAND:
- Name: ${brand.name}
- Industry: ${brand.industry}
- Why this is a great match: ${scoreData.reasoning}
- Audience match: ${scoreData.audience_match}/100

BANNED PHRASES — using any of these means total failure:
"I hope this email finds you well"
"I am reaching out"
"I would love to collaborate"
"changing the game"
"commitment to excellence"
"truly impressive"
"synergy"
"collab opportunity"
"I am a big fan"
"I believe we could create exciting content"
"partnership opportunity"
"always on the lookout"
"level up their fitness journey"
"fuel their fitness journey"
"your customers"
"the best products"
"engaging content"
"create some"
"real MVP"
"game changer"
"perfect fit"
"mutual benefit"
"I think we could work well together"
"I'd like to discuss"
"I'd love to"
"let me know if you're interested"
"looking forward to hearing from you"
"please find attached"
Anything that sounds like a corporate template

RULES — every single one must be followed:
1. Subject: under 9 words — witty, specific, NOT generic
   BAD: "Protein for the win", "[Brand] Your Way to Success", "Collaboration Request"
   GOOD: "45K fitness fans, one question", "My DMs keep asking about you", "Your next micro creator is here"

2. Body: 130-170 words ONLY. Tight. No padding.

3. Opening: ONE sentence, must reference something SPECIFIC and REAL about ${brand.name}
   — their actual product, campaign, tagline, or what makes them unique
   — must NOT work as an opener for any other brand
   — slightly witty or unexpected — make them smile before they even read the pitch

4. Stats: drop followers AND engagement rate naturally in one sentence — not forced
   Example: "45,000 followers with a 4.2% engagement rate — roughly double what most accounts pull"

5. Audience line: MUST include a specific number and specific behaviour:
   BAD:  "My followers would love your products"
   GOOD: "55% of my 45K audience are 20-35 Indian men who already spend ₹3,000+ monthly on fitness — they listen to me because I'm one of them"

6. Closing: confident, casual, ONE clear ask — never beg, never over-explain
   BAD:  "I'd like to discuss a sponsored post, my rate is $150 per post, and I think we could work well together"
   GOOD: "Open to a quick email exchange about what that looks like — I charge $150 per post and I keep it simple."
   GOOD: "Happy to send over a media kit if this sounds interesting — $150 per post, no fluff."
   GOOD: "Want to see my media kit? $150 a post, and I make it worth it."

7. Tone: warm, sharp, slightly funny, human — like a confident creator who knows their worth

8. No excessive line breaks — 2-3 flowing paragraphs, not bullet points

Respond with ONLY this JSON:
{
  "subject": "<witty subject under 9 words>",
  "body": "<email body 130-170 words, use \\n\\n between paragraphs only>",
  "tone": "<energetic|warm|sharp|playful|professional>"
}`,
  };
}

module.exports = { buildPitchPrompt };