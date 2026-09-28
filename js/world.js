'use strict';
/* ============================================================
   World — tile map, terrain, trees and quest objects.
   Map is 64 x 44 tiles of 32px.
   ============================================================ */

const TILE = 32;
const MAP_W = 64;
const MAP_H = 44;

const T = { GRASS: 0, MEADOW: 1, WATER: 2, MOUNTAIN: 3, SAND: 4, PATH: 5, SOIL: 6, GARDEN: 7, BRIDGE: 8 };
const T_SOLID = [false, false, true, true, false, false, false, false, false];

/* deterministic 0..1 pseudo-random per tile */
function hash2(x, y) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >>> 13)) | 0;
  n = Math.imul(n, 1274126177) | 0;
  n = (n ^ (n >>> 16)) >>> 0;
  return (n % 1000) / 1000;
}

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

const World = {
  tiles: null,
  trees: [],
  soils: [],       // {tx,ty,x,y,planted}
  animals: [],     // {kind,name,x,y,...}
  god: { x: 0, y: 0 },
  beacon: { x: 0, y: 0 },
  playerStart: { x: 0, y: 0 },
  adamSpawn: { x: 0, y: 0 },
  lit: false,

  /* ---------- chapter-aware building ---------- */
  reset() {
    this.tiles = null;
    this.trees = [];
    this.soils = [];
    this.animals = [];
    this.adam = null;
    this.eve = null;
    this.knowledgeTree = null;
    this.snake = null;
    this.gate = null;
    this.gateGuard = null;
    this.abel = null;
    this.altar = null;
    this.tent = null;
    this.fieldSpot = null;
    this.fieldZone = null;
    this.ark = null;
    this.arkPoint = null;
    this.buildSpots = [];
    this.villagers = [];
    this.family = [];
    this.huts = [];
    this.raining = false;
    this.dove = null;
    this.rainbow = false;
    this.flooded = false;
    this.inside = false;
    this.lit = false;
    this.interior = null;      // Chapter 6: the inside of the ark
    this.stonePile = null;     // Chapter 6: stones waiting to become an altar
    this.sheep = null;         // Chapter 6: the sheep offered at the altar
    this.tower = null;         // Chapter 7: the tower of Babel
    this.brickPile = null;     // Chapter 7: pile of mud bricks
    this.scaffolds = [];       // Chapter 7: three scaffolds on the tower
    this.workers = [];         // Chapter 7: the builders
    this.foreman = null;       // Chapter 7: the builder in charge
    this.cityGate = null;      // Chapter 7: the road out of the city
    this.carrying = false;     // Chapter 7: carrying a brick
    this.confused = false;     // Chapter 7: everyone speaks another language
    this.journeyZone = null;   // Chapter 8: the land of Canaan (arrive by walking there)
    this.journeyTarget = null; // Chapter 8: quest marker for the long road
    this.visitors = [];        // Chapter 9: the three angels under the tree
    this.visitorSpot = null;   // Chapter 9: where the visitors appear
    this.ishmael = null;       // Chapter 9: Hagar's son
    this.isaac = null;         // Chapter 9: Sarah's son
    this.abraham = null;       // Chapter 10: Abraham at the camp
    this.angels = [];          // Chapter 10: the two angels in Sodom
    this.choiceSpot = null;    // Chapter 10: the pleasant land to choose
    this.escapeZone = null;    // Chapter 10: Zoar — escape by walking there
    this.zoarSpot = null;      // Chapter 10: quest marker for the escape
    this.wifePillar = null;    // Chapter 10: Lot's wife, turned to salt
    this.burning = false;      // Chapter 10: Sodom and Gomorrah on fire
    this.ram = null;           // Chapter 11: the ram caught in the bushes
    this.grainPiles = [];      // Chapter 15: grain to store during the fat years
    this.god = { x: -9999, y: -9999 };
    this.beacon = { x: -9999, y: -9999 };
    this.playerStart = { x: 0, y: 0 };
    this.adamSpawn = { x: 0, y: 0 };
  },

  buildChapter(idx) {
    this.reset();
    if (idx === 14) this.buildChapter15();
    else if (idx === 13) this.buildChapter14();
    else if (idx === 12) this.buildChapter13();
    else if (idx === 11) this.buildChapter12();
    else if (idx === 10) this.buildChapter11();
    else if (idx === 9) this.buildChapter10();
    else if (idx === 8) this.buildChapter9();
    else if (idx === 7) this.buildChapter8();
    else if (idx === 6) this.buildChapter7();
    else if (idx === 5) this.buildChapter6();
    else if (idx === 4) this.buildChapter5();
    else if (idx === 3) this.buildChapter4();
    else if (idx === 2) this.buildChapter3();
    else if (idx === 1) this.buildChapter2();
    else this.buildChapter1();
  },

  buildChapter1() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.WATER : t[y * MAP_W + x]);

    /* base grass */
    t.fill(T.GRASS);

    /* meadow (creation garden) */
    for (let y = 14; y <= 28; y++) for (let x = 22; x <= 38; x++) set(x, y, T.MEADOW);

    /* west ocean + beach */
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < 5; x++) set(x, y, T.WATER);
      set(5, y, T.SAND); set(6, y, T.SAND);
    }
    /* south ocean + beach */
    for (let x = 0; x < MAP_W; x++) {
      for (let y = MAP_H - 4; y < MAP_H; y++) set(x, y, T.WATER);
      set(x, MAP_H - 5, T.SAND);
    }

    /* mountains (north & north-east) */
    const blobs = [[48, 7, 6], [55, 11, 5], [42, 4, 5], [15, 6, 5], [10, 4, 4]];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (get(x, y) !== T.GRASS) continue;
        for (const [bx, by, br] of blobs) {
          const d = Math.hypot(x - bx, y - by);
          if (d <= br * (0.75 + 0.45 * hash2(x + bx, y + by))) { set(x, y, T.MOUNTAIN); break; }
        }
        if (y < 2) set(x, y, T.MOUNTAIN); // map edge
      }
    }

    /* river flowing west to the ocean */
    for (let x = 0; x <= 48; x++) {
      const ry = 33 + Math.round(2.5 * Math.sin(x * 0.25));
      set(x, ry, T.WATER);
      set(x, ry + 1, T.WATER);
    }

    /* paths: meadow → hill (God) and meadow → beacon (east) */
    for (let x = 24; x <= 52; x++) set(x, 21, T.PATH);
    for (let y = 18; y <= 21; y++) set(26, y, T.PATH);
    for (let y = 21; y <= 24; y++) set(52, y, T.PATH);

    /* key positions */
    this.god = tileCenter(26, 16);
    this.beacon = tileCenter(52, 25);
    this.playerStart = tileCenter(26, 24);
    this.adamSpawn = tileCenter(28, 17);

    /* three soil patches (south meadow) */
    this.soils = [[25, 26], [30, 27], [34, 25]].map(([sx, sy]) => {
      set(sx, sy, T.SOIL);
      const p = tileCenter(sx, sy);
      return { tx: sx, ty: sy, x: p.x, y: p.y, planted: false };
    });

    /* four animals to find */
    const A = (kind, name, tx, ty, speed) => {
      const p = tileCenter(tx, ty);
      return { kind, name, x: p.x, y: p.y, state: 'idle', target: null, wait: 0, speed, phase: hash2(tx, ty) * 6.28 };
    };
    this.animals = [
      A('rabbit', 'rabbit', 19, 22, 70),
      A('lamb', 'lamb', 31, 11, 55),
      A('elephant', 'elephant', 40, 18, 40),
      A('bird', 'bird', 46, 26, 95)
    ];

    /* feature trees beside God's hill */
    this.trees = [];
    const addTree = (tx, ty, opts) => {
      const p = tileCenter(tx, ty);
      const baseR = (opts && opts.baseR) || 11;
      this.trees.push({
        x: p.x, y: p.y, baseR, r: baseR,
        big: !!(opts && opts.big), planted: false, growStart: 0
      });
    };
    addTree(24, 15); addTree(28, 15);

    /* scattered trees */
    const keyPts = [this.god, this.beacon, this.playerStart,
      ...this.soils, ...this.animals.map(a => ({ x: a.x, y: a.y }))];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const type = get(x, y);
        const p = type === T.SAND ? 0.02 : type === T.MEADOW ? 0.008 : type === T.GRASS ? 0.013 : 0;
        if (p <= 0 || hash2(x * 7 + 3, y * 11 + 5) >= p) continue;
        const c = tileCenter(x, y);
        if (keyPts.some(k => Math.hypot(k.x - c.x, k.y - c.y) < 80)) continue;
        if (type === T.MEADOW && this.soils.some(s => Math.hypot(s.x - c.x, s.y - c.y) < 60)) continue;
        addTree(x, y);
      }
    }
  },

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return T.WATER;
    return this.tiles[ty * MAP_W + tx];
  },

  /* solid = water, mountain, out of bounds, or inside a tree */
  solidAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
    if (T_SOLID[this.tiles[ty * MAP_W + tx]]) return true;
    // the angel guard blocks the way back into the garden
    if (this.gateGuard && this.gate) {
      const gx = px - this.gate.x, gy = py - this.gate.y;
      if (gx * gx + gy * gy < 56 * 56) return true;
    }
    for (const tr of this.trees) {
      const dx = px - tr.x, dy = py - tr.y;
      if (dx * dx + dy * dy < tr.r * tr.r) return true;
    }
    return false;
  },

  growTreeAt(x, y) {
    const baseR = 11;
    this.trees.push({
      x, y, baseR, r: baseR, big: false, planted: true, growStart: performance.now()
    });
  },

  addAdam() {
    const p = this.adamSpawn;
    this.adam = { x: p.x, y: p.y, following: false };
    this.trees.push({ x: (30 * TILE + 16), y: (16 * TILE + 16), baseR: 17, r: 17, big: true, special: null, planted: false, growStart: 0 });
  },

  addEve() {
    // Eve is created from the player's (Adam's) rib — she appears beside him
    // and follows him. Offset keeps her just outside the 54px interact radius
    // so she can never hijack a quest-giver prompt right after the cutscene.
    this.eve = { x: player.x + 56, y: player.y + 12, following: true };
  },

  /* ============================================================
     CHAPTER 2 — The Garden of Eden
     Lush flower-filled garden, river with sandy banks & a wooden
     bridge, the tree of the knowledge, the tree of life, and a
     dense forest border enclosing paradise.
     ============================================================ */
  buildChapter2() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.WATER : t[y * MAP_W + x]);
    t.fill(T.GRASS);

    // lush garden
    for (let y = 7; y <= 32; y++) for (let x = 6; x <= 55; x++) set(x, y, T.GARDEN);

    // winding river with sandy banks across the south
    const riverY = (x) => 33 + Math.round(2 * Math.sin(x * 0.22));
    for (let x = 0; x < MAP_W; x++) {
      set(x, riverY(x) - 1, T.SAND);
      set(x, riverY(x), T.WATER);
      set(x, riverY(x) + 1, T.WATER);
      set(x, riverY(x) + 2, T.SAND);
    }

    // wooden bridge over the river
    for (let x = 29; x <= 31; x++) {
      set(x, riverY(x), T.BRIDGE);
      set(x, riverY(x) + 1, T.BRIDGE);
    }

    // paths through the garden
    for (let y = 14; y <= 31; y++) set(30, y, T.PATH);
    for (let x = 12; x <= 50; x++) set(x, 21, T.PATH);

    // key positions
    this.god = tileCenter(30, 13);
    this.beacon = { x: -9999, y: -9999 };
    this.playerStart = tileCenter(16, 24); // you ARE Adam — you begin in his part of the garden
    this.adam = null;   // no Adam NPC in Chapter 2 — he is the player
    this.eve = null;
    this.knowledgeTree = tileCenter(34, 13);
    this.lifeTree = tileCenter(26, 13);
    this.soils = [];
    this.lit = true; // Eden begins in warm sunlight

    // animals waiting to be named
    const A = (kind, name, tx, ty, speed) => {
      const p = tileCenter(tx, ty);
      return { kind, name, x: p.x, y: p.y, state: 'idle', target: null, wait: 0,
               speed, named: false, phase: hash2(tx + 3, ty + 7) * 6.28 };
    };
    this.animals = [
      A('rabbit', 'rabbit', 12, 15, 70),
      A('bird', 'bird', 50, 19, 95),
      A('elephant', 'elephant', 45, 38, 40),
      A('lamb', 'lamb', 17, 38, 55)
    ];

    // trees (special first, so scatter avoids them)
    this.trees = [];
    const addTree = (tx, ty, opts) => {
      const p = tileCenter(tx, ty);
      const baseR = (opts && opts.baseR) || 11;
      this.trees.push({
        x: p.x, y: p.y, baseR, r: baseR,
        big: !!(opts && opts.big), special: (opts && opts.special) || null,
        planted: false, growStart: 0
      });
    };
    addTree(34, 13, { baseR: 15, big: true, special: 'knowledge' }); // tree of the knowledge
    addTree(26, 13, { baseR: 14, big: true, special: 'life' });      // tree of life

    // dense forest border — one solid ring of trees (gaps are too small to pass)
    const ring = (x, y) => x === 3 || x === 60 || y === 3 || y === 40;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const type = get(x, y);
        if (ring(x, y) && type !== T.WATER && type !== T.BRIDGE) addTree(x, y);
      }
    }

    // scattered trees inside the garden (never on paths, river or key spots)
    const keyPts = [this.god, this.playerStart, this.knowledgeTree, this.lifeTree,
                    ...this.animals.map(a => ({ x: a.x, y: a.y }))];
    for (let y = 4; y <= 39; y++) {
      for (let x = 4; x <= 59; x++) {
        const type = get(x, y);
        if (type !== T.GRASS && type !== T.GARDEN) continue;
        const p = type === T.GRASS ? 0.02 : 0.012;
        if (hash2(x * 13 + 1, y * 7 + 9) >= p) continue;
        const c = tileCenter(x, y);
        if (keyPts.some(k => Math.hypot(k.x - c.x, k.y - c.y) < 80)) continue;
        addTree(x, y);
      }
    }
  },

  /* ============================================================
     CHAPTER 3 — The garden of Eden, plus an eastern gate
     through the forest ring (the way out — later guarded by
     angels and a sword of fire). You play as Eve; Adam is here.
     ============================================================ */
  buildChapter3() {
    this.buildChapter2(); // same garden as Chapter 2
    const set = (x, y, v) => {
      if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) this.tiles[y * MAP_W + x] = v;
    };

    // eastern gate: clear a gap in the forest ring and lay a road east
    this.trees = this.trees.filter(tr => {
      const tx = Math.round((tr.x - 16) / TILE);
      const ty = Math.round((tr.y - 16) / TILE);
      return !(tx >= 51 && tx <= 63 && ty >= 21 && ty <= 23);
    });
    for (let x = 51; x <= 63; x++) {
      for (let y = 21; y <= 23; y++) set(x, y, T.PATH);
    }
    this.gate = tileCenter(60, 22);
    this.gateGuard = null;

    // story characters — you are Eve, alone in the garden
    this.playerStart = tileCenter(28, 22);
    this.adam = { x: tileCenter(22, 18).x, y: tileCenter(22, 18).y, following: false };
    this.eve = null; // you ARE Eve
    this.snake = tileCenter(35, 15); // coiled at the base of the tree of the knowledge

    // make sure no scattered tree blocks the new key spots
    const avoid = [this.playerStart, this.adam, this.snake];
    this.trees = this.trees.filter(tr => !avoid.some(p => Math.hypot(p.x - tr.x, p.y - tr.y) < 60));
  },

  /* ============================================================
     CHAPTER 4 — Outside the garden: Cain's farm, Abel's pasture,
     the offering altar, and the field in the south-east. The old
     garden gate (still guarded by angels) walls off the west.
     ============================================================ */
  buildChapter4() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    const addTree = (tx, ty, opts) => {
      const p = tileCenter(tx, ty);
      const baseR = (opts && opts.baseR) || 11;
      this.trees.push({
        x: p.x, y: p.y, baseR, r: baseR,
        big: !!(opts && opts.big), special: (opts && opts.special) || null,
        planted: false, growStart: 0
      });
    };
    t.fill(T.GRASS);

    // mountains in the far north-east (scenery)
    const blobs = [[54, 7, 5], [58, 5, 4]];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        for (const b of blobs) {
          const d = Math.hypot(x - b[0], y - b[1]);
          if (d <= b[2] * (0.75 + 0.45 * hash2(x + b[0], y + b[1]))) { set(x, y, T.MOUNTAIN); break; }
        }
      }
    }

    // Cain's farm (south-west)
    for (let y = 27; y <= 34; y++) for (let x = 12; x <= 20; x++) set(x, y, T.SOIL);

    // road from the old garden gate east to the altar
    for (let x = 3; x <= 32; x++) for (let y = 21; y <= 23; y++) set(x, y, T.PATH);

    // forest enclosure: north, east, south + west wall with the guarded gate
    this.trees = [];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const wall = (x === 3 && !(y >= 21 && y <= 23)) || y === 3 || x === 61 || y === 41;
        if (wall && get(x, y) !== T.MOUNTAIN) addTree(x, y);
      }
    }

    // key positions
    this.gate = tileCenter(3, 22);
    this.gateGuard = { x: this.gate.x, y: this.gate.y }; // still guarded — nobody returns
    this.altar = tileCenter(28, 19);
    this.god = tileCenter(30, 19);
    this.playerStart = tileCenter(16, 24);
    this.abel = { x: tileCenter(38, 12).x, y: tileCenter(38, 12).y, following: false };
    this.adam = null;  // (not the Ch2/Ch3 versions)
    this.eve = null;
    this.snake = null;
    this.knowledgeTree = null;
    this.tent = tileCenter(16, 26);
    this.fieldSpot = tileCenter(49, 33);
    this.fieldZone = { x1: 44 * TILE, y1: 28 * TILE, x2: 55 * TILE, y2: 39 * TILE };
    this.beacon = { x: -9999, y: -9999 };
    this.soils = [];
    this.lit = true;

    // sheep grazing in Abel's pasture
    const S = (tx, ty) => {
      const p = tileCenter(tx, ty);
      return { kind: 'lamb', name: 'sheep', x: p.x, y: p.y, state: 'idle', target: null,
               wait: 0, speed: 0, named: true, phase: hash2(tx, ty) * 6.28 };
    };
    this.animals = [S(35, 10), S(40, 14), S(43, 11)];

    // the lone landmark tree in the field, then a gentle scatter
    addTree(49, 33, { baseR: 13, big: true });
    const keyPts = [this.altar, this.god, this.playerStart, this.abel, this.fieldSpot,
                    this.tent, this.gate, ...this.animals.map(a => ({ x: a.x, y: a.y }))];
    for (let y = 4; y <= 40; y++) {
      for (let x = 4; x <= 60; x++) {
        if (get(x, y) !== T.GRASS) continue;
        if (hash2(x * 17 + 5, y * 11 + 3) >= 0.016) continue;
        const c = tileCenter(x, y);
        if (keyPts.some(k => Math.hypot(k.x - c.x, k.y - c.y) < 80)) continue;
        addTree(x, y);
      }
    }
  },

  /* ============================================================
     CHAPTER 5 — Noah's time: the ark on its building field,
     a village to the east whose people will not listen, Noah's
     home to the south-west, and the ocean to the far south
     (the Flood is coming).
     ============================================================ */
  buildChapter5() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.GRASS);

    // mountains in the far north (scenery)
    const blobs = [[7, 5, 5], [56, 5, 4], [60, 9, 3]];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        for (const b of blobs) {
          const d = Math.hypot(x - b[0], y - b[1]);
          if (d <= b[2] * (0.75 + 0.45 * hash2(x + b[0], y + b[1]))) { set(x, y, T.MOUNTAIN); break; }
        }
      }
    }

    // the ocean in the far south (where the Flood waters will rise)
    for (let y = 40; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) set(x, y, T.WATER);
    for (let x = 0; x < MAP_W; x++) set(x, 39, T.SAND);

    // the big field where the ark is being built (also the animals' arrival zone)
    for (let y = 14; y <= 28; y++) for (let x = 22; x <= 38; x++) set(x, y, T.MEADOW);

    // paths: Jehovah's hill → ark field → village in the east; a spur south to Noah's home
    for (let y = 9; y <= 21; y++) { set(29, y, T.PATH); set(30, y, T.PATH); }
    for (let x = 30; x <= 55; x++) { set(x, 21, T.PATH); set(x, 22, T.PATH); }
    for (let y = 28; y <= 34; y++) { set(29, y, T.PATH); set(30, y, T.PATH); }

    // key positions
    this.god = tileCenter(30, 8);
    // the ark is NOT shown until the build quest is finished — only its
    // building spot is remembered so the timber piles can be placed around it
    this.arkPoint = tileCenter(30, 18);
    this.ark = null;
    this.playerStart = tileCenter(30, 33);
    this.buildSpots = [[23, 14], [37, 14], [23, 24], [37, 24]].map(([bx, by]) => {
      const p = tileCenter(bx, by);
      return { x: p.x, y: p.y, done: false };
    });

    // Noah's home and his family (they helped build the ark)
    this.huts = [[17, 30], [46, 16], [52, 19], [47, 25], [53, 27]].map(([hx, hy]) => {
      const p = tileCenter(hx, hy);
      return { x: p.x, y: p.y };
    });
    const P = (name, tx, ty, robe, hair, opts) => {
      const p = tileCenter(tx, ty);
      return Object.assign({
        name, x: p.x, y: p.y, robe, hair, beard: false, villager: false,
        warned: false, line: [], phase: hash2(tx, ty) * 6.28
      }, opts || {});
    };
    this.family = [
      P('Noah’s Wife', 14, 31, '#a86f8a', '#3b2412', {
        line: [{ s: 'Noah’s Wife', t: 'The ark grows a little taller every day, Noah. Jehovah will provide.' }]
      }),
      P('Shem', 20, 31, '#6f8a5a', '#3f2a18', {
        line: [{ s: 'Shem', t: 'Father, the timber is ready for the next wall.' }]
      }),
      P('Ham', 15, 34, '#8a7a4f', '#2e2013', {
        line: [{ s: 'Ham', t: 'We will finish it exactly as Jehovah showed you.' }]
      }),
      P('Japheth', 22, 34, '#5a7a8a', '#4a3220', {
        line: [{ s: 'Japheth', t: 'Even the animals seem to be coming, Father — as if they know.' }]
      })
    ];
    this.villagers = [
      P('Villager', 47, 18, '#8a6d4a', '#4a3520', {
        villager: true,
        line: [{ s: 'Villager', t: 'A flood? Bah — the rain has never hurt anyone!' },
               { t: 'He laughs and walks away.' }]
      }),
      P('Villager', 52, 24, '#7a6a55', '#5a4028', {
        villager: true,
        line: [{ s: 'Villager', t: 'You spend your days hammering wood, Noah. Why not enjoy life?' }]
      }),
      P('Villager', 47, 28, '#96693f', '#3a2a16', {
        villager: true,
        line: [{ s: 'Villager', t: 'We do not believe you — and we will not listen.' }]
      })
    ];

    // the animals to find and lead to the ark:
    // rabbits, elephants and birds come two by two — plus a flock of seven sheep
    const A = (kind, name, tx, ty, speed) => {
      const p = tileCenter(tx, ty);
      return { kind, name, x: p.x, y: p.y, state: 'idle', target: null, wait: 0, speed,
               partner: null, phase: hash2(tx, ty) * 6.28 };
    };
    this.animals = [
      A('rabbit', 'rabbit', 12, 18, 70),   // 0–1  rabbits (a pair)
      A('rabbit', 'rabbit', 14, 15, 70),
      A('lamb', 'sheep', 6, 34, 55),       // 2–8  seven sheep
      A('lamb', 'sheep', 9, 36, 55),
      A('lamb', 'sheep', 12, 38, 55),
      A('lamb', 'sheep', 8, 31, 55),
      A('lamb', 'sheep', 11, 33, 55),
      A('lamb', 'sheep', 14, 37, 55),
      A('lamb', 'sheep', 6, 37, 55),
      A('elephant', 'elephant', 43, 7, 40), // 9–10 elephants (a pair)
      A('elephant', 'elephant', 46, 9, 40),
      A('bird', 'bird', 57, 33, 95),       // 11–12 birds (a pair)
      A('bird', 'bird', 55, 36, 95)
    ];
    for (const [i, j] of [[0, 1], [9, 10], [11, 12]]) {
      this.animals[i].partner = this.animals[j];
      this.animals[j].partner = this.animals[i];
    }

    this.lit = true; // Noah's world is daylight

    // gentle scatter of trees (never on the key places)
    this.trees = [];
    const addTree = (tx, ty, opts) => {
      const p = tileCenter(tx, ty);
      const baseR = (opts && opts.baseR) || 11;
      this.trees.push({
        x: p.x, y: p.y, baseR, r: baseR,
        big: !!(opts && opts.big), planted: false, growStart: 0
      });
    };
    const keyPts = [this.god, this.arkPoint, this.playerStart, ...this.buildSpots, ...this.huts,
                    ...this.villagers, ...this.family, ...this.animals.map(a => ({ x: a.x, y: a.y }))];
    for (let y = 4; y <= 38; y++) {
      for (let x = 3; x <= 61; x++) {
        if (get(x, y) !== T.GRASS) continue;
        if (hash2(x * 17 + 7, y * 11 + 5) >= 0.016) continue;
        const c = tileCenter(x, y);
        if (keyPts.some(k => Math.hypot(k.x - c.x, k.y - c.y) < 80)) continue;
        addTree(x, y);
      }
    }
  },

  /* ============================================================
   *  Chapter 6 — the world under the Flood: one island of dry
   *  ground (the mountains of Ararat) with the ark resting on it,
   *  water everywhere else. When the 'recede' fx fires, the whole
   *  earth becomes walkable dry land again (recedeFlood below).
   * ============================================================ */
  buildChapter6() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.WATER);                 // the Flood covers the whole earth
    this.flooded = true;
    this.raining = true;             // rain still falls while the waters are high
    this.rainbow = false;

    // the only dry ground on earth: an island in the middle of the water
    for (let y = 13; y <= 27; y++) {
      for (let x = 21; x <= 39; x++) {
        const d = Math.hypot((x - 30) / 9.5, (y - 20) / 7.2);
        if (d <= 1.0) set(x, y, d > 0.78 ? T.SAND : T.GRASS);
      }
    }
    // rocky peaks along the north of the island (solid backdrop)
    for (let y = 13; y <= 14; y++) {
      for (let x = 26; x <= 34; x++) if (get(x, y) !== T.WATER) set(x, y, T.MOUNTAIN);
    }

    // key positions — the ark has come to rest on the island
    this.arkPoint = tileCenter(30, 19);
    this.ark = this.arkPoint;
    this.altar = null;                    // built later from the stones below
    this.stonePile = tileCenter(24, 22);
    this.god = { x: -9999, y: -9999 };    // Jehovah shows Himself after the offering

    this.lit = true;
    /* Inside the ark: a wooden room with a little window (north wall)
       and the door (south wall). Everyone is sheltered in here. */
    const A = this.ark;
    this.interior = {
      x0: A.x - 192, y0: A.y - 128,
      x1: A.x + 192, y1: A.y + 128,
      window: { x: A.x, y: A.y - 122 },
      door: { x: A.x, y: A.y + 122 },
    };
    this.playerStart = { x: A.x, y: A.y - 60 };
    this.family = [
      { x: A.x - 165, y: A.y - 50, name: 'Wife' },
      { x: A.x - 165, y: A.y + 10, name: 'Shem' },
      { x: A.x - 165, y: A.y + 70, name: 'Ham' },
      { x: A.x + 165, y: A.y - 50, name: 'Japheth' },
      { x: A.x + 165, y: A.y + 10, name: "Shem's Wife" },
      { x: A.x + 165, y: A.y + 70, name: "Ham's Wife" },
      { x: A.x + 118, y: A.y + 96, name: "Japheth's Wife" },
    ];
    const lamb = (x, y, phase) => ({ kind: 'lamb', x, y, name: 'sheep', state: 'idle', target: null, wait: 0, speed: 0, phase });
    this.sheep = lamb(A.x + 40, A.y - 60, 0.4);
    this.animals = [
      this.sheep,
      lamb(A.x + 84, A.y - 60, 1.4),
      { kind: 'rabbit', x: A.x - 96, y: A.y - 92, name: 'rabbit', state: 'idle', target: null, wait: 0, speed: 0, phase: 3.7 },
      { kind: 'bird', x: A.x - 56, y: A.y - 96, name: 'bird', state: 'idle', target: null, wait: 0, speed: 0, phase: 2.1 },
    ];
    this.trees = [];                 // the island is bare — trees return with the dry ground
  },

  buildChapter7() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.GRASS);                  // the wide plain of Shinar
    this.lit = true;

    /* map edges are mountains — the plain is ringed in */
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (y < 2 || x < 2 || x > 61 || y > 42) set(x, y, T.MOUNTAIN);

    /* river in the south, with sandy banks */
    for (let x = 0; x < MAP_W; x++) { set(x, 38, T.SAND); set(x, 39, T.WATER); set(x, 40, T.WATER); set(x, 41, T.SAND); }

    /* Jehovah's hill in the west (a mountain with a grass top) */
    for (let y = 6; y <= 12; y++)
      for (let x = 7; x <= 13; x++)
        if (Math.hypot(x - 10, y - 9) <= 3) set(x, y, T.MOUNTAIN);
    for (let y = 8; y <= 10; y++) for (let x = 9; x <= 11; x++) set(x, y, T.GRASS);

    /* the tower: a 5x5 block of mud bricks (solid) in the north of the city */
    for (let y = 14; y <= 18; y++) for (let x = 28; x <= 32; x++) set(x, y, T.MOUNTAIN);

    /* roads: hill → main street → tower face; and the main street → city gate */
    for (let y = 10; y <= 23; y++) set(10, y, T.PATH);
    for (let x = 10; x <= 37; x++) set(x, 23, T.PATH);
    for (let y = 19; y <= 37; y++) set(30, y, T.PATH);

    /* key positions */
    this.god = tileCenter(10, 9);
    this.tower = Object.assign(tileCenter(30, 16), { level: 0 });
    this.brickPile = tileCenter(25, 22);
    this.cityGate = tileCenter(30, 30);
    this.playerStart = tileCenter(30, 24);
    this.foreman = { x: 0, y: 0, name: 'Foreman', phase: 0.2 };
    this.foreman.x = tileCenter(35, 22).x; this.foreman.y = tileCenter(35, 22).y;
    this.scaffolds = [[27, 19], [33, 19], [30, 21]].map(([sx, sy]) => {
      const p = tileCenter(sx, sy);
      return { x: p.x, y: p.y, done: false };
    });

    /* the city: mud-brick houses around the central street */
    this.huts = [[22, 17], [22, 21], [22, 25], [25, 27], [35, 27],
                 [38, 17], [38, 21], [38, 23], [38, 25]].map(([hx, hy]) => {
      const p = tileCenter(hx, hy);
      return { x: p.x, y: p.y };
    });

    /* the builders */
    const W = (tx, ty, robe, phase) => {
      const p = tileCenter(tx, ty);
      return { x: p.x, y: p.y, name: 'Builder', robe, phase, state: 'idle', target: null, speed: 42 };
    };
    this.workers = [
      W(26, 25, '#a5794f', 0.7), W(34, 25, '#8d6a8f', 1.9),
      W(36, 20, '#6f8fa5', 2.8), W(24, 20, '#a5794f', 4.1),
    ];

    /* a few trees on the plain (never on the roads or the city) */
    this.trees = [];
    for (const [tx, ty] of [[6, 28], [7, 33], [46, 12], [50, 30], [45, 35], [16, 32], [54, 20], [18, 6], [52, 8], [6, 18]]) {
      if (get(tx, ty) !== T.GRASS) continue;
      const p = tileCenter(tx, ty);
      this.trees.push({ x: p.x, y: p.y, baseR: 11, r: 11, big: false, growStart: 0 });
    }
  },


  buildChapter8() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    t.fill(T.GRASS);                  // grass everywhere; Ur and the desert are sand
    this.lit = true;

    /* map edges are mountains */
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (y < 2 || x < 2 || x > 61 || y > 42) set(x, y, T.MOUNTAIN);

    /* the city of Ur (west, sandy streets) and the desert plain in the middle */
    for (let y = 3; y <= 41; y++)
      for (let x = 3; x <= 42; x++)
        if (t[y * MAP_W + x] !== T.MOUNTAIN) set(x, y, T.SAND);

    /* two dry hills in the desert */
    for (const [hx, hy] of [[27, 15], [38, 30]])
      for (let y = hy - 1; y <= hy + 1; y++)
        for (let x = hx - 1; x <= hx + 1; x++)
          if (y !== 22 && !(x === 32 && y >= 21 && y <= 23)) set(x, y, T.MOUNTAIN);

    /* the long road east, with a river and a bridge */
    for (let x = 4; x <= 56; x++) set(x, 22, T.PATH);
    for (let y = 2; y <= 41; y++) set(32, y, T.WATER);
    set(32, 21, T.BRIDGE); set(32, 22, T.BRIDGE); set(32, 23, T.BRIDGE);

    /* key positions: Jehovah first appears in Ur, then by the great tree */
    this.god = tileCenter(6, 18);
    this.canaanGod = tileCenter(52, 16);
    this.playerStart = tileCenter(11, 29);
    this.journeyZone = { x1: 44 * TILE, y1: 8 * TILE, x2: 61 * TILE, y2: 40 * TILE };
    this.journeyTarget = tileCenter(50, 19);
    this.tent = tileCenter(28, 25);   // a desert camp beside the road
    this.altar = tileCenter(15, 19);  // the idols of Ur — Abraham does not pray to these

    /* Abraham's household in Ur (they pack, then travel with him) */
    const P = (name, tx, ty, robe, hair) => {
      const p = tileCenter(tx, ty);
      return { x: p.x, y: p.y, name, robe, hair, packed: false, phase: 0.4 };
    };
    this.family = [
      P('Sarah', 10, 24, '#a86f8a', '#b9b3a8'),
      P('Terah', 7, 26, '#8d7b9a', '#d8d3c8'),
      P('Lot', 13, 27, '#6f8fa5', '#4a3320'),
    ];
    this.family[0].canaan = tileCenter(50, 20);
    this.family[1].canaan = tileCenter(47, 24);
    this.family[2].canaan = tileCenter(54, 19);

    /* houses in Ur */
    this.huts = [[8, 24], [12, 24], [16, 25], [5, 26]].map(([hx, hy]) => tileCenter(hx, hy));

    /* Canaan: green and open, with a great tree where Jehovah speaks */
    this.trees = [];
    const addTree = (tx, ty, opts) => {
      const p = tileCenter(tx, ty);
      this.trees.push(Object.assign({ x: p.x, y: p.y, baseR: 11, r: 11, big: false, growStart: 0 }, opts || {}));
    };
    addTree(52, 13, { baseR: 21, r: 21, big: true });   // the great tree of Moreh
    addTree(47, 12); addTree(56, 16); addTree(46, 30);
    addTree(54, 27); addTree(58, 24); addTree(44, 36);
  },

  buildChapter9() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.GRASS);
    this.lit = true;

    /* map edges are mountains */
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (y < 2 || x < 2 || x > 61 || y > 42) set(x, y, T.MOUNTAIN);

    /* soft meadow around the camp */
    for (let y = 14; y <= 28; y++)
      for (let x = 24; x <= 40; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);

    /* a path from the tent to the great tree */
    for (let x = 26; x <= 36; x++) set(x, 21, T.PATH);

    /* the sheep's pond in the west */
    for (let y = 29; y <= 35; y++)
      for (let x = 11; x <= 17; x++) {
        const d = Math.hypot(x - 14, y - 32);
        if (d <= 1.8) set(x, y, T.WATER);
        else if (d <= 2.8) set(x, y, T.SAND);
      }

    /* two distant hills */
    for (const [hx, hy] of [[48, 14], [44, 34]])
      for (let y = hy - 1; y <= hy + 1; y++)
        for (let x = hx - 1; x <= hx + 1; x++)
          if (get(x, y) !== T.MOUNTAIN) set(x, y, T.MOUNTAIN);

    /* key positions — Jehovah does not appear as an NPC in this chapter */
    this.god = { x: -9999, y: -9999 };
    this.tent = tileCenter(28, 22);
    this.visitorSpot = tileCenter(36, 19);
    this.playerStart = tileCenter(28, 25);

    /* the camp: Sarah and Hagar (Ishmael and Isaac are born during the story) */
    const P = (name, tx, ty, robe, hair) => {
      const p = tileCenter(tx, ty);
      return { x: p.x, y: p.y, name, robe, hair, phase: 0.4 };
    };
    this.family = [
      P('Sarah', 26, 24, '#a86f8a', '#b9b3a8'),
      P('Hagar', 31, 25, '#c9a06a', '#3b2412'),
    ];

    /* the three visitors appear under the great tree when they arrive */
    this.visitors = [];   // empty until the visitors come in the story

    /* the great tree and its shade */
    this.trees = [];
    const addTree = (tx, ty, opts) => {
      const p = tileCenter(tx, ty);
      this.trees.push(Object.assign({ x: p.x, y: p.y, baseR: 11, r: 11, big: false, growStart: 0 }, opts || {}));
    };
    addTree(36, 17, { baseR: 21, r: 21, big: true });   // the great tree of Mamre
    for (const [tx, ty] of [[30, 15], [43, 20], [46, 26], [24, 18], [40, 30], [28, 34], [50, 24], [54, 30], [20, 24]])
      addTree(tx, ty);

    /* the sheep by the pond */
    this.animals = [[17, 30], [19, 32], [17, 34]].map(([sx, sy], i) => {
      const p = tileCenter(sx, sy);
      return { kind: 'sheep', name: 'sheep', x: p.x, y: p.y, state: 'idle',
               target: null, wait: 0, speed: 0, phase: i * 1.7 };
    });
  },

  buildChapter10() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.GRASS);
    this.lit = true;

    /* map edges are mountains */
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (y < 2 || x < 2 || x > 61 || y > 42) set(x, y, T.MOUNTAIN);

    /* west: the camp where Abraham's and Lot's flocks graze */
    for (let y = 14; y <= 30; y++)
      for (let x = 4; x <= 20; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);

    /* east: the cities (sandy streets) — Sodom and, west of it, Gomorrah */
    for (let y = 3; y <= 14; y++) for (let x = 44; x <= 58; x++) set(x, y, T.SAND);
    for (let y = 3; y <= 7; y++)  for (let x = 34; x <= 40; x++) set(x, y, T.SAND);

    /* the pleasant land: green grass and a pond near Sodom */
    for (let y = 8; y <= 16; y++)
      for (let x = 42; x <= 48; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);
    for (let y = 6; y <= 12; y++)
      for (let x = 40; x <= 46; x++) {
        const d = Math.hypot(x - 43, y - 9);
        if (d <= 1.6) set(x, y, T.WATER);
        else if (d <= 2.6) set(x, y, T.SAND);
      }

    /* roads: camp → east, and the escape road south from Sodom to Zoar */
    for (let x = 13; x <= 51; x++) set(x, 22, T.PATH);
    for (let y = 15; y <= 38; y++) set(51, y, T.PATH);

    /* key positions — Jehovah does not appear as an NPC in this chapter */
    this.god = { x: -9999, y: -9999 };
    this.tent = tileCenter(11, 21);
    this.cityGate = tileCenter(51, 15);
    this.choiceSpot = tileCenter(44, 12);
    this.zoarSpot = tileCenter(51, 37);
    this.escapeZone = { x1: 46 * TILE, y1: 34 * TILE, x2: 60 * TILE, y2: 41 * TILE };
    this.playerStart = tileCenter(12, 24);

    const P = (name, tx, ty, robe, hair) => {
      const p = tileCenter(tx, ty);
      return { x: p.x, y: p.y, name, robe, hair, phase: 0.4 };
    };

    /* Abraham at the camp (he does not travel with Lot) */
    this.abraham = P('Abraham', 13, 22, '#9d8a6a', '#e8e4da');

    /* Lot's family: camp → Sodom → the road → Zoar (spots per stage) */
    this.family = [
      P("Lot's Wife", 9, 23, '#a86f8a', '#3b2412'),
      P('Daughter', 8, 25, '#c9a06a', '#4a3320'),
      P('Daughter', 10, 25, '#c9a06a', '#4a3320'),
    ];
    this.family[0].spots = { sodom: [49, 13], road: [51, 18], zoar: [50, 38] };
    this.family[1].spots = { sodom: [47, 13], road: [49, 21], zoar: [48, 39] };
    this.family[2].spots = { sodom: [51, 13], road: [53, 21], zoar: [52, 39] };

    this.angels = [];
    this.wifePillar = null;
    this.burning = false;

    /* Sodom, Gomorrah and little Zoar */
    this.huts = [[46, 6], [50, 5], [54, 6], [47, 10], [53, 10],   // Sodom
                 [36, 4], [39, 6], [37, 7],                       // Gomorrah
                 [48, 37], [55, 37]].map(([hx, hy]) => tileCenter(hx, hy)); // Zoar

    /* trees */
    this.trees = [];
    for (const [tx, ty] of [[18, 16], [24, 26], [30, 18], [36, 28], [44, 26],
                            [57, 20], [58, 32], [44, 16], [26, 33]]) {
      if (get(tx, ty) !== T.GRASS && get(tx, ty) !== T.MEADOW) continue;
      const p = tileCenter(tx, ty);
      this.trees.push({ x: p.x, y: p.y, baseR: 11, r: 11, big: false, growStart: 0 });
    }

    /* too many animals — that's the whole problem! */
    const A = (kind, tx, ty, i) => {
      const p = tileCenter(tx, ty);
      return { kind, name: kind, x: p.x, y: p.y, state: 'idle',
               target: null, wait: 0, speed: 0, phase: i * 1.3 };
    };
    this.animals = [
      A('sheep', 6, 18, 1), A('sheep', 8, 28, 2), A('sheep', 15, 17, 3),
      A('sheep', 17, 25, 4), A('sheep', 5, 22, 5), A('sheep', 13, 29, 6),
      A('lamb', 7, 20, 7), A('lamb', 16, 20, 8),
    ];
  },

  buildChapter11() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.GRASS);
    this.lit = true;

    /* map edges are mountains */
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (y < 2 || x < 2 || x > 61 || y > 42) set(x, y, T.MOUNTAIN);

    /* west: Abraham's camp on a green meadow */
    for (let y = 14; y <= 30; y++)
      for (let x = 4; x <= 20; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);

    /* the desert plain they cross on the three-day journey */
    for (let y = 3; y <= 41; y++)
      for (let x = 21; x <= 44; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.SAND);

    /* east: the mountains of Moriah, with a clearing at the top */
    for (let y = 4; y <= 40; y++)
      for (let x = 45; x <= 61; x++) set(x, y, T.MOUNTAIN);
    for (let y = 6; y <= 13; y++)
      for (let x = 47; x <= 57; x++) set(x, y, T.GRASS);

    /* roads: camp → east, then up through the mountain pass */
    for (let x = 12; x <= 48; x++) set(x, 22, T.PATH);
    for (let y = 10; y <= 22; y++) set(48, y, T.PATH);

    /* key positions */
    this.god = tileCenter(8, 18);
    this.tent = tileCenter(11, 21);
    this.playerStart = tileCenter(12, 24);
    this.journeyTarget = tileCenter(45, 22);
    this.journeyZone = { x1: 44 * TILE, y1: 6 * TILE, x2: 61 * TILE, y2: 30 * TILE };
    this.stonePile = tileCenter(52, 9);   // the altar site at the top
    this.ram = null;                      // appears when the angel speaks

    const P = (name, tx, ty, robe, hair) => {
      const p = tileCenter(tx, ty);
      return { x: p.x, y: p.y, name, robe, hair, phase: 0.4 };
    };

    /* Isaac travels with Abraham; the two servants wait at the mountain's foot */
    this.isaac = P('Isaac', 14, 22, '#c9a06a', '#4a3320');
    this.family = [
      P('Servant', 9, 24, '#6f8fa5', '#3b2412'),
      P('Servant', 11, 26, '#8d93a5', '#4a3320'),
    ];

    /* camp huts, trees, and a few sheep for life around the camp */
    this.huts = [[7, 26], [16, 26]].map(([hx, hy]) => tileCenter(hx, hy));
    this.trees = [];
    for (const [tx, ty] of [[6, 16], [18, 17], [10, 32], [18, 29],   // camp
                            [57, 10], [53, 12], [57, 13]]) {         // bushes by the ram
      if (get(tx, ty) !== T.GRASS && get(tx, ty) !== T.MEADOW) continue;
      const p = tileCenter(tx, ty);
      this.trees.push({ x: p.x, y: p.y, baseR: 11, r: 11, big: false, growStart: 0 });
    }
    const A = (kind, tx, ty, i) => {
      const p = tileCenter(tx, ty);
      return { kind, name: kind, x: p.x, y: p.y, state: 'idle',
               target: null, wait: 0, speed: 0, phase: i * 1.4 };
    };
    this.animals = [A('sheep', 6, 28, 1), A('sheep', 9, 17, 2), A('sheep', 17, 24, 3)];
  },

  buildChapter12() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.GRASS);
    this.lit = true;

    /* map edges are mountains */
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (y < 2 || x < 2 || x > 61 || y > 42) set(x, y, T.MOUNTAIN);

    /* Isaac and Rebekah's camp on a wide meadow */
    for (let y = 12; y <= 32; y++)
      for (let x = 4; x <= 28; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);

    /* the road east — through the gate, away toward Laban */
    for (let x = 10; x <= 60; x++) set(x, 22, T.PATH);

    /* key positions */
    this.god = { x: -9999, y: -9999 };   // Jehovah does not appear in this chapter
    this.tent = tileCenter(12, 18);
    this.cityGate = tileCenter(54, 22);
    this.playerStart = tileCenter(13, 21);
    this.journeyTarget = tileCenter(56, 22);
    this.journeyZone = { x1: 56 * TILE, y1: 12 * TILE, x2: 61 * TILE, y2: 34 * TILE };

    const P = (name, tx, ty, robe, hair) => {
      const p = tileCenter(tx, ty);
      return { x: p.x, y: p.y, name, robe, hair, phase: 0.4 };
    };
    /* the family: Isaac, Rebekah, and Esau (Jacob is the player) */
    this.family = [
      P('Isaac', 11, 17, '#9d8a6a', '#e8e4da'),
      P('Rebekah', 15, 19, '#c98fa5', '#5a3b1e'),
      P('Esau', 17, 24, '#a8552e', '#a8552e'),   // red-haired hunter
    ];

    /* camp huts and trees */
    this.huts = [[16, 26], [20, 16], [8, 27]].map(([hx, hy]) => tileCenter(hx, hy));
    this.trees = [];
    for (const [tx, ty] of [[6, 14], [22, 14], [24, 28], [7, 31], [28, 20],
                            [50, 17], [44, 27], [46, 14], [36, 30]]) {
      if (get(tx, ty) !== T.GRASS && get(tx, ty) !== T.MEADOW) continue;
      const p = tileCenter(tx, ty);
      this.trees.push({ x: p.x, y: p.y, baseR: 11, r: 11, big: false, growStart: 0 });
    }

    /* flock and field animals around the camp */
    const A = (kind, tx, ty, i) => {
      const p = tileCenter(tx, ty);
      return { kind, name: kind, x: p.x, y: p.y, state: 'idle',
               target: null, wait: 0, speed: 0, phase: i * 1.5 };
    };
    this.animals = [A('sheep', 7, 20, 1), A('sheep', 14, 29, 2), A('sheep', 19, 21, 3),
                    A('rabbit', 23, 25, 4)];
  },

  buildChapter13() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.GRASS);
    this.lit = true;

    /* map edges are mountains */
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (y < 2 || x < 2 || x > 61 || y > 42) set(x, y, T.MOUNTAIN);

    /* west: Haran behind them — east: Esau's land ahead */
    for (let y = 14; y <= 30; y++)
      for (let x = 6; x <= 16; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);
    for (let y = 14; y <= 30; y++)
      for (let x = 44; x <= 58; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);

    /* the road home */
    for (let x = 8; x <= 60; x++) set(x, 22, T.PATH);

    /* key positions — the travelling camp stands mid-road */
    this.god = tileCenter(28, 18);
    this.tent = tileCenter(30, 19);
    this.playerStart = tileCenter(31, 24);
    this.angels = [];
    this.villagers = [];

    const P = (name, tx, ty, robe, hair) => {
      const p = tileCenter(tx, ty);
      return { x: p.x, y: p.y, name, robe, hair, phase: 0.4 };
    };
    /* Jacob's family and his servant (Jacob is the player) */
    this.family = [
      P('Wife', 29, 25, '#b98e9a', '#3b2412'),
      P('Son', 33, 25, '#c9a06a', '#4a3320'),
      P('Servant', 35, 22, '#6f8fa5', '#3b2412'),
    ];

    /* homes: Haran behind (west) and the homeland ahead (east) */
    this.huts = [[7, 20], [13, 16], [12, 27],
                 [50, 17], [55, 25], [46, 14]].map(([hx, hy]) => tileCenter(hx, hy));

    /* trees */
    this.trees = [];
    for (const [tx, ty] of [[18, 16], [24, 28], [40, 17], [40, 28], [54, 14], [24, 14], [47, 31]]) {
      if (get(tx, ty) !== T.GRASS && get(tx, ty) !== T.MEADOW) continue;
      const p = tileCenter(tx, ty);
      this.trees.push({ x: p.x, y: p.y, baseR: 11, r: 11, big: false, growStart: 0 });
    }

    /* the herds: part of Jacob's wealth — later sent ahead as a gift */
    const A = (kind, tx, ty, i) => {
      const p = tileCenter(tx, ty);
      return { kind, name: kind, x: p.x, y: p.y, state: 'idle',
               target: null, wait: 0, speed: 0, phase: i * 1.6 };
    };
    this.animals = [A('camel', 34, 20, 1), A('donkey', 36, 21, 2),
                    A('sheep', 27, 23, 3), A('sheep', 36, 24, 4),
                    A('sheep', 26, 26, 5), A('lamb', 32, 27, 6)];
  },

  buildChapter14() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.GRASS);
    this.lit = true;

    /* map edges are mountains */
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (y < 2 || x < 2 || x > 61 || y > 42) set(x, y, T.MOUNTAIN);

    /* west: Jacob's camp — middle: the pasture near Shechem */
    for (let y = 14; y <= 30; y++)
      for (let x = 4; x <= 18; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);
    for (let y = 14; y <= 26; y++)
      for (let x = 24; x <= 34; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);

    /* east: the desert and the land of Egypt */
    for (let y = 3; y <= 41; y++)
      for (let x = 35; x <= 60; x++)
        if (get(x, y) === T.GRASS || get(x, y) === T.MEADOW) set(x, y, T.SAND);

    /* the caravan road: camp → pasture → Egypt */
    for (let x = 8; x <= 60; x++) set(x, 25, T.PATH);

    /* key positions — Jehovah is with Joseph, but not seen */
    this.god = { x: -9999, y: -9999 };
    this.playerStart = tileCenter(10, 21);
    this.journeyTarget = tileCenter(44, 25);
    this.journeyZone = { x1: 44 * TILE, y1: 10 * TILE, x2: 61 * TILE, y2: 34 * TILE };

    const P = (name, tx, ty, robe, hair) => {
      const p = tileCenter(tx, ty);
      return { x: p.x, y: p.y, name, robe, hair, phase: 0.4 };
    };
    /* Canaan: Jacob and the brothers — Egypt: Potiphar and his wife */
    this.family = [
      P('Jacob', 9, 18, '#9d8a6a', '#e8e4da'),
      P('Brother', 30, 21, '#8d6a8f', '#3b2412'),
      P('Judah', 27, 19, '#a8552e', '#3b2412'),
      P('Brother', 25, 22, '#6f8fa5', '#4a3320'),
      P('Potiphar', 48, 18, '#5f8a8f', '#2c2c34'),
      P('Wife', 51, 19, '#c46a8a', '#2c2c34'),
    ];

    /* homes: Canaan behind, Egypt ahead */
    this.huts = [[7, 21], [13, 17],
                 [47, 15], [52, 16], [55, 23], [46, 28]].map(([hx, hy]) => tileCenter(hx, hy));

    /* trees (only where it is green) */
    this.trees = [];
    for (const [tx, ty] of [[6, 16], [15, 16], [18, 28], [7, 29], [22, 17],
                            [33, 15], [12, 31], [31, 13], [20, 30]]) {
      if (get(tx, ty) !== T.GRASS && get(tx, ty) !== T.MEADOW) continue;
      const p = tileCenter(tx, ty);
      this.trees.push({ x: p.x, y: p.y, baseR: 11, r: 11, big: false, growStart: 0 });
    }

    /* the flocks the brothers are watching */
    const A = (kind, tx, ty, i) => {
      const p = tileCenter(tx, ty);
      return { kind, name: kind, x: p.x, y: p.y, state: 'idle',
               target: null, wait: 0, speed: 0, phase: i * 1.7 };
    };
    this.animals = [A('sheep', 24, 20, 1), A('sheep', 29, 17, 2), A('sheep', 32, 21, 3),
                    A('sheep', 26, 24, 4), A('lamb', 30, 24, 5),
                    A('sheep', 11, 24, 6), A('sheep', 15, 27, 7)];
  },

  buildChapter15() {
    const t = (this.tiles = new Uint8Array(MAP_W * MAP_H));
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? T.MOUNTAIN : t[y * MAP_W + x]);
    t.fill(T.GRASS);
    this.lit = true;

    /* map edges are mountains */
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++)
        if (y < 2 || x < 2 || x > 61 || y > 42) set(x, y, T.MOUNTAIN);

    /* west: Canaan, where the brothers came from */
    for (let y = 14; y <= 30; y++)
      for (let x = 4; x <= 18; x++)
        if (get(x, y) === T.GRASS) set(x, y, T.MEADOW);

    /* east: the land of Egypt */
    for (let y = 3; y <= 41; y++)
      for (let x = 35; x <= 60; x++)
        if (get(x, y) === T.GRASS || get(x, y) === T.MEADOW) set(x, y, T.SAND);

    /* the road the brothers travelled */
    for (let x = 8; x <= 60; x++) set(x, 22, T.PATH);

    /* key positions — Joseph is in Egypt from the start */
    this.god = { x: -9999, y: -9999 };
    this.playerStart = tileCenter(50, 17);

    const P = (name, tx, ty, robe, hair) => {
      const p = tileCenter(tx, ty);
      return { x: p.x, y: p.y, name, robe, hair, phase: 0.4 };
    };
    this.family = [P('Pharaoh', 49, 13, '#3f6fb5', '#2c2c34')];

    /* the three grain piles to store in the fat years */
    this.grainPiles = [[53, 18], [53, 21], [52, 24]].map(pos => {
      const p = tileCenter(pos[0], pos[1]);
      return { x: p.x, y: p.y, done: false };
    });

    /* homes: Canaan behind, Egypt ahead (palace + storehouse) */
    this.huts = [[7, 20], [13, 16],
                 [49, 10], [55, 20], [44, 15], [57, 28]].map(([hx, hy]) => tileCenter(hx, hy));

    /* trees (only where it is green) */
    this.trees = [];
    for (const [tx, ty] of [[6, 16], [15, 16], [18, 28], [7, 29], [22, 17],
                            [33, 15], [12, 31], [20, 30]]) {
      if (get(tx, ty) !== T.GRASS && get(tx, ty) !== T.MEADOW) continue;
      const p = tileCenter(tx, ty);
      this.trees.push({ x: p.x, y: p.y, baseR: 11, r: 11, big: false, growStart: 0 });
    }

    /* flocks back home in Canaan */
    const A = (kind, tx, ty, i) => {
      const p = tileCenter(tx, ty);
      return { kind, name: kind, x: p.x, y: p.y, state: 'idle',
               target: null, wait: 0, speed: 0, phase: i * 1.7 };
    };
    this.animals = [A('sheep', 10, 26, 1), A('sheep', 14, 23, 2),
                    A('sheep', 17, 27, 3), A('lamb', 6, 25, 4)];
  },

  /* Called by the 'recede' fx while everyone is still inside: the door of
     the ark opens and Noah's family and the animals step out onto the
     dry ground around the ark. */
  exitInterior() {
    if (!this.interior) return;
    this.interior = null;
    const A = this.ark;
    const fpos = [[-160, -30], [-176, 30], [-150, 80], [160, -30], [176, 30], [150, 80], [110, 96]];
    this.family.forEach((m, i) => {
      const p = fpos[i] || [0, 60];
      m.x = A.x + p[0]; m.y = A.y + p[1];
    });
    this.animals.forEach((a, i) => {
      if (a === this.sheep) { a.x = A.x + 40; a.y = A.y + 96; return; }
      const side = i % 2 ? 1 : -1;
      a.x = A.x + side * (140 + Math.floor(i / 2) * 30);
      a.y = A.y + 54 + (i * 13) % 44;
    });
    // no new-world tree may sprout right under anyone's feet
    const people = [...this.family, ...this.animals];
    this.trees = this.trees.filter(tr => people.every(p => Math.hypot(tr.x - p.x, tr.y - p.y) > 46));
  },

  /* Called by the 'recede' fx: the waters go down and dry land appears. */
  recedeFlood() {
    if (!this.flooded || !this.tiles) return;
    this.flooded = false;
    this.raining = false;
    const t = this.tiles;
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) t[y * MAP_W + x] = v; };
    // every flooded tile becomes walkable grass
    for (let i = 0; i < t.length; i++) if (t[i] === T.WATER) t[i] = T.GRASS;
    // far-north mountains come back into view (scenery)
    const blobs = [[7, 5, 5], [56, 5, 4], [60, 9, 3]];
    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < MAP_W; x++) {
        for (const b of blobs) {
          const d = Math.hypot(x - b[0], y - b[1]);
          if (d <= b[2] * (0.75 + 0.45 * hash2(x + b[0], y + b[1]))) { set(x, y, T.MOUNTAIN); break; }
        }
      }
    }
    // the ocean remains in the far south
    for (let y = 40; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) set(x, y, T.WATER);
    for (let x = 0; x < MAP_W; x++) set(x, 39, T.SAND);
    // new-world trees on the fresh ground (never on the key places)
    const keyPts = [this.ark, this.altar, this.stonePile, this.god, this.playerStart]
      .filter(k => k && k.x > -1000);
    this.trees = this.trees || [];
    for (let y = 16; y <= 38; y++) {
      for (let x = 3; x <= 61; x++) {
        if (t[y * MAP_W + x] !== T.GRASS) continue;
        if (hash2(x * 13 + 3, y * 7 + 9) >= 0.02) continue;
        const c = tileCenter(x, y);
        if (keyPts.some(k => Math.hypot(k.x - c.x, k.y - c.y) < 80)) continue;
        this.trees.push({ x: c.x, y: c.y, baseR: 11, r: 11, big: false, planted: false, growStart: 0 });
      }
    }
  }
};
