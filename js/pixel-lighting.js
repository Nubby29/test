'use strict';
/* ============================================================
   Experience: Bible Stories — Phase 13 Lighting & Time-of-Day
   Version: 13.0.0
   Visual-only lighting system: dawn, day, dusk, night, dynamic
   light pools, fire/beacon warmth, story-driven darkness and
   time-shifted shadows. World state remains authoritative.
   ============================================================ */

const PixelLighting = (() => {
  const DAY_LENGTH = 600; // seconds of visual time; gameplay state is unaffected

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  function cycle(time) {
    const p = ((time % DAY_LENGTH) + DAY_LENGTH) / DAY_LENGTH;
    if (p < 0.10) return { name: 'dawn', t: p / 0.10 };
    if (p < 0.62) return { name: 'day', t: (p - 0.10) / 0.52 };
    if (p < 0.76) return { name: 'dusk', t: (p - 0.62) / 0.14 };
    return { name: 'night', t: (p - 0.76) / 0.24 };
  }

  function palette(state) {
    if (state.name === 'dawn') {
      const t = smooth(state.t);
      return {
        darkness: mix(0.34, 0.08, t),
        tint: [38, 31, 54],
        warm: mix(0.05, 0.16, t)
      };
    }
    if (state.name === 'dusk') {
      const t = smooth(state.t);
      return {
        darkness: mix(0.07, 0.31, t),
        tint: [55, 31, 47],
        warm: mix(0.12, 0.22, t)
      };
    }
    if (state.name === 'night') {
      return { darkness: 0.40, tint: [9, 15, 42], warm: 0.08 };
    }
    return { darkness: 0.055, tint: [18, 24, 35], warm: 0.025 };
  }

  function light(ctx, x, y, radius, strength, color) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || radius <= 0 || strength <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color.replace('ALPHA', String(Math.min(1, strength))));
    g.addColorStop(0.34, color.replace('ALPHA', String(Math.min(1, strength * 0.65))));
    g.addColorStop(0.72, color.replace('ALPHA', String(Math.min(1, strength * 0.20))));
    g.addColorStop(1, color.replace('ALPHA', '0'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function clearLight(ctx, x, y, radius, strength) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || radius <= 0 || strength <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, 'rgba(0,0,0,' + Math.min(0.96, strength) + ')');
    g.addColorStop(0.42, 'rgba(0,0,0,' + Math.min(0.72, strength * 0.78) + ')');
    g.addColorStop(0.78, 'rgba(0,0,0,' + Math.min(0.22, strength * 0.25) + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawShadow(ctx, x, y, length, alpha, phase) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const dx = Math.cos(phase) * length;
    const dy = Math.sin(phase) * length * 0.32;
    ctx.save();
    ctx.fillStyle = 'rgba(24,18,25,' + alpha + ')';
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 3);
    ctx.lineTo(x + 7, y + 3);
    ctx.lineTo(x + dx + 4, y + dy + 7);
    ctx.lineTo(x + dx - 5, y + dy + 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function beforeActors(ctx, world, x0, x1, y0, y1, time) {
    if (world.interior) return;
    const state = cycle(time);
    const p = palette(state);
    const lit = world.lit !== false;

    // Story-driven darkness overrides the automatic daytime palette.
    const darkness = lit ? p.darkness : 0.56;
    const tint = lit ? p.tint : [7, 12, 34];

    // Long shadows lengthen toward dawn/dusk and shorten around noon.
    const sunPhase = state.name === 'dawn' ? Math.PI * 0.18 :
      state.name === 'dusk' ? Math.PI * 0.82 : Math.PI * 0.50;
    const shadowAlpha = lit ? (state.name === 'day' ? 0.10 : 0.16) : 0.08;

    ctx.save();
    for (const tr of world.trees || []) {
      if (tr.x < x0 * TILE - 80 || tr.x > (x1 + 1) * TILE + 80 ||
          tr.y < y0 * TILE - 80 || tr.y > (y1 + 1) * TILE + 80) continue;
      drawShadow(ctx, tr.x, tr.y + 4, tr.r ? tr.r * 1.8 : 24, shadowAlpha, sunPhase);
    }
    for (const h of world.huts || []) {
      if (h.x < x0 * TILE - 100 || h.x > (x1 + 1) * TILE + 100 ||
          h.y < y0 * TILE - 100 || h.y > (y1 + 1) * TILE + 100) continue;
      drawShadow(ctx, h.x, h.y + 12, 38, shadowAlpha * 0.8, sunPhase);
    }
    ctx.restore();

    // Ambient screen/world tint. Canvas compositing keeps the light layer
    // independent from gameplay rendering.
    ctx.save();
    ctx.fillStyle = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ',' + darkness + ')';
    ctx.fillRect(x0 * TILE - 4, y0 * TILE - 4,
      (x1 - x0 + 1) * TILE + 8, (y1 - y0 + 1) * TILE + 8);
    ctx.restore();

    // Remove the dark layer around active light sources.
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    const pulse = 1 + Math.sin(time * 2.8) * 0.035;
    if (world.beacon && world.beacon.x > -1000) {
      clearLight(ctx, world.beacon.x, world.beacon.y - 32,
        (lit ? 92 : 72) * pulse, lit ? 0.72 : 0.58);
    }
    if (world.god && world.god.x > -1000) {
      clearLight(ctx, world.god.x, world.god.y - 14, lit ? 112 : 82, lit ? 0.68 : 0.45);
    }
    if (!lit) {
      clearLight(ctx, world.playerStart ? world.playerStart.x : 0,
        world.playerStart ? world.playerStart.y : 0, 1, 0);
    }
    if (world.burning) {
      clearLight(ctx, 1648, 272, 125 + Math.sin(time * 7) * 14, 0.82);
      clearLight(ctx, 1200, 176, 92 + Math.sin(time * 6 + 2) * 10, 0.72);
    }
    ctx.restore();

    // Warm light bloom sits on top of the recovered areas.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (world.beacon && world.beacon.x > -1000) {
      light(ctx, world.beacon.x, world.beacon.y - 32,
        lit ? 66 : 48, lit ? 0.20 : 0.10, 'rgba(255,218,112,ALPHA)');
    }
    if (world.god && world.god.x > -1000) {
      light(ctx, world.god.x, world.god.y - 14,
        lit ? 74 : 58, lit ? 0.15 : 0.10, 'rgba(255,242,198,ALPHA)');
    }
    if (world.burning) {
      light(ctx, 1648, 272, 82, 0.28, 'rgba(255,118,48,ALPHA)');
      light(ctx, 1200, 176, 62, 0.22, 'rgba(255,94,40,ALPHA)');
    }
    ctx.restore();
  }

  function afterActors(ctx, world, x0, x1, y0, y1, time) {
    if (world.interior) return;

    // A tiny golden horizon pulse sells sunrise/sunset without changing maps.
    const state = cycle(time);
    if (world.lit && (state.name === 'dawn' || state.name === 'dusk')) {
      const strength = state.name === 'dawn'
        ? Math.max(0, 1 - state.t) * 0.06
        : smooth(state.t) * 0.07;
      ctx.save();
      ctx.fillStyle = 'rgba(255,176,96,' + strength + ')';
      ctx.fillRect(x0 * TILE - 4, y0 * TILE - 4,
        (x1 - x0 + 1) * TILE + 8, (y1 - y0 + 1) * TILE + 8);
      ctx.restore();
    }

    // Firefly points become more visible as ambient light falls.
    if (world.lit && (state.name === 'dusk' || state.name === 'night')) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 10; i++) {
        const tx = x0 + ((i * 13 + 7) % Math.max(1, x1 - x0 + 1));
        const ty = y0 + ((i * 9 + 3) % Math.max(1, y1 - y0 + 1));
        const x = tx * TILE + 8 + ((i * 11) % 20);
        const y = ty * TILE + 8 + ((i * 7) % 20);
        const a = 0.12 + (Math.sin(time * 4 + i) + 1) * 0.07;
        ctx.fillStyle = 'rgba(255,228,126,' + a + ')';
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
      ctx.restore();
    }
  }

  function interior(ctx, world, time) {
    if (!world.interior) return;
    // Ark interior stays intentionally dark, with the window as its main light.
    const I = world.interior;
    ctx.save();
    ctx.fillStyle = world.raining
      ? 'rgba(18,28,54,0.24)'
      : 'rgba(10,7,5,0.18)';
    ctx.fillRect(I.x0 - 16, I.y0 - 16, I.x1 - I.x0 + 32, I.y1 - I.y0 + 32);
    ctx.globalCompositeOperation = 'lighter';
    light(ctx, I.window.x, I.y0 + 4, 110,
      world.raining ? 0.07 : 0.14,
      world.raining ? 'rgba(110,150,205,ALPHA)' : 'rgba(255,218,126,ALPHA)');
    ctx.restore();
  }

  return { beforeActors, afterActors, interior, cycle };
})();
