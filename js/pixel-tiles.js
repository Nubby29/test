'use strict';

/* ============================================================
   Experience: Bible Stories — Phase 7 Pixel Tileset
   Version: 7.0.0
   Reusable 16x16-authored terrain tiles + terrain-aware edge
   transitions. The existing 32px world grid is unchanged.
   ============================================================ */

const PixelTiles = (() => {
  const P = {
    grass0:'#5b9b45', grass1:'#65a84b', grass2:'#4f8f3e', grass3:'#79b955',
    meadow0:'#78b95a', meadow1:'#86c467', meadow2:'#69aa4f',
    garden0:'#5f9f45', garden1:'#70ad4f', garden2:'#82bd59',
    water0:'#327fad', water1:'#3b8fc4', water2:'#4aa0d2', water3:'#76c6e5',
    sand0:'#d8bd72', sand1:'#e5ca7e', sand2:'#c9a85f',
    soil0:'#8b5a36', soil1:'#a66b3f', soil2:'#70452d',
    mountain0:'#66706b', mountain1:'#7d8580', mountain2:'#4d5754', snow:'#e8e5d7',
    path0:'#b89462', path1:'#c7a873', path2:'#9f7c4f',
    bridge0:'#80542f', bridge1:'#a16c3c', bridge2:'#5e3d24'
  };

  const rows = {
    GRASS:[
      '2222222222222222','2222022222222202','2222222222222222','2022222222222222',
      '2222222202222222','2222222222222222','2222202222222222','2222222222220222',
      '2222222222222222','0222222222222222','2222222222222222','2222222022222222',
      '2222222222222222','2222222222202222','2222222222222222','2222222222222222'
    ],
    MEADOW:[
      '1111111111111111','1111011111111111','1111111111110111','1111110111111111',
      '1111111111111111','1111111111011111','1111111111111111','1101111111111111',
      '1111111111111111','1111111111111011','1111111111111111','1111011111111111',
      '1111111111111111','1111111111111111','1111110111111111','1111111111111111'
    ],
    GARDEN:[
      '0000000000000000','0000200000000000','0000000000000000','0000000002000000',
      '0000000000000000','0000000200000000','0000000000000000','0000000000000000',
      '0020000000000000','0000000000000000','0000000000200000','0000000000000000',
      '0000000000000000','0002000000000000','0000000000000000','0000000000000000'
    ],
    WATER:[
      '0011110001111000','0111111011111110','1111111111111111','1111111111111111',
      '1111111111111111','0111111111111110','0011110001111000','0001110000111000',
      '0011110001111000','0111111011111110','1111111111111111','1111111111111111',
      '1111111111111111','0111111111111110','0011110001111000','0001110000111000'
    ],
    MOUNTAIN:[
      '0000000200000000','0000002222000000','0000022222200000','0000222222220000',
      '0002222222222200','0022222222222220','0222222222222222','2222222222222222',
      '2222222222222222','2222222222222222','2222222222222222','2222222222222222',
      '2222222222222222','2222222222222222','2222222222222222','2222222222222222'
    ],
    SAND:[
      '1111111111111111','1112111111111111','1111111111111111','1111111111111111',
      '1111111111112111','1111111111111111','1111111111111111','1111111111111111',
      '1111112111111111','1111111111111111','1111111111111111','1111111111111111',
      '1111111111111111','1111111111112111','1111111111111111','1111111111111111'
    ],
    PATH:[
      '0000000000000000','0000000000000000','0000000000000000','0000000000000000',
      '0000200000000000','0000000000000000','0000000000000000','0000000000000000',
      '0000000000000000','0000000000000000','0000000000002000','0000000000000000',
      '0000000000000000','0000000000000000','0000000000200000','0000000000000000'
    ],
    SOIL:[
      '0011001100110011','1100110011001100','0011001100110011','1100110011001100',
      '0011001100110011','1100110011001100','0011001100110011','1100110011001100',
      '0011001100110011','1100110011001100','0011001100110011','1100110011001100',
      '0011001100110011','1100110011001100','0011001100110011','1100110011001100'
    ],
    BRIDGE:[
      '1111111111111111','1111111111111111','2222222222222222','1111111111111111',
      '1111111111111111','2222222222222222','1111111111111111','1111111111111111',
      '2222222222222222','1111111111111111','1111111111111111','2222222222222222',
      '1111111111111111','1111111111111111','2222222222222222','1111111111111111'
    ]
  };

  const palettes = {
    GRASS:['grass0','grass1','grass2'],
    MEADOW:['meadow0','meadow1','meadow2'],
    GARDEN:['garden0','garden1','garden2'],
    WATER:['water0','water1','water2','water3'],
    MOUNTAIN:['mountain0','mountain1','mountain2','snow'],
    SAND:['sand0','sand1','sand2'],
    PATH:['path0','path1','path2'],
    SOIL:['soil0','soil1','soil2'],
    BRIDGE:['bridge0','bridge1','bridge2']
  };

  function key(type) {
    if (type === T.GRASS) return 'GRASS';
    if (type === T.MEADOW) return 'MEADOW';
    if (type === T.WATER) return 'WATER';
    if (type === T.MOUNTAIN) return 'MOUNTAIN';
    if (type === T.SAND) return 'SAND';
    if (type === T.PATH) return 'PATH';
    if (type === T.SOIL) return 'SOIL';
    if (type === T.GARDEN) return 'GARDEN';
    if (type === T.BRIDGE) return 'BRIDGE';
    return 'GRASS';
  }

  function colorFor(name, index) {
    const pal = palettes[name] || palettes.GRASS;
    return P[pal[Math.max(0, Math.min(index, pal.length - 1))]];
  }

  function baseColor(type, variant) {
    const name = key(type);
    if (name === 'WATER') return colorFor(name, 1 + (variant % 2));
    if (name === 'MOUNTAIN') return colorFor(name, 1);
    return colorFor(name, 1);
  }

  function draw(type, tx, ty, ctx, x, y, size, tileAt) {
    const name = key(type);
    const pattern = rows[name] || rows.GRASS;
    const pal = palettes[name] || palettes.GRASS;
    const variant = Math.abs(((tx * 73856093) ^ (ty * 19349663))) % 3;
    const scale = size / 16;

    for (let py = 0; py < 16; py++) {
      const row = pattern[py];
      for (let px = 0; px < 16; px++) {
        let n = Number(row[px]);
        if (name === 'GRASS' && n === 2) n = variant === 0 ? 1 : 2;
        ctx.fillStyle = P[pal[Math.min(n, pal.length - 1)]];
        ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
      }
    }

    if (typeof tileAt === 'function') drawTransitions(type, tx, ty, ctx, x, y, size, tileAt);
  }

  /*
   * Phase 7 transition system.
   * Instead of painting every tile as an isolated square, the current tile
   * reads its four neighbours and paints a small authored pixel shoreline/
   * bank/edge. This creates continuous terrain boundaries without changing
   * collision or the world's 32px coordinates.
   */
  function drawTransitions(type, tx, ty, ctx, x, y, size, tileAt) {
    const n = {
      n: tileAt(tx, ty - 1),
      e: tileAt(tx + 1, ty),
      s: tileAt(tx, ty + 1),
      w: tileAt(tx - 1, ty),
      ne: tileAt(tx + 1, ty - 1),
      nw: tileAt(tx - 1, ty - 1),
      se: tileAt(tx + 1, ty + 1),
      sw: tileAt(tx - 1, ty + 1)
    };
    const edge = (a, b) => key(a) !== key(b);
    const scale = size / 16;

    function paintBand(side, other, depth, accent) {
      const c = accent || baseColor(other, 0);
      ctx.fillStyle = c;
      const d = Math.max(2, Math.min(5, depth)) * scale;
      const full = size;
      if (side === 'n') ctx.fillRect(x, y, full, d);
      if (side === 's') ctx.fillRect(x, y + size - d, full, d);
      if (side === 'w') ctx.fillRect(x, y, d, full);
      if (side === 'e') ctx.fillRect(x + size - d, y, d, full);
    }

    function paintShore(side, other) {
      const k = key(other);
      const accent = k === 'WATER' ? colorFor('WATER', 3)
        : k === 'SAND' ? colorFor('SAND', 2)
        : k === 'MOUNTAIN' ? colorFor('MOUNTAIN', 2)
        : baseColor(other, 0);
      const c2 = k === 'WATER' ? colorFor('WATER', 0) : colorFor(other, 0);
      const d = 3 * scale;
      ctx.fillStyle = accent;

      if (side === 'n' || side === 's') {
        const yy = side === 'n' ? y : y + size - d;
        ctx.fillRect(x, yy, size, d);
        ctx.fillStyle = c2;
        for (let i = 0; i < 16; i += 3) {
          const wiggle = ((tx * 3 + ty * 5 + i) % 3) * scale;
          const py = side === 'n' ? yy + (i % 2) * scale : yy + d - scale;
          ctx.fillRect(x + i * scale, py, Math.min(2, 16 - i) * scale, scale);
          if (wiggle > scale) ctx.fillRect(x + Math.max(0, i - 1) * scale, py, scale, scale);
        }
      } else {
        const xx = side === 'w' ? x : x + size - d;
        ctx.fillRect(xx, y, d, size);
        ctx.fillStyle = c2;
        for (let i = 0; i < 16; i += 3) {
          const px = side === 'w' ? xx + (i % 2) * scale : xx + d - scale;
          ctx.fillRect(px, y + i * scale, scale, Math.min(2, 16 - i) * scale);
        }
      }
    }

    function priorityTransition(a, b) {
      const ka = key(a), kb = key(b);
      const special = ['WATER','SAND','MOUNTAIN','PATH','BRIDGE','SOIL','GARDEN'];
      if (special.includes(kb) && !special.includes(ka)) return true;
      return ['WATER','SAND','MOUNTAIN'].includes(kb);
    }

    if (edge(type, n) && priorityTransition(type, n)) paintShore('n', n);
    else if (edge(type, n)) paintBand('n', n, 2);

    if (edge(type, s) && priorityTransition(type, s)) paintShore('s', s);
    else if (edge(type, s)) paintBand('s', s, 2);

    if (edge(type, w) && priorityTransition(type, w)) paintShore('w', w);
    else if (edge(type, w)) paintBand('w', w, 2);

    if (edge(type, e) && priorityTransition(type, e)) paintShore('e', e);
    else if (edge(type, e)) paintBand('e', e, 2);

    // Pixel corner cuts keep diagonal terrain changes from looking like
    // four unrelated straight lines.
    const corners = [
      ['nw', n, w, nw, 0, 0],
      ['ne', n, e, ne, 1, 0],
      ['sw', s, w, sw, 0, 1],
      ['se', s, e, se, 1, 1]
    ];
    ctx.fillStyle = '#0000';
    for (const [name, a, b, diag, cx, cy] of corners) {
      if (key(a) === key(type) && key(b) === key(type) && key(diag) !== key(type)) {
        // A two-pixel diagonal notch in the current tile.
        ctx.fillStyle = baseColor(diag, 0);
        const px = x + (cx ? size - 3 * scale : 0);
        const py = y + (cy ? size - 3 * scale : 0);
        ctx.fillRect(px, py, 3 * scale, 3 * scale);
      }
    }
  }

  return Object.freeze({draw});
})();
