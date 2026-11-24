/* Birthday Quest · pixel New York landmarks for the skylines.
   Each function draws one building standing on `base` (ground y), centred on `cx`, in logical pixels. */
const NYC = (() => {
  const DARK = '#2a2160', EDGE = '#3c3180', LIT = '#ffd75e', DIM = '#3b2f6e', STEEL = '#d9dbe8', STEEL_D = '#8f94ad';
  const R = Math.round;
  const box = (b, cx, y, w, h, c) => { b.fillStyle = c; b.fillRect(R(cx - w / 2), y, w, h); };
  function windows(b, x, y, w, h, seed, t, stepX, stepY) {
    for (let wy = y + 2; wy < y + h - 1; wy += stepY || 3) for (let wx = x + 1; wx < x + w - 1; wx += stepX || 2) {
      const r = ((wx * 73856093) ^ (wy * 19349663) ^ seed) >>> 0;
      const on = r % 100 < 40 && (r + Math.floor(t)) % 37 !== 0;
      b.fillStyle = on ? LIT : DIM; b.fillRect(wx, wy, 1, 1);
    }
  }

  // Empire State Building: setbacks, colour-changing crown, mast
  function empire(b, cx, base, t) {
    const tiers = [[18, 36], [14, 14], [12, 8], [10, 6], [8, 5], [6, 4], [4, 6]];
    let y = base;
    tiers.forEach(([w, h], i) => { y -= h; box(b, cx, y, w, h, DARK); b.fillStyle = EDGE; b.fillRect(R(cx - w / 2), y, 1, h); windows(b, R(cx - w / 2), y, w, h, 11 + i, t); });
    const crown = ['#e23b4e', '#ffffff', '#2a6fdb', '#ff4fa3', '#3ddc84'][Math.floor(t / 2.5) % 5];
    b.fillStyle = crown; b.fillRect(R(cx - 2), y, 4, 3); b.fillRect(R(cx - 1), y - 3, 2, 3);
    b.fillStyle = STEEL; b.fillRect(R(cx), y - 15, 1, 12);
    b.fillStyle = Math.floor(t * 2) % 2 ? '#ff3b3b' : '#5a1a1a'; b.fillRect(R(cx), y - 16, 1, 1);
  }

  // Chrysler Building: shaft + stepped steel crown with lit sunburst windows + spire
  function chrysler(b, cx, base, t) {
    let y = base - 46; box(b, cx, y, 12, 46, DARK); b.fillStyle = EDGE; b.fillRect(R(cx - 6), y, 1, 46); windows(b, R(cx - 6), y, 12, 46, 23, t);
    b.fillStyle = STEEL_D; b.fillRect(R(cx - 6), y, 12, 1);
    [12, 10, 8, 6, 4].forEach((w, i) => {
      y -= 4;
      box(b, cx, y + 1, w, 3, STEEL); box(b, cx, y, w - 2, 1, STEEL);            // arched tier
      b.fillStyle = STEEL_D; b.fillRect(R(cx - w / 2), y + 3, w, 1);
      b.fillStyle = (Math.floor(t * 3) + i) % 4 ? LIT : '#fff3c4';                // triangular sunburst windows
      for (let k = R(cx - w / 2) + 1; k < R(cx + w / 2) - 1; k += 2) b.fillRect(k, y + 2, 1, 1);
    });
    b.fillStyle = STEEL; b.fillRect(R(cx), y - 12, 1, 12); b.fillRect(R(cx - 1), y - 2, 3, 2);
  }

  // One World Trade Center: tapering glass obelisk + spire
  function oneWTC(b, cx, base, t) {
    const H = 84;
    for (let i = 0; i < H; i++) {
      const y = base - i, w = R(16 - 9 * (i / H)), x = R(cx - w / 2);
      b.fillStyle = i < 12 ? '#26244a' : '#2d4473'; b.fillRect(x, y, w, 1);
      b.fillStyle = '#4f78b8'; b.fillRect(x + R((w - 1) * (i / H)), y, 1, 1);           // diagonal facet glint
      b.fillStyle = '#4060a0'; b.fillRect(x + w - 1 - R((w - 1) * (i / H)), y, 1, 1);
      if ((i + Math.floor(t * 6)) % 14 === 0) { b.fillStyle = 'rgba(143,176,232,.55)'; b.fillRect(x, y, w, 1); } // light sweep
    }
    const top = base - H; b.fillStyle = STEEL; b.fillRect(R(cx - 2), top - 2, 4, 2); b.fillRect(R(cx), top - 20, 1, 18);
    b.fillStyle = Math.floor(t * 1.5) % 2 ? '#ffffff' : '#9aa0b4'; b.fillRect(R(cx), top - 21, 1, 1);
  }

  // 432 Park Avenue: super-thin grid tower
  function park432(b, cx, base, t) {
    const w = 6, h = 74, x = R(cx - w / 2), y = base - h; b.fillStyle = '#e8e4d8'; b.fillRect(x, y, w, h);
    for (let wy = y + 1; wy < base - 1; wy += 2) for (let wx = x + 1; wx < x + w - 1; wx += 2) {
      const r = ((wx * 91) ^ (wy * 7919)) >>> 0; b.fillStyle = r % 100 < 45 && (r + Math.floor(t)) % 29 ? LIT : '#2a2160'; b.fillRect(wx, wy, 1, 1);
    }
  }

  // Brooklyn Bridge tower: stone with two pointed Gothic arches
  function bridgeTower(b, cx, deck) {
    const w = 10, h = 26, x = R(cx - w / 2), y = deck - h + 2;
    b.fillStyle = '#9c8a6c'; b.fillRect(x, y, w, h); b.fillStyle = '#7d6c52'; b.fillRect(x, y, w, 2); b.fillRect(x + w - 1, y, 1, h);
    b.fillStyle = '#12224f';
    for (const ax of [x + 2, x + 6]) { b.fillRect(ax, y + 9, 2, 12); b.fillRect(ax, y + 8, 1, 1); b.fillRect(ax + 1, y + 7, 1, 2); }
  }

  return { empire, chrysler, oneWTC, park432, bridgeTower };
})();
