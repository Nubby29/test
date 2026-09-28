'use strict';
/* ============================================================
   Automated end-to-end playthrough test for Chapter 1.
   Run:  node test/run-test.js
   Stubs just enough DOM + canvas to run the real game scripts
   headlessly, then plays the whole chapter start → finish.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// ---------- canvas 2D context stub (STRICT: validates like a real browser,
//   so browser-only errors such as negative ellipse radii → IndexSizeError
//   are caught by this test instead of only failing in-game) ----------
function sizeErr(name, i) {
  const e = new Error("Failed to execute '" + name + "' on 'CanvasRenderingContext2D': index " + i + " is negative");
  e.name = 'IndexSizeError';
  return e;
}
const strict2d = {
  ellipse(x, y, rx, ry) {
    if (!Number.isFinite(rx) || rx < 0) throw sizeErr('ellipse', 2);
    if (!Number.isFinite(ry) || ry < 0) throw sizeErr('ellipse', 3);
  },
  arc(x, y, r) {
    if (!Number.isFinite(r) || r < 0) throw sizeErr('arc', 2);
  },
  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    if (!Number.isFinite(r0) || r0 < 0) throw sizeErr('createRadialGradient', 2);
    if (!Number.isFinite(r1) || r1 < 0) throw sizeErr('createRadialGradient', 5);
    return { addColorStop() {} };
  },
  createLinearGradient() { return { addColorStop() {} }; },
  measureText() { return { width: 42 }; }
};
const ctxStub = new Proxy({}, {
  get(t, p) {
    if (p in strict2d) return strict2d[p];
    if (p in t) return t[p];
    return function () {};
  },
  set(t, p, v) { t[p] = v; return true; }
});

// ---------- DOM element stub ----------
function makeEl(id) {
  const listeners = {};
  const classSet = new Set();
  const el = {
    id,
    children: [],
    _text: '',
    _html: '',
    style: {},
    offsetWidth: 100,
    classList: {
      add(c) { classSet.add(c); },
      remove(c) { classSet.delete(c); },
      contains(c) { return classSet.has(c); }
    },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    click() { (listeners.click || []).slice().forEach(f => f({ currentTarget: el })); },
    blur() {},
    focus() {},
    appendChild(c) { el.children.push(c); return c; },
    removeChild(c) { el.children = el.children.filter(x => x !== c); },
    remove() {},
    getContext() { return ctxStub; }
  };
  Object.defineProperty(el, 'textContent', {
    get() { return el._text; },
    set(v) { el._text = String(v); }
  });
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html; },
    set(v) { el._html = String(v); if (v === '') el.children = []; }
  });
  return el;
}

const ids = ['canvas', 'questTitle', 'questObjective', 'questProgress', 'questDone',
  'questCount', 'prompt', 'toasts', 'dialogBox', 'dlgSpeaker', 'dlgText',
  'cinema', 'cinemaSpeaker', 'cinemaText', 'flash', 'startScreen', 'startBtn',
  'chapterEnd', 'endQuests', 'endCanon', 'againBtn'];
const els = {};
for (const id of ids) els[id] = makeEl(id);
['dialogBox', 'cinema', 'prompt', 'chapterEnd'].forEach(i => els[i].classList.add('hidden'));

const docListeners = {};
global.document = {
  getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
  createElement(tag) { return makeEl(tag); },
  addEventListener(t, f) { (docListeners[t] = docListeners[t] || []).push(f); },
  hidden: false
};

let rafQueue = [];
const winListeners = {};
global.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener(t, f) { (winListeners[t] = winListeners[t] || []).push(f); },
  location: { reload() {} }
};
global.requestAnimationFrame = cb => rafQueue.push(cb);

// localStorage stub (progress persistence is asserted by the test)
const store = {};
global.localStorage = {
  getItem(k) { return (k in store) ? store[k] : null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; }
};

// dispatch a synthetic event to window listeners (keydown/keyup/blur/…)
function fireWin(type, props) {
  const e = Object.assign({ code: '', repeat: false, preventDefault() {}, target: null }, props || {});
  (winListeners[type] || []).slice().forEach(f => f(e));
  return e;
}

// ---------- load the real game scripts ----------
// minimal Image stub so Adam's sprite sheet (assets/adam/walk.png) is
// "loaded" in tests — drawImage falls through to the canvas stub no-op
global.Image = class {
  constructor() {
    this.complete = false;
    this.naturalWidth = 0;
    this.width = 0;
    this._src = '';
  }
  set src(v) {
    this._src = v;
    this.complete = true;
    this.naturalWidth = 768;
    this.width = 768;
    if (this.onload) this.onload();
  }
  get src() { return this._src; }
};

function load(file) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
  vm.runInThisContext(code, { filename: file });
}

try {
  load('js/data.js');
  load('js/world.js');
  load('js/audio.js');
  load('js/pixel-renderer.js');
  load('js/pixel-tiles.js');
  load('js/pixel-objects.js',
    'js/pixel-sprites.js',
    'js/pixel-characters.js',
    'js/pixel-animals.js');
  load('js/game.js');

  // ---------- helpers ----------
  const results = [];
  const log = s => { results.push(s); console.log(s); };
  let clock = performance.now();
  function pump(n) {
    for (let i = 0; i < n; i++) {
      clock += 50;
      const cbs = rafQueue;
      rafQueue = [];
      for (const cb of cbs) cb(clock);
    }
  }
  function drain(guard) {
    let n = 0;
    while (gameState === 'seq' && n < (guard || 60)) { onAction(); n++; }
  }
  function near(x, y) { player.x = x; player.y = y; }

  // ---------- playthrough ----------
  pump(5);
  log('TEST boot state=' + gameState);

  // start from the chapter selector with number key 1
  const cardsListed = els.chapterList && els.chapterList.children.length === CHAPTERS.length;
  log('TEST chapterSelect cards=' + (els.chapterList ? els.chapterList.children.length : -1));
  fireWin('keydown', { code: 'Digit1' });
  fireWin('keyup', { code: 'Digit1' });
  const kbStart = gameState === 'seq';
  log('TEST keyboardStart state=' + gameState);
  drain();
  pump(3);
  log('TEST afterIntro state=' + gameState + ' quest=' + questId());

  // clicking a chapter card mid-game must do nothing (double-start guard)
  const guardState = gameState;
  if (els.chapterList.children.length) els.chapterList.children[0].click();
  const cardGuard = gameState === guardState && chapterIdx === 0;
  log('TEST cardClickGuard=' + cardGuard);

  // keyboard movement must move the player (WASD + arrows)
  const bx = player.x, by = player.y;
  fireWin('keydown', { code: 'KeyD' }); pump(10); fireWin('keyup', { code: 'KeyD' });
  fireWin('keydown', { code: 'ArrowDown' }); pump(10); fireWin('keyup', { code: 'ArrowDown' });
  const movedRight = player.x - bx, movedDown = player.y - by;
  log('TEST movement right=' + movedRight.toFixed(1) + ' down=' + movedDown.toFixed(1));

  // window blur must clear held keys (no stuck movement)
  fireWin('keydown', { code: 'KeyA' });
  fireWin('blur');
  const blurCleared = keys['KeyA'] !== true;
  fireWin('keyup', { code: 'KeyA' });
  log('TEST blurClearsKeys=' + blurCleared);

  // premature beacon touch must be blocked, and a movement key must
  // advance the dialog (fresh presses only) without moving the player
  near(World.beacon.x, World.beacon.y - 40);
  tryInteract();
  const pxDuring = player.x + ',' + player.y;
  fireWin('keydown', { code: 'KeyS' }); fireWin('keyup', { code: 'KeyS' }); // completes text
  fireWin('keydown', { code: 'KeyS' }); fireWin('keyup', { code: 'KeyS' }); // advances → play
  const blockedOk = !World.lit && questId() === 'meet' && gameState === 'play' &&
    (player.x + ',' + player.y) === pxDuring;
  log('TEST blockedBeacon lit=' + World.lit + ' quest=' + questId() +
      ' state=' + gameState + ' dialogAdvancesWithMoveKey noMoveDuringSeq=' +
      ((player.x + ',' + player.y) === pxDuring));

  // Q1 — meet Jehovah
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();
  log('TEST afterMeet quest=' + questId() + ' completed=' + completed.length);

  // Q2 — beacon of light (canon event #1)
  near(World.beacon.x, World.beacon.y - 40);
  tryInteract(); drain();
  log('TEST afterLight lit=' + World.lit + ' quest=' + questId() + ' completed=' + completed.length);

  // Q3 — plant three seeds
  for (const s of World.soils) {
    near(s.x, s.y - 40);
    tryInteract(); pump(4); drain();
  }
  log('TEST afterPlants seeds=' + (progress.plants || 0) + ' quest=' + questId() +
      ' completed=' + completed.length + ' trees=' + World.trees.length);

  // Q4 — lead four animals to the meadow
  for (const a of World.animals) {
    if (a.state === 'idle') { near(a.x, a.y + 40); tryInteract(); pump(4); drain(); }
  }
  pump(150); // let every animal walk into the meadow (bird flies from far east)
  const inMeadowCount = World.animals.filter(a => a.state === 'meadow').length;
  log('TEST afterAnimals led=' + (progress.animals || 0) + ' quest=' + questId() +
      ' completed=' + completed.length + ' arrivedInMeadow=' + inMeadowCount);

  // Q5 — finale cutscene → chapter end
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain(80);
  pump(5);
  const endVisible = !els.chapterEnd.classList.contains('hidden');
  log('TEST finale state=' + gameState + ' completed=' + completed.length +
      ' adam=' + !!World.adam + ' witnessed=' + witnessed.length);
  log('TEST endOverlay=' + endVisible);
  log('TEST endQuestItems=' + els.endQuests.children.length +
      ' endCanonItems=' + els.endCanon.children.length);
  const ch1ok = endVisible && completed.length === 5 && World.lit &&
    !!World.adam && witnessed.length === 1 && gameState === 'end' &&
    inMeadowCount === 4 && els.endCanon.children.length === 2 &&
    kbStart && movedRight > 20 && movedDown > 20 && blurCleared && blockedOk &&
    cardsListed && store.ebs_ch1 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 2' &&
    els.endTitle.textContent === 'Chapter 1 Complete';

  /* =================== CHAPTER 2: The Garden of Eden =================== */
  els.againBtn.click(); // continue — no page reload
  const ch2Start = chapterIdx === 1;
  log('TEST ch2 begin chapterIdx=' + chapterIdx + ' state=' + gameState);
  drain(); // intro cutscene
  log('TEST ch2 introDone quest=' + questId() + ' lit=' + World.lit +
      ' playable=' + CHAPTER.playable + ' adamNPC=' + World.adam);

  // Q1 — talk to Jehovah in the garden
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();
  log('TEST ch2 garden quest=' + questId() + ' completed=' + completed.length);

  // Q2 — YOU are Adam: name the four animals yourself (no Adam NPC exists)
  const isAdam = chapterIdx === 1 && CHAPTER.playable === 'adam' && World.adam === null;
  log('TEST ch2 playableIsAdam=' + isAdam);
  for (const a of World.animals) {
    if (!a.named) { near(a.x, a.y + 40); tryInteract(); drain(); }
  }
  log('TEST ch2 named=' + (progress.naming || 0) + ' quest=' + questId() +
      ' completed=' + completed.length);

  // Q3 — the rule beside the tree of the knowledge (canon toast)
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();

  // Q4 — cutscene: deep sleep → rib → Eve spawns
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain(80);
  log('TEST ch2 eve=' + !!World.eve + ' quest=' + questId() + ' completed=' + completed.length);

  // Q5 — finale blessing cutscene → Chapter 2 Complete
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain(80);
  pump(5);
  const ch2End = !els.chapterEnd.classList.contains('hidden');
  const ch2ok = ch2Start && chapterIdx === 1 && isAdam && !!World.eve &&
    World.eve.following === true && !player.sleeping &&
    (progress.naming || 0) === 4 && completed.length === 5 &&
    witnessed.length === 2 && ch2End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 2 Complete' &&
    els.endSub.textContent === 'God Made the First Man and Woman' &&
    els.endCanon.children.length === 3 &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch2 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 3';
  log('TEST ch2 end=' + ch2End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 3: Adam and Eve Disobeyed =================== */
  els.againBtn.click(); // continue into chapter 3
  const ch3Start = chapterIdx === 2;
  log('TEST ch3 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' eveNPC=' + World.eve + ' snake=' + !!World.snake + ' gate=' + !!World.gate);
  drain(); // intro cutscene

  // Q1 — the snake speaks to you (Eve)
  near(World.snake.x, World.snake.y + 40);
  tryInteract(); drain();
  log('TEST ch3 snake quest=' + questId() + ' completed=' + completed.length);

  // Q2 — take the fruit (letterbox cutscene, canon event #1)
  near(World.knowledgeTree.x, World.knowledgeTree.y - 40);
  tryInteract(); drain(60);
  log('TEST ch3 fruit quest=' + questId() + ' witnessed=' + witnessed.length);

  // Q3 — give some to Adam (canon event #2, Adam follows)
  near(World.adam.x, World.adam.y + 40);
  tryInteract(); drain();
  log('TEST ch3 adamAte quest=' + questId() + ' completed=' + completed.length +
      ' adamFollows=' + (World.adam && World.adam.following));

  // Q4 — Jehovah questions them
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();

  // Q5 — exile finale: moved outside the gate, angels + sword of fire
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain(90);
  pump(5);
  const ch3End = !els.chapterEnd.classList.contains('hidden');
  const ch3ok = ch3Start && chapterIdx === 2 && CHAPTER.playable === 'eve' &&
    World.eve === null && !!World.snake && !!World.gate &&
    !!World.gateGuard && completed.length === 5 && witnessed.length === 3 &&
    ch3End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 3 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch3 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 4';
  log('TEST ch3 end=' + ch3End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' guard=' + !!World.gateGuard +
      ' canon=' + els.endCanon.children.length + ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 4: From Anger to Murder =================== */
  els.againBtn.click(); // continue into chapter 4
  const ch4Start = chapterIdx === 3;
  log('TEST ch4 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' altar=' + !!World.altar + ' abel=' + !!World.abel + ' guard=' + !!World.gateGuard);
  drain(); // intro cutscene

  // Q1 — bring the offering to the altar (canon toast #1)
  near(World.altar.x, World.altar.y + 40);
  tryInteract(); drain();
  log('TEST ch4 offering quest=' + questId() + ' completed=' + completed.length);

  // Q2 — Jehovah warns Cain
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();

  // Q3 — lure Abel ("Come over to the field with me")
  near(World.abel.x, World.abel.y + 40);
  tryInteract(); drain();
  const abelFollows = !!(World.abel && World.abel.following);
  log('TEST ch4 lure quest=' + questId() + ' abelFollows=' + abelFollows);

  // Q4 — walk into the field with Abel → murder cutscene (zone auto-trigger)
  near(World.fieldSpot.x, World.fieldSpot.y);
  for (let i = 0; i < 400 && questId() === 'field'; i++) pump(2);
  drain(60); // fades to black, narration, canon event
  log('TEST ch4 field quest=' + questId() + ' abelGone=' + (World.abel === null) +
      ' witnessed=' + witnessed.length);

  // Q5 — judgment & banishment finale
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain(90);
  pump(5);
  const ch4End = !els.chapterEnd.classList.contains('hidden');
  const ch4ok = ch4Start && chapterIdx === 3 && CHAPTER.playable === 'cain' &&
    abelFollows && World.abel === null && !!World.altar && !!World.gateGuard &&
    completed.length === 5 && witnessed.length === 3 &&
    ch4End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 4 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch4 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 5';
  log('TEST ch4 end=' + ch4End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 5: Noah's Ark =================== */
  els.againBtn.click(); // continue into chapter 5
  const ch5Start = chapterIdx === 4;
  const arkHiddenAtStart = !World.ark;   // no ark is shown until the build quest finishes
  log('TEST ch5 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' arkHidden=' + arkHiddenAtStart + ' spots=' + World.buildSpots.length +
      ' villagers=' + World.villagers.length + ' family=' + World.family.length +
      ' animals=' + World.animals.length);
  drain(); // intro cutscene (canon event #1)

  // Q1 — Jehovah gives the command on the hill
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();
  log('TEST ch5 command quest=' + questId() + ' completed=' + completed.length);

  // Q2 — work on all four piles of timber (about 50 years of building)
  for (const b of World.buildSpots) { near(b.x, b.y + 40); tryInteract(); drain(); }
  const built = World.buildSpots.filter(b => b.done).length;
  const arkBuilt = !!World.ark;   // the ark appears only after the build quest
  log('TEST ch5 build quest=' + questId() + ' built=' + built + ' arkBuilt=' + arkBuilt);

  // Q3 — warn three people in the village (they do not listen)
  for (const v of World.villagers) { near(v.x, v.y + 40); tryInteract(); drain(); }
  const warned = World.villagers.filter(v => v.warned).length;
  log('TEST ch5 warn quest=' + questId() + ' warned=' + warned);

  // Q4 — find the animals (pairs go two by two + seven sheep) and lead them to the ark
  for (const a of World.animals) {
    if (a.state === 'idle') { near(a.x, a.y + 40); tryInteract(); }   // partners are sent along
  }
  drain();
  // let every animal walk up to the ark and go inside
  for (let i = 0; i < 3000 && World.animals.some(a => a.state !== 'inside'); i++) pump(2);
  const sent = World.animals.filter(a => a.state !== 'idle').length;
  const insideCount = World.animals.filter(a => a.state === 'inside').length;
  log('TEST ch5 animals quest=' + questId() + ' sent=' + sent + ' inside=' + insideCount +
      ' led=' + (progress.animals || 0));

  // Q5 — enter the ark → finale (everyone goes inside, then the rain)
  near(World.ark.x, World.ark.y + 64);
  tryInteract(); drain(140);
  pump(5);
  const ch5End = !els.chapterEnd.classList.contains('hidden');
  const ch5ok = ch5Start && chapterIdx === 4 && CHAPTER.playable === 'noah' &&
    arkHiddenAtStart && arkBuilt && built === 4 && warned === 3 &&
    sent === 13 && insideCount === 13 && (progress.animals || 0) === 13 &&
    completed.length === 5 && witnessed.length === 2 &&
    World.inside && World.raining &&
    ch5End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 5 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch5 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 6';
  log('TEST ch5 end=' + ch5End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' inside=' + World.inside + ' raining=' + World.raining +
      ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 6: Eight Survive Into a New World =================== */
  els.againBtn.click(); // continue into chapter 6
  const ch6Start = chapterIdx === 5;
  const rainingAtStart = World.raining === true;
  const floodedAtStart = World.flooded === true;
  log('TEST ch6 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' raining=' + rainingAtStart + ' flooded=' + floodedAtStart + ' ark=' + !!World.ark +
      ' altar=' + !!World.altar);
  drain(); // intro cutscene (canon event #1)

  // Q1 — look through the ark's window at the world covered by the Flood
  const interiorStart = !!World.interior;
  const win = World.interior ? World.interior.window : { x: 0, y: 0 };
  near(win.x, win.y + 40);
  tryInteract(); drain();
  log('TEST ch6 rain quest=' + questId() + ' completed=' + completed.length +
      ' interior=' + interiorStart);

  // Q2 — the rain stops and the ark settles on the mountains
  near(win.x, win.y + 40);
  tryInteract(); drain();
  const rainedOff = World.raining === false;
  log('TEST ch6 settle quest=' + questId() + ' raining=' + World.raining +
      ' witnessed=' + witnessed.length);

  // Q3 — "come out of the ark" → the water dries up (canon event #3)
  const door = World.interior ? World.interior.door : { x: 0, y: 0 };
  near(door.x, door.y - 40);
  tryInteract(); drain(90);
  const dryGround = World.flooded === false && World.raining === false;
  const exited = !World.interior;
  log('TEST ch6 exit quest=' + questId() + ' dry=' + dryGround +
      ' exited=' + exited + ' witnessed=' + witnessed.length);

  // Q4 — pile up the stones and build an altar
  near(World.stonePile.x, World.stonePile.y + 40);
  tryInteract(); drain();
  const altarBuilt = !!World.altar && !World.stonePile;
  log('TEST ch6 altar quest=' + questId() + ' completed=' + completed.length +
      ' altarBuilt=' + altarBuilt);

  // Q5 — take a sheep, then offer it at the altar → finale → chapter end
  near(World.sheep.x, World.sheep.y + 40);
  tryInteract(); drain();
  const sheepTaken = World.sheep && World.sheep.taken === true;
  near(World.altar.x, World.altar.y + 40);
  tryInteract(); drain(140);
  pump(5);
  const ch6End = !els.chapterEnd.classList.contains('hidden');
  const godHidden = World.god.x < -1000;
  const ch6ok = ch6Start && chapterIdx === 5 && CHAPTER.playable === 'noah' &&
    rainingAtStart && floodedAtStart && interiorStart && godHidden &&
    rainedOff && dryGround && exited && altarBuilt && sheepTaken &&
    World.rainbow === true &&
    completed.length === 5 && witnessed.length === 5 &&
    ch6End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 6 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch6 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 7';
  log('TEST ch6 end=' + ch6End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' rainbow=' + World.rainbow + ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 7: The Tower of Babel =================== */
  els.againBtn.click(); // continue into chapter 7
  const ch7Start = chapterIdx === 6;
  const notConfused = World.confused === false;
  const hasTower = !!World.tower && !!World.brickPile && World.scaffolds.length === 3;
  log('TEST ch7 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' tower=' + hasTower + ' confused=' + !notConfused);
  drain(); // intro cutscene

  // Q1 — talk to the foreman about the proud plan (canon event #1)
  near(World.foreman.x, World.foreman.y + 40);
  tryInteract(); drain();

  // Q2 — carry three bricks from the brick pile to the tower
  for (let i = 0; i < 3; i++) {
    near(World.brickPile.x, World.brickPile.y + 40);
    tryInteract(); drain(6);
    near(World.tower.x, World.tower.y + 120);
    tryInteract(); drain(6);
  }
  const bricksCarried = progress.bricks === 3;
  log('TEST ch7 bricks quest=' + questId() + ' carried=' + progress.bricks);

  // Q3 — work at the three scaffolds → the languages are confused
  for (const s of World.scaffolds) {
    near(s.x, s.y + 40);
    tryInteract(); drain();
  }
  const confusedNow = World.confused === true;
  const raisedAll = World.scaffolds.every(s => s.done) && World.tower.level === 3;
  log('TEST ch7 raise quest=' + questId() + ' confused=' + confusedNow + ' level=' + World.tower.level);

  // Q4 — Jehovah on the hill names the city Babel (canon event #3)
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();

  // Q5 — leave through the city gate → people scatter → finale → chapter end
  near(World.cityGate.x, World.cityGate.y + 40);
  tryInteract(); drain(160);
  pump(5);
  const ch7End = !els.chapterEnd.classList.contains('hidden');
  const ch7ok = ch7Start && chapterIdx === 6 && CHAPTER.playable === 'builder' &&
    notConfused && hasTower && bricksCarried && confusedNow && raisedAll &&
    completed.length === 5 && witnessed.length === 4 &&
    ch7End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 7 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch7 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 8';
  log('TEST ch7 end=' + ch7End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' confused=' + World.confused + ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 8: Abraham and Sarah Obeyed God =================== */
  els.againBtn.click(); // continue into chapter 8
  const ch8Start = chapterIdx === 7 && CHAPTER.playable === 'abraham';
  const urGod = World.god.x < 1000 && World.family.length === 3;
  log('TEST ch8 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' family=' + World.family.length + ' urGod=' + urGod);
  drain(); // intro cutscene

  // Q1 — Jehovah calls Abraham in the city of Ur
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();

  // Q2 — Sarah, Terah and Lot all pack their things
  for (const m of World.family) {
    near(m.x, m.y + 40);
    tryInteract(); drain();
  }
  const packedAll = World.family.every(m => m.packed === true);
  log('TEST ch8 pack quest=' + questId() + ' packed=' + World.family.filter(m => m.packed).length);

  // Q3 — walk the long road east into the land of Canaan (zone trigger)
  near(46 * 32 + 16, 20 * 32 + 16);
  pump(4);
  drain();
  const arrived = World.god.x > 1400 && World.family[0].x > 1400;
  log('TEST ch8 travel quest=' + questId() + ' arrived=' + arrived + ' witnessed=' + witnessed.length);

  // Q4 — Jehovah promises the land by the great tree
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();

  // Q5 — talk to Sarah → finale → chapter end
  near(World.family[0].x, World.family[0].y + 40);
  tryInteract(); drain(160);
  pump(5);
  const ch8End = !els.chapterEnd.classList.contains('hidden');
  const ch8ok = ch8Start && chapterIdx === 7 && urGod && packedAll && arrived &&
    completed.length === 5 && witnessed.length === 5 &&
    ch8End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 8 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch8 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 9';
  log('TEST ch8 end=' + ch8End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 9: A Son At Last! =================== */
  els.againBtn.click(); // continue into chapter 9
  const ch9Start = chapterIdx === 8 && CHAPTER.playable === 'abraham' &&
    World.family.length === 2 && World.god.x < -1000;
  log('TEST ch9 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' family=' + World.family.length + ' godHidden=' + (World.god.x < -1000));
  drain(); // intro cutscene

  // Q1 — Sarah's wish about Hagar
  near(World.family[0].x, World.family[0].y + 40);
  tryInteract(); drain();

  // Q2 — Hagar has a son: Ishmael is born, then the visitors appear years later
  near(World.family[1].x, World.family[1].y + 40);
  tryInteract(); drain();
  const ishmaelOut = !!World.ishmael && World.visitors.length === 3;
  log('TEST ch9 ishmael quest=' + questId() + ' ishmael=' + !!World.ishmael +
      ' visitors=' + World.visitors.length);

  // Q3 — meet the three visitors (angels) under the great tree
  near(World.visitors[0].x, World.visitors[0].y + 40);
  tryInteract(); drain();
  const visitorsGone = World.visitors.length === 0;
  log('TEST ch9 visitors quest=' + questId() + ' gone=' + visitorsGone +
      ' witnessed=' + witnessed.length);

  // Q4 — Isaac is born at the tent
  near(World.tent.x, World.tent.y + 40);
  tryInteract(); drain();
  const isaacOut = !!World.isaac;

  // Q5 — Sarah asks to send Hagar and Ishmael away → finale → chapter end
  near(World.family[0].x, World.family[0].y + 40);
  tryInteract(); drain(160);
  pump(5);
  const ch9End = !els.chapterEnd.classList.contains('hidden');
  const ch9ok = ch9Start && chapterIdx === 8 && ishmaelOut && visitorsGone && isaacOut &&
    completed.length === 5 && witnessed.length === 5 &&
    ch9End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 9 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch9 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 10';
  log('TEST ch9 end=' + ch9End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 10: Remember the Wife of Lot =================== */
  els.againBtn.click(); // continue into chapter 10
  const ch10Start = chapterIdx === 9 && CHAPTER.playable === 'lot' &&
    World.family.length === 3 && World.angels.length === 0;
  log('TEST ch10 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' family=' + World.family.length + ' animals=' + World.animals.length);
  drain(); // intro cutscene

  // Q1 — Abraham offers Lot the choice of direction
  near(World.abraham.x, World.abraham.y + 40);
  tryInteract(); drain();

  // Q2 — choose the pleasant land: family moves to Sodom, angels are sent
  near(World.choiceSpot.x, World.choiceSpot.y + 40);
  tryInteract(); drain();
  const movedAndSent = World.family[0].x > 1400 && World.angels.length === 2;
  log('TEST ch10 choose quest=' + questId() + ' inSodom=' + (World.family[0].x > 1400) +
      ' angels=' + World.angels.length);

  // Q3 — the angels' warning; the family is rushed out onto the road
  near(World.angels[0].x, World.angels[0].y + 40);
  tryInteract(); drain();
  const fled = World.family[0].y > 500 && World.family[0].y < 700;
  log('TEST ch10 warn quest=' + questId() + ' fled=' + fled + ' witnessed=' + witnessed.length);

  // Q4 — run to Zoar (zone trigger) → fire and sulfur on the cities
  near(World.zoarSpot.x, World.zoarSpot.y + 40);
  pump(4);
  drain();
  const burning = World.burning === true && World.angels.length === 0 &&
    World.family[0].y > 1100;
  log('TEST ch10 escape quest=' + questId() + ' burning=' + burning);

  // Q5 — Lot's wife looks back → pillar of salt → chapter end
  near(World.family[0].x, World.family[0].y + 40);
  tryInteract(); drain(160);
  pump(5);
  const ch10End = !els.chapterEnd.classList.contains('hidden');
  const ch10ok = ch10Start && chapterIdx === 9 && movedAndSent && fled && burning &&
    !!World.wifePillar && World.family.length === 2 &&
    completed.length === 5 && witnessed.length === 5 &&
    ch10End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 10 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch10 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 11';
  log('TEST ch10 end=' + ch10End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' pillar=' + !!World.wifePillar + ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 11: A Test of Faith =================== */
  els.againBtn.click(); // continue into chapter 11
  const ch11Start = chapterIdx === 10 && CHAPTER.playable === 'abraham' &&
    World.family.length === 2 && !!World.isaac && World.god.x > -1000;
  log('TEST ch11 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' servants=' + World.family.length + ' isaac=' + !!World.isaac);
  drain(); // intro cutscene

  // Q1 — Jehovah gives the hardest command
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();

  // Q2 — three days to Moriah (zone trigger); the servants wait behind
  near(World.journeyTarget.x, World.journeyTarget.y);
  pump(4);
  drain();
  const arrMoriah = World.family[0].x > 1300 && World.isaac.x > 1400;
  log('TEST ch11 travel quest=' + questId() + ' arrived=' + arrMoriah);

  // Q3 — talk to Isaac: Jehovah will provide the animal
  near(World.isaac.x, World.isaac.y + 40);
  tryInteract(); drain();

  // Q4 — build the altar → the angel stops Abraham → the ram appears
  near(World.stonePile.x, World.stonePile.y + 40);
  tryInteract(); drain();
  const altarAtTop = !!World.altar && !World.stonePile && !!World.ram;
  log('TEST ch11 altar quest=' + questId() + ' altar=' + altarAtTop +
      ' ram=' + !!World.ram + ' witnessed=' + witnessed.length);

  // Q5 — take the ram → finale → chapter end
  near(World.ram.x, World.ram.y + 40);
  tryInteract(); drain(200);
  pump(5);
  const ch11End = !els.chapterEnd.classList.contains('hidden');
  const ch11ok = ch11Start && chapterIdx === 10 && arrMoriah && altarAtTop &&
    completed.length === 5 && witnessed.length === 6 &&
    ch11End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 11 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch11 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 12';
  log('TEST ch11 end=' + ch11End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 12: Jacob Got the Inheritance =================== */
  els.againBtn.click(); // continue into chapter 12
  const ch12Start = chapterIdx === 11 && CHAPTER.playable === 'jacob' &&
    World.family.length === 3;
  log('TEST ch12 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' family=' + World.family.length + ' animals=' + World.animals.length);
  drain(); // intro cutscene

  // Q1 — Isaac explains the inheritance
  near(World.family[0].x, World.family[0].y + 40);
  tryInteract(); drain();

  // Q2 — Esau trades it for a bowl of red stew
  near(World.family[2].x, World.family[2].y + 40);
  tryInteract(); drain();

  // Q3 — Rebekah helps Jacob get the blessing
  near(World.family[1].x, World.family[1].y + 40);
  tryInteract(); drain();

  // Q4 — Esau finds out and flies into a rage
  near(World.family[2].x, World.family[2].y + 40);
  tryInteract(); drain();

  // Q5 — run for your life: through the east gate (zone trigger) → finale
  near(World.journeyTarget.x, World.journeyTarget.y);
  pump(4);
  drain(160);
  pump(5);
  const ch12End = !els.chapterEnd.classList.contains('hidden');
  const ch12ok = ch12Start && chapterIdx === 11 &&
    completed.length === 5 && witnessed.length === 5 &&
    ch12End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 12 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch12 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 13';
  log('TEST ch12 end=' + ch12End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 13: Jacob and Esau Make Peace =================== */
  els.againBtn.click(); // continue into chapter 13
  const ch13Start = chapterIdx === 12 && CHAPTER.playable === 'jacob' &&
    World.family.length === 3 && World.villagers.length === 0 && World.lit === true;
  log('TEST ch13 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' family=' + World.family.length + ' animals=' + World.animals.length);
  drain(); // intro cutscene

  // Q1 — Jehovah sends Jacob back home; the messenger arrives
  near(World.god.x, World.god.y + 40);
  tryInteract(); drain();
  const messengerOut = World.villagers.length === 1;

  // Q2 — the warning: Esau comes with 400 men
  near(World.villagers[0].x, World.villagers[0].y + 40);
  tryInteract(); drain();

  // Q3 — send the gift of animals; night falls and the angel appears
  near(World.family[2].x, World.family[2].y + 40);
  tryInteract(); drain();
  const angelOut = World.angels.length === 1 && World.lit === false;
  log('TEST ch13 gift quest=' + questId() + ' messenger=' + messengerOut +
      ' angel=' + angelOut + ' witnessed=' + witnessed.length);

  // Q4 — wrestle till dawn → Esau and his men appear
  near(World.angels[0].x, World.angels[0].y + 40);
  tryInteract(); drain();
  const esauMan = World.family.find(m => m.name === 'Esau');
  const dawnDone = World.angels.length === 0 && World.lit === true &&
    World.villagers.length === 6 && !!esauMan;
  log('TEST ch13 wrestle quest=' + questId() + ' dawn=' + dawnDone);

  // Q5 — bow seven times → the brothers make peace → chapter end
  near(esauMan.x, esauMan.y + 40);
  tryInteract(); drain(200);
  pump(5);
  const ch13End = !els.chapterEnd.classList.contains('hidden');
  const ch13ok = ch13Start && chapterIdx === 12 && messengerOut && angelOut && dawnDone &&
    completed.length === 5 && witnessed.length === 5 &&
    ch13End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 13 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch13 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 14';
  log('TEST ch13 end=' + ch13End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 14: A Slave Who Obeyed God =================== */
  els.againBtn.click(); // continue into chapter 14
  const jacobNPC = World.family.find(m => m.name === 'Jacob');
  const ch14Start = chapterIdx === 13 && CHAPTER.playable === 'joseph' &&
    World.family.length === 6 && !!jacobNPC;
  log('TEST ch14 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' family=' + World.family.length + ' animals=' + World.animals.length);
  drain(); // intro cutscene (jealousy + dreams — canon #1)
  const introCanon = witnessed.length === 1;

  // Q1 — Jacob sends Joseph to the brothers
  near(jacobNPC.x, jacobNPC.y + 40);
  tryInteract(); drain();

  // Q2 — the pit and the sale to the Midianite merchants
  near(World.family[1].x, World.family[1].y + 40);
  tryInteract(); drain();

  // Q3 — the caravan road east to Egypt (zone trigger)
  near(World.journeyTarget.x, World.journeyTarget.y);
  pump(4);
  drain();

  // Q4 — Potiphar makes Joseph his trusted steward
  const potipharNPC = World.family.find(m => m.name === 'Potiphar');
  near(potipharNPC.x, potipharNPC.y + 40);
  tryInteract(); drain();

  // Q5 — Joseph refuses Potiphar's wife → prison → chapter end
  const wifeNPC = World.family.find(m => m.name === 'Wife');
  near(wifeNPC.x, wifeNPC.y + 40);
  tryInteract(); drain(200);
  pump(5);
  const ch14End = !els.chapterEnd.classList.contains('hidden');
  const ch14ok = ch14Start && chapterIdx === 13 && introCanon &&
    completed.length === 5 && witnessed.length === 5 &&
    ch14End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 14 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch14 === 'done' &&
    els.againBtn.textContent === 'Continue to Chapter 15';
  log('TEST ch14 end=' + ch14End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' btn=' + els.againBtn.textContent);

  /* =================== CHAPTER 15: Jehovah Never Forgot Joseph =================== */
  els.againBtn.click(); // continue into chapter 15
  const ch15Start = chapterIdx === 14 && CHAPTER.playable === 'joseph' &&
    World.family.length === 1 && World.grainPiles.length === 3;
  log('TEST ch15 begin chapterIdx=' + chapterIdx + ' playable=' + CHAPTER.playable +
      ' family=' + World.family.length + ' piles=' + World.grainPiles.length);
  drain(); // intro cutscene

  // Q1 — Pharaoh's dream: seven years plenty, seven years famine
  near(World.family[0].x, World.family[0].y + 40);
  tryInteract(); drain();

  // Q2 — store grain in the three piles (brothers arrive afterwards)
  for (const g of World.grainPiles) {
    near(g.x, g.y + 40);
    tryInteract();
    drain(8);
  }
  const brothersIn = World.family.length === 3 && World.grainPiles.every(g => g.done);
  log('TEST ch15 store quest=' + questId() + ' brothers=' + brothersIn +
      ' witnessed=' + witnessed.length);

  // Q3 — the brothers bow (and return later with Benjamin)
  near(World.family[1].x, World.family[1].y + 40);
  tryInteract(); drain();
  const benNPC = World.family.find(m => m.name === 'Benjamin');
  const benIn = !!benNPC && World.family.length === 4;

  // Q4 — the silver cup test
  near(World.family[1].x, World.family[1].y + 40);
  tryInteract(); drain();

  // Q5 — the reveal to Benjamin → reunion → chapter end
  near(benNPC.x, benNPC.y + 40);
  tryInteract(); drain(200);
  pump(5);
  const ch15End = !els.chapterEnd.classList.contains('hidden');
  const ch15ok = ch15Start && chapterIdx === 14 && brothersIn && benIn &&
    completed.length === 5 && witnessed.length === 5 &&
    ch15End && gameState === 'end' &&
    els.endTitle.textContent === 'Chapter 15 Complete' &&
    els.endCanon.children.length === CHAPTER.canonEvents.length &&
    els.endQuests.children.length === 5 &&
    store.ebs_ch15 === 'done' &&
    els.againBtn.textContent === 'Back to Chapter Select';
  log('TEST ch15 end=' + ch15End + ' completed=' + completed.length +
      ' witnessed=' + witnessed.length + ' canon=' + els.endCanon.children.length +
      ' btn=' + els.againBtn.textContent);

  // ---------- Phase 10 character art direction ----------
  const spriteDims = PixelSprites.dimensions();
  const spriteRoles = ['angel','adam','eve','cain','noah','builder','abraham','lot','jacob','joseph','pharaoh','wife','son_green','son_gold','son_blue','villager_a','villager_b','villager_c','woman','traveler','elder','guard','potiphar','pharaoh_guard','child','generic'];
  const spriteSheetsOk = spriteDims.frameWidth === 24 && spriteDims.frameHeight === 40 &&
    spriteDims.columns === 6 && spriteDims.rows === 4 &&
    spriteRoles.every(role => PixelSprites.hasSheet(role));
  const spriteFacingOk = ['down','right','up','left'].every(f =>
    PixelSprites.draw(ctx, { x: 240, y: 240, facing: f, moving: true }, 'abraham', 1.25) === true);
  const spriteActionsOk = ['talk','carry'].every(action =>
    PixelSprites.draw(ctx, { x: 240, y: 240, facing: 'down', moving: false }, 'builder', 1.25, { action }) === true);
  const artNames = ['Noah’s Wife','Shem','Ham','Japheth','Villager','Sarah','Hagar','Terah','Lot','Isaac','Rebekah','Esau','Wife','Servant','Jacob','Judah','Potiphar','Pharaoh','Benjamin'];
  const artRolesOk = artNames.every(name => typeof PixelCharacters.roleFor(name, null) === 'string' && PixelSprites.hasSheet(PixelCharacters.roleFor(name, null)));
  const entityVariantsOk = PixelCharacters.roleForEntity({ name:'Villager', x: 100, y: 100 }) !== PixelCharacters.roleForEntity({ name:'Villager', x: 192, y: 192 });
  log('TEST characterArt dims=' + JSON.stringify(spriteDims) +
    ' roles=' + spriteSheetsOk + ' facing=' + spriteFacingOk + ' actions=' + spriteActionsOk +
    ' named=' + artRolesOk + ' variants=' + entityVariantsOk);

  // ---------- animal visuals: every kind used by the game draws a body ----------
  const animalSpecs = [
    { kind: 'sheep', name: 'sheep' }, { kind: 'sheep', name: 'ram' },
    { kind: 'lamb', name: 'sheep' }, { kind: 'rabbit', name: 'rabbit' },
    { kind: 'bird', name: 'bird' }, { kind: 'elephant', name: 'elephant' },
    { kind: 'camel', name: 'camel' }, { kind: 'donkey', name: 'donkey' },
  ];
  const animalsDrawOk = animalSpecs.every(spec => drawAnimal(
    Object.assign({ x: 400, y: 400, state: 'idle', target: null, wait: 0, speed: 0, phase: 0.5 }, spec)) === true);
  log('TEST animalKinds draw=' + animalsDrawOk);

  // ---------- Adam sprite sheet (assets/adam/walk.png): walk + idle ----------
  const sheetOk = ADAM_SHEET_OK === true && !!ADAM_SHEET &&
    ADAM_SHEET.src === 'assets/adam/walk.png' &&
    ADAM_SHEET.naturalWidth === 768 && ADAM_SHEET.complete === true;
  const idleFrames = ['down', 'right', 'up', 'left'].every(f => drawAdamSheet(200, 200, f, false) === true);
  const walkFrames = ['down', 'right', 'up', 'left'].every(f => drawAdamSheet(200, 200, f, true) === true);
  const facingTracked = typeof player.facing === 'string' &&
    ['down', 'right', 'up', 'left'].includes(player.facing);
  const adamSheetOk = sheetOk && idleFrames && walkFrames && facingTracked;
  log('TEST adamSheet loaded=' + sheetOk + ' idle=' + idleFrames +
      ' walk=' + walkFrames + ' facing=' + player.facing);

  // ---------- Eve sprite sheet (assets/eve/walk.png): walk + idle ----------
  const eveSheetOk = EVE_SHEET_OK === true && !!EVE_SHEET &&
    EVE_SHEET.src === 'assets/eve/walk.png' &&
    EVE_SHEET.naturalWidth === 768 && EVE_SHEET.complete === true;
  const eveIdle = ['down', 'right', 'up', 'left'].every(f => drawEveSheet(300, 300, f, false) === true);
  const eveWalk = ['down', 'right', 'up', 'left'].every(f => drawEveSheet(300, 300, f, true) === true);
  const eveSheetAllOk = eveSheetOk && eveIdle && eveWalk;
  log('TEST eveSheet loaded=' + eveSheetOk + ' idle=' + eveIdle + ' walk=' + eveWalk);

  // ---------- audio: toggle buttons flip state + persist ----------
  const musicLabel0 = document.getElementById('musicBtn').textContent;
  document.getElementById('musicBtn').click();
  const musicOff = document.getElementById('musicBtn').textContent === '♪ Music Off' &&
    store.ebs_music === '0' && musicOn === false;
  document.getElementById('musicBtn').click();
  const musicBack = document.getElementById('musicBtn').textContent === '♪ Music On' &&
    store.ebs_music === '1' && musicOn === true;
  document.getElementById('sfxBtn').click();
  const sfxOff = document.getElementById('sfxBtn').textContent === '🔊 Sound Off' &&
    store.ebs_sfx === '0' && soundOn === false;
  document.getElementById('sfxBtn').click();
  const sfxBack = document.getElementById('sfxBtn').textContent === '🔊 Sound On' &&
    store.ebs_sfx === '1' && soundOn === true;
  initAudio(); // must be safe when the harness has no AudioContext
  const audioOk = musicLabel0 === '♪ Music On' && musicOff && musicBack && sfxOff && sfxBack;
  log('TEST audio toggles=' + audioOk);

  log('TEST runtimeErrors=' + errorCount);
  const pass = spriteSheetsOk && spriteFacingOk && spriteActionsOk && artRolesOk && entityVariantsOk && ch1ok && ch2ok && ch3ok && ch4ok && ch5ok && ch6ok && ch7ok && ch8ok && ch9ok && ch10ok && ch11ok && ch12ok && ch13ok && ch14ok && ch15ok && animalsDrawOk && adamSheetOk && eveSheetAllOk && cardGuard && audioOk && errorCount === 0;
  log(pass ? 'ALL_TESTS_PASSED' : 'TESTS_FAILED');
  process.exit(pass ? 0 : 1);
} catch (e) {
  console.error('TEST_ERROR: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
}

