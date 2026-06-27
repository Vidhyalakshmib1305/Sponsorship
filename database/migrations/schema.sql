-- ============================================================
-- SPONSORSHIP PROSPECTOR — Supabase Database Schema
-- File: database/schema.sql
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- ============================================================
-- 1. USERS
-- Managed by Supabase Auth — we just extend it
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'standard', 'pro')),
  stripe_customer_id  TEXT UNIQUE,
  subscription_id     TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive' CHECK (
    subscription_status IN ('active','inactive','cancelled','past_due')
  ),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. CREATOR PROFILES
-- Extended info about the creator's social presence
-- ============================================================
CREATE TABLE public.creators (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Platform info
  instagram_handle  TEXT,
  instagram_followers INTEGER DEFAULT 0,
  instagram_engagement_rate DECIMAL(5,2) DEFAULT 0,

  youtube_handle    TEXT,
  youtube_subscribers INTEGER DEFAULT 0,

  tiktok_handle     TEXT,
  tiktok_followers  INTEGER DEFAULT 0,

  -- Niche & audience
  primary_niche     TEXT NOT NULL,     -- e.g. "fitness", "tech", "fashion"
  secondary_niches  TEXT[],            -- array of other niches
  audience_location TEXT DEFAULT 'India',
  audience_age_range TEXT DEFAULT '18-34',
  content_language  TEXT DEFAULT 'English',

  -- Pricing
  base_rate_per_post  DECIMAL(10,2) DEFAULT 0,  -- in USD
  base_rate_per_reel  DECIMAL(10,2) DEFAULT 0,
  base_rate_per_story DECIMAL(10,2) DEFAULT 0,

  -- Agent config
  last_scan_at  TIMESTAMPTZ,
  scan_count    INTEGER DEFAULT 0,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================================
-- 3. BRANDS
-- Discovered brands from agent scans
-- ============================================================
CREATE TABLE public.brands (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name            TEXT NOT NULL,
  website         TEXT,
  industry        TEXT,
  description     TEXT,

  -- Contact info found by agent
  marketing_email   TEXT,
  contact_name      TEXT,
  linkedin_url      TEXT,

  -- Sponsorship intelligence
  known_to_sponsor  BOOLEAN DEFAULT FALSE,
  avg_deal_size_usd DECIMAL(10,2),
  sponsorship_proof TEXT[],  -- URLs proving they sponsor creators
  niches_they_target TEXT[],

  -- Agent metadata
  discovered_at   TIMESTAMPTZ DEFAULT NOW(),
  last_verified   TIMESTAMPTZ,
  source          TEXT,  -- where agent found this brand

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(name, website)
);

-- ============================================================
-- 4. BRAND LEADS
-- Matched brands for a specific creator — the core table
-- ============================================================
CREATE TABLE public.brand_leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  brand_id        UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,

  -- AI scoring
  fit_score       INTEGER CHECK (fit_score BETWEEN 0 AND 100),
  niche_match     INTEGER CHECK (niche_match BETWEEN 0 AND 100),
  audience_match  INTEGER CHECK (audience_match BETWEEN 0 AND 100),
  budget_estimate DECIMAL(10,2),

  -- Scoring reasoning from LLM
  score_reasoning TEXT,

  -- Status tracking
  status          TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new','pitched','opened','replied','negotiating','won','lost','ignored')
  ),

  -- Pitch
  pitch_subject   TEXT,
  pitch_body      TEXT,
  pitched_at      TIMESTAMPTZ,
  replied_at      TIMESTAMPTZ,

  -- Deal outcome
  deal_value      DECIMAL(10,2),
  deal_notes      TEXT,
  closed_at       TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(creator_id, brand_id)
);

-- ============================================================
-- 5. PITCHES
-- Full history of every pitch sent
-- ============================================================
CREATE TABLE public.pitches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id         UUID NOT NULL REFERENCES public.brand_leads(id) ON DELETE CASCADE,
  creator_id      UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,

  -- Email content
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  version         INTEGER DEFAULT 1,   -- for A/B tracking

  -- LLM metadata
  model_used      TEXT,   -- which LLM generated this
  prompt_tokens   INTEGER,
  generated_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Delivery
  sent_at         TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'draft' CHECK (
    delivery_status IN ('draft','sent','delivered','opened','bounced')
  ),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. AGENT RUNS
-- Log every time the AI agent runs — for debugging & billing
-- ============================================================
CREATE TABLE public.agent_runs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,

  run_type        TEXT NOT NULL CHECK (
    run_type IN ('brand_scan','scoring','pitch_generation','full_pipeline')
  ),
  status          TEXT NOT NULL DEFAULT 'running' CHECK (
    status IN ('running','completed','failed','timeout')
  ),

  -- Results
  brands_found    INTEGER DEFAULT 0,
  brands_scored   INTEGER DEFAULT 0,
  pitches_written INTEGER DEFAULT 0,

  -- Performance
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER,

  -- LLM usage tracking
  total_tokens    INTEGER DEFAULT 0,
  model_used      TEXT,

  error_message   TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. SUBSCRIPTIONS LOG
-- Track Stripe events for billing history
-- ============================================================
CREATE TABLE public.subscription_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  stripe_event_id TEXT UNIQUE,
  event_type      TEXT NOT NULL,  -- 'checkout.completed', 'invoice.paid', etc
  amount_usd      DECIMAL(10,2),
  plan            TEXT,
  status          TEXT,

  raw_payload     JSONB,  -- full Stripe webhook payload
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. NOTIFICATIONS
-- In-app alerts for creators
-- ============================================================
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  type        TEXT NOT NULL CHECK (
    type IN ('lead_found','pitch_sent','reply_received','deal_won','scan_complete','system')
  ),
  title       TEXT NOT NULL,
  message     TEXT,
  read        BOOLEAN DEFAULT FALSE,
  action_url  TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — for fast queries
-- ============================================================
CREATE INDEX idx_creators_user_id         ON public.creators(user_id);
CREATE INDEX idx_brand_leads_creator_id   ON public.brand_leads(creator_id);
CREATE INDEX idx_brand_leads_status       ON public.brand_leads(status);
CREATE INDEX idx_brand_leads_fit_score    ON public.brand_leads(fit_score DESC);
CREATE INDEX idx_pitches_lead_id          ON public.pitches(lead_id);
CREATE INDEX idx_agent_runs_creator_id    ON public.agent_runs(creator_id);
CREATE INDEX idx_notifications_user_id    ON public.notifications(user_id, read);
CREATE INDEX idx_brands_niches            ON public.brands USING GIN(niches_they_target);
CREATE INDEX idx_creators_niche           ON public.creators(primary_niche);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Critical — users can ONLY see their own data
-- ============================================================
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands             ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own
CREATE POLICY "users_own_profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Creators: users see only their own
CREATE POLICY "users_own_creator" ON public.creators
  FOR ALL USING (auth.uid() = user_id);

-- Brand leads: users see only their own via creator
CREATE POLICY "users_own_leads" ON public.brand_leads
  FOR ALL USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- Pitches: same pattern
CREATE POLICY "users_own_pitches" ON public.pitches
  FOR ALL USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- Agent runs: same pattern
CREATE POLICY "users_own_agent_runs" ON public.agent_runs
  FOR ALL USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- Notifications: users see only theirs
CREATE POLICY "users_own_notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Subscription events: users see only theirs
CREATE POLICY "users_own_subscriptions" ON public.subscription_events
  FOR ALL USING (auth.uid() = user_id);

-- Brands: everyone can read (shared intelligence), only service role can write
CREATE POLICY "brands_public_read" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "brands_service_write" ON public.brands
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "brands_service_update" ON public.brands
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================
-- AUTO-UPDATE updated_at TIMESTAMPS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_creators_updated
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_brand_leads_updated
  BEFORE UPDATE ON public.brand_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE on signup
-- Fires whenever a new user signs up via Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA — sample brands for testing
-- ============================================================
INSERT INTO public.brands (name, website, industry, niches_they_target, known_to_sponsor, avg_deal_size_usd)
VALUES
  ('boAt Lifestyle',    'boat-lifestyle.com',   'Electronics',  ARRAY['tech','music','fitness'],       TRUE, 800),
  ('Mamaearth',         'mamaearth.in',         'Beauty',       ARRAY['beauty','skincare','lifestyle'], TRUE, 600),
  ('Noise',             'gonoise.com',           'Electronics',  ARRAY['tech','fitness','lifestyle'],   TRUE, 700),
  ('Nykaa',             'nykaa.com',             'Beauty',       ARRAY['beauty','fashion','lifestyle'], TRUE, 1200),
  ('Lenskart',          'lenskart.com',          'Eyewear',      ARRAY['lifestyle','tech','fashion'],   TRUE, 900),
  ('SUGAR Cosmetics',   'sugarcosmetics.com',    'Beauty',       ARRAY['beauty','fashion'],             TRUE, 500),
  ('Bombay Shaving',    'bombayshavingcompany.com','Grooming',   ARRAY['lifestyle','grooming','men'],   TRUE, 450),
  ('WOW Skin Science',  'wowskinsci.com',        'Skincare',     ARRAY['skincare','beauty','wellness'], TRUE, 550);

-- Done! Your database is ready.
-- Next step: run this in Supabase SQL Editor at supabase.com