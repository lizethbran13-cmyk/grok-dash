/* Grok Dash - online co-op / race over grok-net (PeerJS, 5-letter codes, host-authoritative) */
(function () {
'use strict';
const GD = window.GD, GN = window.GrokNet, G = GD.G, GS = G.GS, Snd = GD.Snd, $ = G.$;
const N = GS.net = { room: null, sendT: 0, bossT: 0, race: null };
N.isHost = () => !N.room || N.room.isHost;
N.send = (m) => { if (N.room) N.room.send(m); };
N.bcast = (m) => { if (N.room && N.room.isHost) N.room.broadcast(m); };
N.take = (k, id) => { if (!N.room) return; if (N.room.isHost) N.bcast({ t: 'take', k, id, by: GS.pid }); else N.send({ t: 'take', k, id }); };
function msg(t, ok) { const e = $('onlineMsg'); e.textContent = t || ''; e.className = 'msg' + (ok ? ' ok' : ''); }
N.msg = msg;
function syncPlayers() {
  if (!N.room) return;
  const list = N.room.players(); const ids = {};
  list.forEach((p) => { if (p.pid === GS.pid) return; ids[p.pid] = 1; const o = GS.others[p.pid] = GS.others[p.pid] || { s: null }; o.name = p.name; o.color = p.color; });
  for (const k in GS.others) if (!ids[k]) dropOther(k);
  if (G.UI) G.UI.mapWait();
}
function dropOther(k) { const o = GS.others[k]; if (o) { if (o.mesh) GD.View.remove(o.mesh); if (o.bub) GD.View.remove(o.bub); } delete GS.others[k]; }
function common(room) {
  room.on('players', () => { if (N.room === room) syncPlayers(); });
  room.on('join', (p) => { if (N.room !== room) return; G.toast(p.name + ' joined! \uD83C\uDF89'); Snd.fx('join');
    if (room.isHost && GS.ui === 'game' && GS.R && !GS.R.done) room.sendTo(p.pid, { t: 'lv', id: GS.R.id, race: GS.R.race, t0: GS.R.t }); });
  room.on('leave', (p) => { if (N.room !== room) return; G.toast(p.name + ' left', true); Snd.fx('leave'); dropOther(p.pid); if (N.race && room.isHost) checkRace(); });
}
N.host = function (code) {
  N.leave(true);
  msg('Opening a room\u2026', true);
  const room = N.room = GN.createRoom({ role: 'host', code: code || undefined, name: G.myName(), color: G.save().color, autoCode: !code, rejoin: !!code, max: 3, pid: GS.pid });
  common(room);
  room.on('status', (t) => { if (!room.opened) msg(t, true); });
  room.on('open', () => { if (N.room !== room) return; GN.saveProfile(G.myName(), G.save().color); Snd.fx('join'); G.toast('Room ' + room.code + ' is open! Friends join with this code.'); GS.ui = 'map'; G.showScreens(); G.UI.map(); syncPlayers(); });
  room.on('message', (d, from) => {
    if (!d || typeof d !== 'object' || N.room !== room || from === GS.pid) return;
    const o = GS.others[from];
    switch (d.t) {
      case 'p': if (o && d.s) { o.s = clean(d.s); o.at = performance.now(); } break;
      case 'take': if (G.applyTake(d.k, d.id, from)) N.bcast({ t: 'take', k: d.k, id: d.id, by: from }); break;
      case 'goal': if (GS.R && !GS.R.race && !GS.R.done) G.endLevel(true); break;
      case 'bhit': if (GS.R && GS.R.boss && GD.Boss.hit(GS.R.boss)) G.bossHitFx(); break;
      case 'rfin': raceFin(from, +d.time || 0); break;
    }
  });
  room.on('error', (e) => { if (N.room !== room) return; if (!room.opened) { N.room = null; msg(e.title + ': ' + e.message); } else G.toast(e.title, true); });
  room.start();
};
N.join = function (code) {
  code = GN.normalizeCode(code);
  if (!GN.validCode(code)) { msg('Enter the 5-letter room code.'); return; }
  N.leave(true);
  msg('Joining room ' + code + '\u2026', true);
  const room = N.room = GN.createRoom({ role: 'join', code, name: G.myName(), color: G.save().color, pid: GS.pid, rejoin: !!N.fromHub });
  common(room);
  room.on('status', (t) => { if (!room.opened) msg(t, true); });
  room.on('open', () => { if (N.room !== room) return; GN.saveProfile(G.myName(), G.save().color); msg('Connected!', true); Snd.fx('join'); if (GS.ui !== 'game') { GS.ui = 'map'; G.showScreens(); G.UI.map(); } syncPlayers(); });
  room.on('message', (d) => {
    if (!d || typeof d !== 'object' || N.room !== room) return;
    const R = GS.R;
    switch (d.t) {
      case 'ps':
        for (const k in d.p) { if (k === GS.pid) continue; const o = GS.others[k] = GS.others[k] || { s: null, name: 'Friend', color: '#ff4fd8' }; o.s = clean(d.p[k]); o.at = performance.now(); }
        if (R && d.id === R.id) { if (Math.abs(R.t - d.lt) > 0.35) R.t = d.lt; if (d.cx != null) { R.chase = R.chase || { x: d.cx, sp: 0, pause: 0 }; R.chase.x = d.cx; } else R.chase = null; }
        break;
      case 'bs': if (R && R.boss && d.id === R.id) { const prev = R.boss.hp; R.boss = GD.Boss.unpack(d.b); if (R.boss.hp < prev) G.bossHitFx(); } break;
      case 'take': if (R) G.applyTake(d.k, d.id, d.by); break;
      case 'lv': G.UI.closeAll(); G.loadLevel(d.id, { race: d.race }); if (d.t0) GS.R.t = d.t0; break;
      case 'end': if (R && !R.race) G.endLevel(true, d); break;
      case 'map': G.quitLevel(); break;
      case 'race': N.race = d.r; G.UI.raceBoard(d.r); break;
      case 'raceEnd': raceEnd(d.r); break;
    }
  });
  room.on('reconnecting', () => G.toast('Lost the host \u2014 reconnecting\u2026', true));
  room.on('error', (e) => {
    if (N.room !== room) return;
    if (!room.opened) { N.room = null; msg(e.title + ': ' + e.message); GS.ui = 'online'; G.showScreens(); return; }
    // host left: keep playing solo, nothing breaks
    N.room = null; try { room.leave(); } catch (er) { /* ignore */ }
    for (const k in GS.others) dropOther(k);
    G.toast('The host left \u2014 you keep playing solo. Your save is safe!', true);
    if (GS.R && GS.R.race && !GS.R.done) GS.R.race = false;
    if (GS.ui === 'map') G.UI.map();
  });
  room.start();
};
N.leave = function (silent) {
  const r = N.room; N.room = null; N.race = null;
  if (r) try { r.leave(); } catch (e) { /* ignore */ }
  for (const k in GS.others) dropOther(k);
  if (!silent) msg('');
};
function clean(s) {
  const n = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
  return { x: n(s.x), y: n(s.y), vx: n(s.vx), vy: n(s.vy), face: s.face < 0 ? -1 : 1, mode: String(s.mode || 'run').slice(0, 8), g: s.g ? 1 : 0, roll: s.roll ? 1 : 0, glide: s.glide ? 1 : 0, atk: s.atk ? 1 : 0, inv: s.inv ? 1 : 0, ang: n(s.ang), landT: 0, hero: GD.HEROES[s.hero] ? s.hero : 'grok', skin: Math.max(0, Math.min(3, s.skin | 0)), rings: s.rings | 0, fin: n(s.fin) };
}
// periodic sends
N.tick = function (dt) {
  if (!N.room || !N.room.opened) return;
  const R = GS.R;
  if (GS.ui !== 'game' || !R) return;
  N.sendT -= dt; N.bossT -= dt;
  if (N.sendT <= 0) {
    N.sendT = 1 / 14;
    const s = G.snap(); if (!s) return;
    if (N.room.isHost) {
      const p = {}; p[GS.pid] = s; for (const k in GS.others) if (GS.others[k].s) p[k] = GS.others[k].s;
      N.bcast({ t: 'ps', id: R.id, lt: +R.t.toFixed(3), cx: R.chase ? +R.chase.x.toFixed(2) : null, p });
    } else N.send({ t: 'p', s });
  }
  if (N.room.isHost && R.boss && N.bossT <= 0) { N.bossT = 1 / 12; N.bcast({ t: 'bs', id: R.id, b: GD.Boss.pack(R.boss) }); }
  if (N.room.isHost && N.race && N.race.firstT && !N.race.over && performance.now() - N.race.firstT > 30000) finishRace();
};
// host: start a level for everyone
N.pick = function (id, race) {
  if (N.room && !N.room.isHost) return;
  N.race = race ? { fin: {}, firstT: 0, over: false } : null;
  if (N.room) N.bcast({ t: 'lv', id, race: !!race });
  G.UI.closeAll(); G.loadLevel(id, { race: !!race });
  if (race) G.UI.raceBoard([]);
};
N.toMap = function () { if (N.room && N.room.isHost) N.bcast({ t: 'map' }); G.quitLevel(); };
// race
N.raceFinish = function (time) { if (!N.room) { finishSoloRace(time); return; } if (N.room.isHost) raceFin(GS.pid, time); else N.send({ t: 'rfin', time }); };
function raceFin(pid, time) {
  if (!N.race || N.race.over || N.race.fin[pid]) return;
  N.race.fin[pid] = time; if (!N.race.firstT) N.race.firstT = performance.now();
  const r = standings(); N.bcast({ t: 'race', r }); G.UI.raceBoard(r);
  checkRace();
}
function checkRace() { if (!N.race || N.race.over) return; const need = N.room ? N.room.count() : 1; if (Object.keys(N.race.fin).length >= need) setTimeout(finishRace, 1200); }
function standings() {
  const nm = (pid) => (pid === GS.pid ? G.myName() : (GS.others[pid] && GS.others[pid].name) || 'Friend');
  return Object.keys(N.race.fin).map((pid) => ({ pid, name: nm(pid), time: N.race.fin[pid] })).sort((a, b) => a.time - b.time);
}
function finishRace() { if (!N.race || N.race.over) return; N.race.over = true; const r = standings(); N.bcast({ t: 'raceEnd', r }); raceEnd(r); }
function raceEnd(r) {
  const R = GS.R; if (!R) return;
  const i = r.findIndex((q) => q.pid === GS.pid);
  R.done = true; if (GS.me) GS.me.mode = 'done';
  if (i < 0 && R.clock) R.clock = Math.max(R.clock, 0);
  G.showResult({ race: r, place: i >= 0 ? i + 1 : 0 });
}
function finishSoloRace(time) { const R = GS.R; R.done = true; G.showResult({ race: [{ pid: GS.pid, name: G.myName(), time }], place: 1 }); }
// came from the Grok Arcade lobby?
N.fromHub = false;
N.hubCheck = function () {
  const prm = GN.params(); if (!prm) return;
  N.fromHub = true; G.save().name = prm.name; G.save().color = prm.color; G.persist();
  if (prm.mode === 'host') N.host(prm.code); else N.join(prm.code);
  GS.ui = 'online'; G.showScreens();
};
})();
