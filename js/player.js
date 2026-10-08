/* Grok Dash - player physics: momentum, slopes, loops, quarter-pipes, rails, springs, boosts,
   hooks, cannons, fans, glide, wall-jump/wall-run, dash, spin-dash, bubble */
(function () {
'use strict';
const GD = window.GD, clamp = GD.clamp;
const G = GD.GRAV, H = 1.5, HW = 0.4, MAXFALL = 30;
const P = GD.Phys = { H, HW };

P.newPlayer = function (heroId, x, y) {
  const h = GD.HEROES[heroId] || GD.HEROES.grok;
  return { hero: h.id, h, x, y, px: x, py: y, vx: 0, vy: 0, gs: null, slope: 0, face: 1, mode: 'run', t: 0,
    coyote: 0, jbuf: 0, jumped: false, glide: false, wallDir: 0, lockT: 0, mom: 0, boostT: 0, atkT: 0, atkCD: 0,
    dashT: 0, dashCD: 0, airDash: h.airDash, djump: h.djump, roll: false, charge: 0, crouch: false, grind: false,
    launchT: 0, launchVx: 0, ballistic: false, hook: null, hookCD: {}, invT: 0, hurtT: 0, loop: null, cannon: null, fanT: 0, bubT: 0, spinT: 0, ang: 0, landT: 0, events: [] };
};
P.top = (s, x) => (s.x1 === s.x0 ? s.y0 : s.y0 + (s.y1 - s.y0) * clamp((x - s.x0) / (s.x1 - s.x0), 0, 1));
function ev(p, n, a) { p.events.push(a ? [n, a] : [n]); }

// highest surface top at x within [ylo, yhi]
function groundAt(S, x, ylo, yhi, skip) {
  let best = null, bt = -1e9;
  for (let i = 0; i < S.length; i++) {
    const s = S[i]; if (s.off || x < s.x0 || x > s.x1 || s === skip) continue;
    const t = P.top(s, x); if (t >= ylo && t <= yhi && t > bt) { bt = t; best = s; }
  }
  return best ? [best, bt] : null;
}
P.groundAt = groundAt;
function wallHit(S, x, y, stepTol) {
  const a = x - HW, b = x + HW;
  for (let i = 0; i < S.length; i++) {
    const s = S[i]; if (s.off || s.ow || b <= s.x0 || a >= s.x1) continue;
    const t = Math.max(P.top(s, Math.max(a, s.x0)), P.top(s, Math.min(b, s.x1)));
    if (t > y + stepTol && s.yb < y + H - 0.05) return s;
  }
  return null;
}
P.wallHit = wallHit;

P.step = function (p, inp, dt, ctx) {
  const S = ctx.S, h = p.h;
  p.events.length = 0; p.px = p.x; p.py = p.y; p.t += dt;
  for (const k of ['coyote', 'jbuf', 'lockT', 'boostT', 'atkT', 'atkCD', 'dashT', 'dashCD', 'launchT', 'invT', 'hurtT', 'fanT', 'landT']) if (p[k] > 0) p[k] -= dt;
  for (const k in p.hookCD) { p.hookCD[k] -= dt; if (p.hookCD[k] <= 0) delete p.hookCD[k]; }
  if (inp.jumpP) p.jbuf = 0.14;
  if (p.mode === 'bubble' || p.mode === 'dead' || p.mode === 'done' || p.mode === 'frozen') return;
  if (p.mode === 'loop') return stepLoop(p, dt);
  if (p.mode === 'qpipe') return stepQpipe(p, dt);
  if (p.mode === 'cannon') return stepCannon(p, dt);
  if (p.mode === 'hook') return stepHook(p, inp, dt);
  const grounded = !!p.gs;
  let lx = p.lockT > 0 || p.ballistic ? 0 : inp.lx;
  if (Math.abs(lx) > 0.15) p.face = lx > 0 ? 1 : -1;
  // attack (punch)
  if (inp.atkP && p.atkCD <= 0 && p.mode === 'run') { p.atkT = 0.22; p.atkCD = 0.3; ev(p, 'punch'); }
  // spin-dash charge
  if (p.mode === 'spin') {
    if (!grounded) { p.mode = 'run'; }
    else {
      p.charge = Math.min(1, p.charge + dt / 0.7 + (inp.dashP ? 0.35 : 0) + (inp.jumpP ? 0.35 : 0)); p.jbuf = 0;
      if (inp.dashP || inp.jumpP) ev(p, 'rev');
      p.vx *= Math.max(0, 1 - 10 * dt);
      if (!inp.down || (!inp.dash && p.t - p.spinT > 0.8 && !inp.down)) {
        p.mode = 'run'; p.vx = p.face * (17 + 13 * p.charge); p.roll = true; p.boostT = Math.max(p.boostT, 0.9); ev(p, 'spindash'); p.charge = 0;
      }
      return groundMove(p, dt, ctx, S);
    }
  }
  p.crouch = grounded && inp.down && Math.abs(p.vx) < 5 && !p.roll;
  if (p.crouch && (inp.dash || inp.dashP)) { p.mode = 'spin'; p.charge = 0.15; p.spinT = p.t; ev(p, 'rev'); return groundMove(p, dt, ctx, S); }
  if (grounded && inp.down && Math.abs(p.vx) >= 5 && !p.roll) { p.roll = true; ev(p, 'roll'); }
  // dash
  if (inp.dashP && !inp.down && p.dashCD <= 0) {
    if (Math.abs(inp.lx) > 0.2) p.face = inp.lx > 0 ? 1 : -1;
    if (grounded) { p.vx = p.face * Math.max(Math.abs(p.vx), h.dash); p.dashT = 0.32; p.dashCD = 0.5; p.boostT = Math.max(p.boostT, 0.5); ev(p, 'dash'); }
    else if (p.airDash > 0) { p.airDash--; p.vx = p.face * Math.max(Math.abs(p.vx), h.dash * 0.95); p.vy = Math.max(p.vy, 1.5); p.dashT = 0.26; p.dashCD = 0.35; p.ballistic = false; ev(p, 'dash'); }
  }
  // horizontal
  const runCap = h.run * (1 + 0.22 * p.mom);
  if (grounded) {
    if (p.crouch) lx = 0;
    if (Math.abs(lx) > 0.15) {
      const want = lx * runCap;
      if (Math.sign(lx) !== Math.sign(p.vx) && Math.abs(p.vx) > 1) p.vx += Math.sign(lx) * (p.roll ? 14 : 60) * dt;
      else if (Math.abs(p.vx) < Math.abs(want)) p.vx = Math.sign(lx) * Math.min(Math.abs(want), Math.abs(p.vx) + h.acc * dt * (p.roll ? 0.3 : 1));
      else p.vx -= Math.sign(p.vx) * (p.boostT > 0 ? 0 : 3) * dt;
      if (Math.abs(lx) > 0.8 && Math.abs(p.vx) >= h.run * 0.96) p.mom = Math.min(1, p.mom + dt / 2.2); else p.mom = Math.max(0, p.mom - dt);
    } else {
      const f = p.roll ? 5 : p.boostT > 0 ? 4 : 28;
      p.vx = Math.abs(p.vx) <= f * dt ? 0 : p.vx - Math.sign(p.vx) * f * dt; p.mom = Math.max(0, p.mom - dt * 2);
    }
    p.vx += -p.slope * (p.roll ? 34 : 22) * dt;
    if (p.grind) { const d = p.vx !== 0 ? Math.sign(p.vx) : p.face; if (Math.abs(p.vx) < 9) p.vx = d * 9; }
    if (p.roll && Math.abs(p.vx) < 6) p.roll = false;
  } else {
    if (Math.abs(lx) > 0.15) {
      const cap = Math.max(runCap, Math.abs(p.vx));
      p.vx = clamp(p.vx + lx * 26 * dt, -cap, cap);
    } else p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx), 2.5 * dt);
    if (p.launchT > 0 && p.launchVx) p.vx = p.launchVx > 0 ? Math.max(p.vx, p.launchVx) : Math.min(p.vx, p.launchVx);
  }
  p.vx = clamp(p.vx, -34, 34);
  // jumps
  if (p.jbuf > 0 && (grounded || p.coyote > 0) && p.mode === 'run') {
    p.vy = h.jump + Math.min(2.2, Math.abs(p.vx) * 0.07); if (grounded && p.slope * p.vx > 0) p.vy += Math.min(4, Math.abs(p.slope * p.vx) * 0.5);
    p.gs = null; p.coyote = 0; p.jbuf = 0; p.jumped = true; p.grind = false; p.crouch = false; p.airDash = h.airDash; p.djump = h.djump; ev(p, 'jump');
  } else if (!grounded && p.jbuf > 0 && p.wallDir) {
    p.vx = -p.wallDir * 10; p.vy = h.jump * 0.98; p.face = -p.wallDir; p.lockT = 0.22; p.jbuf = 0; p.jumped = true; p.wallDir = 0; p.airDash = h.airDash; p.ballistic = false; ev(p, 'walljump');
  } else if (!grounded && inp.jumpP && p.djump > 0 && p.coyote <= 0) {
    p.djump--; p.vy = h.jump * 0.92; p.jbuf = 0; p.jumped = true; ev(p, 'djump');
  }
  if (!grounded && p.jumped && !inp.jump && p.vy > 6) p.vy = 6;
  if (!p.gs) airMove(p, inp, dt, ctx, S); else groundMove(p, dt, ctx, S);
  checkSpecial(p, inp, ctx);
};

function airMove(p, inp, dt, ctx, S) {
  const h = p.h;
  // gravity / glide / fans
  let fan = null;
  for (const f of ctx.fans) if (Math.abs(p.x - f.x) < f.w / 2 + 0.3 && p.y > f.y - 1 && p.y < f.y + f.h) { fan = f; break; }
  p.glide = !!(inp.jump && p.vy < 0.5 && !p.roll && !p.ballistic && p.dashT <= 0) || !!(fan && inp.jump);
  if (p.dashT > 0) p.vy = Math.max(p.vy - G * 0.3 * dt, -2);
  else p.vy -= G * dt;
  if (p.glide && !fan) { if (p.vy < -h.glide) p.vy += (-h.glide - p.vy) * Math.min(1, 10 * dt); const cap = Math.max(h.gspd, Math.abs(p.vx) - 4 * dt); if (Math.abs(p.vx) > cap) p.vx = Math.sign(p.vx) * cap; }
  if (fan) { p.vy += (p.glide ? 78 : 26) * dt; p.vy = Math.min(p.vy, p.glide ? 10 : 4); p.fanT = 0.2; if (p.glide) p.airDash = h.airDash; }
  if (p.vy < -MAXFALL) p.vy = -MAXFALL;
  // x
  let nx = p.x + p.vx * dt;
  const w = wallHit(S, nx, p.y, 0.3);
  p.wallDir = 0;
  if (w) {
    const d = p.vx > 0 ? 1 : p.vx < 0 ? -1 : (nx > (w.x0 + w.x1) / 2 ? -1 : 1);
    nx = d > 0 ? w.x0 - HW - 0.001 : w.x1 + HW + 0.001;
    if (Math.abs(p.vx) >= 14 && !p.ballistic) { p.vy = Math.max(p.vy, Math.abs(p.vx) * 0.85); ev(p, 'wallrun'); }
    p.vx = 0; p.wallDir = d; p.ballistic = false;
  } else {
    // wall probe (for wall jumps while not pushing)
    if (wallHit(S, nx + 0.12, p.y, 0.3)) p.wallDir = 1; else if (wallHit(S, nx - 0.12, p.y, 0.3)) p.wallDir = -1;
  }
  if (p.wallDir && p.vy < 0 && inp.lx * p.wallDir > 0.3) { p.vy = Math.max(p.vy, -4); p.glide = false; }
  p.x = nx;
  // y
  let ny = p.y + p.vy * dt;
  if (p.vy <= 0) {
    let best = null, bt = -1e9;
    for (const ox of [0, -HW * 0.85, HW * 0.85]) {
      const sx = p.x + ox;
      for (let i = 0; i < S.length; i++) {
        const s = S[i]; if (s.off || sx < s.x0 || sx > s.x1) continue;
        const t = P.top(s, sx); if (p.y >= t - 0.08 - (s.k === 'mover' ? 0.25 : 0) && ny <= t + 0.001 && t > bt) { bt = t; best = s; }
      }
    }
    if (best) {
      ny = bt; p.gs = best; p.slope = (best.y1 - best.y0) / Math.max(0.01, best.x1 - best.x0); p.vy = 0;
      p.jumped = false; p.airDash = p.h.airDash; p.djump = p.h.djump; p.ballistic = false; p.glide = false; p.launchT = 0; p.wallDir = 0; p.landT = 0.12;
      if (best.k === 'rail') { p.grind = true; ev(p, 'grind'); } else ev(p, 'land');
      if (best.k === 'crumble' && !best.tt) best.tt = 0.45;
    }
  } else {
    for (let i = 0; i < S.length; i++) {
      const s = S[i]; if (s.off || s.ow || p.x + HW * 0.6 <= s.x0 || p.x - HW * 0.6 >= s.x1) continue;
      if (s.yb >= p.y + H - 0.06 && s.yb < ny + H) { ny = s.yb - H; p.vy = 0; break; }
    }
  }
  p.y = ny;
}

function groundMove(p, dt, ctx, S) {
  const s0 = p.gs;
  if (s0.k === 'mover' && s0.dxF !== undefined) { p.x += s0.dxF; }
  let nx = p.x + p.vx * dt;
  const w = wallHit(S, nx, p.y, 0.62);
  if (w) {
    const d = p.vx > 0 ? 1 : -1;
    nx = d > 0 ? w.x0 - HW - 0.001 : w.x1 + HW + 0.001;
    if (Math.abs(p.vx) >= 15) { p.vy = Math.abs(p.vx) * 0.8; p.gs = null; p.jumped = false; p.x = nx; ev(p, 'wallrun'); p.vx = 0; p.wallDir = d; return; }
    p.vx = 0; p.roll = false;
  }
  p.x = nx;
  const snap = 0.45 + Math.abs(p.vx) * dt * 1.6;
  const g = groundAt(S, nx, p.y - snap, p.y + 0.62);
  if (g && !(g[0].off)) {
    const s = g[0];
    if (s !== p.gs) { if (s.k === 'rail' && !p.grind) ev(p, 'grind'); p.grind = s.k === 'rail'; if (s.k === 'crumble' && !s.tt) s.tt = 0.45; }
    p.gs = s; p.y = g[1]; p.slope = (s.y1 - s.y0) / Math.max(0.01, s.x1 - s.x0); p.vy = 0;
    if (s.k === 'mover' && s.dyF) { /* follow */ }
  } else {
    // left the ground: keep velocity along the surface (ramps launch you!)
    p.vy = p.vx * p.slope; if (p.vy < 0) p.vy *= 0.6;
    if (s0.k === 'rail' && p.vy > 0) p.vy += 2;
    p.gs = null; p.coyote = 0.11; p.grind = false; p.slope = 0;
    if (p.vy > 3) p.jumped = false;
  }
}

function checkSpecial(p, inp, ctx) {
  const g = !!p.gs;
  // springs
  for (const s of ctx.springs) {
    if (Math.abs(p.x - s.x) < 0.95 && p.y >= s.y - 0.3 && p.y <= s.y + 0.9 && p.vy <= 0.5) {
      p.vy = s.v; p.gs = null; p.jumped = false; p.grind = false; p.roll = false; p.airDash = p.h.airDash; p.djump = p.h.djump; p.ballistic = false; s.anim = 0.4; ev(p, 'spring'); p.launchT = 0.05; return;
    }
  }
  if (g) {
    for (const b of ctx.boosts) if (Math.abs(p.x - b.x) < 1.1 && Math.abs(p.y - b.y) < 0.8) { if (!(p.boostT > 1.3)) ev(p, 'boost'); p.vx = b.dir * Math.max(Math.abs(p.vx), 25); p.face = b.dir; p.boostT = 1.6; }
    for (const l of ctx.loops) if (p.px < l.x && p.x >= l.x && p.vx >= 10 && Math.abs(p.y - l.y) < 0.6) { p.mode = 'loop'; p.loop = { o: l, a: -Math.PI / 2, sp: p.vx }; p.x = l.x; ev(p, 'loop'); return; }
    for (const q of ctx.qpipes) if (p.vx >= 9 && p.x >= q.x - q.r - HW - 0.6 && p.x <= q.x && Math.abs(p.y - q.y) < 0.6) { p.mode = 'qpipe'; p.loop = { o: q, a: -Math.PI / 2, sp: Math.max(p.vx, 14) }; ev(p, 'loop'); return; }
  }
  for (const c of ctx.cannons) if (Math.abs(p.x - c.x) < 1.2 && p.y >= c.y - 0.2 && p.y < c.y + 2.2 && !(p.cannonCD > p.t)) { p.mode = 'cannon'; p.cannon = { o: c, t: 0.5 }; p.vx = 0; p.vy = 0; p.gs = null; ev(p, 'cannonIn'); return; }
  if (!g && p.mode === 'run') {
    for (const k of ctx.hooks) {
      if (p.hookCD[k.id]) continue;
      const dx = p.x - k.x, dy = (p.y + 1) - k.y, d = Math.hypot(dx, dy);
      if (d < 2.8 && dy < 0.6) {
        const len = clamp(d, 1.8, 2.8), th = Math.atan2(dx, -dy);
        p.mode = 'hook'; p.hook = { o: k, len, th, w: (p.vx * Math.cos(th) + p.vy * Math.sin(th)) / len, t: 0 }; p.glide = false; p.ballistic = false; ev(p, 'hook'); return;
      }
    }
  }
}

function stepLoop(p, dt) {
  const L = p.loop, o = L.o;
  L.a += (L.sp / o.r) * dt; L.sp = Math.max(L.sp - 2 * dt, 11);
  if (L.a >= Math.PI * 1.5) { p.mode = 'run'; p.x = o.x + 0.02; p.y = o.y; p.vx = L.sp + 1.5; p.vy = 0; p.ang = 0; p.boostT = Math.max(p.boostT, 0.6); return; }
  p.x = o.x + Math.cos(L.a) * o.r; p.y = o.y + o.r + Math.sin(L.a) * o.r; p.ang = L.a + Math.PI / 2; p.vx = L.sp; p.vy = 0; p.face = 1;
}
function stepQpipe(p, dt) {
  const L = p.loop, o = L.o, cx = o.x - o.r - HW, cy = o.y + o.r;
  L.a += (L.sp / o.r) * dt;
  if (L.a >= 0) { p.mode = 'run'; p.x = o.x - HW - 0.01; p.y = cy; p.vx = 0; p.vy = Math.max(L.sp, 19); p.gs = null; p.launchT = 1.2; p.launchVx = 2.5; p.jumped = false; p.ang = 0; ev(p, 'spring'); return; }
  p.x = cx + Math.cos(L.a) * o.r; p.y = cy + Math.sin(L.a) * o.r; p.ang = L.a + Math.PI / 2; p.face = 1;
}
function stepCannon(p, dt) {
  const c = p.cannon, o = c.o; c.t -= dt; p.x = o.x; p.y = o.y + 0.6;
  if (c.t <= 0) {
    const th = 52 * Math.PI / 180, D = o.tx - o.x, Hh = o.ty + 0.5 - (o.y + 1.4);
    const v2 = G * D * D / (2 * Math.cos(th) ** 2 * (D * Math.tan(th) - Hh));
    const v = Math.sqrt(Math.max(40, v2));
    p.mode = 'run'; p.y = o.y + 1.4; p.vx = v * Math.cos(th); p.vy = v * Math.sin(th); p.ballistic = true; p.cannonCD = p.t + 1; p.jumped = false; p.face = 1; o.anim = 0.4; ev(p, 'cannon');
  }
}
function stepHook(p, inp, dt) {
  const k = p.hook; k.t += dt;
  k.w += (-(G / k.len) * Math.sin(k.th) + inp.lx * 2.6 * Math.cos(k.th) / k.len * 3) * dt;
  k.w *= (1 - 0.15 * dt);
  k.th += k.w * dt;
  if (k.th > 1.5) { k.th = 1.5; k.w = Math.min(k.w, 0); } if (k.th < -1.5) { k.th = -1.5; k.w = Math.max(k.w, 0); }
  p.x = k.o.x + Math.sin(k.th) * k.len; p.y = k.o.y - Math.cos(k.th) * k.len - 1;
  p.vx = k.len * k.w * Math.cos(k.th); p.vy = k.len * k.w * Math.sin(k.th);
  if (Math.abs(p.vx) > 0.5) p.face = p.vx > 0 ? 1 : -1;
  if (inp.jumpP || k.t > 6) {
    const d = Math.abs(inp.lx) > 0.3 ? Math.sign(inp.lx) : p.face;
    p.vx = d * Math.max(Math.abs(p.vx) + 2, 12); p.vy = Math.max(p.vy, 0) + 9.5;
    p.mode = 'run'; p.hookCD[k.o.id] = 0.6; p.hook = null; p.jumped = false; p.jbuf = 0; p.airDash = p.h.airDash; p.djump = p.h.djump; ev(p, 'jump');
  }
}
// bubble: float toward a target point; pop near it
P.bubble = function (p, tx, ty, dt, inp) {
  p.bubT += dt;
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), sp = Math.min(22, 6 + d * 1.5);
  if (d > 0.01) { p.x += dx / d * Math.min(d, sp * dt); p.y += dy / d * Math.min(d, sp * dt); }
  if (d < 2.2 && (inp.jumpP || p.bubT > 1.3)) { p.mode = 'run'; p.vx = 0; p.vy = 7; p.gs = null; p.invT = 1.2; p.bubT = 0; ev(p, 'pop'); return true; }
  return false;
};
})();
