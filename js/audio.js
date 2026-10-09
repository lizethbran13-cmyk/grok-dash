/* Grok Dash - WebAudio sfx + upbeat per-world music */
(function () {
'use strict';
const GD = window.GD;
GD.Snd = (() => {
  let ctx = null, master = null, sfx = null, mus = null, muted = false, song = -1, nextBar = 0, bar = 0, timer = 0;
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.7; master.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
    mus = ctx.createGain(); mus.gain.value = 0.12; mus.connect(master);
    if (song >= 0) { const s = song; song = -1; music(s); }
  }
  function tone(f, dur, type, vol, delay, bus, f2) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfx); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, delay, hp, bus) {
    if (!ctx) return; const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(); s.buffer = b; const g = ctx.createGain(); g.gain.value = vol || 0.08; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 1500;
    s.connect(f); f.connect(g); g.connect(bus || sfx); s.start(ctx.currentTime + (delay || 0));
  }
  let lastRing = 0, ringAlt = 0;
  const FX = {
    click() { tone(880, 0.05, 'square', 0.04); },
    jump() { tone(320, 0.14, 'square', 0.05, 0, null, 760); },
    djump() { tone(520, 0.14, 'triangle', 0.07, 0, null, 1200); },
    walljump() { tone(260, 0.1, 'square', 0.05, 0, null, 900); noise(0.05, 0.05, 0, 3000); },
    land() { noise(0.05, 0.04, 0, 800); },
    ring() { const now = ctx.currentTime; if (now - lastRing < 0.03) return; lastRing = now; ringAlt ^= 1; tone(mf(ringAlt ? 88 : 91), 0.09, 'square', 0.045); tone(mf(ringAlt ? 95 : 96), 0.18, 'square', 0.04, 0.06); },
    spark() { tone(mf(84 + Math.floor(Math.random() * 3) * 3), 0.12, 'sine', 0.07); tone(mf(96), 0.08, 'sine', 0.03, 0.04); },
    spring() { tone(200, 0.3, 'triangle', 0.1, 0, null, 900); tone(400, 0.25, 'sine', 0.05, 0.05, null, 1600); },
    boost() { tone(300, 0.35, 'sawtooth', 0.05, 0, null, 1400); noise(0.3, 0.05, 0, 2000); },
    loop() { tone(500, 0.5, 'triangle', 0.05, 0, null, 1500); },
    dash() { noise(0.18, 0.08, 0, 1200); tone(600, 0.15, 'sawtooth', 0.04, 0, null, 300); },
    rev() { tone(300, 0.15, 'sawtooth', 0.06, 0, null, 1200); },
    spindash() { tone(1200, 0.3, 'sawtooth', 0.06, 0, null, 300); noise(0.25, 0.07, 0, 1500); },
    roll() { tone(500, 0.1, 'triangle', 0.05, 0, null, 300); },
    punch() { noise(0.08, 0.08, 0, 900); tone(180, 0.08, 'square', 0.05, 0, null, 90); },
    bop() { tone(mf(72), 0.08, 'square', 0.07); tone(mf(79), 0.12, 'square', 0.07, 0.07); },
    pop() { tone(500, 0.12, 'sine', 0.1, 0, null, 1400); },
    hurt() { tone(500, 0.3, 'sawtooth', 0.07, 0, null, 120); },
    scatter() { for (let i = 0; i < 6; i++) tone(mf(90 - i * 2), 0.08, 'square', 0.035, i * 0.04); },
    die() { [72, 68, 64, 60].forEach((m, i) => tone(mf(m), 0.16, 'square', 0.07, i * 0.1)); },
    cage() { noise(0.2, 0.12, 0, 600); [76, 80, 83, 88].forEach((m, i) => tone(mf(m), 0.16, 'triangle', 0.09, 0.1 + i * 0.08)); },
    cp() { [79, 84, 88].forEach((m, i) => tone(mf(m), 0.14, 'square', 0.06, i * 0.07)); },
    goal() { [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => tone(mf(m), 0.22, 'square', 0.07, i * 0.08)); },
    hook() { tone(900, 0.08, 'triangle', 0.06); },
    cannonIn() { tone(150, 0.2, 'square', 0.06); },
    cannon() { noise(0.4, 0.16, 0, 300); tone(120, 0.3, 'sawtooth', 0.08, 0, null, 60); },
    wallrun() { tone(400, 0.25, 'sawtooth', 0.04, 0, null, 900); },
    grind() { noise(0.2, 0.05, 0, 4000); },
    warn() { tone(880, 0.12, 'square', 0.05); tone(880, 0.12, 'square', 0.05, 0.18); },
    boom() { noise(0.6, 0.18, 0, 200); tone(90, 0.5, 'sawtooth', 0.08, 0, null, 40); },
    bosshit() { tone(mf(60), 0.12, 'square', 0.09); tone(mf(55), 0.2, 'square', 0.09, 0.1); noise(0.2, 0.1, 0, 800); },
    lifeup() { [76, 79, 84, 88, 91].forEach((m, i) => tone(mf(m), 0.12, 'triangle', 0.09, i * 0.07)); },
    unlock() { [72, 76, 79, 84].forEach((m, i) => tone(mf(m), 0.2, 'square', 0.08, i * 0.12)); tone(mf(91), 0.6, 'triangle', 0.1, 0.5); },
    join() { tone(mf(76), 0.1, 'square', 0.06); tone(mf(83), 0.15, 'square', 0.06, 0.1); },
    leave() { tone(mf(70), 0.12, 'square', 0.05); tone(mf(63), 0.2, 'square', 0.05, 0.12); },
    no() { tone(220, 0.18, 'sawtooth', 0.05); },
    count() { tone(mf(72), 0.15, 'square', 0.07); },
    go() { tone(mf(84), 0.4, 'square', 0.08); }
  };
  // songs: [bpm, chords (root midi), scale melody offsets, lead wave]
  const SONGS = [
    [138, [60, 65, 57, 67], [0, 4, 7, 9, 7, 4, 2, 4], 'square'],      // jungle
    [150, [57, 53, 60, 55], [12, 7, 3, 7, 10, 7, 3, 0], 'sawtooth'],  // neon
    [128, [62, 67, 59, 64], [7, 4, 2, 4, 7, 9, 11, 9], 'triangle'],   // frosty
    [144, [52, 55, 50, 57], [0, 3, 5, 7, 5, 3, 7, 10], 'sawtooth'],   // lava
    [134, [65, 62, 58, 60], [0, 4, 7, 12, 11, 7, 4, 2], 'square'],    // sky
    [160, [55, 51, 53, 50], [0, 7, 3, 10, 7, 3, 12, 10], 'sawtooth'], // boss
    [112, [60, 57, 65, 67], [4, 7, 12, 7, 9, 7, 4, 2], 'triangle'],   // menu
    [170, [62, 60, 65, 67], [0, 4, 7, 11, 12, 11, 7, 4], 'square'],   // DLC: sunset speedway
    [146, [65, 60, 62, 58], [12, 9, 7, 4, 7, 9, 12, 16], 'triangle'], // DLC: starlight carnival
    [176, [50, 53, 48, 55], [0, 3, 7, 10, 12, 10, 7, 15], 'sawtooth']  // DLC: mega boss / boss mode
  ];
  function schedule() {
    if (!ctx || song < 0) return;
    const S = SONGS[song], bt = 60 / S[0] / 2;
    while (nextBar < ctx.currentTime + 0.5) {
      const root = S[1][bar % 4];
      for (let i = 0; i < 8; i++) {
        const t = nextBar + i * bt - ctx.currentTime; if (t < 0) continue;
        tone(mf(root - 12 + (i % 2 ? 12 : 0)), bt * 0.85, 'triangle', 0.32, t, mus);
        if (i % 4 === 0) noise(0.08, 0.16, t, 120, mus); else if (i % 4 === 2) noise(0.06, 0.08, t, 3000, mus); else noise(0.02, 0.04, t, 7000, mus);
        if (bar % 4 !== 3 || i < 6) { const m = S[2][(i + bar * 3) % 8]; if (i % 2 === 0 || bar % 2) tone(mf(root + 12 + m), bt * 0.8, S[3], 0.09, t, mus); }
      }
      nextBar += 8 * bt; bar++;
    }
  }
  function music(i) {
    if (i === song) return; song = i; bar = 0; clearInterval(timer);
    if (i < 0 || !ctx) return;
    nextBar = ctx.currentTime + 0.1; timer = setInterval(schedule, 150); schedule();
  }
  return {
    init, music, fx(n) { if (FX[n] && ctx && !muted) try { FX[n](); } catch (e) { /* ignore */ } },
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.7; }, isMuted: () => muted
  };
})();
})();
