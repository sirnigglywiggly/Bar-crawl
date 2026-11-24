// Shared party list for Birthday Quest (Vercel serverless function).
// Storage: Upstash Redis via its REST API. Connect a Redis store to the Vercel project
// and these env vars are added for you: KV_REST_API_URL + KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
// Optional: PARTY_ADMIN_KEY lets the host remove anyone (open map.html?host=YOUR_KEY once).
const crypto = require('crypto');

const KEY = 'bq:party';
const MAX_PLAYERS = 30;

function storeConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(cmd) {
  const cfg = storeConfig();
  const r = await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function cleanPlayer(b) {
  const n = String(b.n || '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N} ._!?'-]/gu, '')
    .trim()
    .slice(0, 10);
  const h = String(b.h || '');
  if (!n || !/^[0-9a-fx]{100}$/.test(h)) return null;
  return { n, h, s: (b.s | 0) & 15, p: (b.p | 0) & 15 };
}

async function listPlayers() {
  const flat = (await redis(['HGETALL', KEY])) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    try { out.push(JSON.parse(flat[i + 1])); } catch (e) { /* skip bad rows */ }
  }
  return out.sort((a, b) => a.t - b.t);
}

const publicView = (p) => ({ id: p.id, n: p.n, h: p.h, s: p.s, p: p.p });

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!storeConfig()) return res.status(503).json({ error: 'storage-not-configured' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    if (req.method === 'GET') {
      return res.status(200).json({ players: (await listPlayers()).map(publicView) });
    }

    if (req.method === 'POST') {
      const player = cleanPlayer(body);
      if (!player) return res.status(400).json({ error: 'bad-player' });
      if ((await listPlayers()).length >= MAX_PLAYERS) return res.status(409).json({ error: 'party-full' });
      const id = crypto.randomBytes(6).toString('hex');
      const token = crypto.randomBytes(16).toString('hex');
      await redis(['HSET', KEY, id, JSON.stringify({ id, token, t: Date.now(), ...player })]);
      return res.status(201).json({ id, token, player: publicView({ id, ...player }) });
    }

    if (req.method === 'PUT' || req.method === 'DELETE') {
      const id = String(body.id || '');
      const raw = await redis(['HGET', KEY, id]);
      if (!raw) return res.status(404).json({ error: 'not-found' });
      const current = JSON.parse(raw);
      const adminKey = process.env.PARTY_ADMIN_KEY;
      const allowed = (body.token && body.token === current.token) || (adminKey && body.admin === adminKey);
      if (!allowed) return res.status(403).json({ error: 'not-yours' });

      if (req.method === 'DELETE') {
        await redis(['HDEL', KEY, id]);
        return res.status(200).json({ ok: true });
      }
      const player = cleanPlayer(body);
      if (!player) return res.status(400).json({ error: 'bad-player' });
      await redis(['HSET', KEY, id, JSON.stringify({ ...current, ...player })]);
      return res.status(200).json({ player: publicView({ id, ...player }) });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'server-error' });
  }
};
