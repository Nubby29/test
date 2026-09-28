'use strict';

/* ============================================================
   Experience: Bible Stories — Phase 4: Pixel Character Renderer
   Reusable 16x24-ish character sprites drawn on a 2px pixel grid.
   The renderer keeps character identity readable at the game's
   fixed 480x270 logical resolution without changing gameplay data.
   ============================================================ */

const PixelCharacters = (() => {
  const SKIN = '#d9a477';
  const SKIN_DARK = '#b87955';
  const DARK = '#2f241d';
  const SHADOW = 'rgba(0,0,0,0.28)';

  const palettes = {
    angel:   { robe:'#f4f0dc', trim:'#d8cba8', hair:'#eee6d4', skin:'#f0c89d', accent:'#ffffff' },
    adam:    { robe:'#4e8a3a', trim:'#2f6728', hair:'#5a3b1e', skin:SKIN, accent:'#6aa94d' },
    eve:     { robe:'#4e8a3a', trim:'#2f6728', hair:'#3b2412', skin:SKIN, accent:'#ffb3c8' },
    cain:    { robe:'#8b5141', trim:'#6d382e', hair:'#3b2412', skin:SKIN, accent:'#c56a48' },
    noah:    { robe:'#79634d', trim:'#5c4938', hair:'#d8d3c8', skin:'#d6a27c', accent:'#e8e1d3' },
    builder: { robe:'#9a7d55', trim:'#765d3d', hair:'#4a3320', skin:SKIN, accent:'#c25a3a' },
    abraham: { robe:'#9d8a6a', trim:'#74644e', hair:'#e8e4da', skin:'#d4a27d', accent:'#7a5a34' },
    lot:     { robe:'#7d8a9a', trim:'#596674', hair:'#3b2412', skin:SKIN, accent:'#a9b8c5' },
    jacob:   { robe:'#5f8a8f', trim:'#41666b', hair:'#5a3b1e', skin:SKIN, accent:'#d9a441' },
    joseph:  { robe:'#d9a441', trim:'#a87924', hair:'#2c2418', skin:SKIN, accent:'#3f6fb5' },
    generic: { robe:'#9a7d55', trim:'#765d3d', hair:'#5a3b1e', skin:SKIN, accent:'#c8a96b' },
    pharaoh: { robe:'#3f6fb5', trim:'#d9b45a', hair:'#2c2c34', skin:'#b87855', accent:'#d9b45a' }
  };

  function roleFor(name, playable) {
    const n = String(name || '').toLowerCase();
    if (playable) {
      if (playable === 'builder') return 'builder';
      if (playable === 'abraham') return 'abraham';
      if (playable === 'lot') return 'lot';
      if (playable === 'jacob') return 'jacob';
      if (playable === 'joseph') return 'joseph';
      if (playable === 'noah') return 'noah';
      if (playable === 'cain') return 'cain';
      if (playable === 'angel') return 'angel';
      if (playable === 'adam') return 'adam';
      if (playable === 'eve') return 'eve';
    }
    if (n === 'pharaoh') return 'pharaoh';
    if (n.includes('angel')) return 'angel';
    if (n === 'adam') return 'adam';
    if (n === 'eve') return 'eve';
    if (n === 'noah') return 'noah';
    if (n === 'abraham') return 'abraham';
    if (n === 'jacob') return 'jacob';
    if (n === 'joseph') return 'joseph';
    if (n === 'lot') return 'lot';
    return 'generic';
  }

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function pixelLine(ctx, x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(Math.round(x1), Math.round(y1));
    ctx.lineTo(Math.round(x2), Math.round(y2));
    ctx.stroke();
  }

  function shadow(ctx, x, groundY, wide) {
    ctx.fillStyle = SHADOW;
    ctx.fillRect(Math.round(x - wide), Math.round(groundY + 3), Math.round(wide * 2), 4);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(Math.round(x - wide + 3), Math.round(groundY + 7), Math.round(wide * 2 - 6), 2);
  }

  function draw(ctx, x, groundY, facing, moving, role, opts) {
    opts = opts || {};
    const p = palettes[role] || palettes.generic;
    const bob = moving ? (Math.floor(timeSafe(opts.time) * 8) % 2) * 2 : 0;
    const y = groundY - bob;
    const dir = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;

    shadow(ctx, x, groundY, role === 'pharaoh' ? 10 : 9);

    // Pixel feet / legs.
    rect(ctx, x - 6, y - 13, 4, 14, p.trim);
    rect(ctx, x + 2, y - 13, 4, 14, p.trim);
    if (moving) {
      const step = Math.floor(timeSafe(opts.time) * 10) % 2;
      if (step) {
        rect(ctx, x - 7, y - 2, 5, 3, p.trim);
        rect(ctx, x + 2, y - 1, 5, 2, p.trim);
      }
    }

    // Robe/tunic: deliberately blocky, with a darker side and hem.
    rect(ctx, x - 9, y - 24, 18, 13, p.robe);
    rect(ctx, x - 7, y - 11, 14, 3, p.trim);
    rect(ctx, x - 9, y - 20, 3, 9, p.trim);
    rect(ctx, x + 6, y - 21, 3, 10, p.accent);

    if (role === 'joseph') {
      rect(ctx, x - 7, y - 23, 4, 12, '#c2453a');
      rect(ctx, x - 2, y - 24, 4, 13, '#3f6fb5');
      rect(ctx, x + 3, y - 23, 4, 12, '#4f9b52');
    } else if (role === 'jacob') {
      rect(ctx, x - 9, y - 16, 18, 3, p.accent);
    } else if (role === 'builder') {
      rect(ctx, x - 9, y - 18, 18, 2, p.accent);
    } else if (role === 'pharaoh') {
      rect(ctx, x - 9, y - 23, 18, 3, p.accent);
    }

    // Head and hair, aligned to the same grid.
    rect(ctx, x - 6, y - 36, 12, 11, p.skin);
    rect(ctx, x - 7, y - 38, 14, 5, p.hair);
    rect(ctx, x - 7, y - 34, 2, 5, p.hair);
    rect(ctx, x + 5, y - 34, 2, 4, p.hair);

    // Tiny face pixels change with facing so the sprite has direction.
    const eyeX = dir < 0 ? x - 4 : dir > 0 ? x + 3 : x + 3;
    rect(ctx, eyeX, y - 32, 2, 2, '#2b211b');
    if (dir === 0) rect(ctx, x - 4, y - 32, 2, 2, '#2b211b');

    // Identity details.
    if (role === 'noah' || role === 'abraham') {
      rect(ctx, x - 5, y - 27, 10, 6, p.hair);
      rect(ctx, x - 3, y - 22, 6, 4, p.hair);
    }
    if (role === 'eve') {
      rect(ctx, x - 9, y - 31, 3, 10, p.hair);
      rect(ctx, x + 6, y - 31, 3, 10, p.hair);
      rect(ctx, x - 7, y - 39, 3, 3, p.accent);
    }
    if (role === 'builder') {
      rect(ctx, x - 7, y - 35, 14, 2, p.accent);
      if (opts.carrying) {
        rect(ctx, x - 8, y - 48, 16, 8, '#b06a3a');
        rect(ctx, x - 8, y - 48, 16, 2, '#7d4526');
      }
    }
    if (role === 'abraham') {
      pixelLine(ctx, x + 10, y - 35, x + 11, y + 4, p.accent, 2);
      rect(ctx, x + 9, y - 37, 4, 3, p.accent);
    }
    if (role === 'angel') {
      // Small symmetrical wings, kept behind the body.
      rect(ctx, x - 14, y - 25, 5, 10, '#ffffff');
      rect(ctx, x + 9, y - 25, 5, 10, '#ffffff');
      rect(ctx, x - 16, y - 22, 3, 6, p.trim);
      rect(ctx, x + 13, y - 22, 3, 6, p.trim);
      rect(ctx, x - 8, y - 27, 16, 3, '#ffffff');
    }
    if (role === 'cain') {
      rect(ctx, x + 6, y - 19, 3, 6, p.accent);
    }
  }

  function timeSafe(t) { return Number.isFinite(t) ? t : 0; }

  function drawPerson(ctx, person, time) {
    const role = person.role || roleFor(person.name, null);
    draw(ctx, person.x, person.y + 6, person.facing || 'down', !!(person.moving || (person.movingT || 0) > 0), role, { time });
  }

  function drawPlayer(ctx, player, chapter, time) {
    const playable = chapter && chapter.playable;
    const role = roleFor('', playable);
    draw(ctx, player.x, player.y + 6, player.facing || 'down', !!player.moving, role, {
      time,
      carrying: !!(typeof World !== 'undefined' && World.carrying)
    });
  }

  return { drawPerson, drawPlayer, roleFor };
})();
