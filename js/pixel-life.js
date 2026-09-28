'use strict';

/* ============================================================
   Experience: Bible Stories — Phase 12 Animation & Environmental Life
   Version: 12.0.0
   Visual-only environmental animation: swaying grass, butterflies,
   fireflies, drifting dust and small architectural life cues.
   World state, collision and quest logic remain authoritative.
   ============================================================ */

const PixelLife = (() => {
  function hash(x, y, seed) {
    let n = Math.imul((x | 0) ^ 0x45d9f3b, 0x27d4eb2d);
    n = Math.imul(n ^ (y | 0), 0x165667b1);
    n ^= (seed | 0) * 374761393;
    return ((n >>> 0) % 10000) / 10000;
  }

  function pixel(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  function drawGrassSway(ctx, world, x0, x1, y0, y1, time) {
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const type = world.tileAt(tx, ty);
        if (type !== T.GRASS && type !== T.MEADOW) continue;

        const r = hash(tx, ty, 121);
        if (r > (type === T.MEADOW ? 0.16 : 0.07)) continue;

        const x = tx * TILE + 6 + hash(tx, ty, 122) * (TILE - 12);
        const y = ty * TILE + 22 + hash(tx, ty, 123) * 7;
        const sway = Math.sin(time * (1.8 + r * 1.7) + tx * 0.8 + ty * 0.35) * 2;

        pixel(ctx, x, y - 6, 2, 6, '#39743b');
        pixel(ctx, x + sway, y - 8, 2, 5, '#579347');
        if (r > 0.72) pixel(ctx, x + 2 + sway, y - 5, 2, 3, '#6ca44e');
      }
    }
  }

  function drawButterflies(ctx, world, x0, x1, y0, y1, time) {
    // A few deterministic butterflies live in meadows. They never alter
    // World.animals, so they cannot affect quests, collision or interaction.
    for (let i = 0; i < 7; i++) {
      const seed = i * 17 + 9;
      const baseTx = x0 + ((i * 11 + 3) % Math.max(1, x1 - x0 + 1));
      const baseTy = y0 + ((i * 7 + 5) % Math.max(1, y1 - y0 + 1));
      if (world.tileAt(baseTx, baseTy) !== T.MEADOW) continue;

      const phase = seed * 0.73;
      const px = baseTx * TILE + 16 + Math.sin(time * 0.65 + phase) * 11;
      const py = baseTy * TILE + 12 + Math.cos(time * 0.9 + phase) * 8;
      const flap = Math.sin(time * 9 + phase) > 0 ? 4 : 2;

      pixel(ctx, px - 4, py - 2, flap, 3, i % 2 ? '#e6a94f' : '#d96c55');
      pixel(ctx, px + 1, py - 2, flap, 3, i % 2 ? '#e6a94f' : '#d96c55');
      pixel(ctx, px - 1, py, 3, 2, '#5b4730');
    }
  }

  function drawFireflies(ctx, world, x0, x1, y0, y1, time) {
    if (world.lit && !world.raining) return;

    for (let i = 0; i < 12; i++) {
      const seed = i * 31 + 4;
      const tx = x0 + ((i * 13 + 2) % Math.max(1, x1 - x0 + 1));
      const ty = y0 + ((i * 9 + 4) % Math.max(1, y1 - y0 + 1));
      const type = world.tileAt(tx, ty);
      if (type !== T.GRASS && type !== T.MEADOW) continue;

      const pulse = Math.sin(time * 3.2 + seed) * 0.5 + 0.5;
      if (pulse < 0.38) continue;
      const px = tx * TILE + 7 + hash(tx, ty, seed) * 18;
      const py = ty * TILE + 8 + hash(tx, ty, seed + 1) * 18;
      pixel(ctx, px, py, 2, 2, pulse > 0.72 ? '#ffe78a' : '#c8b85f');
    }
  }

  function drawDust(ctx, world, x0, x1, y0, y1, time) {
    // Dust is deliberately sparse and tied to dry terrain, not gameplay events.
    for (let i = 0; i < 10; i++) {
      const tx = x0 + ((i * 19 + 4) % Math.max(1, x1 - x0 + 1));
      const ty = y0 + ((i * 7 + 2) % Math.max(1, y1 - y0 + 1));
      if (world.tileAt(tx, ty) !== T.SAND) continue;

      const p = (time * 0.16 + i * 0.19) % 1;
      const px = tx * TILE + 8 + ((i * 7) % 17) + p * 5;
      const py = ty * TILE + 20 - p * 9;
      if (p > 0.18 && p < 0.9) pixel(ctx, px, py, 1, 1, '#d8bd82');
    }
  }

  function drawHutLife(ctx, world, time) {
    // A tiny animated smoke wisp makes settlements feel inhabited.
    for (let i = 0; i < (world.huts || []).length; i++) {
      const h = world.huts[i];
      if (!h) continue;
      const p = (time * 0.08 + i * 0.27) % 1;
      const sx = h.x + Math.sin(time * 0.8 + i) * 4;
      const sy = h.y - 31 - p * 18;
      const size = 2 + Math.floor(p * 2);
      pixel(ctx, sx, sy, size, size, p < 0.45 ? '#9b8d79' : '#756b5f');
      if (p > 0.75) pixel(ctx, sx - 2, sy + 3, 2, 2, '#b3a693');
    }
  }

  function beforeActors(ctx, world, x0, x1, y0, y1, time) {
    if (world.interior) return;
    drawGrassSway(ctx, world, x0, x1, y0, y1, time);
    drawButterflies(ctx, world, x0, x1, y0, y1, time);
    drawFireflies(ctx, world, x0, x1, y0, y1, time);
    drawDust(ctx, world, x0, x1, y0, y1, time);
    drawHutLife(ctx, world, time);
  }

  function afterActors(ctx, world, x0, x1, y0, y1, time) {
    if (world.interior) return;
    // Small ripples of floating pollen/light in calm, illuminated meadows.
    if (world.lit && !world.raining) {
      for (let i = 0; i < 8; i++) {
        const tx = x0 + ((i * 23 + 7) % Math.max(1, x1 - x0 + 1));
        const ty = y0 + ((i * 13 + 3) % Math.max(1, y1 - y0 + 1));
        if (world.tileAt(tx, ty) !== T.MEADOW) continue;
        const p = Math.sin(time * 1.4 + i * 2.1) * 0.5 + 0.5;
        if (p > 0.65) pixel(ctx, tx * TILE + 10 + i, ty * TILE + 8 + (i % 12), 1, 1, '#f1d98a');
      }
    }
  }

  return { beforeActors, afterActors };
})();
