// Drink log for Birthday Quest: every player can log what they drank at each bar.
// GET  -> { drinks: [{ id, pid, stop, type, label, t }] }
// POST { pid, token | admin, stop, type, label } -> logs one drink for that player ("rider" = host only)
const crypto = require('crypto');

const PARTY_KEY = 'bq:party';
const DRINKS_KEY = 'bq:drinks';
const TYPES = ['beer', 'cocktail', 'shot', 'wine', 'water', 'other'];
const MAX_PER_PLAYER = 40;

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
async function listDrinks() {
  const flat = (await redis(['HGETALL', DRINKS_KEY])) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) { try { out.push(JSON.parse(flat[i + 1])); } catch (e) { /* skip */ } }
  return out.sort((a, b) => a.t - b.t);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!storeConfig()) return res.status(503).json({ error: 'storage-not-configured' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    if (req.method === 'GET') return res.status(200).json({ drinks: await listDrinks() });

    if (req.method === 'POST') {
      const pid = String(body.pid || '');
      const stop = body.stop | 0;
      const type = TYPES.includes(body.type) ? body.type : null;
      const label = String(body.label || '').toUpperCase().replace(/[^\p{L}\p{N} &'.!-]/gu, '').trim().slice(0, 20);
      if (!pid || !type || stop < 0 || stop > 6) return res.status(400).json({ error: 'bad-drink' });

      const adminKey = process.env.PARTY_ADMIN_KEY;
      const isHost = !!adminKey && body.admin === adminKey;
      if (pid === 'rider') {
        if (!isHost) return res.status(403).json({ error: 'host-only' });
      } else {
        const raw = await redis(['HGET', PARTY_KEY, pid]);
        if (!raw) return res.status(404).json({ error: 'no-such-player' });
        const player = JSON.parse(raw);
        if (!isHost && !(body.token && body.token === player.token)) return res.status(403).json({ error: 'not-yours' });
      }
      const mine = (await listDrinks()).filter((d) => d.pid === pid).length;
      if (mine >= MAX_PER_PLAYER) return res.status(409).json({ error: 'that-is-plenty' });

      const drink = { id: crypto.randomBytes(5).toString('hex'), pid, stop, type, label, t: Date.now() };
      await redis(['HSET', DRINKS_KEY, drink.id, JSON.stringify(drink)]);
      return res.status(201).json({ drink });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'server-error', detail: String(e && e.message || e).slice(0, 100) });
  }
};
