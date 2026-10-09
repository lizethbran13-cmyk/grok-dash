/* Grok Dash - SUPER SONIC PACK (DLC, idea #14): 2 new worlds (Sunset Speedway + Starlight Carnival), Roller Rex,
   the MEGA boss GIGA GRUMBOT, Super + Metal hero skins and BOSS MODE (play as the villain vs 3 CPU heroes).
   Gate: localStorage 'grokDLC.dash.super_sonic_pack_expansion'. Online: if the host owns it, guests play the DLC levels the host picks. */
(function () {
'use strict';
const GD = window.GD, T = window.THREE, MD = GD.MD, V = GD.View, G = GD.G, GS = G.GS, Snd = GD.Snd, SS = GD.SS, N = GS.net, $ = G.$, clamp = GD.clamp, GN = window.GrokNet;
const { mesh, outline, geo } = MD, toon = MD.toon, esc = GN.esc;
const TAU = Math.PI * 2;

/* ================= 3D: dizzy stars (real 3D), bosses ================= */
function stars3d(P, g) {
  P.stars = new T.Group(); g.add(P.stars); P.stars.position.y = P.h + 0.5; P.stars.visible = false;
  for (let i = 0; i < 5; i++) { const s = new T.Group(); s.position.set(Math.cos(i * TAU / 5) * 1.1, 0, Math.sin(i * TAU / 5) * 1.1); P.stars.add(s); for (let k = 0; k < 5; k++) { const c = mesh(geo.cone, toon('#ffe14d', { emissive: '#7a5a00' }), Math.cos(k * TAU / 5 + Math.PI / 2) * 0.13, Math.sin(k * TAU / 5 + Math.PI / 2) * 0.13, 0, 0.09, 0.22, 0.05, s); c.rotation.z = k * TAU / 5; } mesh(geo.s8, toon('#ffe14d', { emissive: '#7a5a00' }), 0, 0, 0, 0.13, 0.13, 0.07, s); }
}
const baseBoss = MD.boss;
MD.boss = function (k) {
  if (k < 5) return baseBoss(k);
  const g = new T.Group(), P = {}; g.userData.P = P;
  const mW = toon('#ffffff'), mK = toon('#1a0d2a');
  const eyes = (par, x, y, z, s) => [-1, 1].forEach((sd) => { mesh(geo.s, mW, x, y, z + sd * 0.42 * s, 0.3 * s, 0.36 * s, 0.2 * s, par); mesh(geo.s, mK, x + 0.17 * s, y, z + sd * 0.42 * s, 0.15 * s, 0.2 * s, 0.1 * s, par); const b = mesh(geo.b, mK, x + 0.05, y + 0.4 * s, z + sd * 0.42 * s, 0.1, 0.1, 0.55 * s, par); b.rotation.x = sd * 0.45; });
  if (k === 5) { // ROLLER REX: a speedy armoured robo-dino on wheels
    const m1 = toon('#ff3b6b'), m2 = toon('#ffe14d'), m3 = toon('#3b3b4e');
    const body = new T.Group(); g.add(body); P.body = body;
    outline(mesh(geo.s, m1, 0, 1.6, 0, 1.7, 1.25, 1.35, body), 0.04);
    for (let i = 0; i < 4; i++) { const r = mesh(geo.tor, m2, -0.9 + i * 0.6, 1.7, 0, 1.18 - Math.abs(i - 1.5) * 0.18, 1.18 - Math.abs(i - 1.5) * 0.18, 1.6, body); r.rotation.y = Math.PI / 2; }
    const hd = new T.Group(); hd.position.set(1.65, 2.35, 0); body.add(hd);
    outline(mesh(geo.s, m1, 0, 0, 0, 0.85, 0.7, 0.75, hd), 0.05); mesh(geo.s, toon('#ffd1dc'), 0.5, -0.35, 0, 0.55, 0.22, 0.55, hd); eyes(hd, 0.55, 0.22, 0, 0.6);
    for (let i = 0; i < 4; i++) mesh(geo.cone, mW, 0.75 - i * 0.12, -0.32, (i - 1.5) * 0.18, 0.06, 0.16, 0.06, hd).rotation.z = Math.PI;
    for (let i = 0; i < 4; i++) { const sp = outline(mesh(geo.cone, m2, -0.4 + i * 0.45, 2.95 - Math.abs(i - 1.5) * 0.1, 0, 0.2, 0.55, 0.2, body), 0.1); sp.rotation.z = 0.25; }
    const tail = outline(mesh(geo.cone, m1, -1.9, 1.3, 0, 0.45, 1.4, 0.45, body), 0.06); tail.rotation.z = 1.9;
    P.wheels = [-1, 1].map((sd) => { const w = new T.Group(); w.position.set(0, 0.55, sd * 1.05); body.add(w); outline(mesh(geo.c, m3, 0, 0, 0, 0.55, 0.32, 0.55, w), 0.05).rotation.x = Math.PI / 2; mesh(geo.c, m2, 0, 0, sd * 0.17, 0.25, 0.04, 0.25, w).rotation.x = Math.PI / 2; return w; });
    [-0.9, 0.9].forEach((x) => [-1, 1].forEach((sd) => { const w = outline(mesh(geo.c, m3, x, 0.42, sd * 0.95, 0.42, 0.3, 0.42, body), 0.05); w.rotation.x = Math.PI / 2; }));
    P.arms = [-1, 1].map((sd) => outline(mesh(geo.s, m1, 1.0, 1.4, sd * 1.25, 0.28, 0.5, 0.28, body), 0.06));
    P.jet = mesh(geo.cone, new T.MeshBasicMaterial({ color: '#ffb02e', transparent: true, opacity: 0.75 }), -1.9, 1.0, 0, 0.45, 1.2, 0.45, body); P.jet.rotation.z = Math.PI / 2;
    P.h = 3.2; P.w = 1.8;
  } else { // GIGA GRUMBOT: the MEGA boss, a giant carnival mech piloted by Grumbleton
    const m1 = toon('#7c3aed'), m2 = toon('#e5e7eb'), m3 = toon('#ffe14d', { emissive: '#664400' }), m4 = toon('#2a2350');
    outline(mesh(geo.b, m1, 0, 3.1, 0, 3.0, 2.6, 2.4, g), 0.03);
    outline(mesh(geo.s, m1, 0, 4.4, 0, 1.55, 0.5, 1.25, g), 0.04);
    mesh(geo.b, m4, 0, 1.9, 0, 3.05, 0.35, 2.45, g);
    const win = mesh(geo.s, new T.MeshToonMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.6, gradientMap: null }), 1.45, 3.4, 0, 0.35, 0.95, 0.95, g); win.renderOrder = 2;
    outline(mesh(geo.s, toon('#fcd5b4'), 1.3, 3.4, 0, 0.42, 0.45, 0.42, g), 0.06); // Grumbleton
    [-1, 1].forEach((sd) => { mesh(geo.s, mW, 1.66, 3.5, sd * 0.16, 0.1, 0.12, 0.08, g); mesh(geo.s, mK, 1.72, 3.5, sd * 0.16, 0.05, 0.06, 0.05, g); const br = mesh(geo.b, mK, 1.68, 3.66, sd * 0.16, 0.04, 0.04, 0.18, g); br.rotation.x = sd * 0.5; });
    mesh(geo.s, toon('#9ca3af'), 1.7, 3.28, 0, 0.12, 0.08, 0.3, g);
    P.eye = mesh(geo.b, toon('#ff3b6b', { emissive: '#7a0020' }), 1.52, 4.45, 0, 0.12, 0.25, 2.0, g); P.eye.scale.y = 0.25;
    P.lights = []; for (let i = 0; i < 8; i++) P.lights.push(mesh(geo.s8, new T.MeshBasicMaterial({ color: ['#ff4fd8', '#3ff0ff', '#ffe14d', '#7df9ff'][i % 4] }), -1.4 + (i % 4) * 0.93, 4.42 - Math.floor(i / 4) * 2.55, 1.25, 0.14, 0.14, 0.14, g));
    [-1, 1].forEach((sd) => { mesh(geo.c, m2, 0, 5.1, sd * 0.6, 0.05, 0.9, 0.05, g); mesh(geo.s8, new T.MeshBasicMaterial({ color: sd > 0 ? '#ff3b6b' : '#3ff0ff' }), 0, 5.6, sd * 0.6, 0.15, 0.15, 0.15, g); });
    P.arms = [-1, 1].map((sd) => { const a = new T.Group(); a.position.set(-0.25, 3.8, sd * 1.95); g.add(a); outline(mesh(geo.s, m2, 0, 0, 0, 0.75, 0.75, 0.75, a), 0.05); outline(mesh(geo.c, m4, 0.2, -1.1, 0, 0.4, 1.6, 0.4, a), 0.05); outline(mesh(geo.s, m3, 0.3, -2.1, 0, 0.75, 0.7, 0.7, a), 0.05); return a; });
    [-1, 1].forEach((sd) => { outline(mesh(geo.c, m4, 0, 1.0, sd * 0.85, 0.45, 1.8, 0.45, g), 0.05); outline(mesh(geo.b, m2, 0.25, 0.2, sd * 0.85, 1.5, 0.45, 0.9, g), 0.04); });
    P.jet = new T.Group(); g.add(P.jet); [-1, 1].forEach((sd) => { const f = mesh(geo.cone, new T.MeshBasicMaterial({ color: '#7df9ff', transparent: true, opacity: 0.75 }), -0.1, -0.6, sd * 0.85, 0.42, 1.3, 0.42, P.jet); f.rotation.x = Math.PI; });
    P.h = 5.2; P.w = 2.6;
  }
  stars3d(P, g);
  if (k === 6) { const w = new T.Group(); w.add(...g.children); w.scale.setScalar(0.85); g.add(w); }
  return g;
};
const baseDims = GD.Boss.dims;
GD.Boss.dims = (b) => (b.k === 5 ? (b.low ? [1.8, 1.9] : [1.8, 3.2]) : b.k === 6 ? (b.low ? [2.25, 2.1] : [2.25, 4.45]) : baseDims(b));

const baseView = GD.Boss.View;
GD.Boss.View = function (k) {
  const v = baseView(k); if (k !== 5) return v; const P = v.g.userData.P, sync = v.sync; let lx = null;
  v.sync = function (b, t, dt) { sync.call(v, b, t, dt); if (lx !== null) P.wheels.forEach((w) => { w.rotation.z -= Math.abs(b.x - lx) * 1.8; }); lx = b.x; P.body.rotation.z = b.low ? P.body.rotation.z - dt * 16 : GD.lerp(P.body.rotation.z % TAU, 0, Math.min(1, dt * 8)); P.body.position.y = b.low ? 1.2 : 0; };
  return v;
};
/* ================= boss brains: reuse the tested attack patterns, mixed per phase ================= */
const B = GD.Boss, baseCreate = B.create, baseUpdate = B.update, basePhase = B.phase;
B.create = function (k, x, y) { if (k < 5) return baseCreate(k, x, y); const b = baseCreate(0, x, y); b.k = k; b.rk = k; b.hp = b.max = k === 6 ? 8 : 4; b.mk = 0; return b; };
B.phase = (b) => { if (b.rk >= 5) { const r = b.hp / b.max; return r > 0.67 ? 0 : r > 0.34 ? 1 : 2; } return basePhase(b); };
const MIX = { 5: [[2, 0], [2, 0, 2], [0, 2, 2]], 6: [[0, 3], [3, 2, 0], [1, 3, 2, 0]] };
B.update = function (b, dt, pl) {
  if (!(b.rk >= 5)) return baseUpdate(b, dt, pl);
  if (b.st === 'idle' && b.t - dt <= 0) { const m = MIX[b.rk][B.phase(b)]; b.mk = m[(b.ci = ((b.ci || 0) + 1)) % m.length]; }
  const fly = b.mk === 1 || b.mk === 4;
  if (!fly && (b.st === 'rise')) b.st = 'idle';
  b.k = b.mk; baseUpdate(b, dt, pl); b.k = b.rk;
  for (const h of b.haz) if (h.k === 'ball' && h.c === '#ffffff') h.c = b.rk === 5 ? '#2a2a3a' : '#ffe14d';
  if (b.rk === 6 && b.st === 'charge') b.low = false;
};

/* ================= hero skins: Super (glowing aura) + Metal (chrome) ================= */
const baseHero = MD.hero, baseAnim = MD.animHero;
MD.hero = function (id, skin) {
  const g = baseHero(id, skin), sk = (GD.SKINS[id] || [])[skin || 0];
  if (!sk || !sk[4]) return g;
  const P = g.userData.parts, swap = {};
  const mat = (m) => { if (!m || !m.color || m === MD.INK) return m; const k = m.uuid; if (swap[k]) return swap[k]; const hex = '#' + m.color.getHexString();
    let n = m; if (sk[4] === 'super') n = toon(hex, { emissive: hex === '#ffffff' ? '#444444' : new T.Color(hex).multiplyScalar(0.45), nocache: true });
    else n = new T.MeshPhongMaterial({ color: hex, specular: '#ffffff', shininess: 110, emissive: new T.Color(hex).multiplyScalar(0.12) });
    return (swap[k] = n); };
  g.traverse((o) => { if (o.isMesh && o.material !== MD.INK) o.material = mat(o.material); });
  if (sk[4] === 'super') {
    const aura = new T.Group(); aura.position.y = 0.8; g.add(aura);
    const glow = new T.Mesh(geo.s, new T.MeshBasicMaterial({ color: sk[2], transparent: true, opacity: 0.22, depthWrite: false, blending: T.AdditiveBlending })); glow.scale.set(0.95, 1.15, 0.9); aura.add(glow);
    for (let i = 0; i < 6; i++) { const s = mesh(geo.oct, new T.MeshBasicMaterial({ color: i % 2 ? '#ffffff' : sk[2] }), Math.cos(i * TAU / 6) * 0.95, Math.sin(i * 2.1) * 0.45, Math.sin(i * TAU / 6) * 0.75, 0.07, 0.12, 0.07, aura); s.userData.ph = i; }
    g.userData.aura = aura; g.userData.glow = glow;
    // spiky "super" hair flick
    if (P && P.head && id !== 'candy') for (let i = 0; i < 3; i++) { const c = outline(mesh(geo.cone, mat(toon(sk[1])), -0.15 - i * 0.12, 0.35, (i - 1) * 0.2, 0.11, 0.5, 0.11, P.head), 0.12); c.rotation.z = 1.3 + i * 0.12; }
  } else {
    if (P && P.head) { const vis = mesh(geo.b, new T.MeshBasicMaterial({ color: sk[2] }), 0.38, 0.08, 0, 0.08, 0.1, 0.44, P.head); vis.userData.metal = 1; g.userData.visor = vis; }
    if (P && P.body) { const jet = mesh(geo.cone, new T.MeshBasicMaterial({ color: sk[2], transparent: true, opacity: 0.7 }), -0.38, 0.62, 0, 0.12, 0.42, 0.12, P.body); jet.rotation.z = Math.PI / 2 + 0.2; g.userData.jet = jet; }
  }
  return g;
};
MD.animHero = function (g, s, t, dt) {
  baseAnim(g, s, t, dt);
  const a = g.userData.aura;
  if (a) { a.rotation.y += dt * 3; const sp = Math.abs(s.vx || 0); g.userData.glow.material.opacity = 0.16 + Math.sin(t * 8) * 0.05 + Math.min(0.18, sp * 0.01); a.children.forEach((c) => { if (c.userData.ph != null) c.position.y = Math.sin(t * 4 + c.userData.ph * 1.7) * 0.55; });
    a.visible = !(s.roll || s.mode === 'spin' || s.mode === 'cannon') || true;
    if (sp > 13 && (g.userData.trT = (g.userData.trT || 0) - dt) <= 0) { g.userData.trT = 0.07; V.burst(s.x - (s.face || 1) * 0.6, s.y + 0.8, '#fff59e', 2, 2, 0.35, 0.3); } }
  if (g.userData.jet) { g.userData.jet.visible = Math.abs(s.vx || 0) > 6; g.userData.jet.scale.y = 0.42 * (0.8 + Math.sin(t * 40) * 0.25); }
};

/* ================= scenery for the 2 new worlds (all real 3D, merged) ================= */
V.deco = V.deco || {};
V.deco.highway = function (mg, W, rnd, x0, x1, gy, pitY) {
  const base = Math.min(0, pitY + 8);
  mg.add(geo.s, (x0 + x1) / 2, 28, -170, 26, 26, 4, '#ffe08a'); // big sunset sun
  for (let i = 0; i < 4; i++) mg.add(geo.b, (x0 + x1) / 2, 18 + i * 5.5, -165, 60, 1.2, 1, '#ff9ad5');
  for (let x = x0; x < x1; x += 12 + rnd() * 10) { const z = -60 - rnd() * 22, s = 6 + rnd() * 9, y = base - 6; mg.add(geo.b, x, y + s, z, 9 + rnd() * 8, s * 2, 7, rnd() < 0.5 ? W.far : '#c04a6a'); mg.add(geo.b, x, y + s * 2 + 0.4, z, 9.6, 0.8, 7.4, '#ffb08a'); }
  for (let x = x0; x < x1; x += 7 + rnd() * 6) {
    const z = -12 - rnd() * 12, y = Math.min(gy(x), 20) - 1.5 - rnd() * 2, s = 0.8 + rnd() * 0.6, r = rnd();
    if (r < 0.45) { // palm tree
      for (let k = 0; k < 5; k++) mg.add(geo.c, x + k * 0.18 * s, y + (0.9 + k * 1.3) * s, z, 0.32 * s, 1.4 * s, 0.32 * s, k % 2 ? '#a0662c' : '#c98b4a', 0, 0, -0.12);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; mg.add(geo.s8, x + 0.9 * s + Math.cos(a) * 1.6 * s, y + 7 * s - Math.abs(Math.sin(a)) * 0.5, z + Math.sin(a) * 1.6 * s, 1.7 * s, 0.25 * s, 0.6 * s, '#2fbf71', 0, -a, -0.35); }
    } else if (r < 0.75) { // highway overpass
      mg.add(geo.b, x - 3, y + 3.5, z, 0.9, 7, 0.9, '#d8d0ff'); mg.add(geo.b, x + 3, y + 3.5, z, 0.9, 7, 0.9, '#d8d0ff');
      mg.add(geo.b, x, y + 7.4, z, 9.5, 0.9, 2.6, '#4b4b5e'); mg.add(geo.b, x, y + 7.95, z + 1.2, 9.5, 0.25, 0.2, '#3ff0ff');
      for (let k = -4; k <= 4; k += 2) mg.add(geo.b, x + k, y + 7.92, z, 0.8, 0.04, 0.15, '#ffe14d');
    } else { // chunky 3D road sign
      mg.add(geo.c, x, y + 2.2, z, 0.12, 4.4, 0.12, '#9ca3af'); mg.add(geo.b, x, y + 4.6, z, 2.6, 1.3, 0.3, '#16a34a'); mg.add(geo.b, x, y + 4.6, z + 0.16, 2.2, 0.15, 0.05, '#ffffff'); mg.add(geo.cone, x + 0.9, y + 4.6, z + 0.18, 0.2, 0.35, 0.05, '#ffffff', 0, 0, -Math.PI / 2);
    }
  }
  for (let x = x0; x < x1; x += 3 + rnd() * 5) { const y = gy(x); if (y < pitY + 5) continue; const z = -3.6 - rnd() * 2.4;
    if (rnd() < 0.45) { mg.add(geo.cone, x, y + 0.45, z, 0.32, 0.9, 0.32, '#ff7a1a'); mg.add(geo.c, x, y + 0.45, z, 0.24, 0.14, 0.24, '#ffffff'); mg.add(geo.b, x, y + 0.04, z, 0.75, 0.08, 0.75, '#ff7a1a'); }
    else { mg.add(geo.c, x, y + 1.9, z, 0.08, 3.8, 0.08, '#cbd5e1'); mg.add(geo.b, x + 0.45, y + 3.8, z, 0.9, 0.1, 0.12, '#cbd5e1'); mg.add(geo.s8, x + 0.85, y + 3.7, z, 0.22, 0.14, 0.22, '#fff59e'); } }
};
V.deco.carnival = function (mg, W, rnd, x0, x1, gy, pitY) {
  const base = Math.min(0, pitY + 8);
  for (let i = 0; i < 140; i++) mg.add(geo.s8, x0 + rnd() * (x1 - x0), 10 + rnd() * 50, -110 - rnd() * 40, 0.15 + rnd() * 0.2, null, null, rnd() < 0.3 ? '#ffe14d' : '#ffffff');
  for (let x = x0 + 10; x < x1; x += 34 + rnd() * 20) { // ferris wheels
    const z = -65 - rnd() * 15, R = 9 + rnd() * 4, cy = base + R + 2;
    mg.add(geo.tor, x, cy, z, R, R, 3, '#ff4fd8'); mg.add(geo.tor, x, cy, z, R * 0.55, R * 0.55, 2, '#7df9ff');
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; mg.add(geo.b, x + Math.cos(a) * R / 2, cy + Math.sin(a) * R / 2, z, R, 0.25, 0.25, '#e5e7eb', 0, 0, a); mg.add(geo.s8, x + Math.cos(a) * R, cy + Math.sin(a) * R - 0.8, z + 0.4, 0.9, 0.8, 0.9, ['#ffe14d', '#3ff0ff', '#ff6b6b', '#a3e635'][k % 4]); }
    mg.add(geo.b, x - R * 0.45, base + R / 2 + 1, z - 0.6, 0.6, R + 2.5, 0.6, '#9ca3af', 0, 0, -0.35); mg.add(geo.b, x + R * 0.45, base + R / 2 + 1, z - 0.6, 0.6, R + 2.5, 0.6, '#9ca3af', 0, 0, 0.35);
  }
  for (let x = x0; x < x1; x += 6 + rnd() * 7) {
    const z = -12 - rnd() * 12, y = Math.min(gy(x), 20) - 1.5 - rnd() * 2, s = 0.8 + rnd() * 0.6, r = rnd();
    if (r < 0.4) { // striped circus tent
      for (let k = 0; k < 4; k++) mg.add(geo.c, x, y + 0.6 + k * 1.1 * s, z, 2.6 * s, 1.1 * s, 2.6 * s, k % 2 ? '#ffffff' : '#ff3b6b');
      mg.add(geo.cone, x, y + 5.6 * s, z, 3 * s, 2.6 * s, 3 * s, '#ff3b6b'); mg.add(geo.c, x, y + 7.2 * s, z, 0.06, 1.0, 0.06, '#e5e7eb'); mg.add(geo.cone, x + 0.35, y + 7.5 * s, z, 0.4, 0.5, 0.05, '#ffe14d', 0, 0, -Math.PI / 2);
    } else if (r < 0.75) { // balloon bunch
      for (let k = 0; k < 4; k++) { const bx = x + (k - 1.5) * 0.9, by = y + 6 + (k % 2) * 1.1; mg.add(geo.s, bx, by, z, 0.7, 0.85, 0.7, ['#ff4fd8', '#ffe14d', '#3ff0ff', '#a3e635'][k]); mg.add(geo.c, (bx + x) / 2, (by + y + 2) / 2, z, 0.03, by - y - 2, 0.03, '#e5e7eb', 0, 0, (bx - x) * 0.12); }
    } else { // coaster track hump
      for (let k = 0; k < 12; k++) { const u = k / 11, hx = x - 6 + u * 12, hy = y + 2 + Math.sin(u * Math.PI) * 6; mg.add(geo.b, hx, hy, z, 1.2, 0.3, 1.6, '#ffe14d', 0, 0, Math.cos(u * Math.PI) * 0.9); if (k % 3 === 0) mg.add(geo.c, hx, (hy + y) / 2, z, 0.12, hy - y, 0.12, '#7c3aed'); }
    }
  }
  for (let x = x0; x < x1; x += 3 + rnd() * 5) { const y = gy(x); if (y < pitY + 5) continue; const z = -3.6 - rnd() * 2.4;
    if (rnd() < 0.5) { mg.add(geo.c, x, y + 1.7, z, 0.08, 3.4, 0.08, '#ffe14d'); mg.add(geo.s8, x, y + 3.5, z, 0.3, 0.3, 0.3, ['#ff4fd8', '#3ff0ff', '#ffe14d'][Math.floor(rnd() * 3)]); }
    else { mg.add(geo.c, x, y + 0.5, z, 0.45, 1.0, 0.45, '#ff3b6b'); mg.add(geo.s8, x, y + 1.15, z, 0.55, 0.4, 0.55, '#fff7d6'); } }
};

/* ================= gating: teaser, title badge, live unlock, host sharing ================= */
const card = () => $('levelCard'), scr = () => $('scrLevel');
SS.teaser = function () {
  const can = SS.can(), guest = SS.hostHas() && !SS.owned();
  const sw = (n) => GD.HERO_IDS.map((id) => { const k = GD.SKINS[id][GD.SKINS[id].length - 2 + n]; return '<span class="ssSw' + (n ? ' metal' : ' super') + '" style="background:' + k[1] + ';border-color:' + k[2] + '" title="' + esc(k[0]) + '"></span>'; }).join('');
  let h = '<div class="ssTeaser" data-ss="1"><h2>\u26A1 SUPER SONIC PACK <em class="ssTag">DLC</em></h2><div class="ssList">' +
    '<div><b>\uD83C\uDFCE\uFE0F World 6: Sunset Speedway</b><small>boost lanes, loops, rails &amp; Roller Rex</small></div>' +
    '<div><b>\uD83C\uDFA1 World 7: Starlight Carnival</b><small>coasters, balloons, cannons &amp; fireworks</small></div>' +
    '<div><b>\uD83E\uDD16 MEGA BOSS: GIGA GRUMBOT</b><small>8 hits, 3 phases, every attack at once!</small></div>' +
    '<div><b>\uD83D\uDE08 BOSS MODE</b><small>play as the villain vs 3 CPU heroes</small></div>' +
    '<div><b>\u2728 Super + Metal skins</b><small>' + sw(0) + ' ' + sw(1) + '</small></div></div>';
  if (can) h += '<div class="ssOk">' + (guest ? '\uD83C\uDF89 Your host owns it, so you can play the DLC levels they pick!' : '\uD83C\uDF89 UNLOCKED! Have fun!') + '</div><div class="btncol"><button id="ssGo" class="btn primary" type="button">PLAY WORLD 6</button>' + (guest ? '' : '<button id="ssBM" class="btn pink" type="button">\uD83D\uDE08 BOSS MODE</button>') + '<button id="ssBack" class="btn alt small" type="button">BACK</button></div>';
  else h += '<div class="ssLock">\uD83D\uDD12 Unlock at the DLC Machine 3000 in Grok Arcade</div><p class="sub">Expansion \u00b7 75 tickets. It turns on by itself the moment you unlock it.</p><div class="btncol"><a id="ssArcade" class="btn primary" href="' + SS.ARCADE + '" target="_blank" rel="noopener">OPEN GROK ARCADE</a><button id="ssBack" class="btn alt small" type="button">BACK</button></div>';
  card().innerHTML = h + '</div>'; scr().classList.remove('hidden');
  $('ssBack').onclick = () => scr().classList.add('hidden');
  if ($('ssGo')) $('ssGo').onclick = () => { scr().classList.add('hidden'); if (GS.ui !== 'map') { GS.ui = 'map'; G.showScreens(); } GS.mapW = 5; G.UI.map(); };
  if ($('ssBM')) $('ssBM').onclick = () => { scr().classList.add('hidden'); BM.start(); };
};
function titleBits() {
  const col = document.querySelector('#scrTitle .btncol'); if (!col || $('bBossMode')) return;
  const b = document.createElement('button'); b.id = 'bBossMode'; b.type = 'button'; b.className = 'btn pink small'; col.querySelector('.btnrow.tight').appendChild(b);
  b.onclick = () => { Snd.init(); Snd.fx('click'); if (!G.save().name) { G.save().name = 'Lizeth'; G.persist(); } if (SS.can()) BM.start(); else SS.teaser(); };
  const badge = document.createElement('a'); badge.id = 'ssBadge'; badge.className = 'ssBadge'; badge.target = '_blank'; badge.rel = 'noopener'; col.parentNode.insertBefore(badge, $('arcadeLink'));
  badge.onclick = (e) => { if (SS.owned()) { e.preventDefault(); SS.teaser(); } };
}
function refreshTitle() {
  const b = $('bBossMode'), own = SS.owned(); if (!b) return;
  b.innerHTML = '\uD83D\uDE08 BOSS MODE ' + (own ? '<em class="ssTag">DLC</em>' : '\uD83D\uDD12');
  b.classList.toggle('ssLocked', !own);
  const bd = $('ssBadge'); bd.innerHTML = own ? '\u26A1 SUPER SONIC PACK UNLOCKED!' : '\u26A1 NEW DLC: SUPER SONIC PACK \uD83D\uDD12'; bd.classList.toggle('own', own); bd.href = own ? '#' : SS.ARCADE;
}
let wasOwn = null, wasCan = null;
function check() {
  const own = SS.owned(), can = SS.can();
  if (wasOwn === false && own) { G.toast('\u26A1 Super Sonic Pack unlocked! 2 new worlds, Super skins + BOSS MODE!'); Snd.fx('unlock'); if (N.room && N.room.isHost) N.bcast({ t: 'ssdlc', on: 1 }); }
  if (can !== wasCan && wasCan !== null) { if (GS.ui === 'map') G.UI.map(); if (GS.ui === 'hero') G.UI.heroes(); if (GS.ui === 'unlocks') G.UI.unlocks(); if (card().querySelector('[data-ss]') && !scr().classList.contains('hidden')) SS.teaser(); }
  if (own !== wasOwn) refreshTitle();
  wasOwn = own; wasCan = can;
}
SS.check = check;
setInterval(check, 1000); addEventListener('storage', (e) => { if (!e.key || e.key === SS.KEY) check(); });
// host tells guests whether it owns the pack
const baseHost = N.host, baseJoin = N.join, baseLeave = N.leave;
N.host = function (code) { baseHost(code); const room = N.room; if (!room) return; room.on('join', (p) => { if (N.room === room) room.sendTo(p.pid, { t: 'ssdlc', on: SS.owned() ? 1 : 0 }); }); room.on('open', () => { if (N.room === room) N.bcast({ t: 'ssdlc', on: SS.owned() ? 1 : 0 }); }); };
N.join = function (code) { N.hostSS = false; baseJoin(code); const room = N.room; if (!room) return; room.on('message', (d) => { if (d && d.t === 'ssdlc' && N.room === room) { N.hostSS = !!d.on; check(); } }); room.on('error', () => { N.hostSS = false; setTimeout(check, 50); }); };
N.leave = function (silent) { N.hostSS = false; baseLeave(silent); setTimeout(check, 0); };
// skins: DLC skins need the pack (or a host who has it)
const baseLoad = G.loadLevel;
G.loadLevel = function (id, o) { const s = G.save(), k = (GD.SKINS[s.hero] || [])[s.skin[s.hero] || 0]; if (k && k[3] === 'ss' && !SS.can()) s.skin[s.hero] = 0; return baseLoad(id, o); };
const baseHeroes = G.UI.heroes;
G.UI.heroes = function () { baseHeroes(); const sl = $('skinList'), inner = sl.onclick; sl.onclick = (e) => { const b = e.target.closest('[data-s]'); const s = G.save(); if (b) { const k = GD.SKINS[s.hero][+b.dataset.s]; if (k && k[3] === 'ss' && !SS.can()) { Snd.fx('click'); SS.teaser(); return; } } inner(e); }; };
const baseLevelCard = G.UI.levelCard;
G.UI.levelCard = function (l) { baseLevelCard(l); if (l.dlc) { const h2 = card().querySelector('h2'); if (h2) h2.insertAdjacentHTML('beforeend', ' <em class="ssTag">DLC</em>'); if (l.mega) { const p = card().querySelector('.sub'); if (p) p.innerHTML = '\uD83E\uDD16 MEGA BOSS! 8 hits and 3 phases. Dodge the flashing warnings, then bop it while it\u2019s dizzy (\u2B50)!'; } } };

/* ================= BOSS MODE: you are GIGA GRUMBOT vs 3 CPU heroes ================= */
const BM = SS.BM = { brave: 0.2 };
const AX0 = -5.4, AX1 = 45.4, PLATS = [[6, 11, 4.2], [29, 34, 4.2]];
let S = null;
function hud(on) {
  let el = $('bmHud');
  if (!el) {
    el = document.createElement('div'); el.id = 'bmHud'; el.className = 'hidden';
    el.innerHTML = '<div class="bmTop"><div class="bmMe"><b>\uD83E\uDD16 GIGA GRUMBOT</b><div class="bmBar"><i id="bmHp"></i></div><div class="bmBar heat"><i id="bmHeat"></i></div><small id="bmHeatT">HEAT</small></div><div id="bmTime" class="pill">2:30</div><div id="bmHeroes"></div><button id="bmQuit" class="rbtn" type="button" aria-label="Quit">\u2716</button></div><div id="bmHelp">\u25C0\u25B6 stomp around \u00b7 JUMP = big leap + shockwave \u00b7 \uD83D\uDC4A = zap beam (in the air: bomb drop) \u00b7 DASH = rocket charge \u00b7 don\u2019t OVERHEAT!</div>';
    document.body.appendChild(el); $('bmQuit').onclick = () => BM.quit();
  }
  el.classList.toggle('hidden', !on); document.body.classList.toggle('bm', !!on);
  if (on) { $('hud').classList.remove('hidden'); $('bAtk').innerHTML = '\u26A1'; $('bDash').textContent = 'CHARGE'; $('bJump').textContent = 'LEAP'; }
  else { $('bAtk').innerHTML = '\uD83D\uDC4A'; $('bDash').textContent = 'DASH'; $('bJump').textContent = 'JUMP'; }
}
const HEROES = [['grok', 2, 'Grok'], ['speedy', 40, 'Speedy'], ['floaty', 10, 'Floaty']];
BM.start = function (opt) {
  opt = opt || {};
  if (!SS.can()) { SS.teaser(); return; }
  if (N.room) { G.toast('Boss Mode is single player. Leave the room to play it!', true); return; }
  G.UI.closeAll();
  const def = GD.lvById('7-B'), L = GD.buildLevel(def), W = GD.WORLDS[6];
  V.build(L, W, {});
  const b = B.create(6, 30, 0); b.st = 'idle'; b.t = 0; b.hp = b.max = 10; b.face = -1;
  S = { L, W, b, view: B.View(6), t: 0, clock: 150, heat: 0, cd: 0, vy: 0, g: true, done: false, act: null, shake: 0, wins: 0,
    heroes: HEROES.map((h, i) => ({ id: h[0], name: h[2], x: h[1], y: 0, vx: 0, vy: 0, face: 1, g: true, hp: 4, inv: 1.2, ko: false, dodgeT: 0, koT: 0, mesh: V.add(MD.hero(h[0], 0)), think: i * 0.4, tx: h[1], brave: 0, bub: null })) };
  S.heroes.forEach((h) => { h.bub = V.add(new T.Mesh(geo.s, new T.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.35, depthWrite: false }))); h.bub.scale.setScalar(1.25); h.bub.visible = false; });
  GS.ui = 'bossmode'; G.showScreens(); hud(true); GS.modeTick = tick; BM.auto = !!opt.auto;
  V.camX = 20; V.camY = 3; V.camTo(20, 3, 0.016, true, 1.15);
  Snd.music(9); G.banner('YOU ARE GIGA GRUMBOT!', 2.2); $('bmHelp').style.display = ''; Snd.fx('warn');
  drawHud(true);
};
BM.quit = function () { if (!S) return; S = null; GS.modeTick = null; hud(false); GS.ui = 'title'; G.showScreens(); G.menuScene(); Snd.music(6); };
function haz(o) { o.id = ++S.b.hid; o.warn = o.warn || 0; o.life = o.life == null ? 1 : o.life; S.b.haz.push(o); return o; }
function nearestHero(dirOnly) { let best = null, bd = 1e9; for (const h of S.heroes) { if (h.ko) continue; const d = h.x - S.b.x; if (dirOnly && Math.sign(d) !== S.b.face && Math.abs(d) > 2) continue; if (Math.abs(d) < bd) { bd = Math.abs(d); best = h; } } return best; }
function heat(n) { S.heat += n; if (S.heat >= 100) { S.heat = 100; S.b.st = 'stun'; S.b.t = 3.0; S.b.vuln = true; S.b.low = true; S.act = null; G.banner('OVERHEAT! The heroes can bop you!', 1.6); Snd.fx('no'); } }
function botBoss(inp) {
  const b = S.b, h = nearestHero(false); inp.lx = 0; inp.jumpP = inp.atkP = inp.dashP = false; if (!h) return;
  const d = h.x - b.x; if (Math.abs(d) > 7) inp.lx = Math.sign(d); else if (Math.abs(d) < 3) inp.lx = -Math.sign(d);
  b.face = Math.sign(d) || b.face;
  if (S.heat < 62 && S.cd <= 0) { const r = (S.t * 7) % 3; if (r < 1.6) inp.atkP = true; else if (r < 2.4 && S.g) inp.jumpP = true; else inp.dashP = true; }
}
function step(dt, inp) {
  const b = S.b; S.t += dt; if (!S.done) S.clock -= dt; S.cd -= dt; S.shake = Math.max(0, S.shake - dt);
  if (BM.auto) botBoss(inp);
  // hazards
  for (const h of b.haz) {
    if (h.warn > 0) { h.warn -= dt; if (h.warn <= 0 && h.k !== 'mark') { Snd.fx('boom'); S.shake = 0.2; } continue; }
    h.life -= dt; if (h.k === 'wave') { h.x += h.vx * dt; if (h.x < AX0 - 3 || h.x > AX1 + 3) h.life = 0; }
  }
  b.haz = b.haz.filter((h) => h.life > 0 || h.warn > 0);
  if (!(b.st === 'stun' || b.st === 'hurt')) S.heat = Math.max(0, S.heat - dt * 16);
  // boss control
  if (b.st === 'dead') { b.t -= dt; b.y = Math.max(0, b.y - dt * 2); }
  else if (b.st === 'stun' || b.st === 'hurt') { b.t -= dt; if (b.st === 'stun') S.heat = Math.max(0, S.heat - dt * 30); if (b.t <= 0) { b.st = 'idle'; b.vuln = false; b.low = false; } }
  else if (!S.done) {
    if (S.act === 'charge') { b.x += b.face * 19 * dt; S.actT -= dt; b.st = 'charge'; if (b.x < AX0 + 2.6 || b.x > AX1 - 2.6) { b.x = clamp(b.x, AX0 + 2.6, AX1 - 2.6); S.act = null; b.st = 'stun'; b.t = 1.3; b.vuln = true; b.low = true; Snd.fx('boom'); S.shake = 0.35; G.banner('BONK!', 0.8); } else if (S.actT <= 0) { S.act = null; b.st = 'idle'; } }
    else {
      const lx = inp.lx; if (lx) b.face = lx > 0 ? 1 : -1;
      b.x = clamp(b.x + lx * (S.g ? 7.5 : 6) * dt, AX0 + 2.6, AX1 - 2.6); b.st = lx && S.g ? 'walk' : S.g ? 'idle' : 'leap';
      if (inp.jumpP && S.g && S.heat < 100) { S.vy = 17; S.g = false; heat(18); Snd.fx('jump'); }
      if (inp.atkP && S.cd <= 0) {
        S.cd = 0.4;
        if (!S.g) { for (let i = -1; i <= 1; i++) haz({ k: 'bomb', x: clamp(b.x + i * 3.2, AX0 + 1, AX1 - 1), y: 0, w: 2.6, h: 2.6, warn: 0.9, life: 0.4, sx: b.x, sy: b.y + 2, c: '#ffb02e' }); heat(26); Snd.fx('warn'); }
        else { const h = nearestHero(true), x = clamp(h ? h.x : b.x + b.face * 7, AX0 + 1, AX1 - 1); haz({ k: 'col', x, y: 0, w: 2.0, h: 14, warn: 0.75, life: 0.45, c: '#ff4fd8' }); heat(17); Snd.fx('warn'); }
      }
      if (inp.dashP && S.g && S.heat < 100) { S.act = 'charge'; S.actT = 1.4; heat(28); Snd.fx('dash'); haz({ k: 'arrow', x: b.x + b.face * 3.5, y: 1, w: 2, h: 1, warn: 0.3, life: 0, dir: b.face }); }
    }
    if (!S.g) { S.vy -= 34 * dt; b.y += S.vy * dt; if (b.y <= 0) { b.y = 0; S.g = true; S.vy = 0; haz({ k: 'wave', x: b.x - 2.8, y: 0, w: 1.0, h: 0.9, vx: -10, life: 6 }); haz({ k: 'wave', x: b.x + 2.8, y: 0, w: 1.0, h: 0.9, vx: 10, life: 6 }); Snd.fx('boom'); S.shake = 0.4; } }
  }
  // heroes
  const d = B.dims(b), bx0 = b.x - d[0], bx1 = b.x + d[0], by1 = b.y + d[1];
  const boxes = []; for (const h of b.haz) { if (h.warn > 0 || h.k === 'mark' || h.k === 'arrow') continue; boxes.push([h.x - h.w / 2, h.y, h.x + h.w / 2, h.y + h.h]); }
  if (S.act === 'charge' || (!S.g && S.vy < 0)) boxes.push([bx0, b.y, bx1, by1]);
  for (const h of S.heroes) {
    if (h.ko) { h.koT += dt; h.y += dt * 2.5; continue; }
    h.inv = Math.max(0, h.inv - dt); h.think -= dt;
    // brain
    const dx = b.x - h.x, warnHere = b.haz.some((z) => z.warn > 0 && (z.k === 'col' || z.k === 'bomb' || z.k === 'mark') && Math.abs(z.x - h.x) < z.w / 2 + 1.2);
    const waveNear = b.haz.some((z) => z.k === 'wave' && z.warn <= 0 && Math.abs(z.x - h.x) < 2.4 && Math.sign(h.x - z.x) === Math.sign(z.vx));
    h.dodgeT -= dt;
    if (h.think <= 0 && h.dodgeT <= 0) { h.think = 0.35 + Math.random() * 0.4; h.brave = b.vuln ? 1 : Math.random() < BM.brave ? 1 : 0;
      const side = h.x < b.x ? -1 : 1; h.tx = b.vuln || h.brave ? b.x : clamp(b.x + side * (6 + Math.random() * 5), AX0 + 1, AX1 - 1); if (Math.abs(h.tx - b.x) < 4 && !b.vuln && !h.brave) h.tx = clamp(b.x - side * 8, AX0 + 1, AX1 - 1); }
    let want = Math.sign(h.tx - h.x); if (Math.abs(h.tx - h.x) < 0.6) want = 0;
    if (warnHere && Math.random() < dt * 9) { const z = b.haz.find((q) => q.warn > 0 && Math.abs(q.x - h.x) < q.w / 2 + 1.2); if (z) { h.tx = clamp(h.x + (h.x < z.x ? -1 : 1) * 4.5, AX0 + 1, AX1 - 1); if (h.tx === AX0 + 1 || h.tx === AX1 - 1) h.tx = clamp(z.x + (h.x < z.x ? 1 : -1) * 4.5, AX0 + 1, AX1 - 1); want = Math.sign(h.tx - h.x); h.dodgeT = 0.7; } }
    const spd = h.id === 'speedy' ? 10 : h.id === 'floaty' ? 7.5 : 8.5;
    h.vx = GD.lerp(h.vx, want * spd, Math.min(1, dt * 6)); if (Math.abs(h.vx) > 0.3) h.face = h.vx > 0 ? 1 : -1;
    if (h.g && ((waveNear && Math.random() < 0.85) || ((b.vuln || h.brave) && Math.abs(dx) < 3.4) || (Math.random() < dt * 0.3))) { h.vy = h.id === 'floaty' ? 18.5 : 18; h.g = false; }
    h.vy -= (h.id === 'floaty' && h.vy < 0 ? 22 : 38) * dt; h.x = clamp(h.x + h.vx * dt, AX0, AX1); const py = h.y; h.y += h.vy * dt;
    if (h.y <= 0) { h.y = 0; h.vy = 0; h.g = true; } else { h.g = false; for (const p of PLATS) if (h.vy < 0 && h.x > p[0] && h.x < p[1] && py >= p[2] - 0.05 && h.y <= p[2]) { h.y = p[2]; h.vy = 0; h.g = true; } }
    // bop the boss when it's dizzy
    const canBop = b.vuln || (h.brave && (b.st === 'idle' || b.st === 'walk'));
    if (canBop && b.st !== 'hurt' && b.st !== 'dead' && h.vy < 0 && h.x > bx0 - 0.3 && h.x < bx1 + 0.3 && h.y < by1 + 0.4 && h.y > by1 - 1.2) { h.vy = 14; b.hp--; b.st = 'hurt'; b.t = 0.9; b.vuln = false; b.low = false; h.brave = 0; Snd.fx('bosshit'); V.burst(b.x, by1, '#ffe14d', 16, 8, 0.8, 0.5); G.banner(h.name.toUpperCase() + ' BOPPED YOU! ' + b.hp + ' HP left', 1.1); if (b.hp <= 0) { b.st = 'dead'; b.t = 2; end(false); } }
    // get hit by your attacks
    if (h.inv <= 0 && !S.done) for (const q of boxes) if (h.x + 0.4 > q[0] && h.x - 0.4 < q[2] && h.y + 1.5 > q[1] && h.y < q[3]) { h.hp--; h.inv = 1.6; h.vx = (h.x < b.x ? -1 : 1) * 9; h.vy = 10; h.g = false; Snd.fx('hurt'); V.burst(h.x, h.y + 1, '#ffffff', 12, 6, 0.6, 0.4);
      if (h.hp <= 0) { h.ko = true; h.koT = 0; Snd.fx('pop'); G.banner(h.name.toUpperCase() + ' IS OUT!', 1.2); if (S.heroes.every((q) => q.ko)) end(true); } break; }
  }
  if (!S.done && S.clock <= 0) { S.clock = 0; end(false, true); }
}
function end(win, timeUp) {
  if (S.done) return; S.done = true; S.win = win; const s = G.save(); s.ssBM = s.ssBM || { wins: 0, plays: 0, best: 0 }; s.ssBM.plays++;
  const used = 150 - S.clock; if (win) { s.ssBM.wins++; if (!s.ssBM.best || used < s.ssBM.best) s.ssBM.best = +used.toFixed(1); }
  G.persist(); Snd.fx(win ? 'unlock' : 'die'); G.banner(win ? 'VILLAIN VICTORY!' : timeUp ? 'TIME UP! The heroes win' : 'THE HEROES WIN!', 2.2);
  setTimeout(() => { if (!S) return; const r = $('resultCard'); r.innerHTML = '<div class="res"><h2>' + (win ? '\uD83D\uDE08 VILLAIN VICTORY!' : '\uD83E\uDDB8 THE HEROES WIN!') + '</h2>' +
    '<div class="resrow"><span>\uD83E\uDDB8 Heroes knocked out</span><b>' + S.heroes.filter((h) => h.ko).length + '/3</b></div><div class="resrow"><span>\u2764\uFE0F Robot HP left</span><b>' + Math.max(0, S.b.hp) + '/10</b></div>' +
    '<div class="resrow"><span>\u23F1 Time</span><b>' + GD.fmtTime(used) + '</b></div><div class="resrow"><span>\uD83C\uDFC6 Boss Mode wins</span><b>' + s.ssBM.wins + (s.ssBM.best ? ' (best ' + GD.fmtTime(s.ssBM.best) + ')' : '') + '</b></div>' +
    '<div class="btncol"><button id="bmAgain" class="btn primary" type="button">PLAY AGAIN</button><button id="bmOut" class="btn alt" type="button">TITLE</button></div></div>';
    $('scrResult').classList.remove('hidden'); $('bmAgain').onclick = () => { $('scrResult').classList.add('hidden'); BM.start({ auto: BM.auto }); }; $('bmOut').onclick = () => { $('scrResult').classList.add('hidden'); BM.quit(); }; }, BM.fast ? 0 : 1800);
}
function render(dt) {
  const b = S.b, t = S.t;
  const hw = V.viewHalf()[0]; let cx = clamp(b.x, AX0 + hw - 0.6, AX1 - hw + 0.6); if (hw * 2 > 52) cx = 20;
  V.camTo(cx + (S.shake > 0 ? Math.sin(t * 80) * 0.25 : 0), 3.2, dt, false, 1.15);
  S.view.sync(b, t, dt);
  for (const h of S.heroes) {
    const s = { x: h.x, y: h.y, vx: h.vx, vy: h.vy, face: h.face, mode: 'run', g: h.g ? 1 : 0, glide: h.id === 'floaty' && !h.g && h.vy < 0 ? 1 : 0, atk: 0, inv: h.inv > 0 ? 1 : 0, landT: 0 };
    MD.animHero(h.mesh, s, t, dt); h.bub.visible = h.ko && h.koT < 2.5; h.bub.position.set(h.x, h.y + 0.8, 0); if (h.ko) h.mesh.visible = h.koT < 2.5;
  }
  V.updateFx(dt);
}
let hudT = 0;
function drawHud(force, dt) {
  if (!S) return; hudT -= dt || 0.016; if (hudT > 0 && !force) return; hudT = 0.1;
  $('bmHp').style.width = (100 * Math.max(0, S.b.hp) / 10) + '%'; $('bmHeat').style.width = S.heat + '%'; $('bmHeat').parentNode.classList.toggle('hot', S.heat > 70 || S.b.st === 'stun');
  $('bmHeatT').textContent = S.b.st === 'stun' && S.b.vuln ? 'OVERHEATED! cooling\u2026' : 'HEAT ' + Math.round(S.heat) + '%';
  if (GS.bannerT > 0) { GS.bannerT -= 0.1; if (GS.bannerT <= 0) $('banner').classList.add('hidden'); }
  if (S.t > 9) $('bmHelp').style.display = 'none';
  $('bmTime').textContent = GD.fmtTime(Math.max(0, S.clock)).replace(/\.\d$/, '');
  $('bmHeroes').innerHTML = S.heroes.map((h) => '<span class="bmH' + (h.ko ? ' ko' : '') + '">' + GD.HEROES[h.id].icon + ' ' + h.name + ' ' + (h.ko ? 'OUT' : '\u2764\uFE0F'.repeat(h.hp)) + '</span>').join('');
}
function tick(dt) {
  if (!S) return; const inp = G.inp;
  if (!S.done || S.b.st === 'dead') { const n = Math.ceil(dt / (1 / 120)); for (let i = 0; i < n; i++) { step(dt / n, inp); inp.jumpP = inp.atkP = inp.dashP = false; } }
  render(dt); drawHud(false, dt);
}
// headless: fast-forward a match with the autopilot (for tests)
BM.sim = function (sec) { BM.fast = true; BM.start({ auto: true }); const inp = { lx: 0 }; let t = 0; while (t < (sec || 150) && !S.done) { step(1 / 60, inp); t += 1 / 60; } const r = { done: S.done, win: !!S.win, ko: S.heroes.filter((h) => h.ko).length, hp: S.b.hp, t: +t.toFixed(1) }; BM.fast = false; return r; };
BM.setHeat = (v) => { if (S) S.heat = v; };
BM.state = () => S && { hp: S.b.hp, heat: S.heat, st: S.b.st, x: S.b.x, done: S.done, win: S.win, heroes: S.heroes.map((h) => ({ id: h.id, hp: h.hp, ko: h.ko, x: +h.x.toFixed(1) })), haz: S.b.haz.length, clock: S.clock };

/* boot */
titleBits(); check();
window.__gd.SS = SS;
})();
