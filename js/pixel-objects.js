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



  function drawWell(ctx, x, y) {
    shadow(ctx, x, y + 8, 22, 6);
    pixelRect(ctx, x - 13, y - 5, 26, 12, '#68665c', '#3e3a32');
    ctx.fillStyle = '#8d8a78';
    ctx.fillRect(x - 10, y - 7, 20, 4);
    ctx.fillStyle = '#3d3326';
    ctx.fillRect(x - 6, y - 3, 12, 7);
    ctx.fillStyle = '#5b4027';
    ctx.fillRect(x - 17, y - 18, 3, 19); ctx.fillRect(x + 14, y - 18, 3, 19);
    ctx.fillRect(x - 17, y - 20, 34, 3);
    ctx.fillStyle = '#b47a3e'; ctx.fillRect(x - 2, y - 17, 4, 12);
  }

  function drawAltar(ctx, x, y) {
    shadow(ctx, x, y + 10, 34, 7);
    pixelRect(ctx, x - 18, y - 2, 36, 11, '#766b5a', '#413b32');
    pixelRect(ctx, x - 14, y - 9, 28, 7, '#94866c', '#5b5142');
    ctx.fillStyle = '#c2a06a';
    ctx.fillRect(x - 10, y - 7, 6, 2); ctx.fillRect(x + 3, y - 4, 7, 2);
    ctx.fillStyle = '#d8c08a'; ctx.fillRect(x - 3, y - 17, 6, 5);
    ctx.fillStyle = '#f1a33c'; ctx.fillRect(x - 2, y - 20, 4, 4);
    ctx.fillStyle = '#fff0a2'; ctx.fillRect(x - 1, y - 22, 2, 3);
  }

  function drawTent(ctx, x, y) {
    shadow(ctx, x, y + 8, 42, 7);
    ctx.fillStyle = '#765137';
    ctx.fillRect(x - 21, y - 2, 42, 5);
    ctx.fillStyle = '#a98255';
    ctx.fillRect(x - 20, y - 18, 40, 17);
    ctx.fillStyle = '#6d4930';
    ctx.fillRect(x - 20, y - 18, 40, 3);
    ctx.fillStyle = '#4d3625';
    ctx.fillRect(x - 5, y - 3, 10, 18);
    ctx.fillStyle = '#c19a67'; ctx.fillRect(x - 15, y - 14, 10, 3);
  }

  function drawTower(ctx, x, y, w, h) {
    shadow(ctx, x, y + 8, w * 0.7, 7);
    const left = x - w / 2;
    for (let row = 0; row < h; row += 7) {
      ctx.fillStyle = row % 14 === 0 ? '#9a6f48' : '#b17f50';
      ctx.fillRect(left + (row % 21) * 0.35, y - row - 7, w - (row % 17), 7);
      ctx.fillStyle = '#765237';
      ctx.fillRect(left + 3, y - row - 2, 5, 2);
    }
    ctx.fillStyle = '#5c412d';
    ctx.fillRect(x - 6, y - h + 8, 12, 15);
    ctx.fillStyle = '#d09a5a';
    ctx.fillRect(x - 4, y - h + 10, 3, 4);
  }

  function drawArk(ctx, x, y) {
    shadow(ctx, x, y + 13, 62, 8);
    ctx.fillStyle = '#6b4025'; ctx.fillRect(x - 34, y - 8, 68, 18);
    ctx.fillStyle = '#9a6236'; ctx.fillRect(x - 29, y - 18, 58, 12);
    ctx.fillStyle = '#c28a4b'; ctx.fillRect(x - 25, y - 23, 50, 7);
    ctx.fillStyle = '#51331f'; ctx.fillRect(x - 8, y - 19, 16, 13);
    ctx.fillStyle = '#d2a25d'; ctx.fillRect(x - 25, y - 16, 11, 3); ctx.fillRect(x + 14, y - 16, 11, 3);
    ctx.fillStyle = '#4c301d'; ctx.fillRect(x - 36, y + 8, 72, 4);
  }

  function drawGate(ctx, x, y, width = 30) {
    shadow(ctx, x, y + 5, width + 14, 5);
    ctx.fillStyle = '#654224'; ctx.fillRect(x - width / 2, y - 4, width, 5);
    ctx.fillRect(x - width / 2, y - 4, 4, 20); ctx.fillRect(x + width / 2 - 4, y - 4, 4, 20);
    ctx.fillStyle = '#9b6b36'; ctx.fillRect(x - width / 2 + 5, y, width - 10, 3);
    ctx.fillRect(x - width / 2 + 5, y + 8, width - 10, 3);
  }

  function drawArchitecture(ctx, world) {
    // Phase 11: chapter-aware landmarks layered on existing world state.
    for (const h of (world.huts || [])) {
      drawHut(ctx, h);
    }
    for (const soil of (world.soils || [])) {
      if (soil && soil.x != null) {
        ctx.fillStyle = '#6b4a2e'; ctx.fillRect(Math.round(soil.x - 11), Math.round(soil.y - 7), 22, 14);
        ctx.fillStyle = '#8b6340'; ctx.fillRect(Math.round(soil.x - 8), Math.round(soil.y - 4), 16, 2);
      }
    }
    if (world.altar) drawAltar(ctx, world.altar.x, world.altar.y);
    if (world.tent) drawTent(ctx, world.tent.x, world.tent.y);
    if (world.ark) drawArk(ctx, world.ark.x, world.ark.y);
    if (world.arkPoint && !world.ark) drawArk(ctx, world.arkPoint.x, world.arkPoint.y);
    if (world.tower) drawTower(ctx, world.tower.x, world.tower.y, 58, 92);
    if (world.gate) drawGate(ctx, world.gate.x, world.gate.y, 34);
    if (world.cityGate) drawGate(ctx, world.cityGate.x, world.cityGate.y, 42);
  }

  function drawComposition(ctx, world, x0, x1, y0, y1, timeValue, tileAt) {
    // Phase 8: layered map composition. Visual-only; World owns collision/state.
    const terrain = (type) => {
      if (type === T.MOUNTAIN) return 'M';
      if (type === T.PATH) return 'P';
      if (type === T.SAND) return 'S';
      if (type === T.WATER) return 'W';
      if (type === T.MEADOW) return 'E';
      if (type === T.GRASS) return 'G';
      return 'O';
    };
    const h = (x,y,seed) => hash(x,y,seed);

    // Cliff faces make mountain masses read as elevated land rather than flat tiles.
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const type = tileAt(tx, ty);
      const x = tx * TILE, y = ty * TILE, d = 4;
      if (type === T.MOUNTAIN) {
        if (terrain(tileAt(tx, ty + 1)) !== 'M') {
          ctx.fillStyle = '#303936'; ctx.fillRect(x, y + TILE - d, TILE, d);
          ctx.fillStyle = '#737b72'; ctx.fillRect(x, y + TILE - d, TILE, 2);
        }
        if (terrain(tileAt(tx + 1, ty)) !== 'M') {
          ctx.fillStyle = '#303936'; ctx.fillRect(x + TILE - d, y, d, TILE);
        }
      }
      // Path edging and small worn marks create continuous road composition.
      if (type === T.PATH) {
        const n = tileAt(tx,ty-1), s = tileAt(tx,ty+1), w = tileAt(tx-1,ty), e = tileAt(tx+1,ty);
        ctx.fillStyle = '#866844';
        if (n !== T.PATH && n !== T.BRIDGE) ctx.fillRect(x,y,TILE,2);
        if (s !== T.PATH && s !== T.BRIDGE) ctx.fillRect(x,y+TILE-2,TILE,2);
        if (w !== T.PATH && w !== T.BRIDGE) ctx.fillRect(x,y,2,TILE);
        if (e !== T.PATH && e !== T.BRIDGE) ctx.fillRect(x+TILE-2,y,2,TILE);
        if (h(tx,ty,31) < 0.22) {
          ctx.fillStyle = 'rgba(75,55,35,0.28)';
          ctx.fillRect(x+7,y+11,5,2); ctx.fillRect(x+20,y+17,4,2);
        }
      }
      // Sparse shrubs break up large fields without covering walkable routes.
      if ((type === T.GRASS || type === T.MEADOW) &&
          h(tx,ty,81) < (type === T.MEADOW ? 0.025 : 0.012)) {
        const same = tileAt(tx-1,ty) === type && tileAt(tx+1,ty) === type &&
                     tileAt(tx,ty-1) === type && tileAt(tx,ty+1) === type;
        if (same) {
          const sx=x+16, sy=y+20;
          ctx.fillStyle='rgba(20,30,15,0.22)'; ctx.fillRect(sx-7,sy+3,14,4);
          ctx.fillStyle='#2f6e38'; ctx.fillRect(sx-7,sy-3,14,7); ctx.fillRect(sx-4,sy-7,8,5);
          ctx.fillStyle='#579247'; ctx.fillRect(sx-4,sy-5,4,3);
        }
      }
    }

    // Settlement yards: a fence + occasional well gives huts a sense of place.
    for (const hut of (world.huts || [])) {
      const x = Math.round(hut.x), y = Math.round(hut.y);
      ctx.fillStyle = '#5c3b22';
      for (const px of [x-29,x+27]) {
        ctx.fillRect(px,y-7,3,15); ctx.fillRect(px,y+9,3,7);
      }
      ctx.fillStyle = '#8b5b31';
      ctx.fillRect(x-29,y-6,56,3); ctx.fillRect(x-29,y+3,56,3);
      ctx.fillStyle = '#b07a43'; ctx.fillRect(x-24,y-5,18,1); ctx.fillRect(x+7,y+4,16,1);
      // gate opening
      ctx.clearRect(x-8,y+1,16,7);

      if (h(Math.round(x/TILE),Math.round(y/TILE),91) < 0.55) {
        const wx=x+32, wy=y+18;
        ctx.fillStyle='rgba(20,15,8,0.24)'; ctx.fillRect(wx-12,wy+7,24,4);
        ctx.fillStyle='#4f514b'; ctx.fillRect(wx-11,wy-3,22,11);
        ctx.fillStyle='#a19e8b'; ctx.fillRect(wx-8,wy-5,16,5);
        ctx.fillStyle='#5c3b22'; ctx.fillRect(wx-13,wy-16,3,14); ctx.fillRect(wx+10,wy-16,3,14);
        ctx.fillRect(wx-13,wy-17,26,3);
        ctx.fillStyle='#3d3324'; ctx.fillRect(wx-6,wy-2,12,5);
      }
    }

    // Multi-tile background tree masses add depth behind the existing trees.
    for (const tr of (world.trees || [])) {
      const tx=Math.floor(tr.x/TILE), ty=Math.floor(tr.y/TILE);
      if (h(tx,ty,117) >= 0.22) continue;
      const x=tr.x-22, y=tr.y-10, s=0.7;
      ctx.fillStyle='rgba(20,25,12,0.20)'; ctx.fillRect(x-15*s,y+12*s,30*s,5*s);
      ctx.fillStyle='#234f2d';
      ctx.fillRect(x-18*s,y-9*s,36*s,17*s);
      ctx.fillRect(x-12*s,y-19*s,24*s,14*s);
      ctx.fillStyle='#4b8b43'; ctx.fillRect(x-10*s,y-14*s,9*s,5*s); ctx.fillRect(x+3*s,y-20*s,8*s,5*s);
      ctx.fillStyle='#6ba64e'; ctx.fillRect(x-5*s,y-19*s,5*s,3*s);
    }
  }

  return { drawGroundDecor, drawTree, drawHut, drawRock, drawComposition, drawArchitecture, drawWell, drawAltar, drawTent, drawTower, drawArk, drawGate };
})();
