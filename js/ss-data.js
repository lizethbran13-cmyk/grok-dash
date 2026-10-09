/* Grok Dash - SUPER SONIC PACK (DLC from the Grok Arcade DLC Machine 3000, idea #14): data
   Unlocked by localStorage 'grokDLC.dash.super_sonic_pack_expansion' (set by the arcade's DLC Shop, same origin). */
(function () {
'use strict';
const GD = window.GD;
const SS = GD.SS = { KEY: 'grokDLC.dash.super_sonic_pack_expansion', ARCADE: 'https://lizethbran13-cmyk.github.io/grok-arcade/' };
SS.owned = () => { try { return !!localStorage.getItem(SS.KEY); } catch (e) { return false; } };
SS.hostHas = () => !!(GD.G && GD.G.GS && GD.G.GS.net && GD.G.GS.net.room && !GD.G.GS.net.room.isHost && GD.G.GS.net.hostSS);
SS.can = () => SS.owned() || SS.hostHas();
// a guest in a room plays whatever the host picks (the host owns it)
SS.canLoad = () => SS.can() || !!(GD.G && GD.G.GS.net && GD.G.GS.net.room && !GD.G.GS.net.room.isHost);

/* two new worlds */
const W5 = { id: 5, dlc: 'ss', name: 'Sunset Speedway', icon: '\uD83C\uDFCE\uFE0F', sky: ['#ff7ab6', '#ffd27a'], fog: '#ffb88a', top: '#4b4b5e', side: '#ff8a3d', side2: '#b8432a', plat: '#3ff0ff', acc: '#ffe14d', enemy: '#3b82f6', far: '#e0607a', mid: '#a83a5a', boss: 'Roller Rex', music: 7, bg: 'highway', pit: '#ff9a5a', tuft: '#ffd23f', chaseCol: '#ff3b6b',
  flavor: { speed: 3, rail: 2.6, qpipe: 2, boost: 1, gaps: 1.2, cannon: 1.4 } };
const W6 = { id: 6, dlc: 'ss', name: 'Starlight Carnival', icon: '\uD83C\uDFA1', sky: ['#120a3a', '#5b2bb5'], fog: '#2a1660', top: '#ff4fd8', side: '#3b2a8a', side2: '#1e1450', plat: '#ffe14d', acc: '#7df9ff', enemy: '#ff8a3d', far: '#4a2a9a', mid: '#2e1a6a', boss: 'GIGA GRUMBOT', music: 8, bg: 'carnival', pit: '#7c3aed', tuft: '#7df9ff', chaseCol: '#a78bfa',
  flavor: { hooks: 2.4, cannon: 2.2, movers: 2, glide: 1.8, spring: 1.6, rail: 1.4 } };
GD.WORLDS.push(W5, W6);
const NAMES = [['Turbo Start', 'Loop-de-Loop Lane', 'Ramp Rally', 'Rocket Rush!', 'Golden Hour'], ['Big Top Bounce', 'Balloon Hop', 'Coaster Climb', 'Fireworks Run!', 'Starfall Stage']];
[W5, W6].forEach((w, k) => {
  const wi = w.id;
  for (let i = 0; i < 4; i++) GD.LEVELS.push({ id: (wi + 1) + '-' + (i + 1), w: wi, i, kind: 'normal', name: NAMES[k][i], chase: i === 3, seed: 9100 + wi * 97 + i * 13, diff: GD.clamp(0.72 + k * 0.1 + i * 0.04, 0, 1), dlc: 'ss', flavor: w.flavor });
  GD.LEVELS.push({ id: (wi + 1) + '-B', w: wi, i: 4, kind: 'boss', name: w.boss, seed: 9500 + wi, diff: 0.85 + k * 0.1, dlc: 'ss', mega: k === 1 });
  GD.LEVELS.push({ id: (wi + 1) + '-S', w: wi, i: 5, kind: 'bonus', name: NAMES[k][4], seed: 9700 + wi * 31, diff: 0.4, dlc: 'ss' });
});
/* worlds 6 + 7 open right away / after the 6-B boss when you own the pack */
const baseOpen = GD.worldOpen;
GD.worldOpen = (s, w) => { const W = GD.WORLDS[w]; if (W && W.dlc) return SS.can() && (s.allOpen || w === 5 || !!(s.lv[w + '-B'] && s.lv[w + '-B'].done)); return baseOpen(s, w); };
const baseLv = GD.levelOpen;
GD.levelOpen = (s, lv) => { if (lv.dlc && !SS.can()) return false; if (lv.dlc && lv.i === 0 && lv.kind === 'normal') return GD.worldOpen(s, lv.w); return baseLv(s, lv); };

/* Super skins: [name, main, accent, unlock, 'super' aura | 'metal'] */
GD.SKINS.grok.push(['Super Grok', '#ffd700', '#fff59e', 'ss', 'super'], ['Metal Grok', '#9aa4b2', '#3ff0ff', 'ss', 'metal']);
GD.SKINS.speedy.push(['Hyper Speedy', '#f2fbff', '#7df9ff', 'ss', 'super'], ['Metal Speedy', '#3b4a6b', '#ff3b3b', 'ss', 'metal']);
GD.SKINS.floaty.push(['Super Floaty', '#ffe14d', '#ff6bd6', 'ss', 'super'], ['Metal Floaty', '#c7cdd8', '#ff6bd6', 'ss', 'metal']);
GD.SKINS.candy.push(['Super Candy', '#ffd23f', '#ffffff', 'ss', 'super'], ['Metal Candy', '#8a94a6', '#7df9ff', 'ss', 'metal']);
GD.UNLOCKS.push({ id: 'ss', name: 'Super Sonic Pack: Super + Metal skins, 2 worlds, GIGA GRUMBOT, BOSS MODE', need: 'DLC: unlock at the DLC Machine 3000 in Grok Arcade', p: () => [SS.can() ? 1 : 0, 1], dlc: true });
})();
