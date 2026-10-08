/* Grok Dash - meshes: toon materials, outlines, heroes, foes, bosses, props, geometry merger */
(function () {
'use strict';
const GD = window.GD, T = window.THREE;
const M = GD.MD = {};
const grad = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 1; const x = c.getContext('2d'); ['#6a6a6a', '#b0b0b0', '#ffffff', '#ffffff'].forEach((k, i) => { x.fillStyle = k; x.fillRect(i, 0, 1, 1); }); const t = new T.CanvasTexture(c); t.minFilter = t.magFilter = T.NearestFilter; return t; })();
const cache = {};
M.toon = (col, o) => { o = o || {}; const k = col + JSON.stringify(o); if (!o.nocache && cache[k]) return cache[k]; const m = new T.MeshToonMaterial(Object.assign({ color: col, gradientMap: grad }, o)); delete m.nocache; if (!o.nocache) cache[k] = m; return m; };
M.basic = (col, o) => new T.MeshBasicMaterial(Object.assign({ color: col }, o || {}));
const INK = new T.MeshBasicMaterial({ color: 0x1a0d2a, side: T.BackSide });
M.INK = INK;
const geo = {
  s: new T.SphereGeometry(1, 18, 14), s8: new T.SphereGeometry(1, 10, 8), b: new T.BoxGeometry(1, 1, 1), c: new T.CylinderGeometry(1, 1, 1, 16),
  cone: new T.ConeGeometry(1, 1, 12), tor: new T.TorusGeometry(1, 0.22, 8, 24), ico: new T.IcosahedronGeometry(1, 0), oct: new T.OctahedronGeometry(1, 0)
};
M.geo = geo;
function mesh(g, m, x, y, z, sx, sy, sz, par) { const o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.scale.set(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz); if (par) par.add(o); return o; }
M.mesh = mesh;
function outline(o, w) { const k = new T.Mesh(o.geometry, INK); k.scale.setScalar(1 + (w || 0.12)); o.add(k); return o; }
M.outline = outline;

/* ---------- geometry merger (vertex colours) ---------- */
M.Merger = function () {
  const P = [], N = [], C = []; const m4 = new T.Matrix4(), n3 = new T.Matrix3(), v = new T.Vector3(), col = new T.Color();
  return {
    add(g, x, y, z, sx, sy, sz, color, rx, ry, rz) {
      const gg = g.index ? g.toNonIndexed() : g, pa = gg.attributes.position, na = gg.attributes.normal;
      m4.compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx, sy == null ? sx : sy, sz == null ? sx : sz)); n3.getNormalMatrix(m4);
      col.set(color);
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m4); P.push(v.x, v.y, v.z); v.fromBufferAttribute(na, i).applyMatrix3(n3).normalize(); N.push(v.x, v.y, v.z); C.push(col.r, col.g, col.b); }
    },
    quad(a, b, c, d, color, color2) { // 4 corners (ccw), optional bottom colour for gradient
      const c1 = new T.Color(color), c2 = new T.Color(color2 || color);
      const e1 = new T.Vector3().subVectors(b, a), e2 = new T.Vector3().subVectors(d, a), n = new T.Vector3().crossVectors(e1, e2).normalize();
      [[a, c2], [b, c2], [c, c1], [a, c2], [c, c1], [d, c1]].forEach(([p, cc]) => { P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); C.push(cc.r, cc.g, cc.b); });
    },
    count: () => P.length / 3,
    build(mat) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3)); g.computeBoundingSphere(); return new T.Mesh(g, mat || M.toon(0xffffff, { vertexColors: true })); }
  };
};

/* ---------- heroes ---------- */
M.hero = function (id, skin) {
  const h = GD.HEROES[id] || GD.HEROES.grok, sk = (GD.SKINS[id] || GD.SKINS.grok)[skin || 0] || GD.SKINS[id][0];
  const c1 = sk[1], c2 = sk[2];
  const g = new T.Group(), body = new T.Group(); g.add(body);
  const mBody = M.toon(c1), mAcc = M.toon(c2), mW = M.toon('#ffffff'), mK = M.toon('#1a0d2a'), mGlove = M.toon('#ffffff'), mShoe = M.toon(id === 'candy' ? '#3a3a44' : c2);
  const parts = { body };
  if (id === 'candy') {
    parts.torso = outline(mesh(geo.s, mBody, 0, 0.7, 0, 0.55, 0.45, 0.42, body));
    parts.head = new T.Group(); parts.head.position.set(0.35, 1.2, 0); body.add(parts.head);
    outline(mesh(geo.s, mBody, 0, 0, 0, 0.42, 0.4, 0.38, parts.head));
    mesh(geo.s, mW, 0.32, -0.12, 0, 0.26, 0.22, 0.26, parts.head); // beard/snout
    mesh(geo.s, mK, 0.55, -0.02, 0, 0.08, 0.08, 0.08, parts.head);
    mesh(geo.s, mW, 0.25, 0.18, 0.0, 0.2, 0.06, 0.32, parts.head); // brows
    [-1, 1].forEach((sd) => { mesh(geo.s, mK, 0.22, 0.08, sd * 0.2, 0.07, 0.09, 0.07, parts.head); const e = mesh(geo.s, M.toon('#5a5a66'), -0.08, 0.3, sd * 0.28, 0.12, 0.26, 0.08, parts.head); e.rotation.z = 0.4; });
    parts.tail = mesh(geo.s, mBody, -0.55, 0.95, 0, 0.08, 0.22, 0.08, body);
    const col = mesh(geo.tor, M.toon(c2 === '#ffffff' ? '#ff4fd8' : c2), 0.22, 0.98, 0, 0.26, 0.26, 0.5, body); col.rotation.y = Math.PI / 2;
  } else {
    parts.torso = outline(mesh(geo.s, mBody, 0, 0.62, 0, 0.36, 0.4, 0.32, body));
    mesh(geo.s, mW, 0.12, 0.58, 0, 0.26, 0.3, 0.24, body); // belly
    parts.head = new T.Group(); parts.head.position.set(0, 1.25, 0); body.add(parts.head);
    outline(mesh(geo.s, mBody, 0, 0, 0, 0.44, 0.42, 0.4, parts.head));
    // eyes
    [-1, 1].forEach((sd) => { const e = mesh(geo.s, mW, 0.3, 0.06, sd * 0.13, 0.13, 0.17, 0.1, parts.head); mesh(geo.s, mK, 0.42, 0.06, sd * 0.13, 0.06, 0.09, 0.05, parts.head); e.rotation.y = 0.3 * sd; });
    mesh(geo.s, M.toon('#ff8fb0'), 0.4, -0.12, 0, 0.07, 0.04, 0.12, parts.head); // smile
    if (id === 'grok') { // spiky lightning tuft
      for (let i = 0; i < 3; i++) { const c = outline(mesh(geo.cone, mAcc, -0.1 - i * 0.12, 0.42 - i * 0.04, (i - 1) * 0.14, 0.12, 0.42, 0.12, parts.head), 0.15); c.rotation.z = 0.6 + i * 0.2; }
      parts.spin = new T.Group(); parts.spin.position.set(0, 0.5, 0); parts.head.add(parts.spin);
      for (let i = 0; i < 2; i++) { const bl = mesh(geo.s, mAcc, 0, 0, 0, 0.7, 0.04, 0.12, parts.spin); bl.rotation.y = i * Math.PI / 2; }
      parts.spin.visible = false;
      mesh(geo.tor, mAcc, 0, 0.62, 0, 0.18, 0.18, 0.4, body).rotation.y = Math.PI / 2; // scarf
    } else if (id === 'speedy') { // quills
      for (let i = 0; i < 4; i++) { const c = outline(mesh(geo.cone, mBody, -0.35, 0.25 - i * 0.18, 0, 0.14, 0.55, 0.14, parts.head), 0.12); c.rotation.z = 1.9 + i * 0.12; }
      mesh(geo.b, mAcc, 0.18, 0.22, 0, 0.12, 0.08, 0.7, parts.head); // headband
      parts.spin = null;
    } else if (id === 'floaty') { // big ears -> helicopter
      parts.spin = new T.Group(); parts.spin.position.set(0, 0.38, 0); parts.head.add(parts.spin);
      [-1, 1].forEach((sd) => { const e = outline(mesh(geo.s, mAcc, 0, 0.1, sd * 0.42, 0.14, 0.12, 0.5, parts.spin), 0.12); e.rotation.x = sd * 0.5; });
      mesh(geo.s, M.toon('#ffe14d', { emissive: '#664400' }), 0, 0.3, 0, 0.1, 0.1, 0.1, parts.spin);
    }
  }
  // floating hands + feet (Rayman style)
  parts.hands = [-1, 1].map((sd) => outline(mesh(geo.s, mGlove, 0.1, 0.65, sd * 0.48, 0.17, 0.17, 0.17, body), 0.15));
  parts.feet = [-1, 1].map((sd) => outline(mesh(geo.s, mShoe, 0.08, 0.12, sd * 0.2, 0.26, 0.14, 0.16, body), 0.12));
  parts.ball = outline(mesh(geo.s, mBody, 0, 0.6, 0, 0.6, 0.6, 0.6, g), 0.08); parts.ball.visible = false;
  for (let i = 0; i < 3; i++) mesh(geo.b, mAcc, 0, 0, 0, 1.25, 0.12, 0.2, parts.ball).rotation.z = i * 1.05;
  g.userData.parts = parts; g.userData.id = id;
  return g;
};
// animate a hero group from a (local or remote) player snapshot
M.animHero = function (g, s, t, dt) {
  const P = g.userData.parts; if (!P) return;
  const ball = s.roll || s.mode === 'spin' || s.mode === 'cannon';
  P.ball.visible = ball; P.body.visible = !ball;
  g.position.set(s.x, s.y, 0);
  const face = s.face || 1;
  g.rotation.y = GD.lerp(g.rotation.y, face > 0 ? -0.45 : -2.69, Math.min(1, dt * 14));
  g.rotation.z = s.mode === 'loop' || s.mode === 'qpipe' ? (s.ang || 0) * face : 0;
  if (ball) { P.ball.rotation.z -= (s.mode === 'spin' ? 30 : Math.abs(s.vx) * 0.9) * dt; P.ball.scale.setScalar(s.mode === 'spin' ? 0.55 + 0.05 * Math.sin(t * 50) : 0.6); P.ball.position.y = 0.6; return; }
  const sp = Math.abs(s.vx), run = s.g && sp > 0.5, ph = t * (6 + sp * 0.9);
  const air = !s.g;
  P.body.rotation.z = run ? -Math.min(0.35, sp * 0.016) : air ? (s.vy > 0 ? -0.15 : 0.1) : 0;
  P.body.position.y = run ? Math.abs(Math.sin(ph)) * 0.08 : 0;
  const sq = s.landT > 0 ? 0.85 : 1; P.body.scale.set(1 / Math.sqrt(sq), sq, 1);
  P.feet.forEach((f, i) => {
    const o = i ? Math.PI : 0;
    if (run && sp > 16) { f.position.x = 0.1 + Math.cos(ph * 1.4 + o) * 0.35; f.position.y = 0.2 + Math.sin(ph * 1.4 + o) * 0.18; }
    else if (run) { f.position.x = 0.05 + Math.sin(ph + o) * 0.32; f.position.y = 0.12 + Math.max(0, Math.cos(ph + o)) * 0.18; }
    else if (air) { f.position.x = i ? -0.15 : 0.15; f.position.y = 0.05 + (s.glide ? 0.15 : i * 0.15); }
    else { f.position.x = 0.08; f.position.y = 0.12; }
  });
  P.hands.forEach((hn, i) => {
    const o = i ? Math.PI : 0;
    if (s.atk) { hn.position.x = i ? 0.9 : 0.2; hn.position.y = 0.75; hn.scale.setScalar(i ? 0.26 : 0.17); }
    else if (s.glide || s.mode === 'hook') { hn.position.x = 0.05; hn.position.y = 1.85; hn.scale.setScalar(0.17); }
    else if (run) { hn.position.x = 0.1 - Math.sin(ph + o) * 0.3; hn.position.y = 0.68; hn.scale.setScalar(0.17); }
    else { hn.position.x = 0.12; hn.position.y = 0.62 + Math.sin(t * 3 + o) * 0.04 + (air ? 0.35 : 0); hn.scale.setScalar(0.17); }
  });
  if (P.spin) { P.spin.visible = g.userData.id !== 'grok' || !!s.glide; P.spin.rotation.y += (s.glide ? 22 : 0) * dt; }
  if (P.tail) P.tail.rotation.z = Math.sin(t * 14) * 0.5;
  P.head.rotation.z = s.mode === 'spin' ? 0 : Math.sin(t * 2) * 0.04;
  g.visible = !(s.inv > 0 && Math.floor(t * 18) % 2 === 0);
};

/* ---------- foes ---------- */
M.foe = function (k, col) {
  const g = new T.Group(), m = M.toon(col), mW = M.toon('#ffffff'), mK = M.toon('#1a0d2a');
  const eyes = (par, y, x, s) => [-1, 1].forEach((sd) => { mesh(geo.s, mW, x, y, sd * 0.2 * s, 0.14 * s, 0.16 * s, 0.1 * s, par); mesh(geo.s, mK, x + 0.08 * s, y, sd * 0.2 * s, 0.07 * s, 0.09 * s, 0.06 * s, par); const b = mesh(geo.b, mK, x + 0.02, y + 0.17 * s, sd * 0.2 * s, 0.05, 0.05, 0.26 * s, par); b.rotation.x = sd * 0.5; });
  const body = new T.Group(); g.add(body); g.userData.body = body;
  if (k === 'walker' || k === 'spiky') {
    outline(mesh(geo.s, m, 0, 0.62, 0, 0.62, 0.55, 0.55, body)); eyes(body, 0.75, 0.45, 1);
    mesh(geo.s, M.toon('#ffffff'), 0.5, 0.42, 0, 0.12, 0.06, 0.25, body);
    g.userData.feet = [-1, 1].map((sd) => mesh(geo.s, mK, 0.1, 0.1, sd * 0.3, 0.2, 0.1, 0.14, body));
    if (k === 'spiky') for (let i = 0; i < 5; i++) { const c = outline(mesh(geo.cone, M.toon('#e5e7eb'), -0.3 + i * 0.15, 1.18 - Math.abs(i - 2) * 0.08, 0, 0.12, 0.4, 0.12, body), 0.15); c.rotation.z = (i - 2) * -0.35; }
  } else if (k === 'hopper') {
    outline(mesh(geo.s, m, 0, 0.55, 0, 0.5, 0.5, 0.5, body)); eyes(body, 0.66, 0.38, 0.9);
    mesh(geo.c, M.toon('#ffe14d'), 0, 0.08, 0, 0.18, 0.2, 0.18, body);
  } else if (k === 'flyer') {
    outline(mesh(geo.s, m, 0, 0, 0, 0.5, 0.42, 0.42, body)); eyes(body, 0.08, 0.36, 0.9);
    g.userData.wings = [-1, 1].map((sd) => { const w = mesh(geo.s, M.toon('#ffffff', { transparent: true, opacity: 0.85 }), -0.1, 0.35, sd * 0.4, 0.35, 0.06, 0.3, body); return w; });
  }
  return g;
};

/* ---------- props ---------- */
M.ringGeo = new T.TorusGeometry(0.36, 0.09, 8, 20);
M.ringMat = M.toon('#ffd23f', { emissive: '#7a5200' });
M.sparkGeo = new T.OctahedronGeometry(0.26, 0);
M.sparkMat = new T.MeshBasicMaterial({ color: '#fff36b' });
M.glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
M.glow = (col, s) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: M.glowTex, color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); sp.scale.setScalar(s || 1); return sp; };
M.emojiTex = (() => { const c = {}; return (e) => { if (c[e]) return c[e]; const cv = document.createElement('canvas'); cv.width = cv.height = 96; const x = cv.getContext('2d'); x.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 48, 54); return (c[e] = new T.CanvasTexture(cv)); }; })();
M.cage = function (crit) {
  const g = new T.Group(), mB = M.toon('#6b4a2a'), mBar = M.toon('#3a3a4a');
  outline(mesh(geo.b, mB, 0, 0.12, 0, 1.4, 0.24, 1.0, g), 0.06); outline(mesh(geo.b, mB, 0, 1.75, 0, 1.4, 0.2, 1.0, g), 0.06);
  for (let i = 0; i < 6; i++) mesh(geo.c, mBar, -0.6 + i * 0.24, 0.95, 0.45, 0.04, 1.5, 0.04, g);
  const sp = new T.Sprite(new T.SpriteMaterial({ map: M.emojiTex(crit), transparent: true })); sp.position.set(0, 0.95, 0); sp.scale.setScalar(1.1); g.add(sp); g.userData.crit = sp;
  const gl = M.glow('#ffe14d', 2.6); gl.position.set(0, 0.95, -0.3); g.add(gl);
  return g;
};
M.checkpoint = function () {
  const g = new T.Group();
  outline(mesh(geo.c, M.toon('#e5e7eb'), 0, 1.2, 0, 0.08, 2.4, 0.08, g), 0.2);
  const ball = outline(mesh(geo.s, M.toon('#94a3b8'), 0, 2.5, 0, 0.3, 0.3, 0.3, g), 0.1); g.userData.ball = ball;
  const fl = mesh(geo.b, M.toon('#94a3b8'), 0.45, 2.05, 0, 0.8, 0.5, 0.05, g); g.userData.flag = fl;
  return g;
};
M.goal = function () {
  const g = new T.Group();
  outline(mesh(geo.c, M.toon('#e5e7eb'), 0, 1.6, 0, 0.12, 3.2, 0.12, g), 0.15);
  const pan = new T.Group(); pan.position.y = 3.6; g.add(pan); g.userData.pan = pan;
  outline(mesh(geo.c, M.toon('#ffd23f'), 0, 0, 0, 1.0, 0.12, 1.0, pan), 0.06).rotation.x = Math.PI / 2;
  const sp = new T.Sprite(new T.SpriteMaterial({ map: M.emojiTex('\u2B50'), transparent: true })); sp.scale.setScalar(1.5); pan.add(sp);
  const gl = M.glow('#fff3a0', 5); gl.position.y = 3.6; g.add(gl);
  return g;
};
M.spring = function () {
  const g = new T.Group();
  outline(mesh(geo.c, M.toon('#64748b'), 0, 0.1, 0, 0.6, 0.2, 0.6, g), 0.08);
  const coil = mesh(geo.c, M.toon('#e5e7eb'), 0, 0.35, 0, 0.3, 0.4, 0.3, g); g.userData.coil = coil;
  const top = outline(mesh(geo.c, M.toon('#ff3b5c', { emissive: '#400010' }), 0, 0.6, 0, 0.62, 0.18, 0.62, g), 0.08); g.userData.top = top;
  return g;
};
M.boost = function (dir) {
  const g = new T.Group();
  mesh(geo.b, M.toon('#334155'), 0, 0.05, 0, 2.0, 0.12, 1.4, g);
  const am = new T.MeshBasicMaterial({ color: '#ffe14d' });
  for (let i = 0; i < 3; i++) { const a = mesh(geo.cone, am, -0.55 + i * 0.55, 0.14, 0, 0.22, 0.4, 0.06, g); a.rotation.z = -Math.PI / 2 * dir; a.rotation.x = Math.PI / 2; }
  g.userData.arrows = am;
  return g;
};
M.hook = function () {
  const g = new T.Group();
  const r = outline(mesh(geo.tor, M.toon('#a855f7', { emissive: '#3b0764' }), 0, 0, 0, 0.45, 0.45, 0.45, g), 0.12);
  g.add(M.glow('#d8b4fe', 2.2)); g.userData.ring = r;
  return g;
};
M.cannon = function () {
  const g = new T.Group();
  outline(mesh(geo.s, M.toon('#475569'), 0, 0.5, 0, 0.9, 0.6, 0.8, g), 0.06);
  const bar = new T.Group(); bar.position.y = 0.8; bar.rotation.z = -(90 - 52) * Math.PI / 180; g.add(bar);
  outline(mesh(geo.c, M.toon('#1e293b'), 0, 0.8, 0, 0.5, 1.6, 0.5, bar), 0.08);
  mesh(geo.tor, M.toon('#ffd23f'), 0, 1.55, 0, 0.5, 0.5, 0.5, bar).rotation.x = Math.PI / 2;
  g.userData.bar = bar;
  return g;
};
M.fan = function (h) {
  const g = new T.Group();
  outline(mesh(geo.c, M.toon('#94a3b8'), 0, 0.15, 0, 1.2, 0.3, 1.0, g), 0.06);
  const bl = new T.Group(); bl.position.y = 0.35; g.add(bl); g.userData.bl = bl;
  for (let i = 0; i < 3; i++) mesh(geo.b, M.toon('#e5e7eb'), 0, 0, 0, 2.0, 0.06, 0.3, bl).rotation.y = i * 1.05;
  const col = mesh(geo.c, new T.MeshBasicMaterial({ color: '#c4f1ff', transparent: true, opacity: 0.14, depthWrite: false }), 0, h / 2, 0, 1.2, h, 0.9, g);
  g.userData.col = col;
  const streaks = []; for (let i = 0; i < 8; i++) { const s = mesh(geo.b, new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6 }), (Math.random() - 0.5) * 1.8, Math.random() * h, 0.5, 0.05, 0.8, 0.05, g); streaks.push(s); }
  g.userData.streaks = streaks; g.userData.h = h;
  return g;
};
M.spikes = function (w, fire) {
  const g = new T.Group(), n = Math.max(2, Math.round(w / 0.5));
  if (fire) {
    mesh(geo.b, M.toon('#3a3a44'), 0, 0.1, 0, w, 0.2, 1.2, g);
    const fl = mesh(geo.cone, new T.MeshBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: 0.85 }), 0, 1.2, 0, w * 0.45, 2.4, 0.5, g); g.userData.fl = fl;
    const warn = mesh(geo.b, new T.MeshBasicMaterial({ color: '#ffb02e' }), 0, 0.22, 0, w, 0.06, 1.0, g); g.userData.warn = warn;
  } else for (let i = 0; i < n; i++) outline(mesh(geo.cone, M.toon('#e5e7eb'), -w / 2 + (i + 0.5) * (w / n), 0.35, 0, 0.22, 0.7, 0.22, g), 0.12);
  return g;
};
M.bush = function (col) {
  const g = new T.Group(), m = M.toon(col);
  [[-0.6, 0.6, 0.8], [0.3, 0.8, 1.0], [1.0, 0.5, 0.7]].forEach((b) => outline(mesh(geo.s, m, b[0], b[1], 0, b[2], b[2] * 0.9, 0.7, g), 0.05));
  return g;
};
M.critterFx = function (crit) { const sp = new T.Sprite(new T.SpriteMaterial({ map: M.emojiTex(crit), transparent: true })); sp.scale.setScalar(1.2); return sp; };

/* ---------- bosses ---------- */
M.boss = function (k) {
  const g = new T.Group(), P = {}; g.userData.P = P;
  const mW = M.toon('#ffffff'), mK = M.toon('#1a0d2a');
  const eyes = (par, x, y, z, s, angry) => [-1, 1].forEach((sd) => { mesh(geo.s, mW, x, y, z + sd * 0.45 * s, 0.32 * s, 0.38 * s, 0.2 * s, par); mesh(geo.s, mK, x + 0.18 * s, y, z + sd * 0.45 * s, 0.15 * s, 0.2 * s, 0.1 * s, par); if (angry) { const b = mesh(geo.b, mK, x + 0.05, y + 0.42 * s, z + sd * 0.45 * s, 0.1, 0.1, 0.6 * s, par); b.rotation.x = sd * 0.45; } });
  if (k === 0) { // totem
    const m1 = M.toon('#b7793a'), m2 = M.toon('#5fd35a');
    outline(mesh(geo.b, m1, 0, 1.3, 0, 2.4, 2.6, 2.0, g), 0.04); eyes(g, 1.22, 1.7, 0, 1, true);
    outline(mesh(geo.b, m1, 0, 3.4, 0, 2.0, 1.6, 1.8, g), 0.04); eyes(g, 1.02, 3.5, 0, 0.7, false);
    for (let i = 0; i < 5; i++) { const l = outline(mesh(geo.cone, m2, -0.2, 4.6, (i - 2) * 0.35, 0.25, 1.2, 0.25, g), 0.1); l.rotation.x = (i - 2) * 0.35; }
    mesh(geo.b, M.toon('#ffd23f'), 1.22, 0.7, 0, 0.1, 0.4, 1.4, g);
    P.h = 4.4; P.w = 1.3;
  } else if (k === 1) { // DJ Volt hover robot
    const m1 = M.toon('#2a2350'), m2 = M.toon('#3ff0ff', { emissive: '#0a6a7a' });
    outline(mesh(geo.s, m1, 0, 1.6, 0, 1.6, 1.2, 1.4, g), 0.05);
    mesh(geo.b, m2, 1.2, 1.8, 0, 0.6, 0.5, 1.8, g); eyes(g, 1.52, 1.85, 0, 0.7, true);
    [-1, 1].forEach((sd) => { outline(mesh(geo.c, M.toon('#ff4fd8'), 0, 2.2, sd * 1.4, 0.55, 0.3, 0.55, g), 0.06).rotation.x = Math.PI / 2; });
    P.jet = mesh(geo.cone, new T.MeshBasicMaterial({ color: '#7df9ff', transparent: true, opacity: 0.7 }), 0, 0.2, 0, 0.6, 1.2, 0.6, g); P.jet.rotation.x = Math.PI;
    P.h = 2.8; P.w = 1.5;
  } else if (k === 2) { // Yeti King
    const m1 = M.toon('#f8fafc'), m2 = M.toon('#7cc4f0');
    outline(mesh(geo.s, m1, 0, 1.5, 0, 1.5, 1.5, 1.3, g), 0.04);
    outline(mesh(geo.s, m1, 0.5, 2.9, 0, 0.95, 0.85, 0.9, g), 0.05);
    mesh(geo.s, m2, 1.15, 2.85, 0, 0.45, 0.5, 0.6, g); eyes(g, 1.25, 3.05, 0, 0.55, true);
    for (let i = 0; i < 5; i++) mesh(geo.cone, M.toon('#ffe14d'), 0.4, 3.85, (i - 2) * 0.3, 0.12, 0.45, 0.12, g);
    P.arms = [-1, 1].map((sd) => outline(mesh(geo.s, m1, 0.6, 1.6, sd * 1.4, 0.45, 0.9, 0.45, g), 0.06));
    P.h = 3.8; P.w = 1.4;
  } else if (k === 3) { // Furnace crab
    const m1 = M.toon('#ff5a1a'), m2 = M.toon('#4a3a3a');
    outline(mesh(geo.s, m1, 0, 1.4, 0, 2.0, 1.1, 1.4, g), 0.04);
    P.eye = mesh(geo.s, M.toon('#ffe14d', { emissive: '#ff8800' }), 1.0, 2.6, 0, 0.45, 0.45, 0.45, g);
    mesh(geo.c, m2, 0.6, 2.2, 0, 0.12, 0.8, 0.12, g);
    P.claws = [-1, 1].map((sd) => { const c = new T.Group(); c.position.set(1.4, 1.6, sd * 1.4); g.add(c); outline(mesh(geo.s, m1, 0.6, 0.3, 0, 0.7, 0.45, 0.4, c), 0.06); return c; });
    for (let i = 0; i < 3; i++) [-1, 1].forEach((sd) => mesh(geo.c, m2, -0.6 + i * 0.6, 0.4, sd * 1.2, 0.1, 0.9, 0.1, g));
    P.h = 2.8; P.w = 1.9;
  } else { // Mecha-Grumbleton saucer
    const m1 = M.toon('#a78bfa'), m2 = M.toon('#e5e7eb');
    outline(mesh(geo.s, m2, 0, 1.0, 0, 2.4, 0.55, 2.0, g), 0.04);
    mesh(geo.tor, M.toon('#ffe14d', { emissive: '#664400' }), 0, 1.0, 0, 2.2, 2.2, 1.0, g).rotation.x = Math.PI / 2;
    const dome = mesh(geo.s, new T.MeshToonMaterial({ color: '#bfe8ff', gradientMap: grad, transparent: true, opacity: 0.55 }), 0, 1.5, 0, 1.2, 1.1, 1.1, g);
    // grumpy pilot
    outline(mesh(geo.s, M.toon('#fcd5b4'), 0.1, 1.75, 0, 0.55, 0.55, 0.5, g), 0.06); eyes(g, 0.55, 1.85, 0, 0.45, true);
    mesh(geo.s, M.toon('#9ca3af'), 0.4, 1.55, 0, 0.35, 0.18, 0.4, g); // moustache
    P.dome = dome; P.h = 2.6; P.w = 2.2;
    P.lights = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P.lights.push(mesh(geo.s, new T.MeshBasicMaterial({ color: i % 2 ? '#ff4fd8' : '#3ff0ff' }), Math.cos(a) * 2.2, 0.85, Math.sin(a) * 1.8, 0.15, 0.15, 0.15, g)); }
  }
  P.stars = new T.Group(); g.add(P.stars); P.stars.position.y = P.h + 0.4; P.stars.visible = false;
  for (let i = 0; i < 4; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: M.emojiTex('\u2B50'), transparent: true })); s.scale.setScalar(0.6); s.position.set(Math.cos(i * 1.57) * 0.9, 0, Math.sin(i * 1.57) * 0.9); P.stars.add(s); }
  return g;
};
})();
