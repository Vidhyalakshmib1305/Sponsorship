// ============================================================
// agents/brandFinder.js
// Demographics-aware brand discovery
// Covers ALL niches: body, life, career, education, relationships
// Location-specific brand matching
// ============================================================

require('dotenv').config({ path: '../.env' });

const { callLLM }       = require('./llmRouter');
const { SYSTEM_PROMPT } = require('./prompts/systemPrompt');

// ============================================================
// MEGA BRAND BLOCKLIST — truly untouchable for nano/micro
// ============================================================
const MEGA_BRAND_BLOCKLIST = [
  'nike', 'adidas', 'apple', 'samsung', 'pepsi', 'coca cola',
  'coca-cola', 'louis vuitton', 'rolex', 'gucci', 'prada',
  'shein', 'amazon', 'google', 'microsoft', 'netflix', 'spotify',
  'zara', 'h&m', 'ralph lauren', 'tommy hilfiger',
  'oneplus', 'xiaomi', 'oppo', 'vivo', 'realme', 'motorola',
  'ferrari', 'lamborghini', 'porsche', 'bmw', 'mercedes',
];

// ============================================================
// COMPREHENSIVE NICHE MAP
// Every possible creator category covered
// ============================================================
const NICHE_REDDIT_QUERIES = {
  // FITNESS & BODY
  fitness:          ['fitness brand sponsorship influencer deal', 'gym supplement brand paid partnership micro influencer'],
  gym:              ['gym fitness brand sponsorship creator deal', 'supplement brand paid partnership influencer'],
  yoga:             ['yoga brand sponsorship influencer deal', 'wellness mat brand paid partnership creator'],
  running:          ['running brand sponsorship influencer deal', 'marathon shoe brand paid partnership creator'],
  bodybuilding:     ['bodybuilding supplement brand sponsorship', 'muscle brand paid partnership creator'],
  crossfit:         ['crossfit brand sponsorship influencer deal', 'fitness gear brand paid partnership'],
  weightloss:       ['weight loss brand sponsorship influencer', 'diet supplement brand paid partnership creator'],
  nutrition:        ['nutrition brand sponsorship influencer deal', 'health food brand paid partnership creator'],

  // BODY CARE — HEAD TO TOE
  haircare:         ['haircare brand sponsorship influencer deal', 'hair growth shampoo brand paid partnership'],
  hairgrowth:       ['hair growth brand sponsorship influencer', 'hair loss treatment brand paid partnership creator'],
  haircolour:       ['hair colour brand sponsorship influencer deal', 'hair dye brand paid partnership creator'],
  skincare:         ['skincare brand sponsorship micro influencer', 'beauty brand collab paid deal'],
  acne:             ['acne skincare brand sponsorship influencer', 'skin treatment brand paid partnership creator'],
  antiaging:        ['anti aging skincare brand sponsorship influencer', 'retinol brand paid partnership creator'],
  makeup:           ['makeup brand sponsorship influencer deal', 'cosmetics brand paid partnership creator'],
  nailcare:         ['nail brand sponsorship influencer deal', 'nail art brand paid partnership creator'],
  footcare:         ['foot care brand sponsorship influencer', 'pedicure brand paid partnership creator'],
  bodycare:         ['body lotion brand sponsorship influencer deal', 'body care brand paid partnership creator'],
  dental:           ['dental brand sponsorship influencer deal', 'teeth whitening brand paid partnership creator'],
  eyecare:          ['eyecare brand sponsorship influencer deal', 'contact lens brand paid partnership creator'],
  intimate:         ['intimate hygiene brand sponsorship influencer', 'feminine care brand paid partnership creator'],
  deodorant:        ['deodorant brand sponsorship influencer deal', 'personal care brand paid partnership creator'],
  hairremoval:      ['hair removal brand sponsorship influencer deal', 'waxing brand paid partnership creator'],

  // BEAUTY & FASHION
  beauty:           ['beauty brand sponsorship influencer deal', 'makeup skincare brand paid partnership collab'],
  fashion:          ['fashion brand sponsorship influencer deal', 'clothing brand paid partnership creator'],
  luxury:           ['luxury brand sponsorship influencer deal', 'premium brand paid partnership creator'],
  jewellery:        ['jewellery brand sponsorship influencer deal', 'accessories brand paid partnership creator'],
  watches:          ['watch brand sponsorship influencer deal', 'timepiece brand paid partnership creator'],
  handbags:         ['handbag brand sponsorship influencer deal', 'accessories brand paid partnership creator'],
  sunglasses:       ['sunglasses brand sponsorship influencer deal', 'eyewear brand paid partnership creator'],
  shoes:            ['shoe brand sponsorship influencer deal', 'footwear brand paid partnership creator'],

  // FOOD & DRINK
  food:             ['food brand sponsorship influencer deal', 'food brand paid partnership creator'],
  cooking:          ['cooking brand sponsorship influencer deal', 'kitchen brand paid partnership creator'],
  baking:           ['baking brand sponsorship influencer deal', 'kitchen brand paid partnership creator'],
  vegan:            ['vegan brand sponsorship influencer deal', 'plant based brand paid partnership creator'],
  coffee:           ['coffee brand sponsorship influencer deal', 'beverage brand paid partnership creator'],
  snacks:           ['snack brand sponsorship influencer deal', 'food brand paid partnership creator'],

  // TRAVEL & LIFESTYLE
  travel:           ['travel brand sponsorship influencer deal', 'hotel tourism brand paid collab creator'],
  luxury_travel:    ['luxury travel brand sponsorship influencer', 'premium hotel brand paid partnership creator'],
  budget_travel:    ['budget travel brand sponsorship influencer', 'hostel travel brand paid partnership creator'],
  hotel:            ['hotel brand sponsorship influencer deal', 'accommodation brand paid partnership creator'],
  airline:          ['airline brand sponsorship influencer deal', 'flight brand paid partnership creator'],
  lifestyle:        ['lifestyle brand sponsorship influencer deal', 'lifestyle brand paid partnership creator'],
  home:             ['home decor brand sponsorship influencer', 'furniture brand paid partnership creator'],
  homedecor:        ['home decor brand sponsorship influencer deal', 'interior brand paid partnership creator'],
  diy:              ['DIY brand sponsorship influencer deal', 'tools brand paid partnership creator'],
  pets:             ['pet brand sponsorship influencer deal', 'pet food brand paid partnership creator'],

  // ENTERTAINMENT & COMEDY
  comedy:           ['comedy creator brand sponsorship deal', 'entertainment influencer paid partnership brand'],
  entertainment:    ['entertainment influencer brand sponsorship', 'creator brand deal comedy viral'],
  memes:            ['meme page brand sponsorship deal', 'viral creator paid partnership brand'],
  movies:           ['movie content creator brand deal', 'OTT platform brand paid partnership creator'],
  reels:            ['reels creator brand sponsorship deal', 'short video creator paid partnership'],
  dance:            ['dance creator brand sponsorship deal', 'dance influencer paid partnership brand'],
  acting:           ['acting creator brand sponsorship deal', 'skit creator paid partnership'],
  music:            ['music brand sponsorship influencer deal', 'music gear brand paid partnership creator'],

  // MOTIVATION & PERSONAL DEVELOPMENT
  motivation:       ['motivation self help brand sponsorship influencer', 'productivity brand paid partnership creator'],
  mindset:          ['mindset personal development brand sponsorship', 'self improvement brand paid partnership creator'],
  productivity:     ['productivity app brand sponsorship influencer', 'app brand paid partnership creator'],
  selfdevelopment:  ['self development brand sponsorship influencer', 'personal growth brand paid partnership creator'],
  discipline:       ['discipline self improvement brand sponsorship', 'productivity brand paid partnership creator'],
  morning_routine:  ['morning routine brand sponsorship influencer', 'wellness brand paid partnership creator'],

  // RELATIONSHIPS & PERSONAL LIFE
  relationships:    ['relationship creator brand sponsorship deal', 'dating lifestyle brand paid partnership'],
  dating:           ['dating app brand sponsorship influencer deal', 'relationship brand paid partnership creator'],
  wedding:          ['wedding brand sponsorship influencer deal', 'bridal brand paid partnership creator'],
  bodypositive:     ['body positive creator brand sponsorship deal', 'inclusive fashion brand paid partnership'],
  selflove:         ['self love wellness creator brand sponsorship', 'body positive brand paid partnership'],
  mentalhealth:     ['mental health brand sponsorship influencer deal', 'wellness app brand paid partnership creator'],
  parenting:        ['parenting brand sponsorship influencer deal', 'baby brand paid partnership creator'],
  pregnancy:        ['pregnancy brand sponsorship influencer deal', 'maternity brand paid partnership creator'],
  kids:             ['kids brand sponsorship influencer deal', 'children brand paid partnership creator'],

  // SPIRITUALITY & WELLNESS
  spirituality:     ['spirituality creator brand sponsorship deal', 'wellness holistic brand paid partnership'],
  meditation:       ['meditation wellness brand sponsorship influencer', 'mindfulness brand paid partnership creator'],
  astrology:        ['astrology creator brand sponsorship deal', 'wellness brand paid partnership creator'],
  ayurveda:         ['ayurveda brand sponsorship influencer deal', 'herbal brand paid partnership creator'],

  // FINANCE & CAREER
  finance:          ['fintech brand sponsorship influencer deal', 'finance app paid partnership creator'],
  investing:        ['investing brand sponsorship influencer deal', 'investment platform paid partnership creator'],
  crypto:           ['crypto brand sponsorship influencer deal', 'blockchain brand paid partnership creator'],
  realestate:       ['real estate brand sponsorship influencer deal', 'property brand paid partnership creator'],
  career:           ['career brand sponsorship influencer deal', 'job platform paid partnership creator'],
  jobs:             ['job platform brand sponsorship influencer', 'career app paid partnership creator'],
  freelancing:      ['freelancing brand sponsorship influencer deal', 'remote work brand paid partnership creator'],
  entrepreneurship: ['startup brand sponsorship influencer deal', 'entrepreneur brand paid partnership creator'],

  // EDUCATION
  education:        ['edtech brand sponsorship influencer deal', 'education app paid partnership creator'],
  studytips:        ['study brand sponsorship influencer deal', 'edtech brand paid partnership creator'],
  languages:        ['language learning brand sponsorship influencer', 'language app paid partnership creator'],
  coding:           ['coding brand sponsorship influencer deal', 'developer brand paid partnership creator'],
  exams:            ['exam prep brand sponsorship influencer deal', 'education brand paid partnership creator'],

  // TECH & GAMING
  tech:             ['tech brand sponsorship influencer deal', 'software brand paid partnership creator'],
  ai:               ['AI tool brand sponsorship influencer', 'AI startup paid partnership creator'],
  saas:             ['SaaS brand sponsorship influencer deal', 'software startup paid partnership creator'],
  gaming:           ['gaming brand sponsorship influencer deal', 'gaming peripheral brand paid partnership'],
  unboxing:         ['unboxing brand sponsorship influencer deal', 'tech brand paid partnership creator'],
  photography:      ['photography brand sponsorship influencer', 'camera gear brand paid partnership'],

  // DEFAULT
  default:          ['brand sponsorship micro influencer deal 2025', 'paid partnership influencer brand collab'],
};

// ============================================================
// NICHE → PRODUCTHUNT CATEGORY
// ============================================================
const NICHE_PH_TOPICS = {
  fitness: 'health-and-fitness', gym: 'health-and-fitness', yoga: 'health-and-fitness',
  running: 'health-and-fitness', nutrition: 'health-and-fitness', weightloss: 'health-and-fitness',
  haircare: 'beauty', skincare: 'beauty', makeup: 'beauty', beauty: 'beauty',
  nailcare: 'beauty', dental: 'health-and-fitness', eyecare: 'health-and-fitness',
  fashion: 'fashion', lifestyle: 'lifestyle', home: 'lifestyle', homedecor: 'lifestyle',
  food: 'food-and-drink', cooking: 'food-and-drink', baking: 'food-and-drink',
  travel: 'travel', hotel: 'travel', airline: 'travel',
  tech: 'technology', ai: 'artificial-intelligence', saas: 'saas', gaming: 'gaming',
  finance: 'finance', investing: 'finance', crypto: 'finance', realestate: 'finance',
  education: 'education', coding: 'developer-tools', languages: 'education',
  comedy: 'entertainment', entertainment: 'entertainment', music: 'entertainment',
  motivation: 'productivity', productivity: 'productivity', mindset: 'productivity',
  mentalhealth: 'health-and-fitness', meditation: 'health-and-fitness',
  parenting: 'parenting', pets: 'pets', wedding: 'lifestyle',
  career: 'productivity', jobs: 'productivity', freelancing: 'productivity',
  default: 'marketing',
};

const TECH_NICHES = ['tech', 'ai', 'saas', 'gaming', 'software', 'coding', 'crypto', 'unboxing'];

// ============================================================
// LOCATION → LOCAL BRAND MARKETS
// ============================================================
const LOCATION_MARKETS = {
  'india':          'Indian market (Nykaa, Mamaearth, boAt, Cult.fit, CRED, Zomato, Myntra, Boat, Sugar Cosmetics)',
  'usa':            'US market (Target, Ulta Beauty, Sephora, Walmart brands, American D2C brands)',
  'uk':             'UK market (Boots, ASOS, Superdrug, UK D2C brands, British brands)',
  'australia':      'Australian market (Australian D2C brands, local wellness brands)',
  'canada':         'Canadian market (Canadian brands, North American D2C)',
  'europe':         'European market (German, French, Italian brands, European D2C)',
  'uae':            'UAE/Middle East market (regional lifestyle brands, luxury brands)',
  'southeast asia': 'Southeast Asian market (Shopee brands, regional D2C)',
  'nigeria':        'African market (local FMCG, regional tech brands)',
  'brazil':         'Brazilian market (local D2C brands, Brazilian beauty brands)',
  'global':         'globally recognized international brands from US, UK, Europe',
};

// ============================================================
// TIER SYSTEM
// ============================================================
function getCreatorTier(followers) {
  if (followers < 10000) {
    return {
      name: 'nano', label: 'Nano Influencer (1K–10K)', dealRange: '$10–$100 per post',
      brandSize:   'small startups, local D2C brands, indie brands, gifting campaigns, crowdfunded products',
      brandGoal:   'hyper-local authenticity and community trust',
      avoidBrands: 'Nike, Apple, Samsung, Pepsi, L\'Oreal, any global Fortune 500 company',
      engagement:  'high engagement rate (4–8%) is the main selling point',
    };
  } else if (followers < 100000) {
    return {
      name: 'micro', label: 'Micro Influencer (10K–100K)', dealRange: '$100–$1,000 per post',
      brandSize:   'mid-size brands, D2C brands, apps, emerging brands with influencer marketing budgets',
      brandGoal:   'niche authority, authentic conversions, targeted audience reach',
      avoidBrands: 'Nike, Apple, Samsung, Rolex, ultra-luxury brands that only work with celebrities',
      engagement:  'engagement rate 2–4% plus niche expertise is what brands value most',
    };
  } else if (followers < 500000) {
    return {
      name: 'midtier', label: 'Mid-tier Influencer (100K–500K)', dealRange: '$1,000–$5,000 per post',
      brandSize:   'large established brands, major national brands, global D2C brands',
      brandGoal:   'balance of reach and credibility, brand image building',
      avoidBrands: 'ultra-luxury only like Rolex, Louis Vuitton, Ferrari',
      engagement:  '100K+ reach with solid 1.5–3% engagement opens major brand doors',
    };
  } else if (followers < 1000000) {
    return {
      name: 'macro', label: 'Macro Influencer (500K–1M)', dealRange: '$5,000–$20,000 per post',
      brandSize:   'Fortune 500 brands, major global corporations, premium brands',
      brandGoal:   'mass awareness, brand image, cultural relevance',
      avoidBrands: 'small startups — they cannot afford this tier',
      engagement:  'reach of 500K+ is the primary value',
    };
  } else {
    return {
      name: 'mega', label: 'Mega / Celebrity Influencer (1M+)', dealRange: '$20,000–$1M+ per post',
      brandSize:   'global household name brands, luxury brands, major corporations',
      brandGoal:   'viral cultural impact, maximum global reach',
      avoidBrands: 'any brand not a household name globally',
      engagement:  'celebrity status is the product',
    };
  }
}

// ============================================================
// AUDIENCE DEMOGRAPHICS → BRAND CATEGORIES
// Full body + life + career coverage
// ============================================================
function getAudienceBrandCategories(creator) {
  const gender   = creator.audience_gender?.toLowerCase() || '';
  const age      = creator.audience_age_range || '18-34';
  const income   = creator.audience_income?.toLowerCase() || 'middle';
  const niche    = creator.primary_niche?.toLowerCase() || '';
  const style    = creator.content_style?.toLowerCase() || '';

  const categories = new Set();

  // === NICHE FIRST — highest priority, always included ===
  // These are the brands that DIRECTLY match what the creator makes content about
  const nicheMap = {
    comedy:          ['OTT platforms', 'food delivery apps', 'snack brands', 'clothing brands', 'gaming apps', 'FMCG brands', 'personal care brands'],
    entertainment:   ['OTT streaming platforms', 'food delivery apps', 'personal care brands', 'fintech apps', 'snack brands'],
    motivation:      ['productivity apps', 'online course platforms', 'book brands', 'supplement brands', 'premium watches', 'luxury pen brands', 'journal brands'],
    mindset:         ['productivity apps', 'self-help platforms', 'supplement brands', 'apparel brands', 'wellness brands'],
    finance:         ['fintech apps', 'investment platforms', 'credit card brands', 'insurance brands', 'banking apps', 'crypto platforms', 'tax software brands'],
    investing:       ['investment platforms', 'stock app brands', 'financial education brands', 'fintech brands'],
    career:          ['job platform brands', 'LinkedIn premium', 'online course platforms', 'professional attire brands', 'productivity tool brands'],
    jobs:            ['job platform brands', 'resume builder brands', 'professional development brands', 'career coaching brands'],
    education:       ['edtech brands', 'online course platforms', 'stationery brands', 'laptop brands', 'study app brands'],
    studytips:       ['study app brands', 'stationery brands', 'edtech brands', 'focus supplement brands'],
    travel:          ['hotel brands', 'airline brands', 'luggage brands', 'travel insurance brands', 'travel apps', 'tourism boards', 'camera brands'],
    food:            ['food brands', 'kitchen appliance brands', 'grocery delivery apps', 'condiment brands', 'cookware brands'],
    cooking:         ['cookware brands', 'kitchen appliance brands', 'ingredient brands', 'food delivery brands', 'recipe app brands'],
    haircare:        ['shampoo brands', 'hair treatment brands', 'hair styling brands', 'hair oil brands', 'hair tool brands'],
    hairgrowth:      ['hair growth supplement brands', 'hair loss treatment brands', 'scalp care brands', 'hair oil brands'],
    skincare:        ['moisturiser brands', 'serum brands', 'sunscreen brands', 'acne treatment brands', 'cleanser brands'],
    makeup:          ['foundation brands', 'lipstick brands', 'eyeshadow brands', 'mascara brands', 'makeup tool brands'],
    fitness:         ['supplement brands', 'activewear brands', 'gym equipment brands', 'fitness app brands', 'protein brand', 'sports nutrition brands'],
    yoga:            ['yoga mat brands', 'activewear brands', 'wellness brands', 'meditation app brands', 'supplement brands'],
    bodypositive:    ['inclusive fashion brands', 'body care brands', 'mental health app brands', 'wellness brands', 'inclusive beauty brands'],
    selflove:        ['wellness brands', 'skincare brands', 'fitness app brands', 'mental health platforms', 'journaling brands'],
    relationships:   ['dating apps', 'fashion brands', 'fragrance brands', 'personal care brands', 'jewellery brands', 'couple gift brands'],
    wedding:         ['wedding venue brands', 'bridal fashion brands', 'jewellery brands', 'wedding planning apps', 'florist brands'],
    parenting:       ['baby product brands', 'family food brands', 'educational toy brands', 'parenting app brands', 'children clothing brands'],
    mentalhealth:    ['mental health app brands', 'therapy platform brands', 'wellness brands', 'supplement brands', 'journaling brands'],
    spirituality:    ['meditation app brands', 'wellness brands', 'yoga wear brands', 'holistic health brands', 'crystal/holistic brands'],
    gaming:          ['gaming peripheral brands', 'gaming chair brands', 'energy drink brands', 'gaming headset brands', 'gaming mouse brands'],
    tech:            ['tech gadget brands', 'software brands', 'app brands', 'electronics brands', 'laptop brands'],
    pets:            ['pet food brands', 'pet accessory brands', 'pet healthcare brands', 'pet grooming brands'],
    home:            ['home decor brands', 'furniture brands', 'smart home brands', 'cleaning product brands', 'storage brands'],
    photography:     ['camera brands', 'lens brands', 'photo editing software brands', 'photography accessory brands'],
    music:           ['music streaming brands', 'instrument brands', 'music production software brands', 'headphone brands'],
    dance:           ['activewear brands', 'dance shoe brands', 'music streaming brands', 'supplement brands'],
    realestate:      ['real estate platform brands', 'home loan brands', 'interior design brands', 'smart home brands'],
    crypto:          ['crypto exchange brands', 'hardware wallet brands', 'fintech brands', 'blockchain platform brands'],
    dental:          ['toothbrush brands', 'toothpaste brands', 'mouthwash brands', 'teeth whitening brands', 'dental care brands'],
    nailcare:        ['nail polish brands', 'nail care tool brands', 'nail art brands', 'salon brands'],
    footcare:        ['foot cream brands', 'shoe brands', 'insole brands', 'pedicure brands'],
    bodycare:        ['body lotion brands', 'body wash brands', 'deodorant brands', 'body scrub brands'],
    vegan:           ['vegan food brands', 'plant-based supplement brands', 'vegan fashion brands', 'cruelty-free beauty brands'],
  };

  // Add niche categories FIRST — highest priority
  if (nicheMap[niche]) {
    nicheMap[niche].forEach(c => categories.add(c));
  }

  // === CONTENT STYLE — added second ===
  if (style.includes('luxury') || style.includes('premium')) {
    ['luxury brands', 'premium lifestyle brands', 'high-end fashion brands'].forEach(c => categories.add(c));
  }
  if (style.includes('budget') || style.includes('affordable') || style.includes('student')) {
    ['value brands', 'D2C brands', 'affordable fashion brands', 'student discount brands'].forEach(c => categories.add(c));
  }
  if (style.includes('funny') || style.includes('comedy') || style.includes('relatable')) {
    ['FMCG brands', 'food brands', 'app brands', 'OTT platforms', 'snack brands'].forEach(c => categories.add(c));
  }

  // === GENDER — adds extra relevant categories ===
  if (gender.includes('female') || gender.includes('women')) {
    ['makeup brands', 'skincare brands', 'haircare brands', 'fashion brands',
     'jewellery brands', 'body lotion brands', 'feminine care brands'].forEach(c => categories.add(c));
  }
  if (gender.includes('male') || gender.includes('men')) {
    ['men\'s grooming brands', 'beard care brands', 'men\'s fashion brands',
     'sports brands', 'gaming brands', 'men\'s supplement brands'].forEach(c => categories.add(c));
  }

  // === AGE — adds extra relevant categories ===
  const ageNum = parseInt(age.split('-')[0]) || 22;
  if (ageNum < 25) {
    ['OTT streaming platforms', 'food delivery apps', 'snack brands',
     'fast fashion brands', 'gaming brands', 'music apps'].forEach(c => categories.add(c));
  } else if (ageNum < 35) {
    ['fintech apps', 'travel brands', 'premium lifestyle brands',
     'fitness brands', 'career development platforms'].forEach(c => categories.add(c));
  } else if (ageNum < 50) {
    ['insurance brands', 'real estate platforms', 'wellness brands',
     'family-oriented brands', 'financial planning brands'].forEach(c => categories.add(c));
  } else {
    ['luxury brands', 'health supplement brands', 'financial services brands'].forEach(c => categories.add(c));
  }

  // === INCOME ===
  if (income.includes('luxury') || income.includes('high') || income.includes('affluent')) {
    ['luxury fashion brands', 'premium watches', 'luxury travel brands', 'high-end electronics brands'].forEach(c => categories.add(c));
  } else if (income.includes('middle')) {
    ['D2C brands', 'FMCG brands', 'mid-range fashion brands', 'value-for-money brands'].forEach(c => categories.add(c));
  } else if (income.includes('student') || income.includes('low')) {
    ['budget brands', 'student deals brands', 'affordable D2C brands', 'freemium app brands'].forEach(c => categories.add(c));
  }

  return [...categories].slice(0, 20).join(', ');
}

// ============================================================
// MAIN FUNCTION
// ============================================================
async function findBrands(creator, options = {}) {
  const limit       = options.limit || 25;
  const tier        = getCreatorTier(creator.instagram_followers || 0);
  const niche       = creator.primary_niche?.toLowerCase() || 'default';
  const isTechNiche = TECH_NICHES.some(t => niche.includes(t));
  const audienceCats = getAudienceBrandCategories(creator);
  const location    = creator.audience_location?.toLowerCase() || 'global';
  const localMarket = LOCATION_MARKETS[location] || LOCATION_MARKETS['global'];

  console.log(`\n[BrandFinder] 🔍 Finding ${limit} brands`);
  console.log(`[BrandFinder] Creator: @${creator.instagram_handle || 'unknown'}`);
  console.log(`[BrandFinder] Followers: ${creator.instagram_followers?.toLocaleString('en-US') || 0}`);
  console.log(`[BrandFinder] Tier: ${tier.label} | Deal: ${tier.dealRange}`);
  console.log(`[BrandFinder] Niche: ${niche} | Location: ${location}`);
  console.log(`[BrandFinder] Audience: ${creator.audience_gender || 'mixed'} | Age: ${creator.audience_age_range || '18-34'}`);

  const allBrands = [];

  // Source 1 — LLM
  try {
    const b = await findBrandsFromLLM(creator, tier, limit, audienceCats, localMarket);
    console.log(`[BrandFinder] ✅ LLM: ${b.length} brands`);
    allBrands.push(...b);
  } catch (err) {
    console.warn('[BrandFinder] ⚠️ LLM failed:', err.message);
  }

  // Source 2 — Web Search (Anthropic or LLM fallback)
  try {
    const b = await findBrandsFromWebSearch(creator, tier, niche);
    console.log(`[BrandFinder] ✅ WebSearch: ${b.length} new brands`);
    allBrands.push(...b);
  } catch (err) {
    console.warn('[BrandFinder] ⚠️ WebSearch failed:', err.message);
  }

  // Source 3 — ProductHunt
  try {
    const b = await findBrandsFromProductHunt(creator, tier, niche);
    console.log(`[BrandFinder] ✅ ProductHunt: ${b.length} new brands`);
    allBrands.push(...b);
  } catch (err) {
    console.warn('[BrandFinder] ⚠️ ProductHunt failed:', err.message);
  }

  // Source 4 — HackerNews (tech only)
  if (isTechNiche) {
    try {
      const b = await findBrandsFromHackerNews(creator, tier);
      console.log(`[BrandFinder] ✅ HackerNews: ${b.length} new brands`);
      allBrands.push(...b);
    } catch (err) {
      console.warn('[BrandFinder] ⚠️ HackerNews failed:', err.message);
    }
  } else {
    console.log(`[BrandFinder] ⏭️  HackerNews: skipped (not tech niche)`);
  }

  // Deduplicate
  const seen   = new Set();
  const unique = allBrands.filter(b => {
    const key = b.name?.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[BrandFinder] 🔗 Unique: ${unique.length} → enriching...`);

  const enriched = await enrichBrands(unique, creator);
  const tiered   = applyTierBlocklist(enriched, tier);
  const filtered = filterBrands(tiered, creator);
  const final    = filtered.slice(0, limit);

  console.log(`[BrandFinder] ✅ Final: ${final.length} brands`);
  return { brands: final, tier };
}

// ============================================================
// SOURCE 1 — LLM (demographics + location aware)
// ============================================================
async function findBrandsFromLLM(creator, tier, limit, audienceCats, localMarket) {
  const result = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Find ${limit} brands that would sponsor this creator based on their complete profile.

CREATOR PROFILE:
- Primary niche: ${creator.primary_niche}
- Secondary niches: ${(creator.secondary_niches || []).join(', ') || 'none'}
- Content style: ${creator.content_style || 'not specified'}
- Followers: ${creator.instagram_followers?.toLocaleString('en-US')} (${tier.name} tier)
- Engagement rate: ${creator.instagram_engagement_rate || '?'}%
- Audience gender: ${creator.audience_gender || 'mixed'}
- Audience age range: ${creator.audience_age_range || '18-34'}
- Audience location: ${creator.audience_location || 'global'}
- Audience income level: ${creator.audience_income || 'middle class'}

BRAND MATCHING — based on audience demographics, target these brand categories:
${audienceCats}

LOCATION GUIDANCE:
- 75% of brands should be GLOBALLY RECOGNIZED international brands (US, UK, Europe, global D2C)
- 25% should be from the creator's local market: ${localMarket}
- If audience location is "global" or "USA", find 90% international brands

TIER RULES (${tier.name}):
- Brand size: ${tier.brandSize}
- Brand goal: ${tier.brandGoal}
- EXCLUDE: ${tier.avoidBrands}
- Expected deal range: ${tier.dealRange}

CRITICAL RULES:
- Match to AUDIENCE demographics (gender, age, income) not just creator niche
- A comedy creator with 60% female 18-28 audience should get OTT, beauty, fashion, FMCG brands
- A motivation creator should get productivity apps, luxury watches, supplement brands
- A finance creator should get fintech, investment, insurance brands
- A travel creator should get hotels, airlines, luggage, tourism brands
- NO coupon-code-only brands
- Only brands genuinely running influencer campaigns at ${tier.name} level

JSON only:
{
  "brands": [{
    "name": "Brand Name",
    "website": "brand.com",
    "industry": "specific category",
    "description": "one sentence what they sell",
    "niches_they_target": ["niche1"],
    "audience_they_target": ["demographic"],
    "known_to_sponsor": true,
    "avg_deal_size_usd": 300,
    "market": "global or specific country",
    "sponsors_tier": "${tier.name}",
    "why_good_fit": "reason matching both niche AND audience demographics"
  }]
}`,
    maxTokens:   3000,
    temperature: 0.4,
    jsonMode:    true,
  });

  return (result.brands || []).map(b => ({ ...b, source: 'llm_knowledge' }));
}

// ============================================================
// SOURCE 2 — Web Search (Anthropic API or LLM knowledge fallback)
// Replaces Reddit scraping (blocked by CORS / rate limits)
// ============================================================
async function findBrandsFromWebSearch(creator, tier, niche) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const location = creator.audience_location?.toLowerCase() || 'global';

  const queries = [
    `${niche} brands sponsoring micro influencers 2025 2026`,
    `${niche} brand influencer marketing partnerships ${location}`,
    `brands looking for ${niche} creators to sponsor`,
  ];

  // Try Anthropic web search if key is configured
  if (ANTHROPIC_API_KEY) {
    try {
      const brands = await searchWithAnthropicWebSearch(creator, tier, niche, queries, ANTHROPIC_API_KEY);
      if (brands.length > 0) {
        console.log(`[BrandFinder] ✅ Anthropic web search: ${brands.length} brands`);
        return brands;
      }
    } catch (err) {
      console.warn('[BrandFinder] ⚠️ Anthropic web search failed:', err.message);
    }
  }

  // Fallback: LLM knowledge-based search simulation
  return await findBrandsFromLLMWebSimulation(creator, tier, niche, queries);
}

async function searchWithAnthropicWebSearch(creator, tier, niche, queries, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'x-api-key':      apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-opus-4-7',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role:    'user',
        content: `Search for brands that sponsor ${niche} influencers. Use these queries:
1. "${queries[0]}"
2. "${queries[1]}"

Find REAL brands with active influencer programs for ${tier.name}-tier creators (${creator.instagram_followers?.toLocaleString()} followers, ${creator.audience_location || 'global'}).

Return JSON: {"brands": [{"name":"Brand","website":"brand.com","industry":"category","description":"what they sell","niches_they_target":["${niche}"],"known_to_sponsor":true,"avg_deal_size_usd":200,"market":"global"}]}`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const textContent = data.content?.find(c => c.type === 'text')?.text || '';

  const jsonMatch = textContent.match(/\{[\s\S]*"brands"[\s\S]*\}/);
  if (!jsonMatch) return [];

  const parsed = JSON.parse(jsonMatch[0]);
  return (parsed.brands || []).map(b => ({
    name:                b.name,
    website:             b.website,
    industry:            b.industry,
    description:         b.description,
    niches_they_target:  b.niches_they_target || [niche],
    audience_they_target: [creator.audience_gender || 'all'],
    known_to_sponsor:    true,
    avg_deal_size_usd:   b.avg_deal_size_usd,
    market:              b.market || 'global',
    sponsors_tier:       tier.name,
    why_good_fit:        `Found via web search — sponsors ${niche} creators`,
    source:              'web_search',
  }));
}

async function findBrandsFromLLMWebSimulation(creator, tier, niche, queries) {
  const result = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Based on your knowledge of influencer marketing and brand partnerships (2024-2026), find real brands that:
1. Run active influencer programs for ${niche} creators
2. Work with ${tier.name}-tier creators (~${creator.instagram_followers?.toLocaleString()} followers)
3. Target ${creator.audience_gender || 'mixed'} audience, age ${creator.audience_age_range || '18-34'}, in ${creator.audience_location || 'global'}

This simulates searching for: "${queries[0]}"

Focus on REAL brands with documented influencer programs. Not generic names.

JSON only:
{
  "brands": [{
    "name": "Brand Name",
    "website": "brand.com",
    "industry": "specific category",
    "description": "what they sell",
    "niches_they_target": ["${niche}"],
    "audience_they_target": ["${creator.audience_gender || 'all'}"],
    "known_to_sponsor": true,
    "avg_deal_size_usd": 200,
    "market": "global or specific country",
    "sponsors_tier": "${tier.name}",
    "why_good_fit": "why they sponsor ${niche} creators specifically"
  }]
}`,
    maxTokens: 1200, temperature: 0.3, jsonMode: true,
  });

  return (result.brands || []).map(b => ({ ...b, source: 'web_search' }));
}

// ============================================================
// SOURCE 3 — ProductHunt RSS
// ============================================================
async function findBrandsFromProductHunt(creator, tier, niche) {
  try {
    const res = await fetch('https://www.producthunt.com/feed', {
      headers: { 'User-Agent': 'SponsorshipProspector/1.0' },
    });
    if (!res.ok) return [];
    const xml      = await res.text();
    const items    = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const snippets = items.slice(0, 25).map(item => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] || '';
      const desc  = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || [])[1] || '';
      return `${title} — ${desc.replace(/<[^>]+>/g, '').slice(0, 200)}`;
    }).filter(s => s.length > 15);
    if (!snippets.length) return [];

    const result = await callLLM({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `New ProductHunt launches today. Find relevant to ${creator.primary_niche} creator,
${creator.audience_gender || 'mixed'} audience, age ${creator.audience_age_range || '18-34'}, ${tier.name} tier.

LAUNCHES:
${snippets.join('\n---\n')}

JSON only:
{
  "brands": [{
    "name": "Brand",
    "website": null,
    "industry": "category",
    "description": "what they do",
    "niches_they_target": ["${creator.primary_niche}"],
    "audience_they_target": ["${creator.audience_gender || 'all'}"],
    "known_to_sponsor": true,
    "avg_deal_size_usd": null,
    "market": "global",
    "sponsors_tier": "${tier.name}",
    "why_good_fit": "newly launched — perfect early partnership timing"
  }]
}
Not relevant? Return: {"brands": []}`,
      maxTokens: 800, temperature: 0.3, jsonMode: true,
    });
    return (result.brands || []).map(b => ({ ...b, source: 'producthunt_new' }));
  } catch (err) {
    console.warn('[BrandFinder] ProductHunt failed:', err.message);
    return [];
  }
}

// ============================================================
// SOURCE 4 — HackerNews (tech only)
// ============================================================
async function findBrandsFromHackerNews(creator, tier) {
  const snippets = [];
  for (const query of [`${creator.primary_niche} startup marketing`, `${creator.primary_niche} SaaS creator`]) {
    try {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`,
        { headers: { 'User-Agent': 'SponsorshipProspector/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      (data?.hits || []).forEach(h => {
        const t = `${h.title || ''} ${h.story_text || ''}`;
        if (t.length > 10) snippets.push(t.slice(0, 400));
      });
      await sleep(500);
    } catch {}
  }
  if (!snippets.length) return [];

  const result = await callLLM({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Extract tech companies from HackerNews for a ${tier.name}-tier ${creator.primary_niche} creator.
POSTS: ${snippets.slice(0, 10).join('\n---\n')}
JSON only: {"brands": [{"name":"Company","website":null,"industry":"tech","description":"what they do","niches_they_target":["${creator.primary_niche}"],"audience_they_target":["tech enthusiasts"],"known_to_sponsor":true,"avg_deal_size_usd":null,"market":"global","sponsors_tier":"${tier.name}","why_good_fit":"tech startup on HackerNews"}]}
None? Return: {"brands": []}`,
    maxTokens: 800, temperature: 0.2, jsonMode: true,
  });
  return (result.brands || []).map(b => ({ ...b, source: 'hackernews_realtime' }));
}

// ============================================================
// ENRICHMENT
// ============================================================
async function enrichBrands(brands, creator) {
  const enriched = [], batchSize = 5;
  for (let i = 0; i < brands.length; i += batchSize) {
    const batch = brands.slice(i, i + batchSize);
    try {
      const result = await callLLM({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `Marketing contact info for each brand.
BRANDS: ${batch.map((b, idx) => `${idx + 1}. ${b.name} (${b.website || 'unknown'}) — ${b.industry}`).join('\n')}
JSON only: {"enriched": [{"name":"Brand Name","marketing_email":"partnerships@brand.com","contact_title":"Influencer Marketing Manager","linkedin_url":"linkedin.com/company/brandname"}]}`,
        maxTokens: 600, temperature: 0.2, jsonMode: true,
      });
      const eb = result.enriched || [];
      batch.forEach((brand, idx) => {
        enriched.push({
          ...brand,
          marketing_email: eb[idx]?.marketing_email || null,
          contact_name:    eb[idx]?.contact_title   || null,
          linkedin_url:    eb[idx]?.linkedin_url     || null,
          discovered_at:   new Date().toISOString(),
        });
      });
    } catch {
      batch.forEach(b => enriched.push({ ...b, marketing_email: null, contact_name: null, discovered_at: new Date().toISOString() }));
    }
    if (i + batchSize < brands.length) await sleep(800);
  }
  return enriched;
}

// ============================================================
// BLOCKLIST — nano/micro only
// ============================================================
function applyTierBlocklist(brands, tier) {
  if (tier.name !== 'nano' && tier.name !== 'micro') return brands;
  return brands.filter(b => {
    const name    = b.name?.toLowerCase() || '';
    const blocked = MEGA_BRAND_BLOCKLIST.some(item => name.includes(item));
    if (blocked) console.log(`[BrandFinder] 🚫 Blocked: ${b.name}`);
    return !blocked;
  });
}

// ============================================================
// FILTER
// ============================================================
function filterBrands(brands, creator) {
  const creatorNiches = [creator.primary_niche, ...(creator.secondary_niches || [])].map(n => n.toLowerCase());
  return brands.filter(brand => {
    if (!brand.name || brand.name.length < 2) return false;
    const brandTargets = [...(brand.niches_they_target || []), ...(brand.audience_they_target || [])].map(n => n.toLowerCase());
    return brandTargets.some(bt => creatorNiches.some(cn => bt.includes(cn) || cn.includes(bt))) || brand.known_to_sponsor;
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// TEST — change creator profile to test different niches
// ============================================================
async function test() {
  console.log('='.repeat(60));
  console.log('BRAND DISCOVERY — FULL DEMOGRAPHICS COVERAGE');
  console.log('='.repeat(60));

  const testCreator = {
    instagram_handle:          'testcreator',
    instagram_followers:       45000,
    instagram_engagement_rate: 4.2,
    primary_niche:             'comedy',
    secondary_niches:          ['entertainment', 'lifestyle'],
    content_style:             'funny, relatable, trending',
    audience_gender:           '60% female, 40% male',
    audience_age_range:        '18-28',
    audience_location:         'USA',          // change to India, UK, Global etc
    audience_income:           'middle class',
    content_language:          'English',
    base_rate_per_post:        150,
  };

  const { brands, tier } = await findBrands(testCreator, { limit: 20 });

  console.log(`\n📋 ${brands.length} brands for ${tier.label}:\n`);

  const icons = { llm_knowledge: '🤖', reddit_search: '🔴', producthunt_new: '🟣', hackernews_realtime: '🟠' };

  brands.forEach((b, i) => {
    const icon = icons[b.source] || '⚪';
    console.log(`${i + 1}. ${icon} ${b.name} [${b.market || 'global'}] — ${b.industry}`);
    console.log(`   Email: ${b.marketing_email || 'not found'} | Est: $${b.avg_deal_size_usd || '?'}`);
    console.log(`   Fit:   ${b.why_good_fit}`);
    console.log('');
  });

  const bySource = {};
  brands.forEach(b => { bySource[b.source] = (bySource[b.source] || 0) + 1; });
  console.log('─'.repeat(60));
  Object.entries(bySource).forEach(([src, count]) => console.log(`  ${icons[src] || '⚪'} ${src}: ${count}`));
  console.log(`\nTier: ${tier.name} | Total: ${brands.length} | Deal: ${tier.dealRange}`);
  console.log('\nTIP: Change primary_niche in test() to try: motivation, finance, beauty, travel, hairgrowth, yoga...');
}

if (require.main === module) { test().catch(console.error); }

module.exports = { findBrands, getCreatorTier };