'use strict';
/* ============================================================
   Experience: Bible Stories — Phase 6: Pixel Effects & Polish
   Screen-space-safe, deterministic pixel effects. No gameplay state
   is changed here; this is a visual layer over the existing world.
   ============================================================ */

const PixelEffects = (() => {
  const P = {
    water: ['#6aa8b7', '#8bc7c4', '#3f8299'],
    dust: ['#d9b979', '#b98d58', '#f0d59b'],
    fire: ['#ffd36a', '#ff9f3d', '#e85b32'],
    rain: ['#b9d9e6', '#86b7cc'],
    smoke: ['#6f655b', '#918579', '#b0a69b']
  };

  function pixel(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  function hash(x, y, n) {
    let v = Math.imul((x | 0) ^ 0x45d9f3b, 0x27d4eb2d);
    v = Math.imul(v ^ (y | 0), 0x165667b1);
    v ^= (n | 0) * 374761393;
    return ((v >>> 0) % 1000) / 1000;
  }

  function drawWaterTile(ctx, tx, ty, x, y, size, time) {
    const phase = (tx * 0.71 + ty * 1.37);
    const wave = Math.sin(time * 2.4 + phase);
    const wave2 = Math.sin(time * 1.7 + phase * 1.9);
    pixel(ctx, x + 4 + ((tx + ty) & 3), y + 9 + Math.round(wave), 8, 2, P.water[1]);
    pixel(ctx, x + 18 + ((tx * 3 + ty) & 3), y + 19 + Math.round(wave2), 6, 2, P.water[0]);
    if ((tx + ty) % 4 === 0) pixel(ctx, x + 11, y + 27, 4, 1, P.water[2]);
  }

  function drawDust(ctx, x, y, time, seed) {
    for (let i = 0; i < 3; i++) {
      const p = (time * (0.18 + i * 0.04) + seed * 0.13 + i * 0.31) % 1;
      const sx = x + (hash(seed, i, 2) - 0.5) * 26 - p * 8;
      const sy = y - 3 - p * 13;
      const a = 1 - p;
      if (a > 0.15) pixel(ctx, sx, sy, i === 1 ? 2 : 1, 1, P.dust[i]);
    }
  }

  function drawFire(ctx, x, y, time, seed) {
    const flick = Math.sin(time * 8 + seed) * 2;
    pixel(ctx, x - 5, y - 1, 10, 5, P.fire[2]);
    pixel(ctx, x - 4, y - 6 - flick, 8, 8, P.fire[1]);
    pixel(ctx, x - 2, y - 11 - flick * 0.6, 4, 8, P.fire[0]);
    pixel(ctx, x + 4, y - 7 + flick, 3, 5, P.fire[0]);
  }

  function drawSmoke(ctx, x, y, time, seed) {
    for (let i = 0; i < 3; i++) {
      const p = (time * 0.12 + seed * 0.07 + i * 0.27) % 1;
      const sx = x + Math.sin(time * 1.3 + seed + i) * (3 + p * 6);
      const sy = y - 10 - p * 28;
      pixel(ctx, sx, sy, 3 + Math.round(p * 3), 3 + Math.round(p * 2), P.smoke[i]);
    }
  }

  function drawRain(ctx, x0, x1, y0, y1, time) {
    const w = (x1 - x0 + 1) * TILE;
    const h = (y1 - y0 + 1) * TILE;
    ctx.save();
    ctx.fillStyle = 'rgba(12,20,44,0.20)';
    ctx.fillRect(x0 * TILE, y0 * TILE, w, h);
    for (let i = 0; i < 90; i++) {
      const rx = x0 * TILE + ((i * 149 + Math.floor(time * 280)) % Math.max(1, w));
      const ry = y0 * TILE + ((i * 83 + Math.floor(time * 900)) % Math.max(1, h));
      pixel(ctx, rx, ry, 1, 5 + (i % 3), P.rain[i & 1]);
    }
    ctx.restore();
  }

  function drawAmbient(ctx, x0, x1, y0, y1, time) {
    for (let i = 0; i < 26; i++) {
      const tx = x0 + (i * 17) % Math.max(1, x1 - x0 + 1);
      const ty = y0 + (i * 11) % Math.max(1, y1 - y0 + 1);
      const px = tx * TILE + 8 + Math.round(Math.sin(time * 0.7 + i) * 2);
      const py = ty * TILE + 7 + ((i * 13) % 18);
      if (i % 3 === 0) pixel(ctx, px, py, 1, 1, '#f4df9a');
    }
  }

  function beforeActors(ctx, world, x0, x1, y0, y1, time) {
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (world.tileAt(tx, ty) === T.WATER) {
          drawWaterTile(ctx, tx, ty, tx * TILE, ty * TILE, TILE, time);
        }
      }
    }
    if (!world.interior && world.lit && !world.raining) drawAmbient(ctx, x0, x1, y0, y1, time);
    if (!world.interior && world.burning) {
      drawFire(ctx, 1648, 272, time, 11);
      drawFire(ctx, 1200, 176, time, 23);
      drawSmoke(ctx, 1648, 272, time, 11);
      drawSmoke(ctx, 1200, 176, time, 23);
    }
  }

  function afterActors(ctx, world, x0, x1, y0, y1, time) {
    if (!world.interior && world.raining) drawRain(ctx, x0, x1, y0, y1, time);
    if (!world.interior && world.burning) {
      drawDust(ctx, 1648, 272, time, 11);
      drawDust(ctx, 1200, 176, time, 23);
    }
    if (!world.interior && world.rainbow) {
      for (let i = 0; i < 12; i++) {
        const p = (time * 0.04 + i * 0.08) % 1;
        const cx = (world.ark ? world.ark.x : MAP_W * TILE / 2) + (p - 0.5) * 520;
        const cy = (world.ark ? world.ark.y : MAP_H * TILE / 2) - 80 - Math.abs(p - 0.5) * 80;
        pixel(ctx, cx, cy, 2, 2, ['#ffd66e', '#ff9c7a', '#9bd6ff'][i % 3]);
      }
    }
  }

  return { beforeActors, afterActors };
})();