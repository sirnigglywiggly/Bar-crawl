/* Birthday Quest · original chiptune soundtrack.
   Every melody here was written for this site. Three channels: square lead, triangle bass, noise drums.
   Music starts on the first tap (browsers block autoplay) and can be switched off with the 🎵 button. */
const BQMusic = (() => {
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const midi = (n) => { const m = n.match(/^([A-G]#?)(\d)$/); return m ? NOTE[m[1]] + (+m[2] + 1) * 12 : null; };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // "A4 - C5 ." : note, '-' holds the previous note one more step, '.' is a rest. 16 steps per bar.
  function parseLine(bars) {
    const toks = bars.join(' ').trim().split(/\s+/), ev = new Array(toks.length).fill(null);
    for (let i = 0; i < toks.length; i++) {
      const m = midi(toks[i]); if (m === null) continue;
      let len = 1; while (toks[i + len] === '-') len++;
      ev[i] = [m, len];
    }
    return ev;
  }
  // bass from chord roots: pattern string of offsets per 16 steps ('0' root, '7' fifth, 'o' octave, '.' rest)
  function bassLine(roots, pattern) {
    const ev = [];
    for (const r of roots) { const base = midi(r); for (const c of pattern) ev.push(c === '.' ? null : [base + (c === 'o' ? 12 : c === '7' ? 7 : c === '3' ? 3 : 0), 1]); }
    return ev;
  }

  const TRACKS = {
    brooklyn: { // "Brooklyn Nights" — invite / lock screen
      bpm: 108, swing: 0,
      lead: parseLine([
        'A4 - C5 - E5 - D5 C5 - - A4 - G4 - A4 -', 'F4 - A4 - C5 - A4 C5 - - D5 - C5 - A4 -',
        'G4 - C5 - E5 - G5 - E5 - D5 - C5 - E5 -', 'D5 - - - B4 - G4 - B4 - D5 - - - . .',
        'E5 - E5 - D5 - C5 - D5 - E5 - - - A4 -', 'F5 - E5 - D5 - C5 - A4 - C5 - - - . .',
        'D5 - D5 - C5 - B4 - G4 - B4 - D5 - G5 -', 'G#5 - - - E5 - - - B4 - D5 - E5 - - -']),
      bass: bassLine(['A2', 'F2', 'C3', 'G2', 'A2', 'F2', 'G2', 'E2'], '0.o.0.o.0.o.0.o.'),
      drums: 'k.h.s.h.kkh.s.hh',
    },
    shuffle: { // "L Train Shuffle" — riding the map
      bpm: 126, swing: 0.18,
      lead: parseLine([
        'C5 . E5 G5 - . E5 . C6 - G5 - E5 . D5 .', 'C5 . E5 A5 - . G5 . E5 - C5 - A4 . B4 .',
        'D5 . F5 A5 - . G5 . F5 - D5 - F5 . E5 .', 'D5 - - . B4 . G4 . A4 . B4 . D5 . F5 .',
        'E5 . G5 C6 - . B5 . G5 - E5 - G5 . A5 .', 'A5 - G5 - E5 - C5 - E5 . D5 . C5 . A4 .',
        'F5 . A5 D6 - . C6 . A5 - F5 - D5 . E5 .', 'G5 - - - F5 - D5 - B4 - G4 - . . . .']),
      bass: bassLine(['C3', 'A2', 'D3', 'G2', 'C3', 'A2', 'D3', 'G2'], '0.7.o.7.0.7.o.7.'),
      drums: 'k.hsk.h.k.hskhh.',
    },
    boss: { // "Last Call" — the final stops
      bpm: 144, swing: 0,
      lead: parseLine([
        'E5 E5 B4 E5 G5 E5 B4 E5 F#5 E5 B4 E5 G5 F#5 E5 D5', 'E5 E5 C5 E5 G5 E5 C5 E5 A5 G5 E5 C5 G5 E5 C5 E5',
        'F#5 F#5 D5 F#5 A5 F#5 D5 F#5 B5 A5 F#5 D5 A5 F#5 D5 F#5', 'D#5 - F#5 - B5 - A5 - F#5 - D#5 - B4 - . .']),
      bass: bassLine(['E2', 'C2', 'D2', 'B1'], '0o0o0o0o0o0o0o0o'),
      drums: 'khshkhshkhshkhss',
    },
  };
  const STINGERS = { clear: parseLine(['C5 E5 G5 C6 - G5 C6 - - - E6 - - - - -']) };

  let ac = null, master = null, noiseBuf = null, timer = null, cur = null, want = null, step = 0, nextT = 0, btn = null;
  let enabled = true; try { enabled = localStorage.getItem('bq_music') !== 'off'; } catch (e) {}

  function ensure() {
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
      ac = new C(); master = ac.createGain(); master.gain.value = 0.1; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
    return true;
  }
  function tone(type, freq, t, dur, vol) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, vol, hp) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  function kick(t) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.17); }

  function tick() {
    if (!ac || !cur) return;
    const T = TRACKS[cur], sd = 60 / T.bpm / 4, n = T.lead.length;
    while (nextT < ac.currentTime + 0.15) {
      const i = step % n, t = nextT + (i % 2 ? sd * T.swing : 0);
      const L = T.lead[i]; if (L) tone('square', mtof(L[0]), t, sd * L[1] * 0.95, 0.32);
      const B = T.bass[i % T.bass.length]; if (B) tone('triangle', mtof(B[0]), t, sd * 0.9, 0.55);
      const D = T.drums[i % 16]; if (D === 'k') kick(t); else if (D === 's') noise(t, 0.12, 0.35, 1200); else if (D === 'h') noise(t, 0.03, 0.14, 7000);
      step++; nextT += sd;
      if (want && want !== cur && step % 16 === 0) { cur = want; step = 0; }
    }
  }
  function start() {
    if (!enabled || !want || !ensure()) return;
    if (!cur) { cur = want; step = 0; nextT = ac.currentTime + 0.08; }
    if (!timer) timer = setInterval(tick, 25);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; cur = null; }
  function paint() { if (btn) { btn.textContent = enabled ? '🎵 ON' : '🔇 OFF'; btn.setAttribute('aria-pressed', String(enabled)); } }

  function mountButton() {
    if (btn || !document.body) return;
    btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('aria-label', 'Music on or off');
    btn.style.cssText = "position:fixed;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:60;font:9px 'Press Start 2P',monospace;padding:10px 12px;min-height:40px;background:#000;color:#fff;border:2px solid #fff;box-shadow:3px 3px 0 #ff4fa3;cursor:pointer";
    btn.onclick = (e) => { e.stopPropagation(); enabled = !enabled; try { localStorage.setItem('bq_music', enabled ? 'on' : 'off'); } catch (x) {} if (enabled) start(); else stop(); paint(); };
    document.body.appendChild(btn); paint();
  }

  const firstTap = () => { start(); };
  addEventListener('pointerdown', firstTap, { passive: true });
  addEventListener('keydown', firstTap);

  return {
    play(name) { if (!TRACKS[name]) return; want = name; if (cur && cur !== name && timer) { /* switches at the next bar */ } else if (ac && enabled) start(); },
    stinger(name) {
      if (!enabled || !STINGERS[name] || !ensure()) return; const ev = STINGERS[name], sd = 0.09; let t = ac.currentTime + 0.05;
      ev.forEach((e, i) => { if (e) tone('square', mtof(e[0]), t + i * sd, sd * e[1], 0.4); });
    },
    mountButton,
    get enabled() { return enabled; },
  };
})();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => BQMusic.mountButton()); else BQMusic.mountButton();
