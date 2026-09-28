'use strict';
/* ============================================================
   Audio — procedural background music + sound effects.
   Everything is synthesized with the Web Audio API: NO asset
   files are fetched, so the game still works from file://.
   ============================================================ */

let AC = null;
let masterGain = null, musicGain = null, sfxGain = null;
let inited = false;
let noiseBuf = null;
let soundOn = true;
let musicOn = true;

/* ---------- preferences (persisted) ---------- */
function pref(key, def) {
  try { const v = localStorage.getItem(key); return v === null ? def : v === '1'; } catch (e) { return def; }
}
function setPref(key, on) { try { localStorage.setItem(key, on ? '1' : '0'); } catch (e) { /* private mode */ } }
soundOn = pref('ebs_sfx', true);
musicOn = pref('ebs_music', true);

/* ---------- music: one mood per chapter ---------- */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const MOODS = [
  { bpm: 66, root: 60, density: 0.85, scale: [0, 2, 4, 7, 9],
    prog: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]],
    arp: 'triangle', pad: 'sine' },                 // Ch 1 — creation, bright
  { bpm: 58, root: 65, density: 0.8, scale: [0, 2, 4, 7, 9],
    prog: [[0, 4, 7], [7, 11, 14], [2, 5, 9], [0, 4, 7]],
    arp: 'sine', pad: 'sine' },                     // Ch 2 — Eden, warm
  { bpm: 54, root: 57, density: 0.65, scale: [0, 3, 5, 7, 10],
    prog: [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 10, 14]],
    arp: 'sine', pad: 'triangle' },                 // Ch 3 — temptation, tense
  { bpm: 50, root: 55, density: 0.5, scale: [0, 2, 3, 5, 7],
    prog: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [0, 3, 7]],
    arp: 'triangle', pad: 'sine' }                  // Ch 4 — sorrow, somber
    ,
  { bpm: 58, root: 62, density: 0.7, scale: [0, 2, 4, 7, 9],
    prog: [[0, 4, 7], [5, 9, 12], [3, 7, 10], [0, 4, 7]],
    arp: 'triangle', pad: 'sine' },                 // Ch 5 — Noah, steady hope
  { bpm: 60, root: 57, density: 0.7, scale: [0, 2, 4, 7, 9],
    prog: [[0, 7, 12], [5, 9, 12], [7, 11, 14], [0, 4, 11]],
    arp: 'sine', pad: 'triangle' }                  // Ch 6 — the Flood, then the rainbow
];
let mood = MOODS[0];
function setMusicChapter(idx) { mood = MOODS[idx] || MOODS[0]; }

/* ---------- lookahead scheduler ---------- */
let nextBeatAt = 0, beatIdx = 0, schedTimer = null;

function bump() { if (AC) nextBeatAt = Math.max(nextBeatAt, AC.currentTime + 0.08); }
function ensureScheduler() {
  if (schedTimer) return;
  schedTimer = setInterval(schedulerTick, 60);
  if (schedTimer && schedTimer.unref) schedTimer.unref();
}
function schedulerTick() {
  if (!AC || !musicOn || AC.state !== 'running') return;
  const spb = 60 / mood.bpm;
  while (nextBeatAt < AC.currentTime + 0.3) {
    playBeat(nextBeatAt, spb);
    nextBeatAt += spb;
    beatIdx++;
  }
}
function playBeat(t, spb) {
  const bar = Math.floor(beatIdx / 4);
  const beat = beatIdx % 4;
  const chord = mood.prog[bar % mood.prog.length];
  if (beat === 0) {
    // pad chord (holds the whole bar) + soft bass
    for (let i = 0; i < chord.length; i++) {
      musicNote(mtof(mood.root + chord[i]), t, spb * 3.9, mood.pad, 0.026, 1500);
    }
    musicNote(mtof(mood.root - 12 + chord[0]), t, spb * 1.7, 'sine', 0.05, 650);
  }
  // gentle arpeggio
  if (Math.random() < mood.density) {
    const n = mood.root + 12 + chord[beat % 3] + (beat === 3 ? 12 : 0);
    musicNote(mtof(n), t, spb * 0.9, mood.arp, 0.045, 2400);
  }
  // little melodic answer on the offbeat
  if (beat === 2 && Math.random() < mood.density * 0.7) {
    const s = mood.scale[Math.floor(Math.random() * mood.scale.length)];
    musicNote(mtof(mood.root + 24 + s), t + spb * 0.5, spb * 0.7, mood.arp, 0.035, 3000);
  }
}
function musicNote(freq, t, dur, type, vol, cutoff) {
  try {
    const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(musicGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch (e) { /* never let audio hiccups break the game */ }
}

/* ---------- graph setup (call from a user gesture) ---------- */
function initAudio() {
  if (inited) {
    try { if (AC && AC.state === 'suspended') AC.resume(); } catch (e) { /* ignore */ }
    bump();
    return;
  }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = AC.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(AC.destination);
    musicGain = AC.createGain();
    musicGain.gain.value = musicOn ? 0.14 : 0;
    musicGain.connect(masterGain);
    sfxGain = AC.createGain();
    sfxGain.gain.value = 0.6;
    sfxGain.connect(masterGain);
    // soft echo on the music bus
    const delay = AC.createDelay(1.0);
    delay.delayTime.value = 0.31;
    const fb = AC.createGain(); fb.gain.value = 0.3;
    const wet = AC.createGain(); wet.gain.value = 0.25;
    musicGain.connect(delay);
    delay.connect(fb); fb.connect(delay);
    delay.connect(wet); wet.connect(masterGain);
    inited = true;
    bump();
    ensureScheduler();
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}

/* ---------- SFX primitives ---------- */
function tone(freq, dur, type, vol, delay) {
  if (!AC || !soundOn || AC.state !== 'running') return;
  try {
    const t0 = AC.currentTime + (delay || 0);
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.05, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (e) { /* never let audio hiccups break the game */ }
}
function sweep(f0, f1, dur, type, vol, delay) {
  if (!AC || !soundOn || AC.state !== 'running') return;
  try {
    const t0 = AC.currentTime + (delay || 0);
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch (e) { /* ignore */ }
}
function noiseHit(dur, type, freq, vol, delay) {
  if (!AC || !soundOn || AC.state !== 'running') return;
  try {
    if (!noiseBuf) {
      const len = Math.floor(AC.sampleRate * 1.5);
      noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = AC.currentTime + (delay || 0);
    const src = AC.createBufferSource();
    src.buffer = noiseBuf;
    const f = AC.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = AC.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  } catch (e) { /* ignore */ }
}

/* ---------- sound effects ---------- */
const sfxBlip = () => tone(660, 0.05, 'triangle', 0.03);
const sfxPlant = () => { tone(420, 0.1, 'sine', 0.05); tone(640, 0.14, 'sine', 0.04, 0.08); };
const sfxComplete = () => { tone(523, 0.12, 'triangle', 0.05); tone(659, 0.12, 'triangle', 0.05, 0.1); tone(784, 0.2, 'triangle', 0.05, 0.2); };
const sfxCanon = () => { tone(392, 0.5, 'sine', 0.06); tone(523, 0.5, 'sine', 0.05, 0.1); tone(659, 0.7, 'sine', 0.05, 0.25); };
const sfxClick = () => { tone(740, 0.05, 'triangle', 0.035); tone(1100, 0.06, 'triangle', 0.03, 0.045); };
const sfxStep = () => tone(110 + Math.random() * 50, 0.05, 'sine', 0.018);
const sfxHiss = () => { noiseHit(0.45, 'bandpass', 2800, 0.1, 0); noiseHit(0.3, 'bandpass', 3400, 0.07, 0.25); };
const sfxEat = () => {
  noiseHit(0.08, 'lowpass', 1000, 0.22, 0);
  tone(170, 0.08, 'square', 0.03, 0.02);
  noiseHit(0.07, 'lowpass', 900, 0.18, 0.18);
};
const sfxOffering = () => {
  sweep(500, 90, 0.5, 'sine', 0.08);
  noiseHit(0.5, 'lowpass', 700, 0.14, 0.05);
  noiseHit(0.1, 'highpass', 2000, 0.08, 0.35);
  noiseHit(0.1, 'highpass', 2400, 0.07, 0.55);
};
const sfxDark = () => sweep(340, 55, 1.1, 'sine', 0.1);
const sfxBanish = () => { sweep(420, 70, 1.3, 'sawtooth', 0.05); sweep(220, 50, 1.5, 'sine', 0.08, 0.1); };

/* ---------- toggles ---------- */
function applyMusicGain() {
  if (musicGain && AC) {
    try { musicGain.gain.setTargetAtTime(musicOn ? 0.14 : 0, AC.currentTime, 0.15); } catch (e) { /* ignore */ }
  }
}
function updateAudioButtons() {
  const mb = document.getElementById('musicBtn');
  const sb = document.getElementById('sfxBtn');
  if (mb) {
    mb.textContent = musicOn ? '♪ Music On' : '♪ Music Off';
    if (musicOn) mb.classList.remove('off'); else mb.classList.add('off');
  }
  if (sb) {
    sb.textContent = soundOn ? '🔊 Sound On' : '🔊 Sound Off';
    if (soundOn) sb.classList.remove('off'); else sb.classList.add('off');
  }
}
function toggleMusic() {
  initAudio();
  musicOn = !musicOn;
  setPref('ebs_music', musicOn);
  if (musicOn) bump();
  applyMusicGain();
  updateAudioButtons();
  sfxClick();
}
function toggleSound() {
  initAudio();
  soundOn = !soundOn;
  setPref('ebs_sfx', soundOn);
  updateAudioButtons();
  if (soundOn) sfxClick();
}

/* ---------- wire the HUD buttons ---------- */
const _musicBtn = document.getElementById('musicBtn');
const _sfxBtn = document.getElementById('sfxBtn');
if (_musicBtn) _musicBtn.addEventListener('click', toggleMusic);
if (_sfxBtn) _sfxBtn.addEventListener('click', toggleSound);
updateAudioButtons();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && AC && AC.state === 'suspended') {
    try { AC.resume(); } catch (e) { /* ignore */ }
    bump();
  }
});

