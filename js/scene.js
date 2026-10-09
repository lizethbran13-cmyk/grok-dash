/* Grok Dash - renderer, camera, level scenery (merged), props, parallax backdrops, fx */
(function () {
'use strict';
const GD = window.GD, T = window.THREE, MD = GD.MD;
const V = GD.View = { fx: [] };
let R, scene, cam, root, sun, hemi;
V.init = function (canvas) {
  R = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  scene = new T.Scene();
  cam = new T.PerspectiveCamera(42, 1, 0.5, 400);
  hemi = new T.HemisphereLight(0xffffff, 0x8888aa, 0.75); scene.add(hemi);
  sun = new T.DirectionalLight(0xffffff, 0.7); sun.position.set(-8, 20, 14); scene.add(sun);
  root = new T.Group(); scene.add(root);
  V.scene = scene; V.cam = cam; V.R = R;
  V.resize(); V.camX = 0; V.camY = 0;
  // fx pool
  for (let i = 0; i < 90; i++) { const s = MD.glow('#ffffff', 0.5); s.visible = false; scene.add(s); V.fx.push({ s, life: 0 }); }
};
V.resize = function () {
  const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  V.dist = w >= h ? 17.5 : 27;
};
function skyTex(a, b, stars) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new T.CanvasTexture(c); return t;
}
function clearLevel() { while (root.children.length) { const o = root.children.pop(); o.traverse((m) => { if (m.geometry && m.geometry !== MD.geo.s && !Object.values(MD.geo).includes(m.geometry) && m.geometry !== MD.ringGeo && m.geometry !== MD.sparkGeo) m.geometry.dispose(); }); } }

/* ---------- build ---------- */
V.build = function (L, W, opts) {
  clearLevel(); opts = opts || {};
  const space = opts.space;
  scene.background = skyTex(space ? '#05021a' : W.sky[0], space ? '#2a0b4a' : W.sky[1]);
  scene.fog = new T.Fog(space ? '#1a0b3a' : W.fog, 40, 140);
  hemi.color.set(W.id === 1 || W.id === 3 || space ? '#c4b5fd' : '#ffffff'); hemi.intensity = W.id === 1 || space ? 0.9 : 0.75;
  const rnd = GD.rng(L.def.seed * 7 + 3);
  const mg = MD.Merger();
  const top = W.top, side = W.side, side2 = W.side2;
  const Vt = (x, y, z) => new T.Vector3(x, y, z);
  const pitY = L.pitY;
  for (const s of L.S) {
    if (s.k === 'rail' || s.k === 'crumble' || s.k === 'mover') continue;
    if (s.k === 'cloud') { const n = Math.ceil((s.x1 - s.x0) / 1.4); for (let i = 0; i <= n; i++) mg.add(MD.geo.s8, s.x0 + i * (s.x1 - s.x0) / n, s.y0 - 0.45, 0, 0.9 + rnd() * 0.3, 0.6, 1.1, '#ffffff'); continue; }
    const pl = s.k === 'p', zf = pl ? 1.2 : 1.7, zb = pl ? -1.2 : -2.6;
    const bot = Math.max(s.yb, pitY - 6);
    const cTop = pl && !s.blk ? W.plat : top, cs1 = pl ? (s.blk ? side : W.plat) : side, cs2 = pl ? side2 : side2;
    // top face
    mg.quad(Vt(s.x0, s.y0, zf), Vt(s.x1, s.y1, zf), Vt(s.x1, s.y1, zb), Vt(s.x0, s.y0, zb), cTop);
    // front face (gradient)
    mg.quad(Vt(s.x0, bot, zf), Vt(s.x1, bot, zf), Vt(s.x1, s.y1, zf), Vt(s.x0, s.y0, zf), cs1, cs2);
    // grass lip
    if (!pl || s.blk) mg.quad(Vt(s.x0, s.y0 - 0.45, zf + 0.12), Vt(s.x1, s.y1 - 0.45, zf + 0.12), Vt(s.x1, s.y1 + 0.02, zf + 0.12), Vt(s.x0, s.y0 + 0.02, zf + 0.12), cTop);
    // ends
    mg.quad(Vt(s.x0, bot, zb), Vt(s.x0, bot, zf), Vt(s.x0, s.y0, zf), Vt(s.x0, s.y0, zb), cs1, cs2);
    mg.quad(Vt(s.x1, bot, zf), Vt(s.x1, bot, zb), Vt(s.x1, s.y1, zb), Vt(s.x1, s.y1, zf), cs1, cs2);
    // flowers / tufts on ground
    if (!pl && !s.wall) for (let x = s.x0 + 0.7; x < s.x1 - 0.5; x += 1.6 + rnd() * 2.5) {
      const y = GD.Phys.top(s, x), z = -1.0 - rnd() * 1.3;
      if (W.id === 0 || W.id === 4) mg.add(MD.geo.s8, x, y + 0.15, z, 0.18, 0.18, 0.18, rnd() < 0.5 ? '#ff6bd6' : '#ffe14d');
      mg.add(MD.geo.cone, x + 0.3, y + 0.25, z + 0.3, 0.15, 0.5, 0.15, W.tuft || (W.id === 2 ? '#d8f3ff' : W.id === 1 ? '#3ff0ff' : W.id === 3 ? '#8a7a6a' : '#3fae4a'));
    }
  }
  // rails
  for (const s of L.S) if (s.k === 'rail') {
    const len = Math.hypot(s.x1 - s.x0, s.y1 - s.y0), ang = Math.atan2(s.y1 - s.y0, s.x1 - s.x0);
    mg.add(MD.geo.c, (s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2 - 0.12, 0, 0.13, len, 0.13, '#e5e7eb', 0, 0, ang - Math.PI / 2);
    mg.add(MD.geo.c, (s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2 - 0.12, -0.6, 0.08, len, 0.08, '#94a3b8', 0, 0, ang - Math.PI / 2);
    for (let x = s.x0 + 1; x < s.x1; x += 4) { const y = GD.Phys.top(s, x); mg.add(MD.geo.c, x, y - 4.5, -0.3, 0.1, 8.6, 0.1, '#64748b'); }
  }
  // backdrop layers (parallax by real depth)
  const x0 = -40, x1 = L.len + 60;
  const gy = (x) => { const g = GD.Phys.groundAt(L.S, x, -999, 999); return g ? Math.min(g[1], 999) : pitY + 6; };
  decorate(mg, W, rnd, x0, x1, gy, pitY, space, L);
  root.add(mg.build());
  // floor of the pit: water / lava / clouds / neon
  const pitCol = space ? '#2a0b4a' : W.pit || ['#38bdf8', '#ff4fd8', '#bfe8ff', '#ff5a1a', '#ffffff'][W.id];
  const pit = new T.Mesh(new T.PlaneGeometry(x1 - x0 + 200, 120), new T.MeshBasicMaterial({ color: pitCol, transparent: true, opacity: W.id === 4 ? 0.9 : 0.75, fog: true }));
  pit.rotation.x = -Math.PI / 2; pit.position.set((x0 + x1) / 2, pitY + 4.5, -40); root.add(pit);
  V.pit = pit;
};
function decorate(mg, W, rnd, x0, x1, gy, pitY, space, L) {
  if (!space && V.deco && V.deco[W.bg]) { V.deco[W.bg](mg, W, rnd, x0, x1, gy, pitY, L); return; }
  const base = Math.min(0, pitY + 8);
  // far layer z=-60..-80
  for (let x = x0; x < x1; x += 14 + rnd() * 10) {
    const z = -60 - rnd() * 20, s = 8 + rnd() * 10, y = base - 6;
    if (space) { mg.add(MD.geo.s8, x, 18 + rnd() * 20, z - 40, 0.3, 0.3, 0.3, '#ffffff'); continue; }
    if (W.bg === 'jungle') mg.add(MD.geo.s, x, y + s * 0.4, z, s, s * 0.7, s * 0.6, rnd() < 0.5 ? W.far : '#6cc28a');
    else if (W.bg === 'city') mg.add(MD.geo.b, x, y + s, z, 5 + rnd() * 5, s * 2.6, 5, rnd() < 0.5 ? W.far : '#36206a');
    else if (W.bg === 'snow') { mg.add(MD.geo.cone, x, y + s, z, s, s * 2.4, s, W.far); mg.add(MD.geo.cone, x, y + s * 1.85, z + 0.5, s * 0.4, s * 0.75, s * 0.4, '#ffffff'); }
    else if (W.bg === 'factory') { mg.add(MD.geo.b, x, y + s * 0.8, z, 7, s * 1.6, 5, W.far); mg.add(MD.geo.c, x + 2, y + s * 2, z, 0.8, s * 1.5, 0.8, '#4a2a1a'); }
    else { mg.add(MD.geo.s8, x, y + s * 0.6 + rnd() * 8, z, s * 0.9, s * 0.35, s * 0.4, rnd() < 0.5 ? '#ffffff' : W.far); }
  }
  if (space) for (let i = 0; i < 160; i++) mg.add(MD.geo.s8, x0 + rnd() * (x1 - x0), -10 + rnd() * 60, -70 - rnd() * 40, 0.12 + rnd() * 0.2, null, null, rnd() < 0.2 ? '#ffe14d' : '#ffffff');
  // mid layer z=-14..-24
  for (let x = x0; x < x1; x += 5 + rnd() * 6) {
    const z = -12 - rnd() * 12, y = Math.min(gy(x), 20) - 1.5 - rnd() * 2, s = 0.8 + rnd() * 0.7;
    if (space) { if (rnd() < 0.3) mg.add(MD.geo.ico, x, y + 6 + rnd() * 10, z, s * 1.5, null, null, '#5b4b8a'); continue; }
    if (W.bg === 'jungle') {
      if (rnd() < 0.7) { mg.add(MD.geo.c, x, y + 3 * s, z, 0.35 * s, 6 * s, 0.35 * s, '#7a4a1e'); mg.add(MD.geo.s8, x, y + 6.5 * s, z, 2.2 * s, 1.6 * s, 1.8 * s, W.mid); mg.add(MD.geo.s8, x + 1.2 * s, y + 5.8 * s, z + 0.5, 1.5 * s, 1.1 * s, 1.3 * s, '#3fae4a'); }
      else { mg.add(MD.geo.b, x, y + 3 * s, z, 1.6 * s, 6 * s, 1.6 * s, '#c9b58a'); mg.add(MD.geo.b, x, y + 6.3 * s, z, 2.2 * s, 0.6 * s, 2.2 * s, '#a8956a'); }
    } else if (W.bg === 'city') {
      const h = 6 + rnd() * 14; mg.add(MD.geo.b, x, y + h / 2, z, 3 + rnd() * 2, h, 3, rnd() < 0.5 ? W.mid : '#3a2470');
      for (let k = 2; k < h - 1; k += 1.6) mg.add(MD.geo.b, x, y + k, z + 1.55, 2.4, 0.35, 0.05, rnd() < 0.5 ? '#3ff0ff' : rnd() < 0.5 ? '#ff4fd8' : '#ffe14d');
    } else if (W.bg === 'snow') {
      for (let k = 0; k < 3; k++) mg.add(MD.geo.cone, x, y + (1.6 + k * 1.3) * s, z, (1.6 - k * 0.4) * s, 2 * s, (1.6 - k * 0.4) * s, k === 2 ? '#e0f2fe' : '#2f6b5a');
    } else if (W.bg === 'factory') {
      if (rnd() < 0.5) { mg.add(MD.geo.c, x, y + 4, z, 0.9, 8, 0.9, '#5a4a4a'); mg.add(MD.geo.c, x, y + 8.2, z, 1.1, 0.5, 1.1, '#ff7a1a'); }
      else mg.add(MD.geo.c, x, y + 2 + rnd() * 4, z, 0.5, 8, 0.5, '#7a6a6a', 0, 0, Math.PI / 2);
    } else {
      if (rnd() < 0.4) { mg.add(MD.geo.c, x, y + 4, z, 1.2, 8, 1.2, '#ffffff'); mg.add(MD.geo.cone, x, y + 9, z, 1.6, 2.4, 1.6, '#ff9ad5'); }
      else mg.add(MD.geo.s8, x, y + 3 + rnd() * 6, z, 2.2, 1.0, 1.4, '#ffffff');
    }
  }
  // near background bushes / props z=-4..-6
  if (!space) for (let x = x0; x < x1; x += 3 + rnd() * 5) {
    const y = gy(x); if (y < pitY + 5) continue; const z = -3.6 - rnd() * 2.4, s = 0.6 + rnd() * 0.6;
    const c = W.bg === 'jungle' ? '#2e9b4a' : W.bg === 'city' ? '#4b2a8a' : W.bg === 'snow' ? '#ffffff' : W.bg === 'factory' ? '#5a4a4a' : '#ffe0f4';
    if (W.bg === 'city' && rnd() < 0.5) { mg.add(MD.geo.c, x, y + 1.6, z, 0.07, 3.2, 0.07, '#9ca3af'); mg.add(MD.geo.s8, x, y + 3.3, z, 0.3, 0.3, 0.3, '#fff36b'); }
    else mg.add(MD.geo.s8, x, y + 0.4 * s, z, 1.3 * s, 0.9 * s, 0.8 * s, c);
  }
}

/* ---------- objects ---------- */
V.add = (o) => { root.add(o); return o; };
V.remove = (o) => { if (o && o.parent) o.parent.remove(o); };
V.instanced = function (geo, mat, n) { const m = new T.InstancedMesh(geo, mat, Math.max(1, n)); m.instanceMatrix.setUsage(T.DynamicDrawUsage); root.add(m); return m; };

/* ---------- fx ---------- */
V.burst = function (x, y, col, n, sp, size, life) {
  for (let i = 0, k = 0; i < V.fx.length && k < n; i++) {
    const f = V.fx[i]; if (f.life > 0) continue; k++;
    f.life = f.max = (life || 0.5) * (0.7 + Math.random() * 0.6); f.s.visible = true; f.s.material.color.set(col); f.s.position.set(x, y, 0.6);
    const a = Math.random() * Math.PI * 2, v = (sp || 6) * (0.4 + Math.random() * 0.6); f.vx = Math.cos(a) * v; f.vy = Math.sin(a) * v; f.sz = (size || 0.6);
  }
};
V.updateFx = function (dt) {
  for (const f of V.fx) {
    if (f.life <= 0) continue; f.life -= dt;
    if (f.life <= 0) { f.s.visible = false; continue; }
    f.s.position.x += f.vx * dt; f.s.position.y += f.vy * dt; f.vy -= 6 * dt;
    f.s.scale.setScalar(f.sz * (f.life / f.max)); f.s.material.opacity = Math.min(1, f.life / f.max * 1.5);
  }
};

/* ---------- camera ---------- */
V.camTo = function (tx, ty, dt, snap, zoom) {
  const k = snap ? 1 : 1 - Math.exp(-dt * 5);
  V.camX += (tx - V.camX) * k; V.camY += (ty - V.camY) * (snap ? 1 : 1 - Math.exp(-dt * 3.5));
  const d = V.dist * (zoom || 1);
  cam.position.set(V.camX, V.camY + 3.4, d); cam.lookAt(V.camX, V.camY + 1.0, 0);
  sun.position.set(V.camX - 8, V.camY + 20, 14); sun.target.position.set(V.camX, V.camY, 0); sun.target.updateMatrixWorld();
};
V.viewHalf = function () { const d = V.dist, h = Math.tan(cam.fov * Math.PI / 360) * d; return [h * cam.aspect, h]; };
V.project = function (x, y, z) { const v = new T.Vector3(x, y, z || 0).project(cam); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, v.z < 1]; };
V.render = function () { R.render(scene, cam); };
})();
