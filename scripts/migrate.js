// scripts/migrate.js
// Run Supabase schema migrations + create storage bucket
// Usage: node scripts/migrate.js

require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const headers = {
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type':  'application/json',
};

// All SQL migrations to run
const MIGRATIONS = [
  // pitches table
  'ALTER TABLE pitches ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)',
  'ALTER TABLE pitches ADD COLUMN IF NOT EXISTS pitch_page_url TEXT',
  'ALTER TABLE pitches ADD COLUMN IF NOT EXISTS brand_email TEXT',
  'ALTER TABLE pitches ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0',
  'ALTER TABLE pitches ADD COLUMN IF NOT EXISTS view_token TEXT',

  // brand_leads table
  'ALTER TABLE brand_leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)',
  'ALTER TABLE brand_leads ADD COLUMN IF NOT EXISTS score_reasoning TEXT',
  'ALTER TABLE brand_leads ADD COLUMN IF NOT EXISTS reply_likelihood TEXT',

  // creators table
  'ALTER TABLE creators ADD COLUMN IF NOT EXISTS post_images TEXT[] DEFAULT \'{}\'',
  'ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_photo_url TEXT',
  'ALTER TABLE creators ADD COLUMN IF NOT EXISTS content_style TEXT',
  'ALTER TABLE creators ADD COLUMN IF NOT EXISTS audience_income TEXT',
  'ALTER TABLE creators ADD COLUMN IF NOT EXISTS contact_email TEXT',
  'ALTER TABLE creators ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT \'free\'',
];

async function runMigrations() {
  console.log('\n' + '═'.repeat(55));
  console.log('SUPABASE SCHEMA MIGRATIONS');
  console.log('═'.repeat(55));
  console.log(`Project: ${SUPABASE_URL}\n`);

  let passed = 0, failed = 0;

  for (const sql of MIGRATIONS) {
    const short = sql.slice(0, 70) + (sql.length > 70 ? '...' : '');
    try {
      // Try Supabase Management API
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method:  'POST',
        headers,
        body: JSON.stringify({ query: sql }),
      });

      if (res.ok) {
        console.log(`  ✅ ${short}`);
        passed++;
      } else {
        // Try alternate Management API endpoint
        const res2 = await fetch(`https://api.supabase.com/v1/projects/${extractRef(SUPABASE_URL)}/database/query`, {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: sql }),
        });
        if (res2.ok) {
          console.log(`  ✅ ${short}`);
          passed++;
        } else {
          const err = await res.text();
          console.log(`  ⚠️  ${short}`);
          console.log(`     → ${err.slice(0, 120)}`);
          failed++;
        }
      }
    } catch (err) {
      console.log(`  ⚠️  ${short}`);
      console.log(`     → ${err.message}`);
      failed++;
    }
  }

  console.log(`\nMigrations: ${passed} ok, ${failed} need manual run`);

  if (failed > 0) {
    console.log('\n─── RUN THESE IN SUPABASE DASHBOARD → SQL EDITOR ───\n');
    MIGRATIONS.forEach(sql => console.log(sql + ';'));
    console.log('\n─────────────────────────────────────────────────────');
  }
}

async function createStorageBucket() {
  console.log('\n' + '═'.repeat(55));
  console.log('CREATING STORAGE BUCKET: creator-media');
  console.log('═'.repeat(55));

  try {
    // Check if bucket already exists
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers });
    if (listRes.ok) {
      const buckets = await listRes.json();
      if (buckets.find && buckets.find(b => b.id === 'creator-media')) {
        console.log('  ✅ Bucket "creator-media" already exists');
        return;
      }
    }

    // Create bucket
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method:  'POST',
      headers,
      body: JSON.stringify({
        id:     'creator-media',
        name:   'creator-media',
        public: true,
        allowed_mime_types: ['image/jpeg','image/png','image/webp','image/gif'],
        file_size_limit: 5242880, // 5MB
      }),
    });

    if (res.ok) {
      console.log('  ✅ Bucket "creator-media" created successfully (public)');
    } else {
      const err = await res.text();
      if (err.includes('already exists') || err.includes('Duplicate')) {
        console.log('  ✅ Bucket "creator-media" already exists');
      } else {
        console.log(`  ❌ Bucket creation failed: ${err.slice(0, 200)}`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Bucket creation error: ${err.message}`);
  }
}

function extractRef(url) {
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : '';
}

async function main() {
  await runMigrations();
  await createStorageBucket();
  console.log('\nDone.\n');
}

main().catch(console.error);
