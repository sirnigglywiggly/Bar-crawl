// Photo -> 8-bit avatar, designed by Claude (Anthropic Messages API, vision).
// Needs the Vercel env var ANTHROPIC_API_KEY. Optional: ANTHROPIC_MODEL (default claude-sonnet-5-5).
// Uses the party Redis store (if connected) for rate limits so a shared link can't drain your credits.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const API_BASE = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const PER_IP_PER_HOUR = 12;
const PER_DAY_TOTAL = 150;
const MASK = new Set([0, 1, 8, 9, 10, 19, 90, 91, 98, 99]);

const PROMPT = `You design tiny 8-bit pixel-art avatars for a birthday party game. Look at the photo and design a front-facing pixel head for the person in it, plus shirt and pants colors.

Capture only what is visible: skin tone, hair colour and style (or a hat), glasses, facial hair, and a friendly expression. Do not try to identify who the person is.

Palette (index: colour): 0 near-black #0d0b1a, 1 dark brown #2a1a10, 2 deep brown skin #5a3a22, 3 brown skin #8a5a33, 4 tan skin #c98b5e, 5 light skin #f2c9a0, 6 white #ffffff, 7 grey #9aa0b4, 8 red #e23b4e, 9 orange #ff7a1a, a yellow #ffe14d, b green #3ddc84, c teal #18c3ad, d blue #2a6fdb, e purple #8a6bff, f pink #ff4fa3.

Grid: 10 rows of 10 characters. Each character is a palette index (0-9, a-f) or x for transparent.
Layout: rows 0-2 hair or hat; face in rows 2-8, columns 1-8; eyes on row 5 (e.g. columns 3 and 6); mouth on row 7; neck on row 9, columns 4-5. Hair can frame the face down the sides for long hair. These cells must be x: row 0 columns 0,1,8,9; row 1 columns 0,9; row 9 columns 0,1,8,9. Leave everything outside the head silhouette as x. Keep it bold, cute and readable, with clear eyes.
Pick shirt and pants colours that match what the person wears (shirt must not be a skin tone).
If there is no person in the photo, make a fun creature head inspired by the main subject.

Reply with only JSON, no other text: {"head":["10 chars", ... 10 rows],"shirt":<0-15>,"pants":<0-15>}`;

function storeConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}
async function redis(cmd) {
  const cfg = storeConfig();
  const r = await fetch(cfg.url, { method: 'POST', headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
async function overLimit(ip) {
  if (!storeConfig()) return false; // no store connected: no rate limit available
  const hourKey = `bq:av:ip:${ip}:${new Date().toISOString().slice(0, 13)}`;
  const dayKey = `bq:av:day:${new Date().toISOString().slice(0, 10)}`;
  const perIp = await redis(['INCR', hourKey]);
  if (perIp === 1) await redis(['EXPIRE', hourKey, 3700]);
  const total = await redis(['INCR', dayKey]);
  if (total === 1) await redis(['EXPIRE', dayKey, 90000]);
  return perIp > PER_IP_PER_HOUR || total > PER_DAY_TOTAL;
}

function parseLook(text) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  let j;
  try { j = JSON.parse(m[0]); } catch (e) { return null; }
  if (!Array.isArray(j.head) || j.head.length !== 10) return null;
  const rows = j.head.map((r) => String(r).toLowerCase());
  if (!rows.every((r) => /^[0-9a-fx]{10}$/.test(r))) return null;
  const cells = rows.join('').split('').map((c, i) => (MASK.has(i) ? 'x' : c));
  const shirt = Number.isInteger(+j.shirt) ? +j.shirt & 15 : 13;
  const pants = Number.isInteger(+j.pants) ? +j.pants & 15 : 0;
  return { h: cells.join(''), s: [2, 3, 4, 5].includes(shirt) ? 13 : shirt, p: pants };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method-not-allowed' }); }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ai-not-configured' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const data = String(body.image || '');
    const mediaType = body.type === 'image/png' ? 'image/png' : 'image/jpeg';
    if (!data || data.length > 1_500_000 || !/^[A-Za-z0-9+/=]+$/.test(data)) return res.status(400).json({ error: 'bad-image' });

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (await overLimit(ip)) return res.status(429).json({ error: 'slow-down' });

    const r = await fetch(`${API_BASE}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'ai-error', detail: j && j.error && j.error.type });
    const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    const look = parseLook(text);
    if (!look) return res.status(502).json({ error: 'ai-bad-output' });
    return res.status(200).json({ look, model: MODEL });
  } catch (e) {
    return res.status(500).json({ error: 'server-error' });
  }
};
