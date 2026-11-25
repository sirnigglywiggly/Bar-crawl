// Birthday Quest · the secret route. Served only to the host (PARTY_ADMIN_KEY), or to everyone once the host
// taps REVEAL, or automatically when the quest starts (Sat Nov 28 2026, 7:00 PM New York). Keep the repo private.
const UNLOCK_AT = Date.UTC(2026, 10, 29, 0, 0); // = Nov 28 19:00 in New York (EST, UTC-5)
const REVEAL_KEY = 'bq:reveal';
function storeConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}
async function redis(cmd) {
  const cfg = storeConfig(); if (!cfg) return null;
  const r = await fetch(cfg.url, { method: 'POST', headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
}

const STOPS = [
 {n:"BAR MADONNA",a:"367 Metropolitan Ave",t:"7:00 PM",lat:40.71420,lon:-73.95568,col:"#ff4fa3",
  note:"SPAWN POINT. Fancy cocktails to start the night. Try the Puttanesca martini.",leg:"NEXT: 5 MIN WALK EAST TO UNION POOL"},
 {n:"UNION POOL",a:"484 Union Ave",t:"7:45 PM",lat:40.71497,lon:-73.95145,col:"#18d6c0",
  note:"Williamsburg classic. Cheap drinks, big backyard, taco truck.",leg:"NEXT: 3 MIN WALK TO ALLIGATOR LOUNGE"},
 {n:"ALLIGATOR LOUNGE",a:"600 Metropolitan Ave",t:"8:30 PM",lat:40.71398,lon:-73.94896,col:"#7bd34a",
  note:"POWER-UP! Free personal pizza with every drink. Eat here. Karaoke in the back.",leg:"NEXT: ~18 MIN WALK, OR L TRAIN LORIMER ST → MONTROSE AV"},
 {n:"SLEEPWALK",a:"251 Bushwick Ave",t:"9:30 PM",lat:40.70733,lon:-73.93954,col:"#8a6bff",
  note:"Welcome to Bushwick. Dark, cozy, great music. Sometimes there's a live set out back.",leg:"NEXT: ~15 MIN WALK, OR A 5 MIN UBER"},
 {n:"YOURS SINCERELY",a:"41 Wilson Ave",t:"10:30 PM",lat:40.70286,lon:-73.92915,col:"#ffb02e",
  note:"Cocktails on tap, served in lab beakers. Small room, so one person orders for the party.",leg:"NEXT: 4 MIN WALK TO THREE DIAMOND DOOR"},
 {n:"THREE DIAMOND DOOR",a:"211 Knickerbocker Ave",t:"11:15 PM",lat:40.70352,lon:-73.92615,col:"#4fc3ff",
  note:"Bushwick dive with a PHOTO BOOTH. Take the birthday photo here! DJs in the back room.",leg:"NEXT: ~10 MIN WALK NORTH TO THE FINAL STAGE"},
 {n:"PACHA NYC",a:"140 Stewart Ave",t:"12:00 AM",lat:40.71053,lon:-73.92630,col:"#ffe14d",boss:true,
  note:"FINAL STAGE! Mathame (melodic techno) on a 2,600-person dancefloor until 4 AM. 21+. Have your ticket ready.",leg:"GAME CLEAR. GET HOME SAFE: JEFFERSON ST (L) IS ABOUT A 7 MIN WALK."}
];

const GUIDE = ['WELCOME TO MY CITY! FIRST ROUND AT BAR MADONNA.','UNION POOL: A BROOKLYN CLASSIC. FOLLOW ME!',"FREE PIZZA WITH EVERY DRINK. MAYOR'S ORDERS!",
  'WELCOME TO BUSHWICK! STAY TOGETHER, CREW.','COCKTAILS IN BEAKERS. FOR SCIENCE!','PHOTO BOOTH TIME. EVERYBODY IN!','THE FINAL STAGE! DANCE TILL 4 AM!'];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const q = req.query || {};
  const adminKey = process.env.PARTY_ADMIN_KEY;
  if (req.method === 'POST') { // host: reveal or hide the route for everyone
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (!adminKey || body.admin !== adminKey) return res.status(403).json({ error: 'host-only' });
    try { await redis(body.reveal ? ['SET', REVEAL_KEY, '1'] : ['DEL', REVEAL_KEY]); } catch (e) { return res.status(500).json({ error: 'server-error' }); }
    return res.status(200).json({ revealed: !!body.reveal });
  }
  const host = !!adminKey && typeof q.host === 'string' && q.host === adminKey;
  let revealed = false; try { revealed = (await redis(['GET', REVEAL_KEY])) === '1'; } catch (e) {}
  const open = revealed || Date.now() >= UNLOCK_AT;
  if (!host && !open) return res.status(403).json({ error: q.host ? 'wrong-host-key' : 'locked', unlocksAt: UNLOCK_AT });
  return res.status(200).json({ host, open, revealed, unlocksAt: UNLOCK_AT, stops: STOPS, guide: GUIDE });
};
