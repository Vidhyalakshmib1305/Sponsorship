I'm building Sponsorship Prospector — a SaaS that finds brands for 
Instagram creators, scores their fit, writes pitch emails, and deploys 
cinematic pitch pages to Render automatically. The full project is in 
this folder.

First, read these files to understand the full project:
- backend/server.js
- agents/orchestrator.js
- agents/brandFinder.js
- agents/llmRouter.js
- frontend/src/pages/Settings.jsx
- frontend/src/pages/Dashboard.jsx
- frontend/src/pages/Pitches.jsx
- frontend/src/pages/Onboarding.jsx
- .env (check what keys exist)

Then execute these tasks in order. After each task, test it and 
confirm it works before moving to the next.

─────────────────────────────────────────────────────
TASK 1 — Fix Supabase schema errors
─────────────────────────────────────────────────────
Using the Supabase service role key from .env, run these schema fixes:

1. Add missing columns to existing tables:
   ALTER TABLE pitches ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
   ALTER TABLE brand_leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
   ALTER TABLE creators ADD COLUMN IF NOT EXISTS post_images TEXT[] DEFAULT '{}';
   ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
   ALTER TABLE creators ADD COLUMN IF NOT EXISTS content_style TEXT;
   ALTER TABLE creators ADD COLUMN IF NOT EXISTS audience_income TEXT;
   ALTER TABLE creators ADD COLUMN IF NOT EXISTS contact_email TEXT;

2. Add score_reasoning column to brand_leads if missing:
   ALTER TABLE brand_leads ADD COLUMN IF NOT EXISTS score_reasoning TEXT;
   ALTER TABLE brand_leads ADD COLUMN IF NOT EXISTS reply_likelihood TEXT;

3. Add pitch_page_url column to pitches if missing:
   ALTER TABLE pitches ADD COLUMN IF NOT EXISTS pitch_page_url TEXT;
   ALTER TABLE pitches ADD COLUMN IF NOT EXISTS brand_email TEXT;

4. Create Supabase Storage bucket for creator media uploads.
   Use the Supabase REST API with the service role key to create 
   a public bucket called "creator-media" if it doesn't exist.

─────────────────────────────────────────────────────
TASK 2 — Replace Reddit scraping with Web Search MCP
─────────────────────────────────────────────────────
In agents/brandFinder.js, replace the findBrandsFromRedditSearch() 
function entirely with a web search using the Anthropic API's 
built-in web search tool.

The new function should:
1. Call the Anthropic API directly (using ANTHROPIC_API_KEY or 
   the existing Groq/OpenRouter setup) with web_search tool enabled:
   tools: [{ type: "web_search_20250305", name: "web_search" }]

2. Search for queries like:
   - "${niche} brands sponsoring micro influencers 2025 2026"
   - "${niche} brand influencer marketing partnerships ${location}"
   - "brands looking for ${niche} creators to sponsor"

3. Parse the web search results and extract brand names, websites, 
   and sponsorship context

4. Return brands in the same format as before:
   { name, website, industry, description, niches_they_target, 
     known_to_sponsor, avg_deal_size_usd, market, source: 'web_search' }

If the Anthropic API web search is not available with current keys,
fall back to using the LLM to generate search-informed results with 
its knowledge of recent brand campaigns.

Keep HackerNews source for tech niches (already working).
Keep ProductHunt RSS source (already working).

─────────────────────────────────────────────────────
TASK 3 — Auto-fetch Instagram data (RapidAPI)
─────────────────────────────────────────────────────
Add automatic Instagram data fetching so creators don't need to 
manually enter their follower count, engagement rate, or upload images.

In backend/server.js, add a new endpoint:
GET /api/instagram/fetch/:handle

This endpoint should:
1. Call RapidAPI Instagram scraper API (use rapidapi-instagram-scraper 
   or similar free tier endpoint)
   - API key goes in .env as RAPIDAPI_KEY
   - Endpoint: instagram-scraper-api2.p.rapidapi.com or similar
   
2. Return this data structure:
   {
     profile_pic_url: string,
     followers: number,
     following: number, 
     posts_count: number,
     engagement_rate: number (calculated: avg_likes/followers * 100),
     bio: string,
     recent_posts: [
       { thumbnail_url: string, type: 'image'|'reel', likes: number }
     ] (last 9 posts)
   }

3. If RapidAPI key is not in .env, return a helpful error:
   { error: 'RAPIDAPI_KEY not configured', manual: true }
   Frontend should fall back to manual input gracefully.

In frontend/src/pages/Onboarding.jsx:
- When creator types their Instagram handle and moves to next field,
  call GET /api/instagram/fetch/:handle automatically
- Show a loading spinner while fetching
- Auto-fill: followers, engagement rate
- Show profile pic preview immediately
- Show a grid preview of their last 9 post thumbnails
- Add toggle: "Use Instagram data ✓" vs "Enter manually"

In frontend/src/pages/Settings.jsx:
- Add "Refresh from Instagram" button next to the handle field
- Same auto-fetch behavior as onboarding

─────────────────────────────────────────────────────
TASK 4 — Fix photo and post image uploads
─────────────────────────────────────────────────────
Fix the profile photo and post image upload flow end-to-end.

Profile photo — 2 options:
Option A (Auto): Use the profile_pic_url fetched from Instagram 
  in Task 3. Show "Using your Instagram DP ✓" with the image preview.
Option B (Manual): File upload → base64 → POST /api/upload/photo 
  → Supabase Storage → save URL to creators.profile_photo_url

Post images — 2 options:
Option A (Auto): Use the recent_posts thumbnails fetched from 
  Instagram in Task 3. Show a film-strip preview of the 9 posts.
  If fewer than 6 images returned (creator posts mostly reels), 
  automatically show Option B with an explanation.
Option B (Manual): File upload (up to 9 images) → base64 → 
  POST /api/upload/posts → Supabase Storage → save URLs array 
  to creators.post_images[]

In both Onboarding.jsx and Settings.jsx:
- Show both options as a toggle with visual preview
- Default to Option A (auto) if Instagram data was fetched
- Default to Option B (manual) if no Instagram connection
- Show clear labels: "From Instagram" | "Upload my own"

Make sure the upload endpoints in server.js actually work:
- POST /api/upload/photo: receives base64, uploads to Supabase 
  Storage bucket "creator-media", returns public URL, saves to DB
- POST /api/upload/posts: receives array of base64 images, 
  uploads all, returns URL array, saves to DB

─────────────────────────────────────────────────────
TASK 5 — Fix Dashboard pipeline button and status polling
─────────────────────────────────────────────────────
In frontend/src/pages/Dashboard.jsx:

1. Fix the Run Pipeline button to correctly:
   - Call POST /api/pipeline/run with Bearer token from Supabase auth
   - Handle the response (returns run_id immediately, pipeline 
     runs async in background)
   - Store run_id and start polling

2. Fix the polling to:
   - Call GET /api/pipeline/status/:runId every 5 seconds
   - Show rotating status messages while running:
     "Finding brands matching your profile..."
     "Scoring 20 brands for fit and audience match..."  
     "Writing personalized pitch emails..."
     "Building cinematic pitch pages..."
     "Deploying to Render..."
     "Almost done..."
   - Stop polling when status === 'completed' or 'failed'
   - On completion: refresh pitches list and show success message
     with count: "3 pitch pages ready to send!"
   - On failure: show error message with retry button

3. Add creator profile completeness check:
   - Before showing Run Pipeline button, check if creator has filled:
     instagram_handle, primary_niche, instagram_followers
   - If incomplete, show: "Complete your profile in Settings first →"
   - If complete, show the Run Pipeline button

4. Add a stats refresh after pipeline completes:
   - Re-fetch /api/stats and update the 4 stat cards

─────────────────────────────────────────────────────
TASK 6 — Add pitch page view tracking + Gmail sending
─────────────────────────────────────────────────────
View tracking:
In agents/pitchPageBuilder.js, add a tiny tracking pixel to every 
generated pitch page HTML. When the brand opens the page, it calls:
GET https://[your-backend]/api/pitch/view/:pitchId

In backend/server.js, add:
GET /api/pitch/view/:pitchId
- Increment a view_count on the pitches record in Supabase
- Return a 1x1 transparent GIF (so it works as an image src)

In frontend/src/pages/Pitches.jsx:
- Show view count next to each pitch: "Viewed 3 times"
- Show "Not opened yet" if view_count is 0
- This gives creators powerful follow-up intelligence

Gmail sending (one-click):
In frontend/src/pages/Pitches.jsx, replace the manual copy-URL 
button with a "Send Email" button that:
1. Opens: mailto:${brand_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}
2. The emailBody should be a clean plain-text version of the pitch 
   with the pitch page URL at the bottom:
   "View my full pitch page here: ${pitch_page_url}"
3. This opens the creator's default email client (Gmail, Outlook, 
   Apple Mail) with everything pre-filled
4. Add a "Copy pitch URL" button as secondary option

─────────────────────────────────────────────────────
TASK 7 — Update pricing throughout the codebase
─────────────────────────────────────────────────────
Based on market validation, the original pricing ($100/$250/month) 
is too high for micro-influencers. Update to validated pricing:

New pricing tiers:
- Free:    1 pipeline run/month, 3 pitch pages
- Starter: $19/month — 10 runs/month, 25 pages, email sending
- Pro:     $49/month — unlimited runs, unlimited pages, 
           Instagram auto-connect, Gmail integration, priority support
- Agency:  $149/month — 5 creator profiles, white-label pages 
           (future tier, show as "Coming Soon")

Update pricing in these locations:
1. frontend/src/pages/Dashboard.jsx — any pricing mentions
2. frontend/src/pages/Settings.jsx — plan display if any
3. agents/orchestrator.js — maxPitches limits per tier:
   Free: brandLimit=10, maxPitches=3
   Starter: brandLimit=20, maxPitches=10
   Pro: brandLimit=25, maxPitches=25
4. backend/server.js — rate limiting per tier if implemented
5. Any hardcoded $100, $250, $300 strings in any file

Also add score reasoning to brand display:
In frontend/src/pages/Brands.jsx, show WHY each brand was recommended:
- Display score_reasoning text under each brand card
- Show reply_likelihood as a badge: "High chance" (green), 
  "Medium" (yellow), "Low" (gray)
- This builds creator trust in the AI recommendations

─────────────────────────────────────────────────────
AFTER ALL TASKS COMPLETE:
─────────────────────────────────────────────────────
1. Run node agents/orchestrator.js to confirm the full pipeline 
   still works end-to-end
2. Start node backend/server.js and confirm all 9+ endpoints respond
3. Check frontend compiles without errors: cd frontend && npm run dev
4. Report: which tasks completed successfully, which had issues, 
   and what needs manual attention

Important context:
- Groq API key is in .env as GROQ_API_KEY
- OpenRouter API key is in .env as OPENROUTER_API_KEY  
- Supabase URL and keys are in .env
- GitHub token and Render credentials are in .env
- The pipeline is fully working — do not break the orchestrator
- All agents are in the /agents folder
- Frontend is in /frontend/src
- Backend is backend/server.js at project root level