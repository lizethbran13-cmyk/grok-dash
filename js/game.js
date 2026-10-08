/* Grok Dash - core: save, input, level runtime, interactions, camera, HUD, results, test hooks */
(function () {
'use strict';
const GD = window.GD, GN = window.GrokNet, T = window.THREE, V = GD.View, MD = GD.MD, Ph = GD.Phys, Snd = GD.Snd, clamp = GD.clamp;
const G = GD.G = {};
const $ = (id) => document.getElementById(id);
G.$ = $;

/* ---------------- save ---------------- */
const SAVE_KEY = 'grokDash_v1';
function freshSave() { return { v: 1, name: '', color: GN.COLORS[1], hero: 'grok', skin: { grok: 0, speedy: 0, floaty: 0, candy: 0 }, assist: false, muted: false, lv: {}, lives: 5, tutDone: false, rotSeen: false, stats: { rings: 0, foes: 0, plays: 0, online: 0, cages: 0 }, seenUnl: {} }; }
let save = freshSave();
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.v === 1) { const f = freshSave(); save = Object.assign(f, s, { skin: Object.assign(f.skin, s.skin || {}), stats: Object.assign(f.stats, s.stats || {}), lv: s.lv || {}, seenUnl: s.seenUnl || {} }); } } catch (e) { /* ignore */ }
if (!save.name) { const gp = GN.savedProfile(); if (gp.hasName) { save.name = gp.name; save.color = gp.color; } }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
G.save = () => save; G.persist = persist;
Snd.setMuted(!!save.muted);
G.myName = () => GN.cleanName(save.name || 'Player');

/* ---------------- state ---------------- */
const GS = G.GS = { ui: 'title', pid: GN.pid(), R: null, me: null, others: {}, paused: false, net: null, fixedAcc: 0, time: 0, bannerT: 0, toastQ: [], rot: false };
G.online = () => !!(GS.net && GS.net.room);
G.isHost = () => !GS.net || !GS.net.room || GS.net.room.isHost;

/* ---------------- input ---------------- */
const keys = {}, press = { jump: 0, atk: 0, dash: 0 };
const touch = { lx: 0, down: false, jump: false, atk: false, dash: false, id: null, ox: 0, oy: 0 };
const inp = { lx: 0, down: false, jump: false, atk: false, dash: false, jumpP: false, atkP: false, dashP: false };
G.inp = inp; G.keys = keys;
const JUMPK = ['Space', 'KeyZ', 'KeyK', 'ArrowUp', 'KeyW'], ATKK = ['KeyX', 'KeyJ'], DASHK = ['ShiftLeft', 'ShiftRight', 'KeyC', 'KeyL'];
addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (GS.ui === 'game' && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!e.repeat) { if (JUMPK.includes(e.code)) press.jump = 1; if (ATKK.includes(e.code)) press.atk = 1; if (DASHK.includes(e.code)) press.dash = 1; }
  keys[e.code] = true;
  if (!e.repeat && GS.ui === 'game') { if (e.code === 'KeyP' || e.code === 'Escape') G.pause(!GS.paused); if (e.code === 'KeyM') G.toggleMute(); }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function readInput() {
  const kx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  inp.lx = kx || touch.lx; inp.down = !!(keys.ArrowDown || keys.KeyS || touch.down);
  inp.jump = JUMPK.some((k) => keys[k]) || touch.jump; inp.atk = ATKK.some((k) => keys[k]) || touch.atk; inp.dash = DASHK.some((k) => keys[k]) || touch.dash;
  inp.jumpP = !!press.jump; inp.atkP = !!press.atk; inp.dashP = !!press.dash; press.jump = press.atk = press.dash = 0;
  if (GS.bot) GS.bot(inp);
}
function setupTouch() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0; document.body.classList.toggle('touch', isTouch);
  const jz = $('joyzone'), base = $('joybase'), knob = $('joyknob');
  const upd = (e) => { const dx = e.clientX - touch.ox, dy = e.clientY - touch.oy, d = Math.hypot(dx, dy), m = Math.min(d, 46); const a = Math.atan2(dy, dx); knob.style.transform = 'translate(' + Math.cos(a) * m + 'px,' + Math.sin(a) * m + 'px)'; touch.lx = Math.abs(dx) < 10 ? 0 : clamp(dx / 40, -1, 1); touch.down = dy > 26 && dy > Math.abs(dx) * 0.6; };
  jz.addEventListener('pointerdown', (e) => { e.preventDefault(); touch.id = e.pointerId; touch.ox = e.clientX; touch.oy = e.clientY; base.style.left = e.clientX + 'px'; base.style.top = e.clientY + 'px'; try { jz.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } $('joyhint').style.opacity = 0; upd(e); });
  jz.addEventListener('pointermove', (e) => { if (e.pointerId === touch.id) upd(e); });
  const end = (e) => { if (e.pointerId !== touch.id) return; touch.id = null; touch.lx = 0; touch.down = false; knob.style.transform = ''; };
  jz.addEventListener('pointerup', end); jz.addEventListener('pointercancel', end);
  [['bJump', 'jump'], ['bAtk', 'atk'], ['bDash', 'dash']].forEach(([id, k]) => {
    const b = $(id);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); touch[k] = true; press[k] = 1; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } Snd.init(); });
    const up = () => { touch[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  });
}

/* ---------------- toasts / banner ---------------- */
G.toast = function (t, bad) { const d = document.createElement('div'); d.className = 'toast' + (bad ? ' bad' : ''); d.textContent = t; $('toasts').appendChild(d); while ($('toasts').children.length > 3) $('toasts').firstChild.remove(); setTimeout(() => d.remove(), 3200); };
G.banner = function (t, dur) { const b = $('banner'); b.textContent = t; b.classList.remove('hidden'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; GS.bannerT = dur || 1.4; };
G.toggleMute = function () { const m = !Snd.isMuted(); Snd.setMuted(m); save.muted = m; persist(); $('bMute').innerHTML = m ? '\uD83D\uDD07' : '\uD83D\uDD0A'; };

/* ---------------- level runtime ---------------- */
let R = null, me = null, heroMesh = null;
const ringPool = [];
function snapOf(p) { return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), vx: +p.vx.toFixed(1), vy: +p.vy.toFixed(1), face: p.face, mode: p.mode, g: p.gs ? 1 : 0, roll: p.roll ? 1 : 0, glide: p.glide ? 1 : 0, atk: p.atkT > 0 ? 1 : 0, inv: p.invT > 0 ? 1 : 0, ang: +(p.ang || 0).toFixed(2), landT: p.landT > 0 ? 1 : 0, hero: p.hero, skin: save.skin[p.hero] || 0, rings: p.rings | 0, fin: p.finT || 0 }; }
G.snap = () => (me ? snapOf(me) : null);
G.R = () => R; G.me = () => me;

G.loadLevel = function (id, o) {
  o = o || {};
  const def = GD.lvById(id); if (!def) return;
  const L = GD.buildLevel(def), W = GD.WORLDS[def.w];
  V.build(L, W, { space: id === '5-B' });
  R = GS.R = { id, def, L, W, t: 0, clock: 0, race: !!o.race, done: false, fin: false, ctx: { S: L.S.slice(), springs: [], boosts: [], loops: [], qpipes: [], cannons: [], hooks: [], fans: [] },
    rings: [], sparks: [], cages: [], cps: [], foes: [], haz: [], hints: [], fakes: [], movers: [], crumbles: [], goal: null, chaseO: null, chase: null, boss: null, bossV: null, scat: [], got: 0, cageGot: [0, 0, 0], cpN: 0, byId: {}, gotRings: 0, bonus: def.kind === 'bonus' };
  const add = (m) => V.add(m);
  for (const ob of L.O) {
    R.byId[ob.id] = ob;
    switch (ob.t) {
      case 'ring': R.rings.push(ob); break;
      case 'spark': R.sparks.push(ob); break;
      case 'spring': { R.ctx.springs.push(ob); ob.m = add(MD.spring()); ob.m.position.set(ob.x, ob.y, 0); break; }
      case 'boost': { R.ctx.boosts.push(ob); ob.m = add(MD.boost(ob.dir)); ob.m.position.set(ob.x, ob.y, 0); break; }
      case 'loop': { R.ctx.loops.push(ob); const g = new T.Group(); const band = new T.Mesh(new T.CylinderGeometry(ob.r + 0.12, ob.r + 0.12, 2.4, 48, 1, true), MD.toon(W.id === 1 ? '#3ff0ff' : '#ffb02e', { side: T.DoubleSide })); band.rotation.x = Math.PI / 2; g.add(band); const rim = new T.Mesh(new T.TorusGeometry(ob.r + 0.2, 0.12, 6, 48), MD.toon('#ffffff')); rim.position.z = 1.2; g.add(rim); const rim2 = rim.clone(); rim2.position.z = -1.2; g.add(rim2); g.position.set(ob.x, ob.y + ob.r, 0); add(g); break; }
      case 'qpipe': { R.ctx.qpipes.push(ob); const band = new T.Mesh(new T.CylinderGeometry(ob.r + 0.1, ob.r + 0.1, 3.2, 20, 1, true, Math.PI, Math.PI / 2), MD.toon('#ffb02e', { side: T.DoubleSide })); band.rotation.x = Math.PI / 2; band.position.set(ob.x - ob.r - 0.4, ob.y + ob.r, 0); add(band); break; }
      case 'cannon': { R.ctx.cannons.push(ob); ob.m = add(MD.cannon()); ob.m.position.set(ob.x, ob.y, 0); break; }
      case 'hook': { R.ctx.hooks.push(ob); ob.m = add(MD.hook()); ob.m.position.set(ob.x, ob.y, 0); break; }
      case 'fan': { R.ctx.fans.push(ob); ob.m = add(MD.fan(ob.h)); ob.m.position.set(ob.x, ob.y, 0); break; }
      case 'mover': { const s = { x0: ob.x - ob.w / 2, x1: ob.x + ob.w / 2, y0: ob.y, y1: ob.y, yb: ob.y - 0.7, k: 'mover', ow: true, dxF: 0 }; ob.s = s; R.ctx.S.push(s); ob.m = add(MD.outline(MD.mesh(MD.geo.b, MD.toon(W.plat), 0, 0, 0, ob.w, 0.7, 2.0), 0.04)); R.movers.push(ob); break; }
      case 'cage': { ob.m = add(MD.cage(GD.CRITTERS[(ob.ci + def.w * 3 + def.i) % GD.CRITTERS.length])); ob.m.position.set(ob.x, ob.y, 0); R.cages.push(ob); break; }
      case 'cp': { ob.m = add(MD.checkpoint()); ob.m.position.set(ob.x, ob.y, -0.8); R.cps.push(ob); break; }
      case 'goal': { ob.m = add(MD.goal()); ob.m.position.set(ob.x, ob.y, -0.5); R.goal = ob; break; }
      case 'foe': { ob.m = add(MD.foe(ob.k, ob.k === 'spiky' ? '#8b5cf6' : W.enemy)); R.foes.push(ob); break; }
      case 'spikes': case 'fire': { ob.m = add(MD.spikes(ob.x1 - ob.x0, ob.t === 'fire')); ob.m.position.set((ob.x0 + ob.x1) / 2, ob.y, 0); R.haz.push(ob); break; }
      case 'hint': R.hints.push(ob); break;
      case 'fake': { const m = new T.Mesh(new T.BoxGeometry(ob.x1 - ob.x0, ob.y1 - ob.y0, 3.4), MD.toon(W.side, { transparent: true, nocache: true })); m.position.set((ob.x0 + ob.x1) / 2, (ob.y0 + ob.y1) / 2, 0); const cr = new T.Mesh(new T.PlaneGeometry(0.15, (ob.y1 - ob.y0) * 0.8), new T.MeshBasicMaterial({ color: '#2a1650', transparent: true, opacity: 0.5 })); cr.position.set(-(ob.x1 - ob.x0) * 0.2, 0, 1.72); cr.rotation.z = 0.4; m.add(cr); const cr2 = cr.clone(); cr2.position.x = (ob.x1 - ob.x0) * 0.3; cr2.rotation.z = -0.5; m.add(cr2); ob.m = add(m); R.fakes.push(ob); break; }
      case 'bush': { const m = add(MD.bush(W.id === 2 ? '#e0f2fe' : W.id === 1 ? '#7c3aed' : W.id === 3 ? '#6b5a4a' : '#2e9b4a')); m.position.set(ob.x, ob.y, 1.6); break; }
      case 'chase': R.chaseO = ob; break;
      case 'boss': { R.boss = GD.Boss.create(ob.k, ob.x, ob.y); R.bossV = GD.Boss.View(ob.k); break; }
    }
  }
  // crumble blocks
  for (const s of R.ctx.S) if (s.k === 'crumble') { s.m = add(MD.outline(MD.mesh(MD.geo.b, MD.toon('#c9a26a'), (s.x0 + s.x1) / 2, s.y0 - 0.4, 0, s.x1 - s.x0 - 0.06, 0.8, 2.0), 0.03)); s.by = s.y0; R.crumbles.push(s); }
  // instanced collectibles
  R.ringIM = V.instanced(MD.ringGeo, MD.ringMat, R.rings.length);
  R.sparkIM = V.instanced(MD.sparkGeo, MD.sparkMat, R.sparks.length);
  R.sparkGlow = R.sparks.slice(0, 0);
  R.hints.sort((a, b) => a.x - b.x);
  if (R.boss) { R.arenaRings = []; for (let i = 0; i < 6; i++) R.arenaRings.push({ x: 4 + i * 7, y: 1.2 + (i % 2) * 3.4, t: 0 }); }
  // scatter ring pool
  if (!ringPool.length || !ringPool[0].parent) { ringPool.length = 0; }
  for (let i = 0; i < 24; i++) { const m = new T.Mesh(MD.ringGeo, MD.ringMat); m.visible = false; V.add(m); ringPool[i] = m; }
  // chase wall
  if (R.chaseO) { const g = new T.Group(); const col = ['#7a5a3a', '#ff4fd8', '#ffffff', '#ff5a1a', '#6b7280'][def.w]; const m = MD.outline(MD.mesh(MD.geo.s, MD.toon(col, { emissive: def.w === 3 ? '#7a2000' : def.w === 1 ? '#5a0a4a' : '#000000' }), 0, 0, 0, 6, 6, 5), 0.03); g.add(m); const wall = MD.mesh(MD.geo.b, MD.toon(col), -8, 0, 0, 16, 60, 6); g.add(wall); g.userData.ball = m; g.visible = false; add(g); R.chaseM = g; }
  // player
  me = GS.me = Ph.newPlayer(save.hero, L.start[0], L.start[1]);
  me.rings = 0; me.shield = save.assist ? 1 : 0; me.cp = { x: L.start[0], y: L.start[1] }; me.safe = { x: L.start[0], y: L.start[1] }; me.finT = 0;
  heroMesh = MD.hero(save.hero, save.skin[save.hero] || 0); add(heroMesh); GS.heroMesh = heroMesh;
  me.shieldM = new T.Mesh(MD.geo.s, new T.MeshBasicMaterial({ color: '#7df9ff', transparent: true, opacity: 0.25, depthWrite: false })); me.shieldM.scale.setScalar(1.1); add(me.shieldM);
  me.bubM = new T.Mesh(MD.geo.s, new T.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.35, depthWrite: false })); me.bubM.scale.setScalar(1.25); me.bubM.visible = false; add(me.bubM);
  for (const k in GS.others) { const o = GS.others[k]; o.mesh = null; o.mkey = ''; }
  GS.ui = 'game'; GS.paused = false; GS.fixedAcc = 0; GS.lastHint = null;
  V.camX = me.x; V.camY = me.y; V.camTo(me.x, me.y, 0.016, true);
  Snd.music(def.kind === 'boss' ? 5 : W.music);
  save.stats.plays++; persist();
  G.showScreens();
  $('bossBar').classList.toggle('hidden', !R.boss); if (R.boss) $('bossName').textContent = W.boss;
  G.banner(def.kind === 'boss' ? 'BOSS: ' + W.boss.toUpperCase() : def.id + ' ' + def.name.toUpperCase(), 1.8);
  if (o.race) G.banner('RACE! ' + def.id, 1.5);
  updateHud(true);
  if (R.race) { me.mode = 'frozen'; R.countdown = 3.2; }
  if (GS.onLevelLoaded) GS.onLevelLoaded();
};
G.quitLevel = function () { R = GS.R = null; me = GS.me = null; GS.ui = 'map'; Snd.music(6); G.showScreens(); if (G.UI) G.UI.map(); G.menuScene(); };

/* ---------------- foes ---------------- */
function foePos(o, t) {
  const sp = 1.5 + (R ? R.def.diff : 0) * 1.2;
  if (o.k === 'walker' || o.k === 'spiky') { const r = Math.max(0.01, o.range), a = t * sp / r + o.ph; return [o.x + Math.sin(a) * r, o.y, Math.cos(a) >= 0 ? 1 : -1]; }
  if (o.k === 'hopper') { const a = t * 0.8 + o.ph; return [o.x + Math.sin(a) * o.range, o.y + Math.abs(Math.sin(t * 2.6 + o.ph)) * 2.2, Math.cos(a) >= 0 ? 1 : -1]; }
  const a = t * 1.2 + o.ph; return [o.x + Math.sin(a) * o.range, o.y + Math.sin(t * 2.4 + o.ph) * 0.6, Math.cos(a) >= 0 ? 1 : -1];
}
const FOEBOX = { walker: [0.6, 0, 1.2], spiky: [0.6, 0, 1.5], hopper: [0.5, 0, 1.05], flyer: [0.5, -0.45, 0.45] };
G.foePos = foePos;

/* ---------------- shared takes (sparks, cages, foes, checkpoints) ---------------- */
G.applyTake = function (k, id, by, quiet) {
  if (!R) return false; const o = R.byId[id]; if (!o) return false;
  if (k === 's') { if (o.got) return false; o.got = true; R.got++; if (!quiet) { Snd.fx('spark'); V.burst(o.x, o.y, '#fff36b', 4, 4, 0.5, 0.35); } return true; }
  if (k === 'c') { if (o.broken) return false; o.broken = true; R.cageGot[o.ci] = 1; o.m.visible = false; o.freeT = 2.2; o.fm = V.add(MD.critterFx(GD.CRITTERS[(o.ci + R.def.w * 3 + R.def.i) % GD.CRITTERS.length])); o.fm.position.set(o.x, o.y + 1, 0.5); if (!quiet) { Snd.fx('cage'); V.burst(o.x, o.y + 1, '#ffe14d', 16, 8, 0.8, 0.6); G.toast((by === GS.pid ? 'You' : nameOf(by)) + ' rescued a critter! ' + R.cageGot.filter(Boolean).length + '/3'); } return true; }
  if (k === 'f') { if (o.dead) return false; o.dead = true; o.deadT = 0.5; const p = foePos(o, R.t); o.dx = p[0]; o.dy = p[1]; if (!quiet) { Snd.fx('bop'); V.burst(p[0], p[1] + 0.6, '#ffffff', 10, 6, 0.7, 0.4); } save.stats.foes++; return true; }
  if (k === 'cp') { if (o.n <= R.cpN) return false; R.cpN = o.n; for (const c of R.cps) if (c.n <= o.n) c.on = true; if (me && (!R.race || by === GS.pid)) { me.cp = { x: o.x + 1, y: o.y }; } if (!quiet) { Snd.fx('cp'); V.burst(o.x, o.y + 2.5, '#7df9ff', 12, 6, 0.6, 0.5); } return true; }
  return false;
};
function nameOf(pid) { const o = GS.others[pid]; return o ? o.name : 'A friend'; }
function take(k, id) {
  if (G.applyTake(k, id, GS.pid) && GS.net && GS.net.room && !R.race) GS.net.take(k, id);
}

/* ---------------- damage ---------------- */
function hurt(p, fromX) {
  if (p.invT > 0 || p.mode !== 'run' || R.done) return;
  const dir = fromX != null ? (p.x < fromX ? -1 : 1) : -p.face;
  if (p.rings > 0) {
    const n = Math.min(p.rings, 20); p.rings = 0; Snd.fx('scatter');
    for (let i = 0; i < n; i++) { const a = Math.PI * (0.15 + 0.7 * (i / Math.max(1, n - 1))), v = 7 + (i % 3) * 2.5; R.scat.push({ x: p.x, y: p.y + 1, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 2, life: 5, age: 0 }); }
    R.scat = R.scat.slice(-24);
  } else if (p.shield > 0) { p.shield = 0; G.toast('Assist shield saved you!'); Snd.fx('pop'); }
  else { die(p); return; }
  Snd.fx('hurt'); p.invT = 1.8; p.vx = dir * 8; p.vy = 9; p.gs = null; p.lockT = 0.35; p.roll = false; p.mode = 'run'; p.hook = null;
}
function die(p, pit) {
  if (p.mode === 'dead') return;
  Snd.fx('die'); V.burst(p.x, p.y + 0.8, '#ffffff', 14, 7, 0.8, 0.5);
  // co-op: float back to the leader in a bubble instead
  if (G.online() && !R.race && leaderOther()) { p.mode = 'bubble'; p.bubT = 0; p.vx = p.vy = 0; p.rings = 0; p.roll = false; G.toast('Bubble! Floating back to your team\u2026'); return; }
  p.mode = 'dead'; p.deadT = 0.75; p.vx = p.vy = 0;
  if (!R.boss || true) { save.lives--; if (save.lives <= 0) { save.lives = 5; G.toast('Lives refilled \u2014 keep going, you\u2019ve got this!'); } persist(); }
}
function respawn(p) {
  p.mode = 'run'; p.x = p.cp.x; p.y = p.cp.y + 0.05; p.vx = 0; p.vy = 0; p.gs = null; p.rings = 0; p.invT = 1.5; p.roll = false; p.hook = null; p.loop = null; p.cannon = null; p.ballistic = false; p.launchT = 0;
  if (save.assist) p.shield = 1;
  if (R.chase && !G.online()) { R.chase.x = Math.min(R.chase.x, p.x - 15); R.chase.pause = 1.2; }
  V.camTo(p.x, p.y, 0.016, true);
}
G.respawnCp = () => { if (me && R && !R.done) { if (me.mode !== 'bubble') { save.lives = Math.max(1, save.lives); me.mode = 'dead'; me.deadT = 0.05; } } };
function leaderOther() { for (const k in GS.others) { const o = GS.others[k]; if (o.s && o.s.mode !== 'bubble' && o.s.mode !== 'dead' && !o.s.fin) return o; } return null; }
function leaderPos() {
  let best = me && me.mode !== 'bubble' && me.mode !== 'dead' ? { x: me.x, y: me.y, me: true } : null;
  if (G.online() && R && !R.race) for (const k in GS.others) { const o = GS.others[k]; if (!o.s || o.s.mode === 'bubble' || o.s.mode === 'dead') continue; if (!best || o.s.x > best.x + 0.5) best = { x: o.s.x, y: o.s.y, me: false }; }
  return best;
}
G.leaderPos = leaderPos;

/* ---------------- interactions ---------------- */
function overlap(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) { return ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0; }
function interact(p) {
  const px0 = p.x - 0.4, px1 = p.x + 0.4, py0 = p.y, py1 = p.y + 1.5, cy = p.y + 0.75;
  const atk = p.atkT > 0, ax = p.x + p.face * 1.15, ay = p.y + 0.85;
  const strong = p.dashT > 0 || p.roll || p.mode === 'spin';
  // rings
  for (let i = 0; i < R.rings.length; i++) { const o = R.rings[i]; if (o.got) continue; if (Math.abs(o.x - p.x) < 0.85 && Math.abs(o.y - cy) < 1.1) { o.got = true; addRings(p, 1); } }
  for (const o of R.sparks) { if (o.got || Math.abs(o.x - p.x) > 0.9 || Math.abs(o.y - cy) > 1.15) continue; take('s', o.id); }
  if (R.arenaRings) for (const o of R.arenaRings) if (o.t <= 0 && Math.abs(o.x - p.x) < 0.9 && Math.abs(o.y - cy) < 1.1) { o.t = 12; addRings(p, 1); }
  for (const r of R.scat) if (r.age > 0.6 && r.life > 0 && Math.abs(r.x - p.x) < 0.9 && Math.abs(r.y - cy) < 1.1) { r.life = 0; addRings(p, 1); }
  // cages
  for (const o of R.cages) {
    if (o.broken) continue;
    const hit = (atk && overlap(ax - 0.9, ay - 0.8, ax + 0.9, ay + 0.8, o.x - 0.75, o.y, o.x + 0.75, o.y + 1.9)) || (overlap(px0, py0, px1, py1, o.x - 0.75, o.y, o.x + 0.75, o.y + 1.9) && (strong || (p.vy < 0 && p.y > o.y + 1.3)));
    if (hit) { take('c', o.id); if (p.vy < 0 && p.y > o.y + 1.3) p.vy = 12; save.stats.cages++; }
  }
  // checkpoints
  for (const o of R.cps) if (!o.on && p.x > o.x - 0.6 && Math.abs(p.y - o.y) < 5) { take('cp', o.id); if (!G.online() || R.race) p.cp = { x: o.x + 1, y: o.y }; if (save.assist) p.shield = 1; }
  // foes
  if (!R.done) for (const o of R.foes) {
    if (o.dead) continue;
    const fp = foePos(o, R.t), bx = FOEBOX[o.k];
    const fx0 = fp[0] - bx[0], fx1 = fp[0] + bx[0], fy0 = fp[1] + bx[1], fy1 = fp[1] + bx[2];
    if (atk && overlap(ax - 0.95, ay - 0.85, ax + 0.95, ay + 0.85, fx0, fy0, fx1, fy1)) { take('f', o.id); continue; }
    if (!overlap(px0, py0, px1, py1, fx0, fy0, fx1, fy1)) continue;
    if (strong) { take('f', o.id); continue; }
    if (o.k !== 'spiky' && (p.vy < 0 || p.py > p.y) && p.y > fy1 - 0.65) { take('f', o.id); p.vy = inp.jump ? 15 : 11; p.gs = null; p.jumped = false; p.airDash = p.h.airDash; continue; }
    if (GS.botGod) continue;
    hurt(p, fp[0]);
  }
  // hazards
  for (const o of R.haz) {
    let active = true; if (o.t === 'fire') { const c = (R.t + o.ph) % 3.2; active = c > 1.0 && c < 2.2; }
    if (active && !GS.botGod && overlap(px0, py0, px1, py1, o.x0 + 0.15, o.y, o.x1 - 0.15, o.y + (o.t === 'fire' ? 2.4 : 0.65))) hurt(p, (o.x0 + o.x1) / 2);
  }
  // boss
  if (R.boss && !R.done) {
    const b = R.boss, d = GD.Boss.dims(b);
    const bx0 = b.x - d[0], bx1 = b.x + d[0], by0 = b.y, by1 = b.y + d[1];
    if (b.vuln) {
      const bop = overlap(px0, py0, px1, py1, bx0, by0, bx1, by1 + 0.3) && p.vy <= 0 && p.y > by1 - 0.8;
      const pun = atk && overlap(ax - 0.95, ay - 0.85, ax + 0.95, ay + 0.85, bx0, by0, bx1, by1);
      const ram = strong && overlap(px0, py0, px1, py1, bx0, by0, bx1, by1);
      if (bop || pun || ram) { if (bop) { p.vy = 15; p.gs = null; } else { p.vx = -p.face * 10; p.vy = 8; p.gs = null; } bossHit(); }
    }
    if (!GS.botGod) for (const hb of GD.Boss.hurtBoxes(b)) if (overlap(px0, py0, px1, py1, hb[0], hb[1], hb[2], hb[3])) { hurt(p, (hb[0] + hb[2]) / 2); break; }
  }
  // goal
  if (R.goal && !R.done && !p.finT && Math.abs(p.x - R.goal.x) < 1.3 && p.y > R.goal.y - 1 && p.y < R.goal.y + 6) reachGoal();
  // chase wall
  if (R.chase && !R.done && p.mode === 'run' && p.x < R.chase.x + 1.2) { if (GS.botGod) p.x = R.chase.x + 1.3; else die(p); }
}
function addRings(p, n) { const before = p.rings; p.rings += n; save.stats.rings += n; Snd.fx('ring'); if (Math.floor(p.rings / 100) > Math.floor(before / 100)) { save.lives++; Snd.fx('lifeup'); G.toast('100 rings! Extra life \u2764\uFE0F'); } }
function bossHit() {
  if (G.isHost()) { if (GD.Boss.hit(R.boss)) bossHitFx(); }
  else { GS.net.send({ t: 'bhit' }); R.boss.vuln = false; }
}
function bossHitFx() { Snd.fx('bosshit'); V.burst(R.boss.x, R.boss.y + 2, '#ffe14d', 18, 9, 0.9, 0.6); G.banner(R.boss.hp > 0 ? 'HIT! ' + R.boss.hp + ' left' : 'BOSS DEFEATED!', 1.2); }
G.bossHitFx = bossHitFx;
function reachGoal() {
  if (R.race) { me.finT = R.clock; me.mode = 'done'; Snd.fx('goal'); G.banner('FINISHED! ' + GD.fmtTime(R.clock), 2); if (GS.net) GS.net.raceFinish(R.clock); return; }
  if (G.online() && !G.isHost()) { GS.net.send({ t: 'goal' }); me.mode = 'done'; return; }
  G.endLevel(true);
}

/* ---------------- level end / results ---------------- */
G.endLevel = function (win, shared) {
  if (!R || R.done) return; R.done = true; R.win = win;
  if (shared) { R.got = shared.sparks; shared.cages.forEach((c, i) => { if (c) R.cageGot[i] = 1; }); R.clock = shared.clock; }
  if (G.online() && G.isHost() && GS.net && !R.race) GS.net.bcast({ t: 'end', sparks: R.got, cages: R.cageGot, clock: R.clock });
  if (me) me.mode = 'done';
  Snd.fx('goal'); G.banner(R.boss ? 'VICTORY!' : 'LEVEL CLEAR!', 2.2);
  setTimeout(() => showResult(), 1700);
};
function medalFor(v, th) { return v >= th[2] ? 3 : v >= th[1] ? 2 : v >= th[0] ? 1 : 0; }
function tmedalFor(t, th) { return t <= th[2] ? 3 : t <= th[1] ? 2 : t <= th[0] ? 1 : 0; }
function showResult(extra) {
  if (!R) return;
  const L = R.L, def = R.def, before = {}; GD.UNLOCKS.forEach((u) => { before[u.id] = GD.isUnlocked(save, u.id); });
  const wasOpen = GD.LEVELS.map((l) => GD.levelOpen(save, l));
  const res = { id: def.id, sparks: R.got, sparkTot: L.sparks, medal: def.kind === 'boss' ? 3 : medalFor(R.got, L.medals), time: R.clock, tmedal: tmedalFor(R.clock, L.times), rings: me ? me.rings : 0, cages: R.cageGot.slice(), cageTot: L.cages, race: extra && extra.race, place: extra && extra.place, isBoss: def.kind === 'boss' };
  const old = save.lv[def.id] || {}; const rec = save.lv[def.id] = Object.assign({}, old);
  res.newBest = { sparks: res.sparks > (old.sparks || 0), time: !old.time || res.time < old.time };
  rec.done = 1; rec.sparks = Math.max(old.sparks || 0, res.sparks); rec.medal = Math.max(old.medal || 0, res.medal); rec.tmedal = Math.max(old.tmedal || 0, res.tmedal);
  rec.time = old.time ? Math.min(old.time, res.time) : res.time; rec.rings = Math.max(old.rings || 0, res.rings);
  rec.cages = [0, 1, 2].map((i) => (old.cages && old.cages[i]) || res.cages[i] || 0);
  if (G.online()) save.stats.online++;
  persist();
  res.unlocks = GD.UNLOCKS.filter((u) => !before[u.id] && GD.isUnlocked(save, u.id)).map((u) => u.name);
  res.opened = GD.LEVELS.filter((l, i) => !wasOpen[i] && GD.levelOpen(save, l)).map((l) => l.id + ' ' + l.name);
  if (res.unlocks.length) Snd.fx('unlock');
  GS.lastResult = res;
  if (G.UI) G.UI.result(res);
}
G.showResult = showResult;

/* ---------------- step ---------------- */
const DT = 1 / 120;
function step(dt) {
  if (!R) return;
  R.t += dt; if (!R.done && !(R.countdown > 0)) R.clock += dt;
  if (R.countdown > 0) { const c0 = Math.ceil(R.countdown); R.countdown -= dt; const c1 = Math.ceil(R.countdown); if (c1 !== c0) { if (c1 > 0) { G.banner(String(c1), 0.9); Snd.fx('count'); } else { G.banner('GO!', 0.9); Snd.fx('go'); if (me.mode === 'frozen') me.mode = 'run'; } } }
  // movers
  for (const o of R.movers) { const a = (R.t / o.per) * Math.PI * 2 + o.ph, cx = o.x + o.dx * Math.sin(a), cy = o.y + o.dy * Math.sin(a * 0.5 + 1); const s = o.s; s.dxF = cx - (s.x0 + s.x1) / 2; s.x0 = cx - o.w / 2; s.x1 = cx + o.w / 2; s.y0 = s.y1 = cy; s.yb = cy - 0.7; }
  for (const s of R.crumbles) {
    if (s.tt > 0) { s.tt -= dt; if (s.tt <= 0) { s.off = true; s.rt = 3.2; s.fallV = 0; if (me && me.gs === s) { me.gs = null; } } }
    else if (s.off) { s.rt -= dt; s.fallV += 30 * dt; s.y0 -= 0; if (s.rt <= 0) { s.off = false; s.tt = 0; } }
  }
  if (me) {
    const p = me;
    if (p.mode === 'dead') { p.deadT -= dt; if (p.deadT <= 0) respawn(p); }
    else if (p.mode === 'bubble') {
      const L = leaderPos(); const tgt = G.online() && !R.race ? (L && !L.me ? L : null) : p.safe;
      if (tgt) { if (Ph.bubble(p, tgt.x, tgt.y + 1.6, dt, inp)) Snd.fx('pop'); }
      else { p.mode = 'dead'; p.deadT = 0.3; }
      p.events.length = 0;
    } else {
      Ph.step(p, inp, dt, R.ctx);
      for (const e of p.events) onEv(p, e[0]);
      if (p.mode === 'run' || p.mode === 'hook') interact(p);
      if (p.gs && p.gs.k !== 'crumble' && p.gs.k !== 'mover' && p.gs.k !== 'rail' && !p.gs.off) { const s = p.gs, ex = Math.min(s.x1 - 0.6, Math.max(s.x0 + 0.6, p.x)); if (ex > s.x0 && ex < s.x1) p.safe = { x: ex, y: Ph.top(s, ex) }; }
      if (p.y < R.L.pitY && p.mode !== 'dead' && p.mode !== 'bubble') {
        if (save.assist && !(G.online() && !R.race)) { p.mode = 'bubble'; p.bubT = 0; p.vx = p.vy = 0; Snd.fx('pop'); G.toast('Safety bubble!'); }
        else die(p, true);
      }
      // co-op: bubble back if left far behind
      if (G.online() && !R.race && p.mode === 'run' && !R.done) {
        const L = leaderPos();
        if (L && !L.me) { const hw = V.viewHalf(); if (L.x - p.x > hw[0] * 0.92 + 1 || p.y < L.y - hw[1] * 1.3 || p.x - L.x > hw[0] * 1.5) { p.mode = 'bubble'; p.bubT = 0; p.vx = p.vy = 0; Snd.fx('pop'); } }
      }
    }
  }
  // scattered rings
  for (const r of R.scat) {
    if (r.life <= 0) continue; r.life -= dt; r.age += dt; r.vy -= 24 * dt; const nx = r.x + r.vx * dt, ny = r.y + r.vy * dt;
    const g = Ph.groundAt(R.ctx.S, nx, ny - 0.1, r.y + 0.3); if (g && r.vy < 0) { r.y = g[1] + 0.3; r.vy = Math.abs(r.vy) * 0.6; r.vx *= 0.8; } else r.y = ny; r.x = nx;
  }
  R.scat = R.scat.filter((r) => r.life > 0);
  if (R.arenaRings) for (const o of R.arenaRings) if (o.t > 0) o.t -= dt;
  // chase (host)
  if (R.chaseO && G.isHost()) {
    const ps = livePlayers();
    if (!R.chase && ps.some((q) => q.x > R.chaseO.x)) { R.chase = { x: R.chaseO.x - 16, sp: R.chaseO.speed, pause: 0 }; G.banner('RUN!', 1.4); Snd.fx('warn'); }
    if (R.chase && !R.done) {
      if (R.chase.pause > 0) R.chase.pause -= dt; else R.chase.x += R.chase.sp * dt;
      const alive = ps.filter((q) => q.mode === 'run' || q.mode === 'hook' || q.mode === 'loop' || q.mode === 'qpipe' || q.mode === 'cannon');
      if (!alive.length || alive.every((q) => q.x < R.chase.x)) { const cp = R.cps.filter((c) => c.on).pop(); const bx = (cp ? cp.x : R.chaseO.x) - 15; if (R.chase.x > bx) { R.chase.x = bx; R.chase.pause = 1.2; } }
      const maxX = Math.max.apply(null, ps.map((q) => q.x).concat([-1e9])); if (R.chase.x < maxX - 40) R.chase.x = maxX - 40;
      if (R.goal && R.chase.x > R.goal.x - 6) R.chase.x = R.goal.x - 6;
    }
  }
  // boss (host)
  if (R.boss && G.isHost() && !R.done) {
    const b = R.boss; GD.Boss.update(b, dt, livePlayers().map((q) => ({ x: q.x, y: q.y, alive: q.mode === 'run' })));
    b.ev.forEach((e) => Snd.fx(e));
    if (b.st === 'dead' && b.t <= 0) G.endLevel(true);
  } else if (R.boss && !G.isHost() && R.boss.haz) { for (const h of R.boss.haz) { if (h.warn > 0) h.warn -= dt; if (h.k === 'wave' && h.warn <= 0) h.x += (h.vx || 0) * dt; } }
}
function livePlayers() {
  const a = []; if (me) a.push({ x: me.x, y: me.y, mode: me.mode, me: true });
  if (G.online()) for (const k in GS.others) { const o = GS.others[k]; if (o.s) a.push({ x: o.s.x, y: o.s.y, mode: o.s.mode }); }
  return a;
}
G.livePlayers = livePlayers;
function onEv(p, e) {
  Snd.fx(e === 'land' ? 'land' : e === 'walljump' ? 'walljump' : e);
  if (e === 'spring') { const s = R.ctx.springs.find((q) => q.anim > 0.3); if (s) s.anim = 0.4; V.burst(p.x, p.y, '#ffffff', 6, 5, 0.5, 0.3); }
  if (e === 'boost' || e === 'dash' || e === 'spindash') V.burst(p.x - p.face, p.y + 0.6, '#7df9ff', 8, 5, 0.6, 0.35);
  if (e === 'cannon') V.burst(p.x, p.y + 1, '#ffb02e', 12, 8, 0.9, 0.4);
  if (e === 'walljump') V.burst(p.x, p.y + 0.6, '#ffffff', 5, 4, 0.4, 0.3);
}

/* ---------------- render ---------------- */
const tagEls = {};
function render(dt) {
  if (!R) return;
  const t = R.t, L = R.L;
  // camera
  let cx = me.x, cy = me.y;
  const lead = leaderPos();
  if (G.online() && !R.race && lead && !lead.me) { cx = lead.x; cy = lead.y; }
  else if (me.mode === 'bubble' && me.safe) { cx = me.x; cy = me.y; }
  if (!(G.online() && lead && !lead.me)) cx += clamp(me.vx * 0.28, -5, 6);
  if (R.boss) { const hw = V.viewHalf()[0]; cx = clamp(me.x, -6 + hw - 0.5, 46 - hw + 0.5); if (hw * 2 > 52) cx = 20; cy = 1.5; }
  if (me.mode === 'dead') { cx = V.camX; cy = V.camY; }
  V.camTo(cx, Math.max(cy, L.pitY + 9), dt, false, me.boostT > 0 || Math.abs(me.vx) > 18 ? 1.12 : 1);
  // hero
  const s = snapOf(me); s.g = !!me.gs; s.landT = me.landT; s.inv = me.invT > 0 && me.mode === 'run' ? 1 : 0; s.glide = me.glide;
  MD.animHero(heroMesh, s, t, dt);
  heroMesh.visible = heroMesh.visible && me.mode !== 'dead' && me.mode !== 'cannon';
  me.bubM.visible = me.mode === 'bubble'; me.bubM.position.set(me.x, me.y + 0.8, 0);
  me.shieldM.visible = me.shield > 0 && me.mode === 'run' && Math.floor(t * 3) % 2 === 0; me.shieldM.position.set(me.x, me.y + 0.8, 0);
  // others
  for (const k in GS.others) renderOther(GS.others[k], t, dt);
  // collectibles
  const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), pos = new T.Vector3(), zero = new T.Vector3(0, 0, 0), eu = new T.Euler();
  const hw = V.viewHalf()[0] + 6;
  R.rings.forEach((o, i) => { const vis = !o.got && Math.abs(o.x - V.camX) < hw; eu.set(0, t * 3 + o.x * 0.3, 0); q.setFromEuler(eu); pos.set(o.x, o.y, 0); m4.compose(pos, q, vis ? sc.set(1, 1, 1) : zero); R.ringIM.setMatrixAt(i, m4); });
  R.ringIM.instanceMatrix.needsUpdate = true;
  R.sparks.forEach((o, i) => { const vis = !o.got && Math.abs(o.x - V.camX) < hw; eu.set(t * 2, t * 2.5 + o.x, 0); q.setFromEuler(eu); pos.set(o.x, o.y + Math.sin(t * 3 + o.x) * 0.12, 0); const k = 0.85 + 0.2 * Math.sin(t * 6 + o.x * 2); m4.compose(pos, q, vis ? sc.set(k, k, k) : zero); R.sparkIM.setMatrixAt(i, m4); });
  R.sparkIM.instanceMatrix.needsUpdate = true;
  // scattered rings + arena rings
  let ri = 0;
  for (const r of R.scat) { if (ri >= ringPool.length) break; const m = ringPool[ri++]; m.visible = !(r.life < 1.5 && Math.floor(t * 12) % 2); m.position.set(r.x, r.y, 0.3); m.rotation.y = t * 8; }
  if (R.arenaRings) for (const o of R.arenaRings) { if (o.t > 0 || ri >= ringPool.length) continue; const m = ringPool[ri++]; m.visible = true; m.position.set(o.x, o.y, 0); m.rotation.y = t * 3; }
  for (; ri < ringPool.length; ri++) ringPool[ri].visible = false;
  // props
  for (const o of R.ctx.springs) { o.anim = Math.max(0, (o.anim || 0) - dt); const k = o.anim > 0 ? 1 + Math.sin(o.anim * 30) * 0.4 : 1; o.m.userData.coil.scale.y = 0.4 * k; o.m.userData.top.position.y = 0.6 * k; }
  for (const o of R.ctx.boosts) o.m.userData.arrows.color.setHSL(0.14, 1, 0.5 + 0.25 * Math.sin(t * 10));
  for (const o of R.ctx.hooks) o.m.userData.ring.rotation.y = t * 2;
  for (const o of R.ctx.fans) { o.m.userData.bl.rotation.y = t * 14; o.m.userData.streaks.forEach((s, i) => { s.position.y = (t * 7 + i * 1.7) % o.h; }); }
  for (const o of R.ctx.cannons) { o.anim = Math.max(0, (o.anim || 0) - dt); o.m.userData.bar.scale.y = 1 + o.anim; }
  for (const o of R.movers) o.m.position.set((o.s.x0 + o.s.x1) / 2, o.s.y0 - 0.35, 0);
  for (const s of R.crumbles) { s.m.visible = !s.off || s.rt > 2.4; s.m.position.y = s.off ? s.by - 0.4 - (3.2 - s.rt) * 6 : s.by - 0.4; s.m.position.x = (s.x0 + s.x1) / 2 + (s.tt > 0 ? Math.sin(t * 60) * 0.06 : 0); }
  for (const o of R.cps) { o.m.userData.ball.material = MD.toon(o.on ? '#7df9ff' : '#94a3b8'); o.m.userData.flag.material = o.m.userData.ball.material; }
  if (R.goal) R.goal.m.userData.pan.rotation.y = t * (R.done ? 14 : 2);
  for (const o of R.cages) { if (o.fm) { o.freeT -= dt; o.fm.position.y += dt * 2.5; o.fm.material.opacity = Math.max(0, o.freeT / 2.2); if (o.freeT <= 0) { V.remove(o.fm); o.fm = null; } } else if (!o.broken) o.m.userData.crit.position.y = 0.95 + Math.sin(t * 4 + o.x) * 0.08; }
  for (const o of R.foes) {
    if (o.dead) { if (o.deadT > 0) { o.deadT -= dt; o.m.position.set(o.dx, o.dy + (0.5 - o.deadT) * 4, 0.5); o.m.rotation.z += dt * 12; o.m.scale.setScalar(Math.max(0.01, o.deadT * 2)); } else o.m.visible = false; continue; }
    const fp = foePos(o, t); o.m.position.set(fp[0], fp[1], 0); o.m.rotation.y = fp[2] > 0 ? -0.4 : Math.PI + 0.4;
    const b = o.m.userData.body; if (o.k === 'walker' || o.k === 'spiky') { b.position.y = Math.abs(Math.sin(t * 8 + o.ph)) * 0.08; o.m.userData.feet.forEach((f, i) => { f.position.x = 0.1 + Math.sin(t * 9 + i * 3) * 0.2; }); }
    if (o.k === 'hopper') b.scale.y = 1 + Math.sin(t * 5.2 + o.ph * 2) * 0.12;
    if (o.k === 'flyer') o.m.userData.wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * (0.3 + Math.sin(t * 22) * 0.5); });
  }
  for (const o of R.haz) if (o.t === 'fire') { const c = (t + o.ph) % 3.2, on = c > 1.0 && c < 2.2, warn = c > 0.4 && c <= 1.0; o.m.userData.fl.visible = on; o.m.userData.fl.scale.y = 2.4 * (0.85 + Math.sin(t * 30) * 0.15); o.m.userData.warn.visible = warn && Math.floor(t * 10) % 2 === 0; }
  for (const o of R.fakes) { const inside = me.x > o.x0 - 0.3 && me.x < o.x1 + 0.3 && me.y < o.y1 + 0.5 && me.y > o.y0 - 1; o.a = GD.lerp(o.a == null ? 1 : o.a, inside ? 0.25 : 1, Math.min(1, dt * 6)); o.m.material.opacity = o.a; o.m.material.depthWrite = o.a > 0.9; }
  if (R.chaseM) { const on = !!R.chase; R.chaseM.visible = on; if (on) { const gy = Ph.groundAt(R.ctx.S, R.chase.x, -999, 999); R.chaseM.position.set(R.chase.x - 4, (gy ? gy[1] : 0) + 2, 0); R.chaseM.userData.ball.rotation.z -= dt * 3; } }
  if (R.boss) { R.bossV.sync(R.boss, t, dt); }
  V.updateFx(dt);
}
function renderOther(o, t, dt) {
  if (!o.s || !R) { if (o.mesh) o.mesh.visible = false; return; }
  const key = o.s.hero + ':' + o.s.skin;
  if (!o.mesh || o.mkey !== key) { if (o.mesh) V.remove(o.mesh); o.mesh = V.add(MD.hero(o.s.hero, o.s.skin)); o.mkey = key; o.bub = V.add(new T.Mesh(MD.geo.s, new T.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.35, depthWrite: false }))); o.bub.scale.setScalar(1.25); o.ix = o.s.x; o.iy = o.s.y; }
  const age = Math.min(0.15, (performance.now() - (o.at || 0)) / 1000);
  const tx = o.s.x + (o.s.mode === 'run' ? o.s.vx * age : 0), ty = o.s.y + (o.s.mode === 'run' && !o.s.g ? o.s.vy * age : 0);
  const k = Math.min(1, dt * 18); o.ix = Math.abs(tx - o.ix) > 6 ? tx : GD.lerp(o.ix, tx, k); o.iy = Math.abs(ty - o.iy) > 6 ? ty : GD.lerp(o.iy, ty, k);
  const s = Object.assign({}, o.s, { x: o.ix, y: o.iy, g: !!o.s.g });
  MD.animHero(o.mesh, s, t, dt);
  o.mesh.visible = o.mesh.visible && o.s.mode !== 'dead';
  o.bub.visible = o.s.mode === 'bubble'; o.bub.position.set(o.ix, o.iy + 0.8, 0);
}
function updateTags() {
  const box = $('tags'); const seen = {};
  if (R && G.online()) {
    for (const k in GS.others) {
      const o = GS.others[k]; if (!o.s || !o.mesh) continue; seen[k] = 1;
      let el = tagEls[k]; if (!el) { el = tagEls[k] = document.createElement('div'); el.className = 'tag'; box.appendChild(el); }
      el.textContent = o.name + (o.s.mode === 'bubble' ? ' \uD83E\uDEE7' : '') + (o.s.fin ? ' \uD83C\uDFC1' : ''); el.style.background = o.color;
      const p = V.project(o.ix, o.iy + 2.3, 0); el.style.left = p[0] + 'px'; el.style.top = p[1] + 'px'; el.style.display = p[2] ? '' : 'none';
    }
    if (me) { let el = tagEls.__me; if (!el) { el = tagEls.__me = document.createElement('div'); el.className = 'tag'; box.appendChild(el); } seen.__me = 1; el.textContent = 'YOU'; el.style.background = save.color; const p = V.project(me.x, me.y + 2.3, 0); el.style.left = p[0] + 'px'; el.style.top = p[1] + 'px'; }
  }
  for (const k in tagEls) if (!seen[k]) { tagEls[k].remove(); delete tagEls[k]; }
}

/* ---------------- HUD ---------------- */
let hudKey = '';
function updateHud(force) {
  if (!R || !me) return;
  $('nRings').textContent = me.rings; $('pRings').classList.toggle('zero', me.rings === 0 && !R.done && !save.assist);
  $('nSparks').textContent = R.got; $('nSparksT').textContent = '/' + R.L.sparks;
  $('pSparks').classList.toggle('hidden', R.L.sparks === 0);
  $('pTime').textContent = GD.fmtTime(R.clock); $('nLives').textContent = save.lives;
  const ck = R.cageGot.join('') + R.L.cages;
  if (ck !== hudKey || force) { hudKey = ck; const crit = (i) => GD.CRITTERS[(i + R.def.w * 3 + R.def.i) % GD.CRITTERS.length]; $('pCages').innerHTML = R.L.cages ? [0, 1, 2].map((i) => '<span class="' + (R.cageGot[i] ? 'on' : '') + '">' + crit(i) + '</span>').join('') : ''; $('pCages').classList.toggle('hidden', !R.L.cages); }
  // hint
  let h = null; for (const o of R.hints) if (o.x <= me.x + 4 && me.x - o.x < 26) h = o;
  if (h !== GS.lastHint) { GS.lastHint = h; $('hint').classList.toggle('hidden', !h); if (h) $('hint').textContent = document.body.classList.contains('touch') ? h.ttext : h.text; }
  if (R.boss) $('bossHp').style.width = (100 * Math.max(0, R.boss.hp) / R.boss.max) + '%';
  $('chaseWarn').classList.toggle('hidden', !(R.chase && me.x - R.chase.x < 9 && !R.done));
  if (GS.net && GS.net.room) { $('roomPill').classList.remove('hidden'); $('roomPill').textContent = '\uD83D\uDCE1 ' + GS.net.room.code + ' \u00B7 ' + (Object.keys(GS.others).length + 1) + '/3' + (R.race ? ' \u00B7 RACE' : ''); } else $('roomPill').classList.add('hidden');
  if (GS.bannerT > 0) { GS.bannerT -= 0.1; if (GS.bannerT <= 0) $('banner').classList.add('hidden'); }
}
G.updateHud = updateHud;

/* ---------------- pause / screens ---------------- */
G.pause = function (on) {
  if (!R) return;
  if (G.online()) { GS.paused = false; $('scrPause').classList.toggle('hidden', !on); return; } // online: menu only, game keeps running
  GS.paused = on; $('scrPause').classList.toggle('hidden', !on); $('assistT2').checked = save.assist;
};
G.showScreens = function () {
  const ui = GS.ui;
  $('hud').classList.toggle('hidden', ui !== 'game');
  ['scrTitle', 'scrMap', 'scrOnline', 'scrHero', 'scrUnlocks'].forEach((id) => $(id).classList.add('hidden'));
  if (ui === 'title') $('scrTitle').classList.remove('hidden');
  if (ui === 'map') $('scrMap').classList.remove('hidden');
  if (ui === 'online') $('scrOnline').classList.remove('hidden');
  if (ui === 'hero') $('scrHero').classList.remove('hidden');
  if (ui === 'unlocks') $('scrUnlocks').classList.remove('hidden');
  if (ui !== 'game') { $('scrPause').classList.add('hidden'); $('bossBar').classList.add('hidden'); $('hint').classList.add('hidden'); }
  $('scrLevel').classList.add('hidden');
  if (ui !== 'game') $('scrResult').classList.add('hidden');
  updateRot();
};
function updateRot() { const port = innerHeight > innerWidth * 1.1; $('rotHint').classList.toggle('hidden', !(port && GS.ui === 'game' && !GS.rotX)); }

/* ---------------- menu backdrop scene ---------------- */
let menuHero = null;
G.menuScene = function () {
  if (R) return;
  const L = GD.buildLevel(GD.lvById('1-1')); V.build(L, GD.WORLDS[0]);
  menuHero = MD.hero(save.hero, save.skin[save.hero] || 0); V.add(menuHero); GS.menuT = 0;
};
G.refreshMenuHero = function () { if (R || !menuHero) return; V.remove(menuHero); menuHero = MD.hero(save.hero, save.skin[save.hero] || 0); V.add(menuHero); };
function renderMenu(dt) {
  GS.menuT = (GS.menuT || 0) + dt; const t = GS.menuT;
  if (menuHero) MD.animHero(menuHero, { x: 6, y: 0, vx: 7 + Math.sin(t * 0.7) * 3, vy: 0, face: 1, mode: 'run', g: 1 }, t, dt);
  V.camTo(7.5 + Math.sin(t * 0.25) * 1.5, 0.6, dt, false, 0.62);
  V.updateFx(dt);
}
/* ---------------- loop ---------------- */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000); last = now; GS.time += dt;
  if (GS.ui === 'game' && R && !GS.paused) {
    readInput();
    GS.fixedAcc += dt; let n = 0; let first = true;
    while (GS.fixedAcc >= DT && n < 8) { if (!first) { inp.jumpP = inp.atkP = inp.dashP = false; } step(DT); GS.fixedAcc -= DT; n++; first = false; }
    if (GS.net) GS.net.tick(dt);
    render(dt); updateTags();
    if ((GS.hudT = (GS.hudT || 0) + dt) > 0.1) { GS.hudT = 0; updateHud(); }
  } else if (GS.ui === 'game' && R) { render(0); }
  else { if (GS.net) GS.net.tick(dt); renderMenu(dt); }
  V.render();
}
G.boot = function () {
  V.init($('c')); setupTouch();
  addEventListener('resize', () => { V.resize(); updateRot(); });
  addEventListener('pagehide', persist);
  $('bMute').innerHTML = save.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
  $('bMute').onclick = () => G.toggleMute();
  $('bPause').onclick = () => G.pause(true);
  $('rotX').onclick = () => { GS.rotX = true; updateRot(); };
  G.menuScene();
  if (G.UI) G.UI.init();
  requestAnimationFrame(frame);
  if (GS.net) GS.net.hubCheck();
};

/* ---------------- test hooks: bot + headless simulation ---------------- */
// simple autopilot: hold right, jump at edges/walls, glide, wall-jump, release hooks, punch cages
function botInput(i) {
  const p = me; if (!p || !R) return;
  const S = R.ctx.S; i.lx = 1; i.down = false; i.dash = false; i.dashP = false; i.atkP = false;
  const B = GS.botS = GS.botS || { hold: 0, jt: 0 };
  i.jumpP = false;
  if (p.mode === 'hook') { const k = p.hook; i.jump = false; if (k.th > 0.25 && k.w > 0) i.jumpP = true; return; }
  if (p.mode === 'bubble') { i.jumpP = true; return; }
  if (R.boss) { botBoss(i); return; }
  if (p.gs) {
    const ahead = p.x + 1.2 + Math.max(0, p.vx) * 0.12;
    const g = Ph.groundAt(S, ahead, p.y - 3.5, p.y + 0.7);
    const wall = Ph.wallHit(S, p.x + 0.9, p.y, 0.62);
    const foe = R.foes.find((o) => !o.dead && (() => { const fp = foePos(o, R.t); return fp[0] - p.x > 0 && fp[0] - p.x < 3 && Math.abs(fp[1] - p.y) < 2; })());
    if ((!g || wall || foe) && p.t - B.jt > 0.25) { i.jumpP = true; i.jump = true; B.hold = 1; B.jt = p.t; return; }
  }
  if (!p.gs) { if (p.wallDir && p.t - B.jt > 0.12) { i.jumpP = true; B.jt = p.t; } i.jump = B.hold > 0 || p.vy < 0; if (p.vy < -2 && Ph.groundAt(S, p.x + 0.8, p.y - 2.2, p.y + 0.2)) i.jump = false; }
  else { i.jump = false; B.hold = 0; }
  if (R.cages.some((o) => !o.broken && Math.abs(o.x - p.x) < 2 && Math.abs(o.y - p.y) < 2)) i.atkP = true;
}
function botBoss(i) {
  const p = me, b = R.boss; i.jump = false;
  const d = b.x - p.x;
  if (b.vuln) { i.lx = Math.sign(d); if (Math.abs(d) < 3.2 && p.gs) { i.jumpP = true; i.jump = true; } if (!p.gs) { i.jump = true; i.lx = Math.abs(d) > 0.4 ? Math.sign(d) : 0; } }
  else { const away = p.x < 20 ? 1 : -1; i.lx = Math.abs(d) < 8 ? -Math.sign(d) : 0; if (p.x < -3) i.lx = 1; if (p.x > 43) i.lx = -1; for (const h of b.haz) if (h.k === 'wave' && Math.abs(h.x - p.x) < 3 && p.gs) { i.jumpP = true; i.jump = true; } }
  void away;
}
window.__gd = {
  G, GS, GD, V, save: () => save, R: () => R, me: () => me, inp,
  start(id, o) { G.loadLevel(id, o); },
  tp(x, y) { if (me) { me.x = x; me.y = y; me.vx = 0; me.vy = 0; me.gs = null; } },
  // run a level headlessly with the autopilot; returns {ok, t, x, deaths}
  sim(id, maxT, god) {
    G.loadLevel(id); GS.bot = botInput; GS.botGod = god !== false; GS.botS = null;
    let t = 0, deaths = 0, lastX = me.x, stuckT = 0, maxX = me.x;
    const lives0 = save.lives;
    while (t < (maxT || 400) && !R.done) {
      readInput(); step(DT); t += DT; inp.jumpP = inp.atkP = inp.dashP = false;
      if (me.mode === 'dead') deaths += 0;
      if (me.x > maxX + 0.5) { maxX = me.x; stuckT = 0; } else stuckT += DT;
      if (stuckT > 25) break;
    }
    const res = { id, ok: !!R.done, t: +t.toFixed(1), x: +me.x.toFixed(1), y: +me.y.toFixed(1), len: R.L.len, sparks: R.got, sparkTot: R.L.sparks, cages: R.L.cages, lives: save.lives - lives0, mode: me.mode };
    GS.bot = null; GS.botGod = false; R.done = true; save.lives = 5;
    return res;
  }
};
})();
