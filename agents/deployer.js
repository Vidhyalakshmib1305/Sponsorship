// ============================================================
// agents/deployer.js
// Auto-deploys pitch pages to Render via GitHub + Render API
// Creator gets a live URL automatically — zero manual steps
//
// HOW IT WORKS:
// 1. Generates pitch page HTML (from pitchPageBuilder.js)
// 2. Pushes HTML to GitHub repo via GitHub API
// 3. Render auto-deploys from GitHub on every push
// 4. Returns the live Render URL to the creator
//
// SETUP (one-time, done by you):
// - Create a GitHub repo: github.com/yourname/sponsorship-pitches
// - Create a Render static site connected to that repo
// - Add GITHUB_TOKEN and RENDER_API_KEY to your .env
// ============================================================

require('dotenv').config({ path: '../.env' });
const https = require('https');

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_OWNER  = process.env.GITHUB_OWNER;   // your github username
const GITHUB_REPO   = process.env.GITHUB_REPO;    // e.g. 'sponsorship-pitches'
const RENDER_API_KEY = process.env.RENDER_API_KEY;
const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID;

// ============================================================
// MAIN — deploy a pitch page and return the live URL
// ============================================================
async function deployPitchPage(pitchHTML, creator, brand) {
  console.log(`\n[Deployer] 🚀 Deploying pitch page...`);
  console.log(`[Deployer] Creator: @${creator.instagram_handle}`);
  console.log(`[Deployer] Brand: ${brand.name}`);

  const filename = generateFilename(creator, brand);
  const livePath = `pitches/${filename}/index.html`;

  try {
    // Step 1 — Push to GitHub
    console.log(`[Deployer] 📤 Pushing to GitHub...`);
    await pushToGitHub(livePath, pitchHTML);
    console.log(`[Deployer] ✅ GitHub push successful`);

    // Step 2 — Trigger Render deploy
    console.log(`[Deployer] 🔄 Triggering Render deploy...`);
    await triggerRenderDeploy();
    console.log(`[Deployer] ✅ Render deploy triggered`);

    // Step 3 — Wait for deploy and return URL
    console.log(`[Deployer] ⏳ Waiting for deploy (30s)...`);
    await sleep(30000); // Render static sites usually deploy in ~20-30s

    const liveUrl = await getRenderUrl(filename);
    console.log(`[Deployer] 🌐 Live URL: ${liveUrl}`);

    return {
      success:  true,
      url:      liveUrl,
      filename,
      deployed_at: new Date().toISOString(),
    };

  } catch (err) {
    console.error(`[Deployer] ❌ Deploy failed:`, err.message);
    return {
      success: false,
      error:   err.message,
    };
  }
}

// ============================================================
// GITHUB — push file to repo
// ============================================================
async function pushToGitHub(filePath, content) {
  // Check if file already exists (need its SHA for updates)
  let sha = null;
  try {
    const existing = await githubRequest('GET', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`);
    sha = existing.sha;
  } catch {
    // File doesn't exist yet — that's fine
  }

  const body = {
    message: `Deploy pitch page: ${filePath}`,
    content: Buffer.from(content).toString('base64'),
    ...(sha && { sha }), // include SHA only for updates
  };

  await githubRequest('PUT', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, body);
}

// ============================================================
// RENDER — trigger a new deploy
// ============================================================
async function triggerRenderDeploy() {
  return renderRequest('POST', `/v1/services/${RENDER_SERVICE_ID}/deploys`, {
    clearCache: 'do_not_clear',
  });
}

// ============================================================
// GET RENDER URL
// ============================================================
async function getRenderUrl(filename) {
  const service = await renderRequest('GET', `/v1/services/${RENDER_SERVICE_ID}`);
  const baseUrl = service.service?.serviceDetails?.url || `https://${GITHUB_REPO}.onrender.com`;
  return `${baseUrl}/pitches/${filename}/`;
}

// ============================================================
// GENERATE UNIQUE FILENAME
// ============================================================
function generateFilename(creator, brand) {
  const handle = creator.instagram_handle?.replace('@', '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const brandName = brand.name?.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const timestamp = Date.now().toString(36); // short timestamp
  return `${handle}-x-${brandName}-${timestamp}`;
}

// ============================================================
// HTTP HELPERS
// ============================================================
function githubRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent':    'SponsorshipProspector/1.0',
        'Accept':        'application/vnd.github.v3+json',
        'Content-Type':  'application/json',
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(`GitHub ${res.statusCode}: ${parsed.message}`));
          else resolve(parsed);
        } catch { resolve(data); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function renderRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// SETUP GUIDE — run this to verify your credentials
// node agents/deployer.js
// ============================================================
async function testSetup() {
  console.log('\n[Deployer] Testing setup...\n');

  const checks = [
    { key: 'GITHUB_TOKEN',      val: GITHUB_TOKEN,       label: 'GitHub Token' },
    { key: 'GITHUB_OWNER',      val: GITHUB_OWNER,       label: 'GitHub Owner' },
    { key: 'GITHUB_REPO',       val: GITHUB_REPO,        label: 'GitHub Repo' },
    { key: 'RENDER_API_KEY',    val: RENDER_API_KEY,     label: 'Render API Key' },
    { key: 'RENDER_SERVICE_ID', val: RENDER_SERVICE_ID,  label: 'Render Service ID' },
  ];

  let allGood = true;
  checks.forEach(c => {
    if (c.val && c.val !== 'add_later') {
      console.log(`  ✅ ${c.label}: configured`);
    } else {
      console.log(`  ❌ ${c.label}: MISSING — add to .env`);
      allGood = false;
    }
  });

  if (allGood) {
    console.log('\n✅ All credentials configured. Testing GitHub connection...\n');
    try {
      const repo = await githubRequest('GET', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}`);
      console.log(`✅ GitHub repo found: ${repo.full_name}`);
      console.log(`✅ Deployer is ready!\n`);
    } catch (err) {
      console.error(`❌ GitHub connection failed: ${err.message}`);
    }
  } else {
    console.log('\n⚠️  Fix the missing credentials above, then run this again.\n');
    console.log('SETUP GUIDE:');
    console.log('  1. Go to github.com → Settings → Developer Settings → Personal Access Tokens');
    console.log('     Create a token with "repo" scope → add as GITHUB_TOKEN in .env');
    console.log('  2. Create a GitHub repo called "sponsorship-pitches" (public)');
    console.log('     Add your username as GITHUB_OWNER, repo name as GITHUB_REPO');
    console.log('  3. Go to render.com → New Static Site → Connect the GitHub repo');
    console.log('     Publish directory: (leave empty, serves from root)');
    console.log('  4. Go to render.com → Account Settings → API Keys → Create key');
    console.log('     Add as RENDER_API_KEY in .env');
    console.log('  5. Copy the Service ID from your Render service URL');
    console.log('     (looks like srv-xxxxx) → add as RENDER_SERVICE_ID in .env');
  }
}

if (require.main === module) { testSetup().catch(console.error); }

module.exports = { deployPitchPage };