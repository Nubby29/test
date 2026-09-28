'use strict';
/* ============================================================
   Experience: Bible Stories — Phase 3 Pixel Environment
   Authored pixel-style scenery and deterministic ground decoration.
   Gameplay coordinates/collision remain owned by World.
   ============================================================ */

const PixelObjects = (() => {
  const P = {
    outline: '#263b25',
    leafDark: '#285d35',
    leaf: '#3f8742',
    leafLight: '#63a94b',
    leafGold: '#8bb04b',
    trunkDark: '#5b3820',
    trunk: '#80502a',
    woodLight: '#a56b38',
    wall: '#c5a06b',
    wallLight: '#d7b982',
    roof: '#754a2a',
    roofLight: '#946238',
    shadow: 'rgba(20,18,12,0.26)',
    stoneDark: '#5c625d',
    stone: '#7d857c',
    stoneLight: '#a2a69a',
    flowerYellow: '#f0cf58',
    flowerWhite: '#eee5c7',
    flowerRed: '#d85b4b'
  };

  function hash(tx, ty, seed) {
    let n = (Math.imul(tx | 0, 374761393) + Math.imul(ty | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function pixelRect(ctx, x, y, w, h, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    if (stroke) {
      ctx.fillStyle = stroke;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), 2);
      ctx.fillRect(Math.round(x), Math.round(y + h - 2), Math.round(w), 2);
      ctx.fillRect(Math.round(x), Math.round(y), 2, Math.round(h));
      ctx.fillRect(Math.round(x + w - 2), Math.round(y), 2, Math.round(h));
    }
  }

  function shadow(ctx, x, y, w, h) {
    ctx.fillStyle = P.shadow;
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
  }

  function drawGroundDecor(ctx, type, tx, ty, x, y, size, timeValue) {
    // Only decorate naturally empty terrain. Never touch paths, soil, gardens,
    // bridges or water, so gameplay readability stays intact.
    const meadow = type === T.MEADOW;
    const grass = type === T.GRASS;
    const sand = type === T.SAND;
    const mountain = type === T.MOUNTAIN;
    if (!meadow && !grass && !sand && !mountain) return;

    const r = hash(tx, ty, 17);
    const r2 = hash(tx, ty, 41);
    const s = Math.max(1, Math.floor(size / 32));

    if ((grass || meadow) && r < (meadow ? 0.24 : 0.13)) {
      const bx = Math.round(x + 5 + r2 * (size - 10));
      const by = Math.round(y + 7 + hash(tx, ty, 73) * (size - 12));
      const stem = hash(tx, ty, 91) < 0.5 ? '#3d7f3d' : '#4b9141';
      ctx.fillStyle = stem;
      ctx.fillRect(bx, by - 5 * s, Math.max(1, s), 6 * s);
      ctx.fillRect(bx + s, by - 3 * s, Math.max(1, s), 3 * s);
      if (r2 > 0.62) {
        const flower = hash(tx, ty, 101) < 0.34 ? P.flowerYellow :
                       hash(tx, ty, 103) < 0.55 ? P.flowerWhite : P.flowerRed;
        ctx.fillStyle = flower;
        ctx.fillRect(bx - s, by - 7 * s, 2 * s, 2 * s);
        ctx.fillRect(bx + s, by - 6 * s, 2 * s, 2 * s);
      }
    }

    if (sand && r < 0.15) {
      const bx = Math.round(x + 5 + r2 * (size - 10));
      const by = Math.round(y + 7 + hash(tx, ty, 79) * (size - 12));
      ctx.fillStyle = '#b89458';
      ctx.fillRect(bx, by, 4 * s, Math.max(1, s));
      ctx.fillRect(bx + 2 * s, by - s, 2 * s, Math.max(1, s));
    }

    if (mountain && r < 0.11) {
      const bx = Math.round(x + 4 + r2 * (size - 8));
      const by = Math.round(y + 5 + hash(tx, ty, 81) * (size - 10));
      ctx.fillStyle = P.stoneDark;
      ctx.fillRect(bx, by, 5 * s, 3 * s);
      ctx.fillStyle = P.stoneLight;
      ctx.fillRect(bx + s, by, 2 * s, s);
    }
  }

  function drawTree(ctx, tr, timeValue) {
    let r = tr.r || tr.baseR || 11;
    if (tr.planted && typeof performance !== 'undefined') {
      const k = Math.min(1, (performance.now() - tr.growStart) / 800);
      r = (tr.r = tr.baseR * (0.3 + 0.7 * k));
    }

    const x = Math.round(tr.x);
    const y = Math.round(tr.y);
    const big = !!tr.big;
    const scale = big ? 1.22 : 1;
    const canopy = Math.max(10, Math.round(r * 1.55 * scale));

    // Pixel-art silhouette: hard-edged shadow, trunk, then clustered foliage.
    shadow(ctx, x, y + 5, canopy * 1.45, 7);

    pixelRect(ctx, x - 3, y - Math.round(r * 0.35), 6, Math.round(r * 0.72),
      P.trunk, P.trunkDark);
    ctx.fillStyle = P.trunkDark;
    ctx.fillRect(x - 5, y - 2, 3, 5);

    const dark = big ? '#24572f' : P.leafDark;
    const mid = big ? '#33753a' : P.leaf;
    const light = big ? '#579344' : P.leafLight;

    const blobs = [
      [-0.58, -0.48, 0.52], [0, -0.68, 0.62], [0.58, -0.48, 0.5],
      [-0.25, -0.98, 0.43], [0.3, -0.95, 0.43]
    ];
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const bw = Math.round(canopy * b[2]);
      const bh = Math.round(canopy * (0.46 + (i % 2) * 0.08));
      const bx = x + Math.round(canopy * b[0]) - Math.floor(bw / 2);
      const by = y + Math.round(r * b[1]) - Math.floor(bh / 2);
      pixelRect(ctx, bx, by, bw, bh, i === 1 ? mid : dark);
      if (i !== 0) {
        ctx.fillStyle = light;
        ctx.fillRect(bx + Math.max(2, Math.floor(bw * 0.2)), by + 2, Math.max(3, Math.floor(bw * 0.35)), 3);
      }
    }

    if (tr.special) {
      // Keep the special-tree identity, but express it with square fruit pixels.
      const knowledge = tr.special === 'knowledge';
      const fruit = knowledge ? '#e34d3d' : '#f0c84b';
      const hi = knowledge ? '#ff8a67' : '#ffe08a';
      const points = [[-0.55,-0.7],[0.05,-1.0],[0.56,-0.68],[-0.18,-0.48],[0.34,-0.45]];
      for (let i = 0; i < points.length; i++) {
        const fx = x + Math.round(canopy * points[i][0]);
        const fy = y + Math.round(r * points[i][1]);
        ctx.fillStyle = fruit;
        ctx.fillRect(fx, fy, 4, 4);
        if (i % 2 === 0) {
          ctx.fillStyle = hi;
          ctx.fillRect(fx, fy, 2, 2);
        }
      }
    }
  }

  function drawHut(ctx, h) {
    const x = Math.round(h.x), y = Math.round(h.y);
    shadow(ctx, x, y + 9, 46, 9);

    // Foundation
    pixelRect(ctx, x - 21, y + 4, 42, 5, '#8b6845');
    // Mud-brick wall with deliberately visible courses.
    pixelRect(ctx, x - 18, y - 16, 36, 25, P.wall, '#80613f');
    ctx.fillStyle = P.wallLight;
    ctx.fillRect(x - 15, y - 13, 12, 4);
    ctx.fillRect(x + 2, y - 13, 10, 4);
    ctx.fillStyle = '#a98858';
    ctx.fillRect(x - 15, y - 4, 8, 3);
    ctx.fillRect(x - 2, y - 4, 12, 3);

    // Heavy thatched roof, with a dark eave for depth.
    ctx.fillStyle = P.roof;
    ctx.fillRect(x - 25, y - 17, 50, 5);
    ctx.fillRect(x - 20, y - 22, 40, 5);
    ctx.fillRect(x - 14, y - 27, 28, 5);
    ctx.fillRect(x - 7, y - 32, 14, 5);
    ctx.fillStyle = P.roofLight;
    ctx.fillRect(x - 18, y - 20, 8, 3);
    ctx.fillRect(x + 4, y - 25, 9, 3);

    // Door + small lit window.
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(x - 5, y - 7, 10, 16);
    ctx.fillStyle = '#e8c96d';
    ctx.fillRect(x + 8, y - 11, 7, 7);
    ctx.fillStyle = '#6d4a28';
    ctx.fillRect(x + 11, y - 11, 1, 7);
    ctx.fillRect(x + 8, y - 8, 7, 1);
  }

  function drawRock(ctx, x, y, variant) {
    shadow(ctx, x, y + 4, 17, 6);
    const v = variant % 3;
    ctx.fillStyle = P.stoneDark;
    ctx.fillRect(x - 7, y - 4, 14, 8);
    ctx.fillStyle = P.stone;
    ctx.fillRect(x - 5, y - 6, 10, 6);
    if (v !== 1) {
      ctx.fillStyle = P.stoneLight;
      ctx.fillRect(x - 3, y - 5, 4, 2);
    }
  }

  return { drawGroundDecor, drawTree, drawHut, drawRock };
})();
