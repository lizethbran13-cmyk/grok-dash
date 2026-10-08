/* Grok Dash - menus: title, heroes, unlocks, world map, level card, online, pause, results */
(function () {
'use strict';
const GD = window.GD, GN = window.GrokNet, G = GD.G, GS = G.GS, Snd = GD.Snd, $ = G.$, N = GS.net;
const UI = G.UI = {};
const esc = GN.esc;
const save = () => G.save();
const medal = (m) => '<span class="medal m' + (m | 0) + '"></span>';
function show(ui) { GS.ui = ui; G.showScreens(); }
UI.closeAll = function () { ['scrLevel', 'scrResult', 'scrPause'].forEach((id) => $(id).classList.add('hidden')); };

UI.init = function () {
  const s = save();
  // title
  const ni = $('nameIn'); ni.value = s.name || '';
  ni.addEventListener('input', () => { s.name = ni.value.trim() ? GN.cleanName(ni.value) : ''; G.persist(); });
  const row = $('colorRow');
  const draw = () => { row.innerHTML = GN.COLORS.map((c) => '<button type="button" data-c="' + c + '" style="background:' + c + '" class="' + (c === s.color ? 'on' : '') + '" aria-label="color"></button>').join(''); };
  draw(); row.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b) return; s.color = b.dataset.c; G.persist(); draw(); Snd.init(); Snd.fx('click'); });
  const need = () => { Snd.init(); Snd.music(6); if (!s.name) { s.name = 'Lizeth'; ni.value = s.name; } G.persist(); GN.saveProfile(s.name, s.color); };
  $('bPlay').onclick = () => { need(); Snd.fx('click'); show('map'); UI.map(); };
  $('bOnline').onclick = () => { need(); show('online'); N.msg(''); };
  $('bHeroes').onclick = () => { need(); GS.heroBack = 'title'; show('hero'); UI.heroes(); };
  $('bUnlocks').onclick = () => { need(); show('unlocks'); UI.unlocks(); };
  $('bMapHero').onclick = () => { GS.heroBack = 'map'; show('hero'); UI.heroes(); };
  $('bHeroDone').onclick = () => { Snd.fx('click'); show(GS.heroBack || 'title'); if (GS.ui === 'map') UI.map(); };
  $('bUnlDone').onclick = () => show('title');
  const at = $('assistT'), at2 = $('assistT2');
  at.checked = !!s.assist; at.onchange = () => { s.assist = at.checked; G.persist(); };
  at2.onchange = () => { s.assist = at2.checked; at.checked = s.assist; G.persist(); const me = G.me(); if (me) me.shield = s.assist ? 1 : 0; };
  // online
  $('bHost').onclick = () => { need(); N.host(); };
  const ci = $('codeIn'); ci.addEventListener('input', () => { ci.value = GN.normalizeCode(ci.value); });
  ci.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('bJoin').click(); });
  $('bJoin').onclick = () => { need(); N.join(ci.value); };
  $('bOnlineBack').onclick = () => { N.leave(); show('title'); };
  $('bMapBack').onclick = () => { if (N.room) { if (!confirm('Leave the room?')) return; N.leave(); } show('title'); };
  // pause
  $('bResume').onclick = () => G.pause(false);
  $('bRestartCp').onclick = () => { G.pause(false); G.respawnCp(); };
  $('bRestartLv').onclick = () => { const R = G.R(); G.pause(false); if (!R) return; if (N.room && N.room.isHost) N.pick(R.id, R.race); else if (!N.room) G.loadLevel(R.id); else G.toast('Only the host can restart the level', true); };
  $('bQuitMap').onclick = () => { G.pause(false); if (N.room && !N.room.isHost) { if (!confirm('Leave the room and go back to your own map?')) return; N.leave(); G.quitLevel(); return; } if (N.room) N.toMap(); else G.quitLevel(); };
  $('arcadeLink').href = GN.hubUrl();
  document.addEventListener('visibilitychange', () => { if (document.hidden && GS.ui === 'game' && !N.room) G.pause(true); });
};

/* ---------- heroes ---------- */
UI.heroes = function () {
  const s = save();
  const bar = (n, v, mx) => '<div class="stat">' + n + '<em><i style="width:' + Math.round(100 * v / mx) + '%"></i></em></div>';
  $('heroList').innerHTML = GD.HERO_IDS.map((id) => {
    const h = GD.HEROES[id], lock = h.lock && !GD.isUnlocked(s, h.lock), sk = GD.SKINS[id][s.skin[id] || 0];
    return '<button type="button" class="hcard' + (s.hero === id ? ' on' : '') + (lock ? ' lock' : '') + '" data-h="' + id + '"><div class="hface" style="background:' + sk[1] + ';border-color:' + sk[2] + '">' + (lock ? '\uD83D\uDD12' : h.icon) + '</div><b>' + h.name + '</b><small>' + (lock ? 'Rescue 15 critters' : h.tag) + '</small>' +
      bar('Speed', h.run, 14.2) + bar('Jump', h.jump, 16.4) + bar('Glide', 4.5 - h.glide, 3.0) + bar('Dash', h.dash, 25) + '</button>';
  }).join('');
  $('heroList').onclick = (e) => { const b = e.target.closest('[data-h]'); if (!b) return; const id = b.dataset.h, h = GD.HEROES[id]; if (h.lock && !GD.isUnlocked(s, h.lock)) { G.toast('\uD83D\uDD12 Rescue 15 critters to unlock Candy!', true); Snd.fx('no'); return; } s.hero = id; G.persist(); Snd.fx('click'); UI.heroes(); G.refreshMenuHero(); };
  const id = s.hero;
  $('skinList').innerHTML = GD.SKINS[id].map((k, i) => { const lock = k[3] && !GD.isUnlocked(s, k[3]); const u = GD.UNLOCKS.find((q) => q.id === k[3]); return '<button type="button" class="skin' + ((s.skin[id] || 0) === i ? ' on' : '') + (lock ? ' lock' : '') + '" data-s="' + i + '"><i style="background:' + k[1] + ';border-color:' + k[2] + '"></i>' + (lock ? '\uD83D\uDD12 ' : '') + k[0] + (lock && u ? ' <small>(' + u.need + ')</small>' : '') + '</button>'; }).join('');
  $('skinList').onclick = (e) => { const b = e.target.closest('[data-s]'); if (!b) return; const i = +b.dataset.s, k = GD.SKINS[id][i]; if (k[3] && !GD.isUnlocked(s, k[3])) { Snd.fx('no'); return; } s.skin[id] = i; G.persist(); Snd.fx('click'); UI.heroes(); G.refreshMenuHero(); };
};
UI.unlocks = function () {
  const s = save(), c = GD.count(s);
  let h = '<p class="sub">\u2728 ' + c.sparks + ' Sparks \u00B7 \uD83D\uDC39 ' + c.crit + ' critters \u00B7 \uD83C\uDFC5 ' + c.medals + ' medals</p><div class="ulist">';
  GD.UNLOCKS.forEach((u) => { const p = u.p(s), ok = p[0] >= p[1]; h += '<div class="urow' + (ok ? ' done' : '') + '">' + (ok ? '\u2705' : '\uD83D\uDD12') + '<span>' + esc(u.name) + '<small>' + esc(u.need) + ' \u2014 ' + Math.min(p[0], p[1]) + '/' + p[1] + '</small></span></div>'; });
  GD.WORLDS.forEach((w, i) => { const n = GD.worldCrit(s, i), ok = n >= GD.BONUS_NEED; h += '<div class="urow' + (ok ? ' done' : '') + '">' + (ok ? '\u2705' : '\uD83D\uDD12') + '<span>Bonus level ' + (i + 1) + '-S: ' + esc(GD.LEVELS.find((l) => l.id === (i + 1) + '-S').name) + '<small>Rescue ' + GD.BONUS_NEED + ' critters in ' + w.name + ' \u2014 ' + Math.min(n, GD.BONUS_NEED) + '/' + GD.BONUS_NEED + '</small></span></div>'; });
  $('unlockList').innerHTML = h + '</div>';
};

/* ---------- map ---------- */
UI.map = function () {
  const s = save();
  if (GS.mapW == null) { GS.mapW = 0; for (let w = 4; w >= 0; w--) if (GD.worldOpen(s, w)) { GS.mapW = w; break; } }
  $('worldTabs').innerHTML = GD.WORLDS.map((w, i) => { const open = GD.worldOpen(s, i); return '<button type="button" class="wtab' + (i === GS.mapW ? ' on' : '') + (open ? '' : ' lock') + '" data-w="' + i + '">' + (open ? w.icon : '\uD83D\uDD12') + '<small>World ' + (i + 1) + '</small></button>'; }).join('');
  $('worldTabs').onclick = (e) => { const b = e.target.closest('[data-w]'); if (!b) return; const w = +b.dataset.w; if (!GD.worldOpen(s, w)) { G.toast('\uD83D\uDD12 Beat the World ' + w + ' boss to open this world!', true); Snd.fx('no'); return; } GS.mapW = w; Snd.fx('click'); UI.map(); };
  const W = GD.WORLDS[GS.mapW];
  const lvs = GD.LEVELS.filter((l) => l.w === GS.mapW);
  let h = '<div class="wname">' + W.icon + ' ' + esc(W.name) + ' <small>(\uD83D\uDC39 ' + GD.worldCrit(s, GS.mapW) + '/12)</small></div><div id="nodes">';
  lvs.forEach((l) => {
    const open = GD.levelOpen(s, l), r = s.lv[l.id] || {};
    const bg = l.kind === 'boss' ? 'linear-gradient(180deg,#ff6b7d,#b0123a)' : l.kind === 'bonus' ? 'linear-gradient(180deg,#ffd23f,#ff8a1a)' : 'linear-gradient(180deg,' + W.plat + ',' + W.side2 + ')';
    const cg = l.kind === 'normal' ? [0, 1, 2].map((i) => (r.cages && r.cages[i] ? '\uD83D\uDC39' : '\u25CB')).join('') : '';
    h += '<button type="button" class="node' + (open ? '' : ' lock') + (r.done ? ' done' : '') + '" style="background:' + bg + '" data-l="' + l.id + '"><b>' + (open ? (l.kind === 'boss' ? '\uD83D\uDC79' : l.kind === 'bonus' ? '\u2B50' : l.id) : '\uD83D\uDD12') + '</b><small>' + esc(l.kind === 'boss' ? 'BOSS' : l.kind === 'bonus' ? 'BONUS' : l.name) + (l.chase ? ' \uD83C\uDFC3' : '') + '</small>' + (open && l.kind !== 'boss' ? '<span class="meds">' + medal(r.medal) + medal(r.tmedal) + '</span>' : '') + (cg ? '<small>' + cg + '</small>' : '') + '</button>';
  });
  $('worldBox').innerHTML = h + '</div>';
  $('worldBox').onclick = (e) => { const b = e.target.closest('[data-l]'); if (!b) return; const l = GD.lvById(b.dataset.l); if (!GD.levelOpen(s, l)) { Snd.fx('no'); G.toast(l.kind === 'bonus' ? '\uD83D\uDD12 Rescue ' + GD.BONUS_NEED + ' critters in this world to open the bonus level!' : '\uD83D\uDD12 Finish the level before this one first!', true); return; } if (N.room && !N.room.isHost) { G.toast('The host picks the level \u2014 hang tight!'); return; } Snd.fx('click'); UI.levelCard(l); };
  $('mapTitle').textContent = N.room ? (N.room.isHost ? 'PICK A LEVEL' : 'ROOM ' + N.room.code) : 'WORLD MAP';
  UI.mapWait();
};
UI.mapWait = function () {
  const w = $('mapWait'); if (!N.room) { w.classList.add('hidden'); return; }
  const names = N.room.players().map((p) => esc(p.name) + (p.host ? ' \uD83D\uDC51' : '')).join(', ');
  w.classList.remove('hidden');
  w.innerHTML = '\uD83D\uDCE1 Room <b>' + N.room.code + '</b> \u00B7 ' + names + '<br>' + (N.room.isHost ? 'Tap a level to play together &mdash; or pick RACE to race your friends!' : 'Waiting for the host to pick a level\u2026 (you can change your HERO)');
};
UI.levelCard = function (l) {
  const s = save(), r = s.lv[l.id] || {}, L = GD.buildLevel(l);
  let h = '<h2>' + (l.kind === 'boss' ? '\uD83D\uDC79 ' : l.kind === 'bonus' ? '\u2B50 ' : '') + esc(l.id + ' ' + l.name) + '</h2>';
  h += '<p class="sub">' + (l.kind === 'boss' ? 'Watch for the flashing warnings, dodge, then hit it while it\u2019s dizzy (\u2B50)!' : l.kind === 'bonus' ? 'A super-fast bonus stage packed with Sparks!' : l.chase ? 'CHASE LEVEL \u2014 keep running, something big is coming!' : GD.WORLDS[l.w].name) + '</p>';
  h += '<div class="lvinfo">';
  if (l.kind !== 'boss') h += '<div>\u2728 Sparks: <b>' + (r.sparks || 0) + '/' + L.sparks + '</b><br><small>' + medal(1) + L.medals[0] + ' ' + medal(2) + L.medals[1] + ' ' + medal(3) + L.medals[2] + '</small></div>';
  h += '<div>\u23F1 Best: <b>' + (r.time ? GD.fmtTime(r.time) : '--') + '</b><br><small>' + medal(1) + GD.fmtTime(L.times[0]) + ' ' + medal(3) + GD.fmtTime(L.times[2]) + '</small></div>';
  if (l.kind === 'normal') h += '<div>\uD83D\uDC39 Critters: <b>' + ((r.cages || []).filter(Boolean).length) + '/3</b></div>';
  h += '<div>\u25CE Best rings: <b>' + (r.rings || 0) + '</b></div></div>';
  h += '<div class="btncol"><button id="lvPlay" class="btn primary" type="button">' + (N.room ? 'PLAY TOGETHER' : 'PLAY') + '</button>' + (N.room && l.kind !== 'boss' ? '<button id="lvRace" class="btn pink" type="button">\uD83C\uDFC1 RACE FRIENDS</button>' : '') + '<button id="lvBack" class="btn alt small" type="button">BACK</button></div>';
  $('levelCard').innerHTML = h; $('scrLevel').classList.remove('hidden');
  $('lvPlay').onclick = () => { Snd.init(); $('scrLevel').classList.add('hidden'); if (N.room) N.pick(l.id, false); else G.loadLevel(l.id); };
  if ($('lvRace')) $('lvRace').onclick = () => { $('scrLevel').classList.add('hidden'); N.pick(l.id, true); };
  $('lvBack').onclick = () => $('scrLevel').classList.add('hidden');
};
UI.raceBoard = function (r) {
  const b = $('raceBoard'); const R = G.R();
  if (!R || !R.race) { b.classList.add('hidden'); return; }
  b.classList.remove('hidden');
  b.innerHTML = '\uD83C\uDFC1 RACE<br>' + (r && r.length ? r.map((q, i) => (i + 1) + '. ' + esc(q.name) + ' ' + GD.fmtTime(q.time)).join('<br>') : '<small>First to the \u2B50 wins!</small>');
};

/* ---------- results ---------- */
function nextLevel(id) {
  const s = save(), i = GD.LEVELS.findIndex((l) => l.id === id);
  for (let k = i + 1; k < GD.LEVELS.length; k++) { const l = GD.LEVELS[k]; if (l.kind === 'bonus') continue; return GD.levelOpen(s, l) ? l : null; }
  return null;
}
UI.result = function (res) {
  const R = G.R(); $('raceBoard').classList.add('hidden');
  let h = '<div class="res"><h2>' + (res.race ? (res.place === 1 ? '\uD83E\uDD47 YOU WON!' : res.place ? 'PLACE #' + res.place : 'RACE OVER') : res.isBoss ? '\uD83C\uDFC6 BOSS BEATEN!' : '\uD83C\uDF89 LEVEL CLEAR!') + '</h2>';
  if (res.race) h += res.race.map((q, i) => '<div class="resrow' + (q.pid === GS.pid ? ' new' : '') + '"><span>' + (i + 1) + '. ' + esc(q.name) + '</span><b>' + GD.fmtTime(q.time) + '</b></div>').join('');
  if (!res.isBoss) h += '<div class="resrow' + (res.newBest.sparks ? ' new' : '') + '"><span>\u2728 Sparks ' + res.sparks + '/' + res.sparkTot + '</span>' + medal(res.medal) + '</div>';
  h += '<div class="resrow' + (res.newBest.time ? ' new' : '') + '"><span>\u23F1 Time ' + GD.fmtTime(res.time) + (res.newBest.time ? ' (best!)' : '') + '</span>' + medal(res.tmedal) + '</div>';
  h += '<div class="resrow"><span>\u25CE Rings</span><b>' + res.rings + '</b></div>';
  if (res.cageTot) h += '<div class="resrow"><span>\uD83D\uDC39 Critters rescued</span><b>' + res.cages.filter(Boolean).length + '/3</b></div>';
  (res.unlocks || []).forEach((u) => { h += '<div class="unl">\uD83C\uDF81 UNLOCKED: ' + esc(u) + '!</div>'; });
  (res.opened || []).forEach((u) => { h += '<div class="unl">\uD83D\uDDFA\uFE0F New level open: ' + esc(u) + '</div>'; });
  h += '<div class="btncol">';
  if (N.room && !N.room.isHost) h += '<p class="sub">Waiting for the host to pick the next level\u2026</p><button id="rLeave" class="btn alt small" type="button">LEAVE ROOM</button>';
  else if (N.room) h += '<button id="rMap" class="btn primary" type="button">CONTINUE</button><button id="rRetry" class="btn blue" type="button">PLAY AGAIN</button>';
  else { const nx = nextLevel(res.id); if (nx) h += '<button id="rNext" class="btn primary" type="button">NEXT: ' + esc(nx.id + ' ' + nx.name) + '</button>'; h += '<button id="rRetry" class="btn blue" type="button">PLAY AGAIN</button><button id="rMap" class="btn alt" type="button">WORLD MAP</button>'; }
  h += '</div></div>';
  $('resultCard').innerHTML = h; $('scrResult').classList.remove('hidden');
  const nx = nextLevel(res.id);
  if ($('rNext')) $('rNext').onclick = () => { $('scrResult').classList.add('hidden'); G.loadLevel(nx.id); };
  if ($('rRetry')) $('rRetry').onclick = () => { $('scrResult').classList.add('hidden'); if (N.room) N.pick(res.id, !!res.race); else G.loadLevel(res.id); };
  if ($('rMap')) $('rMap').onclick = () => { $('scrResult').classList.add('hidden'); if (N.room) N.toMap(); else { const l = GD.lvById(res.id); GS.mapW = l.w; const n = nextLevel(res.id); if (n) GS.mapW = n.w; G.quitLevel(); } };
  if ($('rLeave')) $('rLeave').onclick = () => { $('scrResult').classList.add('hidden'); N.leave(); G.quitLevel(); };
  void R;
};
})();
