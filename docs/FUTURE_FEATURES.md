# Sponsorship Prospector — Future Features Roadmap

## 🔴 Priority 1 — When APIs become available (2-3 months)

### Google Veo 3 — AI Video Mockups
**What:** Auto-generate a 5-10 second video of a creator holding/using the brand's product
**Why:** No sponsorship tool does this. Brands can literally see what the content will look like before saying yes
**How:** Google Veo 3 API (currently paid/enterprise only — monitor for free tier or affordable pricing)
**Prompt example:** "A young Indian fitness creator in a gym, holding [Brand] product, speaking to camera, natural lighting, Instagram reel style"
**Where it fits:** Attached to pitch email as a video preview. Becomes premium tier feature ($250/month plan)
**Status:** 🔴 Waiting for API access

---

### Google Gemini Omni — Conversational Pitch Building
**What:** Creator has a conversation with Gemini Omni to build their pitch — "make the opening funnier", "make it shorter", "change the tone to more professional"
**Why:** Gives creators control over their pitch without needing to understand prompts
**How:** Gemini Omni multimodal API — currently in limited access
**Where it fits:** Pitch editor page in dashboard — "Refine with AI" button
**Status:** 🔴 Waiting for API access

---

### Google Flow — Cinematic Brand Pitch Videos
**What:** Auto-generate a 30-second cinematic pitch video — creator introduction, stats visualization, product showcase, call to action
**Why:** Instead of sending an email, creator sends a video pitch. Unprecedented in the industry
**How:** Google Flow API (combines Imagen 4 + Veo 3 + Gemini)
**Where it fits:** Premium tier feature — "Video Pitch" button on dashboard
**Status:** 🔴 Waiting for API access

---

## 🟡 Priority 2 — Build when revenue starts (1-3 months after launch)

### Personalized Pitch Page (Level 3)
**What:** Instead of an email, creator sends a URL: `prospector.app/pitch/username/brandname`
**Why:** Brand clicks a link and sees a stunning interactive page — stats, mockup images, sample post ideas, audience breakdown, and a contact button
**How:** React page + Supabase for data + Three.js for 3D elements
**Where it fits:** Upgrade from HTML email — premium tier only
**Status:** 🟡 Build after first 20 paying users

---

### Kling AI / Runway ML — Animated GIF Mockups
**What:** 3-second animated GIF of creator+product — like a mini Instagram reel preview
**Why:** GIFs render inline in emails — brands see movement without clicking anything
**How:** Kling AI free tier (5-10 videos/day) or Runway ML Gen-3
**Where it fits:** Embedded in HTML pitch email
**Status:** 🟡 Free tier available now — build when email system is live

---

### 3D Product + Creator Design
**What:** Three.js rendered 3D scene — creator's avatar holding the brand's product, rotating, with brand colors
**Why:** Stunning visual in the pitch page — memorable, shareable
**How:** Three.js in the pitch page (Level 3 above)
**Status:** 🟡 Build with pitch page

---

## 🟢 Priority 3 — Long term growth features

### Instagram API Integration — Real Stats
**What:** Pull real follower count, engagement rate, top posts, audience demographics directly from Instagram Graph API
**Why:** Currently creators self-report stats — real data = more credibility with brands
**How:** Meta's Instagram Graph API (requires app review)
**Status:** 🟢 Long term — requires Meta business verification

### Brand Deal Negotiation Agent
**What:** When a brand replies, AI reads their offer, compares to market rate, drafts a counter-offer
**Why:** Most creators accept the first offer — this could 2-3x their deal value
**Where it fits:** Extension of the DM/email system
**Status:** 🟢 Phase 2 product feature

### Creator Analytics Dashboard
**What:** Track every pitch — sent, opened, replied, negotiating, won, lost
**Why:** Creators can see what's working, what subject lines get replies, which brands convert
**Where it fits:** Dashboard analytics tab
**Status:** 🟢 Build after 50+ active users

---

## 📝 Notes

- All Google I/O 2026 features (Veo 3, Gemini Omni, Google Flow) were announced May 19, 2026
- Monitor: console.cloud.google.com for API access updates
- Monitor: ai.google.dev for developer access to new models
- Kling AI free tier: klingai.com — currently 5-10 video generations/day free
- Runway ML: runwayml.com — free trial available

---
*Last updated: May 2026*
*Add new ideas here as you discover them*