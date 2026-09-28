'use strict';

/* ============================================================
   Experience: Bible Stories — Phase 9 Character Sprite Sheets
   Version: 9.0.0
   Original runtime-generated sprite sheets:
   4 directions × 6 frames per character.
   Frames: idle, walk1, walk2, walk3, talk, carry.
   The sheet API is deliberately asset-compatible so authored
   PNG sheets can replace the generated sheets later without
   changing gameplay or animation code.
   ============================================================ */

const PixelSprites = (() => {
  const FRAME_W = 24;
  const FRAME_H = 40;
  const COLS = 6;
  const ROWS = 4;
  const SHEET_W = FRAME_W * COLS;
  const SHEET_H = FRAME_H * ROWS;

  const ROW = { down: 0, right: 1, up: 2, left: 3 };
  const FRAME = { idle: 0, walk1: 1, walk2: 2, walk3: 3, talk: 4, carry: 5 };

  const palettes = {
    angel:   { skin:'#f0c89d', hair:'#eee6d4', robe:'#f4f0dc', trim:'#d8cba8', accent:'#ffffff' },
    adam:    { skin:'#d9a477', hair:'#5a3b1e', robe:'#4e8a3a', trim:'#2f6728', accent:'#6aa94d' },
    eve:     { skin:'#d9a477', hair:'#3b2412', robe:'#4e8a3a', trim:'#2f6728', accent:'#ffb3c8' },
    cain:    { skin:'#d9a477', hair:'#3b2412', robe:'#8b5141', trim:'#6d382e', accent:'#c56a48' },
    noah:    { skin:'#d6a27c', hair:'#d8d3c8', robe:'#79634d', trim:'#5c4938', accent:'#e8e1d3' },
    builder: { skin:'#d9a477', hair:'#4a3320', robe:'#9a7d55', trim:'#765d3d', accent:'#c25a3a' },
    abraham: { skin:'#d4a27d', hair:'#e8e4da', robe:'#9d8a6a', trim:'#74644e', accent:'#7a5a34' },
    lot:     { skin:'#d9a477', hair:'#3b2412', robe:'#7d8a9a', trim:'#596674', accent:'#a9b8c5' },
    jacob:   { skin:'#d9a477', hair:'#5a3b1e', robe:'#5f8a8f', trim:'#41666b', accent:'#d9a441' },
    joseph:  { skin:'#d9a477', hair:'#2c2418', robe:'#d9a441', trim:'#a87924', accent:'#3f6fb5' },
    pharaoh: { skin:'#b87855', hair:'#2c2c34', robe:'#3f6fb5', trim:'#d9b45a', accent:'#d9b45a' },
    generic: { skin:'#d9a477', hair:'#5a3b1e', robe:'#9a7d55', trim:'#765d3d', accent:'#c8a96b' }
  };

  const cache = Object.create(null);

  function roleFor(name) {
    const n = String(name || '').toLowerCase();
    if (n === 'pharaoh') return 'pharaoh';
    if (n.includes('angel') || n === 'visitor') return 'angel';
    if (n === 'adam') return 'adam';
    if (n === 'eve') return 'eve';
    if (n === 'cain') return 'cain';
    if (n === 'noah') return 'noah';
    if (n === 'abraham') return 'abraham';
    if (n === 'lot') return 'lot';
    if (n === 'jacob') return 'jacob';
    if (n === 'joseph') return 'joseph';
    if (n === 'builder' || n.includes('foreman') || n.includes('worker')) return 'builder';
    return 'generic';
  }

  function rect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function buildSheet(role) {
    if (cache[role]) return cache[role];
    if (typeof document === 'undefined' || !document.createElement) return null;

    const c = document.createElement('canvas');
    c.width = SHEET_W;
    c.height = SHEET_H;
    const g = c.getContext('2d');
    if (!g) return null;

    g.imageSmoothingEnabled = false;
    const p = palettes[role] || palettes.generic;

    for (const facing of Object.keys(ROW)) {
      for (let frame = 0; frame < COLS; frame++) {
        drawFrame(g, p, role, facing, frame, frame * FRAME_W, ROW[facing] * FRAME_H);
      }
    }

    cache[role] = c;
    return c;
  }

  function drawFrame(c, p, role, facing, frame, ox, oy) {
    const walk = frame >= FRAME.walk1 && frame <= FRAME.walk3;
    const talk = frame === FRAME.talk;
    const carry = frame === FRAME.carry;
    const side = facing === 'left' || facing === 'right';
    const mirror = facing === 'left';
    const step = frame === FRAME.walk1 ? -2 : frame === FRAME.walk3 ? 2 : 0;
    const bob = walk ? (frame === FRAME.walk2 ? -1 : 0) : 0;

    // shadow is part of the sheet so every character shares the same pivot.
    rect(c, ox + 5, oy + 35, 14, 3, 'rgba(0,0,0,0.28)');

    const cx = ox + 12;
    const by = oy + 35 + bob;

    // legs
    rect(c, cx - 6 + step, by - 11, 4, 11, p.trim);
    rect(c, cx + 2 - step, by - 11, 4, 11, p.trim);

    // robe / tunic
    rect(c, cx - 8, by - 23, 16, 13, p.robe);
    rect(c, cx - 7, by - 11, 14, 2, p.trim);
    rect(c, cx - 8, by - 20, 3, 8, p.trim);
    rect(c, cx + 5, by - 20, 3, 8, p.accent);

    if (role === 'joseph') {
      rect(c, cx - 6, by - 22, 4, 11, '#c2453a');
      rect(c, cx - 2, by - 23, 4, 12, '#3f6fb5');
      rect(c, cx + 2, by - 22, 4, 11, '#4f9b52');
    }
    if (role === 'jacob') rect(c, cx - 8, by - 16, 16, 3, p.accent);
    if (role === 'builder') rect(c, cx - 8, by - 19, 16, 2, p.accent);
    if (role === 'pharaoh') rect(c, cx - 8, by - 22, 16, 3, p.accent);

    // arms change pose by frame.
    if (walk) {
      rect(c, cx - 11, by - 20 - step, 3, 9, p.skin);
      rect(c, cx + 8, by - 20 + step, 3, 9, p.skin);
    } else if (carry) {
      rect(c, cx - 10, by - 18, 3, 9, p.skin);
      rect(c, cx + 7, by - 18, 3, 9, p.skin);
      rect(c, cx - 6, by - 17, 12, 5, '#b06a3a');
      rect(c, cx - 6, by - 17, 12, 2, '#7d4526');
    } else if (talk) {
      rect(c, cx - 10, by - 20, 3, 7, p.skin);
      rect(c, cx + 7, by - 20, 3, 7, p.skin);
      rect(c, cx + (side ? 7 : 9), by - 24, 4, 3, p.skin);
    } else {
      rect(c, cx - 10, by - 20, 3, 9, p.skin);
      rect(c, cx + 7, by - 20, 3, 9, p.skin);
    }

    // head
    rect(c, cx - 6, by - 35, 12, 11, p.skin);
    rect(c, cx - 7, by - 38, 14, 5, p.hair);
    rect(c, cx - 7, by - 34, 2, 5, p.hair);
    rect(c, cx + 5, by - 34, 2, 4, p.hair);

    // hair / identity details
    if (role === 'eve') {
      rect(c, cx - 9, by - 31, 3, 10, p.hair);
      rect(c, cx + 6, by - 31, 3, 10, p.hair);
      rect(c, cx - 7, by - 39, 3, 3, p.accent);
    }
    if (role === 'noah' || role === 'abraham') {
      rect(c, cx - 5, by - 27, 10, 6, p.hair);
      rect(c, cx - 3, by - 22, 6, 4, p.hair);
    }
    if (role === 'builder') rect(c, cx - 7, by - 35, 14, 2, p.accent);
    if (role === 'angel') {
      rect(c, cx - 12, by - 24, 4, 9, '#ffffff');
      rect(c, cx + 8, by - 24, 4, 9, '#ffffff');
      rect(c, cx - 14, by - 21, 2, 5, p.trim);
      rect(c, cx + 12, by - 21, 2, 5, p.trim);
    }
    if (role === 'abraham') {
      rect(c, cx + 10, by - 34, 2, 37, p.accent);
      rect(c, cx + 9, by - 36, 4, 3, p.accent);
    }

    // face direction. Side-facing uses one eye; front/back uses two/two tiny hair pixels.
    if (facing !== 'up') {
      const ex = mirror ? cx - 4 : side ? cx + 3 : cx + 3;
      rect(c, ex, by - 31, 2, 2, '#2b211b');
      if (!side) rect(c, cx - 4, by - 31, 2, 2, '#2b211b');
    }

    // up-facing sprites get a stronger back-of-head silhouette.
    if (facing === 'up') {
      rect(c, cx - 6, by - 32, 12, 4, p.hair);
    }

    // tiny frame-specific idle/talk cues.
    if (talk) rect(c, cx - 1, by - 25, 2, 2, '#6b3b2e');
    if (frame === FRAME.idle && role === 'pharaoh') {
      rect(c, cx - 10, by - 39, 20, 2, p.accent);
    }

    // direction-specific carried staff for Abraham.
    if (role === 'abraham' && carry) {
      rect(c, cx + 10, by - 35, 2, 37, p.accent);
    }
  }

  function selectFrame(moving, time, action) {
    if (action === 'carry') return FRAME.carry;
    if (action === 'talk') return FRAME.talk;
    if (!moving) return FRAME.idle;
    return [FRAME.walk1, FRAME.walk2, FRAME.walk3, FRAME.walk2][Math.floor(time * 10) % 4];
  }

  function draw(ctx, entity, role, time, options) {
    options = options || {};
    const sheet = buildSheet(role);
    if (!sheet) return false;

    const facing = ROW[entity.facing] !== undefined ? entity.facing : 'down';
    const moving = !!entity.moving;
    const action = options.action || (options.carrying ? 'carry' : null);
    const frame = selectFrame(moving, Number.isFinite(time) ? time : 0, action);

    const scale = options.scale || 1.75;
    const dw = FRAME_W * scale;
    const dh = FRAME_H * scale;
    const groundY = entity.y + (options.groundOffset === undefined ? 6 : options.groundOffset);
    const dx = entity.x - dw / 2;
    const dy = groundY - dh;

    const oldSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, frame * FRAME_W, ROW[facing] * FRAME_H, FRAME_W, FRAME_H, dx, dy, dw, dh);
    ctx.imageSmoothingEnabled = oldSmooth;
    return true;
  }

  function hasSheet(role) { return !!buildSheet(role); }
  function dimensions() { return { frameWidth: FRAME_W, frameHeight: FRAME_H, columns: COLS, rows: ROWS }; }

  return { draw, hasSheet, dimensions, FRAME, ROW, roleFor };
})();
