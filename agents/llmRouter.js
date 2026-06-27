// ============================================================
// agents/llmRouter.js
// Groq primary + OpenRouter fallback
// Models updated May 2026 — decommissioned models removed
// ============================================================

require('dotenv').config({ path: '../.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY       = process.env.GROQ_API_KEY;

// ============================================================
// CURRENT WORKING MODELS (verified May 2026)
// ============================================================
const MODELS = {
  groq: [
    'llama-3.3-70b-versatile',         // best quality — primary
    'llama-3.1-8b-instant',             // fast — first fallback
    'meta-llama/llama-4-scout-17b-16e-instruct', // Llama 4 — second fallback
    'qwen-qwq-32b',                     // Qwen reasoning — third fallback
  ],
  openrouter: [
    'openrouter/auto',                  // OpenRouter auto-router — picks best free model automatically
    'deepseek/deepseek-chat-v3-0324:free', // DeepSeek V3 — excellent quality
    'deepseek/deepseek-r1:free',        // DeepSeek R1 — reasoning model
    'meta-llama/llama-3.3-70b-instruct:free', // Llama 3.3
    'qwen/qwen3-8b:free',               // Qwen3 — fast and capable
  ],
  urls: {
    groq:       'https://api.groq.com/openai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  },
};

// ============================================================
// CORE FUNCTION
// Tries all Groq models first, then OpenRouter models
// ============================================================
async function callLLM({
  systemPrompt,
  userPrompt,
  maxTokens   = 1000,
  temperature = 0.7,
  jsonMode    = false,
}) {
  // --- Try each Groq model ---
  for (const model of MODELS.groq) {
    try {
      const result = await callGroq({ systemPrompt, userPrompt, maxTokens, temperature, jsonMode, model });
      console.log(`[LLMRouter] ✅ Groq success (${model})`);
      return result;
    } catch (err) {
      const isRateLimit   = err.message.includes('429') || err.message.includes('rate_limit');
      const isDecommissioned = err.message.includes('decommissioned') || err.message.includes('model_decommissioned');
      const isUnavailable = err.message.includes('503') || err.message.includes('unavailable');

      if (isRateLimit || isDecommissioned || isUnavailable) {
        console.warn(`[LLMRouter] ⚠️ Groq ${model} unavailable — trying next`);
        continue;
      }
      console.warn(`[LLMRouter] ⚠️ Groq ${model} failed:`, err.message);
    }
  }

  console.warn('[LLMRouter] ⚠️ All Groq models failed — switching to OpenRouter');

  // --- Try each OpenRouter model ---
  for (const model of MODELS.openrouter) {
    try {
      const result = await callOpenRouter({ systemPrompt, userPrompt, maxTokens, temperature, jsonMode, model });
      console.log(`[LLMRouter] ✅ OpenRouter success (${model})`);
      return result;
    } catch (err) {
      const is404 = err.message.includes('404') || err.message.includes('No endpoints');
      const is429 = err.message.includes('429');
      if (is404 || is429) {
        console.warn(`[LLMRouter] ⚠️ OpenRouter ${model} unavailable — trying next`);
        continue;
      }
      console.warn(`[LLMRouter] ⚠️ OpenRouter ${model} failed:`, err.message);
    }
  }

  throw new Error(
    'All LLM providers exhausted. Groq daily limit may be reached (resets midnight UTC / 5:30 AM IST). ' +
    'Try again later or tomorrow.'
  );
}

// ============================================================
// GROQ CALLER
// ============================================================
async function callGroq({ systemPrompt, userPrompt, maxTokens, temperature, jsonMode, model }) {
  const body = {
    model,
    max_tokens:  maxTokens,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const response = await fetchWithTimeout(MODELS.urls.groq, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  }, 20000);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned empty response');
  return jsonMode ? safeParseJSON(text) : text;
}

// ============================================================
// OPENROUTER CALLER
// ============================================================
async function callOpenRouter({ systemPrompt, userPrompt, maxTokens, temperature, jsonMode, model }) {
  const body = {
    model,
    max_tokens:  maxTokens,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const response = await fetchWithTimeout(MODELS.urls.openrouter, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer':  'https://sponsorship-prospector.app',
      'X-Title':       'Sponsorship Prospector',
    },
    body: JSON.stringify(body),
  }, 30000);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter returned empty response');
  return jsonMode ? safeParseJSON(text) : text;
}

// ============================================================
// HELPERS
// ============================================================
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error(`Request timed out after ${timeoutMs}ms`);
    throw err;
  }
}

function safeParseJSON(text) {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    console.error('[LLMRouter] Failed to parse JSON:', text.slice(0, 200));
    throw new Error('LLM returned invalid JSON');
  }
}

// ============================================================
// TEST — node agents/llmRouter.js
// ============================================================
async function test() {
  console.log('[LLMRouter] Testing with updated 2026 models...\n');
  const result = await callLLM({
    systemPrompt: 'You are a helpful assistant. Always respond in plain text.',
    userPrompt:   'Say exactly: "LLM Router is working perfectly."',
    maxTokens:    50,
    temperature:  0,
  });
  console.log('[LLMRouter] Response:', result);
  console.log('\n✅ LLM Router ready.');
}

if (require.main === module) {
  test().catch(console.error);
}

module.exports = { callLLM };