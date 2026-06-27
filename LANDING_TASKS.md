I have 7 celestial-themed background images in 
frontend/src/assets/landing/:
hero.png, login.png, onboarding.png, dashboard.png, brands.png, 
pitches.png, settings.png

I want a PLAYFUL, CHARACTERFUL frontend — think the kinetic energy of 
Tom & Jerry cartoons: text that bounces, darts, wobbles, chases, and 
springs around with personality. But it must stay PREMIUM and readable. 
Be bold and creative — surprise me. Don't make generic corporate animations.

CORE LAYOUT PRINCIPLE — images and text never fight:
- Images are the STAGE, text is the ACTOR on top
- Each image gets object-fit: contain on larger screens so NOTHING is 
  ever cropped — the full image is always visible, letterboxed if needed 
  against a matching dark backdrop (#0a0005)
- Text sits in a "safe zone" — analyze each image's composition and place 
  text where the image is darkest/emptiest (usually top-third or 
  bottom-third), never over the busy focal point (phoenix, unicorn, etc.)
- Behind every text block: a soft semi-transparent dark "halo" 
  (radial-gradient blur or backdrop-filter) so text pops with contrast 
  without hiding the image
- Text color: white #fff or gold #FFD700 with a subtle dark text-shadow 
  for guaranteed legibility on any background

ANIMATION PERSONALITY — make it FUN (Tom & Jerry energy):
1. Letters that BOUNCE IN one by one on load — staggered, springy, 
   overshooting then settling (cubic-bezier elastic ease)
2. Headline words that WOBBLE gently on hover like jelly
3. A word that occasionally DARTS off-screen and ZIPS back (like Jerry 
   escaping) — playful, every ~8 seconds
4. Buttons that SQUASH-AND-STRETCH when hovered (scale 1.1 horizontally, 
   0.9 vertically then snap back — classic cartoon physics)
5. Floating elements (stars, sparkles) that drift and occasionally 
   bounce off the edges of the text like they're alive
6. On scroll: text blocks SPRING up with a bouncy overshoot, not a 
   boring fade
7. A cheeky cursor trail of tiny sparkles that follow the mouse
8. Numbers/stats that COUNT UP rapidly with a wobble when they finish

Use CSS @keyframes with elastic/bounce easing functions. Use 
cubic-bezier(.68,-0.55,.27,1.55) for the signature cartoon bounce.

BUILD THESE:

TASK 1 — Landing page (frontend/src/pages/Landing.jsx), public:
- Hero: hero.png full-visible (contain), headline "FIND YOUR NEXT 
  BRAND DEAL" with each letter bouncing in playfully, the word "DEAL" 
  occasionally darts away and zips back. Gold sparkle cursor trail. 
  CTA button "GET STARTED FREE →" that squash-stretches on hover.
- Features: 6 cards that spring up on scroll with staggered bounce, 
  wobble on hover. Orange #FF4500 accents.
- How It Works: 3 steps, giant numbers (01,02,03) that bounce in and 
  count up. 
- Pricing: $0/$19/$49 cards, Starter featured. Price numbers count up 
  with a wobble finish.
- Footer: "PROSPECTOR" logo where letters do a playful wave on hover.

TASK 2 — Apply images + playful animation to existing pages:
- Login.jsx: login.png fully visible as a side panel (contain), form on 
  a clean dark panel beside it. Title bounces in.
- Onboarding.jsx: onboarding.png as full-visible backdrop with dark 
  overlay, form steps spring in playfully.
- Dashboard.jsx: dashboard.png as a header banner (full width, contain, 
  not cropped) behind the welcome title which bounces in. Stats count 
  up with wobble.
- Brands.jsx: brands.png header banner, title springs in.
- Pitches.jsx: pitches.png header banner, title springs in.
- Settings.jsx: settings.png header banner, title bounces in.
All banners: image fully visible, dark gradient only where text sits, 
never crop the image, never hide the text.

TASK 3 — Routing in main.jsx:
- path="/" → Landing (public)
- path="/app" → Dashboard (protected)
- Redirect after login to /app
- Update Layout nav links

DESIGN SYSTEM:
- Colors: bg #0a0005, accent #FF4500, gold #FFD700, text #f5f0e8
- Fonts: Playfair Display (headings), Space Mono (labels/body)
- Import images via Vite: import heroImg from '../assets/landing/hero.png'
- Every animation must respect prefers-reduced-motion (disable bounce 
  for accessibility)
- Mobile: images switch to cover with smart positioning so they still 
  look good on narrow screens

CRITICAL RULES:
- NEVER crop an image's focal subject (phoenix, unicorn, gateway)
- NEVER place text over the busiest part of an image
- ALWAYS keep text readable with contrast halos/shadows
- Make it feel ALIVE and FUN but still PREMIUM — playful, not childish
- Be creative and unexpected with the animations — show personality

Test that npm run dev compiles cleanly and check each page in browser.