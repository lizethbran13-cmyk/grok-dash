/* Grok Dash - bosses: host-simulated state machines with telegraphed attacks + rendering */
(function () {
'use strict';
const GD = window.GD, T = window.THREE, MD = GD.MD, clamp = GD.clamp;
const B = GD.Boss = {};
const X0 = -4, X1 = 44;
B.create = function (k, x, y) {
  return { k, x, y: k === 1 ? 6 : k === 4 ? 7.5 : 0, vx: 0, hp: k === 4 ? 6 : 3, max: k === 4 ? 6 : 3, st: 'intro', t: 2.2, face: -1, vuln: false, haz: [], n: 0, tx: 20, sx: x, sy: 0, ev: [], hid: 0, low: false };
};
B.phase = (b) => (b.k === 4 ? (b.hp > 4 ? 0 : b.hp > 2 ? 1 : 2) : b.hp < b.max ? (b.hp <= 1 ? 2 : 1) : 0);
B.dims = (b) => { const d = [[1.3, 4.4], [1.6, 2.8], [1.4, 3.8], [1.9, 2.8], [2.3, 2.4]][b.k]; return b.low ? [d[0], 1.7] : d; };
function haz(b, o) { o.id = ++b.hid; o.warn = o.warn || 0; o.life = o.life == null ? 1 : o.life; b.haz.push(o); return o; }
function target(b, pl) { const a = pl.filter((p) => p.alive); const p = a.length ? a[Math.floor(Math.random() * a.length)] : { x: 20, y: 0 }; return clamp(p.x, X0 + 1, X1 - 1); }
function go(b, st, t) { b.st = st; b.t = t; }
B.update = function (b, dt, pl) {
  b.ev.length = 0;
  // hazards
  for (const h of b.haz) {
    if (h.warn > 0) { h.warn -= dt; if (h.warn <= 0 && h.k !== 'mark') b.ev.push(h.k === 'wave' ? 'boom' : 'boom'); continue; }
    h.life -= dt;
    if (h.k === 'wave') { h.x += h.vx * dt; if (h.x < X0 - 3 || h.x > X1 + 3) h.life = 0; }
    if (h.k === 'ball') { h.vy -= (h.g || 30) * dt; h.x += h.vx * dt; h.y += h.vy * dt; if (h.y <= 0) { if (h.bounce > 0) { h.bounce--; h.y = 0; h.vy = 13; } else { h.life = 0; haz(b, { k: 'col', x: h.x, y: 0, w: 1.8, h: 1.6, life: 0.3, c: h.c }); b.ev.push('boom'); } } if (h.x < X0 - 2 || h.x > X1 + 2) h.vx = -h.vx; }
  }
  b.haz = b.haz.filter((h) => h.life > 0 || h.warn > 0);
  if (b.st === 'dead') { b.t -= dt; b.y = Math.max(0, b.y - dt * 2); return; }
  b.t -= dt; const ph = B.phase(b);
  const fly = b.k === 1 || b.k === 4;
  if (fly && (b.st === 'idle' || b.st === 'zap' || b.st === 'bombs')) { b.y += ((b.k === 4 ? 7.5 : 6) + Math.sin(performance.now() / 400) * 0.6 - b.y) * Math.min(1, dt * 3); b.x += (b.tx - b.x) * Math.min(1, dt * 0.9); }
  switch (b.st) {
    case 'intro': if (b.t <= 0) go(b, 'idle', 0.6); break;
    case 'idle':
      b.vuln = false; b.low = false;
      if (b.t <= 0) {
        b.n = 0;
        if (b.k === 0) { go(b, 'aim', 0.75); b.tx = target(b, pl); haz(b, { k: 'mark', x: b.tx, y: 0, w: 2.8, h: 0.2, warn: 1.75, life: 0 }); b.ev.push('warn'); }
        else if (b.k === 1) { b.tx = clamp(target(b, pl) + (Math.random() < 0.5 ? -7 : 7), X0 + 3, X1 - 3); go(b, 'zap', 0.4); }
        else if (b.k === 2) go(b, 'throw', 0.5);
        else if (b.k === 3) { b.tx = clamp(target(b, pl) + (Math.random() < 0.5 ? -6 : 6), X0 + 3, X1 - 3); go(b, 'walk', 1.2); }
        else { b.tx = clamp(target(b, pl), X0 + 4, X1 - 4); go(b, 'bombs', 0.6); }
      }
      break;
    case 'aim': if (b.t <= 0) { b.sx = b.x; go(b, 'leap', 1.0); b.ev.push('jump'); } break;
    case 'leap': {
      const u = 1 - Math.max(0, b.t) / 1.0; b.x = GD.lerp(b.sx, b.tx, u); b.y = 7.5 * 4 * u * (1 - u); b.face = b.tx > b.sx ? 1 : -1;
      if (b.t <= 0) {
        b.y = 0; b.ev.push('boom'); const sp = 8 + ph * 1.8;
        haz(b, { k: 'wave', x: b.x - 1.4, y: 0, w: 1.0, h: 0.9, vx: -sp, life: 6 }); haz(b, { k: 'wave', x: b.x + 1.4, y: 0, w: 1.0, h: 0.9, vx: sp, life: 6 });
        b.n++;
        if (b.n < 1 + (ph > 0 ? 1 : 0) + (ph > 1 ? 1 : 0)) { b.tx = target(b, pl); haz(b, { k: 'mark', x: b.tx, y: 0, w: 2.8, h: 0.2, warn: 1.5, life: 0 }); go(b, 'aim', 0.5); b.ev.push('warn'); }
        else go(b, 'stun', 2.8);
      }
      break;
    }
    case 'zap':
      if (b.t <= 0) {
        if (b.n < 3) { const x = target(b, pl); haz(b, { k: 'col', x, y: 0, w: 1.9, h: 14, warn: 1.0, life: 0.45, c: b.k === 4 ? '#ff4fd8' : '#3ff0ff' }); b.ev.push('warn'); b.n++; b.t = 0.95 - ph * 0.1;
          if (b.k === 1 && ph > 0 && b.n === 2) for (let i = 0; i < 2; i++) haz(b, { k: 'ball', x: b.x, y: b.y - 1, vx: (i ? 5 : -5), vy: 4, g: 22, w: 0.9, h: 0.9, life: 8, bounce: 2, c: '#ffe14d' }); }
        else { b.n = 0; if (b.k === 4) { go(b, 'drop', 0.8); haz(b, { k: 'mark', x: b.x, y: 0, w: 4.4, h: 0.2, warn: 0.8, life: 0 }); } else { go(b, 'drop', 0.8); haz(b, { k: 'mark', x: b.x, y: 0, w: 3.4, h: 0.2, warn: 0.8, life: 0 }); } b.ev.push('warn'); }
      }
      break;
    case 'bombs':
      if (b.t <= 0) {
        if (b.n < 3 + ph) { const x = clamp(target(b, pl) + (b.n % 2 ? 3 : -3) * (b.n > 1 ? 1 : 0), X0 + 1, X1 - 1); haz(b, { k: 'bomb', x, y: 0, w: 2.6, h: 2.6, warn: 1.25, life: 0.4, sx: b.x, sy: b.y, c: '#ffb02e' }); b.ev.push('warn'); b.n++; b.t = 0.7; }
        else if (ph >= 1) { b.n = 0; go(b, 'zap', 0.8); b.st = 'zap'; b.k4z = true; }
        else { go(b, 'drop', 0.9); haz(b, { k: 'mark', x: b.x, y: 0, w: 4.4, h: 0.2, warn: 0.9, life: 0 }); }
      }
      break;
    case 'drop': if (b.t <= 0) { go(b, 'fall', 0.45); b.sy = b.y; } break;
    case 'fall': {
      const u = 1 - Math.max(0, b.t) / 0.45; b.y = b.sy * (1 - u * u);
      if (b.t <= 0) { b.y = 0; b.ev.push('boom'); if (b.k === 4 && ph >= 2) { haz(b, { k: 'wave', x: b.x - 2.4, y: 0, w: 1.0, h: 0.9, vx: -9, life: 6 }); haz(b, { k: 'wave', x: b.x + 2.4, y: 0, w: 1.0, h: 0.9, vx: 9, life: 6 }); } go(b, 'stun', 2.8); }
      break;
    }
    case 'throw':
      if (b.t <= 0) {
        if (b.n < 2 + ph) { const x = target(b, pl), ft = 1.1, sx = b.x + b.face * 1.2, sy = 3.6; b.face = x > b.x ? 1 : -1; haz(b, { k: 'mark', x, y: 0, w: 1.8, h: 0.2, warn: ft, life: 0 }); haz(b, { k: 'ball', x: sx, y: sy, vx: (x - sx) / ft, vy: (0 - sy + 0.5 * 30 * ft * ft) / ft, g: 30, w: 1.1, h: 1.1, life: 5, bounce: 0, c: b.k === 3 ? '#ff7a1a' : '#ffffff' }); b.n++; b.t = 0.75; b.ev.push('jump'); }
        else if (b.k === 3) { go(b, 'stun', 2.8); }
        else { const t = target(b, pl); b.face = t > b.x ? 1 : -1; go(b, 'roar', 1.0); b.ev.push('warn'); haz(b, { k: 'arrow', x: b.x + b.face * 3, y: 1, w: 2, h: 1, warn: 1.0, life: 0, dir: b.face }); }
      }
      break;
    case 'roar': if (b.t <= 0) { go(b, 'charge', 4); b.low = true; } break;
    case 'charge':
      b.x += b.face * (14 + ph * 2) * dt;
      if (b.x < X0 + 1 || b.x > X1 - 1) { b.x = clamp(b.x, X0 + 1, X1 - 1); b.ev.push('boom'); go(b, 'stun', 2.8); b.low = false; b.face = -b.face; }
      break;
    case 'walk':
      b.face = b.tx > b.x ? 1 : -1; b.x += (b.tx - b.x) * Math.min(1, dt * 2.2);
      if (b.t <= 0) { go(b, 'slam', 0.3); b.n = 0; }
      break;
    case 'slam':
      if (b.t <= 0) {
        if (b.n < 2 + ph) { const x = target(b, pl); b.face = x > b.x ? 1 : -1; haz(b, { k: 'col', x, y: 0, w: 2.3, h: 3.4, warn: 0.95, life: 0.6, c: '#ff7a1a' }); b.ev.push('warn'); b.n++; b.t = 1.05; }
        else if (ph >= 1) { b.n = 0; go(b, 'throw', 0.3); }
        else go(b, 'stun', 2.8);
      }
      break;
    case 'stun': b.vuln = true; b.low = false; if (b.t <= 0) { b.vuln = false; go(b, fly ? 'rise' : 'idle', fly ? 0.7 : 1.0 - ph * 0.2); } break;
    case 'rise': b.y += ((b.k === 4 ? 7.5 : 6) - b.y) * Math.min(1, dt * 4); if (b.t <= 0) go(b, 'idle', 0.8); break;
    case 'hurt': b.vuln = false; if (b.t <= 0) go(b, fly ? 'rise' : 'idle', fly ? 0.7 : 0.6); break;
  }
};
B.hit = function (b) {
  if (!b.vuln || b.st === 'hurt' || b.st === 'dead') return false;
  b.hp--; b.vuln = false; b.haz = b.haz.filter((h) => h.k === 'wave');
  if (b.hp <= 0) { b.st = 'dead'; b.t = 2.2; } else { b.st = 'hurt'; b.t = 1.1; }
  return true;
};
B.pack = (b) => ({ k: b.k, x: +b.x.toFixed(2), y: +b.y.toFixed(2), hp: b.hp, max: b.max, st: b.st, face: b.face, vuln: b.vuln, low: b.low, t: +b.t.toFixed(2), haz: b.haz.map((h) => [h.id, h.k, +h.x.toFixed(2), +h.y.toFixed(2), h.w, h.h, +h.warn.toFixed(2), h.c || '', h.dir || 0, h.sx || 0, h.sy || 0]) });
B.unpack = (s) => Object.assign({}, s, { ev: [], haz: s.haz.map((a) => ({ id: a[0], k: a[1], x: a[2], y: a[3], w: a[4], h: a[5], warn: a[6], c: a[7], dir: a[8], sx: a[9], sy: a[10], life: 1 })) });
// active damage boxes
B.hurtBoxes = function (b) {
  const out = [];
  for (const h of b.haz) {
    if (h.warn > 0 || h.k === 'mark' || h.k === 'arrow') continue;
    if (h.k === 'ball') out.push([h.x - h.w / 2, h.y - h.h / 2, h.x + h.w / 2, h.y + h.h / 2]);
    else out.push([h.x - h.w / 2, h.y, h.x + h.w / 2, h.y + h.h]);
  }
  if (!b.vuln && b.st !== 'hurt' && b.st !== 'dead' && b.st !== 'intro') { const d = B.dims(b); out.push([b.x - d[0] * 0.85, b.y + 0.1, b.x + d[0] * 0.85, b.y + d[1] * 0.92]); }
  return out;
};

/* ---------- view ---------- */
B.View = function (k) {
  const g = MD.boss(k); GD.View.add(g);
  const pool = {}, used = {};
  const mk = {
    mark: () => { const m = new T.Mesh(new T.CylinderGeometry(1, 1, 0.08, 24), new T.MeshBasicMaterial({ color: '#ff2d55', transparent: true, opacity: 0.6 })); return m; },
    col: () => { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1.4), new T.MeshBasicMaterial({ color: '#3ff0ff', transparent: true, opacity: 0.8 })); return m; },
    wave: () => { const m = new T.Mesh(new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), MD.toon('#ffd23f', { emissive: '#7a3a00' })); return m; },
    ball: () => MD.outline(new T.Mesh(MD.geo.s, MD.toon('#ffffff', { nocache: true })), 0.1),
    bomb: () => { const gg = new T.Group(); MD.outline(MD.mesh(MD.geo.s, MD.toon('#2a2a3a'), 0, 0, 0, 0.55, 0.55, 0.55, gg), 0.1); MD.mesh(MD.geo.s, new T.MeshBasicMaterial({ color: '#ff4d4d' }), 0, 0.55, 0, 0.14, 0.14, 0.14, gg); const m = new T.Mesh(new T.CylinderGeometry(1, 1, 0.08, 24), new T.MeshBasicMaterial({ color: '#ff2d55', transparent: true, opacity: 0.6 })); gg.add(m); gg.userData.mark = m; return gg; },
    arrow: () => { const s = new T.Sprite(new T.SpriteMaterial({ map: MD.emojiTex('\u2757'), transparent: true })); s.scale.setScalar(2); return s; }
  };
  function get(kind) { pool[kind] = pool[kind] || []; used[kind] = used[kind] || 0; let m = pool[kind][used[kind]]; if (!m) { m = mk[kind](); GD.View.add(m); pool[kind].push(m); } used[kind]++; m.visible = true; return m; }
  return {
    g,
    sync(b, t, dt) {
      const P = g.userData.P; g.position.set(b.x, b.y, 0);
      g.rotation.y = GD.lerp(g.rotation.y, b.face > 0 ? -0.35 : Math.PI + 0.35, Math.min(1, dt * 6));
      const dead = b.st === 'dead';
      g.visible = !(b.st === 'hurt' && Math.floor(t * 16) % 2) && !(dead && b.t < 0.2);
      const sq = b.low ? 0.5 : b.st === 'aim' || b.st === 'roar' ? 0.9 + Math.sin(t * 40) * 0.04 : 1;
      g.scale.set(1 / Math.sqrt(sq), sq, 1);
      g.rotation.z = dead ? Math.sin(t * 20) * 0.2 : b.st === 'stun' ? Math.sin(t * 6) * 0.08 : 0;
      P.stars.visible = b.vuln; P.stars.rotation.y += dt * 4;
      if (P.claws) P.claws.forEach((c, i) => { c.rotation.z = b.st === 'slam' ? 0.9 + Math.sin(t * 12 + i) * 0.2 : Math.sin(t * 3 + i) * 0.15; });
      if (P.eye) P.eye.scale.setScalar(b.vuln ? 0.6 : 0.2);
      if (P.arms) P.arms.forEach((a, i) => { a.rotation.z = b.st === 'throw' ? Math.sin(t * 10 + i * 3) * 1.2 : b.st === 'roar' ? 2.2 : 0; });
      if (P.jet) P.jet.visible = b.y > 0.5;
      if (P.lights) P.lights.forEach((l, i) => { l.visible = Math.floor(t * 6 + i) % 2 === 0; });
      g.children.forEach(() => {});
      for (const k in used) used[k] = 0;
      for (const h of b.haz) {
        if (h.k === 'mark') { if (h.warn <= 0) continue; const m = get('mark'); m.position.set(h.x, 0.06, 0); m.scale.set(h.w / 2, 1, 1.2); m.material.opacity = 0.35 + 0.35 * (Math.floor(t * 8) % 2); }
        else if (h.k === 'col') { const m = get('col'); const w = h.warn > 0; m.position.set(h.x, h.y + (w ? 0.05 : h.h / 2), 0); m.scale.set(w ? h.w : h.w, w ? 0.1 : h.h, 1); m.material.color.set(w ? '#ff2d55' : (h.c || '#3ff0ff')); m.material.opacity = w ? 0.4 + 0.4 * (Math.floor(t * 8) % 2) : 0.85; }
        else if (h.k === 'wave') { if (h.warn > 0) continue; const m = get('wave'); m.position.set(h.x, 0, 0); m.scale.set(0.6, h.h, 1.2); }
        else if (h.k === 'ball') { if (h.warn > 0) continue; const m = get('ball'); m.position.set(h.x, h.y, 0); m.scale.setScalar(h.w / 2); m.material.color.set(h.c || '#ffffff'); }
        else if (h.k === 'bomb') { const m = get('bomb'); if (h.warn > 0) { const u = 1 - h.warn / 1.25; m.position.set(GD.lerp(h.sx, h.x, u), GD.lerp(h.sy, 0.5, u * u), 0); m.userData.mark.position.set(0, -m.position.y + 0.06, 0); m.userData.mark.scale.set(h.w / 2, 1, 1.2); m.userData.mark.material.opacity = 0.35 + 0.35 * (Math.floor(t * 8) % 2); m.children[0].visible = true; } else { m.visible = false; const c = get('col'); c.position.set(h.x, h.h / 2, 0); c.scale.set(h.w, h.h, 1); c.material.color.set('#ffb02e'); c.material.opacity = 0.85; } }
        else if (h.k === 'arrow') { if (h.warn <= 0) continue; const m = get('arrow'); m.position.set(h.x, 2.5, 0.5); }
      }
      for (const k in pool) for (let i = used[k] || 0; i < pool[k].length; i++) pool[k][i].visible = false;
    }
  };
};
})();
