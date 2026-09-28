'use strict';
/* ============================================================
   Experience: Bible Stories — Chapter 1: God Made Heaven and Earth
   Game loop, player, quest state machine, dialog & cutscene engine.
   ============================================================ */

// ---------- DOM ----------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);
const ui = {
  questTitle: $('questTitle'), questObjective: $('questObjective'),
  questProgress: $('questProgress'), questDone: $('questDone'), questCount: $('questCount'),
  prompt: $('prompt'), toasts: $('toasts'),
  dialogBox: $('dialogBox'), dlgSpeaker: $('dlgSpeaker'), dlgText: $('dlgText'),
  cinema: $('cinema'), cinemaSpeaker: $('cinemaSpeaker'), cinemaText: $('cinemaText'),
  flash: $('flash'),
  startScreen: $('startScreen'), chapterList: $('chapterList'),
  chapterEnd: $('chapterEnd'), endQuests: $('endQuests'), endCanon: $('endCanon'), againBtn: $('againBtn'),
  endTitle: $('endTitle'), endSub: $('endSub')
};

// ---------- error reporting: visible on screen, rate-limited in console ----------
// A thrown error must NEVER silently freeze the game loop again.
let errorCount = 0;
let errBox = null;
function reportError(err) {
  errorCount++;
  const msg = String((err && err.message) || err);
  if (errorCount <= 3) console.error('Experience: Bible Stories error #' + errorCount + ':', err);
  if (!errBox) {
    try {
      errBox = document.createElement('div');
      errBox.style.cssText = 'position:absolute;left:8px;bottom:8px;max-width:60vw;background:#5c0000;' +
        'color:#fff;font:12px monospace;padding:6px 10px;border-radius:6px;z-index:99;white-space:pre-wrap;';
      const g = document.getElementById('game');
      if (g && g.appendChild) g.appendChild(errBox);
    } catch (e) { errBox = null; }
  }
  if (errBox) errBox.textContent = 'Game error: ' + msg + '  (details in console)';
}

// ---------- view / camera ----------
let vw = 0, vh = 0, dpr = 1;
const cam = { x: 0, y: 0 };
function resize() {
  // Phase 1: render the game at a fixed low logical resolution, then
  // scale that surface to the browser viewport with nearest-neighbour.
  const size = PixelRenderer.configureCanvas(canvas, window);
  vw = size.width;
  vh = size.height;
  dpr = size.dpr;
  PixelRenderer.prepareContext(ctx);
}
window.addEventListener('resize', resize);

// ---------- game state ----------
let chapterIdx = 0;
let CHAPTER = null, QUESTS = null, DLG = null;
let gameState = 'title';            // title | play | seq | end
let time = 0;
let questIndex = 0;
let progress = {};                  // per-quest counters (e.g. { plants: 2 })
const completed = [];
const witnessed = [];
const player = { x: 0, y: 0, speed: 175, moving: false, sleeping: false, stepT: 0, facing: 'down' };
const keys = {};

/* ---------- Adam's sprite sheet: assets/adam/walk.png ----------
   768x768 = 4x4 grid of 192px frames. Rows: 0=down, 1=right, 2=up, 3=left;
   column 0 is the idle pose, columns 0..3 cycle as the walk animation.
   If the sheet can't load (tests, missing file) the vector drawing is used. */
const ADAM_SHEET = (typeof Image !== 'undefined') ? new Image() : null;
let ADAM_SHEET_OK = false;
if (ADAM_SHEET) {
  ADAM_SHEET.onload = () => { ADAM_SHEET_OK = !!(ADAM_SHEET.naturalWidth || ADAM_SHEET.width); };
  ADAM_SHEET.onerror = () => { ADAM_SHEET_OK = false; };
  ADAM_SHEET.src = 'assets/adam/walk.png';
}
const EVE_SHEET = (typeof Image !== 'undefined') ? new Image() : null;
let EVE_SHEET_OK = false;
if (EVE_SHEET) {
  EVE_SHEET.onload = () => { EVE_SHEET_OK = !!(EVE_SHEET.naturalWidth || EVE_SHEET.width); };
  EVE_SHEET.onerror = () => { EVE_SHEET_OK = false; };
  EVE_SHEET.src = 'assets/eve/walk.png';
}
const SHEET_ROW = { down: 0, right: 1, up: 2, left: 3 };
/* draws one frame of a 4x4 walk sheet; returns false when it isn't available */
function drawWalkSheet(img, ok, px, groundY, facing, moving) {
  if (!img || !ok || !img.complete) return false;
  const row = (facing in SHEET_ROW) ? SHEET_ROW[facing] : 0;
  const col = moving ? Math.floor(time * 8) % 4 : 0;
  const S = 64;                 // 192px frame drawn at 64px (figure ≈44px tall)
  const k = S / 192;
  const figCx = 93.5 * k;       // horizontal centre of the figure in a frame
  const feetY = 169 * k;        // the figure's feet inside a frame
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;   // keep the pixel art crisp
  ctx.drawImage(img, col * 192, row * 192, 192, 192,
                px - figCx, groundY - feetY, S, S);
  ctx.imageSmoothingEnabled = smooth;
  return true;
}
function drawAdamSheet(px, groundY, facing, moving) {
  return drawWalkSheet(ADAM_SHEET, ADAM_SHEET_OK, px, groundY, facing, moving);
}
function drawEveSheet(px, groundY, facing, moving) {
  return drawWalkSheet(EVE_SHEET, EVE_SHEET_OK, px, groundY, facing, moving);
}

// ---------- toasts ----------
function toast(text, kind) {
  kind = kind || 'quest';
  const d = document.createElement('div');
  d.className = 'toast ' + kind;
  d.textContent = text;
  ui.toasts.appendChild(d);
  setTimeout(() => d.remove(), kind === 'canon' ? 5200 : 4000);
}

// ---------- HUD / quest journal ----------
function currentQuest() { return questIndex < QUESTS.length ? QUESTS[questIndex] : null; }
function questId() { const q = currentQuest(); return q ? q.id : null; }

function updateHUD() {
  const q = currentQuest();
  ui.questCount.textContent = completed.length + '/' + QUESTS.length;
  if (q) {
    ui.questTitle.textContent = q.title;
    ui.questObjective.textContent = q.objective;
    let p = '';
    if (q.need) {
      const n = progress[q.id] || 0;
      p = n + ' / ' + q.need + (q.unit ? ' ' + q.unit : '');
    }
    ui.questProgress.textContent = p;
  } else {
    ui.questTitle.textContent = 'Chapter Complete!';
    ui.questObjective.textContent = 'Jehovah God is our Creator.';
    ui.questProgress.textContent = '';
  }
  ui.questDone.innerHTML = '';
  if (!completed.length) {
    const li = document.createElement('li');
    li.className = 'none';
    li.textContent = 'Nothing yet…';
    ui.questDone.appendChild(li);
  } else {
    for (const c of completed) {
      const li = document.createElement('li');
      li.textContent = c.title;
      ui.questDone.appendChild(li);
    }
  }
}

function completeQuest() {
  const q = currentQuest();
  if (!q) return;
  completed.push(q);
  questIndex++;
  toast('Quest Complete: ' + q.title, 'quest');
  sfxComplete();
  updateHUD();
}

// ---------- sequence engine (dialog box + letterbox cutscenes) ----------
let seq = null;
function startSeq(lines, mode, onDone) {
  seq = { lines: lines, i: -1, mode: mode, onDone: onDone, full: '', shown: 0, _lastN: -1 };
  gameState = 'seq';
  ui.prompt.classList.add('hidden');
  if (mode === 'cinema') ui.cinema.classList.remove('hidden');
  else ui.dialogBox.classList.remove('hidden');
  advanceSeq();
}
function seqEls() {
  return seq.mode === 'cinema'
    ? { sp: ui.cinemaSpeaker, tx: ui.cinemaText }
    : { sp: ui.dlgSpeaker, tx: ui.dlgText };
}
function seqShowLine() {
  const L = seq.lines[seq.i];
  const els = seqEls();
  els.sp.textContent = L.s || '';
  els.sp.style.visibility = L.s ? 'visible' : 'hidden';
  seq.full = L.t || '';
  seq.shown = 0;
  seq._lastN = -1;
  els.tx.textContent = '';
}
function advanceSeq() {
  if (!seq) return;
  seq.i++;
  while (seq.i < seq.lines.length && seq.lines[seq.i].fx) {
    doFx(seq.lines[seq.i]);
    seq.i++;
  }
  if (seq.i >= seq.lines.length) { endSeq(); return; }
  seqShowLine();
  sfxBlip();
}
function doFx(step) {
  if (step.fx === 'flash') triggerFlash();
  if (step.fx === 'spawnAdam') { World.addAdam(); triggerFlash(); sfxCanon(); }
  if (step.fx === 'spawnEve') { World.addEve(); triggerFlash(); sfxCanon(); }
  if (step.fx === 'sleepPlayer') player.sleeping = true;
  if (step.fx === 'wakePlayer') player.sleeping = false;
  if (step.fx === 'exile') {
    // Jehovah puts Adam and Eve outside the eastern gate
    const out = tileCenter(62, 22);
    player.x = out.x; player.y = out.y;
    if (World.adam) {
      const ap = tileCenter(62, 24);
      World.adam.x = ap.x; World.adam.y = ap.y;
      World.adam.following = false;
    }
    triggerFlash();
  }
  if (step.fx === 'gateGuard') {
    // angels and a sword of fire appear at the entrance
    World.gateGuard = { x: World.gate.x, y: World.gate.y };
    sfxCanon();
    triggerFlash();
  }
  if (step.fx === 'fadeBlack') { ui.flash.style.background = '#000'; triggerFlash(); sfxDark(); }
  if (step.fx === 'abelGone') { World.abel = null; }
  if (step.fx === 'sfxEat') { sfxEat(); }
  if (step.fx === 'banish') {
    // Jehovah sends Cain far away from his family
    const far = tileCenter(57, 36);
    player.x = far.x; player.y = far.y;
    triggerFlash();
    sfxBanish();
  }
  if (step.fx === 'canon') {
    witnessed.push(step.text);
    toast(step.text, 'canon');
    sfxCanon();
    triggerFlash();
  }
  if (step.fx === 'enterArk') {
    // Noah's family and the animals go inside — the door closes behind them
    World.inside = true;
    triggerFlash();
    sfxDark();
  }
  if (step.fx === 'rain') {
    // forty days and forty nights of rain
    World.raining = true;
    sfxDark();
    triggerFlash();
  }
  if (step.fx === 'recede') {
    // the waters dry up — dry land appears all around (Chapter 6)
    World.recedeFlood();
    if (World.interior) {
      // the door opens and everyone steps out of the ark
      World.exitInterior();
      player.x = World.ark.x;
      player.y = World.ark.y + 76;
    }
    sfxDark();
    triggerFlash();
  }
  if (step.fx === 'rainbow') {
    // Jehovah's rainbow over the new world (Chapter 6)
    World.rainbow = true;
    sfxCanon();
    triggerFlash();
  }
  if (step.fx === 'babel') {
    // Jehovah confuses the language of the builders (Chapter 7)
    World.confused = true;
    sfxDark();
    triggerFlash();
  }
  if (step.fx === 'scatter') {
    // everyone goes in every direction over the earth (Chapter 7)
    sfxDark();
    triggerFlash();
  }
  if (step.fx === 'fire') {
    // fire and sulfur on Sodom and Gomorrah (Chapter 10)
    World.burning = true;
    sfxDark();
    triggerFlash();
  }
  if (step.fx === 'ram') {
    // a ram appears, caught by its horns in the bushes (Chapter 11)
    const rp = tileCenter(56, 11);
    World.ram = { kind: 'sheep', name: 'ram', x: rp.x, y: rp.y, state: 'idle',
                  target: null, wait: 0, speed: 0, phase: 0.7 };
    sfxPlant();
  }
  if (step.fx === 'night') {
    // darkness falls over the camp (Chapter 13)
    World.lit = false;
    sfxDark();
  }
  if (step.fx === 'dawn') {
    // the sun rises after the wrestle (Chapter 13)
    World.lit = true;
    triggerFlash();
    sfxDark();
  }
}
function triggerFlash() {
  ui.flash.classList.remove('go');
  void ui.flash.offsetWidth; // restart the CSS animation
  ui.flash.classList.add('go');
}
function endSeq() {
  const done = seq.onDone;
  seq = null;
  ui.cinema.classList.add('hidden');
  ui.dialogBox.classList.add('hidden');
  ui.flash.style.background = '#fff'; // reset any fadeBlack
  gameState = 'play';
  if (done) done();
}
function tickSeq(dt) {
  if (!seq || seq.shown >= seq.full.length) return;
  seq.shown = Math.min(seq.full.length, seq.shown + dt * 55);
  const n = Math.floor(seq.shown);
  if (n !== seq._lastN) {
    seq._lastN = n;
    seqEls().tx.textContent = seq.full.slice(0, n);
  }
}
function onAction() {
  try {
    if (gameState === 'seq' && seq) {
      if (seq.shown < seq.full.length) {
        seq.shown = seq.full.length;
        seqEls().tx.textContent = seq.full;
      } else {
        advanceSeq();
      }
      sfxBlip();
      return;
    }
    if (gameState === 'play') tryInteract();
  } catch (err) { reportError(err); }
}
function say(lines) { startSeq(lines, 'dialog', null); }
function cinemate(lines, onDone) { startSeq(lines, 'cinema', onDone); }

// ---------- quest flow helpers ----------
function setupChapter(idx) {
  chapterIdx = idx;
  CHAPTER = CHAPTERS[idx];
  QUESTS = CHAPTER.quests;
  DLG = CHAPTER.dialogs;
  setMusicChapter(idx); // each chapter has its own music mood
  questIndex = 0;
  completed.length = 0;
  witnessed.length = 0;
  progress = {};
  player.sleeping = false;
  World.buildChapter(idx);
  player.x = World.playerStart.x;
  player.y = World.playerStart.y;
  gameState = 'title';
  updateHUD();
  updateCamera();
}
function startChapter(idx) {
  setupChapter(idx);
  ui.chapterEnd.classList.add('hidden');
  ui.againBtn.blur();
  cinemate(CHAPTER.cutscenes.intro, () => {
    gameState = 'play';
    updateHUD();
  });
}
// ---------- chapter selector (start screen) ----------
function chapterCompleted(idx) {
  try { return localStorage.getItem('ebs_ch' + (idx + 1)) === 'done'; } catch (e) { return false; }
}
function saveChapterCompleted(idx) {
  try { localStorage.setItem('ebs_ch' + (idx + 1), 'done'); } catch (e) { /* private mode etc. */ }
}
function renderChapterSelect() {
  ui.chapterList.innerHTML = '';
  CHAPTERS.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className = 'chapterCard';
    const done = chapterCompleted(i);
    btn.innerHTML =
      '<span class="chNum">Chapter ' + ch.id + '</span>' +
      '<span class="chTitle">' + ch.title +
      '<span class="chTag">' + ch.tagline + '</span></span>' +
      '<span class="chStatus' + (done ? ' done' : '') + '">' +
      (done ? '✓ Completed' : '▶ Play') + '</span>';
    btn.addEventListener('click', () => { btn.blur(); sfxClick(); startSelectedChapter(i); });
    ui.chapterList.appendChild(btn);
  });
}
function startSelectedChapter(idx) {
  if (gameState !== 'title') return; // ignore double-activation
  initAudio(); // user gesture — safe to start audio & music here
  ui.startScreen.classList.add('hidden');
  startChapter(idx);
}
function finishChapter() {
  gameState = 'end';
  const n = chapterIdx + 1;
  ui.endTitle.textContent = 'Chapter ' + n + ' Complete';
  ui.endSub.textContent = CHAPTER.title;
  ui.endQuests.innerHTML = '';
  for (const q of QUESTS) {
    const li = document.createElement('li');
    li.textContent = q.title;
    ui.endQuests.appendChild(li);
  }
  ui.endCanon.innerHTML = '';
  for (const c of CHAPTER.canonEvents) {
    const li = document.createElement('li');
    li.textContent = c;
    ui.endCanon.appendChild(li);
  }
  saveChapterCompleted(chapterIdx);
  ui.againBtn.textContent = CHAPTERS[n] ? 'Continue to Chapter ' + (n + 1) : 'Back to Chapter Select';
  ui.chapterEnd.classList.remove('hidden');
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function meadowPoint() {
  for (let tries = 0; tries < 12; tries++) {
    const tx = 23 + Math.floor(Math.random() * 14);
    const ty = 15 + Math.floor(Math.random() * 9);
    const p = tileCenter(tx, ty);
    if (!World.solidAt(p.x, p.y)) return p;
  }
  return tileCenter(30, 20);
}

// ---------- interactions ----------
function getInteractables() {
  const list = [
    { kind: 'god', x: World.god.x, y: World.god.y, label: 'Jehovah God' }
  ];
  if (chapterIdx === 4) {
    if (World.ark) list.push({ kind: 'ark', x: World.ark.x, y: World.ark.y, r: 74, label: 'The Ark' });
    for (const b of World.buildSpots) if (!b.done) list.push({ kind: 'build', spot: b, x: b.x, y: b.y, label: 'Timber' });
    for (const v of World.villagers) list.push({ kind: 'person', person: v, x: v.x, y: v.y, label: 'Villager' });
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, label: m.name });
    for (const a of World.animals) {
      if (a.state === 'idle') list.push({ kind: 'animal', animal: a, x: a.x, y: a.y, label: cap(a.name) });
    }
    return list;
  }
  if (chapterIdx === 5) {
    if (World.interior) {
      const I = World.interior;
      list.push({ kind: 'window', x: I.window.x, y: I.window.y, r: 74, label: 'The Window' });
      list.push({ kind: 'door', x: I.door.x, y: I.door.y, r: 74, label: 'The Door' });
      for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 44, label: m.name });
      return list;
    }
    if (World.stonePile) list.push({ kind: 'stones', x: World.stonePile.x, y: World.stonePile.y, r: 56, label: 'Stones' });
    if (World.altar) list.push({ kind: 'altar', x: World.altar.x, y: World.altar.y, r: 46, label: 'The Altar' });
    if (World.sheep && !World.sheep.taken) list.push({ kind: 'sheep', x: World.sheep.x, y: World.sheep.y, r: 52, label: 'Sheep' });
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 44, label: m.name });
    for (const a of World.animals) {
      if (a !== World.sheep && a.state === 'idle') list.push({ kind: 'animal', animal: a, x: a.x, y: a.y, label: cap(a.name) });
    }
    return list;
  }
  if (chapterIdx === 14) {
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 48, label: m.name });
    if (questId() === 'store') for (const g of World.grainPiles) if (!g.done) list.push({ kind: 'grain', g, x: g.x, y: g.y, r: 54, label: 'Grain' });
    return list;
  }
  if (chapterIdx === 13) {
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 48, label: m.name });
    return list;
  }
  if (chapterIdx === 12) {
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 48, label: m.name });
    for (const v of World.villagers) list.push({ kind: 'person', person: v, x: v.x, y: v.y, r: 48, label: v.name });
    for (const a of World.angels) list.push({ kind: 'person', person: a, x: a.x, y: a.y, r: 48, label: 'Angel' });
    return list;
  }
  if (chapterIdx === 11) {
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 48, label: m.name });
    return list;
  }
  if (chapterIdx === 10) {
    if (World.isaac) list.push({ kind: 'person', person: World.isaac, x: World.isaac.x, y: World.isaac.y, r: 48, label: 'Isaac' });
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 48, label: m.name });
    if (World.stonePile && questId() === 'altar') list.push({ kind: 'stones', x: World.stonePile.x, y: World.stonePile.y, r: 56, label: 'Stones' });
    if (World.ram && questId() === 'ram') list.push({ kind: 'ram', x: World.ram.x, y: World.ram.y, r: 54, label: 'Ram' });
    return list;
  }
  if (chapterIdx === 9) {
    if (World.abraham) list.push({ kind: 'person', person: World.abraham, x: World.abraham.x, y: World.abraham.y, r: 48, label: 'Abraham' });
    if (World.choiceSpot && questId() === 'choose') list.push({ kind: 'land', x: World.choiceSpot.x, y: World.choiceSpot.y, r: 60, label: 'Pleasant Land' });
    for (const a of World.angels) list.push({ kind: 'person', person: a, x: a.x, y: a.y, r: 48, label: 'Angel' });
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 48, label: m.name });
    return list;
  }
  if (chapterIdx === 8) {
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 48, label: m.name });
    for (const v of World.visitors) list.push({ kind: 'person', person: v, x: v.x, y: v.y, r: 48, label: 'Visitor' });
    if (World.tent && questId() === 'isaac') list.push({ kind: 'tent', x: World.tent.x, y: World.tent.y, r: 60, label: 'The Tent' });
    return list;
  }
  if (chapterIdx === 7) {
    for (const m of World.family) list.push({ kind: 'person', person: m, x: m.x, y: m.y, r: 48, label: m.name });
    return list;
  }
  if (chapterIdx === 6) {
    const qid = questId();
    if (World.foreman) list.push({ kind: 'foreman', x: World.foreman.x, y: World.foreman.y, r: 54, label: 'Foreman' });
    if (World.tower && qid === 'bricks') list.push({ kind: 'tower', x: World.tower.x, y: World.tower.y + 80, r: 56, label: 'The Tower' });
    if (World.brickPile && qid === 'bricks' && !World.carrying) list.push({ kind: 'brick', x: World.brickPile.x, y: World.brickPile.y, r: 54, label: 'Brick Pile' });
    if (qid === 'raise') for (const s of World.scaffolds) if (!s.done) list.push({ kind: 'scaffold', s, x: s.x, y: s.y, r: 54, label: 'Scaffold' });
    for (const w of World.workers) list.push({ kind: 'worker', w, x: w.x, y: w.y, r: 48, label: 'Builder' });
    if (World.cityGate) list.push({ kind: 'gate', x: World.cityGate.x, y: World.cityGate.y, r: 64, label: 'City Gate' });
    return list;
  }
  if (chapterIdx === 1) {
    if (World.eve) list.push({ kind: 'eve', x: World.eve.x, y: World.eve.y, label: 'Eve' });
    for (const a of World.animals) {
      if (!a.named) list.push({ kind: 'animal', animal: a, x: a.x, y: a.y, label: cap(a.name) });
    }
    return list;
  }
  if (chapterIdx === 2) {
    if (World.snake) list.push({ kind: 'snake', x: World.snake.x, y: World.snake.y, r: 42, label: 'Snake' });
    if (World.knowledgeTree) list.push({ kind: 'tree', x: World.knowledgeTree.x, y: World.knowledgeTree.y, label: 'Tree of the Knowledge' });
    if (World.adam) list.push({ kind: 'adam', x: World.adam.x, y: World.adam.y, label: 'Adam' });
    return list;
  }
  if (chapterIdx === 3) {
    if (World.altar) list.push({ kind: 'altar', x: World.altar.x, y: World.altar.y, r: 46, label: 'The Altar' });
    if (World.abel) list.push({ kind: 'abel', x: World.abel.x, y: World.abel.y, label: 'Abel' });
    return list;
  }
  list.push({ kind: 'beacon', x: World.beacon.x, y: World.beacon.y, label: 'Beacon of Light' });
  for (const s of World.soils) list.push({ kind: 'soil', soil: s, x: s.x, y: s.y, label: 'Soft soil' });
  for (const a of World.animals) {
    if (a.state === 'idle') list.push({ kind: 'animal', animal: a, x: a.x, y: a.y, label: cap(a.name) });
  }
  return list;
}
function nearestInteractable() {
  let best = null, bd = Infinity;
  for (const it of getInteractables()) {
    const d = Math.hypot(it.x - player.x, it.y - player.y);
    const r = it.r || 54;
    if (d < r && d < bd) { bd = d; best = it; }
  }
  return best;
}
function promptText(it) {
  const id = questId();
  if (it.kind === 'god') return 'Talk to Jehovah God';
  if (it.kind === 'adam') return 'Talk to Adam';
  if (it.kind === 'eve') return 'Talk to Eve';
  if (it.kind === 'snake') return 'Listen to the snake';
  if (it.kind === 'tree') return id === 'fruit' ? 'Take the fruit' : 'Look at the fruit';
  if (it.kind === 'altar') return (id === 'offering' || id === 'altar') ? 'Make your offering' : 'Look at the altar';
  if (it.kind === 'abel') return 'Talk to Abel';
  if (it.kind === 'ark') {
    if (id === 'enter') return 'Enter the ark';
    if (id === 'rain') return 'Look out at the Flood';
    if (id === 'settle') return 'Look out of the ark once more';
    return 'Look at the ark';
  }
  if (it.kind === 'window') {
    if (id === 'rain') return 'Look through the window';
    if (id === 'settle') return 'Look out of the window once more';
    return 'Look at the window';
  }
  if (it.kind === 'door') return id === 'exit' ? 'Open the door of the ark' : 'Look at the door';
  if (it.kind === 'stones') return id === 'altar' ? 'Build an altar from the stones' : 'A pile of stones';
  if (it.kind === 'sheep') return id === 'offering' ? 'Take this sheep' : 'Greet the sheep';
  if (it.kind === 'build') return (id === 'build') ? 'Work on the ark' : 'Examine the timber';
  if (it.kind === 'foreman') return 'Talk to the Foreman';
  if (it.kind === 'worker') return 'Talk to the Builder';
  if (it.kind === 'brick') return 'Take a brick';
  if (it.kind === 'tower') return id === 'bricks' ? 'Carry the brick to the tower' : 'Look at the tower';
  if (it.kind === 'scaffold') return 'Work on the tower';
  if (it.kind === 'gate') return id === 'scatter' ? 'Leave the city' : 'Look at the city gate';
  if (it.kind === 'person') return 'Talk to ' + it.label;
  if (it.kind === 'tent') return id === 'isaac' ? 'Go into the tent' : 'Look at the tent';
  if (it.kind === 'land') return id === 'choose' ? 'Choose this land' : 'Look at the land';
  if (it.kind === 'ram') return 'Take the ram Jehovah provided';
  if (it.kind === 'grain') return 'Store this grain';
  if (it.kind === 'beacon') return World.lit ? 'Admire the sun’s light' : 'Touch the Beacon of Light';
  if (it.kind === 'soil') return (id === 'plants' && !it.soil.planted) ? 'Plant a seed' : 'Examine the soil';
  if (it.kind === 'animal') {
    if (chapterIdx === 4) {
      return id === 'animals' ? 'Lead the ' + it.animal.name + ' to the ark' : 'Greet the ' + it.animal.name;
    }
    if (chapterIdx === 1) {
      return id === 'naming' ? 'Name the ' + it.animal.name : 'Greet the ' + it.animal.name;
    }
    return (id === 'animals')
      ? 'Lead the ' + it.animal.name + ' to the meadow'
      : 'Greet the ' + it.animal.name;
  }
  return 'Interact';
}
function tryInteract() {
  const it = nearestInteractable();
  if (!it) return;
  sfxBlip();
  if (chapterIdx === 14) interactChapter15(it);
  else if (chapterIdx === 13) interactChapter14(it);
  else if (chapterIdx === 12) interactChapter13(it);
  else if (chapterIdx === 11) interactChapter12(it);
  else if (chapterIdx === 10) interactChapter11(it);
  else if (chapterIdx === 9) interactChapter10(it);
  else if (chapterIdx === 8) interactChapter9(it);
  else if (chapterIdx === 7) interactChapter8(it);
  else if (chapterIdx === 6) interactChapter7(it);
  else if (chapterIdx === 5) interactChapter6(it);
  else if (chapterIdx === 4) interactChapter5(it);
  else if (chapterIdx === 3) interactChapter4(it);
  else if (chapterIdx === 2) interactChapter3(it);
  else if (chapterIdx === 1) interactChapter2(it);
  else interactChapter1(it);
}

/* ---------------- Chapter 3 interactions ---------------- */
function interactChapter3(it) {
  const id = questId();

  /* ---- Jehovah God ---- */
  if (it.kind === 'god') {
    if (id === 'question') {
      completeQuest();
      say(DLG.questionTalk);
    } else if (id === 'exile') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    } else {
      say(DLG.ruleReminder);
    }
    return;
  }

  /* ---- The snake (the lie) ---- */
  if (it.kind === 'snake') {
    if (id === 'snake') {
      sfxHiss();
      completeQuest();
      say(DLG.snakeTalk);
    } else {
      say([{ t: 'The snake watches you quietly from the branches of the tree.' }]);
    }
    return;
  }

  /* ---- The tree of the knowledge ---- */
  if (it.kind === 'tree') {
    if (id === 'fruit') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.fruit);
    } else if (id === 'snake') {
      say([{ t: 'The fruit on this tree is beautiful… but Jehovah said you must not eat from it.' }]);
    } else {
      say([{ t: 'You look away from the fruit of the tree of the knowledge.' }]);
    }
    return;
  }

  /* ---- Adam (NPC in Chapter 3) ---- */
  if (it.kind === 'adam') {
    if (id === 'adam') {
      World.adam.following = true; // you walk to Jehovah together
      completeQuest();
      sfxCanon();
      toast('Canon Event: ' + CHAPTER.canonEvents[1], 'canon');
      say(DLG.adamEat);
    } else if (id === 'question' || id === 'exile') {
      say([{ s: 'Adam', t: 'We must wait for Jehovah to speak to us.' }]);
    } else {
      say([{ s: 'Adam', t: 'The garden is quiet today…' }]);
    }
    return;
  }
}

/* ---------------- Chapter 4 interactions ---------------- */
function interactChapter4(it) {
  const id = questId();

  /* ---- Jehovah God ---- */
  if (it.kind === 'god') {
    if (id === 'warning') {
      completeQuest();
      say(DLG.warningTalk);
    } else if (id === 'judgment') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    } else if (id === 'offering') {
      say([{ s: 'Jehovah God', t: 'Bring your offering to the altar, Cain.' }]);
    } else {
      say([{ s: 'Jehovah God', t: 'Give your offerings with a complete heart.' }]);
    }
    return;
  }

  /* ---- The altar (the offerings) ---- */
  if (it.kind === 'altar') {
    if (id === 'offering') {
      sfxOffering(); // whoosh + crackle of the altar fire
      completeQuest();
      sfxCanon();
      toast('Canon Event: ' + CHAPTER.canonEvents[0], 'canon');
      say(DLG.offeringTalk);
    } else {
      say([{ t: 'The altar is where offerings are made to Jehovah.' }]);
    }
    return;
  }

  /* ---- Abel (your brother, the shepherd) ---- */
  if (it.kind === 'abel') {
    if (id === 'lure') {
      World.abel.following = true;
      completeQuest();
      say(DLG.lureTalk);
    } else if (World.abel.following) {
      say([{ s: 'Abel', t: 'I am coming with you, brother.' }]);
    } else {
      say([{ s: 'Abel', t: 'My sheep are doing well today.' }]);
    }
    return;
  }
}

/* ---------------- Chapter 2 interactions ---------------- */
function interactChapter2(it) {
  const id = questId();

  /* ---- Jehovah God ---- */
  if (it.kind === 'god') {
    if (id === 'garden') {
      completeQuest();
      say(DLG.gardenTalk);
    } else if (id === 'rule') {
      sfxCanon();
      toast('Canon Event: ' + CHAPTER.canonEvents[0], 'canon');
      completeQuest();
      say(DLG.ruleTalk);
    } else if (id === 'eve') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.eve);
    } else if (id === 'family') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    } else if (id === 'naming' && DLG.hints && DLG.hints.naming) {
      say(DLG.hints.naming);
    } else {
      say([{ s: 'Jehovah God', t: 'Jehovah looks kindly on Adam and Eve.' }]);
    }
    return;
  }

  /* ---- Eve (created from YOUR rib — she follows you) ---- */
  if (it.kind === 'eve') {
    say([{ s: 'Eve', t: 'Hello, Adam. Jehovah made me to be your helper.' }]);
    return;
  }

  /* ---- Animals: YOU (Adam) give them their names ---- */
  if (it.kind === 'animal') {
    const a = it.animal;
    if (id === 'naming' && !a.named) {
      a.named = true;
      progress.naming = (progress.naming || 0) + 1;
      sfxPlant();
      updateHUD();
      const need = QUESTS.find(q => q.id === 'naming').need;
      if (progress.naming >= need) {
        completeQuest();
        say(DLG.namingDone);
      } else {
        say([{ t: 'You look at the animal carefully and give it its name: “' + cap(a.name) + '!”' }]);
      }
    } else {
      say([{ t: 'You already know this animal’s name.' }]);
    }
    return;
  }
}

/* ---------------- Chapter 5 interactions ---------------- */
function interactChapter5(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;
  const QUEST = (qid) => CHAPTER.quests.find(q => q.id === qid);

  /* ---- Jehovah God on the hill ---- */
  if (it.kind === 'god') {
    if (id === 'command') {
      completeQuest();
      sfxCanon();
      say(DLG.commandTalk);
    } else if (id && DLG.hints && DLG.hints[id]) {
      say(DLG.hints[id]);
    } else if (id === 'enter') {
      say([{ s: 'Jehovah God', t: 'The ark is finished and the animals are ready. Go in, Noah — I will shut the door behind you.' }]);
    } else {
      say([{ s: 'Jehovah God', t: 'Build the ark exactly as I showed you, Noah.' }]);
    }
    return;
  }

  /* ---- The ark: finish quest or enter at the end ---- */
  if (it.kind === 'ark') {
    if (id === 'enter') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    } else if (id === 'build') {
      say([{ t: DLG.blocked.arkEarly }]);
    } else if (id === 'animals') {
      say([{ t: 'Bring the animals to the ark — two by two.' }]);
    } else {
      say([{ t: 'A huge box of good wood, built to float on water — just as Jehovah showed Noah.' }]);
    }
    return;
  }

  /* ---- Four piles of timber: about 50 years of work ---- */
  if (it.kind === 'build') {
    const b = it.spot;
    if (id === 'build' && !b.done) {
      b.done = true;
      progress.build = (progress.build || 0) + 1;
      sfxPlant();
      updateHUD();
      const need = QUEST('build').need;
      if (progress.build >= need) {
        completeQuest();
        // the finished ark appears on the field
        World.ark = World.arkPoint;
        triggerFlash();
        sfxCanon();
        toast('Canon Event: ' + CHAPTER.canonEvents[1], 'canon');
        say(DLG.buildDone);
      } else {
        say([{ t: 'You work on the ark… ' + progress.build + ' of ' + need + ' parts finished. The work would take about 50 years.' }]);
      }
    } else if (b.done) {
      say([{ t: 'This part of the ark is finished — strong and true.' }]);
    } else {
      say([{ t: DLG.blocked.buildEarly }]);
    }
    return;
  }

  /* ---- The village: Noah warns the people (they do not listen) ---- */
  if (it.kind === 'person') {
    const p = it.person;
    if (p.villager) {
      if (id === 'warn' && !p.warned) {
        p.warned = true;
        progress.warn = (progress.warn || 0) + 1;
        updateHUD();
        const need = QUEST('warn').need;
        if (progress.warn >= need) {
          completeQuest();
          sfxCanon();
          toast('Canon Event: ' + CHAPTER.canonEvents[2], 'canon');
          say(DLG.warnDone);
        } else {
          say(p.line);
          toast('Warned ' + progress.warn + ' of ' + need + ' people.', 'info');
        }
      } else {
        say(p.line);
      }
    } else {
      /* Noah's own family — they help build the ark */
      say(p.line);
    }
    return;
  }

  /* ---- Animals: lead them to the ark (pairs go two by two) ---- */
  if (it.kind === 'animal') {
    const a = it.animal;
    if (id === 'animals' && a.state === 'idle') {
      const send = (z, side) => {
        z.state = 'sent';
        z.target = World.ark
          ? { x: World.ark.x + side, y: World.ark.y + 30 }   // walk up to the ark's door…
          : meadowPoint();
        progress.animals = (progress.animals || 0) + 1;
      };
      send(a, 0);
      const withPartner = !!(a.partner && a.partner.state === 'idle');
      if (withPartner) send(a.partner, 18);   // …and its partner follows, two by two
      sfxPlant();
      updateHUD();
      toast(withPartner
        ? 'The ' + a.name + ' and its partner are on their way to the ark.'
        : 'The ' + a.name + ' is on its way to the ark.', 'info');
      const need = QUEST('animals').need;
      if (progress.animals >= need) {
        completeQuest();
        say(DLG.animalsDone);
      }
    } else {
      say([{ t: DLG.blocked.animalEarly }]);
    }
    return;
  }
}

/* ---------------- Chapter 15 interactions ---------------- */
function interactChapter15(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;

  if (it.kind === 'god') {
    say(DLG.hints[id] || DLG.godIdle);
    return;
  }

  /* ---- the grain piles: seven fat years of storing food ---- */
  if (it.kind === 'grain') {
    if (id === 'store' && it.g && !it.g.done) {
      it.g.done = true;
      progress.store = (progress.store || 0) + 1;
      sfxPlant();
      updateHUD();
      const need = QUESTS.find(q => q.id === 'store').need;
      if (progress.store >= need) {
        completeQuest();
        // the men from Canaan come to buy food
        const b1 = tileCenter(45, 19), b2 = tileCenter(45, 26);
        World.family.push({ x: b1.x, y: b1.y, name: 'Brother', robe: '#8d6a8f', hair: '#3b2412', phase: 0.4 });
        World.family.push({ x: b2.x, y: b2.y, name: 'Brother', robe: '#6f8fa5', hair: '#4a3320', phase: 1.3 });
        cinemate(CHAPTER.cutscenes.store);
      } else {
        say([{ t: 'Grain stored — ' + progress.store + ' of ' + need + '.' }]);
      }
    }
    return;
  }

  if (it.kind !== 'person') return;
  const m = it.person;

  /* ---- Pharaoh: the dream and the promotion ---- */
  if (m.name === 'Pharaoh') {
    if (id === 'pharaoh') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.pharaoh);
    } else {
      say(DLG.hints[id] || DLG.pharaohIdle);
    }
    return;
  }

  /* ---- the brothers: the bow, then the silver cup ---- */
  if (m.name === 'Brother') {
    if (id === 'bow') {
      completeQuest();
      // they return home — and come back with Benjamin
      if (!World.family.some(f => f.name === 'Benjamin')) {
        const bp = tileCenter(46, 22);
        World.family.push({ x: bp.x, y: bp.y, name: 'Benjamin', robe: '#c9a06a', hair: '#3b2412', phase: 0.9 });
      }
      cinemate(CHAPTER.cutscenes.bow);
    } else if (id === 'cup') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.cup);
    } else {
      say(DLG.hints[id] || DLG.brotherIdle);
    }
    return;
  }

  /* ---- Benjamin: the reveal and the reunion ---- */
  if (m.name === 'Benjamin') {
    if (id === 'reveal') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    } else {
      say(DLG.benjaminIdle);
    }
    return;
  }

  say(DLG.brotherIdle);
}

/* ---------------- Chapter 14 interactions ---------------- */
function interactChapter14(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;

  if (it.kind === 'god') {
    say(DLG.hints[id] || DLG.godIdle);
    return;
  }
  if (it.kind !== 'person') return;
  const m = it.person;

  /* ---- Jacob sends Joseph to the brothers ---- */
  if (m.name === 'Jacob') {
    if (id === 'send') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.send);
    } else {
      say(DLG.hints[id] || DLG.jacobIdle);
    }
    return;
  }

  /* ---- the brothers: the pit and the sale ---- */
  if (m.name === 'Brother' || m.name === 'Judah') {
    if (id === 'pit') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.pit);
    } else {
      say(m.name === 'Judah' ? DLG.judahIdle : DLG.brotherIdle);
    }
    return;
  }

  /* ---- Potiphar: Joseph becomes the trusted steward ---- */
  if (m.name === 'Potiphar') {
    if (id === 'steward') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.steward);
    } else {
      say(DLG.potipharIdle);
    }
    return;
  }

  /* ---- Potiphar's wife: Joseph refuses and is thrown into prison ---- */
  if (m.name === 'Wife') {
    if (id === 'refuse') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.refuse, finishChapter);
    } else {
      say(DLG.wifeIdle);
    }
    return;
  }

  say(DLG.brotherIdle);
}

/* ---------------- Chapter 13 interactions ---------------- */
function interactChapter13(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;

  /* ---- Jehovah: the command to go back home ---- */
  if (it.kind === 'god') {
    if (id === 'call') {
      completeQuest();
      // a messenger arrives on the road with his warning
      const mp = tileCenter(31, 20);
      World.villagers = [{ x: mp.x, y: mp.y, name: 'Messenger', robe: '#8d93a5', hair: '#3b2412', phase: 1.1 }];
      cinemate(CHAPTER.cutscenes.call);
    } else if (id && DLG.hints && DLG.hints[id]) {
      say(DLG.hints[id]);
    } else {
      say(DLG.godIdle);
    }
    return;
  }
  if (it.kind !== 'person') return;
  const m = it.person;

  if (m.name === 'Messenger') {
    if (id === 'warn') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.warn);
    } else {
      say(DLG.messengerIdle);
    }
    return;
  }

  if (m.name === 'Servant') {
    if (id === 'gift') {
      completeQuest();
      // that night the angel waits alone outside the camp
      const ap = tileCenter(26, 27);
      World.angels = [{ x: ap.x, y: ap.y, name: 'Angel', robe: '#e8e4da', hair: '#d8d3c8', phase: 2.2 }];
      cinemate(CHAPTER.cutscenes.gift);
    } else {
      say(DLG.servantIdle);
    }
    return;
  }

  if (m.name === 'Angel') {
    if (id === 'wrestle') {
      completeQuest();
      // dawn: Esau and his men appear in the east
      World.angels = [];
      World.villagers = [[46, 19], [46, 25], [49, 19], [49, 25], [52, 21], [50, 27]].map((pos, i) => {
        const p = tileCenter(pos[0], pos[1]);
        return { x: p.x, y: p.y, name: 'Man of Esau', robe: i % 2 ? '#8d6a8f' : '#6f8fa5',
                 hair: '#3b2412', phase: i * 0.9 };
      });
      if (!World.family.some(f => f.name === 'Esau')) {
        const ep = tileCenter(48, 22);
        World.family.push({ x: ep.x, y: ep.y, name: 'Esau', robe: '#a8552e', hair: '#a8552e', phase: 0.4 });
      }
      cinemate(CHAPTER.cutscenes.wrestle);
    } else {
      say([{ s: 'Angel', t: 'Peace be with you, Jacob.' }]);
    }
    return;
  }

  if (m.name === 'Esau') {
    if (id === 'peace') {
      completeQuest();
      World.villagers = [];               // Esau and his men go back home
      cinemate(CHAPTER.cutscenes.peace, finishChapter);
    } else {
      say(DLG.esauIdle);
    }
    return;
  }

  if (m.name === 'Man of Esau') { say(DLG.manIdle); return; }
  say(DLG.familyIdle);
}

/* ---------------- Chapter 12 interactions ---------------- */
function interactChapter12(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;
  if (it.kind !== 'person') return;
  const m = it.person;

  /* ---- Isaac: the inheritance, then the advice to flee ---- */
  if (m.name === 'Isaac') {
    if (id === 'legacy') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.legacy);
    } else if (id === 'flee') {
      say(DLG.advice);
    } else {
      say(DLG.isaacIdle);
    }
    return;
  }

  /* ---- Rebekah: her plan to get the blessing for Jacob ---- */
  if (m.name === 'Rebekah') {
    if (id === 'blessing') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.blessing);
    } else if (id === 'flee') {
      say(DLG.advice);
    } else {
      say(DLG.rebekahIdle);
    }
    return;
  }

  /* ---- Esau: the stew, then the rage ---- */
  if (m.name === 'Esau') {
    if (id === 'stew') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.stew);
    } else if (id === 'anger') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.anger);
    } else if (id === 'flee') {
      say(DLG.esauAngry);
    } else {
      say(DLG.esauIdle);
    }
    return;
  }
}

/* ---------------- Chapter 11 interactions ---------------- */
function interactChapter11(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;

  /* ---- Jehovah: the hardest command ---- */
  if (it.kind === 'god') {
    if (id === 'command') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.command);
    } else if (id && DLG.hints && DLG.hints[id]) {
      say(DLG.hints[id]);
    } else {
      say(DLG.godIdle);
    }
    return;
  }

  /* ---- the stones: build the altar → the angel stops Abraham ---- */
  if (it.kind === 'stones') {
    if (id === 'altar') {
      completeQuest();
      World.altar = { x: World.stonePile.x, y: World.stonePile.y };
      World.stonePile = null;
      cinemate(CHAPTER.cutscenes.altar);
    } else {
      say(DLG.stoneIdle);
    }
    return;
  }

  /* ---- the ram Jehovah has provided ---- */
  if (it.kind === 'ram') {
    if (id === 'ram') {
      completeQuest();
      World.ram = null;
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    }
    return;
  }

  /* ---- Isaac and the two servants ---- */
  if (it.kind === 'person') {
    const m = it.person;
    if (m === World.isaac) {
      if (id === 'isaac') {
        completeQuest();
        cinemate(CHAPTER.cutscenes.isaac);
      } else {
        say(DLG.isaacIdle);
      }
      return;
    }
    say(DLG.servantIdle);
    return;
  }
}

/* ---------------- Chapter 10 interactions ---------------- */
function moveLotFamily(key) {
  for (const m of World.family) {
    if (!m.spots || !m.spots[key]) continue;
    const p = tileCenter(m.spots[key][0], m.spots[key][1]);
    m.x = p.x; m.y = p.y;
  }
}
function interactChapter10(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;

  /* ---- the pleasant land: Lot makes his choice ---- */
  if (it.kind === 'land') {
    if (id === 'choose') {
      completeQuest();
      // Lot moves his family to Sodom — and Jehovah sends two angels
      moveLotFamily('sodom');
      World.angels = [[50, 9], [52, 9]].map(([ax, ay], i) => {
        const p = tileCenter(ax, ay);
        return { x: p.x, y: p.y, name: 'Angel', robe: '#e8e4da', hair: '#d8d3c8', phase: i * 1.9, angel: true };
      });
      cinemate(CHAPTER.cutscenes.chosen);
    } else {
      say(DLG.landIdle);
    }
    return;
  }

  /* ---- people: Abraham, the angels, Lot's family ---- */
  if (it.kind === 'person') {
    const m = it.person;

    if (m && m.angel) {
      if (id === 'warn') {
        completeQuest();
        // the angels rush the family out of the city onto the road
        moveLotFamily('road');
        cinemate(CHAPTER.cutscenes.warn);
      } else {
        say(DLG.angelIdle);
      }
      return;
    }

    if (m === World.abraham || (m && m.name === 'Abraham')) {
      if (id === 'choice') {
        completeQuest();
        cinemate(CHAPTER.cutscenes.choice);
      } else {
        say(DLG.abrahamIdle);
      }
      return;
    }

    if (m && m.name === "Lot's Wife") {
      if (id === 'remember') {
        completeQuest();
        // she looks back — and becomes a pillar of salt
        World.wifePillar = { x: m.x, y: m.y };
        World.family = World.family.filter(f => f !== m);
        cinemate(CHAPTER.cutscenes.finale, finishChapter);
      } else {
        say(DLG.wifeIdle);
      }
      return;
    }

    say(DLG.daughterIdle);
    return;
  }
}

/* ---------------- Chapter 9 interactions ---------------- */
function interactChapter9(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;

  /* ---- the tent: Isaac is born ---- */
  if (it.kind === 'tent') {
    if (id === 'isaac') {
      completeQuest();
      const p = tileCenter(29, 24);
      World.isaac = { x: p.x, y: p.y, name: 'Isaac', robe: '#e8d9a8', hair: '#5a3b1e', phase: 1.2 };
      cinemate(CHAPTER.cutscenes.birth);
    } else {
      say(DLG.tentIdle);
    }
    return;
  }

  /* ---- people: Sarah, Hagar, and the three visitors ---- */
  if (it.kind === 'person') {
    const m = it.person;

    /* the three angels under the great tree */
    if (m && m.visitor) {
      if (id === 'visitors') {
        completeQuest();
        World.visitors = [];      // the visitors go on their way
        cinemate(CHAPTER.cutscenes.visitors);
      } else {
        say(DLG.visitorIdle);
      }
      return;
    }

    if (m && m.name === 'Sarah') {
      if (id === 'wish') {
        completeQuest();
        cinemate(CHAPTER.cutscenes.wish);
      } else if (id === 'sendaway') {
        completeQuest();
        cinemate(CHAPTER.cutscenes.finale, finishChapter);
      } else {
        say(DLG.sarahIdle);
      }
      return;
    }

    if (m && m.name === 'Hagar') {
      if (id === 'ishmael') {
        completeQuest();
        // Hagar's son is born — and, many years later, three visitors come
        const q = tileCenter(33, 26);
        World.ishmael = { x: q.x, y: q.y, name: 'Ishmael', robe: '#b98e5a', hair: '#3b2412', phase: 2.6 };
        World.visitors = [[34, 18], [37, 18], [36, 20]].map(([vx, vy], i) => {
          const v = tileCenter(vx, vy);
          return { x: v.x, y: v.y, name: 'Visitor', robe: '#e8e4da', hair: '#d8d3c8', phase: i * 1.3, visitor: true };
        });
        cinemate(CHAPTER.cutscenes.ishmael);
      } else {
        say(DLG.hagarIdle);
      }
      return;
    }

    say(DLG.idle);
    return;
  }
}

/* ---------------- Chapter 8 interactions ---------------- */
function interactChapter8(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;

  /* ---- Jehovah God: the call in Ur, then the promise in Canaan ---- */
  if (it.kind === 'god') {
    if (id === 'call') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.call);
    } else if (id === 'promise') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.promise);
    } else if (id && DLG.hints && DLG.hints[id]) {
      say(DLG.hints[id]);
    } else {
      say(World.god.x > 1400 ? DLG.godIdleCanaan : DLG.godIdleUr);
    }
    return;
  }

  /* ---- Abraham's household: pack, then Sarah closes the chapter ---- */
  if (it.kind === 'person') {
    const m = it.person;
    if (id === 'pack' && m && !m.packed) {
      m.packed = true;
      progress.pack = (progress.pack || 0) + 1;
      sfxPlant();
      updateHUD();
      const packed = World.family.filter(f => f.packed).length;
      if (packed >= World.family.length) {
        completeQuest();
        say(DLG.packDone);
      } else {
        const line = m.name === 'Sarah' ? DLG.sarahUr : m.name === 'Terah' ? DLG.terahUr : DLG.lotUr;
        say(line);
      }
      return;
    }
    if (id === 'children' && m && m.name === 'Sarah') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
      return;
    }
    say(m && m.packed ? DLG.packedAgain : [{ s: m ? m.name : '…', t: 'Shalom, Abraham.' }]);
    return;
  }
}

/* ---------------- Chapter 7 interactions ---------------- */
function interactChapter7(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;

  /* ---- Jehovah God on the hill: the naming of Babel ---- */
  if (it.kind === 'god') {
    if (id === 'confusion') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.naming);
    } else if (id && DLG.hints && DLG.hints[id]) {
      say(DLG.hints[id]);
    } else {
      say(DLG.godIdle);
    }
    return;
  }

  /* ---- The foreman: the proud plan, then the confusion ---- */
  if (it.kind === 'foreman') {
    if (id === 'plan') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.plan);
    } else if (World.confused) {
      say(DLG.foremanConfused);
    } else {
      say(DLG.foremanIdle);
    }
    return;
  }

  /* ---- The brick pile: take one brick ---- */
  if (it.kind === 'brick') {
    if (id === 'bricks' && !World.carrying) {
      World.carrying = true;
      say(DLG.brickTake);
    } else {
      say([{ t: 'Mud bricks, baked in the sun, for the tower.' }]);
    }
    return;
  }

  /* ---- The tower: deliver the brick ---- */
  if (it.kind === 'tower') {
    if (id === 'bricks' && World.carrying) {
      World.carrying = false;
      progress.bricks = (progress.bricks || 0) + 1;
      sfxPlant();
      updateHUD();
      const need = QUESTS.find(q => q.id === 'bricks').need;
      if (progress.bricks >= need) {
        completeQuest();
        say(DLG.bricksDone);
      } else {
        say([{ t: 'The brick is laid on the tower. ' + progress.bricks + ' of ' + need + ' carried.' }]);
      }
    } else if (id === 'bricks') {
      say(DLG.brickFirst);
    } else {
      say(DLG.towerLook);
    }
    return;
  }

  /* ---- The scaffolds: raise the tower, then the confusion ---- */
  if (it.kind === 'scaffold') {
    if (id === 'raise' && it.s && !it.s.done) {
      it.s.done = true;
      World.tower.level++;
      progress.raise = (progress.raise || 0) + 1;
      triggerFlash();
      sfxPlant();
      updateHUD();
      const need = QUESTS.find(q => q.id === 'raise').need;
      if (progress.raise >= need) {
        completeQuest();
        cinemate(CHAPTER.cutscenes.confusion);
      } else {
        say([{ t: 'You raise the tower one level higher. ' + progress.raise + ' of ' + need + ' scaffolds worked.' }]);
      }
    }
    return;
  }

  /* ---- The builders: friendly words, then gibberish ---- */
  if (it.kind === 'worker') {
    if (World.confused) {
      const gib = ['Zara! Meco vela!', 'Triba, triba — no entiendo!', 'Ora meka, oka neba!', 'Babel! Babel! Kora?'];
      say([{ s: 'Builder', t: gib[World.workers.indexOf(it.w) % gib.length] }]);
    } else {
      say([{ s: 'Builder', t: 'Mix the mud, bake the bricks — the tower must reach heaven!' }]);
    }
    return;
  }

  /* ---- The city gate: leave Babel ---- */
  if (it.kind === 'gate') {
    if (id === 'scatter') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    } else {
      say(DLG.gateIdle);
    }
    return;
  }
}

/* ---------------- Chapter 6 interactions ---------------- */
function interactChapter6(it) {
  const id = questId();
  const DLG = CHAPTER.dialogs;

  /* ---- Jehovah (never met in person until the offering is made) ---- */
  if (it.kind === 'god') {
    if (id === 'offering') {
      sfxOffering();
      completeQuest();
      sfxCanon();
      toast('Canon Event: ' + CHAPTER.canonEvents[3], 'canon');
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    } else if (id && DLG.hints && DLG.hints[id]) {
      say(DLG.hints[id]);
    } else {
      say([{ s: 'Jehovah God', t: 'I will never again destroy everything on the earth in a flood.' }]);
    }
    return;
  }

  /* ---- The little window of the ark ---- */
  if (it.kind === 'window') {
    if (id === 'rain') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.windowFlood);
    } else if (id === 'settle') {
      // the rain stops, the water goes down, the ark settles on the mountains
      World.raining = false;
      triggerFlash();
      sfxCanon();
      completeQuest();
      cinemate(CHAPTER.cutscenes.settle);
    } else {
      say(DLG.windowIdle);
    }
    return;
  }

  /* ---- The door of the ark ---- */
  if (it.kind === 'door') {
    if (id === 'exit') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.exit);
    } else {
      say(DLG.doorEarly);
    }
    return;
  }

  /* ---- The stones: pile them into an altar ---- */
  if (it.kind === 'stones') {
    if (id === 'altar') {
      World.altar = World.stonePile;
      World.stonePile = null;
      triggerFlash();
      sfxPlant();
      completeQuest();
      say(DLG.altarDone);
    } else if (id === 'offering') {
      say(DLG.altarLook);
    } else {
      say([{ t: DLG.blocked.altarEarly }]);
    }
    return;
  }

  /* ---- The sheep: lead it to the altar ---- */
  if (it.kind === 'sheep') {
    if (id === 'offering' && World.sheep && !World.sheep.taken) {
      World.sheep.taken = true;
      World.sheep.following = true;
      say(DLG.sheepTake);
    } else {
      say([{ t: 'The sheep are calm inside the new world.' }]);
    }
    return;
  }

  /* ---- The altar: a thankful offering ---- */
  if (it.kind === 'altar') {
    if (id === 'offering' && World.sheep && World.sheep.taken) {
      World.sheep.following = false;
      World.sheep.offered = true;
      sfxOffering();
      completeQuest();
      sfxCanon();
      toast('Canon Event: ' + CHAPTER.canonEvents[3], 'canon');
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    } else if (id === 'offering') {
      say(DLG.sheepWait);
    } else {
      say(DLG.altarLook);
    }
    return;
  }

  /* ---- Family chatter inside and outside the ark ---- */
  if (it.kind === 'person') {
    const words = {
      rain: 'The rain never stops, Father — but we are safe in the ark.',
      settle: 'The rain has stopped! Is it almost time to go out?',
      exit: 'We are ready, Noah — every one of us, and the animals too.',
      altar: 'We will help you pile up the stones.',
      offering: 'Choose one of the sheep, Noah, and lead it to the altar.',
    };
    say([{ s: it.person.name, t: words[id] || words.rain }]);
    return;
  }
}

/* ---------------- Chapter 1 interactions ---------------- */
function interactChapter1(it) {
  const id = questId();

  /* ---- Jehovah God ---- */
  if (it.kind === 'god') {
    if (id === 'meet') {
      completeQuest();
      say(DLG.meet);
    } else if (id === 'man') {
      completeQuest();
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    } else if (id && DLG.hints[id]) {
      say(DLG.hints[id]);
    } else {
      say([{ s: 'Jehovah God', t: DLG.blocked.godIdle }]);
    }
    return;
  }

  /* ---- Beacon of Light (quest 2) ---- */
  if (it.kind === 'beacon') {
    if (id === 'light' && !World.lit) {
      World.lit = true;
      triggerFlash();
      sfxCanon();
      toast('Canon Event: ' + CHAPTER.canonEvents[0], 'canon');
      completeQuest();
      say(DLG.lightDone);
    } else if (!World.lit) {
      say([{ t: DLG.blocked.beaconEarly }]);
    } else {
      say([{ t: DLG.blocked.beaconLit }]);
    }
    return;
  }

  /* ---- Soil patches (quest 3) ---- */
  if (it.kind === 'soil') {
    const s = it.soil;
    if (id === 'plants' && !s.planted) {
      s.planted = true;
      World.growTreeAt(s.x, s.y);
      progress.plants = (progress.plants || 0) + 1;
      sfxPlant();
      updateHUD();
      const need = QUESTS.find(q => q.id === 'plants').need;
      if (progress.plants >= need) {
        completeQuest();
        say(DLG.plantsDone);
      } else {
        say([{ t: 'A seed is planted in the soft soil. ' + progress.plants + ' of ' + need + ' planted.' }]);
      }
    } else if (s.planted) {
      say([{ t: DLG.blocked.soilPlanted }]);
    } else {
      say([{ t: DLG.blocked.soilEarly }]);
    }
    return;
  }

  /* ---- Animals (quest 4) ---- */
  if (it.kind === 'animal') {
    const a = it.animal;
    if (id === 'animals' && a.state === 'idle') {
      a.state = 'sent';
      a.target = meadowPoint();
      progress.animals = (progress.animals || 0) + 1;
      sfxPlant();
      updateHUD();
      toast('The ' + a.name + ' is on its way to the meadow.', 'info');
      const need = QUESTS.find(q => q.id === 'animals').need;
      if (progress.animals >= need) {
        completeQuest();
        say(DLG.animalsDone);
      }
    } else {
      say([{ t: DLG.blocked.animalEarly }]);
    }
    return;
  }
}

// ---------- update ----------
function canStand(x, y) {
  const I = World.interior;
  if (I) return x > I.x0 + 10 && x < I.x1 - 10 && y > I.y0 + 10 && y < I.y1 - 10;
  if (World.solidAt(x, y)) return false;
  const o = 9;
  return !World.solidAt(x - o, y - o) && !World.solidAt(x + o, y - o) &&
         !World.solidAt(x - o, y + o) && !World.solidAt(x + o, y + o);
}
function updatePlayer(dt) {
  let dx = 0, dy = 0;
  if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
  if (!dx && !dy) return;
  // remember which way Adam faces (drives the walk/idle sprite sheet)
  if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? 'right' : 'left';
  else player.facing = dy > 0 ? 'down' : 'up';
  const len = Math.hypot(dx, dy);
  dx /= len; dy /= len;
  const step = player.speed * dt;
  const nx = player.x + dx * step;
  const ny = player.y + dy * step;
  if (canStand(nx, player.y)) player.x = nx;
  if (canStand(player.x, ny)) player.y = ny;
  player.x = Math.max(16, Math.min(MAP_W * TILE - 16, player.x));
  player.y = Math.max(16, Math.min(MAP_H * TILE - 16, player.y));
  player.moving = true;
  // soft footsteps while walking
  player.stepT -= dt;
  if (player.stepT <= 0) { sfxStep(); player.stepT = 0.3; }
}
function inMeadow(x, y) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  return tx >= 23 && tx <= 37 && ty >= 15 && ty <= 27;
}
function moveActor(a, tx, ty, speed, dt) {
  const dx = tx - a.x, dy = ty - a.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const s = Math.min(d, speed * dt);
  a.x += (dx / d) * s;
  a.y += (dy / d) * s;
}
function updateAnimals(dt) {
  for (const a of World.animals) {
    if (a.state === 'sent' && a.target) {
      moveActor(a, a.target.x, a.target.y, a.speed, dt);
      if (chapterIdx === 4 && World.ark) {
        // Chapter 5: the animal walks up to the ark's door and goes inside
        if (Math.hypot(a.x - a.target.x, a.y - a.target.y) < 26) {
          a.state = 'inside';
          a.target = null;
        }
      } else if (inMeadow(a.x, a.y)) {
        a.state = 'meadow';
        a.target = null;
        a.wait = 0.5 + Math.random();
      }
    } else if (a.state === 'meadow') {
      if (a.target) {
        moveActor(a, a.target.x, a.target.y, a.speed * 0.5, dt);
        if (Math.hypot(a.x - a.target.x, a.y - a.target.y) < 4) {
          a.target = null;
          a.wait = 1 + Math.random() * 2.5;
        }
      } else {
        a.wait -= dt;
        if (a.wait <= 0) a.target = meadowPoint();
      }
    }
  }
}
// Chapter 7: the builders wander around the city; after the confusion they
// mill about in small groups instead of working.
function updateWorkers(dt) {
  for (const w of World.workers) {
    w.phase += dt;
    if (World.confused) {
      // bunch up together and shuffle about, not understanding each other
      const centre = World.tower || { x: w.x, y: w.y };
      const tx = centre.x + Math.cos(w.phase * 0.9 + w.phase) * 70;
      const ty = centre.y + 96 + Math.sin(w.phase * 1.1 + w.phase) * 52;
      moveActor(w, tx, ty, 30, dt);
      continue;
    }
    if (w.state === 'idle') {
      w.wait = (w.wait || 0) - dt;
      if (w.wait <= 0) {
        const tx = w.homeX !== undefined ? w.homeX : (w.homeX = w.x);
        const ty = w.homeY !== undefined ? w.homeY : (w.homeY = w.y);
        w.target = { x: tx + (Math.random() - 0.5) * 180, y: ty + (Math.random() - 0.5) * 150 };
        w.state = 'walk';
      }
    } else if (w.target) {
      moveActor(w, w.target.x, w.target.y, w.speed, dt);
      if (Math.hypot(w.x - w.target.x, w.y - w.target.y) < 5) {
        w.target = null;
        w.state = 'idle';
        w.wait = 1 + Math.random() * 2.4;
      }
    }
  }
}
// Companions (Eve in Chapter 2) follow the player, keeping a polite distance
// Companions (Eve in Chapter 2) follow the player, keeping a polite distance
// (>54px interaction radius) so they never hijack nearby quest-giver prompts
function updateCompanions(dt) {
  for (const c of [World.adam, World.eve, World.abel, World.sheep]) {
    if (!c) continue;
    if (c.movingT > 0) c.movingT -= dt;   // drives Adam's walk animation
    if (!c.following) continue;
    const d = Math.hypot(player.x - c.x, player.y - c.y);
    if (d > 66) { moveActor(c, player.x, player.y, 168, dt); c.movingT = 0.2; }
  }
}
// Chapter 4: walking into the field with Abel triggers the canon event
// Chapter 8: walking into Canaan completes the journey quest
function checkFieldTrigger() {
  if (chapterIdx === 13 && questId() === 'egypt') {
    const z = World.journeyZone;
    if (z && player.x >= z.x1 && player.x <= z.x2 && player.y >= z.y1 && player.y <= z.y2) {
      // the caravan reaches Egypt — Joseph is sold to Potiphar
      completeQuest();
      cinemate(CHAPTER.cutscenes.egypt);
    }
    return;
  }
  if (chapterIdx === 11 && questId() === 'flee') {
    const z = World.journeyZone;
    if (z && player.x >= z.x1 && player.x <= z.x2 && player.y >= z.y1 && player.y <= z.y2) {
      // Jacob runs for his life toward Laban
      completeQuest();
      cinemate(CHAPTER.cutscenes.finale, finishChapter);
    }
    return;
  }
  if (chapterIdx === 10 && questId() === 'travel') {
    const z = World.journeyZone;
    if (z && player.x >= z.x1 && player.x <= z.x2 && player.y >= z.y1 && player.y <= z.y2) {
      // after three days the mountains are in sight: the servants wait here
      const s0 = tileCenter(43, 24), s1 = tileCenter(45, 25), ik = tileCenter(48, 17);
      if (World.family[0]) { World.family[0].x = s0.x; World.family[0].y = s0.y; }
      if (World.family[1]) { World.family[1].x = s1.x; World.family[1].y = s1.y; }
      if (World.isaac) { World.isaac.x = ik.x; World.isaac.y = ik.y; }
      completeQuest();
      cinemate(CHAPTER.cutscenes.arrival);
    }
    return;
  }
  if (chapterIdx === 9 && questId() === 'escape') {
    const z = World.escapeZone;
    if (z && player.x >= z.x1 && player.x <= z.x2 && player.y >= z.y1 && player.y <= z.y2) {
      // Lot reaches Zoar — the family is safe, and fire falls on the cities
      moveLotFamily('zoar');
      World.angels = [];
      completeQuest();
      cinemate(CHAPTER.cutscenes.fire);
    }
    return;
  }
  if (chapterIdx === 7 && questId() === 'travel') {
    const z = World.journeyZone;
    if (z && player.x >= z.x1 && player.x <= z.x2 && player.y >= z.y1 && player.y <= z.y2) {
      // Abraham, Sarah, Terah and Lot arrive in the land of Canaan
      World.god = World.canaanGod;
      for (const m of World.family) if (m.canaan) { m.x = m.canaan.x; m.y = m.canaan.y; }
      completeQuest();
      cinemate(CHAPTER.cutscenes.arrival);
    }
    return;
  }
  if (chapterIdx !== 3 || questId() !== 'field') return;
  const z = World.fieldZone, a = World.abel;
  if (!z || !a || !a.following) return;
  const inZone = player.x >= z.x1 && player.x <= z.x2 &&
                 player.y >= z.y1 && player.y <= z.y2;
  if (inZone && Math.hypot(player.x - a.x, player.y - a.y) < 150) {
    completeQuest();
    cinemate(CHAPTER.cutscenes.field);
  }
}
function updateCamera() {
  const worldW = MAP_W * TILE, worldH = MAP_H * TILE;
  cam.x = worldW > vw ? Math.max(vw / 2, Math.min(worldW - vw / 2, player.x)) : worldW / 2;
  cam.y = worldH > vh ? Math.max(vh / 2, Math.min(worldH - vh / 2, player.y)) : worldH / 2;
}
function updatePrompt() {
  if (gameState !== 'play') { ui.prompt.classList.add('hidden'); return; }
  const it = nearestInteractable();
  if (it) {
    ui.prompt.innerHTML = '<span class="key">E</span>' + promptText(it);
    ui.prompt.classList.remove('hidden');
  } else {
    ui.prompt.classList.add('hidden');
  }
}
function update(dt) {
  tickSeq(dt);
  if (gameState === 'play') {
    player.moving = false;
    updatePlayer(dt);
    updateAnimals(dt);
    if (chapterIdx === 6) updateWorkers(dt);
    updateCompanions(dt);
    checkFieldTrigger();
  }
  updateCamera();
  updatePrompt();
}

// ---------- render: tiles ----------
function tileColor(type, tx, ty) {
  const h = hash2(tx, ty);
  switch (type) {
    case T.GRASS: return ['#5fae41', '#57a53b', '#67b64a'][Math.floor(h * 3)];
    case T.MEADOW: return ['#7ecb54', '#86d35b', '#74c24d'][Math.floor(h * 3)];
    case T.WATER: return (Math.floor(time * 2 + tx + ty) % 4 === 0) ? '#4d9fe4' : '#3a8bd4';
    case T.MOUNTAIN: return h > 0.5 ? '#9298a4' : '#848a96';
    case T.SAND: return h > 0.5 ? '#e9d59b' : '#e2cd92';
    case T.PATH: return h > 0.5 ? '#b38b56' : '#a9814d';
    case T.SOIL: return '#6b4a2b';
    case T.GARDEN: return ['#8ed85f', '#96e067', '#85d157'][Math.floor(h * 3)];
    case T.BRIDGE: return h > 0.5 ? '#bb9260' : '#b08a55';
  }
  return '#456';
}
function renderTiles(x0, x1, y0, y1) {
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const type = World.tileAt(tx, ty);
      const px = tx * TILE, py = ty * TILE;
      // Phase 2: every terrain tile is authored as a 16x16 pixel pattern
      // and rendered at 2x, keeping the existing 32px world grid.
      PixelTiles.draw(type, tx, ty, ctx, px, py, TILE);
    }
  }
}

// ---------- render: actors ----------
function glow(x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
}
function drawTree(tr) {
  PixelObjects.drawTree(ctx, tr, time);
  if (tr.special) {
    const r = tr.r || tr.baseR || 11;
    glow(tr.x, tr.y - r * 0.6, r * 1.55,
      tr.special === 'knowledge'
        ? 'rgba(255,90,60,0.18)'
        : 'rgba(255,220,120,0.20)');
  }
}
function drawBeacon() {
  const x = World.beacon.x, y = World.beacon.y;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y + 6, 14, 5, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#8b8f99';
  ctx.fillRect(x - 8, y - 26, 16, 30);
  ctx.fillStyle = '#a3a7b1';
  ctx.fillRect(x - 11, y + 2, 22, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x - 8, y - 26, 5, 30);
  const lit = World.lit;
  const r = 9 + Math.sin(time * 4) * 1.5;
  glow(x, y - 32, lit ? 48 : 26, lit ? 'rgba(255,225,130,0.95)' : 'rgba(120,160,255,0.55)');
  ctx.fillStyle = lit ? '#fff3c4' : '#7f97c9';
  ctx.beginPath(); ctx.arc(x, y - 32, r, 0, 6.283); ctx.fill();
  if (lit) {
    ctx.strokeStyle = 'rgba(255,240,180,0.75)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const ang = time * 0.6 + i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(ang) * (r + 5), y - 32 + Math.sin(ang) * (r + 5));
      ctx.lineTo(x + Math.cos(ang) * (r + 13), y - 32 + Math.sin(ang) * (r + 13));
      ctx.stroke();
    }
  }
}
function drawGod() {
  const x = World.god.x, y = World.god.y;
  glow(x, y - 14, 62 * (1 + Math.sin(time * 2) * 0.06), 'rgba(255,240,180,0.6)');
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y + 8, 13, 5, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#fdfbf2';
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x - 13, y + 8);
  ctx.lineTo(x + 13, y + 8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d9c98f'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#f0d2a8';
  ctx.beginPath(); ctx.arc(x, y - 32, 7, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#eee6d4';
  ctx.beginPath(); ctx.arc(x, y - 34, 7.4, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 5, y - 30); ctx.quadraticCurveTo(x, y - 17, x + 5, y - 30); ctx.fill();
}
// ---------- render: Chapter 5 characters & objects ----------
function drawPlayerNoah() {
  const x = player.x;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, player.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  const bob = player.moving ? Math.abs(Math.sin(time * 10)) * 2 : 0;
  const y = player.y - bob;
  // legs
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  // plain brown robe
  ctx.fillStyle = '#7c6650';
  ctx.beginPath(); ctx.ellipse(x, y - 12, 8.5, 10, 0, 0, 6.283); ctx.fill();
  // head
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  // white hair and long beard (Noah is an old man)
  ctx.fillStyle = '#d8d3c8';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.4, Math.PI, 0); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 5.5, y - 29);
  ctx.quadraticCurveTo(x, y - 17, x + 5.5, y - 29);
  ctx.fill();
}
// Chapter 7 playable character: a builder on the plain of Shinar
function drawPlayerBuilder() {
  const x = player.x;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, player.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  const bob = player.moving ? Math.abs(Math.sin(time * 10)) * 2 : 0;
  const y = player.y - bob;
  // legs
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  // worker's tunic
  ctx.fillStyle = '#9a7d55';
  ctx.beginPath(); ctx.ellipse(x, y - 12, 8.5, 10, 0, 0, 6.283); ctx.fill();
  // head
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  // dark hair and a red headband (the builders of Babel)
  ctx.fillStyle = '#4a3320';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.2, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#c25a3a';
  ctx.fillRect(x - 6, y - 32, 12, 2.4);
  // the brick you are carrying, held overhead
  if (World.carrying) {
    ctx.fillStyle = '#b06a3a';
    ctx.fillRect(x - 7, y - 44, 14, 8);
    ctx.strokeStyle = '#7d4526'; ctx.lineWidth = 1;
    ctx.strokeRect(x - 7, y - 44, 14, 8);
  }
}
// Chapter 8 playable character: Abraham, an old man who trusts Jehovah
function drawPlayerAbraham() {
  const x = player.x;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, player.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  const bob = player.moving ? Math.abs(Math.sin(time * 10)) * 2 : 0;
  const y = player.y - bob;
  // walking staff
  ctx.strokeStyle = '#7a5a34';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 34); ctx.lineTo(x + 12, y + 4);
  ctx.stroke();
  // legs
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  // dusty traveller's robe
  ctx.fillStyle = '#9d8a6a';
  ctx.beginPath(); ctx.ellipse(x, y - 12, 8.5, 10, 0, 0, 6.283); ctx.fill();
  // head
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  // white hair and long beard (Abraham is 75 years old)
  ctx.fillStyle = '#e8e4da';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.4, Math.PI, 0); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 5.5, y - 29);
  ctx.quadraticCurveTo(x, y - 16, x + 5.5, y - 29);
  ctx.fill();
}
// Chapter 10 playable character: Lot
function drawPlayerLot() {
  const x = player.x;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, player.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  const bob = player.moving ? Math.abs(Math.sin(time * 10)) * 2 : 0;
  const y = player.y - bob;
  // legs
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  // blue-grey traveller's robe
  ctx.fillStyle = '#7d8a9a';
  ctx.beginPath(); ctx.ellipse(x, y - 12, 8.5, 10, 0, 0, 6.283); ctx.fill();
  // head
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  // short dark hair
  ctx.fillStyle = '#3b2412';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.2, Math.PI, 0); ctx.fill();
}
// Chapter 12 playable character: Jacob
function drawPlayerJacob() {
  const x = player.x;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, player.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  const bob = player.moving ? Math.abs(Math.sin(time * 10)) * 2 : 0;
  const y = player.y - bob;
  // legs
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  // teal-blue tunic with a sash
  ctx.fillStyle = '#5f8a8f';
  ctx.beginPath(); ctx.ellipse(x, y - 12, 8.5, 10, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(x - 8, y - 8, 16, 2.5);
  // head
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  // short brown hair
  ctx.fillStyle = '#5a3b1e';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.2, Math.PI, 0); ctx.fill();
}
// Chapter 14 playable character: Joseph — in his coat of many colours
function drawPlayerJoseph() {
  const x = player.x;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, player.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  const bob = player.moving ? Math.abs(Math.sin(time * 10)) * 2 : 0;
  const y = player.y - bob;
  // legs
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  // the coat of many colours
  ctx.fillStyle = '#d9a441';
  ctx.beginPath(); ctx.ellipse(x, y - 13, 8.5, 11, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#c2453a'; ctx.fillRect(x - 6, y - 22, 3, 17);
  ctx.fillStyle = '#3f6fb5'; ctx.fillRect(x - 1.5, y - 23, 3, 18);
  ctx.fillStyle = '#4f9b52'; ctx.fillRect(x + 3, y - 22, 3, 17);
  // head
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  // dark hair
  ctx.fillStyle = '#2c2418';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.2, Math.PI, 0); ctx.fill();
}
function drawPerson(p) {
  PixelCharacters.drawPerson(ctx, p, time);
}
function drawArk() {
  const k = World.ark;
  if (!k) return;
  const x = k.x, y = k.y;
  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y + 18, 66, 15, 0, 0, 6.283); ctx.fill();
  // hull
  ctx.fillStyle = '#8a5a30';
  ctx.strokeStyle = '#5f3c1e'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 62, y - 14);
  ctx.lineTo(x + 62, y - 14);
  ctx.lineTo(x + 46, y + 16);
  ctx.quadraticCurveTo(x, y + 28, x - 46, y + 16);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // plank lines on the hull
  ctx.strokeStyle = 'rgba(95,60,30,0.65)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 58, y - 6); ctx.lineTo(x + 58, y - 6);
  ctx.moveTo(x - 53, y + 3); ctx.lineTo(x + 53, y + 3);
  ctx.stroke();
  // house on the deck
  ctx.fillStyle = '#a8733f';
  ctx.strokeStyle = '#5f3c1e'; ctx.lineWidth = 2;
  ctx.fillRect(x - 42, y - 42, 84, 28);
  ctx.strokeRect(x - 42, y - 42, 84, 28);
  // roof
  ctx.fillStyle = '#6f4622';
  ctx.beginPath();
  ctx.moveTo(x - 48, y - 42);
  ctx.lineTo(x, y - 60);
  ctx.lineTo(x + 48, y - 42);
  ctx.closePath(); ctx.fill();
  // door — closes for good once everyone is inside
  ctx.fillStyle = World.inside ? '#3d2712' : '#241505';
  ctx.fillRect(x - 10, y - 36, 20, 22);
  // little window
  ctx.fillStyle = '#f4e3b2';
  ctx.fillRect(x + 22, y - 34, 12, 10);
}
// Chapter 6: the inside of the ark — a wooden room with a window and a door
function drawArkInterior() {
  const I = World.interior;
  if (!I) return;
  const w = I.x1 - I.x0, h = I.y1 - I.y0;
  // dark hull all around
  ctx.fillStyle = '#0d0906';
  ctx.fillRect(cam.x - vw / 2 - 4, cam.y - vh / 2 - 4, vw + 8, vh + 8);
  // inner walls
  ctx.fillStyle = '#3a2412';
  ctx.fillRect(I.x0 - 16, I.y0 - 16, w + 32, h + 32);
  ctx.strokeStyle = '#241505'; ctx.lineWidth = 3;
  ctx.strokeRect(I.x0 - 16, I.y0 - 16, w + 32, h + 32);
  // floor planks
  ctx.fillStyle = '#6b4626';
  ctx.fillRect(I.x0, I.y0, w, h);
  ctx.strokeStyle = 'rgba(46,28,12,0.55)'; ctx.lineWidth = 1;
  for (let px = I.x0 + 48; px < I.x1; px += 48) {
    ctx.beginPath(); ctx.moveTo(px, I.y0); ctx.lineTo(px, I.y1); ctx.stroke();
  }
  for (let py = I.y0 + 64; py < I.y1; py += 64) {
    ctx.beginPath(); ctx.moveTo(I.x0, py); ctx.lineTo(I.x1, py); ctx.stroke();
  }
  // the little window on the north wall — the Flood seen through it
  const win = I.window;
  ctx.fillStyle = '#241505';
  ctx.fillRect(win.x - 36, I.y0 - 14, 72, 36);
  ctx.fillStyle = World.raining ? '#43567d' : (World.flooded ? '#5d7699' : '#87a7c7');
  ctx.fillRect(win.x - 30, I.y0 - 8, 60, 26);
  if (World.raining) {
    ctx.strokeStyle = 'rgba(200,220,255,0.85)'; ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      const rx = win.x - 30 + ((i * 17 + time * 95) % 60);
      const ry = I.y0 - 8 + ((i * 11 + time * 170) % 26);
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 1, ry + 5); ctx.stroke();
    }
  }
  ctx.strokeStyle = '#5f3c1e'; ctx.lineWidth = 3;
  ctx.strokeRect(win.x - 36, I.y0 - 14, 72, 36);
  // the door on the south wall
  const d = I.door;
  ctx.fillStyle = '#5f3c1e';
  ctx.fillRect(d.x - 34, I.y1 - 20, 68, 36);
  ctx.fillStyle = '#241505';
  ctx.fillRect(d.x - 26, I.y1 - 13, 52, 30);
  ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 3;
  ctx.strokeRect(d.x - 34, I.y1 - 20, 68, 36);
  ctx.fillStyle = '#d8b45a';
  ctx.beginPath(); ctx.arc(d.x + 18, I.y1 + 2, 3.5, 0, 6.283); ctx.fill();
}
// Chapter 6: the stones Noah will pile into an altar
function drawStonePile(s) {
  const x = s.x, y = s.y;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y + 6, 16, 6, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#9a938a';
  ctx.strokeStyle = '#635d55'; ctx.lineWidth = 1.5;
  const stones = [[0, 2, 9, 6], [-9, -3, 7, 5], [8, -4, 7, 5], [-2, -9, 8, 5]];
  for (const [ox, oy, rw, rh] of stones) {
    ctx.beginPath(); ctx.ellipse(x + ox, y + oy, rw, rh, 0, 0, 6.283); ctx.fill(); ctx.stroke();
  }
}
function drawBuildSpot(b) {
  const x = b.x, y = b.y;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y + 6, 15, 5, 0, 0, 6.283); ctx.fill();
  if (b.done) {
    // a neat stack of finished planks
    ctx.fillStyle = '#a8733f';
    for (let i = 0; i < 3; i++) ctx.fillRect(x - 13, y + 2 - i * 5, 26, 4);
    ctx.fillStyle = '#6f4622';
    ctx.fillRect(x - 13, y - 13, 4, 18);
    ctx.fillRect(x + 9, y - 13, 4, 18);
  } else {
    // loose timber and a hammer — work waiting to be done
    ctx.fillStyle = '#8a5a30';
    ctx.fillRect(x - 14, y - 3, 28, 5);
    ctx.fillRect(x - 11, y + 4, 24, 5);
    ctx.fillStyle = '#b0793f';
    ctx.fillRect(x - 8, y - 10, 20, 5);
    ctx.strokeStyle = '#5a3b1e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 9, y - 12); ctx.lineTo(x + 15, y - 5); ctx.stroke();
    ctx.fillStyle = '#8b9099';
    ctx.fillRect(x + 6, y - 15, 8, 4);
  }
}
function drawHut(h) {
  PixelObjects.drawHut(ctx, h);
}
// ---------- Chapter 7 scenery: the tower of Babel and its city ----------
function drawTower() {
  const tw = World.tower;
  if (!tw) return;
  const cx = tw.x, baseY = tw.y + 80;      // south face of the 5x5 footprint
  const built = 1 + (tw.level || 0);       // 1..4 levels standing
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(cx - 78, baseY - 6, 156, 10);
  for (let i = 0; i < 4; i++) {
    const w = 150 - i * 32;
    const h = 26;
    const yTop = baseY - (i + 1) * h;
    if (i < built) {
      ctx.fillStyle = ['#c9a06a', '#c19762', '#b98e5a', '#b18552'][i];
      ctx.fillRect(cx - w / 2, yTop, w, h);
      // brick courses
      ctx.strokeStyle = 'rgba(90,55,30,0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - w / 2, yTop, w, h);
      for (let r = 1; r < 3; r++) {
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, yTop + r * h / 3);
        ctx.lineTo(cx + w / 2, yTop + r * h / 3);
        ctx.stroke();
      }
    } else {
      // not built yet: ghost outline
      ctx.save();
      ctx.strokeStyle = 'rgba(140,105,70,0.55)';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w / 2, yTop, w, h);
      ctx.restore();
    }
  }
}
function drawScaffold(s) {
  const x = s.x, y = s.y;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(x, y + 6, 22, 6, 0, 0, 6.283); ctx.fill();
  ctx.strokeStyle = '#8a6a3f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 20, y + 4); ctx.lineTo(x - 20, y - 44);
  ctx.moveTo(x + 20, y + 4); ctx.lineTo(x + 20, y - 44);
  ctx.stroke();
  // cross planks
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 34); ctx.lineTo(x + 20, y - 14);
  ctx.moveTo(x + 20, y - 34); ctx.lineTo(x - 20, y - 14);
  ctx.stroke();
  // platform
  ctx.fillStyle = '#b98e5a';
  ctx.fillRect(x - 26, y - 46, 52, 7);
  ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 1;
  ctx.strokeRect(x - 26, y - 46, 52, 7);
  if (s.done) {
    // a little flag once the level has been raised
    ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 20, y - 46); ctx.lineTo(x + 20, y - 66); ctx.stroke();
    ctx.fillStyle = '#e2453a';
    ctx.beginPath();
    ctx.moveTo(x + 20, y - 66); ctx.lineTo(x + 40, y - 61); ctx.lineTo(x + 20, y - 55);
    ctx.fill();
  }
}
function drawBrickPile(p) {
  const x = p.x, y = p.y;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y + 7, 24, 7, 0, 0, 6.283); ctx.fill();
  for (let row = 0; row < 4; row++) {
    const n = 3 - Math.floor(row / 2);
    for (let i = 0; i < n; i++) {
      const bx = x - 18 + i * 13 + (row % 2 ? 5 : 0);
      const by = y + 2 - row * 9;
      ctx.fillStyle = row % 2 ? '#b06a3a' : '#a8612f';
      ctx.fillRect(bx, by, 12, 8);
      ctx.strokeStyle = '#7d4526'; ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 12, 8);
    }
  }
}
// Chapter 15: a pile of grain to store during the seven fat years
function drawGrainPile(p) {
  const x = p.x, y = p.y;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y + 6, 18, 6, 0, 0, 6.283); ctx.fill();
  // golden mound
  ctx.fillStyle = '#d9b45a';
  ctx.beginPath();
  ctx.moveTo(x - 17, y + 4);
  ctx.quadraticCurveTo(x, y - 24, x + 17, y + 4);
  ctx.closePath();
  ctx.fill();
  // straw-coloured streaks
  ctx.strokeStyle = 'rgba(140,100,40,0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 10 + i * 4, y - 2 - i * 6);
    ctx.lineTo(x + 10 - i * 3, y - 4 - i * 6);
    ctx.stroke();
  }
  // loose grains
  ctx.fillStyle = '#e8cd82';
  ctx.beginPath(); ctx.arc(x - 14, y + 4, 1.6, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 15, y + 3, 1.6, 0, 6.283); ctx.fill();
}
function drawCityGate() {
  const g = World.cityGate;
  if (!g) return;
  const x = g.x, y = g.y;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y + 8, 44, 8, 0, 0, 6.283); ctx.fill();
  // posts
  ctx.fillStyle = '#7a5a34';
  ctx.fillRect(x - 42, y - 54, 9, 62);
  ctx.fillRect(x + 33, y - 54, 9, 62);
  // lintel with a mud-brick top
  ctx.fillStyle = '#b06a3a';
  ctx.fillRect(x - 48, y - 66, 96, 14);
  ctx.strokeStyle = '#7d4526'; ctx.lineWidth = 1;
  ctx.strokeRect(x - 48, y - 66, 96, 14);
  // sign board
  ctx.fillStyle = '#c2a05a';
  ctx.fillRect(x - 26, y - 62, 52, 9);
}
// Chapter 10: Lot's wife, turned into a pillar of salt
function drawWifePillar() {
  const p = World.wifePillar;
  if (!p) return;
  const x = p.x, y = p.y;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y + 6, 10, 4, 0, 0, 6.283); ctx.fill();
  // salt mound at the base
  ctx.fillStyle = '#d9d4c4';
  ctx.beginPath(); ctx.ellipse(x, y + 2, 10, 5, 0, 0, 6.283); ctx.fill();
  // tapering, roughly person-shaped pillar
  ctx.fillStyle = '#ece8dc';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 2);
  ctx.quadraticCurveTo(x - 6, y - 20, x - 4.5, y - 34);
  ctx.arc(x, y - 38, 5.5, Math.PI, 0, false);
  ctx.quadraticCurveTo(x + 6, y - 20, x + 8, y + 2);
  ctx.closePath();
  ctx.fill();
  // faint salt striations
  ctx.strokeStyle = 'rgba(160,150,120,0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 7 + i, y - 4 - i * 8);
    ctx.lineTo(x + 7 - i, y - 6 - i * 8);
    ctx.stroke();
  }
}
function drawPlayer() {
  // Adam and Eve keep their authored sprite sheets from the original game.
  // Phase 4 supplies the new shared pixel renderer for every other playable character.
  if (CHAPTER && CHAPTER.playable === 'adam') { drawPlayerAdam(); return; }
  if (CHAPTER && CHAPTER.playable === 'eve') { drawPlayerEve(); return; }
  PixelCharacters.drawPlayer(ctx, player, CHAPTER, time);
}
// Chapter 2 playable character: Adam (the first man)
function drawPlayerAdam() {
  const x = player.x;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, player.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  if (player.sleeping) {
    // lying in a deep sleep (Eve cutscene)
    ctx.fillStyle = '#f2d2a4';
    ctx.beginPath(); ctx.ellipse(x - 4, player.y - 3, 15, 7, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 14, player.y - 6, 6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#4e8a3a';
    ctx.beginPath(); ctx.ellipse(x - 8, player.y - 3, 7, 5, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#5a3b1e';
    ctx.beginPath(); ctx.arc(x + 14, player.y - 7, 6.4, Math.PI, 0); ctx.fill();
    return;
  }
  // walk / idle from the sprite sheet (falls back to the vector drawing)
  if (drawAdamSheet(x, player.y + 6, player.facing || 'down', player.moving)) return;
  const bob = player.moving ? Math.abs(Math.sin(time * 10)) * 2 : 0;
  const y = player.y - bob;
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  ctx.beginPath(); ctx.ellipse(x, y - 16, 8, 11, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#4e8a3a'; // leaf covering
  ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 4, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#5a3b1e';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.4, Math.PI, 0); ctx.fill();
}
// Chapter 3 playable character: Eve (the first woman)
function drawPlayerEve() {
  const x = player.x;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, player.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  // walk / idle from the sprite sheet (falls back to the vector drawing)
  if (drawEveSheet(x, player.y + 6, player.facing || 'down', player.moving)) return;
  const bob = player.moving ? Math.abs(Math.sin(time * 10)) * 2 : 0;
  const y = player.y - bob;
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  ctx.beginPath(); ctx.ellipse(x, y - 16, 8, 11, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#4e8a3a'; // leaf covering
  ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 4, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#3b2412'; // long hair
  ctx.beginPath(); ctx.arc(x, y - 31, 6.6, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - 7, y - 24, 3, 8, 0.25, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 7, y - 24, 3, 8, -0.25, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#ffb3c8'; // flower in her hair
  ctx.beginPath(); ctx.arc(x - 4, y - 35, 2.4, 0, 6.283); ctx.fill();
}
function drawAdam() {
  const x = World.adam.x, y = World.adam.y;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  // NPC Adam uses the same sprite sheet: walking while following, idle otherwise
  const walking = (World.adam.movingT || 0) > 0;
  let face = 'down';
  if (walking) {
    const ax = player.x - World.adam.x, ay = player.y - World.adam.y;
    face = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'right' : 'left') : (ay > 0 ? 'down' : 'up');
  }
  if (drawAdamSheet(x, y + 6, face, walking)) return;
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  ctx.beginPath(); ctx.ellipse(x, y - 16, 8, 11, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#4e8a3a';
  ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 4, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#5a3b1e';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.4, Math.PI, 0); ctx.fill();
}
function drawEve() {
  const x = World.eve.x, y = World.eve.y;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  // NPC Eve uses the same sprite sheet: walking while following, idle otherwise
  const walking = (World.eve.movingT || 0) > 0;
  let face = 'down';
  if (walking) {
    const ex = player.x - World.eve.x, ey = player.y - World.eve.y;
    face = Math.abs(ex) > Math.abs(ey) ? (ex > 0 ? 'right' : 'left') : (ey > 0 ? 'down' : 'up');
  }
  if (drawEveSheet(x, y + 6, face, walking)) return;
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  ctx.beginPath(); ctx.ellipse(x, y - 16, 8, 11, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#4e8a3a'; // leaf covering
  ctx.beginPath(); ctx.ellipse(x, y - 6, 6, 4, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#3b2412'; // long hair
  ctx.beginPath(); ctx.arc(x, y - 31, 6.6, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - 7, y - 24, 3, 8, 0.25, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 7, y - 24, 3, 8, -0.25, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#ffb3c8'; // flower in her hair
  ctx.beginPath(); ctx.arc(x - 4, y - 35, 2.4, 0, 6.283); ctx.fill();
}

function drawAnimal(a) {
  const walking = a.state !== 'idle';
  const bounce = walking ? Math.abs(Math.sin(time * 8 + a.phase)) * 3 : Math.sin(time * 3 + a.phase) * 1.5;
  const airLift = a.kind === 'bird' ? 16 : 0;
  const x = a.x;
  const y = a.y - bounce - airLift;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(a.x, a.y + 4, a.kind === 'elephant' ? 15 : 8, 3.5, 0, 0, 6.283);
  ctx.fill();

  if (a.kind === 'rabbit') {
    ctx.fillStyle = '#eceff4';
    ctx.beginPath(); ctx.ellipse(x, y - 7, 8, 6.5, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6, y - 13, 5, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 4, y - 21, 2, 5.5, -0.15, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 8.5, y - 21, 2, 5.5, 0.15, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(x + 8, y - 14, 1.3, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 2, y - 5, 2.6, 0, 6.283); ctx.fill();
  } else if (a.kind === 'lamb') {
    ctx.fillStyle = '#f4f1e6';
    ctx.beginPath(); ctx.ellipse(x, y - 8, 10, 7.5, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 5, y - 12, 4.5, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3, y - 13, 5, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#d9c6a3';
    ctx.beginPath(); ctx.ellipse(x + 9, y - 11, 4.5, 4, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(x + 10.5, y - 12, 1.2, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#b9a781';
    ctx.fillRect(x - 6, y - 3, 3, 6);
    ctx.fillRect(x + 3, y - 3, 3, 6);
  } else if (a.kind === 'sheep') {
    // adult sheep — and the ram of Moriah (name 'ram') with its curled horns
    const ram = a.name === 'ram';
    ctx.fillStyle = '#b9a781';                       // legs
    ctx.fillRect(x - 7, y - 4, 3, 7);
    ctx.fillRect(x + 4, y - 4, 3, 7);
    ctx.fillStyle = ram ? '#efe8d4' : '#f7f4ea';     // fluffy wool
    ctx.beginPath(); ctx.ellipse(x, y - 12, 13, 9, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 6, y - 16, 6, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 2, y - 18, 5.5, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 11, y - 10, 5, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8, y - 14, 5, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#d9c6a3';                       // head
    ctx.beginPath(); ctx.ellipse(x + 13, y - 17, 5.5, 4.5, 0.25, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#c2ab84';                       // ear
    ctx.beginPath(); ctx.ellipse(x + 9.5, y - 20, 3, 1.8, -0.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#222';                          // eye
    ctx.beginPath(); ctx.arc(x + 14.5, y - 18, 1.3, 0, 6.283); ctx.fill();
    if (ram) {                                       // curled horns
      ctx.strokeStyle = '#8a6f4a'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x + 10, y - 21, 3.6, Math.PI * 0.6, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 15, y - 15, 3.2, Math.PI * 1.3, Math.PI * 2.6); ctx.stroke();
    }
  } else if (a.kind === 'camel') {
    // long legs, one hump, a gentle head high above the rest
    ctx.fillStyle = '#c19a5b';                       // legs
    ctx.fillRect(x - 7, y - 9, 3, 11);
    ctx.fillRect(x + 4, y - 9, 3, 11);
    ctx.fillStyle = '#d8b883';                       // body + hump
    ctx.beginPath(); ctx.ellipse(x, y - 16, 12, 7, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 2, y - 20, 6, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#d8b883'; ctx.lineWidth = 5; ctx.lineCap = 'round';  // neck
    ctx.beginPath(); ctx.moveTo(x + 8, y - 18); ctx.quadraticCurveTo(x + 15, y - 24, x + 15, y - 30); ctx.stroke();
    ctx.fillStyle = '#d8b883';                       // head
    ctx.beginPath(); ctx.ellipse(x + 17, y - 31, 4.5, 3.2, 0.2, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#222';                          // eye
    ctx.beginPath(); ctx.arc(x + 18.5, y - 32, 1.2, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#c19a5b'; ctx.lineWidth = 1.6;                     // tail
    ctx.beginPath(); ctx.moveTo(x - 12, y - 18); ctx.lineTo(x - 15, y - 12); ctx.stroke();
  } else if (a.kind === 'donkey') {
    // small grey donkey with famously long ears
    ctx.fillStyle = '#9aa0a8';                       // legs
    ctx.fillRect(x - 7, y - 6, 3, 8);
    ctx.fillRect(x + 4, y - 6, 3, 8);
    ctx.fillStyle = '#b9bdc4';                       // body
    ctx.beginPath(); ctx.ellipse(x, y - 12, 11, 7, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 12, y - 19, 5, 4, 0.3, 0, 6.283); ctx.fill();  // head
    ctx.fillStyle = '#a7adb5';                       // long ears
    ctx.beginPath(); ctx.ellipse(x + 9.5, y - 26, 1.8, 4.5, -0.3, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 13, y - 26, 1.8, 4.5, 0.1, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#222';                          // eye
    ctx.beginPath(); ctx.arc(x + 13, y - 20, 1.2, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#a7adb5'; ctx.lineWidth = 1.6;                     // tail
    ctx.beginPath(); ctx.moveTo(x - 11, y - 14); ctx.lineTo(x - 14, y - 8); ctx.stroke();
  } else if (a.kind === 'elephant') {
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(x - 10, y - 6, 5, 12);
    ctx.fillRect(x + 5, y - 6, 5, 12);
    ctx.beginPath(); ctx.ellipse(x, y - 12, 15, 11, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 14, y - 16, 8, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 19, y - 12); ctx.quadraticCurveTo(x + 24, y - 4, x + 21, y + 2); ctx.stroke();
    ctx.fillStyle = '#8a939d';
    ctx.beginPath(); ctx.ellipse(x + 12, y - 17, 5, 6.5, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(x + 17, y - 18, 1.5, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#7d858f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 15, y - 14); ctx.quadraticCurveTo(x - 21, y - 10, x - 18, y - 4); ctx.stroke();
  } else if (a.kind === 'bird') {
    ctx.fillStyle = '#e8873a';
    ctx.beginPath(); ctx.ellipse(x, y, 7, 5.5, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6, y - 3, 4, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#f5c542';
    ctx.beginPath(); ctx.moveTo(x + 9, y - 3); ctx.lineTo(x + 14, y - 1.5); ctx.lineTo(x + 9, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(x + 7, y - 4, 1.2, 0, 6.283); ctx.fill();
    const wf = Math.sin(time * 12 + a.phase) * 5;
    const wingA = Math.max(0.5, 3 + wf); // radii must never go negative (browser throws IndexSizeError)
    const wingB = Math.max(0.5, 3 - wf);
    ctx.fillStyle = '#f2a35c';
    ctx.beginPath(); ctx.ellipse(x - 2, y - 4, 7, wingA, -0.5, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - 4, y + 1, 6, wingB, 0.4, 0, 6.283); ctx.fill();
  }
  // true once a body was drawn for this kind — unknown kinds show only a shadow
  return a.kind === 'rabbit' || a.kind === 'lamb' || a.kind === 'sheep' ||
         a.kind === 'camel' || a.kind === 'donkey' ||
         a.kind === 'elephant' || a.kind === 'bird';
}

// ---------- render: Chapter 4 characters & objects ----------
function drawPlayerCain() {
  const x = player.x;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, player.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  const bob = player.moving ? Math.abs(Math.sin(time * 10)) * 2 : 0;
  const y = player.y - bob;
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  ctx.fillStyle = '#a8552e'; // farmer's tunic
  ctx.beginPath(); ctx.ellipse(x, y - 12, 8.5, 9.5, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#5a3b1e';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.4, Math.PI, 0); ctx.fill();
}
function drawAbel() {
  const a = World.abel;
  if (!a) return;
  const x = a.x;
  const bob = a.following ? Math.abs(Math.sin(time * 10)) * 2 : Math.abs(Math.sin(time * 3));
  const y = a.y - bob;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, a.y + 6, 9, 4, 0, 0, 6.283); ctx.fill();
  // shepherd's staff
  ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 9, y - 30); ctx.lineTo(x + 11, y + 5); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 9, y - 33, 4, Math.PI * 0.85, Math.PI * 2.15); ctx.stroke();
  ctx.fillStyle = '#f2d2a4';
  ctx.fillRect(x - 6, y - 14, 4, 16);
  ctx.fillRect(x + 2, y - 14, 4, 16);
  ctx.fillStyle = '#e6d7b2'; // shepherd's tunic
  ctx.beginPath(); ctx.ellipse(x, y - 12, 8.5, 9.5, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#f2d2a4';
  ctx.beginPath(); ctx.arc(x, y - 30, 6, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#8a6a3a';
  ctx.beginPath(); ctx.arc(x, y - 32, 6.4, Math.PI, 0); ctx.fill();
}
function drawAltar() {
  const a = World.altar;
  if (!a) return;
  const x = a.x, y = a.y;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y + 8, 19, 6, 0, 0, 6.283); ctx.fill();
  // stacked stones
  ctx.fillStyle = '#9aa0aa'; ctx.fillRect(x - 17, y - 6, 34, 15);
  ctx.fillStyle = '#adb3bd'; ctx.fillRect(x - 12, y - 17, 24, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 17, y - 6, 34, 4);
  // offering fire
  glow(x, y - 26, 30, 'rgba(255,150,50,0.6)');
  for (let i = 0; i < 3; i++) {
    const fr = Math.max(1, 6 - i * 1.6 + Math.sin(time * 9 + i * 1.7) * 1.8);
    const fxx = x + Math.sin(time * 6 + i * 2) * 3;
    ctx.fillStyle = i === 0 ? '#ff8a2a' : (i === 1 ? '#ffb03a' : '#ffe27a');
    ctx.beginPath(); ctx.arc(fxx, y - 20 - i * 5, fr, 0, 6.283); ctx.fill();
  }
}
function drawTent() {
  const tt = World.tent;
  if (!tt) return;
  const x = tt.x, y = tt.y;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y + 8, 24, 7, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#d9c8a0';
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x - 24, y + 7);
  ctx.lineTo(x + 24, y + 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a8946a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#8a7550'; // door flap
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x - 9, y + 7);
  ctx.lineTo(x + 9, y + 7);
  ctx.closePath();
  ctx.fill();
}

// ---------- render: Chapter 3 actors (snake & gate guard) ----------
function drawSnake() {
  const s = World.snake;
  if (!s) return;
  const x = s.x, y = s.y;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y + 5, 13, 4.5, 0, 0, 6.283); ctx.fill();
  // coiled body
  ctx.strokeStyle = '#4e7d34'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(x, y, 11, 6.5, 0, 0.5, 5.7); ctx.stroke();
  ctx.strokeStyle = '#5f9a3f'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(x, y - 4, 7, 4.5, 0, 0, 6.283); ctx.stroke();
  // raised head, swaying
  const sway = Math.sin(time * 3) * 2;
  const hx = x + 12, hy = y - 14 + sway;
  ctx.fillStyle = '#5f9a3f';
  ctx.beginPath(); ctx.arc(hx, hy, 5, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(hx + 1.5, hy - 1.5, 1.2, 0, 6.283); ctx.fill();
  // flicking tongue
  if (Math.sin(time * 7) > 0.5) {
    ctx.strokeStyle = '#d33'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx + 5, hy + 1);
    ctx.lineTo(hx + 11, hy);
    ctx.moveTo(hx + 11, hy);
    ctx.lineTo(hx + 14, hy - 2);
    ctx.moveTo(hx + 11, hy);
    ctx.lineTo(hx + 14, hy + 2);
    ctx.stroke();
  }
}
// Chapter 3 finale: angels and a sword of fire guarding the entrance
function drawGateGuard() {
  const g = World.gateGuard;
  if (!g) return;
  // two glowing angels flanking the gate
  for (const side of [-1, 1]) {
    const ax = g.x + side * 24, ay = g.y - 6;
    glow(ax, ay - 8, 30, 'rgba(255,246,200,0.9)');
    const flap = Math.sin(time * 6 + side) * 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(ax - 7, ay - 12, 4, 9 + flap, -0.4, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ax + 7, ay - 12, 4, 9 + flap, 0.4, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ax, ay - 6, 5, 9, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#f0d2a8';
    ctx.beginPath(); ctx.arc(ax, ay - 18, 4.5, 0, 6.283); ctx.fill();
  }
  // sword of fire in the middle
  const fx = g.x, fy = g.y;
  glow(fx, fy - 16, 36, 'rgba(255,140,40,0.6)');
  ctx.fillStyle = '#7a4f2a';
  ctx.fillRect(fx - 7, fy + 6, 14, 5);          // crossguard
  ctx.fillRect(fx - 2, fy + 11, 4, 8);          // grip
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath();
  ctx.moveTo(fx, fy - 34);
  ctx.lineTo(fx - 5, fy - 26);
  ctx.lineTo(fx - 5, fy + 4);
  ctx.lineTo(fx + 5, fy + 4);
  ctx.lineTo(fx + 5, fy - 26);
  ctx.closePath();
  ctx.fill();
  // flickering flames along the blade
  for (let i = 0; i < 3; i++) {
    const fr = Math.max(1, 4 + Math.sin(time * 9 + i * 2.1) * 2.5);
    const fxx = fx + Math.sin(time * 5 + i * 2) * 7;
    const fyy = fy - 26 + i * 12 + Math.cos(time * 7 + i) * 3;
    ctx.fillStyle = i % 2 ? '#ff7a2a' : '#ffb03a';
    ctx.beginPath(); ctx.arc(fxx, fyy, fr, 0, 6.283); ctx.fill();
  }
}

// ---------- render: markers & labels ----------
function drawRainbow() {
  // Jehovah's rainbow arcing over the mountains where the ark rests
  const c = World.ark || { x: MAP_W * TILE / 2, y: MAP_H * TILE / 2 };
  const cx = c.x, cy = c.y + 40;
  const cols = ['rgba(255,80,80,', 'rgba(255,160,60,', 'rgba(255,230,90,',
                'rgba(90,220,120,', 'rgba(80,160,255,', 'rgba(150,90,240,'];
  const pulse = 0.5 + Math.sin(time * 1.5) * 0.08;
  ctx.save();
  ctx.lineWidth = 15;
  ctx.lineCap = 'butt';
  for (let i = 0; i < cols.length; i++) {
    ctx.strokeStyle = cols[i] + (pulse - i * 0.04) + ')';
    ctx.beginPath();
    ctx.arc(cx, cy, 370 - i * 15, Math.PI, 0);
    ctx.stroke();
  }
  ctx.restore();
}
function questTargets() {
  const id = questId();
  if (gameState === 'end') return [];
  if (chapterIdx === 5) {
    if (id === 'rain' || id === 'settle') return World.interior ? [World.interior.window] : [];
    if (id === 'exit') return World.interior ? [World.interior.door] : [];
    if (id === 'altar') return World.stonePile ? [World.stonePile] : [];
    if (id === 'offering') {
      if (World.sheep && !World.sheep.taken) return [World.sheep];
      return World.altar ? [World.altar] : [];
    }
    return [];
  }
  if (chapterIdx === 14) {
    if (id === 'pharaoh') { const p = World.family.find(m => m.name === 'Pharaoh'); return p ? [p] : []; }
    if (id === 'store') return World.grainPiles.filter(g => !g.done);
    if (id === 'bow' || id === 'cup') return World.family.filter(m => m.name === 'Brother');
    if (id === 'reveal') { const b = World.family.find(m => m.name === 'Benjamin'); return b ? [b] : []; }
    return [];
  }
  if (chapterIdx === 13) {
    if (id === 'send') { const j = World.family.find(m => m.name === 'Jacob'); return j ? [j] : []; }
    if (id === 'pit') return World.family.filter(m => m.name === 'Brother' || m.name === 'Judah');
    if (id === 'egypt') return World.journeyTarget ? [World.journeyTarget] : [];
    if (id === 'steward') { const p = World.family.find(m => m.name === 'Potiphar'); return p ? [p] : []; }
    if (id === 'refuse') { const w = World.family.find(m => m.name === 'Wife'); return w ? [w] : []; }
    return [];
  }
  if (chapterIdx === 12) {
    if (id === 'call') return [World.god];
    if (id === 'warn') return World.villagers.slice(0, 1);
    if (id === 'gift') return World.family.slice(2, 3);
    if (id === 'wrestle') return World.angels;
    if (id === 'peace') { const e = World.family.find(m => m.name === 'Esau'); return e ? [e] : []; }
    return [];
  }
  if (chapterIdx === 11) {
    if (id === 'legacy') return World.family.slice(0, 1);
    if (id === 'stew' || id === 'anger') return World.family.slice(2, 3);
    if (id === 'blessing') return World.family.slice(1, 2);
    if (id === 'flee') return World.journeyTarget ? [World.journeyTarget] : [];
    return [];
  }
  if (chapterIdx === 10) {
    if (id === 'command') return [World.god];
    if (id === 'travel') return World.journeyTarget ? [World.journeyTarget] : [];
    if (id === 'isaac') return World.isaac ? [World.isaac] : [];
    if (id === 'altar') return World.stonePile ? [World.stonePile] : [];
    if (id === 'ram') return World.ram ? [World.ram] : [];
    return [];
  }
  if (chapterIdx === 9) {
    if (id === 'choice') return World.abraham ? [World.abraham] : [];
    if (id === 'choose') return World.choiceSpot ? [World.choiceSpot] : [];
    if (id === 'warn') return World.angels.length ? World.angels : [];
    if (id === 'escape') return World.zoarSpot ? [World.zoarSpot] : [];
    if (id === 'remember') return World.family.slice(0, 1);
    return [];
  }
  if (chapterIdx === 8) {
    if (id === 'wish' || id === 'sendaway') return World.family.slice(0, 1);
    if (id === 'ishmael') return World.family.slice(1, 2);
    if (id === 'visitors') return World.visitors.length ? World.visitors : (World.visitorSpot ? [World.visitorSpot] : []);
    if (id === 'isaac') return World.tent ? [World.tent] : [];
    return [];
  }
  if (chapterIdx === 7) {
    if (id === 'call' || id === 'promise') return [World.god];
    if (id === 'pack') return World.family.filter(m => !m.packed);
    if (id === 'travel') return World.journeyTarget ? [World.journeyTarget] : [];
    if (id === 'children') return World.family.slice(0, 1);
    return [];
  }
  if (chapterIdx === 6) {
    if (id === 'plan') return [World.foreman];
    if (id === 'bricks') return World.carrying ? [World.tower] : [World.brickPile];
    if (id === 'raise') { const s = World.scaffolds.find(s => !s.done); return s ? [s] : [World.foreman]; }
    if (id === 'confusion') return [World.god];
    if (id === 'scatter') return [World.cityGate];
    return [];
  }
  if (chapterIdx === 4) {
    if (id === 'command' || id === 'warn') return id === 'command' ? [World.god] : World.villagers.filter(v => !v.warned);
    if (id === 'build') return World.buildSpots.filter(b => !b.done);
    if (id === 'animals') return World.animals.filter(a => a.state === 'idle');
    if (id === 'enter') return World.ark ? [World.ark] : [];
    return [];
  }
  if (chapterIdx === 3) {
    if (id === 'offering') return [World.altar];
    if (id === 'warning' || id === 'judgment') return [World.god];
    if (id === 'lure') return [World.abel];
    if (id === 'field') return [World.fieldSpot];
    return [];
  }
  if (chapterIdx === 2) {
    if (id === 'snake') return [World.snake];
    if (id === 'fruit') return [World.knowledgeTree];
    if (id === 'adam') return [World.adam];
    if (id === 'question' || id === 'exile') return [World.god];
    return [];
  }
  if (chapterIdx === 1) {
    if (id === 'garden' || id === 'rule' || id === 'eve' || id === 'family') return [World.god];
    if (id === 'naming') return World.animals.filter(a => !a.named);
    return [];
  }
  if (id === 'meet' || id === 'man') return [World.god];
  if (id === 'light') return [World.beacon];
  if (id === 'plants') return World.soils.filter(s => !s.planted);
  if (id === 'animals') return World.animals.filter(a => a.state === 'idle');
  return [];
}
function drawMarkers() {
  const bob = Math.sin(time * 4) * 5;
  for (const t of questTargets()) {
    const y = t.y - 48 + bob;
    ctx.save();
    ctx.fillStyle = '#ffd97a';
    ctx.shadowColor = 'rgba(255,215,100,0.95)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(t.x, y + 14);
    ctx.lineTo(t.x - 9, y);
    ctx.lineTo(t.x + 9, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function drawLabels() {
  ctx.font = '12px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const items = [
    { x: World.god.x, y: World.god.y - 58, text: 'Jehovah God' },
    { x: World.beacon.x, y: World.beacon.y - 54, text: 'Beacon of Light' }
  ];
  for (const a of World.animals) {
    if (a.state === 'idle') items.push({ x: a.x, y: a.y - 34, text: cap(a.name) });
  }
  if (World.ark && !World.interior) items.push({ x: World.ark.x, y: World.ark.y - 78, text: 'The Ark' });
  if (World.stonePile) items.push({ x: World.stonePile.x, y: World.stonePile.y - 34, text: 'Stones' });
  for (const m of World.family) items.push({ x: m.x, y: m.y - 44, text: m.name });
  for (const v of World.villagers) items.push({ x: v.x, y: v.y - 44, text: 'Villager' });
  if (World.adam) items.push({ x: World.adam.x, y: World.adam.y - 46, text: 'Adam' });
  if (World.eve) items.push({ x: World.eve.x, y: World.eve.y - 46, text: 'Eve' });
  if (World.knowledgeTree) items.push({ x: World.knowledgeTree.x, y: World.knowledgeTree.y - 56, text: 'Tree of the Knowledge' });
  if (World.snake) items.push({ x: World.snake.x, y: World.snake.y - 34, text: 'Snake' });
  if (World.gate) items.push({ x: World.gate.x, y: World.gate.y - 50, text: 'Garden Entrance' });
  if (World.altar) items.push({ x: World.altar.x, y: World.altar.y - 46, text: 'The Altar' });
  if (World.abel) items.push({ x: World.abel.x, y: World.abel.y - 46, text: 'Abel' });
  if (World.fieldSpot) items.push({ x: World.fieldSpot.x, y: World.fieldSpot.y - 52, text: 'The Field' });
  for (const it of items) {
    if (Math.hypot(it.x - player.x, it.y - player.y) > 175) continue;
    const w = ctx.measureText(it.text).width + 12;
    ctx.fillStyle = 'rgba(10,8,4,0.72)';
    roundRect(it.x - w / 2, it.y - 13, w, 17, 8);
    ctx.fill();
    ctx.fillStyle = '#f7ecd0';
    ctx.fillText(it.text, it.x, it.y);
  }
}

// ---------- render: main ----------
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  PixelRenderer.prepareContext(ctx);
  ctx.fillStyle = '#12203a';
  ctx.fillRect(0, 0, vw, vh);
  ctx.save();
  ctx.translate(Math.round(vw / 2 - cam.x), Math.round(vh / 2 - cam.y));
  try {
  const x0 = Math.max(0, Math.floor((cam.x - vw / 2) / TILE) - 1);
  const x1 = Math.min(MAP_W - 1, Math.ceil((cam.x + vw / 2) / TILE) + 1);
  const y0 = Math.max(0, Math.floor((cam.y - vh / 2) / TILE) - 1);
  const y1 = Math.min(MAP_H - 1, Math.ceil((cam.y + vh / 2) / TILE) + 1);

  if (World.interior) drawArkInterior();
  else {
    renderTiles(x0, x1, y0, y1);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        PixelObjects.drawGroundDecor(
          ctx, World.tileAt(tx, ty), tx, ty,
          tx * TILE, ty * TILE, TILE, time
        );
      }
    }
  }
  drawMarkers();
  if (World.rainbow) drawRainbow();

  // y-sorted actors
  const actors = [];
  for (const tr of World.trees) actors.push({ y: tr.y, d: () => drawTree(tr) });
  if (World.ark && !World.interior) actors.push({ y: World.ark.y, d: drawArk });
  for (const b of World.buildSpots) actors.push({ y: b.y, d: () => drawBuildSpot(b) });
  for (const h of World.huts) actors.push({ y: h.y, d: () => drawHut(h) });
  if (!World.inside) for (const a of World.animals) if (a.state !== 'inside') actors.push({ y: a.y, d: () => drawAnimal(a) });
  actors.push({ y: World.beacon.y, d: drawBeacon });
  actors.push({ y: World.god.y, d: drawGod });
  if (World.adam) actors.push({ y: World.adam.y, d: drawAdam });
  if (World.eve) actors.push({ y: World.eve.y, d: drawEve });
  if (World.snake) actors.push({ y: World.snake.y, d: drawSnake });
  if (World.gateGuard) actors.push({ y: World.gateGuard.y, d: drawGateGuard });
  if (World.altar) actors.push({ y: World.altar.y, d: drawAltar });
  if (World.stonePile) actors.push({ y: World.stonePile.y, d: () => drawStonePile(World.stonePile) });
  if (World.tower) actors.push({ y: World.tower.y, d: drawTower });
  for (const s of World.scaffolds) actors.push({ y: s.y, d: () => drawScaffold(s) });
  if (World.brickPile) actors.push({ y: World.brickPile.y, d: () => drawBrickPile(World.brickPile) });
  if (World.cityGate) actors.push({ y: World.cityGate.y, d: drawCityGate });
  if (World.foreman) actors.push({ y: World.foreman.y, d: () => drawPerson(World.foreman) });
  for (const w of World.workers) actors.push({ y: w.y, d: () => drawPerson(w) });
  for (const v of World.visitors) actors.push({ y: v.y, d: () => drawPerson(v) });
  if (World.ishmael) actors.push({ y: World.ishmael.y, d: () => drawPerson(World.ishmael) });
  if (World.isaac) actors.push({ y: World.isaac.y, d: () => drawPerson(World.isaac) });
  if (World.abraham) actors.push({ y: World.abraham.y, d: () => drawPerson(World.abraham) });
  for (const a of World.angels) actors.push({ y: a.y, d: () => drawPerson(a) });
  if (World.wifePillar) actors.push({ y: World.wifePillar.y, d: drawWifePillar });
  if (World.ram) actors.push({ y: World.ram.y, d: () => drawAnimal(World.ram) });
  for (const g of World.grainPiles) if (!g.done) actors.push({ y: g.y, d: () => drawGrainPile(g) });
  if (World.tent) actors.push({ y: World.tent.y, d: drawTent });
  if (World.abel) actors.push({ y: World.abel.y, d: drawAbel });
  if (!World.inside) {
    for (const p of World.villagers) actors.push({ y: p.y, d: () => drawPerson(p) });
    for (const m of World.family) actors.push({ y: m.y, d: () => drawPerson(m) });
    actors.push({ y: player.y, d: drawPlayer });
  }
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.d();

  // darkness until the sun's light shines
  if (!World.lit) {
    ctx.fillStyle = 'rgba(6,10,34,0.5)';
    ctx.fillRect(cam.x - vw / 2 - 4, cam.y - vh / 2 - 4, vw + 8, vh + 8);
    glow(World.beacon.x, World.beacon.y, 150, 'rgba(255,220,130,0.55)');
    glow(World.god.x, World.god.y, 120, 'rgba(255,240,200,0.5)');
    glow(player.x, player.y, 75, 'rgba(255,240,210,0.32)');
  } else {
    glow(World.beacon.x, World.beacon.y, 95 + Math.sin(time * 3) * 15, 'rgba(255,225,140,0.35)');
  }

  if (World.burning) {
    // the ruins of Sodom and Gomorrah still glow on the plain
    glow(1648, 272, 95 + Math.sin(time * 7) * 20, 'rgba(255,120,40,0.5)');
    glow(1200, 176, 70 + Math.sin(time * 6 + 2) * 16, 'rgba(255,90,30,0.45)');
  }
  drawLabels();

  // forty days and forty nights of rain (outside the ark only)
  if (World.raining && !World.interior) {
    ctx.save();
    ctx.fillStyle = 'rgba(12,20,44,0.28)';
    ctx.fillRect(cam.x - vw / 2 - 4, cam.y - vh / 2 - 4, vw + 8, vh + 8);
    ctx.strokeStyle = 'rgba(170,200,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const rw = (x1 - x0 + 1) * TILE, rh = (y1 - y0 + 1) * TILE;
    for (let i = 0; i < 140; i++) {
      const rx = x0 * TILE + ((i * 149 + time * 420) % rw);
      const ry = y0 * TILE + ((i * 83 + time * 1500) % rh);
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + 13);
    }
    ctx.stroke();
    ctx.restore();
  }
  } finally {
    ctx.restore();
  }
}

// ---------- input ----------
const MOVE_CODES = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const ACTION_CODES = ['KeyE', 'Space', 'Enter'].concat(MOVE_CODES);
const PREVENT_CODES = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

function clearKeys() { for (const k in keys) keys[k] = false; }

window.addEventListener('keydown', (e) => {
  try {
    if (PREVENT_CODES.indexOf(e.code) !== -1) e.preventDefault();
    keys[e.code] = true;
    const isAction = ACTION_CODES.indexOf(e.code) !== -1;
    // chapter select: number keys 1-9 (and 0 for chapter 10) start that chapter
    if (gameState === 'title') {
      const m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code);
      if (m && !e.repeat) {
        const n = Number(m[1]);
        const idx = n === 0 ? 9 : n - 1;   // 0 = the tenth chapter
        if (CHAPTERS[idx]) {
          initAudio();
          startSelectedChapter(idx);
        }
      }
      return;
    }
    // dialogs & cutscenes: any fresh key press advances them — never get stuck
    if (gameState === 'seq') {
      if (isAction && !e.repeat) onAction();
      return;
    }
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') onAction();
  } catch (err) { reportError(err); }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
// clicking anywhere during a dialog/cutscene advances it (except on buttons)
window.addEventListener('click', (e) => {
  try {
    if (gameState !== 'seq') return;
    if (e.target && e.target.closest && e.target.closest('button')) return;
    onAction();
  } catch (err) { reportError(err); }
});
// don't leave keys stuck down if the window loses focus
window.addEventListener('blur', clearKeys);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearKeys(); });
ui.againBtn.addEventListener('click', () => {
  try {
    sfxClick();
    initAudio(); // ensure music/sfx are ready even if this is reached without the selector
    const next = chapterIdx + 1;
    if (CHAPTERS[next]) startChapter(next);
    else window.location.reload();
  } catch (err) { reportError(err); }
});

// ---------- boot & loop ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  time += dt;
  try {
    update(dt);
    render();
  } catch (err) {
    // never let a single bad frame kill the loop — report & keep playing
    reportError(err);
  }
  requestAnimationFrame(loop);
}

resize();
setupChapter(0);
renderChapterSelect();
requestAnimationFrame(loop);






