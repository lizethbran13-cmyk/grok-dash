/* Grok Dash - data: heroes, worlds, levels, unlocks, helpers */
(function () {
'use strict';
const GD = window.GD = window.GD || {};
GD.VERSION = 1;
GD.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
GD.lerp = (a, b, t) => a + (b - a) * t;
GD.rng = function (seed) { let s = (seed >>> 0) || 1; return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
GD.fmtTime = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };

/* ---------- heroes ---------- */
// run: top run speed, acc: ground accel, jump: jump speed, glide: glide fall speed, gspd: glide horizontal speed,
// dash: dash speed, airDash: air dashes per jump, djump: double jumps
GD.HEROES = {
  grok:   { id: 'grok',   name: 'Grok',   tag: 'Balanced hero',          col: '#7c4dff', col2: '#ffd23f', run: 12,   acc: 30, jump: 15.6, glide: 3.0, gspd: 11,  dash: 19, airDash: 1, djump: 0, icon: '\u26A1' },
  speedy: { id: 'speedy', name: 'Speedy', tag: 'Fastest + super dash',   col: '#ff3b3b', col2: '#ffe14d', run: 14.2, acc: 38, jump: 15.0, glide: 3.8, gspd: 12,  dash: 25, airDash: 2, djump: 0, icon: '\uD83D\uDCA8' },
  floaty: { id: 'floaty', name: 'Floaty', tag: 'Long glide + high jump', col: '#ff6bd6', col2: '#7df9ff', run: 11.2, acc: 28, jump: 16.4, glide: 1.5, gspd: 12.5, dash: 18, airDash: 1, djump: 0, icon: '\uD83E\uDEB6' },
  candy:  { id: 'candy',  name: 'Candy',  tag: 'Bonus pup: double jump!', col: '#9aa3ad', col2: '#ffffff', run: 12.6, acc: 32, jump: 15.2, glide: 2.8, gspd: 11,  dash: 20, airDash: 1, djump: 1, icon: '\uD83D\uDC36', lock: 'candy' }
};
GD.HERO_IDS = ['grok', 'speedy', 'floaty', 'candy'];
// skins: [name, main colour, accent, unlock id or null]
GD.SKINS = {
  grok:   [['Classic', '#7c4dff', '#ffd23f', null], ['Golden', '#ffc81a', '#ff7a1a', 'gold5'], ['Ninja', '#25233a', '#ff3b6b', 'crit30']],
  speedy: [['Classic', '#ff3b3b', '#ffe14d', null], ['Shadow', '#2b2d42', '#ff3b3b', 'w2'], ['Golden', '#ffc81a', '#ffffff', 'gold10']],
  floaty: [['Classic', '#ff6bd6', '#7df9ff', null], ['Starry', '#3b2bd6', '#ffe14d', 'time5'], ['Mint', '#3ee8a5', '#ffffff', 'crit45']],
  candy:  [['Classic', '#9aa3ad', '#ffffff', null], ['Party', '#ff9ad5', '#ffe14d', 'final']]
};

/* ---------- worlds ---------- */
GD.WORLDS = [
  { id: 0, name: 'Jungle Ruins', icon: '\uD83C\uDF34', sky: ['#7fe0ff', '#fff3b0'], fog: '#bdf0d8', top: '#5fd35a', side: '#a0662c', side2: '#7a4a1e', plat: '#c98b4a', acc: '#ffd23f', enemy: '#ff8a3d', far: '#3fae6a', mid: '#2e8b57', boss: 'Totem Thumper', music: 0, bg: 'jungle' },
  { id: 1, name: 'Neon City',    icon: '\uD83C\uDF03', sky: ['#1b0b3a', '#7a2bd6'], fog: '#3a1a6a', top: '#3ff0ff', side: '#2a2350', side2: '#1a153a', plat: '#ff4fd8', acc: '#ff4fd8', enemy: '#ffe14d', far: '#4b2a8a', mid: '#2a1a5a', boss: 'DJ Volt', music: 1, bg: 'city' },
  { id: 2, name: 'Frosty Peaks', icon: '\uD83C\uDFD4\uFE0F', sky: ['#9fd8ff', '#ffffff'], fog: '#dff3ff', top: '#ffffff', side: '#7cc4f0', side2: '#4a90c8', plat: '#bfe8ff', acc: '#7df9ff', enemy: '#5a7dff', far: '#b8dcf5', mid: '#86b8e0', boss: 'Yeti King', music: 2, bg: 'snow' },
  { id: 3, name: 'Lava Factory', icon: '\uD83C\uDF0B', sky: ['#3a0d0d', '#ff7a3d'], fog: '#5a1a10', top: '#ffb02e', side: '#4a3a3a', side2: '#2a2020', plat: '#8a8a9a', acc: '#ff5a1a', enemy: '#c7f05a', far: '#6a2a1a', mid: '#3a1a14', boss: 'Furnace Crab', music: 3, bg: 'factory' },
  { id: 4, name: 'Sky Kingdom',  icon: '\uD83C\uDFF0', sky: ['#ffb8e8', '#bfe8ff'], fog: '#ffe0f4', top: '#fff6c9', side: '#ffffff', side2: '#d8d0ff', plat: '#ffd1f0', acc: '#a78bfa', enemy: '#ff6b6b', far: '#ffd6f0', mid: '#f3c8ff', boss: 'Mecha-Grumbleton', music: 4, bg: 'sky' }
];
const LV_NAMES = [
  ['Sunny Start', 'Vine Valley', 'Temple Run', 'Boulder Chase', 'Hidden Grove'],
  ['Downtown Dash', 'Rail Rush', 'Rooftop Hop', 'Glitch Wave', 'Arcade Alley'],
  ['Snowy Slopes', 'Icicle Caves', 'Windy Ridge', 'Avalanche!', 'Aurora Lights'],
  ['Pipe Works', 'Conveyor Chaos', 'Cannon Yard', 'Lava Wave', 'Molten Core'],
  ['Cloud Steps', 'Rainbow Rails', 'Castle Gates', 'Storm Chase', 'Star Garden']
];
// level list: 4 normal + boss + bonus per world
GD.LEVELS = [];
GD.WORLDS.forEach((w, wi) => {
  for (let i = 0; i < 4; i++) GD.LEVELS.push({ id: (wi + 1) + '-' + (i + 1), w: wi, i, kind: 'normal', name: LV_NAMES[wi][i], chase: i === 3, seed: 1000 + wi * 97 + i * 13, diff: GD.clamp(wi * 0.2 + i * 0.045, 0, 1) });
  GD.LEVELS.push({ id: (wi + 1) + '-B', w: wi, i: 4, kind: 'boss', name: w.boss, seed: 5000 + wi, diff: wi * 0.2 });
  GD.LEVELS.push({ id: (wi + 1) + '-S', w: wi, i: 5, kind: 'bonus', name: LV_NAMES[wi][4], seed: 7000 + wi * 31, diff: wi * 0.15 });
});
GD.lvById = (id) => GD.LEVELS.find((l) => l.id === id);

/* ---------- unlocks ---------- */
GD.UNLOCKS = [
  { id: 'candy', name: 'Candy the Schnauzer (hero)', need: 'Rescue 15 critters', p: (s) => [GD.count(s).crit, 15] },
  { id: 'gold5', name: 'Golden Grok skin', need: 'Earn 5 gold Spark medals', p: (s) => [GD.count(s).gold, 5] },
  { id: 'w2', name: 'Shadow Speedy skin', need: 'Beat the World 2 boss', p: (s) => [s.lv['2-B'] && s.lv['2-B'].done ? 1 : 0, 1] },
  { id: 'time5', name: 'Starry Floaty skin', need: 'Earn 5 gold time medals', p: (s) => [GD.count(s).tgold, 5] },
  { id: 'gold10', name: 'Golden Speedy skin', need: 'Earn 10 gold Spark medals', p: (s) => [GD.count(s).gold, 10] },
  { id: 'crit30', name: 'Ninja Grok skin', need: 'Rescue 30 critters', p: (s) => [GD.count(s).crit, 30] },
  { id: 'crit45', name: 'Mint Floaty skin', need: 'Rescue 45 critters', p: (s) => [GD.count(s).crit, 45] },
  { id: 'final', name: 'Party Candy skin', need: 'Beat Mecha-Grumbleton', p: (s) => [s.lv['5-B'] && s.lv['5-B'].done ? 1 : 0, 1] }
];
GD.count = function (s) {
  const c = { crit: 0, gold: 0, tgold: 0, done: 0, sparks: 0, medals: 0 };
  for (const k in s.lv) { const r = s.lv[k]; if (!r) continue; c.crit += (r.cages || []).filter(Boolean).length; if (r.medal === 3) c.gold++; if (r.tmedal === 3) c.tgold++; if (r.done) c.done++; c.sparks += r.sparks || 0; c.medals += (r.medal || 0) + (r.tmedal || 0); }
  return c;
};
GD.worldCrit = (s, w) => GD.LEVELS.filter((l) => l.w === w && l.kind === 'normal').reduce((a, l) => a + ((s.lv[l.id] && s.lv[l.id].cages) || []).filter(Boolean).length, 0);
GD.isUnlocked = function (s, id) { const u = GD.UNLOCKS.find((q) => q.id === id); if (!u) return true; const p = u.p(s); return p[0] >= p[1]; };
GD.BONUS_NEED = 6; // critters in that world (of 12) to open its bonus level
GD.levelOpen = function (s, lv) {
  if (s.allOpen) return true;
  const done = (id) => !!(s.lv[id] && s.lv[id].done);
  if (lv.kind === 'bonus') return GD.worldCrit(s, lv.w) >= GD.BONUS_NEED;
  if (lv.kind === 'boss') { for (let i = 1; i <= 4; i++) if (!done((lv.w + 1) + '-' + i)) return false; return true; }
  if (lv.i === 0) return lv.w === 0 || done(lv.w + '-B');
  return done((lv.w + 1) + '-' + lv.i);
};
GD.worldOpen = (s, w) => s.allOpen || w === 0 || !!(s.lv[w + '-B'] && s.lv[w + '-B'].done);
GD.CRITTERS = ['\uD83D\uDC39', '\uD83D\uDC30', '\uD83D\uDC25', '\uD83D\uDC38', '\uD83D\uDC28', '\uD83E\uDD94', '\uD83D\uDC27', '\uD83E\uDD8A', '\uD83D\uDC00'];
})();
