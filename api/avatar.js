// Photo -> 8-bit avatar, designed by Claude (Anthropic Messages API, vision).
// Needs the Vercel env var ANTHROPIC_API_KEY. Optional: ANTHROPIC_MODEL (default claude-sonnet-5-5).
// Uses the party Redis store (if connected) for rate limits so a shared link can't drain your credits.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const API_BASE = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const PER_IP_PER_HOUR = 12;
const PER_DAY_TOTAL = 150;
const PROMPT = `You are a pixel artist making a full-body 8-bit character of the person in this photo, for a birthday party game. The character must clearly look like them: their skin tone, hair colour and hairstyle (or hat), glasses, beard or moustache, and the exact clothes they are wearing (shirt or jacket colour and simple pattern, pants or skirt colour, shoe colour). Do not try to identify who the person is; only draw what you see. If parts of the body are not in the photo, invent clothes that fit the visible style.

Canvas: 16 columns x 24 rows, front-facing, standing.
Palette, one character per pixel:
0 #0d0b1a near-black (use for outlines, eyes)   1 #2a1a10 dark brown/black hair
2 #5a3a22 deep brown skin   3 #8a5a33 brown skin   4 #c98b5e tan skin   5 #f2c9a0 light skin
6 #ffffff white   7 #9aa0b4 grey   8 #e23b4e red   9 #ff7a1a orange   a #ffe14d yellow
b #3ddc84 green   c #18c3ad teal   d #2a6fdb blue   e #8a6bff purple   f #ff4fa3 pink
g #3e5a8c denim   h #c9b27c khaki/beige   i #3a3a48 charcoal   j #5b2f8a dark purple
k #1f6b45 dark green   l #7a1f2b maroon   m #efe3c2 cream   n #a1622e light brown/blond-brown
x = transparent background

Layout guide:
- rows 0-9: head about 10 pixels wide (columns 3-12). Hair or hat on top and sides. Face with 2 clear dark eyes (row 5 or 6), eyebrows if visible, a nose hint, a mouth, glasses or facial hair if present. A 1-pixel near-black outline around the head.
- rows 10-17: torso in the shirt colour (columns 4-11), arms in sleeve colour on columns 2-3 and 12-13, hands in skin colour on row 16-17 of those columns.
- rows 18-21: pants/legs, two legs (columns 4-7 and 8-11) with a 1-pixel gap or darker line between them.
- rows 22-23: shoes in the shoe colour, slightly wider than the legs.
- Outline the whole figure in near-black 0 so it reads on a dark background. Everything else is x.

Reply with ONLY this JSON, no other text:
{"rows":["16 characters", ... exactly 24 strings],"shirt":"<palette char of main shirt colour>","pants":"<palette char of pants colour>"}`;

function parseLook(text) {
  const str = String(text);
  const a = str.indexOf('{'), b = str.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  let j;
  try { j = JSON.parse(str.slice(a, b + 1)); } catch (e) { return null; }
  let rows = Array.isArray(j.rows) ? j.rows : Array.isArray(j.sprite) ? j.sprite : Array.isArray(j.head) ? j.head : null;
  if (!rows) return null;
  rows = rows.slice(0, 24).map((r) => {
    const clean = String(r).toLowerCase().replace(/\s+/g, '').replace(/[^0-9a-nx.]/g, 'x').replace(/\./g, 'x');
    return (clean + 'x'.repeat(16)).slice(0, 16);
  });
  while (rows.length < 24) rows.push('x'.repeat(16));
  const h = rows.join('');
  if (h.replace(/x/g, '').length < 60) return null; // too empty to be a character
  const idx = (v, d) => { const n = parseInt(String(v ?? '').toLowerCase(), 36); return Number.isInteger(n) && n >= 0 && n < 16 ? n : d; };
  let s = idx(j.shirt, 13); if ([2, 3, 4, 5].includes(s)) s = 13;
  return { h, s, p: idx(j.pants, 0) };
}

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


module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ configured: !!process.env.ANTHROPIC_API_KEY, model: MODEL, store: !!storeConfig() });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'method-not-allowed' }); }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ai-not-configured' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const data = String(body.image || '');
    const mediaType = body.type === 'image/png' ? 'image/png' : 'image/jpeg';
    if (!data || data.length > 1_500_000 || !/^[A-Za-z0-9+/=]+$/.test(data)) return res.status(400).json({ error: 'bad-image' });

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (await overLimit(ip)) return res.status(429).json({ error: 'slow-down' });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 55000);
    const ask = async (opts) => {
      const r = await fetch(`${API_BASE}/v1/messages`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: opts.maxTokens,
          ...(opts.noThinking ? { thinking: { type: 'disabled' } } : {}),
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
              { type: 'text', text: PROMPT },
            ],
          }],
        }),
      });
      return { r, j: await r.json().catch(() => ({})) };
    };
    let r, j;
    try {
      // 1st try: no extended thinking, so the whole budget goes to the drawing.
      ({ r, j } = await ask({ maxTokens: 4000, noThinking: true }));
      // If this model/API doesn't accept that option, or it still ran out, retry with a much bigger budget.
      const msg = String(j && j.error && j.error.message || '');
      if ((r.status === 400 && /thinking/i.test(msg)) || (r.ok && j.stop_reason === 'max_tokens')) {
        ({ r, j } = await ask({ maxTokens: 16000, noThinking: false }));
      }
    } catch (e) {
      return res.status(504).json({ error: 'ai-timeout', detail: e.name === 'AbortError' ? 'claude took too long' : String(e.message || e).slice(0, 100) });
    } finally { clearTimeout(timer); }
    if (!r.ok) return res.status(502).json({ error: 'ai-error', detail: [j && j.error && j.error.type, j && j.error && j.error.message].filter(Boolean).join(': ').slice(0, 120) });
    const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    const look = parseLook(text);
    if (!look) return res.status(502).json({ error: 'ai-bad-output', detail: ('stop=' + (j.stop_reason || '?') + ' ' + text.replace(/\s+/g, ' ')).slice(0, 120) });
    return res.status(200).json({ look, model: MODEL });
  } catch (e) {
    return res.status(500).json({ error: 'server-error', detail: String(e && e.message || e).slice(0, 120) });
  }
};
