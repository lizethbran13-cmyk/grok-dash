/* Grok Dash - level generator: deterministic chunk-based 2.5D levels (gameplay on the x/y plane) */
(function () {
'use strict';
const GD = window.GD;
const G = 40; // gravity used for spring/cannon maths (matches player.js)
GD.GRAV = G;

function B(def) {
  const b = { S: [], O: [], x: 0, y: 0, d: def.diff, w: def.w, r: GD.rng(def.seed), n: 0, cp: 0, minY: 0, maxY: 0, def };
  b.R = (a, c) => a + (c - a) * b.r();
  b.pick = (arr) => arr[Math.floor(b.r() * arr.length)];
  b.gnd = (x0, x1, y0, y1, o) => { const s = Object.assign({ x0, x1, y0, y1, yb: Math.min(y0, y1) - 40, k: 'g' }, o || {}); b.S.push(s); b.minY = Math.min(b.minY, y0, y1); b.maxY = Math.max(b.maxY, y0, y1); return s; };
  b.seg = (len, dy) => { dy = dy || 0; b.gnd(b.x, b.x + len, b.y, b.y + dy); b.x += len; b.y += dy; };
  b.plat = (x0, x1, y, o) => { const s = Object.assign({ x0, x1, y0: y, y1: y, yb: y - 0.9, k: 'p' }, o || {}); b.S.push(s); b.maxY = Math.max(b.maxY, y); return s; };
  b.o = (t, p) => { const ob = Object.assign({ t, id: b.n++ }, p); b.O.push(ob); return ob; };
  b.spk = (x, y) => b.o('spark', { x, y });
  b.ring = (x, y) => b.o('ring', { x, y });
  b.line = (k, x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); b[k](GD.lerp(x0, x1, t), GD.lerp(y0, y1, t)); } };
  b.arc = (k, x0, y0, x1, y1, h, n) => { for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; b[k](GD.lerp(x0, x1, t), GD.lerp(y0, y1, t) + 4 * h * t * (1 - t)); } };
  b.foe = (type, x, y, range) => b.o('foe', { k: type, x, y, range: range || 0, ph: b.r() * 6.28 });
  b.checkpoint = () => b.o('cp', { x: b.x - 2, y: b.y, n: ++b.cp });
  b.hint = (txt, ttxt) => b.o('hint', { x: b.x + 1, y: b.y, text: txt, ttext: ttxt || txt });
  return b;
}

/* ---------------- chunks ---------------- */
const C = {};
C.run = (b) => {
  const len = Math.round(b.R(14, 22));
  b.line('spk', b.x + 3, b.y + 1.3, b.x + len - 3, b.y + 1.3, Math.floor(len / 3));
  const nf = Math.floor(b.d * 2.2 + b.r() * 0.9);
  for (let i = 0; i < nf; i++) b.foe(b.d > 0.45 && b.r() < 0.3 ? 'spiky' : 'walker', b.x + len * (0.4 + 0.35 * i), b.y, 2.5);
  if (b.r() < 0.5) { b.seg(len * 0.35); b.seg(3, 1.2); b.seg(3, -1.2); b.seg(len * 0.65 - 6); } else b.seg(len);
};
C.gaps = (b) => {
  const n = 2 + (b.r() < b.d ? 1 : 0) + (b.d > 0.5 ? 1 : 0);
  b.seg(3);
  for (let i = 0; i < n; i++) {
    const g = 2.4 + b.d * 2.8 + b.r() * 1.1;
    let dy = (b.r() - 0.45) * 2.6; if (b.y + dy < -14) dy = Math.abs(dy);
    b.arc('spk', b.x, b.y + 1, b.x + g, b.y + dy + 1, 2.4, 3);
    b.x += g; b.y += dy;
    const w = Math.round(b.R(6.5, 9) - b.d * 1.5);
    if (b.d > 0.25 && b.r() < 0.3) b.foe('flyer', b.x + w / 2, b.y + 3.6, 1.5);
    b.seg(w);
  }
  b.seg(3);
};
C.hills = (b) => {
  b.seg(3);
  const a = b.R(2, 3);
  b.line('ring', b.x + 1, b.y + 1, b.x + 9, b.y + 1 - a, 5); b.seg(10, -a);
  b.line('ring', b.x + 1, b.y + 1 - 0.2, b.x + 6, b.y + 1 + 1.4, 3); b.seg(7, 1.6);
  b.seg(2);
  b.line('spk', b.x + 1, b.y + 1, b.x + 8, b.y - 1.5, 4); b.seg(9, -a);
  if (b.d > 0.2 && b.r() < 0.6) b.foe('hopper', b.x + 3, b.y, 1.5);
  b.seg(6);
};
C.speed = (b) => {
  b.seg(2); b.o('boost', { x: b.x + 1, y: b.y, dir: 1 }); b.seg(4);
  b.line('ring', b.x + 1, b.y + 1, b.x + 15, b.y - 3.6, 7); b.seg(16, -5);
  b.seg(5);
  const lx = b.x + 1, r = 3.6; b.o('loop', { x: lx, y: b.y, r });
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i + 0.5) / 10 * Math.PI * 2; b.ring(lx + Math.cos(a) * (r - 0.9), b.y + r + Math.sin(a) * (r - 0.9)); }
  b.seg(10);
  b.o('boost', { x: b.x - 2, y: b.y, dir: 1 });
  b.seg(5, 2.2); // ramp
  b.arc('spk', b.x + 1, b.y + 2, b.x + 9, b.y - 0.5, 3, 5);
  b.x += 3.5; b.y -= 2.5; b.seg(12);
};
C.spring = (b) => {
  b.seg(6);
  const h = b.R(4.6, 6.4);
  b.o('spring', { x: b.x - 2.6, y: b.y, v: Math.sqrt(2 * G * (h + 2.8)) });
  b.line('spk', b.x - 2.6, b.y + 2.5, b.x - 2.6, b.y + h + 1.5, 4);
  b.y += h; b.seg(14);
};
C.stairs = (b) => {
  const n = 3 + (b.d > 0.35 ? 1 : 0);
  b.seg(3);
  const x0 = b.x, y0 = b.y;
  for (let i = 0; i < n; i++) {
    const px = x0 + 2 + i * 4.6, py = y0 + 2.2 * (i + 1);
    b.plat(px, px + (i === n - 1 ? 4.6 : 3.4), py, { ow: true });
    b.spk(px + 1.7, py + 1.2);
  }
  const xe = x0 + 2 + n * 4.6;
  b.seg(xe - x0);
  b.o('spring', { x: xe - 1.3, y: y0, v: Math.sqrt(2 * G * (2.2 * n + 2.8)) });
  b.y = y0 + 2.2 * n; b.seg(9);
};
C.hooks = (b) => {
  const n = 2 + (b.d > 0.3 ? 1 : 0);
  b.seg(4);
  const x0 = b.x;
  for (let i = 0; i < n; i++) { const hx = x0 + 3.2 + i * 5.6; b.o('hook', { x: hx, y: b.y + 5 }); b.arc('spk', hx - 2.2, b.y + 3, hx + 2.2, b.y + 3, -1.2, 3); }
  b.x = x0 + 3.2 + (n - 1) * 5.6 + 5;
  b.seg(10);
};
C.walls = (b) => {
  b.seg(6);
  const H = b.R(6.8, 7.6) + b.d * 2.4, xs = b.x;
  b.S.push({ x0: xs - 3.5, x1: xs, y0: b.y + H - 0.6, y1: b.y + H - 0.6, yb: b.y + 2.7, k: 'p' });
  b.line('spk', xs + 1.4, b.y + 2.5, xs + 1.4, b.y + H - 0.5, 4);
  b.seg(2.9); b.y += H; b.seg(9);
};
C.glide = (b) => {
  b.seg(6);
  const W = Math.round(9 + b.d * 7), fx = b.x + W / 2;
  if (W > 11) b.o('fan', { x: fx, y: b.y - 7, w: 3, h: 13 });
  b.arc('spk', b.x + 1, b.y + 3, b.x + W - 1, b.y + 1.5, 1.6, 7);
  b.x += W; b.seg(9);
};
C.rail = (b) => {
  b.seg(4);
  const x0 = b.x, y0 = b.y;
  b.gnd(x0, x0 + 7, y0, y0 + 1.6, { k: 'rail', ow: true, yb: y0 - 0.4 });
  b.gnd(x0 + 7, x0 + 26, y0 + 1.6, y0 - 2, { k: 'rail', ow: true, yb: y0 - 2.4 });
  b.line('ring', x0 + 2, y0 + 1.6, x0 + 24, y0 - 0.8, 10);
  b.x = x0 + 29; b.y = y0 - 2.6; b.seg(10);
};
C.cannon = (b) => {
  b.seg(5);
  const D = Math.round(18 + b.d * 8), dh = b.R(-1.5, 2.5);
  b.o('cannon', { x: b.x - 2.2, y: b.y, tx: b.x + D + 5, ty: b.y + dh });
  b.arc('spk', b.x, b.y + 4, b.x + D, b.y + dh + 2, 6, 7);
  b.x += D; b.y += dh; b.seg(12);
};
C.movers = (b) => {
  b.seg(3);
  const n = 2, x0 = b.x;
  for (let i = 0; i < n; i++) {
    const cx = x0 + 3 + i * 7.5;
    b.o('mover', { x: cx, y: b.y - 0.2, w: 3.6, dx: 2.4, dy: i === 1 && b.d > 0.4 ? 1.5 : 0, per: 3.6, ph: i * 1.6 });
    b.spk(cx, b.y + 1.3);
  }
  b.x = x0 + 3 + (n - 1) * 7.5 + 6.5; b.seg(8);
};
C.crumble = (b) => {
  b.seg(3);
  const n = 6 + Math.round(b.d * 2);
  for (let i = 0; i < n; i++) { b.plat(b.x + i * 2.05, b.x + i * 2.05 + 2, b.y, { k: 'crumble' }); if (i % 2) b.spk(b.x + i * 2.05 + 1, b.y + 1.3); }
  b.x += n * 2.05 + 0.2; b.seg(8);
};
C.qpipe = (b) => {
  b.seg(3); b.o('boost', { x: b.x + 1, y: b.y, dir: 1 }); b.seg(15);
  b.line('ring', b.x - 13, b.y + 1, b.x - 4, b.y + 1, 5);
  b.o('qpipe', { x: b.x, y: b.y, r: 3 });
  b.line('spk', b.x - 0.6, b.y + 4, b.x - 0.6, b.y + 9, 3);
  b.y += 6.5; b.seg(10);
};
C.foes = (b) => {
  const len = 24; b.seg(2);
  const ks = ['walker', 'hopper']; if (b.d > 0.25) ks.push('flyer'); if (b.d > 0.45) ks.push('spiky');
  const n = 2 + Math.round(b.d * 2);
  for (let i = 0; i < n; i++) { const k = b.pick(ks); b.foe(k, b.x + 5 + i * (len - 8) / n, b.y + (k === 'flyer' ? 3.4 : 0), k === 'hopper' ? 1 : 2.4); }
  b.line('ring', b.x + 3, b.y + 1.2, b.x + len - 3, b.y + 1.2, 6);
  b.seg(len);
};
C.spikes = (b) => {
  b.seg(4);
  for (let i = 0; i < 2; i++) { const w = b.R(1.5, 2.6); b.o(b.w === 3 ? 'fire' : 'spikes', { x0: b.x + 3, x1: b.x + 3 + w, y: b.y, ph: i * 1.3 }); b.arc('spk', b.x + 1.6, b.y + 1.5, b.x + 4.4 + w, b.y + 1.5, 2.2, 3); b.seg(6 + w); }
  b.seg(3);
};
/* secrets with critter cages */
const SEC = {};
SEC.high = (b, ci) => {
  b.seg(3);
  b.o('spring', { x: b.x + 2, y: b.y, v: Math.sqrt(2 * G * 10.2), hidden: true });
  b.o('bush', { x: b.x + 2, y: b.y });
  b.plat(b.x, b.x + 11, b.y + 7.4, { ow: true });
  b.o('cage', { x: b.x + 8, y: b.y + 7.4, ci });
  b.line('spk', b.x + 4, b.y + 8.6, b.x + 10, b.y + 8.6, 4);
  b.seg(14);
};
SEC.wall = (b, ci) => {
  b.seg(5);
  const x0 = b.x + 3;
  b.gnd(b.x, x0, b.y + 1.5, b.y + 1.5); // step up
  b.S.push({ x0, x1: x0 + 9, y0: b.y + 3.1, y1: b.y + 3.1, yb: b.y + 2.3, k: 'p', blk: true });
  b.o('fake', { x0, x1: x0 + 9, y0: b.y, y1: b.y + 2.3 });
  b.o('cage', { x: x0 + 2.5, y: b.y, ci });
  b.line('spk', x0 + 4.5, b.y + 1, x0 + 7.5, b.y + 1, 3);
  b.line('spk', x0 + 1, b.y + 4.4, x0 + 8, b.y + 4.4, 4);
  b.x = x0; b.seg(9); b.seg(8);
};
SEC.sky = (b, ci) => {
  b.seg(3);
  b.o('fan', { x: b.x + 2.5, y: b.y, w: 2.6, h: 9.5 });
  b.plat(b.x + 4, b.x + 13, b.y + 9, { ow: true, k: 'cloud' });
  b.o('cage', { x: b.x + 10, y: b.y + 9, ci });
  b.line('spk', b.x + 2.5, b.y + 3, b.x + 2.5, b.y + 9, 4);
  b.seg(15);
};

const POOL = [
  ['run', 0, 3], ['gaps', 0, 3], ['hills', 0, 2], ['speed', 0, 2], ['spring', 0, 2], ['stairs', 0, 2], ['hooks', 0.04, 2], ['glide', 0.04, 2],
  ['walls', 0.08, 1.5], ['rail', 0.15, 2], ['cannon', 0.15, 1.5], ['movers', 0.2, 1.5], ['crumble', 0.25, 1.5], ['qpipe', 0.12, 1.5], ['foes', 0.05, 2], ['spikes', 0.1, 1.5]
];
// per-world flavour weights
const FLAVOR = [
  { hooks: 2, spring: 1.5, hills: 1.5, gaps: 1.3 },
  { speed: 2, rail: 2.5, qpipe: 1.5, movers: 1.3 },
  { hills: 2, crumble: 2, glide: 1.6, walls: 1.3 },
  { movers: 2, cannon: 2, spikes: 2, rail: 1.2 },
  { glide: 2, cannon: 1.8, hooks: 1.8, rail: 1.6, stairs: 1.4 }
];
const CHASE_OK = { run: 1, gaps: 1, hills: 1, speed: 1, spring: 1, foes: 1, spikes: 1, rail: 1, stairs: 1 };

function buildNormal(def) {
  const b = B(def), fl = FLAVOR[def.w];
  b.gnd(-30, 0, 0, 0); b.S.push({ x0: -32, x1: -30, y0: 30, y1: 30, yb: -40, k: 'g', wall: true });
  b.seg(12);
  const nChunks = 7 + def.w + def.i;
  const plan = [];
  let last = '';
  for (let i = 0; i < nChunks; i++) {
    const chase = def.chase && i >= 2;
    const opts = POOL.filter((p) => p[1] <= def.diff + 0.001 && p[0] !== last && (!chase || CHASE_OK[p[0]]));
    let tot = 0; opts.forEach((p) => { tot += p[2] * (fl[p[0]] || 1); });
    let r = b.r() * tot, k = opts[0][0];
    for (const p of opts) { r -= p[2] * (fl[p[0]] || 1); if (r <= 0) { k = p[0]; break; } }
    plan.push(k); last = k;
  }
  // make sure each level shows off a speed section and some Rayman platforming
  if (!plan.includes('speed') && !def.chase) plan[1] = 'speed';
  if (!plan.some((k) => k === 'hooks' || k === 'glide' || k === 'walls') && def.diff > 0.03 && !def.chase) plan[plan.length - 2] = 'hooks';
  // secret cage slots
  const secK = ['high', 'wall', 'sky'], secAt = [1, Math.floor(nChunks / 2), nChunks - 2];
  for (let i = 0; i < nChunks; i++) {
    if (def.chase && i === 2) { b.seg(4); b.checkpoint(); b.o('chase', { x: b.x, speed: 8.6 + def.diff * 2.2 }); b.seg(6); }
    C[plan[i]](b);
    const si = secAt.indexOf(i);
    if (si >= 0 && !(def.chase && i >= 2)) SEC[secK[si]](b, si);
    else if (si >= 0) { b.seg(4); b.o('cage', { x: b.x, y: b.y + (si === 1 ? 4.2 : 0), ci: si }); if (si === 1) b.line('spk', b.x - 2, b.y + 3, b.x + 2, b.y + 3, 3); b.seg(6); }
    if (i % 2 === 1 && i < nChunks - 1) { b.seg(3); b.checkpoint(); }
  }
  b.seg(10); b.o('goal', { x: b.x, y: b.y }); b.seg(14);
  b.S.push({ x0: b.x, x1: b.x + 2, y0: b.y + 30, y1: b.y + 30, yb: -60, k: 'g', wall: true });
  return finish(b, def);
}
function buildTutorial(def) {
  const b = B(def);
  b.gnd(-30, 0, 0, 0); b.S.push({ x0: -32, x1: -30, y0: 30, y1: 30, yb: -40, k: 'g', wall: true });
  b.hint('Hold \u25B6 to run!', 'Push the stick \u25B6 to run!'); b.line('spk', 4, 1.3, 14, 1.3, 5); b.seg(16);
  b.hint('Press JUMP (Space) to hop the gap!', 'Tap JUMP to hop the gap!'); b.seg(4); b.arc('spk', b.x, 1, b.x + 3, 1, 2.4, 3); b.x += 3; b.seg(6); b.arc('spk', b.x, 1, b.x + 3.5, 2, 2.4, 3); b.x += 3.5; b.y += 1; b.seg(8);
  b.hint('ATTACK (X) punches baddies. Or bop them from above!', 'ATTACK punches baddies \u2014 or bop them!'); b.seg(4); b.foe('walker', b.x + 6, b.y, 2.5); b.line('ring', b.x + 2, b.y + 1.2, b.x + 12, b.y + 1.2, 6); b.seg(14);
  b.seg(2); b.checkpoint(); b.seg(2);
  b.hint('Springs launch you sky-high!'); C.spring(b);
  SEC.high(b, 0);
  b.hint('HOLD JUMP in the air to glide!', 'HOLD JUMP in the air to glide!'); b.seg(4); b.arc('spk', b.x + 1, b.y + 3, b.x + 10, b.y + 2, 1.5, 6); b.x += 11; b.seg(8);
  b.seg(2); b.checkpoint(); b.seg(2);
  b.hint('Fly near a hook to swing. JUMP lets go!'); C.hooks(b);
  b.hint('Boost pads + loops = SPEED! Rings protect you from hits.'); C.speed(b);
  b.seg(2); b.checkpoint(); b.seg(2);
  b.hint('Hold \u25BC + DASH (Shift) to charge a spin-dash, then let go!', 'Hold \u25BC + press DASH to rev a spin-dash!'); b.seg(6); b.foe('walker', b.x + 8, b.y, 1.5); b.line('ring', b.x, b.y + 1, b.x + 14, b.y + 1, 7); b.seg(16);
  b.hint('Jump at a wall, then JUMP again to wall-jump up!'); C.walls(b);
  b.hint('Cracked blocks hide secrets. Find 3 critter cages!', 'Cracked blocks hide secrets. Find 3 critter cages!'); SEC.wall(b, 1);
  b.seg(2); b.checkpoint(); b.seg(2);
  b.hint('Fans blow you up. Hold JUMP to ride them!'); SEC.sky(b, 2);
  b.seg(10); b.o('goal', { x: b.x, y: b.y }); b.seg(14);
  b.S.push({ x0: b.x, x1: b.x + 2, y0: b.y + 30, y1: b.y + 30, yb: -60, k: 'g', wall: true });
  return finish(b, def);
}
function buildBonus(def) {
  const b = B(Object.assign({}, def, { diff: 0.3 }));
  b.gnd(-30, 0, 0, 0); b.S.push({ x0: -32, x1: -30, y0: 30, y1: 30, yb: -40, k: 'g', wall: true });
  b.hint('BONUS STAGE: grab as many Sparks as you can!'); b.seg(12);
  const seq = ['speed', 'rail', 'hills', 'qpipe', 'cannon', 'speed', 'glide', 'rail', 'spring', 'speed', 'hills'];
  seq.forEach((k, i) => { C[k](b); const x0 = b.x; b.line('spk', x0 + 1, b.y + 1.3, x0 + 9, b.y + 1.3, 5); b.seg(10); if (i % 3 === 2) { b.seg(2); b.checkpoint(); b.seg(2); } });
  b.seg(6); b.o('goal', { x: b.x, y: b.y }); b.seg(14);
  b.S.push({ x0: b.x, x1: b.x + 2, y0: b.y + 30, y1: b.y + 30, yb: -60, k: 'g', wall: true });
  b.O = b.O.filter((o) => o.t !== 'foe');
  return finish(b, def);
}
function buildBoss(def) {
  const b = B(def);
  b.gnd(-6, 46, 0, 0);
  b.S.push({ x0: -8, x1: -6, y0: 30, y1: 30, yb: -40, k: 'g', wall: true });
  b.S.push({ x0: 46, x1: 48, y0: 30, y1: 30, yb: -40, k: 'g', wall: true });
  b.plat(6, 11, 4.2, { ow: true }); b.plat(29, 34, 4.2, { ow: true });
  b.o('boss', { x: 30, y: 0, k: def.w });
  b.x = 46; b.y = 0;
  const L = finish(b, def);
  L.arena = { x0: -6, x1: 46 }; L.start = [2, 0];
  return L;
}
function finish(b, def) {
  const sp = b.O.filter((o) => o.t === 'spark').length;
  const len = b.x;
  const L = {
    id: def.id, def, S: b.S, O: b.O, len, start: [3, 0], pitY: b.minY - 14, maxY: b.maxY,
    sparks: sp, medals: [Math.ceil(sp * 0.4), Math.ceil(sp * 0.7), Math.ceil(sp * 0.9)],
    cages: b.O.filter((o) => o.t === 'cage').length,
    rings: b.O.filter((o) => o.t === 'ring').length
  };
  const gold = def.kind === 'boss' ? 75 : Math.round(len / 10.5 + 6 + (def.chase ? 0 : 3));
  L.times = [Math.round(gold * 1.8), Math.round(gold * 1.35), gold];
  return L;
}
GD.buildLevel = function (def) {
  if (def.kind === 'boss') return buildBoss(def);
  if (def.kind === 'bonus') return buildBonus(def);
  if (def.id === '1-1') return buildTutorial(def);
  return buildNormal(def);
};
})();
